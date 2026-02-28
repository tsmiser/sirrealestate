import * as path from 'path'
import { Duration, Stack, CfnOutput, type StackProps } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import type { Construct } from 'constructs'

const BEDROCK_MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0'

const SYSTEM_PROMPT =
  'You are SirRealtor, an expert AI real estate agent. You help users find properties by ' +
  'understanding their needs through natural conversation. You can save search profiles, ' +
  'show recent property matches, schedule viewings, and collect feedback — all via tool use. ' +
  'At the start of each conversation, call get_user_profile to see what the user already has set up, ' +
  'and call get_pending_feedback to check for any viewings needing feedback. ' +
  'Be concise, proactive, and data-driven. When the user describes what they want, save a search ' +
  'profile and ask if they want to enable daily monitoring.'

interface ChatServiceStackProps extends StackProps {
  httpApi: apigwv2.HttpApi
  userPool: cognito.UserPool
  userPoolClient: cognito.UserPoolClient
  domainName: string
  userProfileTable: dynamodb.Table
  searchResultsTable: dynamodb.Table
  notificationsTable: dynamodb.Table
  viewingsTable: dynamodb.Table
}

export class ChatServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: ChatServiceStackProps) {
    super(scope, id, props)

    const tableEnv = {
      USER_PROFILE_TABLE: props.userProfileTable.tableName,
      SEARCH_RESULTS_TABLE: props.searchResultsTable.tableName,
      NOTIFICATIONS_TABLE: props.notificationsTable.tableName,
      VIEWINGS_TABLE: props.viewingsTable.tableName,
    }

    const bundlingOptions = { externalModules: [] as string[] }

    // Chat Lambda
    const chatLambda = new NodejsFunction(this, 'ChatLambda', {
      entry: path.join(__dirname, '../../chat-service/src/handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(60),
      environment: {
        BEDROCK_MODEL_ID,
        SYSTEM_PROMPT,
        ...tableEnv,
      },
      bundling: bundlingOptions,
    })

    // Bedrock Converse permission
    chatLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel', 'bedrock:Converse'],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/${BEDROCK_MODEL_ID}`,
        ],
      }),
    )

    // DynamoDB permissions for chat lambda
    props.userProfileTable.grantReadWriteData(chatLambda)
    props.searchResultsTable.grantReadData(chatLambda)
    props.notificationsTable.grantWriteData(chatLambda)
    props.viewingsTable.grantReadWriteData(chatLambda)

    // SES permission for schedule_viewing tool
    chatLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail'],
        resources: [
          `arn:aws:ses:${this.region}:${this.account}:identity/${props.domainName}`,
        ],
      }),
    )

    // Data Lambda (sidebar REST API)
    const dataLambda = new NodejsFunction(this, 'DataLambda', {
      entry: path.join(__dirname, '../../chat-service/src/data-handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(15),
      environment: tableEnv,
      bundling: bundlingOptions,
    })

    props.userProfileTable.grantReadData(dataLambda)
    props.searchResultsTable.grantReadData(dataLambda)
    props.viewingsTable.grantReadData(dataLambda)

    const cognitoAuthorizer = new HttpJwtAuthorizer(
      'CognitoAuthorizer',
      `https://cognito-idp.${this.region}.amazonaws.com/${props.userPool.userPoolId}`,
      {
        jwtAudience: [props.userPoolClient.userPoolClientId],
      },
    )

    const chatIntegration = new HttpLambdaIntegration('ChatIntegration', chatLambda)
    const dataIntegration = new HttpLambdaIntegration('DataIntegration', dataLambda)

    // Create routes as children of this stack (avoids cyclic cross-stack reference)
    new apigwv2.HttpRoute(this, 'ChatRoute', {
      httpApi: props.httpApi,
      routeKey: apigwv2.HttpRouteKey.with('/chat', apigwv2.HttpMethod.POST),
      integration: chatIntegration,
      authorizer: cognitoAuthorizer,
    })

    new apigwv2.HttpRoute(this, 'ProfileRoute', {
      httpApi: props.httpApi,
      routeKey: apigwv2.HttpRouteKey.with('/profile', apigwv2.HttpMethod.GET),
      integration: dataIntegration,
      authorizer: cognitoAuthorizer,
    })

    new apigwv2.HttpRoute(this, 'SearchResultsRoute', {
      httpApi: props.httpApi,
      routeKey: apigwv2.HttpRouteKey.with('/search-results', apigwv2.HttpMethod.GET),
      integration: dataIntegration,
      authorizer: cognitoAuthorizer,
    })

    new apigwv2.HttpRoute(this, 'ViewingsRoute', {
      httpApi: props.httpApi,
      routeKey: apigwv2.HttpRouteKey.with('/viewings', apigwv2.HttpMethod.GET),
      integration: dataIntegration,
      authorizer: cognitoAuthorizer,
    })

    new CfnOutput(this, 'BedrockModelId', {
      value: BEDROCK_MODEL_ID,
      description: 'Bedrock model used by the chat Lambda',
    })
  }
}

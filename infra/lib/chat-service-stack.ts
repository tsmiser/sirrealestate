import * as path from 'path'
import { Duration, Stack, CfnOutput, type StackProps } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations'
import { HttpJwtAuthorizer } from '@aws-cdk/aws-apigatewayv2-authorizers'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import type { Construct } from 'constructs'

const BEDROCK_MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0'

const SYSTEM_PROMPT =
  'You are SirRealtor, an expert real estate assistant. Help users find properties, ' +
  'understand market conditions, evaluate neighborhoods, and navigate the buying and ' +
  'selling process. Be concise, helpful, and data-driven.'

interface ChatServiceStackProps extends StackProps {
  httpApi: apigwv2.HttpApi
  userPool: cognito.UserPool
  userPoolClient: cognito.UserPoolClient
  domainName: string
}

export class ChatServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: ChatServiceStackProps) {
    super(scope, id, props)

    const chatLambda = new NodejsFunction(this, 'ChatLambda', {
      entry: path.join(__dirname, '../../chat-service/src/handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      environment: {
        BEDROCK_MODEL_ID,
        SYSTEM_PROMPT,
      },
      bundling: {
        // Bundle all deps including AWS SDK v3 (not available in Lambda runtime layer)
        externalModules: [],
      },
    })

    // Grant bedrock:InvokeModel for the specific model
    chatLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/${BEDROCK_MODEL_ID}`,
        ],
      }),
    )

    const cognitoAuthorizer = new HttpJwtAuthorizer(
      'CognitoAuthorizer',
      `https://cognito-idp.${this.region}.amazonaws.com/${props.userPool.userPoolId}`,
      {
        jwtAudience: [props.userPoolClient.userPoolClientId],
      },
    )

    const chatIntegration = new HttpLambdaIntegration('ChatIntegration', chatLambda)

    props.httpApi.addRoutes({
      path: '/chat',
      methods: [apigwv2.HttpMethod.POST],
      integration: chatIntegration,
      authorizer: cognitoAuthorizer,
    })

    new CfnOutput(this, 'BedrockModelId', {
      value: BEDROCK_MODEL_ID,
      description: 'Bedrock model used by the chat Lambda',
    })
  }
}

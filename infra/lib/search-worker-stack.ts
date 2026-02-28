import * as path from 'path'
import { Duration, Stack, type StackProps } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as scheduler from 'aws-cdk-lib/aws-scheduler'
import * as iam_scheduler from 'aws-cdk-lib/aws-iam'
import type { Construct } from 'constructs'

interface SearchWorkerStackProps extends StackProps {
  userProfileTable: dynamodb.Table
  searchResultsTable: dynamodb.Table
  notificationsTable: dynamodb.Table
  viewingsTable: dynamodb.Table
  domainName: string
}

export class SearchWorkerStack extends Stack {
  constructor(scope: Construct, id: string, props: SearchWorkerStackProps) {
    super(scope, id, props)

    // Rentcast API key stored in Secrets Manager
    const rentcastSecret = new secretsmanager.Secret(this, 'RentcastApiKey', {
      secretName: 'SirRealtor/RentcastApiKey',
      description: 'Rentcast MLS API key for the search worker Lambda',
    })

    const searchWorkerLambda = new NodejsFunction(this, 'SearchWorkerLambda', {
      entry: path.join(__dirname, '../../chat-service/src/search-worker.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.minutes(10),
      environment: {
        USER_PROFILE_TABLE: props.userProfileTable.tableName,
        SEARCH_RESULTS_TABLE: props.searchResultsTable.tableName,
        NOTIFICATIONS_TABLE: props.notificationsTable.tableName,
        VIEWINGS_TABLE: props.viewingsTable.tableName,
        RENTCAST_SECRET_ARN: rentcastSecret.secretArn,
      },
      bundling: { externalModules: [] },
    })

    // DynamoDB permissions
    props.userProfileTable.grantReadData(searchWorkerLambda)
    props.searchResultsTable.grantReadWriteData(searchWorkerLambda)
    props.notificationsTable.grantWriteData(searchWorkerLambda)
    props.viewingsTable.grantReadWriteData(searchWorkerLambda)

    // Secrets Manager permission
    rentcastSecret.grantRead(searchWorkerLambda)

    // SES permission to send from sirrealtor.com
    searchWorkerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail'],
        resources: [
          `arn:aws:ses:${this.region}:${this.account}:identity/${props.domainName}`,
        ],
      }),
    )

    // EventBridge Scheduler role
    const schedulerRole = new iam_scheduler.Role(this, 'SearchWorkerSchedulerRole', {
      assumedBy: new iam_scheduler.ServicePrincipal('scheduler.amazonaws.com'),
    })
    searchWorkerLambda.grantInvoke(schedulerRole)

    // Daily schedule: 8:00 AM UTC
    new scheduler.CfnSchedule(this, 'DailySearchSchedule', {
      name: 'SirRealtor-DailySearch',
      scheduleExpression: 'cron(0 8 * * ? *)',
      scheduleExpressionTimezone: 'UTC',
      flexibleTimeWindow: { mode: 'OFF' },
      target: {
        arn: searchWorkerLambda.functionArn,
        roleArn: schedulerRole.roleArn,
      },
    })
  }
}

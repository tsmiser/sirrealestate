import { Stack, RemovalPolicy, CfnOutput, type StackProps } from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import type { Construct } from 'constructs'

export class DataStack extends Stack {
  readonly userProfileTable: dynamodb.Table
  readonly searchResultsTable: dynamodb.Table
  readonly notificationsTable: dynamodb.Table
  readonly viewingsTable: dynamodb.Table

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    this.userProfileTable = new dynamodb.Table(this, 'UserProfileTable', {
      tableName: 'SirRealtor-UserProfile',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    })
    this.userProfileTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    this.searchResultsTable = new dynamodb.Table(this, 'SearchResultsTable', {
      tableName: 'SirRealtor-SearchResults',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'profileIdListingId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    })
    this.searchResultsTable.addGlobalSecondaryIndex({
      indexName: 'userId-matchedAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'matchedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    this.notificationsTable = new dynamodb.Table(this, 'NotificationsTable', {
      tableName: 'SirRealtor-Notifications',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'notificationId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    })

    this.viewingsTable = new dynamodb.Table(this, 'ViewingsTable', {
      tableName: 'SirRealtor-Viewings',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'viewingId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    })
    this.viewingsTable.addGlobalSecondaryIndex({
      indexName: 'userId-status-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    new CfnOutput(this, 'UserProfileTableName', { value: this.userProfileTable.tableName })
    new CfnOutput(this, 'SearchResultsTableName', { value: this.searchResultsTable.tableName })
    new CfnOutput(this, 'NotificationsTableName', { value: this.notificationsTable.tableName })
    new CfnOutput(this, 'ViewingsTableName', { value: this.viewingsTable.tableName })
  }
}

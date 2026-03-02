import { Stack, RemovalPolicy, CfnOutput, type StackProps } from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as s3 from 'aws-cdk-lib/aws-s3'
import type { Construct } from 'constructs'

export class DataStack extends Stack {
  readonly userProfileTable: dynamodb.Table
  readonly searchResultsTable: dynamodb.Table
  readonly notificationsTable: dynamodb.Table
  readonly viewingsTable: dynamodb.Table
  readonly documentBucket: s3.Bucket
  readonly documentsTable: dynamodb.Table

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

    this.documentBucket = new s3.Bucket(this, 'DocumentBucket', {
      bucketName: `sirrealtor-documents-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ['https://app.sirrealtor.com', 'http://localhost:5173'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    })

    this.documentsTable = new dynamodb.Table(this, 'DocumentsTable', {
      tableName: 'SirRealtor-Documents',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'documentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    })

    new CfnOutput(this, 'UserProfileTableName', { value: this.userProfileTable.tableName })
    new CfnOutput(this, 'SearchResultsTableName', { value: this.searchResultsTable.tableName })
    new CfnOutput(this, 'NotificationsTableName', { value: this.notificationsTable.tableName })
    new CfnOutput(this, 'ViewingsTableName', { value: this.viewingsTable.tableName })
    new CfnOutput(this, 'DocumentBucketName', { value: this.documentBucket.bucketName })
    new CfnOutput(this, 'DocumentsTableName', { value: this.documentsTable.tableName })
  }
}

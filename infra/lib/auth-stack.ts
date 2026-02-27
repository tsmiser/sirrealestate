import { Stack, RemovalPolicy, CfnOutput, type StackProps } from 'aws-cdk-lib'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import type { Construct } from 'constructs'

interface AuthStackProps extends StackProps {
  domainName: string
}

export class AuthStack extends Stack {
  readonly userPool: cognito.UserPool
  readonly userPoolClient: cognito.UserPoolClient

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props)

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      // Email is the only identifier — no separate username field exposed to users.
      signInAliases: { email: true },
      autoVerify: { email: true },
      // Case-insensitive sign-in: user@example.com == User@Example.COM.
      // This is immutable after pool creation — cannot be changed without replacement.
      signInCaseSensitive: false,
      // Switch to UserPoolEmail.withSES() when approaching real user volume.
      // Default Cognito email sending limit is 50/day — inadequate for production.
      removalPolicy: RemovalPolicy.RETAIN,
    })

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      // generateSecret must be false — browser clients cannot keep secrets.
      generateSecret: false,
      authFlows: {
        userSrp: true,
      },
      oAuth: {
        callbackUrls: [
          `https://${props.domainName}`,
          'http://localhost:5173',
        ],
        logoutUrls: [
          `https://${props.domainName}`,
          'http://localhost:5173',
        ],
      },
    })

    new CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'VITE_COGNITO_USER_POOL_ID',
    })

    new CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'VITE_COGNITO_USER_POOL_CLIENT_ID',
    })

    new CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region — same as VITE_COGNITO_USER_POOL_ID prefix',
    })
  }
}

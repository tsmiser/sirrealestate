import { Stack, CfnOutput, type StackProps } from 'aws-cdk-lib'
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2'
import type { Construct } from 'constructs'

interface ApiStackProps extends StackProps {
  domainName: string
}

export class ApiStack extends Stack {
  readonly httpApi: apigwv2.HttpApi

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)

    // HTTP API v2 — cheaper and simpler than REST API.
    // Routes are added in future service stacks.
    this.httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      apiName: 'sirrealtor-api',
      corsPreflight: {
        allowOrigins: [
          `https://${props.domainName}`,
          'http://localhost:5173',
        ],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    })

    new CfnOutput(this, 'ApiEndpoint', {
      value: this.httpApi.apiEndpoint,
      description: 'VITE_API_URL',
    })
  }
}

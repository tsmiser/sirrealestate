import { Stack, CfnOutput, type StackProps } from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import type { IPublicHostedZone } from 'aws-cdk-lib/aws-route53'
import type { Construct } from 'constructs'

interface CertStackProps extends StackProps {
  appDomain: string
  apiDomain: string
  appHostedZone: IPublicHostedZone
  apiHostedZone: IPublicHostedZone
}

export class CertStack extends Stack {
  readonly appCertificate: acm.ICertificate
  readonly apiCertificate: acm.ICertificate

  constructor(scope: Construct, id: string, props: CertStackProps) {
    // crossRegionReferences required: this stack deploys to us-east-1
    // while other stacks may target a different primary region.
    super(scope, id, { ...props, crossRegionReferences: true })

    // CloudFront requires ACM certs in us-east-1.
    this.appCertificate = new acm.Certificate(this, 'AppCertificate', {
      domainName: props.appDomain,
      validation: acm.CertificateValidation.fromDns(props.appHostedZone),
    })

    // API Gateway HTTP API uses a regional cert (same region as the API).
    this.apiCertificate = new acm.Certificate(this, 'ApiCertificate', {
      domainName: props.apiDomain,
      validation: acm.CertificateValidation.fromDns(props.apiHostedZone),
    })

    new CfnOutput(this, 'AppCertificateArn', {
      value: this.appCertificate.certificateArn,
      description: 'ACM certificate ARN for CloudFront (us-east-1)',
    })

    new CfnOutput(this, 'ApiCertificateArn', {
      value: this.apiCertificate.certificateArn,
      description: 'ACM certificate ARN for API Gateway custom domain',
    })
  }
}

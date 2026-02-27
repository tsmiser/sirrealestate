import { Stack, CfnOutput, type StackProps } from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import type { IPublicHostedZone } from 'aws-cdk-lib/aws-route53'
import type { Construct } from 'constructs'

interface CertStackProps extends StackProps {
  domainName: string
  hostedZone: IPublicHostedZone
}

export class CertStack extends Stack {
  readonly certificate: acm.ICertificate

  constructor(scope: Construct, id: string, props: CertStackProps) {
    // crossRegionReferences required: this stack deploys to us-east-1
    // while other stacks may target a different primary region.
    super(scope, id, { ...props, crossRegionReferences: true })

    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: props.domainName,
      subjectAlternativeNames: [`www.${props.domainName}`],
      validation: acm.CertificateValidation.fromDns(props.hostedZone),
    })

    new CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      description: 'ACM certificate ARN (us-east-1) for CloudFront',
    })
  }
}

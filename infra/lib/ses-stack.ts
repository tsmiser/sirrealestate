import { Stack, CfnOutput, type StackProps } from 'aws-cdk-lib'
import * as ses from 'aws-cdk-lib/aws-ses'
import * as route53 from 'aws-cdk-lib/aws-route53'
import type { Construct } from 'constructs'

interface SesStackProps extends StackProps {
  domainName: string          // sirrealtor.com
  hostedZone: route53.IPublicHostedZone  // app.sirrealtor.com zone (used to add DKIM records)
}

export class SesStack extends Stack {
  constructor(scope: Construct, id: string, props: SesStackProps) {
    super(scope, id, props)

    // SES domain identity with DKIM auto-signing
    const emailIdentity = new ses.EmailIdentity(this, 'DomainIdentity', {
      identity: ses.Identity.publicHostedZone(props.hostedZone),
      dkimSigning: true,
      mailFromDomain: `mail.${props.domainName}`,
    })

    new CfnOutput(this, 'SesIdentityArn', {
      value: emailIdentity.emailIdentityArn,
      description: 'SES email identity ARN for sirrealtor.com',
    })

    new CfnOutput(this, 'SesFromAddress', {
      value: `noreply@${props.domainName}`,
      description: 'SES from address',
    })
  }
}

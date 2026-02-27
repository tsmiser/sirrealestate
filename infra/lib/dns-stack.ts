import { Stack, Fn, CfnOutput, type StackProps } from 'aws-cdk-lib'
import * as route53 from 'aws-cdk-lib/aws-route53'
import type { Construct } from 'constructs'

interface DnsStackProps extends StackProps {
  appDomain: string
  apiDomain: string
}

export class DnsStack extends Stack {
  readonly appHostedZone: route53.IPublicHostedZone
  readonly apiHostedZone: route53.IPublicHostedZone

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props)

    this.appHostedZone = new route53.PublicHostedZone(this, 'AppHostedZone', {
      zoneName: props.appDomain,
    })

    this.apiHostedZone = new route53.PublicHostedZone(this, 'ApiHostedZone', {
      zoneName: props.apiDomain,
    })

    new CfnOutput(this, 'AppNameServers', {
      value: Fn.join(', ', (this.appHostedZone as route53.PublicHostedZone).hostedZoneNameServers ?? []),
      description: `MANUAL STEP: add NS delegation record for ${props.appDomain} in parent account`,
    })

    new CfnOutput(this, 'ApiNameServers', {
      value: Fn.join(', ', (this.apiHostedZone as route53.PublicHostedZone).hostedZoneNameServers ?? []),
      description: `MANUAL STEP: add NS delegation record for ${props.apiDomain} in parent account`,
    })

    new CfnOutput(this, 'AppHostedZoneId', {
      value: this.appHostedZone.hostedZoneId,
    })

    new CfnOutput(this, 'ApiHostedZoneId', {
      value: this.apiHostedZone.hostedZoneId,
    })
  }
}

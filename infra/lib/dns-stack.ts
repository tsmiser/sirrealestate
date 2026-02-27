import { Stack, Fn, CfnOutput, type StackProps } from 'aws-cdk-lib'
import * as route53 from 'aws-cdk-lib/aws-route53'
import type { Construct } from 'constructs'

interface DnsStackProps extends StackProps {
  domainName: string
}

export class DnsStack extends Stack {
  readonly hostedZone: route53.IPublicHostedZone

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props)

    this.hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: props.domainName,
    })

    new CfnOutput(this, 'NameServers', {
      value: Fn.join(', ', (this.hostedZone as route53.PublicHostedZone).hostedZoneNameServers ?? []),
      description:
        'MANUAL STEP: copy these into parent account domain registration ' +
        `(Route53 > Registered Domains > ${props.domainName} > Edit name servers)`,
    })

    new CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
    })
  }
}

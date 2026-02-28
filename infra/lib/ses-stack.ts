import { Stack, CfnOutput, type StackProps } from 'aws-cdk-lib'
import * as ses from 'aws-cdk-lib/aws-ses'
import type { Construct } from 'constructs'

interface SesStackProps extends StackProps {
  domainName: string  // sirrealtor.com — hosted zone is in the parent account
}

export class SesStack extends Stack {
  constructor(scope: Construct, id: string, props: SesStackProps) {
    super(scope, id, props)

    // Verify sirrealtor.com as an SES domain identity.
    // The DKIM CNAME records must be added manually to the sirrealtor.com
    // hosted zone in the parent account (see CfnOutputs below).
    const emailIdentity = new ses.EmailIdentity(this, 'DomainIdentity', {
      identity: ses.Identity.domain(props.domainName),
      dkimSigning: true,
    })

    new CfnOutput(this, 'SesIdentityArn', {
      value: emailIdentity.emailIdentityArn,
      description: 'SES email identity ARN for sirrealtor.com',
    })

    new CfnOutput(this, 'SesFromAddress', {
      value: `noreply@${props.domainName}`,
      description: 'SES from address used by Lambda functions',
    })

    new CfnOutput(this, 'DkimRecord1Name', {
      value: emailIdentity.dkimRecords[0].name,
      description: 'MANUAL: Add CNAME record 1 to sirrealtor.com hosted zone in parent account',
    })
    new CfnOutput(this, 'DkimRecord1Value', {
      value: emailIdentity.dkimRecords[0].value,
    })
    new CfnOutput(this, 'DkimRecord2Name', {
      value: emailIdentity.dkimRecords[1].name,
    })
    new CfnOutput(this, 'DkimRecord2Value', {
      value: emailIdentity.dkimRecords[1].value,
    })
    new CfnOutput(this, 'DkimRecord3Name', {
      value: emailIdentity.dkimRecords[2].name,
    })
    new CfnOutput(this, 'DkimRecord3Value', {
      value: emailIdentity.dkimRecords[2].value,
    })
  }
}

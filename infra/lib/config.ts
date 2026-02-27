import type { App } from 'aws-cdk-lib'

export interface SirRealtorConfig {
  prodAccount: string
  prodRegion: string
  certRegion: string
  domainName: string
}

export function getConfig(app: App): SirRealtorConfig {
  const prodAccount = app.node.tryGetContext('prodAccount') as string | undefined
  const prodRegion = app.node.tryGetContext('prodRegion') as string | undefined
  const certRegion = app.node.tryGetContext('certRegion') as string | undefined
  const domainName = app.node.tryGetContext('domainName') as string | undefined

  if (!prodAccount || prodAccount === 'REPLACE_WITH_PROD_ACCOUNT_ID') {
    throw new Error('cdk.json: "prodAccount" must be set to your AWS account ID')
  }
  if (!prodRegion) throw new Error('cdk.json: "prodRegion" is required')
  if (!certRegion) throw new Error('cdk.json: "certRegion" is required')
  if (!domainName) throw new Error('cdk.json: "domainName" is required')

  return { prodAccount, prodRegion, certRegion, domainName }
}

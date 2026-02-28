#!/usr/bin/env node
import 'source-map-support/register'
import { App } from 'aws-cdk-lib'
import { getConfig } from '../lib/config'
import { DnsStack } from '../lib/dns-stack'
import { CertStack } from '../lib/cert-stack'
import { UiStack } from '../lib/ui-stack'
import { AuthStack } from '../lib/auth-stack'
import { ApiStack } from '../lib/api-stack'
import { DataStack } from '../lib/data-stack'
import { SesStack } from '../lib/ses-stack'
import { ChatServiceStack } from '../lib/chat-service-stack'
import { SearchWorkerStack } from '../lib/search-worker-stack'

const app = new App()
const config = getConfig(app)

const prodEnv = { account: config.prodAccount, region: config.prodRegion }
const certEnv = { account: config.prodAccount, region: config.certRegion }

const dnsStack = new DnsStack(app, 'SirRealtor-Dns', {
  env: prodEnv,
  appDomain: config.appDomain,
  apiDomain: config.apiDomain,
  crossRegionReferences: true,
})

// CertStack must deploy to us-east-1 — required by CloudFront.
// DNS delegation for both subdomains must exist before deploying.
const certStack = new CertStack(app, 'SirRealtor-Cert', {
  env: certEnv,
  appDomain: config.appDomain,
  apiDomain: config.apiDomain,
  appHostedZone: dnsStack.appHostedZone,
  apiHostedZone: dnsStack.apiHostedZone,
  crossRegionReferences: true,
})
certStack.addDependency(dnsStack)

const uiStack = new UiStack(app, 'SirRealtor-Ui', {
  env: prodEnv,
  appDomain: config.appDomain,
  certificate: certStack.appCertificate,
  hostedZone: dnsStack.appHostedZone,
})
uiStack.addDependency(certStack)

const authStack = new AuthStack(app, 'SirRealtor-Auth', {
  env: prodEnv,
  appDomain: config.appDomain,
})
authStack.addDependency(dnsStack)

const apiStack = new ApiStack(app, 'SirRealtor-Api', {
  env: prodEnv,
  appDomain: config.appDomain,
  apiDomain: config.apiDomain,
  certificate: certStack.apiCertificate,
  hostedZone: dnsStack.apiHostedZone,
})
apiStack.addDependency(certStack)

// DynamoDB tables — deploy before Chat and SearchWorker stacks
const dataStack = new DataStack(app, 'SirRealtor-Data', { env: prodEnv })

// SES domain identity — uses app hosted zone for DKIM DNS records
const sesStack = new SesStack(app, 'SirRealtor-Ses', {
  env: prodEnv,
  domainName: config.baseDomain,
  hostedZone: dnsStack.appHostedZone,
})
sesStack.addDependency(dnsStack)

const chatServiceStack = new ChatServiceStack(app, 'SirRealtor-Chat', {
  env: prodEnv,
  httpApi: apiStack.httpApi,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  domainName: config.baseDomain,
  userProfileTable: dataStack.userProfileTable,
  searchResultsTable: dataStack.searchResultsTable,
  notificationsTable: dataStack.notificationsTable,
  viewingsTable: dataStack.viewingsTable,
})
chatServiceStack.addDependency(apiStack)
chatServiceStack.addDependency(authStack)
chatServiceStack.addDependency(dataStack)
chatServiceStack.addDependency(sesStack)

const searchWorkerStack = new SearchWorkerStack(app, 'SirRealtor-SearchWorker', {
  env: prodEnv,
  userProfileTable: dataStack.userProfileTable,
  searchResultsTable: dataStack.searchResultsTable,
  notificationsTable: dataStack.notificationsTable,
  viewingsTable: dataStack.viewingsTable,
  domainName: config.baseDomain,
})
searchWorkerStack.addDependency(dataStack)
searchWorkerStack.addDependency(sesStack)

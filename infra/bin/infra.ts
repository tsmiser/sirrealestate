#!/usr/bin/env node
import 'source-map-support/register'
import { App } from 'aws-cdk-lib'
import { getConfig } from '../lib/config'
import { DnsStack } from '../lib/dns-stack'
import { CertStack } from '../lib/cert-stack'
import { UiStack } from '../lib/ui-stack'
import { AuthStack } from '../lib/auth-stack'
import { ApiStack } from '../lib/api-stack'
import { ChatServiceStack } from '../lib/chat-service-stack'

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

const chatServiceStack = new ChatServiceStack(app, 'SirRealtor-Chat', {
  env: prodEnv,
  httpApi: apiStack.httpApi,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  domainName: config.appDomain,
})
chatServiceStack.addDependency(apiStack)
chatServiceStack.addDependency(authStack)

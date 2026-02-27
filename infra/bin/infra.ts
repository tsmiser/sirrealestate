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
  domainName: config.domainName,
  crossRegionReferences: true,
})

// CertStack must deploy to us-east-1 — required by CloudFront.
const certStack = new CertStack(app, 'SirRealtor-Cert', {
  env: certEnv,
  domainName: config.domainName,
  hostedZone: dnsStack.hostedZone,
  crossRegionReferences: true,
})
certStack.addDependency(dnsStack)

const uiStack = new UiStack(app, 'SirRealtor-Ui', {
  env: prodEnv,
  domainName: config.domainName,
  certificate: certStack.certificate,
  hostedZone: dnsStack.hostedZone,
})
uiStack.addDependency(certStack)

const authStack = new AuthStack(app, 'SirRealtor-Auth', {
  env: prodEnv,
  domainName: config.domainName,
})

const apiStack = new ApiStack(app, 'SirRealtor-Api', {
  env: prodEnv,
  domainName: config.domainName,
})

// Auth and API are independent — no mutual dependency.
// Both depend on DNS being up so CORS/callback URLs resolve.
authStack.addDependency(dnsStack)
apiStack.addDependency(dnsStack)

const chatServiceStack = new ChatServiceStack(app, 'SirRealtor-Chat', {
  env: prodEnv,
  httpApi: apiStack.httpApi,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  domainName: config.domainName,
})
chatServiceStack.addDependency(apiStack)
chatServiceStack.addDependency(authStack)

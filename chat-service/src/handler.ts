import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'

// TODO: swap to InvokeAgentCommand when Bedrock Agent is configured in CDK

const bedrock = new BedrockRuntimeClient({})

export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> {
  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing request body' }) }
  }

  let message: string
  let sessionId: string | undefined
  try {
    const parsed = JSON.parse(event.body) as { message?: string; sessionId?: string }
    if (!parsed.message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing message field' }) }
    }
    message = parsed.message
    sessionId = parsed.sessionId
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const userId = event.requestContext.authorizer.jwt.claims['sub'] as string
  const resolvedSessionId = sessionId ?? userId

  const requestBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1024,
    system: process.env.SYSTEM_PROMPT,
    messages: [{ role: 'user', content: message }],
  }

  try {
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    })

    const response = await bedrock.send(command)
    const responseBody = JSON.parse(Buffer.from(response.body).toString('utf-8')) as {
      content: Array<{ text: string }>
    }
    const reply = responseBody.content[0].text

    return {
      statusCode: 200,
      body: JSON.stringify({ reply, sessionId: resolvedSessionId }),
    }
  } catch (err) {
    console.error('Bedrock invocation failed', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to invoke model' }) }
  }
}

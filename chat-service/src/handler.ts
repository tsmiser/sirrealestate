import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'
import type { Message, ContentBlock } from '@aws-sdk/client-bedrock-runtime'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import * as GetUserProfile from './tools/get-user-profile'
import * as UpsertSearchProfile from './tools/upsert-search-profile'
import * as GetSearchResults from './tools/get-search-results'
import * as ScheduleViewing from './tools/schedule-viewing'
import * as GetPendingFeedback from './tools/get-pending-feedback'
import * as SaveViewingFeedback from './tools/save-viewing-feedback'
import type { ConversationMessage } from './types'

const bedrock = new BedrockRuntimeClient({})

// Bedrock Converse SDK Tool type uses a union with $unknown; cast via unknown
const TOOLS = [
  { toolSpec: GetUserProfile.definition },
  { toolSpec: UpsertSearchProfile.definition },
  { toolSpec: GetSearchResults.definition },
  { toolSpec: ScheduleViewing.definition },
  { toolSpec: GetPendingFeedback.definition },
  { toolSpec: SaveViewingFeedback.definition },
] as unknown as import('@aws-sdk/client-bedrock-runtime').Tool[]

async function executeTool(
  name: string,
  input: unknown,
  userId: string,
  userEmail: string,
): Promise<unknown> {
  switch (name) {
    case 'get_user_profile':
      return GetUserProfile.execute(userId)
    case 'upsert_search_profile':
      return UpsertSearchProfile.execute(userId, input as Parameters<typeof UpsertSearchProfile.execute>[1])
    case 'get_search_results':
      return GetSearchResults.execute(userId, input as Parameters<typeof GetSearchResults.execute>[1])
    case 'schedule_viewing':
      return ScheduleViewing.execute(userId, input as Parameters<typeof ScheduleViewing.execute>[1], userEmail)
    case 'get_pending_feedback':
      return GetPendingFeedback.execute(userId)
    case 'save_viewing_feedback':
      return SaveViewingFeedback.execute(userId, input as Parameters<typeof SaveViewingFeedback.execute>[1])
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> {
  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing request body' }) }
  }

  let messages: ConversationMessage[]
  let sessionId: string | undefined
  try {
    const parsed = JSON.parse(event.body) as {
      messages?: ConversationMessage[]
      sessionId?: string
    }
    if (!parsed.messages || parsed.messages.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing messages field' }) }
    }
    messages = parsed.messages
    sessionId = parsed.sessionId
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const claims = event.requestContext.authorizer.jwt.claims
  const userId = claims['sub'] as string
  const userEmail = (claims['email'] as string | undefined) ?? ''
  const resolvedSessionId = sessionId ?? userId

  // Tool use loop
  const conversationMessages: Message[] = messages.map((m) => ({
    role: m.role,
    content: m.content as ContentBlock[],
  }))

  try {
    let reply = ''
    let hasToolUse = false
    const MAX_TOOL_ROUNDS = 10

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await bedrock.send(
        new ConverseCommand({
          modelId: process.env.BEDROCK_MODEL_ID!,
          system: [{ text: process.env.SYSTEM_PROMPT! }],
          messages: conversationMessages,
          toolConfig: { tools: TOOLS },
          inferenceConfig: { maxTokens: 1024 },
        }),
      )

      const assistantMessage = response.output?.message
      if (!assistantMessage) break

      conversationMessages.push(assistantMessage)

      if (response.stopReason === 'end_turn') {
        const textBlock = assistantMessage.content?.find((b) => 'text' in b && b.text)
        reply = (textBlock as { text: string } | undefined)?.text ?? ''
        break
      }

      if (response.stopReason === 'tool_use') {
        hasToolUse = true
        const toolUseBlocks = (assistantMessage.content ?? []).filter(
          (b): b is ContentBlock & { toolUse: NonNullable<ContentBlock['toolUse']> } => 'toolUse' in b && b.toolUse != null,
        )

        const toolResultContents: ContentBlock[] = await Promise.all(
          toolUseBlocks.map(async (block) => {
            const toolResult = await executeTool(
              block.toolUse.name!,
              block.toolUse.input,
              userId,
              userEmail,
            ).catch((err: unknown) => ({ error: String(err) }))

            return {
              toolResult: {
                toolUseId: block.toolUse.toolUseId,
                content: [{ text: JSON.stringify(toolResult) }],
                status: 'success' as const,
              },
            }
          }),
        )

        conversationMessages.push({
          role: 'user',
          content: toolResultContents,
        })
        continue
      }

      break
    }

    // Build updated messages array (original messages + tool-use rounds + final assistant turn)
    const updatedMessages: ConversationMessage[] = conversationMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: (m.content ?? []) as ConversationMessage['content'],
    }))

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply,
        sessionId: resolvedSessionId,
        messages: updatedMessages,
        hasToolUse,
      }),
    }
  } catch (err) {
    console.error('Bedrock Converse failed', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to invoke model' }) }
  }
}

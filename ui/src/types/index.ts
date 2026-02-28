export interface ContentBlock {
  text?: string
  toolUse?: {
    toolUseId: string
    name: string
    input: unknown
  }
  toolResult?: {
    toolUseId: string
    content: Array<{ text: string }>
    status?: 'success' | 'error'
  }
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: ContentBlock[]
}

export interface ChatRequest {
  messages: ConversationMessage[]
  sessionId?: string
}

export interface ChatResponse {
  reply: string
  sessionId: string
  messages: ConversationMessage[]
  hasToolUse: boolean
}

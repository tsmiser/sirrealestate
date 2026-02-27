export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatRequest {
  message: string
  sessionId?: string
}

export interface ChatResponse {
  reply: string
  sessionId: string
}

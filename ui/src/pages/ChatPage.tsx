// ci trigger
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  TextareaAutosize,
  Tooltip,
  Typography,
} from '@mui/material'
import { chat } from '@/services/api'
import ChatMessage from '@/pages/chat/chat-message'
import { Conversation } from '@/pages/chat/types'
import { useSidebarRefresh } from '@/components/layout/sidebar-refresh-context'
import { useUserProfile } from '@/hooks/useUserProfile'
import NiArrowOutUp from '@/icons/nexture/ni-arrow-out-up'
import NiMicrophone from '@/icons/nexture/ni-microphone'
import NiSendRight from '@/icons/nexture/ni-send-right'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { cn } from '@/lib/utils'
import type { ConversationMessage } from '@/types'

const SUGGESTED_QUESTIONS = [
  'What neighborhoods in my area have the best value?',
  'How do I evaluate if a property is priced fairly?',
  'What should I look for in a home inspection?',
]

export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState('')
  const [conversation, setConversation] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const { invalidateProfile, invalidateSearchResults } = useSidebarRefresh()
  const { profile, refetch: refetchProfile } = useUserProfile()

  useEffect(() => { refetchProfile() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const userInitials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : profile?.email ? profile.email.slice(0, 2).toUpperCase() : 'ME'

  const handleSpeechResult = useCallback((transcript: string) => {
    setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript))
  }, [])

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
  })

  // If launched with ?feedback=viewingId, pre-fill a feedback prompt
  useEffect(() => {
    const feedbackId = searchParams.get('feedback')
    if (feedbackId) {
      setInputValue(`I'd like to share feedback about my viewing (ID: ${feedbackId})`)
    }
  }, [searchParams])

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMsg: Conversation = {
      id: crypto.randomUUID(),
      type: 'User',
      message,
    }

    setConversation((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)

    const newUserMessage: ConversationMessage = {
      role: 'user',
      content: [{ type: 'text', text: message }],
    }
    const updatedMessages: ConversationMessage[] = [...messages, newUserMessage]

    try {
      const response = await chat.send({ messages: updatedMessages, sessionId })
      setSessionId(response.sessionId)
      setMessages(response.messages)

      // Invalidate sidebar data after any tool use
      if (response.hasToolUse) {
        invalidateProfile()
        invalidateSearchResults()
      }

      setConversation((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'AI',
          message: response.reply,
          animate: true,
        },
      ])
    } catch (err) {
      setConversation((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'AI',
          message: 'Sorry, something went wrong. Please try again.',
          animate: false,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  // Auto-scroll while animating
  useEffect(() => {
    if (!isAnimating) return
    const id = setInterval(() => {
      window.scrollTo({ top: document.body.scrollHeight })
    }, 100)
    return () => clearInterval(id)
  }, [isAnimating])

  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight })
  }, [conversation])

  return (
    <Box className="relative flex h-full min-h-[calc(100vh-12rem)] flex-col items-center gap-5 bg-black/[0.03]">
      {/* Conversation area */}
      <Box
        className={cn(
          'flex w-full max-w-200 flex-1 flex-col items-center justify-center pb-32 sm:px-4',
          conversation.length > 0 && 'items-end justify-start gap-5',
        )}
      >
        {conversation.length === 0 ? (
          <Box className="flex flex-col items-center gap-4">
            <Typography
              variant="body1"
              className="from-primary-dark via-primary to-primary-light inline-block max-w-lg bg-linear-to-r bg-clip-text text-center text-transparent"
            >
              Hello, I'm Sir Realtor and I'll be your virtual real estate concierge. Let's chat about what you're looking for in a home.
            </Typography>

            <Box className="mt-2 flex flex-col items-center gap-1">
              {SUGGESTED_QUESTIONS.map((q) => (
                <Button
                  key={q}
                  variant="outlined"
                  color="grey"
                  className="hover:text-primary"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </Button>
              ))}
            </Box>
          </Box>
        ) : (
          conversation.map((msg) => (
            <ChatMessage
              key={msg.id}
              conversation={msg}
              onAnimationStart={() => setIsAnimating(true)}
              onAnimationEnd={() => setIsAnimating(false)}
              userInitials={userInitials}
            />
          ))
        )}

        {isLoading && (
          <Box className="w-full">
            <Card className="w-full">
              <CardContent>
                <Typography variant="body2" className="text-text-secondary animate-pulse">
                  Thinking…
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Fixed input bar */}
      <Box className="bg-background fixed bottom-0 z-2 w-full p-4 sm:max-w-160 lg:max-w-200">
        <Card>
          <CardContent className="flex flex-col gap-4 p-2!">
            <FormControl className="MuiTextField-root relative mb-0 w-full">
              <TextareaAutosize
                minRows={2}
                maxRows={3}
                className="MuiInputBase-root MuiInput-root outlined autosize bg-background-paper! w-full resize-none pe-28! outline-none!"
                placeholder="Ask SirRealtor anything about real estate…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <Box className="absolute bottom-0 end-0 flex flex-row sm:top-0 sm:bottom-auto">
                <Tooltip
                  title={!isSupported ? 'Voice input not supported in this browser' : isListening ? 'Stop recording' : 'Voice'}
                  arrow
                  enterDelay={isListening ? 0 : 2000}
                >
                  <span className="hidden sm:inline-flex">
                    <Button
                      className={cn('icon-only', isListening && 'animate-pulse')}
                      size="medium"
                      color={isListening ? 'error' : 'grey'}
                      variant="text"
                      disabled={!isSupported || isLoading}
                      onClick={isListening ? stopListening : startListening}
                      startIcon={<NiMicrophone size="medium" />}
                    />
                  </span>
                </Tooltip>
                <Tooltip title="Attach" arrow enterDelay={2000}>
                  <Button
                    className="icon-only"
                    size="medium"
                    color="grey"
                    variant="text"
                    startIcon={<NiArrowOutUp size="medium" />}
                  />
                </Tooltip>
                <Tooltip title="Send" arrow enterDelay={2000}>
                  <Button
                    className="icon-only ms-1"
                    size="medium"
                    color="primary"
                    variant="contained"
                    onClick={() => sendMessage(inputValue)}
                    disabled={isLoading || !inputValue.trim()}
                    startIcon={<NiSendRight size="medium" />}
                  />
                </Tooltip>
              </Box>
            </FormControl>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

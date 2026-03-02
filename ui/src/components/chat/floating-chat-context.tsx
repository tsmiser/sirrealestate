import { createContext, useContext, useState } from 'react'

interface FloatingChatContextType {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  pendingMessage: string | null
  setPendingMessage: (msg: string) => void
  clearPendingMessage: () => void
}

const FloatingChatContext = createContext<FloatingChatContextType | null>(null)

export function FloatingChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingMessage, setPendingMessageState] = useState<string | null>(null)

  return (
    <FloatingChatContext.Provider
      value={{
        isOpen,
        openChat: () => setIsOpen(true),
        closeChat: () => setIsOpen(false),
        pendingMessage,
        setPendingMessage: (msg) => setPendingMessageState(msg),
        clearPendingMessage: () => setPendingMessageState(null),
      }}
    >
      {children}
    </FloatingChatContext.Provider>
  )
}

export function useFloatingChat() {
  const ctx = useContext(FloatingChatContext)
  if (!ctx) throw new Error('useFloatingChat must be used within FloatingChatProvider')
  return ctx
}

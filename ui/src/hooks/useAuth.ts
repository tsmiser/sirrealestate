// Only imports from aws-amplify/auth (no @aws-amplify/ui-react) — portable to React Native.
import { useState, useEffect } from 'react'
import { getCurrentUser, signOut, type AuthUser } from 'aws-amplify/auth'

interface UseAuthReturn {
  user: AuthUser | null
  isLoading: boolean
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
  }

  return { user, isLoading, signOut: handleSignOut }
}

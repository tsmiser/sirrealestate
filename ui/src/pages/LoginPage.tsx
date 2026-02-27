import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null
  if (user) return <Navigate to="/chat" replace />

  // Redirect to chat — AuthGuard will show the Amplify Authenticator
  return <Navigate to="/chat" replace />
}

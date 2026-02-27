// This is the ONLY file that imports @aws-amplify/ui-react.
// Swap this file for a React Native equivalent to achieve full portability.
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import type { ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  return (
    <Authenticator>
      {() => <>{children}</>}
    </Authenticator>
  )
}

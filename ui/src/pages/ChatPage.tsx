import { useAuth } from '@/hooks/useAuth'

export default function ChatPage() {
  const { user, signOut } = useAuth()

  return (
    <div>
      <header>
        <span>SirRealtor</span>
        <span>{user?.username}</span>
        <button onClick={signOut}>Sign out</button>
      </header>
      <main>
        {/* Chat interface placeholder — replace with full implementation */}
        <p>Chat coming soon.</p>
      </main>
    </div>
  )
}

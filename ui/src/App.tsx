import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from '@/components/auth/AuthGuard'
import ChatPage from '@/pages/ChatPage'
import LoginPage from '@/pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/chat"
          element={
            <AuthGuard>
              <ChatPage />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

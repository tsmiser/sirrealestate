import '@/style/global.css'

import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { signIn } from 'aws-amplify/auth'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Paper,
  Typography,
} from '@mui/material'
import MuiLayerOverride from '@/theme/mui-layer-override'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  if (!isLoading && user) return <Navigate to="/dashboard" replace />

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { isSignedIn } = await signIn({ username: email, password })
      if (isSignedIn) {
        navigate('/dashboard', { replace: true })
      } else {
        setError('Sign-in requires additional steps. Please contact support.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <MuiLayerOverride />
      <Box className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <Paper elevation={3} className="bg-background-paper shadow-darker-xs w-lg max-w-full rounded-4xl py-14">
          <Box className="flex flex-col gap-10 px-8 sm:px-14">
            <Box className="flex flex-col items-center gap-2">
              <Typography variant="h5" className="font-heading font-bold tracking-tight text-primary">
                Admin
              </Typography>
              <Typography variant="body2" className="text-text-secondary">
                sirrealtor.com administration
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FormControl className="outlined" variant="standard" size="small">
                <FormLabel component="label" className="mb-0.5!">Email</FormLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@sirrealtor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </FormControl>

              <FormControl className="outlined" variant="standard" size="small">
                <FormLabel component="label" className="mb-0.5!">Password</FormLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </FormControl>

              {error && (
                <Alert severity="error" className="neutral bg-background-paper/60!">
                  <AlertTitle variant="subtitle2">Sign-in error</AlertTitle>
                  <Typography variant="body2">{error}</Typography>
                </Alert>
              )}

              <Button type="submit" variant="contained" disabled={loading} className="mt-2">
                {loading ? 'Signing in…' : 'Continue'}
              </Button>
            </Box>

            <Divider className="text-text-secondary my-0 text-sm" />

            <Box className="flex flex-col">
              <Typography variant="h6" component="h6">Get Started</Typography>
              <Typography variant="body1" className="text-text-secondary">
                Don't have an account?{' '}
                <Link to="/sign-up" className="link-primary link-underline-hover">Sign up</Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </>
  )
}

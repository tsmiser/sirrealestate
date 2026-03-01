import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'

const API_URL = import.meta.env.VITE_API_URL

export default function ViewingResponsePage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')

  useEffect(() => {
    const viewingId = searchParams.get('viewingId')
    const slot = searchParams.get('slot')
    if (!viewingId || slot === null) {
      setStatus('error')
      return
    }

    fetch(`${API_URL}/viewing-response?viewingId=${encodeURIComponent(viewingId)}&slot=${encodeURIComponent(slot)}`)
      .then((r) => (r.ok ? setStatus('done') : setStatus('error')))
      .catch(() => setStatus('error'))
  }, [searchParams])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        bgcolor: 'background.default',
      }}
    >
      {status === 'loading' && <CircularProgress />}

      {status === 'done' && (
        <Box sx={{ maxWidth: 480, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Thank you for responding!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your response has been recorded and the buyer has been notified. No further action is needed on your part.
          </Typography>
        </Box>
      )}

      {status === 'error' && (
        <Box sx={{ maxWidth: 480, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary">
            We couldn't record your response. Please try clicking the link from your email again, or contact the buyer directly.
          </Typography>
        </Box>
      )}
    </Box>
  )
}

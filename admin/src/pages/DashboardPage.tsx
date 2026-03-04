import { useEffect, useState } from 'react'
import { Box, Card, CardContent, CircularProgress, Typography } from '@mui/material'
import { api, type DashboardCounts } from '@/services/api'

interface StatCardProps {
  label: string
  value: number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="flex-1 min-w-40">
      <CardContent className="flex flex-col gap-1 p-5!">
        <Typography variant="h4" className="font-heading font-bold text-primary">
          {value.toLocaleString()}
        </Typography>
        <Typography variant="body2" className="text-text-secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.dashboard.get()
      .then((r) => setCounts(r.counts))
      .catch((e) => setError(e.message))
  }, [])

  if (error) {
    return <Typography color="error">{error}</Typography>
  }

  if (!counts) {
    return (
      <Box className="flex items-center justify-center h-40">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box className="flex flex-col gap-6">
      <Typography variant="h5" className="font-heading font-bold">Dashboard</Typography>
      <Box className="flex flex-wrap gap-4">
        <StatCard label="Users" value={counts.users} />
        <StatCard label="Profiles" value={counts.profiles} />
        <StatCard label="Searches" value={counts.searches} />
        <StatCard label="Documents" value={counts.documents} />
        <StatCard label="Viewings" value={counts.viewings} />
        <StatCard label="Offers" value={counts.offers} />
      </Box>
    </Box>
  )
}

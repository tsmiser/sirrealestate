import { Box, Chip, Typography } from '@mui/material'
import type { Viewing, ViewingStatus } from '@/hooks/useViewings'

interface ViewingCardProps {
  viewing: Viewing
}

const STATUS_COLORS: Record<ViewingStatus, 'info' | 'success' | 'default' | 'error'> = {
  requested: 'info',
  confirmed: 'success',
  completed: 'default',
  cancelled: 'error',
}

const STATUS_LABELS: Record<ViewingStatus, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function ViewingCard({ viewing }: ViewingCardProps) {
  const dateStr = viewing.proposedDateTime
    ? new Date(viewing.proposedDateTime).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Time TBD'

  return (
    <Box className="ms-7 rounded-lg border border-grey-100 bg-background px-3 py-2">
      <Box className="flex items-start justify-between gap-1">
        <Typography
          variant="body2"
          className="text-text-primary truncate font-medium"
          title={viewing.listingAddress}
        >
          {viewing.listingAddress}
        </Typography>
        <Chip
          label={STATUS_LABELS[viewing.status]}
          color={STATUS_COLORS[viewing.status]}
          size="small"
          className="h-4 shrink-0 text-[10px]"
        />
      </Box>
      <Typography variant="caption" className="text-text-secondary">
        {dateStr}
      </Typography>
    </Box>
  )
}

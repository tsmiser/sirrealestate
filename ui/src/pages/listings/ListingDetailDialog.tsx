import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import { useFloatingChat } from '@/components/chat/floating-chat-context'
import type { SearchResult } from '@/hooks/useSearchResults'

interface ListingDetailDialogProps {
  result: SearchResult | null
  open: boolean
  onClose: () => void
}

export default function ListingDetailDialog({ result, open, onClose }: ListingDetailDialogProps) {
  const { setPendingMessage, openChat } = useFloatingChat()

  if (!result) return null

  const l = result.listingData

  function handleScheduleViewing() {
    onClose()
    setPendingMessage(
      `I'd like to schedule a viewing for ${l.address}. Can you help me arrange that?`,
    )
    openChat()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{l.address}</DialogTitle>
      <DialogContent dividers>
        <Box className="flex flex-col gap-3">
          <Box className="flex flex-wrap gap-4">
            <Box>
              <Typography variant="caption" className="text-text-secondary block">
                Price
              </Typography>
              <Typography variant="h6" className="font-semibold">
                ${l.price.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" className="text-text-secondary block">
                Beds / Baths
              </Typography>
              <Typography variant="body1">
                {l.bedrooms} bed / {l.bathrooms} bath
              </Typography>
            </Box>
            {l.sqft && (
              <Box>
                <Typography variant="caption" className="text-text-secondary block">
                  Sqft
                </Typography>
                <Typography variant="body1">{l.sqft.toLocaleString()}</Typography>
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="caption" className="text-text-secondary block">
              Matched
            </Typography>
            <Typography variant="body2">
              {new Date(result.matchedAt).toLocaleDateString()}
            </Typography>
          </Box>

          {(l.agentName || l.agentEmail) && (
            <Box>
              <Typography variant="caption" className="text-text-secondary block">
                Agent
              </Typography>
              {l.agentName && <Typography variant="body2">{l.agentName}</Typography>}
              {l.agentEmail && (
                <Typography variant="body2">
                  <a href={`mailto:${l.agentEmail}`} className="text-primary hover:underline">
                    {l.agentEmail}
                  </a>
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions className="gap-2 p-3">
        {l.listingUrl && (
          <Button
            variant="outlined"
            color="grey"
            size="small"
            href={l.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Listing
          </Button>
        )}
        <Button variant="contained" color="primary" size="small" onClick={handleScheduleViewing}>
          Schedule Viewing
        </Button>
        <Button variant="text" color="grey" size="small" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

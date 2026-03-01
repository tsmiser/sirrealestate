import { Box, Chip, Typography } from '@mui/material'
import type { SearchResult } from '@/hooks/useSearchResults'

interface ListingMatchCardProps {
  result: SearchResult
}

function detectPlatform(url: string): { label: string; color: string } | null {
  if (url.includes('zillow.com')) return { label: 'Zillow', color: '#006AFF' }
  if (url.includes('redfin.com')) return { label: 'Redfin', color: '#CC0000' }
  if (url.includes('realtor.com')) return { label: 'Realtor', color: '#D92228' }
  return null
}

export default function ListingMatchCard({ result }: ListingMatchCardProps) {
  const { listingData, notified } = result
  const platform = listingData.listingUrl ? detectPlatform(listingData.listingUrl) : null

  return (
    <Box className="ms-7 rounded-lg border border-grey-100 bg-background px-3 py-2">
      <Box className="flex items-start justify-between gap-1">
        <Typography
          variant="body2"
          className="text-text-primary truncate font-medium"
          title={listingData.address}
        >
          {listingData.address}
        </Typography>
        {!notified && (
          <Chip label="NEW" color="success" size="small" className="h-4 shrink-0 text-[10px]" />
        )}
      </Box>
      <Typography variant="body2" className="text-text-primary font-semibold">
        ${listingData.price.toLocaleString()}
      </Typography>
      <Typography variant="caption" className="text-text-secondary">
        {listingData.bedrooms}BR · {listingData.bathrooms}BA
        {listingData.sqft ? ` · ${listingData.sqft.toLocaleString()} sqft` : ''}
      </Typography>
      {listingData.listingUrl && platform && (
        <Box className="mt-1.5">
          <a href={listingData.listingUrl} target="_blank" rel="noopener noreferrer">
            <Chip
              label={platform.label}
              size="small"
              sx={{ bgcolor: platform.color, color: 'white', fontSize: '0.65rem', height: 18, cursor: 'pointer' }}
            />
          </a>
        </Box>
      )}
    </Box>
  )
}

import { Box, Chip, Typography } from '@mui/material'
import type { SearchResult } from '@/hooks/useSearchResults'

interface ListingMatchCardProps {
  result: SearchResult
}

export default function ListingMatchCard({ result }: ListingMatchCardProps) {
  const { listingData, notified } = result

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
    </Box>
  )
}

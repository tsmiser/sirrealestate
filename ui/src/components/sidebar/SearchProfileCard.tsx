import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import NiChevronRightSmall from '@/icons/nexture/ni-chevron-right-small'
import ListingMatchCard from './ListingMatchCard'
import type { SearchProfile } from '@/hooks/useUserProfile'
import type { SearchResult } from '@/hooks/useSearchResults'

interface SearchProfileCardProps {
  profile: SearchProfile
  results: SearchResult[]
}

function formatCriteria(profile: SearchProfile): string {
  const parts: string[] = []
  const c = profile.criteria
  if (c.bedrooms) parts.push(`${c.bedrooms}BR`)
  if (c.city && c.state) parts.push(`${c.city} ${c.state}`)
  else if (c.city) parts.push(c.city)
  else if (c.state) parts.push(c.state)
  if (c.minPrice || c.maxPrice) {
    const min = c.minPrice ? `$${Math.round(c.minPrice / 1000)}k` : ''
    const max = c.maxPrice ? `$${Math.round(c.maxPrice / 1000)}k` : ''
    if (min && max) parts.push(`${min}–${max}`)
    else if (max) parts.push(`up to ${max}`)
    else if (min) parts.push(`from ${min}`)
  }
  return parts.join(' · ') || 'No criteria set'
}

export default function SearchProfileCard({ profile, results }: SearchProfileCardProps) {
  const topResults = results.slice(0, 3)

  return (
    <Accordion
      elevation={0}
      disableGutters
      className="before:hidden"
      sx={{ backgroundColor: 'transparent' }}
    >
      <AccordionSummary
        expandIcon={<NiChevronRightSmall size="small" className="accordion-rotate" />}
        className="min-h-0 px-2 py-1.5"
        sx={{ flexDirection: 'row-reverse', gap: 0.5 }}
      >
        <Box className="flex w-full items-center justify-between gap-2">
          <Typography variant="body2" className="font-medium truncate">
            {profile.name}
          </Typography>
          <Chip
            label={profile.monitoring ? 'Live' : 'Paused'}
            color={profile.monitoring ? 'success' : 'default'}
            size="small"
            className="h-4 shrink-0 text-[10px]"
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails className="flex flex-col gap-1.5 px-2 pb-2 pt-0">
        <Typography variant="caption" className="text-text-secondary ms-7 block">
          {formatCriteria(profile)}
        </Typography>
        {topResults.length === 0 ? (
          <Typography variant="caption" className="text-text-secondary ms-7">
            No matches yet — monitoring will run daily at 8 AM.
          </Typography>
        ) : (
          <>
            {topResults.map((r) => <ListingMatchCard key={r.profileIdListingId} result={r} />)}
            {results.length > 0 && (
              <Link
                to={`/listings/${profile.profileId}`}
                className="text-primary ms-7 mt-1 block text-xs font-medium hover:underline"
              >
                Show all {results.length} listings →
              </Link>
            )}
          </>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

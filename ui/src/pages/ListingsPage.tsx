import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { useSearchResults } from '@/hooks/useSearchResults'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useFloatingChat } from '@/components/chat/floating-chat-context'
import ListingsTable from './listings/ListingsTable'
import ListingsMap from './listings/ListingsMap'
import ListingDetailDialog from './listings/ListingDetailDialog'
import type { SearchResult } from '@/hooks/useSearchResults'

type View = 'list' | 'map'

export default function ListingsPage() {
  const { profileId } = useParams<{ profileId: string }>()
  const { grouped, refetch } = useSearchResults()
  const { profile, refetch: refetchProfile } = useUserProfile()
  const { setPendingMessage, openChat } = useFloatingChat()

  const [view, setView] = useState<View>('list')
  const [selectedListing, setSelectedListing] = useState<SearchResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minBeds, setMinBeds] = useState('')
  const [minBaths, setMinBaths] = useState('')

  useEffect(() => {
    refetch()
    refetchProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const results = grouped[profileId ?? ''] ?? []
  const searchProfile = profile?.searchProfiles.find((p) => p.profileId === profileId)

  const filtered = useMemo(() => {
    return results.filter((r) => {
      const l = r.listingData
      if (minPrice && l.price < Number(minPrice)) return false
      if (maxPrice && l.price > Number(maxPrice)) return false
      if (minBeds && l.bedrooms < Number(minBeds)) return false
      if (minBaths && l.bathrooms < Number(minBaths)) return false
      return true
    })
  }, [results, minPrice, maxPrice, minBeds, minBaths])

  function handleListingSelect(result: SearchResult) {
    setSelectedListing(result)
    setDialogOpen(true)
    const l = result.listingData
    const sqftPart = l.sqft ? `, ${l.sqft.toLocaleString()} sqft` : ''
    setPendingMessage(
      `I'm viewing this listing: ${l.address} — $${l.price.toLocaleString()}, ` +
        `${l.bedrooms} bed / ${l.bathrooms} bath${sqftPart}. ` +
        `How does it compare to my search criteria and is it a good fit for me?`,
    )
    openChat()
  }

  const criteriaPills: string[] = []
  if (searchProfile) {
    const c = searchProfile.criteria
    if (c.bedrooms) criteriaPills.push(`${c.bedrooms} bed`)
    if (c.bathrooms) criteriaPills.push(`${c.bathrooms} bath`)
    if (c.city && c.state) criteriaPills.push(`${c.city}, ${c.state}`)
    else if (c.city) criteriaPills.push(c.city)
    else if (c.state) criteriaPills.push(c.state)
    if (c.minPrice) criteriaPills.push(`from $${Math.round(c.minPrice / 1000)}k`)
    if (c.maxPrice) criteriaPills.push(`up to $${Math.round(c.maxPrice / 1000)}k`)
    if (c.propertyType) criteriaPills.push(c.propertyType)
  }

  return (
    <Box className="flex flex-col gap-4">
      {/* Page header */}
      <Box className="flex flex-col gap-2">
        <Box className="flex flex-wrap items-center justify-between gap-2">
          <Box className="flex flex-col gap-1">
            <Typography variant="h6" className="font-semibold">
              {searchProfile?.name ?? 'Listings'}
            </Typography>
            <Box className="flex flex-wrap gap-1">
              {criteriaPills.map((pill) => (
                <Chip key={pill} label={pill} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
          <Box className="flex items-center gap-3">
            <Typography variant="body2" className="text-text-secondary">
              {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
              {filtered.length !== results.length && ` (${results.length} total)`}
            </Typography>
            <ButtonGroup size="small" variant="outlined" color="grey">
              <Button
                variant={view === 'list' ? 'contained' : 'outlined'}
                color={view === 'list' ? 'primary' : 'grey'}
                onClick={() => setView('list')}
              >
                List
              </Button>
              <Button
                variant={view === 'map' ? 'contained' : 'outlined'}
                color={view === 'map' ? 'primary' : 'grey'}
                onClick={() => setView('map')}
              >
                Map
              </Button>
            </ButtonGroup>
          </Box>
        </Box>
      </Box>

      {/* Filter bar */}
      <Box className="flex flex-wrap gap-2">
        <TextField
          label="Min price"
          size="small"
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          sx={{ width: 140 }}
        />
        <TextField
          label="Max price"
          size="small"
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          sx={{ width: 140 }}
        />
        <TextField
          label="Min beds"
          size="small"
          type="number"
          value={minBeds}
          onChange={(e) => setMinBeds(e.target.value)}
          sx={{ width: 110 }}
        />
        <TextField
          label="Min baths"
          size="small"
          type="number"
          value={minBaths}
          onChange={(e) => setMinBaths(e.target.value)}
          sx={{ width: 110 }}
        />
      </Box>

      {/* Content */}
      {view === 'list' ? (
        <Box sx={{ height: 'calc(100vh - 18rem)', minHeight: 300 }}>
          <ListingsTable results={filtered} onListingClick={handleListingSelect} />
        </Box>
      ) : (
        <Box sx={{ height: 'calc(100vh - 18rem)', minHeight: 300 }}>
          <ListingsMap results={filtered} onListingClick={handleListingSelect} />
        </Box>
      )}

      <ListingDetailDialog
        result={selectedListing}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  )
}

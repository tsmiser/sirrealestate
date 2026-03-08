import { useMemo, useState } from 'react'
import { Box, InputAdornment, TextField, Typography } from '@mui/material'
import { useFavoritesContext } from '@/components/favorites/FavoritesContext'
import ListingsTable from './listings/ListingsTable'
import ListingDetailDialog from './listings/ListingDetailDialog'
import type { SearchResult } from '@/hooks/useSearchResults'

export default function FavoritesPage() {
  const { favorites } = useFavoritesContext()

  const [selectedListing, setSelectedListing] = useState<SearchResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minBeds, setMinBeds] = useState('')
  const [minBaths, setMinBaths] = useState('')

  // Convert Favorite → SearchResult for ListingsTable
  const allResults: SearchResult[] = favorites.map((f) => ({
    userId: '',
    listingId: f.listingId,
    profileId: f.profileId,
    profileIdListingId: `${f.profileId}#${f.listingId}`,
    listingData: f.listingData,
    matchedAt: f.favoritedAt,
    notified: true,
  }))

  const filtered = useMemo(() => {
    return allResults.filter((r) => {
      const l = r.listingData
      if (minPrice && l.price < Number(minPrice)) return false
      if (maxPrice && l.price > Number(maxPrice)) return false
      if (minBeds && l.bedrooms < Number(minBeds)) return false
      if (minBaths && l.bathrooms < Number(minBaths)) return false
      return true
    })
  }, [allResults, minPrice, maxPrice, minBeds, minBaths])

  function handleListingSelect(result: SearchResult) {
    setSelectedListing(result)
    setDialogOpen(true)
  }

  return (
    <Box className="flex flex-col gap-4">
      <Box className="flex items-center justify-between">
        <Typography variant="h6" className="font-semibold">
          Favorites
        </Typography>
        <Typography variant="body2" className="text-text-secondary">
          {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== allResults.length && ` (${allResults.length} total)`}
        </Typography>
      </Box>

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

      <Box sx={{ height: 'calc(100vh - 16rem)', minHeight: 300 }}>
        {allResults.length === 0 ? (
          <Typography variant="body2" className="text-text-secondary px-1 italic">
            No favorites yet — heart a listing to save it here.
          </Typography>
        ) : (
          <ListingsTable results={filtered} onListingClick={handleListingSelect} />
        )}
      </Box>

      <ListingDetailDialog
        result={selectedListing}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  )
}

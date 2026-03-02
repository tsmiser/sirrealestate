import { useCallback, useRef } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { Alert, Box, Chip, CircularProgress } from '@mui/material'
import type { SearchResult } from '@/hooks/useSearchResults'

interface ListingsMapProps {
  results: SearchResult[]
  onListingClick: (result: SearchResult) => void
}

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

export default function ListingsMap({ results, onListingClick }: ListingsMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'sir-realtor-google-maps',
    googleMapsApiKey: MAPS_API_KEY ?? '',
  })

  const mappable = results.filter(
    (r) => typeof r.listingData.latitude === 'number' && typeof r.listingData.longitude === 'number',
  )
  const unmappableCount = results.length - mappable.length

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map
      if (mappable.length === 0) return
      const bounds = new window.google.maps.LatLngBounds()
      mappable.forEach((r) => {
        bounds.extend({ lat: r.listingData.latitude!, lng: r.listingData.longitude! })
      })
      map.fitBounds(bounds)
    },
    [mappable],
  )

  if (!MAPS_API_KEY) {
    return (
      <Alert severity="warning" className="m-4">
        Google Maps API key is not configured. Set <code>VITE_GOOGLE_MAPS_API_KEY</code> to enable the map view.
      </Alert>
    )
  }

  if (loadError) {
    return (
      <Alert severity="error" className="m-4">
        Failed to load Google Maps.
      </Alert>
    )
  }

  if (!isLoaded) {
    return (
      <Box className="flex h-full items-center justify-center">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box className="relative h-full w-full">
      {unmappableCount > 0 && (
        <Chip
          label={`${unmappableCount} listing${unmappableCount > 1 ? 's' : ''} not shown on map`}
          size="small"
          className="absolute top-3 left-1/2 z-10 -translate-x-1/2 shadow"
          sx={{ backgroundColor: 'white' }}
        />
      )}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        zoom={12}
        onLoad={onMapLoad}
        options={{ streetViewControl: false, mapTypeControl: false }}
      >
        {mappable.map((r) => (
          <Marker
            key={r.profileIdListingId}
            position={{ lat: r.listingData.latitude!, lng: r.listingData.longitude! }}
            label={{
              text: '$' + Math.round(r.listingData.price / 1000) + 'k',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
            onClick={() => onListingClick(r)}
          />
        ))}
      </GoogleMap>
    </Box>
  )
}

import { useState, useCallback } from 'react'
import { api } from '@/services/api'

export interface Listing {
  listingId: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft?: number
  agentEmail?: string
  agentName?: string
  listingUrl?: string
  latitude?: number
  longitude?: number
}

export interface SearchResult {
  userId: string
  profileIdListingId: string
  profileId: string
  listingId: string
  listingData: Listing
  matchedAt: string
  notified: boolean
}

interface SearchResultsResponse {
  results: SearchResult[]
  grouped: Record<string, SearchResult[]>
}

export function useSearchResults() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [grouped, setGrouped] = useState<Record<string, SearchResult[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get<SearchResultsResponse>('/search-results')
      setResults(data.results)
      setGrouped(data.grouped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load search results')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { results, grouped, isLoading, error, refetch: fetch }
}

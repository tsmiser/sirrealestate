import { useState, useCallback } from 'react'
import { api } from '@/services/api'

export type ViewingStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled'

export interface ViewingFeedback {
  rating: number
  notes: string
  wouldMakeOffer: boolean
}

export interface Viewing {
  userId: string
  viewingId: string
  listingId: string
  profileId: string
  listingAddress: string
  agentEmail?: string
  agentName?: string
  requestedAt: string
  proposedDateTime?: string
  status: ViewingStatus
  feedback?: ViewingFeedback
  feedbackRequestedAt?: string
  feedbackCollectedAt?: string
}

interface ViewingsResponse {
  viewings: Viewing[]
}

export function useViewings() {
  const [viewings, setViewings] = useState<Viewing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get<ViewingsResponse>('/viewings')
      setViewings(data.viewings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load viewings')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { viewings, isLoading, error, refetch: fetch }
}

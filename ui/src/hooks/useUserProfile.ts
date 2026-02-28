import { useState, useCallback } from 'react'
import { api } from '@/services/api'

export interface SearchCriteria {
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  propertyType?: string
  city?: string
  state?: string
  zipCodes?: string[]
}

export interface SearchProfile {
  profileId: string
  name: string
  isDefault: boolean
  criteria: SearchCriteria
  monitoring: boolean
  notificationPreferences: { email: boolean; sms: false; push: false }
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  userId: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  searchProfiles: SearchProfile[]
  createdAt: string
  updatedAt: string
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get<UserProfile>('/profile')
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { profile, isLoading, error, refetch: fetch }
}

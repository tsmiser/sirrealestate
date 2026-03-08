import { createContext, useContext, useState, useCallback, useEffect, type PropsWithChildren } from 'react'
import { favorites as favoritesApi } from '@/services/api'
import type { Listing } from '@/hooks/useSearchResults'

export interface Favorite {
  userId?: string
  listingId: string
  profileId: string
  listingData: Listing
  favoritedAt: string
}

interface FavoritesContextType {
  favorites: Favorite[]
  isFavorited: (listingId: string) => boolean
  toggle: (listingId: string, listingData: Listing, profileId: string) => void
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export function FavoritesProvider({ children }: PropsWithChildren) {
  const [favorites, setFavorites] = useState<Favorite[]>([])

  useEffect(() => {
    favoritesApi.list()
      .then((data) => setFavorites(data.favorites))
      .catch(() => {})
  }, [])

  const isFavorited = useCallback(
    (listingId: string) => favorites.some((f) => f.listingId === listingId),
    [favorites],
  )

  const toggle = useCallback(
    (listingId: string, listingData: Listing, profileId: string) => {
      const currentlyFavorited = favorites.some((f) => f.listingId === listingId)

      // Optimistic update
      if (currentlyFavorited) {
        setFavorites((prev) => prev.filter((f) => f.listingId !== listingId))
      } else {
        setFavorites((prev) => [
          ...prev,
          { listingId, profileId, listingData, favoritedAt: new Date().toISOString() },
        ])
      }

      // Persist and revert on failure
      favoritesApi.toggle({ listingId, listingData, profileId }).catch(() => {
        if (currentlyFavorited) {
          setFavorites((prev) => [
            ...prev,
            { listingId, profileId, listingData, favoritedAt: new Date().toISOString() },
          ])
        } else {
          setFavorites((prev) => prev.filter((f) => f.listingId !== listingId))
        }
      })
    },
    [favorites],
  )

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorited, toggle }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavoritesContext() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavoritesContext must be used within FavoritesProvider')
  return ctx
}

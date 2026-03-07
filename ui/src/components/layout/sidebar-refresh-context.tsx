import { createContext, type PropsWithChildren, useContext, useRef, useCallback, useState } from 'react'

type RefreshFn = () => void

type SidebarRefreshContextType = {
  invalidateProfile: () => void
  invalidateSearchResults: () => void
  invalidateDocuments: () => void
  invalidateOffers: () => void
  invalidateViewings: () => void
  registerProfileRefetch: (fn: RefreshFn) => void
  registerSearchResultsRefetch: (fn: RefreshFn) => void
  registerDocumentsRefetch: (fn: RefreshFn) => void
  registerOffersRefetch: (fn: RefreshFn) => void
  registerViewingsRefetch: (fn: RefreshFn) => void
  newListingsCount: number
  setNewListingsCount: (n: number) => void
}

const SidebarRefreshContext = createContext<SidebarRefreshContextType | null>(null)

export function SidebarRefreshProvider({ children }: PropsWithChildren) {
  const profileRefetchRef = useRef<RefreshFn | null>(null)
  const searchResultsRefetchRef = useRef<RefreshFn | null>(null)
  const documentsRefetchRef = useRef<RefreshFn | null>(null)
  const offersRefetchRef = useRef<RefreshFn | null>(null)
  const viewingsRefetchRef = useRef<RefreshFn | null>(null)
  const [newListingsCount, setNewListingsCount] = useState(0)

  const invalidateProfile = useCallback(() => { profileRefetchRef.current?.() }, [])
  const invalidateSearchResults = useCallback(() => { searchResultsRefetchRef.current?.() }, [])
  const invalidateDocuments = useCallback(() => { documentsRefetchRef.current?.() }, [])
  const invalidateOffers = useCallback(() => { offersRefetchRef.current?.() }, [])
  const invalidateViewings = useCallback(() => { viewingsRefetchRef.current?.() }, [])

  const registerProfileRefetch = useCallback((fn: RefreshFn) => { profileRefetchRef.current = fn }, [])
  const registerSearchResultsRefetch = useCallback((fn: RefreshFn) => { searchResultsRefetchRef.current = fn }, [])
  const registerDocumentsRefetch = useCallback((fn: RefreshFn) => { documentsRefetchRef.current = fn }, [])
  const registerOffersRefetch = useCallback((fn: RefreshFn) => { offersRefetchRef.current = fn }, [])
  const registerViewingsRefetch = useCallback((fn: RefreshFn) => { viewingsRefetchRef.current = fn }, [])

  return (
    <SidebarRefreshContext.Provider
      value={{
        invalidateProfile,
        invalidateSearchResults,
        invalidateDocuments,
        invalidateOffers,
        invalidateViewings,
        registerProfileRefetch,
        registerSearchResultsRefetch,
        registerDocumentsRefetch,
        registerOffersRefetch,
        registerViewingsRefetch,
        newListingsCount,
        setNewListingsCount,
      }}
    >
      {children}
    </SidebarRefreshContext.Provider>
  )
}

export function useSidebarRefresh() {
  const ctx = useContext(SidebarRefreshContext)
  if (!ctx) throw new Error('useSidebarRefresh must be used within SidebarRefreshProvider')
  return ctx
}

import { createContext, type PropsWithChildren, useContext, useRef, useCallback } from 'react'

type RefreshFn = () => void

type SidebarRefreshContextType = {
  invalidateProfile: () => void
  invalidateSearchResults: () => void
  registerProfileRefetch: (fn: RefreshFn) => void
  registerSearchResultsRefetch: (fn: RefreshFn) => void
}

const SidebarRefreshContext = createContext<SidebarRefreshContextType | null>(null)

export function SidebarRefreshProvider({ children }: PropsWithChildren) {
  const profileRefetchRef = useRef<RefreshFn | null>(null)
  const searchResultsRefetchRef = useRef<RefreshFn | null>(null)

  const invalidateProfile = useCallback(() => {
    profileRefetchRef.current?.()
  }, [])

  const invalidateSearchResults = useCallback(() => {
    searchResultsRefetchRef.current?.()
  }, [])

  const registerProfileRefetch = useCallback((fn: RefreshFn) => {
    profileRefetchRef.current = fn
  }, [])

  const registerSearchResultsRefetch = useCallback((fn: RefreshFn) => {
    searchResultsRefetchRef.current = fn
  }, [])

  return (
    <SidebarRefreshContext.Provider
      value={{
        invalidateProfile,
        invalidateSearchResults,
        registerProfileRefetch,
        registerSearchResultsRefetch,
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

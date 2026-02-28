import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react'

const SIDEBAR_WIDTH = 240

type LayoutContextType = {
  sidebarOpen: boolean
  sidebarWidth: number
  isMobile: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
}

const LayoutContext = createContext<LayoutContextType | null>(null)

export default function LayoutContextProvider({ children }: PropsWithChildren) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 959px)')
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
      if (!e.matches) setSidebarOpen(true)  // open by default on desktop
      if (e.matches) setSidebarOpen(false)  // closed by default on mobile
    }
    update(mq)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <LayoutContext.Provider
      value={{
        sidebarOpen,
        sidebarWidth: SIDEBAR_WIDTH,
        isMobile,
        toggleSidebar: () => setSidebarOpen((v) => !v),
        closeSidebar: () => setSidebarOpen(false),
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export const useLayoutContext = () => {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayoutContext must be used within LayoutContextProvider')
  return ctx
}

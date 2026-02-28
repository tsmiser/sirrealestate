import { useLayoutContext } from '@/components/layout/layout-context'

export default function MenuBackdrop() {
  const { isMobile, sidebarOpen, closeSidebar } = useLayoutContext()

  if (!isMobile || !sidebarOpen) return null

  return (
    <div
      className="absolute inset-0 z-0"
      onClick={closeSidebar}
    />
  )
}

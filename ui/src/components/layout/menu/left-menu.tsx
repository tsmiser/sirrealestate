import { NavLink } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { useLayoutContext } from '@/components/layout/layout-context'
import NiMessage from '@/icons/nexture/ni-message'
import { cn } from '@/lib/utils'

export default function LeftMenu() {
  const { sidebarOpen, sidebarWidth } = useLayoutContext()

  return (
    <nav
      className={cn(
        'bg-background-paper shadow-darker-xs fixed z-10 mt-20 flex h-[calc(100%-5rem)] flex-col overflow-hidden rounded-e-4xl transition-all duration-(--layout-duration)',
      )}
      style={{ width: sidebarOpen ? `${sidebarWidth}px` : '0px' }}
    >
      <Box
        className="flex h-full flex-col gap-0.5 overflow-y-auto px-4 py-2.5"
        style={{ width: `${sidebarWidth}px` }}
      >
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            cn(
              'flex flex-row items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-grey-50 hover:text-text-primary',
            )
          }
        >
          <NiMessage size="medium" />
          <Typography variant="body2" component="span" className="font-medium">
            Chat
          </Typography>
        </NavLink>
      </Box>
    </nav>
  )
}

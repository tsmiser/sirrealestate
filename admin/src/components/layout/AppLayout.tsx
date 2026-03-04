import '@/style/global.css'

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import Header from './Header'
import LeftNav from './LeftNav'

const NAV_WIDTH = 240

export default function AppLayout() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box className="flex min-h-screen bg-background">
      {/* Permanent desktop nav */}
      {isDesktop && (
        <LeftNav open variant="permanent" onClose={() => {}} />
      )}

      {/* Temporary mobile nav */}
      {!isDesktop && (
        <LeftNav
          open={mobileOpen}
          variant="temporary"
          onClose={() => setMobileOpen(false)}
        />
      )}

      <Box
        className="flex flex-col flex-1"
        sx={{ marginLeft: isDesktop ? `${NAV_WIDTH}px` : 0 }}
      >
        <Header onMenuClick={() => setMobileOpen((o) => !o)} />
        <Box component="main" className="flex-1 pt-20 p-6">
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

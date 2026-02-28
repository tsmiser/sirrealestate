import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Box, Button, Menu, MenuItem, Typography } from '@mui/material'
import { useLayoutContext } from '@/components/layout/layout-context'
import knightLogo from '@/assets/knight.png'
import NiMenuSplit from '@/icons/nexture/ni-menu-split'
import { useAuth } from '@/hooks/useAuth'

export default function Header() {
  const { toggleSidebar } = useLayoutContext()
  const { user, signOut } = useAuth()
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'SR'

  return (
    <Box className="mui-fixed fixed z-20 h-20 w-full" component="header">
      <Box
        className="bg-background-paper shadow-darker-xs flex h-full w-full flex-row items-center rounded-b-3xl px-4 sm:px-6"
      >
        {/* Mobile/desktop sidebar toggle */}
        <Button
          variant="text"
          size="large"
          color="text-primary"
          className="icon-only hover-icon-shrink hover:bg-grey-25 me-2"
          onClick={toggleSidebar}
          startIcon={<NiMenuSplit size={24} />}
        />

        {/* Logo */}
        <Box className="flex flex-1 items-center">
          <Link to="/chat">
            <img src={knightLogo} alt="SirRealtor" className="h-14 w-auto" />
          </Link>
        </Box>

        {/* User avatar */}
        <Avatar
          onClick={(e) => setUserMenuAnchor(e.currentTarget)}
          className="bg-primary cursor-pointer text-sm font-semibold"
          sx={{ width: 36, height: 36 }}
        >
          {initials}
        </Avatar>

        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={() => setUserMenuAnchor(null)}
          className="mt-1"
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem disabled>
            <Typography variant="body2" className="text-text-secondary">
              {user?.username}
            </Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setUserMenuAnchor(null)
              signOut()
            }}
          >
            Sign out
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}

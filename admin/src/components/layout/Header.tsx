import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Box, IconButton, Menu, MenuItem, Typography } from '@mui/material'
import { useAuth } from '@/hooks/useAuth'

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate()
  const { email, signOut } = useAuth()
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)

  const initials = email ? email.slice(0, 2).toUpperCase() : 'AD'

  return (
    <Box className="mui-fixed fixed z-20 h-20 w-full" component="header">
      <Box className="bg-background-paper shadow-darker-xs flex h-full w-full flex-row items-center rounded-b-3xl px-4 sm:px-6 gap-3">
        <IconButton onClick={onMenuClick} size="large" className="hover:bg-grey-25">
          <Box className="flex flex-col gap-1 w-5">
            <Box className="h-0.5 w-full bg-current rounded" />
            <Box className="h-0.5 w-full bg-current rounded" />
            <Box className="h-0.5 w-full bg-current rounded" />
          </Box>
        </IconButton>

        <Typography variant="h6" className="font-heading font-bold tracking-tight text-primary flex-1">
          Admin
        </Typography>

        <Avatar
          onClick={(e) => setAnchor(e.currentTarget)}
          className="bg-primary cursor-pointer text-sm font-semibold"
          sx={{ width: 36, height: 36 }}
        >
          {initials}
        </Avatar>

        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          className="mt-1"
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem disabled>
            <Typography variant="body2" className="text-text-secondary">{email}</Typography>
          </MenuItem>
          <MenuItem
            onClick={async () => {
              setAnchor(null)
              await signOut()
              navigate('/login', { replace: true })
            }}
          >
            Sign out
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}

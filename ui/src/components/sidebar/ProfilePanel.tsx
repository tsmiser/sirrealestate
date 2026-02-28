import { Avatar, Box, Divider, Typography } from '@mui/material'
import type { UserProfile } from '@/hooks/useUserProfile'

interface ProfilePanelProps {
  profile: UserProfile | null
}

function getInitials(profile: UserProfile): string {
  if (profile.firstName && profile.lastName) {
    return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
  }
  return profile.email?.[0]?.toUpperCase() ?? '?'
}

export default function ProfilePanel({ profile }: ProfilePanelProps) {
  if (!profile) {
    return (
      <Typography variant="caption" className="text-text-secondary px-2.5">
        Chat to fill in your profile →
      </Typography>
    )
  }

  const hasName = profile.firstName || profile.lastName
  const displayName = hasName
    ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
    : null
  const isIncomplete = !hasName || !profile.phone

  return (
    <Box className="flex flex-col gap-1.5 px-2.5">
      <Box className="flex items-center gap-2">
        <Avatar className="bg-primary/20 text-primary h-8 w-8 text-sm font-semibold">
          {getInitials(profile)}
        </Avatar>
        <Box className="min-w-0">
          {displayName && (
            <Typography variant="body2" className="font-medium truncate">
              {displayName}
            </Typography>
          )}
          <Typography variant="body2" className="text-text-secondary truncate text-xs">
            {profile.email}
          </Typography>
        </Box>
      </Box>

      {profile.phone && (
        <Typography variant="caption" className="text-text-secondary">
          {profile.phone}
        </Typography>
      )}
      {!profile.phone && (
        <Typography variant="caption" className="text-text-disabled">
          Phone: not yet collected
        </Typography>
      )}

      <Divider className="my-0.5" />

      {isIncomplete && (
        <Typography variant="caption" className="text-text-secondary italic">
          Chat to fill in your profile →
        </Typography>
      )}
    </Box>
  )
}

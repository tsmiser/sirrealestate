import { Typography } from '@mui/material'

interface LogoProps {
  className?: string
}

export default function Logo({ className }: LogoProps) {
  return (
    <Typography
      variant="h5"
      component="span"
      className={`text-primary font-heading font-bold tracking-tight ${className ?? ''}`}
    >
      SirRealtor
    </Typography>
  )
}

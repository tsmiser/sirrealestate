// Nexture icon types and size helpers — only the subset of icons used by SirRealtor is included.

export type IconSize = 'large' | 'medium' | 'small' | 'tiny' | number
export type IconVariant = 'outlined' | 'contained'

export type NextureIconsProps = {
  variant?: IconVariant
  className?: string
  size?: IconSize
  strokeWidth?: number
  oneTone?: boolean
}

export const sizeHelper = (size: NextureIconsProps['size']) => {
  if (typeof size === 'number') return size
  if (size === 'large') return 24
  if (size === 'small' || size === 'tiny') return 16
  return 20
}

export const strokeSizeHelper = (size: number) => {
  if (size === 32) return 1.15
  if (size >= 20) return 1.5
  return 1.75
}

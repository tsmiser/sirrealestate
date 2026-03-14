import { NextureIconsProps, sizeHelper, strokeSizeHelper } from '../nexture-icons'

export default function NiClose({ className, size = 'medium' }: NextureIconsProps) {
  const iconSize = sizeHelper(size)
  const iconStrokeWidth = strokeSizeHelper(iconSize)
  return (
    <svg
      width={iconSize}
      height={iconSize}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth={iconStrokeWidth}
        strokeLinecap="round"
      />
    </svg>
  )
}

import { NextureIconsProps, sizeHelper, strokeSizeHelper } from "../nexture-icons"

export default function NiBell({ className, size = "medium" }: NextureIconsProps) {
  const iconSize = sizeHelper(size)
  const sw = strokeSizeHelper(iconSize)

  return (
    <svg
      width={iconSize}
      height={iconSize}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bell body */}
      <path
        d="M6 10.5C6 7.46 8.24 5 11 4.17V3.5C11 2.67 11.45 2 12 2C12.55 2 13 2.67 13 3.5V4.17C15.76 5 18 7.46 18 10.5V15L20 17H4L6 15V10.5Z"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Clapper */}
      <path
        d="M10 19C10 20.1 10.9 21 12 21C13.1 21 14 20.1 14 19"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </svg>
  )
}

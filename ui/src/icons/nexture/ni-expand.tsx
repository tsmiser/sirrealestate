import { NextureIconsProps, sizeHelper, strokeSizeHelper } from "../nexture-icons";

export default function NiExpand({
  className,
  variant = "outlined",
  size = "medium",
  oneTone = false,
}: NextureIconsProps) {
  const iconSize = sizeHelper(size);
  const iconStrokeWidth = strokeSizeHelper(iconSize);

  return (
    <svg
      width={iconSize}
      height={iconSize}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top-right arrowhead */}
      <path
        d="M14 4H20V10"
        stroke="currentColor"
        strokeWidth={iconStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Diagonal line */}
      <path
        opacity={oneTone ? 1 : variant === "contained" ? 0.4 : 0.6}
        d="M20 4L4 20"
        stroke="currentColor"
        strokeWidth={iconStrokeWidth}
        strokeLinecap="round"
      />
      {/* Bottom-left arrowhead */}
      <path
        d="M10 20H4V14"
        stroke="currentColor"
        strokeWidth={iconStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

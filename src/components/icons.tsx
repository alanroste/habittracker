import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function TodayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="3.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3M16 3v3" />
      <path d="M8.25 14l2 2 4.25-4.5" />
    </svg>
  )
}

export function StatsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V10.5" />
      <path d="M12 20V4" />
      <path d="M20 20v-6.5" />
      <path d="M3 20h18" />
    </svg>
  )
}

export function FriendsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8.5" r="3.25" />
      <path d="M2.75 19c.7-3.2 3.2-5 6.25-5s5.55 1.8 6.25 5" />
      <path d="M15.5 6.2c1.4.35 2.4 1.6 2.4 3.05 0 1.25-.75 2.35-1.85 2.85" />
      <path d="M16.75 14.2c2.4.5 4.05 2.1 4.5 4.3" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2.06 2.06 0 1 1-2.92 2.92l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56v.18a2.06 2.06 0 1 1-4.12 0v-.1a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2.06 2.06 0 1 1-2.92-2.92l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03h-.18a2.06 2.06 0 1 1 0-4.12h.1A1.7 1.7 0 0 0 4.2 7.24a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.06 2.06 0 1 1 2.92-2.92l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1.03-1.56v-.18a2.06 2.06 0 1 1 4.12 0v.1a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2.06 2.06 0 1 1 2.92 2.92l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03h.18a2.06 2.06 0 1 1 0 4.12h-.1a1.7 1.7 0 0 0-1.55 1.03z" />
    </svg>
  )
}

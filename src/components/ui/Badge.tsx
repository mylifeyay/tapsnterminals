import type { ReactNode } from 'react'

type Tone = 'green' | 'amber' | 'blue' | 'red' | 'muted'

const TONES: Record<Tone, string> = {
  green: 'border-crt-green/50 text-crt-green bg-crt-green/10',
  amber: 'border-crt-amber/50 text-crt-amber bg-crt-amber/10',
  blue: 'border-crt-blue/50 text-crt-blue bg-crt-blue/10',
  red: 'border-crt-red/50 text-crt-red bg-crt-red/10',
  muted: 'border-crt-line text-crt-muted bg-transparent',
}

export function Badge({ tone = 'muted', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1 py-px text-[10px] font-semibold uppercase leading-tight tracking-wider ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

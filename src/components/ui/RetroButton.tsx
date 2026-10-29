import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'amber' | 'blue' | 'danger' | 'ghost'
type Size = 'xs' | 'sm' | 'md'

const VARIANTS: Record<Variant, string> = {
  primary: 'border-crt-green text-crt-green hover:bg-crt-green hover:text-crt-bg',
  amber: 'border-crt-amber text-crt-amber hover:bg-crt-amber hover:text-crt-bg',
  blue: 'border-crt-blue text-crt-blue hover:bg-crt-blue hover:text-white',
  danger: 'border-crt-red text-crt-red hover:bg-crt-red hover:text-crt-bg',
  ghost: 'border-crt-line text-crt-muted hover:border-crt-text hover:text-crt-text',
}

const SIZES: Record<Size, string> = {
  xs: 'px-1.5 py-0.5 text-[11px]',
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  active?: boolean
}

export function RetroButton({ variant = 'primary', size = 'sm', active, className = '', ...rest }: Props) {
  const activeCls = active ? 'bg-white/10 shadow-glow' : ''
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex select-none items-center justify-center gap-1.5 rounded-sm border font-mono font-semibold uppercase tracking-wide transition-colors disabled:pointer-events-none disabled:opacity-35 ${VARIANTS[variant]} ${SIZES[size]} ${activeCls} ${className}`}
    />
  )
}

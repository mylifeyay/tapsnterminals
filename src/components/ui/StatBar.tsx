interface Props {
  value: number
  max?: number
  label?: string
  /** Colour thresholds: below `low` is red, below `mid` amber, else green. */
  low?: number
  mid?: number
  segments?: number
}

/** Segmented retro meter, e.g. ▮▮▮▮▮▯▯▯▯▯ */
export function StatBar({ value, max = 100, label, low = 0.3, mid = 0.6, segments = 10 }: Props) {
  const ratio = Math.max(0, Math.min(1, value / max))
  const filled = Math.round(ratio * segments)
  const color = ratio < low ? 'bg-crt-red' : ratio < mid ? 'bg-crt-amber' : 'bg-crt-green'
  return (
    <div className="flex items-center gap-1.5" title={`${label ?? ''} ${Math.round(value)}/${max}`}>
      {label && <span className="w-7 shrink-0 text-[10px] uppercase text-crt-muted">{label}</span>}
      <div className="flex gap-px">
        {Array.from({ length: segments }, (_, i) => (
          <span key={i} className={`h-2 w-1.5 ${i < filled ? color : 'bg-crt-line'}`} />
        ))}
      </div>
      <span className="w-6 text-right text-[10px] tabular-nums text-crt-muted">{Math.round(value)}</span>
    </div>
  )
}

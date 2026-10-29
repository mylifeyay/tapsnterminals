import { useEffect } from 'react'
import { formatMoney } from '../../engine/Economy'
import { useGameStore } from '../../store/useGameStore'

const TOAST_MS = 5000

export function ResolutionToast() {
  const res = useGameStore((s) => s.lastResolution)
  const region = useGameStore((s) => s.region)
  const dismiss = useGameStore((s) => s.dismissResolution)

  useEffect(() => {
    if (!res) return
    const id = window.setTimeout(dismiss, TOAST_MS)
    return () => window.clearTimeout(id)
  }, [res, dismiss])

  if (!res) return null
  const { effects } = res
  const border = res.outcome === 'success' ? 'border-crt-green' : res.outcome === 'fail' ? 'border-crt-red' : 'border-crt-line'
  const label = res.outcome === 'success' ? 'SUCCESS' : res.outcome === 'fail' ? 'IT WENT SIDEWAYS' : 'IGNORED'

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center px-3 md:top-16">
      <button
        type="button"
        onClick={dismiss}
        className={`pointer-events-auto w-full max-w-sm rounded-sm border-2 bg-crt-panel px-3 py-2 text-left shadow-xl ${border}`}
      >
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-crt-muted">
          <span>{res.title}</span>
          <span>{label}</span>
        </div>
        <p className="mt-1 text-xs text-crt-text">{res.text}</p>
        <div className="mt-1 flex flex-wrap gap-3 text-[11px] font-bold tabular-nums">
          {effects.cash ? (
            <span className={effects.cash > 0 ? 'text-crt-green' : 'text-crt-red'}>
              {effects.cash > 0 ? '+' : ''}
              {formatMoney(effects.cash, region)}
            </span>
          ) : null}
          {effects.prestige ? (
            <span className={effects.prestige > 0 ? 'text-crt-amber' : 'text-crt-red'}>
              {effects.prestige > 0 ? '+' : ''}
              {effects.prestige} prestige
            </span>
          ) : null}
          {effects.morale ? <span className="text-crt-blue">+{effects.morale} morale</span> : null}
        </div>
      </button>
    </div>
  )
}

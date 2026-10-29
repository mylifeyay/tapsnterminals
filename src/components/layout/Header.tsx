import { Beer, Coins, DoorOpen, MapPin, Moon, Star } from 'lucide-react'
import { useState } from 'react'
import { formatMoney, REGIONS } from '../../engine/Economy'
import { nextDay, startService } from '../../engine/GameLoop'
import { formatClock } from '../../engine/layout'
import { useGameStore } from '../../store/useGameStore'
import { Badge } from '../ui/Badge'
import { RetroButton } from '../ui/RetroButton'
import { TimeControls } from './TimeControls'

const PHASE_LABEL = { TERMINAL: 'PREP', SERVICE: 'SERVICE', SETTLEMENT: 'SETTLEMENT' } as const
const PHASE_TONE = { TERMINAL: 'blue', SERVICE: 'green', SETTLEMENT: 'amber' } as const

function Clock() {
  const minute = useGameStore((s) => Math.floor(s.clock))
  const phase = useGameStore((s) => s.currentPhase)
  if (phase !== 'SERVICE') return null
  return <span className="tabular-nums text-crt-amber">{formatClock(minute)}</span>
}

export function Header() {
  const day = useGameStore((s) => s.day)
  const phase = useGameStore((s) => s.currentPhase)
  const cash = useGameStore((s) => s.cash)
  const prestige = useGameStore((s) => Math.round(s.prestige))
  const region = useGameStore((s) => s.region)
  const [error, setError] = useState<string | null>(null)

  const open = () => {
    const err = startService()
    setError(err)
    if (err) setTimeout(() => setError(null), 3000)
  }

  return (
    <header className="safe-top z-20 border-b border-crt-line bg-crt-shell">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2">
        <div className="flex items-center gap-2">
          <Beer className="text-crt-amber" size={18} aria-hidden />
          <h1 className="font-pixel text-[10px] leading-none text-crt-green text-glow sm:text-xs">
            TAPS<span className="text-crt-amber">&amp;</span>TERMINALS
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-crt-muted">
            DAY <span className="font-bold text-crt-text">{day}</span>
          </span>
          <Badge tone={PHASE_TONE[phase]}>{PHASE_LABEL[phase]}</Badge>
          <Clock />
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs tabular-nums">
          <span className="hidden items-center gap-1 text-crt-muted sm:flex" title={REGIONS[region].label}>
            <MapPin size={12} /> {REGIONS[region].city}
          </span>
          <span className={`flex items-center gap-1 font-bold ${cash < 0 ? 'text-crt-red' : 'text-crt-green'}`} title="Cash">
            <Coins size={12} /> {formatMoney(cash, region)}
          </span>
          <span className="flex items-center gap-1 text-crt-amber" title="Prestige (0–100)">
            <Star size={12} /> {prestige}
          </span>
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          {error && <span className="text-[11px] text-crt-red">{error}</span>}
          {phase === 'TERMINAL' && (
            <RetroButton size="sm" onClick={open} className="w-full sm:w-auto">
              <DoorOpen size={14} /> Open doors
            </RetroButton>
          )}
          {phase === 'SERVICE' && <TimeControls />}
          {phase === 'SETTLEMENT' && (
            <RetroButton size="sm" variant="amber" onClick={nextDay} className="w-full sm:w-auto">
              <Moon size={14} /> Start day {day + 1}
            </RetroButton>
          )}
        </div>
      </div>
    </header>
  )
}

import { FastForward, Pause, Play, SkipForward } from 'lucide-react'
import { setSpeed, skipToEndOfDay } from '../../engine/GameLoop'
import { useGameStore } from '../../store/useGameStore'
import type { GameSpeed } from '../../types/game'
import { ConfirmButton } from '../ui/ConfirmButton'
import { RetroButton } from '../ui/RetroButton'

const SPEEDS: { speed: GameSpeed; label: string }[] = [
  { speed: 1, label: '1×' },
  { speed: 2, label: '2×' },
  { speed: 4, label: '4×' },
]

export function TimeControls() {
  const speed = useGameStore((s) => s.speed)
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Time controls">
      <RetroButton
        variant={speed === 0 ? 'amber' : 'ghost'}
        active={speed === 0}
        size="xs"
        onClick={() => setSpeed(speed === 0 ? 1 : 0)}
        aria-label={speed === 0 ? 'Resume' : 'Pause'}
        title={speed === 0 ? 'Resume' : 'Pause'}
        className="h-7 w-7 !px-0"
      >
        {speed === 0 ? <Play size={13} /> : <Pause size={13} />}
      </RetroButton>
      {SPEEDS.map(({ speed: s, label }) => (
        <RetroButton
          key={s}
          size="xs"
          variant={speed === s ? 'primary' : 'ghost'}
          active={speed === s}
          onClick={() => setSpeed(s)}
          className="h-7 min-w-8"
          aria-pressed={speed === s}
        >
          {s === 4 ? <FastForward size={12} /> : null}
          {label}
        </RetroButton>
      ))}
      <ConfirmButton
        size="xs"
        variant="amber"
        onConfirm={skipToEndOfDay}
        confirmLabel="Skip?"
        className="h-7"
        title="Skip to end of day (remaining events are ignored)"
      >
        <SkipForward size={12} />
        <span className="hidden lg:inline">End day</span>
      </ConfirmButton>
    </div>
  )
}

import { DoorOpen, Pause } from 'lucide-react'
import { startService } from '../../engine/GameLoop'
import { formatClock } from '../../engine/layout'
import { useGameStore } from '../../store/useGameStore'
import type { LogLine } from '../../types/game'
import { RetroButton } from '../ui/RetroButton'
import { BarFloorCanvas } from './BarFloorCanvas'
import { BubbleLayer } from './DialogueBubble'

const LOG_TONE: Record<LogLine['tone'], string> = {
  info: 'text-crt-muted',
  good: 'text-crt-green',
  bad: 'text-crt-red',
  event: 'text-crt-amber',
}

function PhaseOverlay() {
  const phase = useGameStore((s) => s.currentPhase)
  const paused = useGameStore((s) => s.speed === 0)
  const setTab = useGameStore((s) => s.setTab)
  const setView = useGameStore((s) => s.setView)

  if (phase === 'SERVICE') {
    return paused ? (
      <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-sm bg-black/70 px-2 py-1 text-[11px] font-bold text-crt-amber">
        <Pause size={11} /> PAUSED
      </div>
    ) : null
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-3">
      <div className="rounded-sm border border-crt-line bg-crt-bg/85 px-4 py-3 text-center backdrop-blur-sm">
        {phase === 'TERMINAL' ? (
          <>
            <p className="font-pixel text-[10px] leading-relaxed text-crt-amber">CLOSED</p>
            <p className="mt-1 text-[11px] text-crt-muted">Prep in the terminal — stock up, set prices — then open.</p>
            <RetroButton className="mt-2" onClick={() => startService()}>
              <DoorOpen size={13} /> Open doors
            </RetroButton>
          </>
        ) : (
          <>
            <p className="font-pixel text-[10px] leading-relaxed text-crt-amber">CLOSED FOR THE NIGHT</p>
            <RetroButton
              className="mt-2"
              variant="amber"
              onClick={() => {
                setTab('LEDGER')
                setView('TERMINAL')
              }}
            >
              View ledger
            </RetroButton>
          </>
        )}
      </div>
    </div>
  )
}

function FloorStats() {
  const seated = useGameStore((s) => s.patrons.filter((p) => p.state === 'WAITING' || p.state === 'DRINKING').length)
  const queue = useGameStore((s) => s.orderQueue.length)
  const served = useGameStore((s) => s.today.patronsServed)
  const lost = useGameStore((s) => s.today.patronsLost)
  const drinks = useGameStore((s) => s.today.drinksSold)
  const stat = (label: string, value: number, tone = 'text-crt-text') => (
    <div className="flex flex-col items-center rounded-sm border border-crt-line bg-crt-panel/60 px-1 py-1">
      <span className={`text-sm font-bold tabular-nums ${tone}`}>{value}</span>
      <span className="text-[9px] uppercase tracking-widest text-crt-muted">{label}</span>
    </div>
  )
  return (
    <div className="grid shrink-0 grid-cols-5 gap-1.5">
      {stat('Seated', seated)}
      {stat('Queue', queue, queue > 4 ? 'text-crt-amber' : 'text-crt-text')}
      {stat('Served', served, 'text-crt-green')}
      {stat('Drinks', drinks)}
      {stat('Walked', lost, lost ? 'text-crt-red' : 'text-crt-text')}
    </div>
  )
}

function ActivityLog() {
  const log = useGameStore((s) => s.log)
  return (
    <div className="crt-scanlines min-h-[7rem] flex-1 overflow-y-auto rounded-sm border border-crt-line bg-crt-bg p-2 font-mono text-[11px] leading-relaxed">
      {log.length === 0 && <p className="text-crt-muted">&gt; floor feed idle_</p>}
      {log.map((l) => (
        <p key={l.id} className={LOG_TONE[l.tone]}>
          <span className="text-crt-line">[{formatClock(l.clock)}]</span> {l.text}
        </p>
      ))}
    </div>
  )
}

export function FloorView() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      <div className="shrink-0 overflow-hidden rounded-sm border border-crt-line bg-black">
        <div className="aspect-w-16 aspect-h-9">
          <div>
            <BarFloorCanvas />
            <BubbleLayer />
            <PhaseOverlay />
          </div>
        </div>
      </div>
      <FloorStats />
      <ActivityLog />
    </div>
  )
}

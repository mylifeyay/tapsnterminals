import { WORLD } from '../../engine/layout'
import { useGameStore } from '../../store/useGameStore'
import type { SpeechBubble } from '../../types/game'

const TONE: Record<SpeechBubble['tone'], string> = {
  order: 'border-crt-text bg-[#f5f0e1] text-crt-bg',
  chat: 'border-crt-line bg-crt-panel text-crt-text',
  complaint: 'border-crt-red bg-crt-red text-crt-bg',
  event: 'border-crt-amber bg-crt-amber text-crt-bg animate-pulse',
}

interface Props {
  x: number
  y: number
  bubble: SpeechBubble
  onClick?: () => void
}

/** A speech bubble anchored above a patron's head, in world coordinates. */
export function DialogueBubble({ x, y, bubble, onClick }: Props) {
  const event = bubble.tone === 'event'
  return (
    <div
      className="animate-pop pointer-events-none absolute z-10"
      style={{
        left: `${(x / WORLD.w) * 100}%`,
        top: `${((y - 20) / WORLD.h) * 100}%`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div
        onClick={onClick}
        className={`relative max-w-[9rem] whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[9px] font-bold leading-tight shadow md:text-[11px] ${TONE[bubble.tone]} ${
          event ? 'pointer-events-auto cursor-pointer px-2 text-xs' : 'truncate'
        }`}
      >
        {bubble.text}
        <span
          className={`absolute left-1/2 top-full h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r ${TONE[bubble.tone]}`}
        />
      </div>
    </div>
  )
}

export function BubbleLayer() {
  const patrons = useGameStore((s) => s.patrons)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {patrons.map((p) =>
        p.bubble ? <DialogueBubble key={p.id} x={p.position.x} y={p.position.y} bubble={p.bubble} /> : null,
      )}
    </div>
  )
}

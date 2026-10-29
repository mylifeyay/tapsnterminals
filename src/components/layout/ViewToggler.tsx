import { useGameStore } from '../../store/useGameStore'
import type { ActiveView } from '../../types/game'

const TABS: { id: ActiveView; icon: string; label: string }[] = [
  { id: 'FLOOR', icon: '🍻', label: 'Bar Floor' },
  { id: 'TERMINAL', icon: '🖥️', label: 'Terminal' },
]

/** Mobile-only bottom tab bar switching between the two full-screen views. */
export function ViewToggler() {
  const view = useGameStore((s) => s.activeView)
  const setView = useGameStore((s) => s.setView)
  const unread = useGameStore((s) => s.emails.filter((e) => !e.read && e.day === s.day).length)
  const eventLive = useGameStore((s) => s.activeEvent !== null)

  return (
    <nav className="safe-bottom z-20 grid grid-cols-2 border-t border-crt-line bg-crt-shell" aria-label="Views">
      {TABS.map((t) => {
        const active = view === t.id
        const dot = (t.id === 'TERMINAL' && unread > 0) || (t.id === 'FLOOR' && eventLive && !active)
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(t.id)}
            aria-current={active ? 'page' : undefined}
            className={`relative flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
              active ? 'bg-crt-green/10 text-crt-green' : 'text-crt-muted'
            }`}
          >
            {active && <span className="absolute inset-x-6 top-0 h-0.5 bg-crt-green" />}
            <span aria-hidden className="text-base">
              {t.icon}
            </span>
            [{t.label}]
            {dot && <span className="absolute right-[22%] top-2 h-2 w-2 animate-pulse rounded-full bg-crt-amber" />}
          </button>
        )
      })}
    </nav>
  )
}

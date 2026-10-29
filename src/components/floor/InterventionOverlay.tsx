import { AlertTriangle, Lock, Timer } from 'lucide-react'
import { ARCHETYPES } from '../../engine/archetypes'
import { isOptionAvailable, resolveEvent, successChance } from '../../engine/Events'
import { useGameStore } from '../../store/useGameStore'
import { RetroButton } from '../ui/RetroButton'

/**
 * The 12-second timed intervention. Pick an action, or let the timer run out
 * (equivalent to Ignore) for the event's neutral outcome.
 */
export function InterventionOverlay() {
  const active = useGameStore((s) => s.activeEvent)
  const staff = useGameStore((s) => s.staff)
  const speakerArchetype = useGameStore((s) => s.patrons.find((p) => p.id === s.activeEvent?.speakerPatronId)?.archetype)
  if (!active) return null

  const { event, timeLeft, speakerName } = active
  const ratio = Math.max(0, timeLeft / event.timeoutSeconds)
  const urgent = timeLeft < 4

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 flex justify-center p-2 md:inset-auto md:bottom-6 md:left-6 md:w-[min(28rem,55vw)]">
      <div
        role="alertdialog"
        aria-labelledby="event-title"
        aria-describedby="event-dialogue"
        className={`pointer-events-auto w-full max-w-md rounded-sm border-2 bg-crt-panel shadow-2xl ${urgent ? 'border-crt-red' : 'border-crt-amber'}`}
      >
        <div className="h-1.5 w-full bg-crt-line">
          <div
            className={`h-full transition-[width] duration-100 ease-linear ${urgent ? 'bg-crt-red' : 'bg-crt-amber'}`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-2 border-b border-crt-line px-3 py-1.5">
          <AlertTriangle size={14} className="text-crt-amber" />
          <h2 id="event-title" className="text-xs font-bold uppercase tracking-widest text-crt-amber">
            {event.title}
          </h2>
          <span className={`ml-auto flex items-center gap-1 text-xs font-bold tabular-nums ${urgent ? 'animate-pulse text-crt-red' : 'text-crt-text'}`}>
            <Timer size={12} /> {Math.ceil(timeLeft)}s
          </span>
        </div>

        <div className="space-y-2 p-3">
          <p className="text-[11px] text-crt-muted">
            {speakerName}
            {speakerArchetype && <> · {ARCHETYPES[speakerArchetype].label}</>}
          </p>
          <p id="event-dialogue" className="border-l-2 border-crt-amber pl-2 text-sm italic leading-snug text-crt-text">
            “{event.dialogue}”
          </p>

          <div className="grid gap-1.5 pt-1">
            {event.interventions.map((opt) => {
              const available = isOptionAvailable(opt, staff)
              const chance = successChance(opt, staff)
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!available}
                  onClick={() => resolveEvent(opt.id)}
                  className="group flex items-start gap-2 rounded-sm border border-crt-green/60 px-2 py-1.5 text-left transition-colors hover:bg-crt-green/10 disabled:border-crt-line disabled:opacity-50"
                >
                  <span className="text-crt-green">{available ? '▶' : <Lock size={11} className="mt-0.5" />}</span>
                  <span className="flex-1">
                    <span className="block text-xs font-bold text-crt-green">{opt.label}</span>
                    <span className="block text-[11px] text-crt-muted">
                      {available ? opt.description : `Needs a ${opt.requiresRole?.toLowerCase()} on staff.`}
                    </span>
                  </span>
                  {available && opt.check && (
                    <span
                      className={`shrink-0 text-[11px] font-bold tabular-nums ${chance >= 0.7 ? 'text-crt-green' : chance >= 0.45 ? 'text-crt-amber' : 'text-crt-red'}`}
                      title={`${opt.check.stat} check`}
                    >
                      {Math.round(chance * 100)}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <RetroButton variant="ghost" size="sm" className="w-full" onClick={() => resolveEvent(null)}>
            Ignore
          </RetroButton>
        </div>
      </div>
    </div>
  )
}

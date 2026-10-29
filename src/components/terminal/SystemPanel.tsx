import { Download, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { REGIONS } from '../../engine/Economy'
import { useGameStore } from '../../store/useGameStore'
import { useInventoryStore } from '../../store/useInventoryStore'
import type { Region } from '../../types/game'
import { Modal } from '../ui/Modal'
import { Panel } from '../ui/Panel'
import { RetroButton } from '../ui/RetroButton'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

export function SystemPanel() {
  const region = useGameStore((s) => s.region)
  const phase = useGameStore((s) => s.currentPhase)
  const setRegion = useGameStore((s) => s.setRegion)
  const resetGame = useGameStore((s) => s.resetGame)
  const resetInventory = useInventoryStore((s) => s.reset)
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  return (
    <div className="space-y-3">
      <Panel title="Region">
        <p className="mb-2 text-[11px] text-crt-muted">
          Region changes supplier costs, wages, foot traffic and how price-sensitive patrons are. Relocation is only
          possible during prep.
        </p>
        <div className="grid gap-1.5">
          {(Object.keys(REGIONS) as Region[]).map((r) => {
            const p = REGIONS[r]
            return (
              <button
                key={r}
                type="button"
                disabled={phase !== 'TERMINAL'}
                onClick={() => setRegion(r)}
                className={`rounded-sm border px-2 py-1.5 text-left text-xs transition-colors disabled:opacity-40 ${
                  region === r ? 'border-crt-green bg-crt-green/10 text-crt-green' : 'border-crt-line hover:border-crt-text'
                }`}
              >
                <div className="font-bold">
                  [{r}] {p.label} — {p.city}
                </div>
                <div className="text-[11px] text-crt-muted">
                  cost ×{p.costMultiplier} · wages ×{p.wageMultiplier} · traffic ×{p.footTraffic} · price sensitivity ×
                  {p.priceElasticity}
                </div>
              </button>
            )
          })}
        </div>
      </Panel>

      <Panel title="Install">
        <p className="mb-2 text-[11px] text-crt-muted">
          Taps &amp; Terminals is a PWA — install it to your home screen to play offline.
        </p>
        <RetroButton variant="blue" disabled={!installEvt} onClick={() => installEvt?.prompt()}>
          <Download size={12} /> {installEvt ? 'Install app' : 'Use browser menu → Add to Home Screen'}
        </RetroButton>
      </Panel>

      <Panel title="Save data">
        <p className="mb-2 text-[11px] text-crt-muted">Progress autosaves to this device.</p>
        <RetroButton variant="danger" onClick={() => setConfirmReset(true)}>
          <RotateCcw size={12} /> New game
        </RetroButton>
      </Panel>

      <Modal open={confirmReset} title="Start over?" tone="red" onClose={() => setConfirmReset(false)}>
        <p className="mb-3 text-xs text-crt-text">
          This wipes your cash, staff, stock and history. Your current region is kept.
        </p>
        <div className="flex justify-end gap-2">
          <RetroButton variant="ghost" onClick={() => setConfirmReset(false)}>
            Cancel
          </RetroButton>
          <RetroButton
            variant="danger"
            onClick={() => {
              resetGame()
              resetInventory()
              setConfirmReset(false)
            }}
          >
            Wipe save
          </RetroButton>
        </div>
      </Modal>
    </div>
  )
}

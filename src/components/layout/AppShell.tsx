import { useIsDesktop } from '../../hooks'
import { useGameStore } from '../../store/useGameStore'
import { FloorView } from '../floor/FloorView'
import { InterventionOverlay } from '../floor/InterventionOverlay'
import { ResolutionToast } from '../floor/ResolutionToast'
import { TerminalOS } from '../terminal/TerminalOS'
import { Header } from './Header'
import { ViewToggler } from './ViewToggler'

export function AppShell() {
  const isDesktop = useIsDesktop()
  const view = useGameStore((s) => s.activeView)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-crt-bg">
      <Header />
      {isDesktop ? (
        <main className="flex min-h-0 flex-1 gap-3 p-3">
          <div className="flex min-w-0 flex-[1.25] flex-col">
            <FloorView />
          </div>
          <div className="flex min-w-[360px] max-w-[640px] flex-1 flex-col">
            <TerminalOS />
          </div>
        </main>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col p-2">
          {view === 'FLOOR' ? <FloorView /> : <TerminalOS />}
        </main>
      )}
      {!isDesktop && <ViewToggler />}
      <InterventionOverlay />
      <ResolutionToast />
    </div>
  )
}

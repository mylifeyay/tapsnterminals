import { Cog, Mail, Package, ReceiptText, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { TerminalTab } from '../../types/game'
import { EmailClient } from './EmailClient'
import { HRTerminal } from './HRTerminal'
import { InventoryManager } from './InventoryManager'
import { Ledger } from './Ledger'
import { SystemPanel } from './SystemPanel'

const TABS: { id: TerminalTab; label: string; icon: ReactNode }[] = [
  { id: 'INBOX', label: 'Inbox', icon: <Mail size={13} /> },
  { id: 'CELLAR', label: 'Cellar', icon: <Package size={13} /> },
  { id: 'HR', label: 'HR', icon: <Users size={13} /> },
  { id: 'LEDGER', label: 'Ledger', icon: <ReceiptText size={13} /> },
  { id: 'SYS', label: 'Sys', icon: <Cog size={13} /> },
]

const PATHS: Record<TerminalTab, string> = {
  INBOX: '~/mail',
  CELLAR: '~/cellar',
  HR: '~/hr',
  LEDGER: '~/ledger',
  SYS: '~/sys',
}

export function TerminalOS() {
  const tab = useGameStore((s) => s.terminalTab)
  const setTab = useGameStore((s) => s.setTab)
  const unread = useGameStore((s) => s.emails.filter((e) => !e.read).length)

  return (
    <div className="crt-scanlines flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-crt-line bg-crt-bg">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-crt-line bg-crt-shell px-2.5 py-1.5 text-[11px]">
        <span className="flex gap-1" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-crt-red/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-crt-amber/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-crt-green/80" />
        </span>
        <span className="truncate text-crt-muted">
          taps-os v1.0 — <span className="text-crt-green">backoffice@bar</span>:{PATHS[tab]}
        </span>
      </div>

      <nav className="flex overflow-x-auto border-b border-crt-line bg-crt-panel" role="tablist">
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`relative flex shrink-0 items-center gap-1.5 border-r border-crt-line px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                active ? 'bg-crt-bg text-crt-green text-glow' : 'text-crt-muted hover:text-crt-text'
              }`}
            >
              {t.icon}
              {t.label}
              {t.id === 'INBOX' && unread > 0 && (
                <span className="rounded-sm bg-crt-amber px-1 text-[10px] text-crt-bg">{unread}</span>
              )}
              {active && <span className="absolute inset-x-0 -bottom-px h-px bg-crt-bg" />}
            </button>
          )
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-2.5" role="tabpanel">
        {tab === 'INBOX' && <EmailClient />}
        {tab === 'CELLAR' && <InventoryManager />}
        {tab === 'HR' && <HRTerminal />}
        {tab === 'LEDGER' && <Ledger />}
        {tab === 'SYS' && <SystemPanel />}
      </div>
    </div>
  )
}

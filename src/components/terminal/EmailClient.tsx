import { ArrowLeft, Mail, MailOpen, Tag } from 'lucide-react'
import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { Email } from '../../types/game'
import { Badge } from '../ui/Badge'
import { RetroButton } from '../ui/RetroButton'

function senderName(from: string) {
  return from.replace(/\s*<.*>/, '')
}

function PromoBadge({ email, day }: { email: Email; day: number }) {
  if (!email.promo) return null
  const live = email.promo.expiresDay >= day
  return (
    <Badge tone={live ? 'amber' : 'muted'}>
      <Tag size={9} /> {live ? `-${email.promo.discountPct}% today` : 'expired'}
    </Badge>
  )
}

export function EmailClient() {
  const emails = useGameStore((s) => s.emails)
  const day = useGameStore((s) => s.day)
  const markRead = useGameStore((s) => s.markEmailRead)
  const setTab = useGameStore((s) => s.setTab)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = emails.find((e) => e.id === openId)

  if (open) {
    return (
      <article className="space-y-3 text-sm">
        <RetroButton variant="ghost" size="xs" onClick={() => setOpenId(null)}>
          <ArrowLeft size={12} /> Back
        </RetroButton>
        <header className="space-y-1 border-b border-dashed border-crt-line pb-2 text-xs">
          <div>
            <span className="text-crt-muted">FROM: </span>
            <span className="text-crt-text">{open.from}</span>
          </div>
          <div>
            <span className="text-crt-muted">DATE: </span>Day {open.day}
          </div>
          <h2 className="pt-1 text-sm font-bold text-crt-green">{open.subject}</h2>
          <PromoBadge email={open} day={day} />
        </header>
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-crt-text">{open.body}</pre>
        {open.promo && open.promo.expiresDay >= day && (
          <RetroButton variant="amber" onClick={() => setTab('CELLAR')}>
            Order in Cellar →
          </RetroButton>
        )}
      </article>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11px] text-crt-muted">
        <span>
          {emails.length} message{emails.length === 1 ? '' : 's'} · {emails.filter((e) => !e.read).length} unread
        </span>
        <span className="animate-blink text-crt-green">█</span>
      </div>
      <ul className="divide-y divide-crt-line border border-crt-line">
        {emails.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => {
                setOpenId(e.id)
                markRead(e.id)
              }}
              className="flex w-full items-start gap-2 px-2 py-2 text-left hover:bg-crt-panel"
            >
              <span className={`mt-0.5 ${e.read ? 'text-crt-muted' : 'text-crt-green'}`}>
                {e.read ? <MailOpen size={13} /> : <Mail size={13} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[11px]">
                  <span className={`truncate ${e.read ? 'text-crt-muted' : 'font-bold text-crt-text'}`}>
                    {senderName(e.from)}
                  </span>
                  <span className="ml-auto shrink-0 text-crt-muted">D{e.day}</span>
                </span>
                <span className={`block truncate text-xs ${e.read ? 'text-crt-muted' : 'text-crt-green'}`}>{e.subject}</span>
                <PromoBadge email={e} day={day} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

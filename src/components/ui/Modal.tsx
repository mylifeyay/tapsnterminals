import type { ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  children: ReactNode
  onClose?: () => void
  tone?: 'green' | 'amber' | 'red'
}

const BORDER = { green: 'border-crt-green', amber: 'border-crt-amber', red: 'border-crt-red' }
const TEXT = { green: 'text-crt-green', amber: 'text-crt-amber', red: 'text-crt-red' }

export function Modal({ open, title, children, onClose, tone = 'green' }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full max-w-md rounded-sm border-2 bg-crt-panel shadow-2xl ${BORDER[tone]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between border-b border-crt-line px-3 py-2 text-xs font-bold uppercase tracking-widest ${TEXT[tone]}`}>
          <span>{title}</span>
          {onClose && (
            <button type="button" className="text-crt-muted hover:text-crt-text" onClick={onClose} aria-label="Close">
              [x]
            </button>
          )}
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  )
}

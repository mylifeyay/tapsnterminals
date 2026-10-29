import type { ReactNode } from 'react'

interface Props {
  title?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
}

export function Panel({ title, right, children, className = '' }: Props) {
  return (
    <section className={`rounded-sm border border-crt-line bg-crt-panel/60 ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-2 border-b border-crt-line px-2.5 py-1.5">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-crt-green">{title}</h3>
          {right}
        </header>
      )}
      <div className="p-2.5">{children}</div>
    </section>
  )
}

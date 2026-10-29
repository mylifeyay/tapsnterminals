import { useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { RetroButton } from './RetroButton'

interface Props extends Omit<ComponentProps<typeof RetroButton>, 'onClick'> {
  onConfirm: () => void
  confirmLabel?: ReactNode
}

/** Two-tap button: the first tap arms it, the second (within 3s) fires. */
export function ConfirmButton({ onConfirm, confirmLabel = 'Sure?', children, variant, ...rest }: Props) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const id = window.setTimeout(() => setArmed(false), 3000)
    return () => window.clearTimeout(id)
  }, [armed])

  return (
    <RetroButton
      {...rest}
      variant={armed ? 'danger' : variant}
      active={armed}
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else setArmed(true)
      }}
    >
      {armed ? confirmLabel : children}
    </RetroButton>
  )
}

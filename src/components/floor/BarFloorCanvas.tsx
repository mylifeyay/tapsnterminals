import { useEffect, useRef } from 'react'
import { BARTENDER_MIN_X, BARTENDER_Y, WORLD } from '../../engine/layout'
import { useGameStore } from '../../store/useGameStore'
import type { BartenderSim } from '../../types/game'
import { buildBackLayer, buildCounterLayer, drawBartender, drawPatron } from './sprites'

/**
 * Renders the bar floor at 320×180 and lets CSS scale it up with nearest-neighbour.
 * Reads simulation state straight from the store each frame (no React re-renders).
 */
export function BarFloorCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.imageSmoothingEnabled = false
    const back = buildBackLayer()
    const counter = buildCounterLayer()
    let raf = 0

    const draw = (t: number) => {
      const s = useGameStore.getState()
      const open = s.currentPhase === 'SERVICE'
      ctx.drawImage(back, 0, 0)

      // Outside service, show the bartending team idling behind the counter.
      const tenders: BartenderSim[] = open
        ? s.bartenders
        : s.staff
            .filter((m) => m.role === 'BARTENDER')
            .map((m, i) => ({ staffId: m.id, x: BARTENDER_MIN_X + 40 + i * 60, targetX: 0, servingPatronId: null, workLeft: 0 }))
      tenders.forEach((b, i) => drawBartender(ctx, b, BARTENDER_Y, i, t))
      ctx.drawImage(counter, 0, 0)

      const patrons = [...s.patrons].sort((a, b) => a.position.y - b.position.y)
      for (const p of patrons) drawPatron(ctx, p, t)

      if (!open) {
        ctx.fillStyle = 'rgba(8, 8, 16, 0.55)'
        ctx.fillRect(0, 0, WORLD.w, WORLD.h)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={ref}
      width={WORLD.w}
      height={WORLD.h}
      className="pixelated h-full w-full"
      role="img"
      aria-label="Pixel-art view of the bar floor"
    />
  )
}

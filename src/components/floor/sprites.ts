// Procedural pixel-art drawing for the bar floor (320×180 logical pixels).
import { BARTENDER_MAX_X, COUNTER, SEATS, TABLES, WORLD } from '../../engine/layout'
import type { BartenderSim, Patron } from '../../types/game'

const SKIN = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#d4a373']
const HAIR = ['#2d1b0e', '#111111', '#a0522d', '#e5c07b', '#5b5b5b', '#6b3e26']
const SHIRT = ['#3b82f6', '#e11d48', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6']

const px = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

// Deterministic pseudo-random for static decoration.
const hash = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function makeLayer(draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = WORLD.w
  c.height = WORLD.h
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  draw(ctx)
  return c
}

/** Walls, shelves, floor, furniture — everything behind the bartenders. */
export function buildBackLayer() {
  return makeLayer((ctx) => {
    // Wall
    px(ctx, 0, 0, WORLD.w, COUNTER.y, '#2a1f33')
    for (let y = 4; y < 54; y += 6)
      for (let x = (y / 6) % 2 ? 0 : 6; x < WORLD.w; x += 12) px(ctx, x, y, 11, 5, hash(x * 7 + y) > 0.5 ? '#2f2339' : '#30243a')
    // Wainscot
    px(ctx, 0, 54, WORLD.w, COUNTER.y - 54, '#3b2a22')
    for (let x = 0; x < WORLD.w; x += 14) px(ctx, x, 54, 1, COUNTER.y - 54, '#2c1f19')
    px(ctx, 0, 54, WORLD.w, 1, '#5a4031')

    // Back-bar shelves with bottles
    const bottleColors = ['#2e7d32', '#8d6e63', '#c62828', '#f9a825', '#1565c0', '#e0e0e0', '#6a1b9a']
    for (const shelfY of [30, 48]) {
      px(ctx, 26, shelfY, 232, 2, '#7a4f2a')
      px(ctx, 26, shelfY + 2, 232, 1, '#4a2f19')
      for (let i = 0, x = 30; x < 252; i++, x += 7) {
        if (hash(i + shelfY) < 0.12) continue
        const h = 6 + Math.floor(hash(i * 3 + shelfY) * 5)
        const c = bottleColors[Math.floor(hash(i * 5 + shelfY) * bottleColors.length)]
        px(ctx, x, shelfY - h, 4, h, c)
        px(ctx, x + 1, shelfY - h - 3, 2, 3, c)
        px(ctx, x + 1, shelfY - h + 2, 1, h - 3, 'rgba(255,255,255,0.25)')
      }
    }

    // Neon sign
    ctx.save()
    ctx.font = 'bold 7px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#00ff66'
    ctx.shadowBlur = 4
    ctx.strokeStyle = '#00ff66'
    ctx.strokeRect(96.5, 4.5, 108, 13)
    ctx.fillStyle = '#b6ffd0'
    ctx.fillText('TAPS & TERMINALS', 150, 11)
    ctx.restore()

    // Window with night sky
    px(ctx, 268, 8, 34, 36, '#5a4031')
    px(ctx, 270, 10, 30, 32, '#0d1b2a')
    for (let i = 0; i < 9; i++) px(ctx, 271 + hash(i) * 28, 11 + hash(i + 9) * 28, 1, 1, '#e8e8ff')
    px(ctx, 291, 14, 5, 5, '#f5f0c8')
    px(ctx, 292, 14, 4, 4, '#0d1b2a')
    px(ctx, 284, 10, 1, 32, '#5a4031')
    px(ctx, 270, 25, 30, 1, '#5a4031')

    // Floor planks
    for (let y = COUNTER.y; y < WORLD.h; y += 6) {
      px(ctx, 0, y, WORLD.w, 6, (y / 6) % 2 ? '#4a3426' : '#43301f')
      for (let k = 0; k < 6; k++) px(ctx, hash(y * 13 + k) * WORLD.w, y, 1, 6, '#36261a')
    }

    // Door (right wall)
    px(ctx, 296, 100, 24, 52, '#2c1f19')
    px(ctx, 298, 102, 20, 50, '#5c3a1e')
    px(ctx, 300, 106, 16, 18, '#6d4626')
    px(ctx, 300, 128, 16, 20, '#6d4626')
    px(ctx, 301, 126, 2, 3, '#c9a227')

    // Tables
    for (const t of TABLES) {
      px(ctx, t.x - 1, t.y - 2, 3, 10, '#2c1f19')
      px(ctx, t.x - 13, t.y - 6, 27, 6, '#7a4f2a')
      px(ctx, t.x - 13, t.y - 6, 27, 1, '#9c6a3a')
      px(ctx, t.x - 13, t.y, 27, 1, '#4a2f19')
    }

    // Bar stools
    for (const s of SEATS) {
      if (s.kind !== 'BAR') continue
      px(ctx, s.x - 1, s.y - 2, 2, 8, '#888')
      px(ctx, s.x - 4, s.y + 5, 8, 1, '#666')
      px(ctx, s.x - 4, s.y - 3, 8, 2, '#8b1e1e')
    }
  })
}

/** Counter, taps and lamp glow — drawn over the bartenders. */
export function buildCounterLayer() {
  return makeLayer((ctx) => {
    const { x, y, w, h } = COUNTER
    px(ctx, x, y, w, 4, '#a0703c')
    px(ctx, x, y, w, 1, '#c48a4d')
    px(ctx, x, y + 4, w, h - 4, '#5c3a1e')
    for (let i = x; i < x + w; i += 20) px(ctx, i, y + 5, 1, h - 6, '#4a2f19')
    px(ctx, x, y + h - 2, w, 1, '#c9a227')
    // Service pass at the end of the counter
    px(ctx, BARTENDER_MAX_X + 6, y - 1, 4, 1, '#c9a227')

    // Beer taps
    const handles = ['#00ff66', '#ffb000', '#e11d48', '#3b82f6']
    ;[64, 104, 144, 184].forEach((tx, i) => {
      px(ctx, tx, y - 7, 2, 7, '#c0c0c0')
      px(ctx, tx - 1, y - 7, 4, 1, '#e0e0e0')
      px(ctx, tx, y - 12, 2, 5, handles[i])
    })

    // Pendant lamps + warm glow
    for (const lx of [70, 150, 230]) {
      px(ctx, lx, 0, 1, 18, '#111')
      px(ctx, lx - 4, 18, 9, 3, '#c9a227')
      px(ctx, lx - 2, 21, 5, 1, '#fff2b3')
      const g = ctx.createRadialGradient(lx, 24, 2, lx, 50, 60)
      g.addColorStop(0, 'rgba(255,214,120,0.22)')
      g.addColorStop(1, 'rgba(255,214,120,0)')
      ctx.fillStyle = g
      ctx.fillRect(lx - 60, 18, 120, 100)
    }
  })
}

interface PersonStyle {
  skin: string
  hair: string
  shirt: string
  back?: boolean
  apron?: boolean
  accent?: 'tie' | 'hat' | 'glasses' | 'flush' | 'backpack'
}

/** 8×16 person with feet at (x, y). */
function drawPerson(ctx: CanvasRenderingContext2D, x: number, y: number, s: PersonStyle, bob = 0) {
  const left = Math.round(x - 4)
  const top = Math.round(y - 16 + bob)
  // Legs
  px(ctx, left + 1, top + 12, 2, 4, '#1f2937')
  px(ctx, left + 5, top + 12, 2, 4, '#1f2937')
  // Torso + arms
  px(ctx, left, top + 6, 8, 6, s.shirt)
  px(ctx, left - 1, top + 7, 1, 4, s.shirt)
  px(ctx, left + 8, top + 7, 1, 4, s.shirt)
  px(ctx, left - 1, top + 11, 1, 1, s.skin)
  px(ctx, left + 8, top + 11, 1, 1, s.skin)
  if (s.apron) px(ctx, left + 1, top + 8, 6, 5, '#111827')
  if (s.accent === 'tie' && !s.back) px(ctx, left + 3, top + 6, 2, 5, '#1e293b')
  if (s.accent === 'backpack') px(ctx, s.back ? left + 1 : left + 6, top + 6, s.back ? 6 : 1, s.back ? 5 : 6, '#7c2d12')
  // Head
  px(ctx, left + 1, top, 6, 6, s.skin)
  if (s.back) {
    px(ctx, left + 1, top, 6, 5, s.hair)
  } else {
    px(ctx, left + 1, top, 6, 2, s.hair)
    px(ctx, left + 2, top + 3, 1, 1, '#111')
    px(ctx, left + 5, top + 3, 1, 1, '#111')
    if (s.accent === 'glasses') px(ctx, left + 1, top + 3, 6, 1, 'rgba(20,20,20,0.7)')
    if (s.accent === 'flush') {
      px(ctx, left + 1, top + 4, 1, 1, '#ef4444')
      px(ctx, left + 6, top + 4, 1, 1, '#ef4444')
    }
  }
  if (s.accent === 'hat') {
    px(ctx, left - 1, top - 1, 10, 1, '#e7d3a1')
    px(ctx, left + 1, top - 3, 6, 2, '#e7d3a1')
  }
}

const ACCENT: Record<Patron['archetype'], PersonStyle['accent']> = {
  REGULAR: undefined,
  TOURIST: 'hat',
  OFFICE_WORKER: 'tie',
  STUDENT: 'backpack',
  CONNOISSEUR: 'glasses',
  ROWDY: 'flush',
}

export function drawBartender(ctx: CanvasRenderingContext2D, b: BartenderSim, y: number, index: number, t: number) {
  const working = b.servingPatronId !== null && b.x === b.targetX
  const moving = b.x !== b.targetX
  const bob = moving ? Math.floor(t / 120) % 2 : working ? Math.floor(t / 90) % 2 : 0
  drawPerson(ctx, b.x, y, { skin: SKIN[(index + 2) % SKIN.length], hair: HAIR[index % HAIR.length], shirt: '#f5f0e1', apron: true }, bob)
  if (working) {
    // Shaker / glass in hand
    px(ctx, b.x + 5, y - 10 - bob, 2, 3, '#c0c0c0')
  }
}

export function drawPatron(ctx: CanvasRenderingContext2D, p: Patron, t: number) {
  const seat = SEATS[p.seatIndex]
  const seated = (p.state === 'WAITING' || p.state === 'DRINKING') && !p.path.length
  const atBar = seated && seat.kind === 'BAR'
  const walking = p.state === 'ENTERING' || p.state === 'LEAVING'
  const bob = walking ? Math.floor(t / 140) % 2 : 0
  const shirt = p.archetype === 'ROWDY' ? '#dc2626' : p.archetype === 'CONNOISSEUR' ? '#78716c' : SHIRT[p.look]
  drawPerson(
    ctx,
    p.position.x,
    p.position.y + (seated ? -2 : 0),
    { skin: SKIN[p.look], hair: HAIR[(p.look + 3) % HAIR.length], shirt, back: atBar, accent: ACCENT[p.archetype] },
    bob,
  )

  // Drink in front of them
  if (p.state === 'DRINKING') {
    const table = TABLES.reduce((a, b) => (Math.abs(b.x - p.position.x) < Math.abs(a.x - p.position.x) ? b : a))
    const gx = atBar ? p.position.x + 3 : p.position.x + (p.position.x < table.x ? 6 : -9)
    const gy = atBar ? COUNTER.y - 4 : seat.y - 9
    px(ctx, gx, gy, 3, 4, '#f59e0b')
    px(ctx, gx, gy, 3, 1, '#fff7e0')
  }

  // Patience meter while waiting
  if (p.state === 'WAITING' && seated) {
    const w = Math.max(1, Math.round((p.patience / 100) * 10))
    const c = p.patience > 60 ? '#00ff66' : p.patience > 30 ? '#ffb000' : '#ff4d4d'
    px(ctx, p.position.x - 5, p.position.y - 22, 10, 2, '#111')
    px(ctx, p.position.x - 5, p.position.y - 22, w, 2, c)
  }
}

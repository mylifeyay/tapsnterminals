// Tick-based game loop with speed controls and phase transitions:
// TERMINAL (prep) → SERVICE (live floor) → SETTLEMENT (nightly ledger) → next day.
import { emptyDayStats, useGameStore } from '../store/useGameStore'
import type { GameSpeed } from '../types/game'
import { dailyWage, round2 } from './Economy'
import { resolveEvent, tickEventTimer } from './Events'
import { generateDailyEmails } from './Inbox'
import { OPEN_MIN } from './layout'
import { simulate } from './Simulation'

/** Fixed simulation step in sim-seconds. */
export const SIM_STEP = 1 / 30
const MAX_STEPS_PER_FRAME = 16
const SKIP_STEP = 0.25

export class GameLoop {
  private raf = 0
  private last = 0
  private acc = 0
  private running = false

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  private frame = (now: number) => {
    // Clamp long frames (tab switches) so the sim never lurches forward.
    const realDt = Math.min(0.25, (now - this.last) / 1000)
    this.last = now
    const { currentPhase, speed } = useGameStore.getState()

    if (currentPhase === 'SERVICE' && speed > 0) {
      // The intervention timer runs on real seconds so 4× doesn't shorten decisions.
      tickEventTimer(realDt)
      this.acc += realDt * speed
      let steps = 0
      while (this.acc >= SIM_STEP && steps < MAX_STEPS_PER_FRAME) {
        this.acc -= SIM_STEP
        steps++
        if (simulate(SIM_STEP)) {
          endService()
          break
        }
      }
      if (steps === MAX_STEPS_PER_FRAME) this.acc = 0
    } else {
      this.acc = 0
    }

    if (this.running) this.raf = requestAnimationFrame(this.frame)
  }
}

export const gameLoop = new GameLoop()

export function setSpeed(speed: GameSpeed) {
  useGameStore.setState({ speed })
}

/** TERMINAL → SERVICE. Returns an error message if the bar can't open. */
export function startService(): string | null {
  const s = useGameStore.getState()
  if (s.currentPhase !== 'TERMINAL') return 'The bar is not in prep phase.'
  if (!s.staff.some((m) => m.role === 'BARTENDER')) return 'You need at least one bartender to open.'
  useGameStore.setState({
    currentPhase: 'SERVICE',
    clock: OPEN_MIN,
    speed: 1,
    patrons: [],
    bartenders: [],
    orderQueue: [],
    activeEvent: null,
    lastResolution: null,
    eventsFiredToday: [],
    eventCooldown: 0,
    spawnAccumulator: 0.6,
    activeView: 'FLOOR',
  })
  s.pushLog(`Doors open — Day ${s.day}.`, 'info')
  return null
}

/** SERVICE → SETTLEMENT. Pays wages, settles morale and prestige, archives the day. */
export function endService() {
  const s = useGameStore.getState()
  if (s.currentPhase !== 'SERVICE') return
  if (s.activeEvent) resolveEvent(null)

  const after = useGameStore.getState()
  const notes: string[] = []
  const wages = after.staff.reduce((sum, m) => sum + dailyWage(m, after.region), 0)
  after.addCash(-wages)

  // Morale: workload per bartender, shared tips, and natural drift toward 60.
  const tenders = Math.max(1, after.staff.filter((m) => m.role === 'BARTENDER').length)
  const workload = after.today.drinksSold / tenders
  const workloadDelta = workload > 45 ? -8 : workload > 30 ? -3 : 2
  if (workloadDelta < 0) notes.push(`Bartenders were stretched (${Math.round(workload)} drinks each). Morale ${workloadDelta}.`)
  const tipBoost = Math.min(6, after.today.tips / Math.max(1, after.staff.length) / 8)
  if (tipBoost >= 1) notes.push(`Tip jar (${after.today.tips.toFixed(2)}) lifted spirits. Morale +${Math.round(tipBoost)}.`)

  const quitters: string[] = []
  const staff = after.staff
    .map((m) => {
      const drift = (60 - m.morale) * 0.05
      return { ...m, morale: Math.round(Math.min(100, Math.max(0, m.morale + workloadDelta + tipBoost + drift))) }
    })
    .filter((m) => {
      if (m.morale < 20 && Math.random() < 0.5) {
        quitters.push(m.name)
        return false
      }
      return true
    })
  for (const name of quitters) notes.push(`${name} handed in their notice and walked out.`)

  const lostRatio = after.today.patronsLost / Math.max(1, after.today.patronsServed + after.today.patronsLost)
  if (lostRatio > 0.3) notes.push(`${Math.round(lostRatio * 100)}% of guests left unserved. Word gets around.`)
  if (after.today.drinksSold === 0) notes.push('Not a single drink sold. Check your stock and prices.')

  const today = { ...after.today, wages, notes, prestigeDelta: round2(after.today.prestigeDelta) }
  useGameStore.setState({
    currentPhase: 'SETTLEMENT',
    staff,
    today,
    history: [...after.history, today],
    patrons: [],
    bartenders: [],
    orderQueue: [],
    activeEvent: null,
    speed: 1,
    terminalTab: 'LEDGER',
    activeView: 'TERMINAL',
  })
  after.pushLog(`Last orders served. Day ${after.day} settled.`, 'info')
}

/** SETTLEMENT → TERMINAL for the next day. */
export function nextDay() {
  const s = useGameStore.getState()
  if (s.currentPhase !== 'SETTLEMENT') return
  const day = s.day + 1
  useGameStore.setState({
    currentPhase: 'TERMINAL',
    day,
    clock: OPEN_MIN,
    today: emptyDayStats(day, s.region),
    emails: [...generateDailyEmails(day, s.region), ...s.emails].slice(0, 20),
    eventsFiredToday: [],
    lastResolution: null,
    terminalTab: 'INBOX',
    log: [],
  })
}

/** Fast-forwards the rest of the night headlessly (events are skipped). */
export function skipToEndOfDay() {
  const s = useGameStore.getState()
  if (s.currentPhase !== 'SERVICE') return
  if (s.activeEvent) resolveEvent(null)
  for (let guard = 0; guard < 20000; guard++) {
    if (simulate(SKIP_STEP, { headless: true })) break
  }
  endService()
}

// Narrative event triggers and the 12-second intervention timer.
import eventData from '../data/events.json'
import { useGameStore } from '../store/useGameStore'
import type {
  ActiveEvent,
  EventEffects,
  EventResolution,
  InterventionOption,
  NarrativeEvent,
  Patron,
  Staff,
} from '../types/game'
import { clamp } from './Economy'

export const EVENTS = eventData as NarrativeEvent[]
export const DEFAULT_TIMEOUT = 12

/** Average sim-seconds between events once the cooldown has elapsed. */
const MEAN_EVENT_INTERVAL = 40
const EVENT_COOLDOWN = 30
const MAX_EVENTS_PER_NIGHT = 5

export function bestStat(staff: Staff[], stat: keyof Staff['stats']): number {
  return staff.reduce((best, m) => Math.max(best, m.stats[stat]), 0)
}

export function isOptionAvailable(option: InterventionOption, staff: Staff[]): boolean {
  return !option.requiresRole || staff.some((m) => m.role === option.requiresRole)
}

/** Chance (0–1) that an intervention succeeds with the current staff. */
export function successChance(option: InterventionOption, staff: Staff[]): number {
  if (!option.check) return 1
  const best = bestStat(staff, option.check.stat)
  return clamp(0.55 + (best - option.check.difficulty) * 0.12, 0.1, 0.95)
}

/**
 * Called each simulation step. May start a new event and tag a speaking patron.
 * Mutates the passed patron drafts (speaker bubble) and returns the new event, if any.
 */
export function rollForEvent(dt: number, patrons: Patron[], clock: number): ActiveEvent | null {
  const s = useGameStore.getState()
  if (s.activeEvent || s.eventsFiredToday.length >= MAX_EVENTS_PER_NIGHT) return null
  const cooldown = s.eventCooldown + dt
  useGameStore.setState({ eventCooldown: cooldown })
  if (cooldown < EVENT_COOLDOWN) return null

  const present = patrons.filter((p) => p.state === 'WAITING' || p.state === 'DRINKING')
  if (present.length < 2 || Math.random() > dt / MEAN_EVENT_INTERVAL) return null

  const hour = clock / 60
  // Only fire events whose speaker type is actually on the floor.
  const eligible = EVENTS.filter(
    (e) =>
      !s.eventsFiredToday.includes(e.id) &&
      (e.minHour ?? 0) <= hour &&
      (!e.speakerArchetype || present.some((p) => p.archetype === e.speakerArchetype)),
  )
  if (eligible.length === 0) return null

  let roll = Math.random() * eligible.reduce((sum, e) => sum + e.weight, 0)
  const event = eligible.find((e) => (roll -= e.weight) <= 0) ?? eligible[0]

  const speaker =
    present.find((p) => p.archetype === event.speakerArchetype) ?? present[Math.floor(Math.random() * present.length)]
  speaker.bubble = { text: '!', ttl: event.timeoutSeconds * 4, tone: 'event' }

  const active: ActiveEvent = {
    event,
    speakerPatronId: speaker.id,
    speakerName: speaker.name,
    timeLeft: event.timeoutSeconds || DEFAULT_TIMEOUT,
  }
  useGameStore.setState({
    activeEvent: active,
    eventsFiredToday: [...s.eventsFiredToday, event.id],
    eventCooldown: 0,
  })
  s.pushLog(`⚠ ${event.title} — ${speaker.name} needs attention.`, 'event')
  return active
}

/** Counts down the active event in real seconds; auto-ignores at zero. */
export function tickEventTimer(realDt: number) {
  const { activeEvent } = useGameStore.getState()
  if (!activeEvent) return
  const timeLeft = activeEvent.timeLeft - realDt
  if (timeLeft <= 0) resolveEvent(null)
  else useGameStore.setState({ activeEvent: { ...activeEvent, timeLeft } })
}

function applyEffects(effects: EventEffects | undefined) {
  if (!effects) return
  const s = useGameStore.getState()
  if (effects.cash) {
    s.addCash(effects.cash)
    s.updateToday((t) => ({ eventCash: t.eventCash + effects.cash! }))
  }
  if (effects.prestige) s.adjustPrestige(effects.prestige)
  if (effects.morale) s.adjustMorale(effects.morale)
}

/** Resolves the active event with an intervention id, or `null` to ignore it. */
export function resolveEvent(optionId: string | null): EventResolution | null {
  const s = useGameStore.getState()
  const active = s.activeEvent
  if (!active) return null
  const { event } = active

  let resolution: EventResolution
  const option = optionId ? event.interventions.find((o) => o.id === optionId) : undefined
  if (!option || !isOptionAvailable(option, s.staff)) {
    resolution = { title: event.title, text: event.ignoreText, effects: event.ignoreEffects ?? {}, outcome: 'ignored' }
  } else if (Math.random() < successChance(option, s.staff)) {
    resolution = { title: event.title, text: option.successText, effects: option.effects, outcome: 'success' }
  } else {
    resolution = {
      title: event.title,
      text: option.failText ?? 'It doesn\'t quite land.',
      effects: option.failEffects ?? {},
      outcome: 'fail',
    }
  }

  applyEffects(resolution.effects)
  const patrons = s.patrons.map((p) => (p.id === active.speakerPatronId && p.bubble?.tone === 'event' ? { ...p, bubble: null } : p))
  useGameStore.setState({ activeEvent: null, lastResolution: resolution, patrons })
  const tone = resolution.outcome === 'fail' ? 'bad' : resolution.outcome === 'success' ? 'good' : 'info'
  s.pushLog(`${event.title}: ${resolution.text}`, tone)
  return resolution
}

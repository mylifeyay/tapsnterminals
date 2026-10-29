// Per-tick service simulation: patron arrivals, ordering, bartender work and departures.
import { useGameStore } from '../store/useGameStore'
import { useInventoryStore } from '../store/useInventoryStore'
import type { BartenderSim, Beverage, LogLine, Patron, PatronArchetype, Region, Staff, Vec2 } from '../types/game'
import { ARCHETYPES, FIRST_NAMES } from './archetypes'
import { purchaseProbability, referencePrice, REGIONS, resolveTag, round2 } from './Economy'
import { rollForEvent } from './Events'
import {
  BARTENDER_MAX_X,
  BARTENDER_MIN_X,
  CLOCK_RATE,
  CLOSE_MIN,
  LAST_CALL_MIN,
  OPEN_MIN,
  pathToDoor,
  pathToSeat,
  SEATS,
  serviceX,
  DOOR,
} from './layout'

const PATRON_SPEED = 46 // world px per sim-second
const BARTENDER_SPEED = 70
const PREP_SCALE = 0.6
const BASE_ARRIVALS = 0.16 // patrons per sim-second before multipliers

let patronSeq = 0
// Session-unique prefix so ids never collide with patrons created before a reload.
const ID_PREFIX = Date.now().toString(36)
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

/** Relative arrival intensity by hour of the night. */
function hourCurve(clock: number): number {
  const h = clock / 60
  if (h < 19) return 0.6
  if (h < 20) return 0.9
  if (h < 21) return 1.2
  if (h < 23) return 1.4
  if (h < 24) return 1.1
  if (h < 25) return 0.8
  return 0.5
}

function preferenceScore(bev: Beverage, archetype: PatronArchetype, region: Region): number {
  const { prefers } = ARCHETYPES[archetype]
  let score = prefers.categories.includes(bev.category) ? 2 : 0
  for (const tag of prefers.tags) if (bev.tags.includes(resolveTag(tag, region))) score += 1
  return score + Math.random() * 1.5
}

function pickArchetype(): PatronArchetype {
  const entries = Object.entries(ARCHETYPES) as [PatronArchetype, (typeof ARCHETYPES)[PatronArchetype]][]
  let roll = Math.random() * entries.reduce((s, [, a]) => s + a.weight, 0)
  for (const [id, a] of entries) if ((roll -= a.weight) <= 0) return id
  return 'REGULAR'
}

function spawnPatron(seatIndex: number, beverages: Beverage[], region: Region): Patron {
  const archetype = pickArchetype()
  const favorite = [...beverages].sort(
    (a, b) => preferenceScore(b, archetype, region) - preferenceScore(a, archetype, region),
  )[0]
  return {
    id: `p${ID_PREFIX}-${++patronSeq}`,
    name: pick(FIRST_NAMES),
    archetype,
    favoriteDrinkId: favorite.id,
    patience: 100,
    position: { x: DOOR.x + 10, y: DOOR.y },
    path: pathToSeat(SEATS[seatIndex]),
    state: 'ENTERING',
    seatIndex,
    orderDrinkId: null,
    drinkTimer: 0,
    drinksHad: 0,
    mood: 'NEUTRAL',
    bubble: null,
    look: Math.floor(Math.random() * 6),
  }
}

type OrderDecision = { drinkId: string } | { complaint: string }

function chooseDrink(p: Patron, beverages: Beverage[], region: Region, prestige: number): OrderDecision {
  const accepts = (b: Beverage) =>
    b.stockQuantity > 0 &&
    Math.random() < purchaseProbability(b.sellingPrice, referencePrice(b, region, p.archetype, prestige), region)

  const fav = beverages.find((b) => b.id === p.favoriteDrinkId)
  if (fav && accepts(fav)) return { drinkId: fav.id }

  const alternatives = beverages
    .filter((b) => b.id !== p.favoriteDrinkId && b.stockQuantity > 0)
    .sort((a, b) => preferenceScore(b, p.archetype, region) - preferenceScore(a, p.archetype, region))
    .slice(0, 3)
  for (const b of alternatives) if (accepts(b)) return { drinkId: b.id }

  if (fav && fav.stockQuantity <= 0) return { complaint: `No ${fav.name}?!` }
  return { complaint: pick(['Too pricey…', 'How much?!', 'Not at those prices.']) }
}

function moveAlong(pos: Vec2, path: Vec2[], distance: number) {
  let budget = distance
  while (path.length && budget > 0) {
    const t = path[0]
    const dx = t.x - pos.x
    const dy = t.y - pos.y
    const d = Math.hypot(dx, dy)
    if (d <= budget) {
      pos.x = t.x
      pos.y = t.y
      path.shift()
      budget -= d
    } else {
      pos.x += (dx / d) * budget
      pos.y += (dy / d) * budget
      budget = 0
    }
  }
}

function prepTime(bev: Beverage, member: Staff, seatKind: 'BAR' | 'TABLE', hasServer: boolean): number {
  const speedF = 1.5 - member.stats.speed * 0.08
  const mixF = bev.category === 'COCKTAIL' ? 1.6 - member.stats.mixology * 0.1 : 1
  const tableF = seatKind === 'TABLE' ? (hasServer ? 0.9 : 1.4) : 1
  const moraleF = member.morale < 40 ? 1.25 : member.morale > 80 ? 0.9 : 1
  return bev.prepSeconds * PREP_SCALE * speedF * mixF * tableF * moraleF
}

/** Keeps one bartender sim per BARTENDER on staff, preserving existing positions. */
function syncBartenders(current: BartenderSim[], staff: Staff[]): BartenderSim[] {
  const tenders = staff.filter((m) => m.role === 'BARTENDER')
  return tenders.map((m, i) => {
    const existing = current.find((b) => b.staffId === m.id)
    if (existing) return { ...existing }
    const x = BARTENDER_MIN_X + 40 + i * 60
    return { staffId: m.id, x, targetX: x, servingPatronId: null, workLeft: 0 }
  })
}

export interface SimOptions {
  /** Suppresses narrative events (used by Skip to End of Day). */
  headless?: boolean
}

/**
 * Advances the service simulation by `dt` sim-seconds.
 * Returns true when the night has reached closing time.
 */
export function simulate(dt: number, opts: SimOptions = {}): boolean {
  const gs = useGameStore.getState()
  if (gs.currentPhase !== 'SERVICE') return false
  const inventory = useInventoryStore.getState()
  const { region, prestige, staff } = gs

  const clock = gs.clock + dt * CLOCK_RATE
  const patrons: Patron[] = gs.patrons.map((p) => ({
    ...p,
    position: { ...p.position },
    path: p.path.map((v) => ({ ...v })),
    bubble: p.bubble ? { ...p.bubble } : null,
  }))
  const bartenders = syncBartenders(gs.bartenders, staff)
  // Drop stale entries (patrons who left or are no longer waiting).
  const queue = gs.orderQueue.filter((id, i, arr) => arr.indexOf(id) === i && patrons.some((p) => p.id === id && p.state === 'WAITING'))
  const today = { ...gs.today }
  const logs: [string, LogLine['tone']][] = []
  let prestigeDelta = 0
  let cashDelta = 0
  const hasServer = staff.some((m) => m.role === 'SERVER')
  const bouncer = staff.some((m) => m.role === 'BOUNCER')

  // ── Arrivals ──────────────────────────────────────────────────────────────
  let spawnAccumulator = gs.spawnAccumulator
  if (clock < LAST_CALL_MIN && clock >= OPEN_MIN) {
    const rate = BASE_ARRIVALS * REGIONS[region].footTraffic * (0.6 + prestige / 50) * hourCurve(clock)
    spawnAccumulator += rate * dt
    while (spawnAccumulator >= 1) {
      spawnAccumulator -= 1
      const taken = new Set(patrons.filter((p) => p.state !== 'LEAVING').map((p) => p.seatIndex))
      const free = SEATS.map((_, i) => i).filter((i) => !taken.has(i))
      if (free.length === 0) break
      patrons.push(spawnPatron(pick(free), inventory.beverages, region))
    }
  }

  const placeOrder = (p: Patron) => {
    const decision = chooseDrink(p, useInventoryStore.getState().beverages, region, prestige)
    if ('drinkId' in decision) {
      const bev = inventory.beverages.find((b) => b.id === decision.drinkId)!
      const qi = queue.indexOf(p.id)
      if (qi >= 0) queue.splice(qi, 1)
      p.state = 'WAITING'
      p.orderDrinkId = bev.id
      p.patience = 100
      p.bubble = { text: `${bev.name}, please!`, ttl: 3.5, tone: 'order' }
      queue.push(p.id)
    } else {
      p.state = 'LEAVING'
      p.mood = 'ANGRY'
      p.path = pathToDoor(p.position)
      p.bubble = { text: decision.complaint, ttl: 3, tone: 'complaint' }
      if (p.drinksHad === 0) today.patronsLost += 1
      prestigeDelta -= 0.1
      logs.push([`${p.name} walked: "${decision.complaint}"`, 'bad'])
    }
  }

  // ── Patrons ───────────────────────────────────────────────────────────────
  for (const p of patrons) {
    if (p.bubble) {
      p.bubble.ttl -= dt
      if (p.bubble.ttl <= 0) p.bubble = null
    }
    const profile = ARCHETYPES[p.archetype]
    switch (p.state) {
      case 'ENTERING':
        moveAlong(p.position, p.path, PATRON_SPEED * dt)
        if (p.path.length === 0) placeOrder(p)
        break
      case 'WAITING':
        // Patrons already being served don't lose patience.
        if (!bartenders.some((b) => b.servingPatronId === p.id)) {
          p.patience -= profile.patienceDrain * dt * (bouncer && p.archetype === 'ROWDY' ? 0.7 : 1)
        }
        if (p.patience <= 0) {
          p.state = 'LEAVING'
          p.mood = 'ANGRY'
          p.path = pathToDoor(p.position)
          p.bubble = { text: pick(['Forget it!', 'Ugh, so slow.', "I'm off."]), ttl: 3, tone: 'complaint' }
          if (p.drinksHad === 0) today.patronsLost += 1
          prestigeDelta -= 0.4
          logs.push([`${p.name} gave up waiting.`, 'bad'])
          const qi = queue.indexOf(p.id)
          if (qi >= 0) queue.splice(qi, 1)
        }
        break
      case 'DRINKING':
        p.drinkTimer -= dt
        if (p.drinkTimer <= 0) {
          p.drinksHad += 1
          const wantsMore = p.drinksHad < profile.maxDrinks && clock < LAST_CALL_MIN && Math.random() < profile.reorderChance
          if (wantsMore) {
            placeOrder(p)
          } else {
            p.state = 'LEAVING'
            p.mood = 'HAPPY'
            p.path = pathToDoor(p.position)
            p.bubble = { text: pick(['Cheers!', 'Night!', 'See you soon!']), ttl: 2.5, tone: 'chat' }
            if (p.drinksHad >= 2) prestigeDelta += 0.12
          }
        } else if (!p.bubble && Math.random() < dt / 18) {
          p.bubble = { text: pick(profile.chatter), ttl: 3, tone: 'chat' }
        }
        break
      case 'LEAVING':
        moveAlong(p.position, p.path, PATRON_SPEED * dt)
        break
    }
  }

  // ── Bartenders ────────────────────────────────────────────────────────────
  for (const b of bartenders) {
    const member = staff.find((m) => m.id === b.staffId)!
    let target = b.servingPatronId ? patrons.find((p) => p.id === b.servingPatronId) : undefined
    if (b.servingPatronId && (!target || target.state !== 'WAITING')) {
      b.servingPatronId = null
      target = undefined
    }

    if (!target) {
      // Claim the oldest order nobody else is working on, preferring nearby seats.
      const claimed = new Set(bartenders.map((x) => x.servingPatronId))
      const candidates = queue.filter((id) => !claimed.has(id)).slice(0, 3)
      const next = candidates
        .map((id) => patrons.find((p) => p.id === id))
        .filter((p): p is Patron => p?.state === 'WAITING' && p.orderDrinkId !== null)
        .sort((a, c) => Math.abs(serviceX(SEATS[a.seatIndex]) - b.x) - Math.abs(serviceX(SEATS[c.seatIndex]) - b.x))[0]
      if (next) {
        const bev = inventory.beverages.find((x) => x.id === next.orderDrinkId)!
        const seat = SEATS[next.seatIndex]
        b.servingPatronId = next.id
        b.targetX = Math.min(BARTENDER_MAX_X, Math.max(BARTENDER_MIN_X, serviceX(seat)))
        b.workLeft = prepTime(bev, member, seat.kind, hasServer)
        target = next
      }
    }

    const dx = b.targetX - b.x
    const step = BARTENDER_SPEED * dt
    b.x = Math.abs(dx) <= step ? b.targetX : b.x + Math.sign(dx) * step

    if (target && b.x === b.targetX) {
      b.workLeft -= dt
      if (b.workLeft <= 0) {
        const bev = useInventoryStore.getState().beverages.find((x) => x.id === target.orderDrinkId)!
        const costBasis = useInventoryStore.getState().consume(bev.id)
        const qi = queue.indexOf(target.id)
        if (qi >= 0) queue.splice(qi, 1)
        b.servingPatronId = null
        if (costBasis === null) {
          target.state = 'LEAVING'
          target.mood = 'ANGRY'
          target.path = pathToDoor(target.position)
          target.bubble = { text: `Out of ${bev.name}?!`, ttl: 3, tone: 'complaint' }
          if (target.drinksHad === 0) today.patronsLost += 1
          prestigeDelta -= 0.3
          logs.push([`Ran out of ${bev.name} — ${target.name} left.`, 'bad'])
        } else {
          const price = bev.sellingPrice
          const profile = ARCHETYPES[target.archetype]
          const tip = round2(
            price * (0.04 + member.stats.charm * 0.012) * profile.tipMultiplier * (target.patience > 50 ? 1 : 0.5),
          )
          cashDelta += price
          today.grossRevenue = round2(today.grossRevenue + price)
          today.cogs = round2(today.cogs + costBasis)
          today.tips = round2(today.tips + tip)
          today.drinksSold += 1
          if (target.drinksHad === 0) today.patronsServed += 1
          target.state = 'DRINKING'
          target.mood = target.patience > 40 ? 'HAPPY' : 'NEUTRAL'
          target.drinkTimer = profile.drinkTime * rand(0.8, 1.2)
          target.orderDrinkId = null
          logs.push([`${member.name.split(' ')[0]} served ${target.name} a ${bev.name} (${price.toFixed(2)}).`, 'good'])
        }
      }
    } else if (!target && b.x === b.targetX && Math.random() < dt / 6) {
      // Idle bartenders drift along the counter wiping it down.
      b.targetX = rand(BARTENDER_MIN_X, BARTENDER_MAX_X)
    }
  }

  // Patrons who reached the door are gone.
  const remaining = patrons.filter((p) => !(p.state === 'LEAVING' && p.path.length === 0))

  if (!opts.headless) rollForEvent(dt, remaining, clock)

  useGameStore.setState({
    clock,
    patrons: remaining,
    bartenders,
    orderQueue: queue,
    today,
    spawnAccumulator,
  })
  if (cashDelta) gs.addCash(cashDelta)
  if (prestigeDelta) gs.adjustPrestige(prestigeDelta)
  for (const [text, tone] of logs) gs.pushLog(text, tone)

  return clock >= CLOSE_MIN
}

// Regional multipliers, cost/margin math and patron price sensitivity.
import type { Beverage, Email, PatronArchetype, PromoTarget, Region, RegionProfile, Staff } from '../types/game'
import { ARCHETYPES } from './archetypes'

export const REGIONS: Record<Region, RegionProfile> = {
  SEA: {
    id: 'SEA',
    label: 'Southeast Asia',
    city: 'Singapore',
    currency: 'S$',
    costMultiplier: 1.0,
    wageMultiplier: 1.0,
    footTraffic: 1.0,
    priceElasticity: 1.0,
    localTag: 'local-sea',
  },
  EU: {
    id: 'EU',
    label: 'Europe',
    city: 'Dublin',
    currency: '€',
    costMultiplier: 0.9,
    wageMultiplier: 1.2,
    footTraffic: 1.1,
    priceElasticity: 1.2,
    localTag: 'local-eu',
  },
  NA: {
    id: 'NA',
    label: 'North America',
    city: 'Chicago',
    currency: 'US$',
    costMultiplier: 0.95,
    wageMultiplier: 1.3,
    footTraffic: 1.2,
    priceElasticity: 0.9,
    localTag: 'local-na',
  },
}

export const round2 = (n: number) => Math.round(n * 100) / 100
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export function formatMoney(n: number, region: Region): string {
  const sign = n < 0 ? '−' : ''
  return `${sign}${REGIONS[region].currency}${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Supplier cost of one serve in the given region, before promos. */
export function unitCost(bev: Beverage, region: Region): number {
  return round2(bev.baseCost * REGIONS[region].costMultiplier * bev.regionalModifiers[region])
}

export function resolveTag(tag: string, region: Region): string {
  return tag === 'local' || tag === '{local}' ? REGIONS[region].localTag : tag
}

export function matchesPromo(bev: Beverage, target: PromoTarget, region: Region): boolean {
  if (target.beverageId && target.beverageId !== bev.id) return false
  if (target.category && target.category !== bev.category) return false
  if (target.tag && !bev.tags.includes(resolveTag(target.tag, region))) return false
  return true
}

/** Best active promo discount (0–100) for a beverage on a given day. */
export function promoDiscount(bev: Beverage, emails: Email[], day: number, region: Region): number {
  let best = 0
  for (const e of emails) {
    if (!e.promo || e.promo.expiresDay < day || e.day > day) continue
    if (matchesPromo(bev, e.promo.target, region)) best = Math.max(best, e.promo.discountPct)
  }
  return best
}

export function orderUnitCost(bev: Beverage, region: Region, discountPct: number): number {
  return round2(unitCost(bev, region) * (1 - discountPct / 100))
}

export function margin(price: number, cost: number) {
  const profit = round2(price - cost)
  return { profit, pct: price > 0 ? (profit / price) * 100 : 0 }
}

/** Highest price a given archetype considers fair for this beverage. */
export function referencePrice(bev: Beverage, region: Region, archetype: PatronArchetype, prestige: number): number {
  const profile = ARCHETYPES[archetype]
  const premiumBonus = archetype === 'CONNOISSEUR' && bev.tags.includes('premium') ? 1.15 : 1
  return unitCost(bev, region) * profile.markupTolerance * premiumBonus * (1 + prestige / 250)
}

/** Probability (0–1) that a patron accepts the current price. */
export function purchaseProbability(price: number, refPrice: number, region: Region): number {
  if (price <= refPrice) return 1
  const overshoot = price / refPrice - 1
  return clamp(1 - overshoot * 2.2 * REGIONS[region].priceElasticity, 0, 1)
}

export function dailyWage(staff: Staff, region: Region): number {
  return Math.round(staff.salaryDaily * REGIONS[region].wageMultiplier)
}

/** Recommended price band for a beverage based on the median archetype tolerance. */
export function suggestedPrice(bev: Beverage, region: Region, prestige: number): number {
  return Math.round(referencePrice(bev, region, 'OFFICE_WORKER', prestige) * 2) / 2
}

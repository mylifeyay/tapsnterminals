// Core domain types for Taps & Terminals.

export type Region = 'SEA' | 'EU' | 'NA'
export type GamePhase = 'TERMINAL' | 'SERVICE' | 'SETTLEMENT'
export type GameSpeed = 0 | 1 | 2 | 4
export type ActiveView = 'FLOOR' | 'TERMINAL'
export type TerminalTab = 'INBOX' | 'CELLAR' | 'HR' | 'LEDGER' | 'SYS'

export interface Vec2 {
  x: number
  y: number
}

// ─── Beverages ──────────────────────────────────────────────────────────────

export type BeverageCategory = 'LAGER' | 'ALE' | 'STOUT' | 'WHEAT' | 'CIDER' | 'SPIRIT' | 'COCKTAIL' | 'SOFT'

export interface Beverage {
  id: string
  name: string
  category: BeverageCategory
  /** Supplier cost per serve before regional multipliers and promos. */
  baseCost: number
  /** Retail price per serve set by the player. */
  sellingPrice: number
  stockQuantity: number
  /** Per-region cost multiplier (imports are dearer far from home). */
  regionalModifiers: Record<Region, number>
  tags: string[]
  abv: number
  /** Seconds of bartender work at mixology 5; scaled by staff stats. */
  prepSeconds: number
}

// ─── Staff ──────────────────────────────────────────────────────────────────

export type StaffRole = 'BARTENDER' | 'SERVER' | 'BOUNCER'

export interface StaffStats {
  /** 1–10 */
  speed: number
  /** 1–10 */
  mixology: number
  /** 1–10 */
  charm: number
}

export interface Staff {
  id: string
  name: string
  role: StaffRole
  salaryDaily: number
  stats: StaffStats
  /** 0–100 */
  morale: number
  bio: string
}

// ─── Patrons ────────────────────────────────────────────────────────────────

export type PatronArchetype = 'REGULAR' | 'TOURIST' | 'OFFICE_WORKER' | 'STUDENT' | 'CONNOISSEUR' | 'ROWDY'

export type PatronState = 'ENTERING' | 'WAITING' | 'DRINKING' | 'LEAVING'

export type PatronMood = 'HAPPY' | 'NEUTRAL' | 'ANGRY'

export interface SpeechBubble {
  text: string
  /** Remaining game-seconds before the bubble hides. */
  ttl: number
  tone: 'order' | 'chat' | 'complaint' | 'event'
}

export interface Patron {
  id: string
  name: string
  archetype: PatronArchetype
  favoriteDrinkId: string
  /** 0–100; drains while waiting to be served. */
  patience: number
  position: Vec2
  /** Remaining waypoints to walk through. */
  path: Vec2[]
  state: PatronState
  seatIndex: number
  orderDrinkId: string | null
  /** Game-seconds left in the current DRINKING state. */
  drinkTimer: number
  drinksHad: number
  mood: PatronMood
  bubble: SpeechBubble | null
  /** Palette index used by the canvas renderer. */
  look: number
}

export interface BartenderSim {
  staffId: string
  x: number
  targetX: number
  /** Patron currently being served, if any. */
  servingPatronId: string | null
  /** Game-seconds of work left on the current order. */
  workLeft: number
}

// ─── Narrative events ───────────────────────────────────────────────────────

export interface EventEffects {
  cash?: number
  prestige?: number
  /** Applied to every staff member. */
  morale?: number
}

export interface StatCheck {
  stat: keyof StaffStats
  /** 1–10; compared against the best on-shift staff stat. */
  difficulty: number
}

export interface InterventionOption {
  id: string
  label: string
  description: string
  requiresRole?: StaffRole
  check?: StatCheck
  effects: EventEffects
  successText: string
  failEffects?: EventEffects
  failText?: string
}

export interface NarrativeEvent {
  id: string
  title: string
  speakerArchetype?: PatronArchetype
  dialogue: string
  /** Real seconds before the event auto-resolves as ignored. */
  timeoutSeconds: number
  interventions: InterventionOption[]
  ignoreText: string
  ignoreEffects?: EventEffects
  /** Relative weight when picking a random event. */
  weight: number
  /** Earliest game hour (24h, may exceed 24 for after midnight) the event can fire. */
  minHour?: number
}

export interface ActiveEvent {
  event: NarrativeEvent
  speakerPatronId: string | null
  speakerName: string
  timeLeft: number
}

export interface EventResolution {
  title: string
  text: string
  effects: EventEffects
  outcome: 'success' | 'fail' | 'ignored'
}

// ─── Inbox ──────────────────────────────────────────────────────────────────

export interface PromoTarget {
  category?: BeverageCategory
  tag?: string
  beverageId?: string
}

export interface Email {
  id: string
  day: number
  from: string
  subject: string
  body: string
  read: boolean
  promo?: {
    target: PromoTarget
    discountPct: number
    /** Last day (inclusive) the promo applies to stock orders. */
    expiresDay: number
  }
}

// ─── Ledger ─────────────────────────────────────────────────────────────────

export interface DayStats {
  day: number
  region: Region
  grossRevenue: number
  tips: number
  cogs: number
  wages: number
  stockPurchases: number
  eventCash: number
  drinksSold: number
  patronsServed: number
  patronsLost: number
  prestigeDelta: number
  /** Settlement remarks (morale shifts, resignations…). */
  notes: string[]
}

export interface LogLine {
  id: number
  clock: number
  text: string
  tone: 'info' | 'good' | 'bad' | 'event'
}

// ─── Root game state ────────────────────────────────────────────────────────

export interface GameState {
  currentPhase: GamePhase
  region: Region
  cash: number
  /** 0–100 reputation; drives foot traffic and price tolerance. */
  prestige: number
  day: number
}

export interface RegionProfile {
  id: Region
  label: string
  city: string
  currency: string
  /** Multiplies supplier costs. */
  costMultiplier: number
  /** Multiplies staff wages. */
  wageMultiplier: number
  /** Multiplies patron arrival rate. */
  footTraffic: number
  /** How strongly patrons react to overpricing (higher = more sensitive). */
  priceElasticity: number
  /** Tag marking beverages brewed locally for this region. */
  localTag: string
}

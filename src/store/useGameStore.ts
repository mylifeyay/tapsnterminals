import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import staffData from '../data/staff.json'
import { OPEN_MIN } from '../engine/layout'
import { generateDailyEmails } from '../engine/Inbox'
import type {
  ActiveEvent,
  ActiveView,
  BartenderSim,
  DayStats,
  Email,
  EventResolution,
  GameSpeed,
  GameState,
  LogLine,
  Patron,
  Region,
  Staff,
  TerminalTab,
} from '../types/game'

export const STARTING_CASH = 1500
export const STARTING_PRESTIGE = 20
const MAX_LOG = 60

export function emptyDayStats(day: number, region: Region): DayStats {
  return {
    day,
    region,
    grossRevenue: 0,
    tips: 0,
    cogs: 0,
    wages: 0,
    stockPurchases: 0,
    eventCash: 0,
    drinksSold: 0,
    patronsServed: 0,
    patronsLost: 0,
    prestigeDelta: 0,
    notes: [],
  }
}

export interface GameStore extends GameState {
  speed: GameSpeed
  /** Minutes after midnight of the opening day (can exceed 24h). */
  clock: number
  activeView: ActiveView
  terminalTab: TerminalTab
  staff: Staff[]
  applicants: Staff[]
  emails: Email[]
  today: DayStats
  history: DayStats[]
  log: LogLine[]

  // Transient service-phase simulation state (not persisted).
  patrons: Patron[]
  bartenders: BartenderSim[]
  orderQueue: string[]
  activeEvent: ActiveEvent | null
  lastResolution: EventResolution | null
  eventsFiredToday: string[]
  /** Sim-seconds since the last narrative event. */
  eventCooldown: number
  /** Fractional patron arrivals carried between ticks. */
  spawnAccumulator: number

  setView: (view: ActiveView) => void
  setTab: (tab: TerminalTab) => void
  setRegion: (region: Region) => void
  addCash: (delta: number) => void
  adjustPrestige: (delta: number) => void
  adjustMorale: (delta: number, staffId?: string) => void
  updateToday: (patch: (t: DayStats) => Partial<DayStats>) => void
  pushLog: (text: string, tone?: LogLine['tone']) => void
  markEmailRead: (id: string) => void
  hire: (id: string) => { ok: boolean; message: string }
  fire: (id: string) => void
  giveBonus: (id: string) => { ok: boolean; message: string }
  dismissResolution: () => void
  resetGame: () => void
}

let logSeq = 0

function initialState(region: Region = 'SEA') {
  return {
    currentPhase: 'TERMINAL' as const,
    region,
    cash: STARTING_CASH,
    prestige: STARTING_PRESTIGE,
    day: 1,
    speed: 1 as GameSpeed,
    clock: OPEN_MIN,
    activeView: 'TERMINAL' as ActiveView,
    terminalTab: 'INBOX' as TerminalTab,
    staff: structuredClone(staffData.roster) as Staff[],
    applicants: structuredClone(staffData.applicants) as Staff[],
    emails: generateDailyEmails(1, region, true),
    today: emptyDayStats(1, region),
    history: [] as DayStats[],
    log: [] as LogLine[],
    patrons: [] as Patron[],
    bartenders: [] as BartenderSim[],
    orderQueue: [] as string[],
    activeEvent: null,
    lastResolution: null,
    eventsFiredToday: [] as string[],
    eventCooldown: 0,
    spawnAccumulator: 0,
  }
}

export const HIRING_FEE = 120
export const BONUS_COST = 50

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState(),

      setView: (activeView) => set({ activeView }),
      setTab: (terminalTab) => set({ terminalTab }),
      setRegion: (region) => {
        if (get().currentPhase !== 'TERMINAL') return
        set((s) => ({ region, today: { ...s.today, region } }))
        get().pushLog(`Relocated operations to ${region}.`, 'info')
      },
      addCash: (delta) => set((s) => ({ cash: Math.round((s.cash + delta) * 100) / 100 })),
      adjustPrestige: (delta) =>
        set((s) => {
          const prestige = Math.min(100, Math.max(0, s.prestige + delta))
          return { prestige, today: { ...s.today, prestigeDelta: s.today.prestigeDelta + (prestige - s.prestige) } }
        }),
      adjustMorale: (delta, staffId) =>
        set((s) => ({
          staff: s.staff.map((m) =>
            staffId && m.id !== staffId ? m : { ...m, morale: Math.min(100, Math.max(0, m.morale + delta)) },
          ),
        })),
      updateToday: (patch) => set((s) => ({ today: { ...s.today, ...patch(s.today) } })),
      pushLog: (text, tone = 'info') =>
        set((s) => ({ log: [{ id: ++logSeq, clock: s.clock, text, tone }, ...s.log].slice(0, MAX_LOG) })),
      markEmailRead: (id) => set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, read: true } : e)) })),

      hire: (id) => {
        const s = get()
        if (s.currentPhase === 'SERVICE') return { ok: false, message: 'Cannot hire mid-service.' }
        const applicant = s.applicants.find((a) => a.id === id)
        if (!applicant) return { ok: false, message: 'Applicant not found.' }
        if (s.cash < HIRING_FEE) return { ok: false, message: 'Not enough cash for the hiring fee.' }
        set({
          staff: [...s.staff, applicant],
          applicants: s.applicants.filter((a) => a.id !== id),
          cash: s.cash - HIRING_FEE,
        })
        get().updateToday((t) => ({ eventCash: t.eventCash - HIRING_FEE }))
        get().pushLog(`Hired ${applicant.name} (${applicant.role.toLowerCase()}).`, 'good')
        return { ok: true, message: `${applicant.name} starts tonight.` }
      },
      fire: (id) => {
        const s = get()
        if (s.currentPhase === 'SERVICE') return
        const member = s.staff.find((m) => m.id === id)
        if (!member) return
        set({
          staff: s.staff
            .filter((m) => m.id !== id)
            .map((m) => ({ ...m, morale: Math.max(0, m.morale - 6) })),
          applicants: [...s.applicants, { ...member, morale: 55 }],
        })
        get().pushLog(`Let ${member.name} go. The team is rattled.`, 'bad')
      },
      giveBonus: (id) => {
        const s = get()
        const member = s.staff.find((m) => m.id === id)
        if (!member) return { ok: false, message: 'Staff member not found.' }
        if (s.cash < BONUS_COST) return { ok: false, message: 'Not enough cash.' }
        set({ cash: s.cash - BONUS_COST })
        get().adjustMorale(12, id)
        get().updateToday((t) => ({ eventCash: t.eventCash - BONUS_COST }))
        get().pushLog(`Paid ${member.name} a bonus.`, 'good')
        return { ok: true, message: `${member.name} is grateful.` }
      },
      dismissResolution: () => set({ lastResolution: null }),
      resetGame: () => set({ ...initialState(get().region) }),
    }),
    {
      name: 'taps-terminals-game',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        currentPhase: s.currentPhase,
        region: s.region,
        cash: s.cash,
        prestige: s.prestige,
        day: s.day,
        clock: s.clock,
        activeView: s.activeView,
        terminalTab: s.terminalTab,
        staff: s.staff,
        applicants: s.applicants,
        emails: s.emails,
        today: s.today,
        history: s.history,
        log: s.log,
        eventsFiredToday: s.eventsFiredToday,
      }),
      // A reload mid-service resumes paused with an empty floor.
      merge: (persisted, current) => {
        const p = persisted as Partial<GameStore>
        logSeq = p.log?.[0]?.id ?? 0
        return { ...current, ...p, speed: p.currentPhase === 'SERVICE' ? 0 : current.speed }
      },
    },
  ),
)

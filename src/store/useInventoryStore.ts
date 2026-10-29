import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import beverageData from '../data/beverages.json'
import { orderUnitCost, promoDiscount, round2, unitCost } from '../engine/Economy'
import type { Beverage } from '../types/game'
import { useGameStore } from './useGameStore'

export const MAX_STOCK = 200

function initialBeverages(): Beverage[] {
  return structuredClone(beverageData) as Beverage[]
}

function initialAvgCost(beverages: Beverage[]): Record<string, number> {
  const region = useGameStore.getState().region
  return Object.fromEntries(beverages.map((b) => [b.id, unitCost(b, region)]))
}

interface InventoryStore {
  beverages: Beverage[]
  /** Weighted-average cost basis of stock on hand, per beverage. */
  avgCost: Record<string, number>
  setPrice: (id: string, price: number) => void
  orderStock: (id: string, qty: number) => { ok: boolean; message: string }
  /** Removes one serve; returns its cost basis, or null if out of stock. */
  consume: (id: string) => number | null
  reset: () => void
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      beverages: initialBeverages(),
      avgCost: {},

      setPrice: (id, price) =>
        set((s) => ({
          beverages: s.beverages.map((b) => (b.id === id ? { ...b, sellingPrice: round2(Math.max(0, price)) } : b)),
        })),

      orderStock: (id, qty) => {
        const game = useGameStore.getState()
        const bev = get().beverages.find((b) => b.id === id)
        if (!bev) return { ok: false, message: 'Unknown product.' }
        if (game.currentPhase === 'SETTLEMENT') return { ok: false, message: 'Suppliers are closed until morning.' }
        const room = MAX_STOCK - bev.stockQuantity
        const units = Math.min(qty, room)
        if (units <= 0) return { ok: false, message: 'Cellar is full for that line.' }
        const discount = promoDiscount(bev, game.emails, game.day, game.region)
        const each = orderUnitCost(bev, game.region, discount)
        const total = round2(each * units)
        if (game.cash < total) return { ok: false, message: 'Insufficient funds.' }

        const prevAvg = get().avgCost[id] ?? unitCost(bev, game.region)
        const newAvg = round2((prevAvg * bev.stockQuantity + each * units) / (bev.stockQuantity + units))
        set((s) => ({
          beverages: s.beverages.map((b) => (b.id === id ? { ...b, stockQuantity: b.stockQuantity + units } : b)),
          avgCost: { ...s.avgCost, [id]: newAvg },
        }))
        game.addCash(-total)
        game.updateToday((t) => ({ stockPurchases: round2(t.stockPurchases + total) }))
        const promoNote = discount > 0 ? ` (−${discount}% promo)` : ''
        game.pushLog(`Ordered ${units}× ${bev.name} for ${total.toFixed(2)}${promoNote}.`, 'info')
        return { ok: true, message: `+${units} ${bev.name}${promoNote}` }
      },

      consume: (id) => {
        const bev = get().beverages.find((b) => b.id === id)
        if (!bev || bev.stockQuantity <= 0) return null
        set((s) => ({
          beverages: s.beverages.map((b) => (b.id === id ? { ...b, stockQuantity: b.stockQuantity - 1 } : b)),
        }))
        return get().avgCost[id] ?? unitCost(bev, useGameStore.getState().region)
      },

      reset: () => {
        const beverages = initialBeverages()
        set({ beverages, avgCost: initialAvgCost(beverages) })
      },
    }),
    {
      name: 'taps-terminals-inventory',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

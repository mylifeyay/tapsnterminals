import { Minus, Plus, Tag, Truck } from 'lucide-react'
import { useState } from 'react'
import { formatMoney, margin, orderUnitCost, promoDiscount, suggestedPrice, unitCost } from '../../engine/Economy'
import { useGameStore } from '../../store/useGameStore'
import { MAX_STOCK, useInventoryStore } from '../../store/useInventoryStore'
import type { Beverage, BeverageCategory } from '../../types/game'
import { Badge } from '../ui/Badge'
import { RetroButton } from '../ui/RetroButton'

const CATEGORY_ORDER: BeverageCategory[] = ['LAGER', 'ALE', 'STOUT', 'WHEAT', 'CIDER', 'SPIRIT', 'COCKTAIL', 'SOFT']
const LOW_STOCK = 10
const PRICE_STEP = 0.5

function marginTone(pct: number) {
  if (pct < 50) return 'text-crt-red'
  if (pct < 68) return 'text-crt-amber'
  return 'text-crt-green'
}

function BeverageRow({ bev, onToast }: { bev: Beverage; onToast: (msg: string, ok: boolean) => void }) {
  const region = useGameStore((s) => s.region)
  const day = useGameStore((s) => s.day)
  const emails = useGameStore((s) => s.emails)
  const prestige = useGameStore((s) => s.prestige)
  const phase = useGameStore((s) => s.currentPhase)
  const avgCost = useInventoryStore((s) => s.avgCost[bev.id])
  const setPrice = useInventoryStore((s) => s.setPrice)
  const orderStock = useInventoryStore((s) => s.orderStock)

  const discount = promoDiscount(bev, emails, day, region)
  const buyCost = orderUnitCost(bev, region, discount)
  const costBasis = avgCost ?? unitCost(bev, region)
  const m = margin(bev.sellingPrice, costBasis)
  const suggested = suggestedPrice(bev, region, prestige)
  const pricey = bev.sellingPrice > suggested * 1.15
  const cheap = bev.sellingPrice < suggested * 0.75

  const order = (qty: number) => {
    const res = orderStock(bev.id, qty)
    onToast(res.message, res.ok)
  }

  return (
    <li className="space-y-1.5 px-2 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-bold text-crt-text">{bev.name}</span>
        <Badge>{bev.category}</Badge>
        {bev.tags.includes(`local-${region.toLowerCase()}`) && <Badge tone="blue">local</Badge>}
        {discount > 0 && (
          <Badge tone="amber">
            <Tag size={9} />-{discount}%
          </Badge>
        )}
        <span
          className={`ml-auto text-xs tabular-nums ${
            bev.stockQuantity === 0 ? 'text-crt-red' : bev.stockQuantity < LOW_STOCK ? 'text-crt-amber' : 'text-crt-muted'
          }`}
        >
          {bev.stockQuantity === 0 ? 'OUT' : `${bev.stockQuantity} in stock`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <div className="flex items-center gap-1" title="Retail price per serve">
          <span className="text-crt-muted">PRICE</span>
          <RetroButton
            variant="ghost"
            size="xs"
            className="h-6 w-6 !px-0"
            aria-label={`Lower ${bev.name} price`}
            onClick={() => setPrice(bev.id, bev.sellingPrice - PRICE_STEP)}
          >
            <Minus size={11} />
          </RetroButton>
          <input
            type="number"
            inputMode="decimal"
            step={PRICE_STEP}
            min={0}
            value={bev.sellingPrice}
            onChange={(e) => setPrice(bev.id, Number(e.target.value))}
            aria-label={`${bev.name} price`}
            className={`h-6 w-14 rounded-sm border bg-crt-bg px-1 text-center tabular-nums outline-none focus:border-crt-green ${
              pricey ? 'border-crt-amber text-crt-amber' : 'border-crt-line text-crt-text'
            }`}
          />
          <RetroButton
            variant="ghost"
            size="xs"
            className="h-6 w-6 !px-0"
            aria-label={`Raise ${bev.name} price`}
            onClick={() => setPrice(bev.id, bev.sellingPrice + PRICE_STEP)}
          >
            <Plus size={11} />
          </RetroButton>
        </div>

        <span className="tabular-nums" title="Weighted-average cost of stock on hand">
          <span className="text-crt-muted">COST </span>
          {costBasis.toFixed(2)}
        </span>
        <span className={`tabular-nums font-bold ${marginTone(m.pct)}`} title="Gross margin per serve">
          <span className="font-normal text-crt-muted">MARGIN </span>
          {m.pct.toFixed(0)}% ({m.profit.toFixed(2)})
        </span>
        <span className="text-[11px] text-crt-muted" title="What a typical patron considers fair">
          fair ≈ {suggested.toFixed(2)}
          {pricey && <span className="text-crt-amber"> · steep</span>}
          {cheap && <span className="text-crt-blue"> · bargain</span>}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-crt-muted">
          <Truck size={11} className="mr-1 inline" />
          BUY @ {buyCost.toFixed(2)}
          {discount > 0 && <s className="ml-1 opacity-60">{unitCost(bev, region).toFixed(2)}</s>}
        </span>
        <div className="ml-auto flex gap-1">
          {[6, 24].map((q) => (
            <RetroButton
              key={q}
              size="xs"
              variant={discount > 0 ? 'amber' : 'primary'}
              disabled={phase === 'SETTLEMENT' || bev.stockQuantity >= MAX_STOCK}
              onClick={() => order(q)}
              title={`Order ${q} for ${formatMoney(buyCost * q, region)}`}
            >
              +{q} <span className="font-normal opacity-80">{(buyCost * q).toFixed(0)}</span>
            </RetroButton>
          ))}
        </div>
      </div>
    </li>
  )
}

export function InventoryManager() {
  const beverages = useInventoryStore((s) => s.beverages)
  const avgCost = useInventoryStore((s) => s.avgCost)
  const region = useGameStore((s) => s.region)
  const phase = useGameStore((s) => s.currentPhase)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const sorted = [...beverages].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  )
  const stockValue = beverages.reduce((sum, b) => sum + b.stockQuantity * (avgCost[b.id] ?? unitCost(b, region)), 0)
  const lowLines = beverages.filter((b) => b.stockQuantity < LOW_STOCK).length

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    window.setTimeout(() => setToast((t) => (t?.msg === msg ? null : t)), 2200)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-crt-muted">
        <span>
          STOCK VALUE <span className="text-crt-text">{formatMoney(stockValue, region)}</span>
        </span>
        <span>
          LOW LINES <span className={lowLines ? 'text-crt-amber' : 'text-crt-text'}>{lowLines}</span>
        </span>
        {phase === 'SERVICE' && <span className="text-crt-amber">Live service — prices apply to the next order.</span>}
        {phase === 'SETTLEMENT' && <span className="text-crt-amber">Suppliers closed until morning.</span>}
      </div>
      {toast && (
        <div className={`rounded-sm border px-2 py-1 text-xs ${toast.ok ? 'border-crt-green text-crt-green' : 'border-crt-red text-crt-red'}`}>
          &gt; {toast.msg}
        </div>
      )}
      <ul className="divide-y divide-crt-line border border-crt-line">
        {sorted.map((b) => (
          <BeverageRow key={b.id} bev={b} onToast={showToast} />
        ))}
      </ul>
    </div>
  )
}

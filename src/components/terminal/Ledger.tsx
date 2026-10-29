import { Moon } from 'lucide-react'
import { formatMoney, round2 } from '../../engine/Economy'
import { nextDay } from '../../engine/GameLoop'
import { useGameStore } from '../../store/useGameStore'
import type { DayStats, Region } from '../../types/game'
import { Panel } from '../ui/Panel'
import { RetroButton } from '../ui/RetroButton'

function netProfit(d: DayStats) {
  return round2(d.grossRevenue - d.cogs - d.wages + d.eventCash)
}

function Row({ label, value, tone, bold, indent }: { label: string; value: string; tone?: string; bold?: boolean; indent?: boolean }) {
  return (
    <div className={`flex items-baseline gap-2 text-xs ${bold ? 'font-bold' : ''}`}>
      <span className={`${indent ? 'pl-3' : ''} text-crt-muted`}>{label}</span>
      <span className="flex-1 overflow-hidden whitespace-nowrap text-crt-line" aria-hidden>
        ................................................................
      </span>
      <span className={`tabular-nums ${tone ?? 'text-crt-text'}`}>{value}</span>
    </div>
  )
}

function Statement({ d, region, live }: { d: DayStats; region: Region; live: boolean }) {
  const fm = (n: number) => formatMoney(n, region)
  const gross = round2(d.grossRevenue - d.cogs)
  const net = netProfit(d)
  const gm = d.grossRevenue > 0 ? (gross / d.grossRevenue) * 100 : 0
  return (
    <div className="space-y-1">
      <Row label="Gross revenue" value={fm(d.grossRevenue)} />
      <Row label="Cost of goods sold" value={`(${fm(d.cogs)})`} tone="text-crt-red" indent />
      <Row label={`Gross profit · ${gm.toFixed(0)}% GM`} value={fm(gross)} bold />
      <Row label={live ? 'Wages (paid at close)' : 'Wages'} value={`(${fm(d.wages)})`} tone="text-crt-red" indent />
      <Row
        label="Events, fees & bonuses"
        value={d.eventCash < 0 ? `(${fm(-d.eventCash)})` : fm(d.eventCash)}
        tone={d.eventCash < 0 ? 'text-crt-red' : 'text-crt-green'}
        indent
      />
      <div className="border-t border-dashed border-crt-line pt-1">
        <Row label="NET PROFIT" value={fm(net)} tone={net < 0 ? 'text-crt-red' : 'text-crt-green text-glow'} bold />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 text-[11px] text-crt-muted sm:grid-cols-3">
        <span>
          drinks sold <b className="text-crt-text">{d.drinksSold}</b>
        </span>
        <span>
          guests served <b className="text-crt-text">{d.patronsServed}</b>
        </span>
        <span>
          walked out <b className={d.patronsLost ? 'text-crt-red' : 'text-crt-text'}>{d.patronsLost}</b>
        </span>
        <span>
          tips (to staff) <b className="text-crt-text">{fm(d.tips)}</b>
        </span>
        <span>
          stock bought <b className="text-crt-text">{fm(d.stockPurchases)}</b>
        </span>
        <span>
          prestige{' '}
          <b className={d.prestigeDelta < 0 ? 'text-crt-red' : 'text-crt-green'}>
            {d.prestigeDelta >= 0 ? '+' : ''}
            {d.prestigeDelta.toFixed(1)}
          </b>
        </span>
      </div>
    </div>
  )
}

function History({ history, region }: { history: DayStats[]; region: Region }) {
  if (history.length === 0) return <p className="text-xs text-crt-muted">No completed nights yet.</p>
  const rows = history.slice(-10)
  const maxAbs = Math.max(1, ...rows.map((d) => Math.abs(netProfit(d))))
  const BAR = 14
  return (
    <table className="w-full text-[11px] tabular-nums">
      <thead className="text-left text-crt-muted">
        <tr>
          <th className="py-1 font-normal">DAY</th>
          <th className="py-1 font-normal">REV</th>
          <th className="py-1 font-normal">NET</th>
          <th className="hidden py-1 font-normal sm:table-cell">TREND</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((d) => {
          const net = netProfit(d)
          const len = Math.round((Math.abs(net) / maxAbs) * BAR)
          return (
            <tr key={d.day} className="border-t border-crt-line">
              <td className="py-1">{d.day}</td>
              <td className="py-1">{formatMoney(d.grossRevenue, region)}</td>
              <td className={`py-1 ${net < 0 ? 'text-crt-red' : 'text-crt-green'}`}>{formatMoney(net, region)}</td>
              <td className={`hidden py-1 font-mono sm:table-cell ${net < 0 ? 'text-crt-red' : 'text-crt-green'}`}>
                {(net < 0 ? '▒' : '█').repeat(len) || '·'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function Ledger() {
  const phase = useGameStore((s) => s.currentPhase)
  const today = useGameStore((s) => s.today)
  const history = useGameStore((s) => s.history)
  const region = useGameStore((s) => s.region)
  const cash = useGameStore((s) => s.cash)
  const day = useGameStore((s) => s.day)
  const settled = phase === 'SETTLEMENT'
  const bankrupt = cash < -500

  return (
    <div className="space-y-3">
      <Panel
        title={settled ? `End-of-night report · Day ${today.day}` : `Running tally · Day ${today.day}`}
        right={!settled && <span className="text-[10px] text-crt-muted">{phase === 'SERVICE' ? 'LIVE' : 'NOT OPEN YET'}</span>}
      >
        <Statement d={today} region={region} live={!settled} />
        {settled && today.notes.length > 0 && (
          <ul className="mt-3 space-y-0.5 border-t border-crt-line pt-2 text-[11px] text-crt-amber">
            {today.notes.map((n) => (
              <li key={n}>! {n}</li>
            ))}
          </ul>
        )}
        {settled && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-crt-line pt-2">
            <span className="text-xs text-crt-muted">
              Cash on hand <b className={cash < 0 ? 'text-crt-red' : 'text-crt-green'}>{formatMoney(cash, region)}</b>
            </span>
            <RetroButton variant="amber" onClick={nextDay}>
              <Moon size={13} /> Start day {day + 1}
            </RetroButton>
          </div>
        )}
        {bankrupt && (
          <p className="mt-2 border border-crt-red p-2 text-xs text-crt-red">
            The bank is calling. You're more than {formatMoney(500, region)} in the red — cut costs or start over from SYS.
          </p>
        )}
      </Panel>

      <Panel title="History">
        <History history={history} region={region} />
      </Panel>
    </div>
  )
}

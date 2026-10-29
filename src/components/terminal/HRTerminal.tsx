import { Gift, UserMinus, UserPlus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { dailyWage, formatMoney } from '../../engine/Economy'
import { BONUS_COST, HIRING_FEE, useGameStore } from '../../store/useGameStore'
import type { Staff, StaffRole } from '../../types/game'
import { Badge } from '../ui/Badge'
import { ConfirmButton } from '../ui/ConfirmButton'
import { Panel } from '../ui/Panel'
import { RetroButton } from '../ui/RetroButton'
import { StatBar } from '../ui/StatBar'

const ROLE_TONE: Record<StaffRole, 'green' | 'blue' | 'amber'> = { BARTENDER: 'green', SERVER: 'blue', BOUNCER: 'amber' }
const ROLE_HINT: Record<StaffRole, string> = {
  BARTENDER: 'Pours drinks. Speed = throughput, Mixology = cocktails.',
  SERVER: 'Speeds up table service. Charm boosts tips.',
  BOUNCER: 'Calms rowdy guests; unlocks bouncer interventions.',
}

function moraleLabel(m: number) {
  if (m >= 80) return 'Thriving'
  if (m >= 60) return 'Content'
  if (m >= 40) return 'Tired'
  if (m >= 20) return 'Unhappy'
  return 'Quitting?'
}

function StaffCard({ member, children }: { member: Staff; children: ReactNode }) {
  const region = useGameStore((s) => s.region)
  return (
    <li className="space-y-1.5 px-2 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-bold text-crt-text">{member.name}</span>
        <Badge tone={ROLE_TONE[member.role]}>{member.role}</Badge>
        <span className="ml-auto text-xs tabular-nums text-crt-muted">
          {formatMoney(dailyWage(member, region), region)}/day
        </span>
      </div>
      <p className="text-[11px] italic text-crt-muted">{member.bio}</p>
      <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
        <StatBar label="SPD" value={member.stats.speed} max={10} />
        <StatBar label="MIX" value={member.stats.mixology} max={10} />
        <StatBar label="CHR" value={member.stats.charm} max={10} />
        <StatBar label="MOR" value={member.morale} max={100} low={0.4} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-crt-muted">{moraleLabel(member.morale)}</span>
        <div className="ml-auto flex gap-1">{children}</div>
      </div>
    </li>
  )
}

export function HRTerminal() {
  const staff = useGameStore((s) => s.staff)
  const applicants = useGameStore((s) => s.applicants)
  const phase = useGameStore((s) => s.currentPhase)
  const region = useGameStore((s) => s.region)
  const hire = useGameStore((s) => s.hire)
  const fire = useGameStore((s) => s.fire)
  const giveBonus = useGameStore((s) => s.giveBonus)
  const [msg, setMsg] = useState<string | null>(null)
  const locked = phase === 'SERVICE'
  const payroll = staff.reduce((sum, m) => sum + dailyWage(m, region), 0)
  const avgMorale = staff.length ? staff.reduce((s, m) => s + m.morale, 0) / staff.length : 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-crt-muted">
        <span>
          HEADCOUNT <span className="text-crt-text">{staff.length}</span>
        </span>
        <span>
          PAYROLL <span className="text-crt-text">{formatMoney(payroll, region)}/night</span>
        </span>
        <span>
          AVG MORALE <span className="text-crt-text">{Math.round(avgMorale)}</span>
        </span>
        {locked && <span className="text-crt-amber">Hiring locked during service.</span>}
      </div>
      {msg && <div className="rounded-sm border border-crt-green px-2 py-1 text-xs text-crt-green">&gt; {msg}</div>}

      <Panel title="On staff">
        <ul className="-m-2.5 divide-y divide-crt-line">
          {staff.length === 0 && <li className="p-3 text-xs text-crt-red">No staff. You can't open without a bartender.</li>}
          {staff.map((m) => (
            <StaffCard key={m.id} member={m}>
              <RetroButton size="xs" variant="blue" onClick={() => setMsg(giveBonus(m.id).message)} title={`Costs ${BONUS_COST}`}>
                <Gift size={11} /> Bonus {BONUS_COST}
              </RetroButton>
              <ConfirmButton
                size="xs"
                variant="danger"
                disabled={locked}
                confirmLabel="Really fire?"
                title="Other staff morale will drop"
                onConfirm={() => {
                  fire(m.id)
                  setMsg(`${m.name} has left the building.`)
                }}
              >
                <UserMinus size={11} /> Fire
              </ConfirmButton>
            </StaffCard>
          ))}
        </ul>
      </Panel>

      <Panel title="Applicants" right={<span className="text-[10px] text-crt-muted">Hiring fee {HIRING_FEE}</span>}>
        <ul className="-m-2.5 divide-y divide-crt-line">
          {applicants.length === 0 && <li className="p-3 text-xs text-crt-muted">No applicants right now.</li>}
          {applicants.map((a) => (
            <StaffCard key={a.id} member={a}>
              <span className="hidden text-[10px] text-crt-muted md:inline">{ROLE_HINT[a.role]}</span>
              <RetroButton size="xs" disabled={locked} onClick={() => setMsg(hire(a.id).message)}>
                <UserPlus size={11} /> Hire
              </RetroButton>
            </StaffCard>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

// Generates the daily supplier news-flash promos and flavour mail.
import emailData from '../data/emails.json'
import type { Email, PromoTarget, Region } from '../types/game'
import { REGIONS } from './Economy'

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export function generateDailyEmails(day: number, region: Region, firstDay = false): Email[] {
  const emails: Email[] = []
  const profile = REGIONS[region]

  if (firstDay) {
    emails.push({
      id: `d${day}-welcome`,
      day,
      from: 'Previous Owner <keys@handover.example>',
      subject: 'Keys are under the mat. Good luck.',
      body: [
        `Welcome to your new bar in ${profile.city}.`,
        '',
        'Quick handover notes:',
        '> CELLAR  — reorder stock and set retail prices. Watch the margin column.',
        '> HR      — two bartenders come with the place. Hire more if the queue backs up.',
        '> LEDGER  — the nightly settlement lands here after close.',
        '',
        'When you are ready, hit OPEN DOORS. Patrons arrive from 18:00, last call 01:30, close 02:00.',
        'Things will happen on the floor. You will have about 12 seconds to decide whether to step in.',
        '',
        'Don\'t let the regulars down.',
      ].join('\n'),
      read: false,
    })
  }

  const promo = pick(emailData.promos)
  const pct = 15 + Math.floor(Math.random() * 4) * 5
  const target = { ...promo.target } as PromoTarget
  if (target.tag) target.tag = target.tag.replace('{local}', profile.localTag)
  emails.push({
    id: `d${day}-promo`,
    day,
    from: promo.from,
    subject: promo.subject.replaceAll('{pct}', String(pct)),
    body: promo.body.replaceAll('{pct}', String(pct)),
    read: false,
    promo: { target, discountPct: pct, expiresDay: day },
  })

  if (!firstDay || Math.random() < 0.5) {
    const flavor = pick(emailData.flavor)
    emails.push({ id: `d${day}-flavor`, day, ...flavor, read: false })
  }

  return emails
}

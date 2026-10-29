// Shared world geometry for the simulation and the canvas renderer.
// The floor is a 320×180 logical pixel world scaled up with nearest-neighbour.
import type { Vec2 } from '../types/game'

export const WORLD = { w: 320, h: 180 }

export const COUNTER = { x: 20, y: 82, w: 244, h: 14 }
/** Feet line of bartenders; the counter hides their legs. */
export const BARTENDER_Y = 85
export const BARTENDER_MIN_X = 30
export const BARTENDER_MAX_X = 254

export const DOOR: Vec2 = { x: 306, y: 140 }
export const AISLE_Y = 128

export interface Seat {
  x: number
  y: number
  kind: 'BAR' | 'TABLE'
}

export const SEATS: Seat[] = [
  ...Array.from({ length: 8 }, (_, i): Seat => ({ x: 38 + i * 28, y: 106, kind: 'BAR' })),
  { x: 66, y: 158, kind: 'TABLE' },
  { x: 102, y: 158, kind: 'TABLE' },
  { x: 168, y: 158, kind: 'TABLE' },
  { x: 204, y: 158, kind: 'TABLE' },
]

export const TABLES: Vec2[] = [
  { x: 84, y: 160 },
  { x: 186, y: 160 },
]

/** Counter x position a bartender works at to serve a given seat. */
export function serviceX(seat: Seat): number {
  return seat.kind === 'BAR' ? seat.x : BARTENDER_MAX_X
}

export function pathToSeat(seat: Seat): Vec2[] {
  return [
    { x: DOOR.x - 14, y: AISLE_Y + 6 },
    { x: seat.x, y: AISLE_Y + 6 },
    { x: seat.x, y: seat.y },
  ]
}

export function pathToDoor(from: Vec2): Vec2[] {
  return [
    { x: from.x, y: AISLE_Y + 6 },
    { x: DOOR.x - 14, y: AISLE_Y + 6 },
    { x: DOOR.x + 10, y: DOOR.y },
  ]
}

/** Service hours, in minutes after midnight of the opening day. */
export const OPEN_MIN = 18 * 60
export const LAST_CALL_MIN = 25 * 60 + 30
export const CLOSE_MIN = 26 * 60
/** Game minutes that pass per sim-second (sim-seconds = real seconds × speed). */
export const CLOCK_RATE = 2

export function formatClock(minutes: number): string {
  const m = Math.floor(minutes) % (24 * 60)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

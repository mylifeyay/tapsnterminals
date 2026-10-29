import type { BeverageCategory, PatronArchetype } from '../types/game'

export interface ArchetypeProfile {
  label: string
  /** Relative spawn weight. */
  weight: number
  /** Multiple of unit cost this archetype considers a fair price. */
  markupTolerance: number
  /** Patience lost per sim-second while waiting. */
  patienceDrain: number
  /** Sim-seconds to finish a drink. */
  drinkTime: number
  maxDrinks: number
  reorderChance: number
  tipMultiplier: number
  prefers: { categories: BeverageCategory[]; tags: string[] }
  chatter: string[]
}

// 'local' is resolved to the active region's local tag at runtime.
export const ARCHETYPES: Record<PatronArchetype, ArchetypeProfile> = {
  REGULAR: {
    label: 'Regular',
    weight: 3,
    markupTolerance: 4.0,
    patienceDrain: 1.6,
    drinkTime: 28,
    maxDrinks: 4,
    reorderChance: 0.75,
    tipMultiplier: 1.2,
    prefers: { categories: ['LAGER', 'STOUT'], tags: ['local', 'draught'] },
    chatter: ['Same as always.', 'Good crowd tonight.', 'Footy on later?', 'Ah, that hits the spot.'],
  },
  TOURIST: {
    label: 'Tourist',
    weight: 2,
    markupTolerance: 4.8,
    patienceDrain: 2.2,
    drinkTime: 24,
    maxDrinks: 2,
    reorderChance: 0.5,
    tipMultiplier: 1.0,
    prefers: { categories: ['COCKTAIL', 'LAGER'], tags: ['local', 'signature'] },
    chatter: ['So cute in here!', 'Is this place on the map?', '*takes photo of drink*', 'Love the vibe.'],
  },
  OFFICE_WORKER: {
    label: 'Office Worker',
    weight: 3,
    markupTolerance: 4.3,
    patienceDrain: 2.6,
    drinkTime: 22,
    maxDrinks: 3,
    reorderChance: 0.6,
    tipMultiplier: 1.1,
    prefers: { categories: ['LAGER', 'CIDER', 'COCKTAIL'], tags: ['mainstream', 'crisp'] },
    chatter: ['What a day…', 'My boss, honestly.', 'Quarterly reports, ugh.', 'Finally.'],
  },
  STUDENT: {
    label: 'Student',
    weight: 2,
    markupTolerance: 3.2,
    patienceDrain: 1.8,
    drinkTime: 30,
    maxDrinks: 3,
    reorderChance: 0.55,
    tipMultiplier: 0.6,
    prefers: { categories: ['LAGER', 'CIDER'], tags: ['mainstream', 'easy', 'sweet'] },
    chatter: ['Exams tomorrow lol', 'Split the bill?', 'This is so good.', 'One more, then home.'],
  },
  CONNOISSEUR: {
    label: 'Connoisseur',
    weight: 1,
    markupTolerance: 5.0,
    patienceDrain: 2.0,
    drinkTime: 34,
    maxDrinks: 2,
    reorderChance: 0.5,
    tipMultiplier: 1.5,
    prefers: { categories: ['STOUT', 'ALE', 'SPIRIT', 'COCKTAIL'], tags: ['premium', 'craft', 'classic', 'dark'] },
    chatter: ['Notes of toffee…', 'Decent head retention.', 'Hmm. Acceptable.', 'Who does your lines?'],
  },
  ROWDY: {
    label: 'Rowdy',
    weight: 1,
    markupTolerance: 3.8,
    patienceDrain: 3.2,
    drinkTime: 16,
    maxDrinks: 5,
    reorderChance: 0.85,
    tipMultiplier: 0.8,
    prefers: { categories: ['LAGER', 'SPIRIT'], tags: ['mainstream', 'neat'] },
    chatter: ['WOOO!', 'Shots? SHOTS!', 'Turn it UP!', 'Love you guys!'],
  },
}

export const FIRST_NAMES = [
  'Aiden', 'Bea', 'Chen', 'Dara', 'Eli', 'Farah', 'Gus', 'Hui Min', 'Ines', 'Jun', 'Kofi', 'Lena', 'Marco', 'Nadia',
  'Oskar', 'Pia', 'Quinn', 'Ravi', 'Siti', 'Theo', 'Uma', 'Viktor', 'Wen', 'Ximena', 'Yusuf', 'Zoe', 'Frank', 'Mags',
]

# Taps & Terminals

A cozy pixel-art bar management sim, built as an installable, offline-capable PWA.

- **Terminal view** — retro back-office OS: Inbox (supplier promos), Cellar (stock, prices, margins), HR (hire/fire, morale), Ledger (nightly P&L), Sys (region, install, reset).
- **Bar Floor view** — 320×180 canvas scaled with nearest-neighbour. Patrons arrive, order, wait, drink and leave, with speech bubbles and 12-second timed interventions.
- **Day loop** — `TERMINAL` (prep) → `SERVICE` (18:00–02:00, Pause/1×/2×/4×/Skip) → `SETTLEMENT` (wages, morale, prestige, ledger).
- Mobile (<768px) toggles views with a bottom tab bar. Desktop shows floor and terminal side by side.

## Scripts

```bash
npm run dev      # Vite dev server
npm run build    # type-check + production build + service worker
npm run preview  # serve dist/ (test PWA install/offline here)
npm run lint     # oxlint
node scripts/generate-icons.mjs   # regenerate PWA icons, favicon and placeholder sprites
```

## Layout

```
src/
  components/{layout,terminal,floor,ui}/
  engine/
    GameLoop.ts    fixed-step rAF loop, speed controls, phase transitions, skip-to-end
    Simulation.ts  per-tick patrons, ordering, bartender work
    Economy.ts     regional multipliers, unit cost, promos, margins, price sensitivity
    Events.ts      narrative event triggers + 12s real-time intervention timer
    Inbox.ts       daily supplier promo / flavour mail generation
    archetypes.ts  patron archetype tuning
    layout.ts      shared world geometry + service hours
  data/            beverages.json, staff.json, events.json, emails.json
  store/           useGameStore (persisted), useInventoryStore (persisted)
  types/game.ts
```

Progress autosaves to `localStorage`. Reloading mid-service resumes paused with an empty floor.
In dev, the game store is available in the console as `window.__game`.

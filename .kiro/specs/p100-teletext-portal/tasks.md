# P100 Teletext Crisis & Transit Portal: Task Execution Plan

## Phase 1: Project Setup and Dependencies
- [ ] 1.1 Initialize project structure with `package.json`, TypeScript config (`tsconfig.json`), and Vite configuration.
- [ ] 1.2 Install runtime dependencies: `hono`, `@hono/node-server` (for local dev/testing if needed), `react`, `react-dom`.
- [ ] 1.3 Install dev dependencies: `@cloudflare/vite-plugin` (or wrangler setup), `wrangler`, `vite`, `@vitejs/plugin-react`, `vitest`, `fast-check`, `@types/react`, `@types/react-dom`, `@types/node`.
- [ ] 1.4 Configure Cloudflare Workers configuration (`wrangler.jsonc`) and build scripts in `package.json`.

## Phase 2: Core Teletext Engine & Guardrails
- [ ] 2.1 Implement `src/teletext/types.ts`: Teletext color definitions, span schema, frame schema, and Fastext contracts.
- [ ] 2.2 Implement `src/teletext/sanitizer.ts`: Control character stripper, ASCII normalizer, and length boundary limiter.
- [ ] 2.3 Implement `src/teletext/formatter.ts`: Line-wrapping, fixed 40-character row padding, 24-row grid builder, and header/Fastext row generators.
- [ ] 2.4 Implement `src/teletext/validator.ts`: Page code regex validator (`^[1-9][0-9]{2}$`) and payload byte-budget guard (`< 2048` bytes).
- [ ] 2.5 Implement `src/teletext/page404.ts`: Deterministic P404 Page Not Found teletext frame generator.

## Phase 3: Edge Services & Data Feeds
- [ ] 3.1 Implement `src/server/services/earthquake.ts`: USGS 4.5+ Day GeoJSON integration with timeout `<= 3000ms`, severity sorting, and deterministic fallback data.
- [ ] 3.2 Implement `src/server/services/weather.ts`: Open-Meteo weather and alert integration with 40-column formatting and deterministic fallback data.
- [ ] 3.3 Implement `src/server/services/transit.ts`: Transit line status board with real-time delays, suspensions, and advisory notes.
- [ ] 3.4 Implement `src/server/services/emergency.ts`: Emergency hotlines, disaster shelter directory, and offline-first crisis frequencies.
- [ ] 3.5 Implement `src/server/services/diagnostics.ts`: Live payload telemetry, byte-budget diagnostics, and network payload comparative data.
- [ ] 3.6 Implement `src/server/services/indexPage.ts`: Master index P100 with channel directory, broadcast status, and system clock.
- [ ] 3.7 Implement `src/server/index.ts`: Hono app router mounting `/api/page/:code`, `/api/health`, and static asset serving.

## Phase 4: Property-Based Testing & Verification
- [ ] 4.1 Create `tests/teletext.pbt.test.ts` with `fast-check` and `vitest`:
  - Invariant 1: Exactly 24 rows for all generated frames.
  - Invariant 2: Every row has visible width <= 40 characters.
  - Invariant 3: Serialized frame JSON length is strictly < 2048 bytes.
  - Invariant 4: Arbitrary adversarial input strings never crash the formatting pipeline.
  - Invariant 5: Invalid page codes cleanly produce a valid P404 frame.
  - Invariant 6: Critical badges (`CRITICAL`, `WARNING`, `ALERT`) are never split or dropped.
- [ ] 4.2 Create unit tests for each channel service (`tests/services.test.ts`).
- [ ] 4.3 Set up Kiro Agent Hook in `.kiro/hooks/` to run tests on change.

## Phase 5: Authentic Teletext Client UI
- [ ] 5.1 Implement CRT terminal styles `src/client/styles/teletext.css`:
  - 40x24 monospace grid with `ch` character units.
  - 8-color WST teletext palette.
  - Pure CSS scanlines, vignette curvature, phosphor glow, and toggle controls.
- [ ] 5.2 Implement `src/client/components/TeletextScreen.tsx`: 40x24 character grid renderer with span formatting and double-height support.
- [ ] 5.3 Implement `src/client/components/TeletextHeader.tsx`: Live teletext clock and rolling page number hunt animation (`P100 -> P201`).
- [ ] 5.4 Implement `src/client/components/TeletextFastext.tsx`: Row 24 interactive colored buttons (Red, Green, Yellow, Cyan) with keyboard shortcut badges.
- [ ] 5.5 Implement `src/client/components/TeletextRemote.tsx`: Retro handheld TV remote keypad with numpad (0-9), subpage arrows, and power/mode toggles.
- [ ] 5.6 Implement `src/client/components/TeletextHUD.tsx`: Live payload byte size badge (`< 2KB`), latency indicator, and Slow-2G simulation toggle.
- [ ] 5.7 Implement `src/client/App.tsx`: Main application shell wiring keyboard events, data fetching, subpage cycling, and error boundaries.

## Phase 6: Final Verification & Documentation
- [ ] 6.1 Execute all Vitest and fast-check Property-Based Tests (`bun run test`).
- [ ] 6.2 Verify build (`bun run build` / `npm run build`) with zero TypeScript errors.
- [ ] 6.3 Test Cloudflare Workers deployment configuration with `wrangler.jsonc`.
- [ ] 6.4 Write complete `README.md` with architecture details, quickstart, and "How Kiro Was Used" section.

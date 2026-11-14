# P100: Resurrected 1980s Teletext Crisis and Transit Portal

P100 is an ultra-low-bandwidth, high-resilience crisis communication and transit broadcast portal designed for the Kiroween 2026 Hackathon (Resurrection category). Built on Cloudflare Workers, Hono, React, and Vite, it revives the 1980s World System Teletext (WST) broadcast standard to deliver critical emergency, meteorological, seismic, and transit intelligence within a strict sub-2KB payload ceiling.

---

## Architectural Rules and Invariants

1. **Strict 40x24 Teletext Grid:** Every broadcast frame renders as an exact matrix of 24 rows by 40 columns (960 character cells). No row exceeds 40 visible columns.
2. **Hard Sub-2KB Payload Ceiling:** Every JSON frame response (`/api/page/:code`) is strictly under 2,048 bytes UTF-8 encoded.
3. **Zero-Bloat Monospace CRT Interface:** Pure CSS scanlines, phosphor glow, and the classic 8-color Teletext palette (`#000000`, `#FF0000`, `#00FF00`, `#FFFF00`, `#0000FF`, `#FF00FF`, `#00FFFF`, `#FFFFFF`). No external web fonts or heavy images.
4. **Resilient Public API Integrations:** Live USGS earthquake feed and Open-Meteo forecasts run with a hard 3,000ms fetch timeout (`AbortSignal.timeout(3000)`). Any network failure or rate limit degrades immediately to deterministic cached emergency frames.

---

## Broadcast Channels

| Page Code | Title | Description |
|-----------|-------|-------------|
| **P100** | Master Index & Broadcast Clock | Channel directory, live transmission status, and navigation shortcuts. |
| **P201 (1/2)** | Global Seismic Monitor | Real-time USGS 4.5+ Day earthquake feed sorted severity-first. |
| **P201 (2/2)** | Meteorological Severe Radar | Live Open-Meteo weather parameters and severe weather advisories. |
| **P301** | Metro & Regional Transit Board | Multi-line railway dispatch status (`ON TIME`, `DELAYED`, `SUSPENDED`). |
| **P401** | Emergency Hotlines & Relief Directory | Offline-resilient emergency contacts, radio frequencies, and checklist. |
| **P999** | Byte-Budget Diagnostics | Live payload telemetry and simulated Slow-2G latency toggle. |
| **P404** | Transmission Not Found | Safe fallback broadcast frame for unallocated or invalid codes. |

---

## User Controls and Navigation

- **Page Code Direct Dial:** Type any 3 digits (100 to 999) on your physical keyboard or click the virtual TV remote keypad to trigger the classic Teletext page roll hunt.
- **Fastext Color Links (Row 24):** Click colored buttons or press shortcut keys:
  - `R` or `r`: Red link
  - `G` or `g`: Green link
  - `Y` or `y`: Yellow link
  - `C` or `c`: Cyan link
- **Subpage Carousel:** Press `Left Arrow` or `Right Arrow` (or click `< PREV` / `NEXT >` on the remote) to cycle through multi-page feeds like P201.
- **Reset:** Press `Esc` or `H` to return to Master Index P100.
- **HUD Toggles:** Toggle CRT scanlines, phosphor glow, or Slow-2G simulation mode (2,500ms delay) in the top header.

---

## Project Structure

```
p100/
├── .kiro/
│   ├── steering/
│   │   └── p100-standards.md       # Architectural guardrails (inclusion: always)
│   ├── specs/
│   │   └── p100-teletext-portal/
│   │       ├── requirements.md     # Functional and non-functional requirements
│   │       ├── design.md           # System architecture, schemas, and grid design
│   │       └── tasks.md            # Phased implementation plan
│   └── hooks/
│       ├── pbt-guard-hook.json     # Kiro hook definition for test execution
│       └── run-pbt.sh              # Hook runner script
├── src/
│   ├── teletext/
│   │   ├── types.ts                # Teletext colors, spans, and frame schema
│   │   ├── sanitizer.ts            # Control character removal and ASCII mapping
│   │   ├── formatter.ts            # 40x24 grid engine, wrapping, and padding
│   │   ├── validator.ts            # Page code validation and byte budget checker
│   │   └── page404.ts              # Deterministic P404 frame generator
│   ├── server/
│   │   ├── index.ts                # Hono edge router and page dispatcher
│   │   └── services/
│   │       ├── indexPage.ts        # P100 service
│   │       ├── earthquake.ts       # P201 subpage 1 USGS service
│   │       ├── weather.ts          # P201 subpage 2 Open-Meteo service
│   │       ├── transit.ts          # P301 transit status service
│   │       ├── emergency.ts        # P401 emergency directory service
│   │       └── diagnostics.ts      # P999 byte-budget telemetry service
│   └── client/
│       ├── main.tsx                # Client entry point
│       ├── App.tsx                 # Terminal application shell
│       ├── styles/
│       │   └── teletext.css        # CRT scanlines, bezel, and teletext styles
│       └── components/
│           ├── TeletextScreen.tsx  # 40x24 monospace grid viewport
│           ├── TeletextFastext.tsx # Interactive row 24 color buttons
│           ├── TeletextRemote.tsx  # Retro handheld TV remote numpad
│           └── TeletextHUD.tsx     # Byte budget, latency, and CRT switches
├── tests/
│   ├── teletext.pbt.test.ts        # Property-based tests (fast-check + vitest)
│   └── services.test.ts            # Edge services and API router unit tests
├── wrangler.jsonc                  # Cloudflare Workers configuration
├── vite.config.ts                  # Vite + @cloudflare/vite-plugin build configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Project metadata and run scripts
```

---

## How Kiro Was Used

This project followed Kiro's Spec-Driven Development workflow strictly in four distinct phases:

1. **Steering and Guardrails (`.kiro/steering/p100-standards.md`):**
   Established non-negotiable architectural invariants upfront with `inclusion: always`. It locked the project to a 40x24 grid, a 2,048-byte response ceiling, pure CSS CRT rendering, and strict input sanitization.

2. **Spec-Driven Planning (`.kiro/specs/p100-teletext-portal/`):**
   Created `requirements.md`, `design.md`, and `tasks.md` before generating code. The specifications defined the compact span schema, the API contract, and the exact channel breakdown.

3. **Property-Based Testing (`tests/teletext.pbt.test.ts`):**
   Integrated `fast-check` with `vitest` to verify universal invariants across hundreds of randomized runs:
   - Every assembled frame produces exactly 24 rows.
   - Every row visible width is less than or equal to 40 characters.
   - Serialized JSON frame size is strictly under 2,048 bytes for realistic content and all production channels.
   - Critical badges (`CRITICAL`, `WARNING`, `ALERT`, `EVACUATE`, `SUSPENDED`) are never broken or lost during line-wrapping.
   - Malformed or adversarial page inputs safely resolve to a valid P404 frame without throwing exceptions.

4. **Kiro Agent Hook (`.kiro/hooks/`):**
   Configured `pbt-guard-hook.json` and `run-pbt.sh` to trigger invariant tests whenever files in `src/teletext/` or `src/server/` change, keeping the byte budget and grid rules green.

---

## Quickstart & Local Development

### 1. Install Dependencies
```bash
bun install
# or: npm install
```

### 2. Run Test Suite (Unit & Property-Based Tests)
```bash
bun run test
# or: npm test
```

### 3. Run Development Server
```bash
bun run dev
# or: npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
bun run build
# or: npm run build
```

### 5. Deploy to Cloudflare Workers
```bash
bun run deploy
# or: npx wrangler deploy
```

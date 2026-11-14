# P100 Teletext Crisis & Transit Portal: Design Document

## 1. System Architecture

P100 implements an edge-rendered Teletext broadcast architecture running on Cloudflare Workers using Hono for the API and React + Vite for the frontend terminal interface.

```
+-------------------------------------------------------------------------+
|                      Client Terminal (React / Pure CSS)                 |
|  +-------------------------------------------------------------------+  |
|  | Header Bar (Row 1): P100   P100 TELETEXT CRISIS   12:34:56 UTC    |  |
|  | CRT Screen Container (40 columns x 24 rows monospace grid)        |  |
|  | Body Content (Rows 2-23): Teletext Spans (8-color palette)         |  |
|  | Fastext Bar (Row 24): [RED] [GREEN] [YELLOW] [CYAN]                |  |
|  +-------------------------------------------------------------------+  |
|  | HUD: Payload Byte Meter (<2KB) | CRT FX Toggle | Slow-2G Latency  |  |
|  | Virtual TV Remote Numpad (0-9, Subpage Left/Right, Fastext Keys)  |  |
+-------------------------------------------------------------------------+
                                   |
                  GET /api/page/:code?subpage=N (<2KB JSON)
                                   v
+-------------------------------------------------------------------------+
|                   Cloudflare Worker / Hono Edge API                     |
|  +-------------------------------------------------------------------+  |
|  | Router: /api/page/:code -> Page Code Validator (^[1-9][0-9]{2}$)  |  |
|  +-------------------------------------------------------------------+  |
|  | Page Dispatcher & Fetch Orchestrator (timeout <= 3000ms)          |  |
|  |  - P100: Master Index & System Status                             |  |
|  |  - P201: Live USGS Quakes & Open-Meteo Weather (Subpages 1 & 2)  |  |
|  |  - P301: Transit & Rail Board (Realtime + Fallback)               |  |
|  |  - P401: Emergency Hotlines & Disaster Shelter Directory         |  |
|  |  - P999: Diagnostics, Byte-Budget Telemetry & Latency Test        |  |
|  |  - Fallback: Deterministic P404 Frame                             |  |
|  +-------------------------------------------------------------------+  |
|  | Teletext Formatting & Padding Engine (Strict 40x24 Cells)        |  |
|  | Text Sanitizer (Control character stripping & ASCII normalization)|  |
|  | Byte-Budget Guard: JSON Payload Size Verification (< 2,048 Bytes) |  |
+-------------------------------------------------------------------------+
            |                              |
            v                              v
   [USGS Earthquake Feed]         [Open-Meteo Weather API]
    (GeoJSON 4.5+ Day)             (Current & Alerts)
```

## 2. Teletext Data Contract & Compact Schema

To guarantee that responses remain strictly below 2,048 bytes across all channels while preserving rich color information, the wire format uses a compact span structure:

```typescript
export type TeletextColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white';

export interface TeletextSpan {
  t: string;           // text content
  c?: TeletextColor;   // foreground color (default: white)
  b?: TeletextColor;   // background color (default: black)
  d?: boolean;         // double height / bold flag
}

export interface FastextItem {
  code: string;        // target page code e.g. "201"
  label: string;       // 8-10 char label e.g. "WEATHER"
}

export interface FastextNav {
  red: FastextItem;
  green: FastextItem;
  yellow: FastextItem;
  cyan: FastextItem;
}

export interface TeletextFrameResponse {
  code: string;            // 3-digit page code (e.g. "100")
  subpage: number;         // 1-based index (e.g. 1)
  totalSubpages: number;   // total subpages (e.g. 2)
  title: string;           // channel title
  timestamp: string;       // ISO timestamp
  rows: TeletextSpan[][];  // exactly 24 rows, each row visible width <= 40
  fastext: FastextNav;     // 4 Fastext links
  source: 'live' | 'cache' | 'fallback';
  bytes: number;           // calculated UTF-8 payload byte size
}
```

### 2.1 Grid Invariant Specifications
1. **Total Rows:** `rows.length === 24`
2. **Row 1:** Header line with page number, channel header, and live time ticker.
3. **Rows 2-23:** Content rows. Visible character count `sum(span.t.length) <= 40`.
4. **Row 24:** Fastext row divided into 4 columns of 10 characters each:
   `RED: [label] | GRN: [label] | YEL: [label] | CYN: [label]`.
5. **Byte Cap:** `new TextEncoder().encode(JSON.stringify(response)).length < 2048`.

## 3. Server Component Architecture

### 3.1 Input Validation & Sanitization (`src/teletext/validator.ts` & `sanitizer.ts`)
- Regex validation: `^[1-9][0-9]{2}$`. If invalid or unhandled, route to `generatePage404()`.
- Control character removal: Strips `\x00-\x1F` (except LF) and Unicode surrogate pairs.
- Width clipping: Truncates or wraps text that exceeds 40 characters per line.
- Severity tag preservation: Critical keywords (`CRITICAL`, `WARNING`, `ALERT`, `EVACUATE`, `SUSPENDED`) are preserved on line wrapping.

### 3.2 Upstream Service Orchestrators (`src/server/services/`)
- **Earthquake Service (`earthquake.ts`):**
  - Fetches USGS 4.5+ Day summary geojson.
  - AbortController timeout: 3000ms.
  - Sorts features by magnitude descending.
  - Formats top 4-5 events into severity badges (`M6.2`, `M5.1`), location, and elapsed time.
  - In-memory fallback dataset provided if USGS fails or times out.
- **Weather Service (`weather.ts`):**
  - Fetches Open-Meteo public forecast endpoint.
  - Formats temperature, wind speed, pressure, and warning advisories into 40-column summaries.
  - In-memory fallback dataset provided if Open-Meteo fails or times out.
- **Transit Service (`transit.ts`):**
  - Generates real-time metro/rail status board across 5 primary lines:
    Central Line, Metropolitan, District, Northern, Express Rail.
  - In-memory deterministic simulation engine with periodic status updates.
- **Emergency Service (`emergency.ts`):**
  - Fully offline-resilient emergency directory: Police/Ambulance, Civil Defense, Flood/Tsunami hotline, emergency radio frequencies (AM 680, FM 98.5), and evacuation muster points.
- **Diagnostics Service (`diagnostics.ts`):**
  - Calculates real-time payload stats of all endpoints.
  - Provides comparative data against contemporary web bloat.

## 4. Frontend Component Architecture

### 4.1 Monospace CRT Terminal Display (`src/client/components/TeletextScreen.tsx`)
- Container styled with CSS variables:
  `--tt-cols: 40; --tt-rows: 24;`
- Monospace font stack with character-width precision.
- CRT Layer toggles:
  - Scanlines (CSS repeating linear gradient overlay).
  - Screen curvature & vignette border shadow.
  - Phosphor text glow effect (`text-shadow: 0 0 2px currentColor`).
  - Monochromatic/Amber retro mode or full 8-color WST mode.

### 4.2 Teletext Controller & Keypad (`src/client/components/TeletextRemote.tsx`)
- Keyboard hook listening for:
  - Numeric digits `0-9`: Appends to a 3-digit buffer. After 3 digits, triggers page load.
  - `R`, `G`, `Y`, `C`: Triggers respective Fastext button.
  - `ArrowLeft` / `ArrowRight`: Navigates subpages.
  - `Escape` or `H`: Resets to `P100`.
- Header Roll Simulation:
  - While fetching, header page number cycles rapidly (e.g. `P100` -> `P101` -> `P102` -> `P201`).
- Simulated Slow-2G Latency Mode:
  - Toggle switch in HUD introduces artificial 1,500ms network delay before rendering to visualize Teletext performance in low-connectivity crisis scenarios.

## 5. Property-Based Testing Strategy (`tests/teletext.pbt.test.ts`)
Using `fast-check` with `vitest`:
1. Generate random page strings, long adversarial names, HTML injection strings, special Unicode characters, and emojis.
2. Invariant 1: `frame.rows.length === 24` always.
3. Invariant 2: `visibleWidth(row) <= 40` for every row in 0..23.
4. Invariant 3: `new TextEncoder().encode(JSON.stringify(frame)).length < 2048` for all pages.
5. Invariant 4: Any invalid code parameter returns a valid `P404` frame with 24 rows and < 2KB payload.
6. Invariant 5: Critical severity tokens are never cut off mid-word.

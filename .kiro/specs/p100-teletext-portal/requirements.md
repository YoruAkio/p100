# P100 Teletext Crisis & Transit Portal: Requirements Document

## 1. Overview
P100 is a resurrected 1980s Teletext crisis communication and public transit broadcast portal designed for ultra-low bandwidth, high-resilience conditions. It combines authentic World System Teletext (WST) aesthetics with modern edge execution on Cloudflare Workers and Hono.

## 2. User Stories & Functional Requirements

### 2.1 Navigation & Control
- **REQ-NAV-1 (3-Digit Page Codes):** The user can enter any 3-digit page code (`100` to `999`) via physical keyboard number keys (0-9) or via an on-screen retro TV remote keypad.
- **REQ-NAV-2 (Header Page Rolling):** When a user enters a 3-digit code, the Teletext header counter simulates the authentic broadcast page hunt (rolling numbers) for 150-300ms before locking onto the requested page.
- **REQ-NAV-3 (Fastext Navigation):** The user can navigate quickly using 4 designated Fastext color links on row 24:
  - RED (Key: `R` or `r`)
  - GREEN (Key: `G` or `g`)
  - YELLOW (Key: `Y` or `y`)
  - CYAN (Key: `C` or `c`)
  Each page defines its own contextual Fastext targets.
- **REQ-NAV-4 (Subpage Carousel):** Multi-subpage channels (such as P201) allow cycling through subpages (`1/2`, `2/2`) using `Left` and `Right` arrow keys or on-screen prev/next buttons.
- **REQ-NAV-5 (Invalid Code Handling):** Entering an unallocated or invalid page code (or malformed URL) loads a valid `P404` "Page Not Found" Teletext broadcast screen displaying guidance and jump options back to `P100`.

### 2.2 Broadcast Channels
- **REQ-CHAN-100 (Master Index & Status):**
  - Displays service title, current UTC date/time, and emergency transmission alert status.
  - Lists primary section index (`P201 Live Weather/Quake`, `P301 Rail Transit`, `P401 Emergency Aid`, `P999 Telemetry/Diagnostics`).
  - Lists quick navigation tips.
- **REQ-CHAN-201 (Live Weather & Seismic Alerts):**
  - Subpage 1: Seismic Activity. Integrates live USGS 4.5+ Day earthquake feed (`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson`). Renders magnitude, location, depth, and age. Priority sorted by severity.
  - Subpage 2: Weather & Severe Conditions. Summarizes current weather parameters and severe weather warnings from Open-Meteo.
  - Deterministic fallbacks activate if live feeds are unreachable or timeout.
- **REQ-CHAN-301 (Live Transit & Rail Status):**
  - Displays multi-line metro/railway system status (Line names, status: `ON TIME`, `DELAYED`, `SUSPENDED`, advisory notes).
  - High-visibility color tags (Green for on-time, Yellow for delayed, Red for suspended).
- **REQ-CHAN-401 (Emergency Hotlines & Relief Directory):**
  - Instant reference for crisis hotlines (Medical, Fire, Civil Defense, Coastal Guard).
  - Emergency radio frequencies (AM/FM/SW bands) and designated muster points / emergency shelters.
  - Designed for 100% offline-first cached availability.
- **REQ-CHAN-999 (Bandwidth & Diagnostics):**
  - Live payload meter showing exact byte count of current page JSON response.
  - Comparative benchmark against average modern web pages (e.g., 2,500,000 bytes vs < 2,048 bytes).
  - Simulated latency toggle (Normal edge vs Slow-2G 2000ms delay) to demonstrate Teletext resilience on degraded networks.

### 2.3 Display & Visual Aesthetics
- **REQ-UI-1 (Strict 40x24 Grid):** Display area must maintain a strict 40-character width by 24-row height layout across all viewport sizes.
- **REQ-UI-2 (Color Palette):** Restricted to the 8 standard Teletext colors (Black, Red, Green, Yellow, Blue, Magenta, Cyan, White).
- **REQ-UI-3 (CRT Visual Effects):** Pure CSS CRT simulation with toggleable scanlines, vignette curvature, phosphor bloom, and flicker controls.
- **REQ-UI-4 (Payload HUD):** Displays live HUD metrics in the chrome header: `PAYLOAD: XXX BYTES (< 2KB)` along with response latency and channel status.

## 3. Non-Functional & Resilience Requirements
- **NFR-PERF-1 (Sub-2KB Payload Limit):** All JSON API endpoints returning Teletext frames must measure `< 2048 bytes` UTF-8 serialized.
- **NFR-PERF-2 (Fetch Timeout):** All upstream API requests must strictly time out within 3,000 milliseconds.
- **NFR-RESIL-1 (Deterministic Fallbacks):** The server must never throw 500 errors when third-party APIs fail; cached or pre-baked crisis data must be returned with a fallback flag.
- **NFR-SEC-1 (Input Sanitization):** Control characters and unsafe HTML/ANSI injections must be stripped from external feeds.
- **NFR-TEST-1 (Property-Based Testing):** Core formatting and grid packing engines must be verified against property-based invariant test suites using `fast-check`.

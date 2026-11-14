---
inclusion: always
title: P100 Teletext Standards and Architectural Guardrails
---

# P100 Teletext Standards & Guardrails

This document defines the non-negotiable architectural rules for the P100 Teletext Crisis and Transit Portal.

## 1. Strict 40x24 Teletext Grid
- Every rendered Teletext frame must be an exact grid of 24 rows by 40 columns (960 total character cells).
- Row 1 (Header/Status Bar):
  - Characters 1-4: Page code (for example "P100", "P201").
  - Characters 5-32: Service name and header text ("P100 TELETEXT CRISIS").
  - Characters 33-40: Live UTC/teletext clock (HH:MM:SS).
- Rows 2 through 23: Content area.
  - No row may ever exceed 40 visible characters.
  - When text wrapping occurs, words wrap before column 40 or truncate with ellipses if single tokens exceed line capacity.
  - If content is shorter than 22 rows, empty lines are padded out to reach exactly 24 rows total.
- Row 24: Navigation & Fastext bar:
  - Formatted with 4 standard colored links: Red, Green, Yellow, Cyan.
  - Exactly 40 columns wide (e.g., 4 x 10 character blocks).

## 2. Hard Sub-2KB Payload Ceiling
- Every serialized page API response (`/api/page/:code` or subpage query) must measure strictly under 2,048 bytes (< 2 KB) UTF-8 encoded.
- Payload verification formula:
  `new TextEncoder().encode(JSON.stringify(serializedFrame)).length < 2048`
- Data representation is optimized for transmission density:
  - Rows are transmitted as arrays of strings or compact run-length style text spans.
  - Avoid redundant metadata, verbose nested objects, or decorative keys.
  - Timestamps use concise ISO or epoch format.

## 3. Zero-Bloat Frontend
- No external UI component frameworks or heavy dependencies.
- No external web fonts; use monospace system font stacks (`Courier New`, `Courier`, `Consolas`, `monospace`).
- No heavy image assets; all graphics and banners are rendered using block elements, ASCII/teletext mosaic characters, or pure CSS.
- Classic 8-color Teletext palette only:
  - Black: `#000000`
  - Red: `#FF0000`
  - Green: `#00FF00`
  - Yellow: `#FFFF00`
  - Blue: `#0000FF`
  - Magenta: `#FF00FF`
  - Cyan: `#00FFFF`
  - White: `#FFFFFF`
- CRT effects (scanlines, phosphor glow, curvature) must be lightweight pure CSS with a toggle to disable for maximum accessibility and performance.

## 4. Security & Resilience ("Spec it safe")
- Input Validation:
  - Validate all page codes against the 3-digit regex `^[1-9][0-9]{2}$` (valid range 100 to 999).
  - Subpage parameters must be positive integers `1 <= subpage <= totalSubpages`.
  - Any invalid, malformed, or out-of-range request must return a deterministic `P404` "Page Not Found" Teletext frame with status 200/404, never an unhandled exception or stack trace.
- Sanitization:
  - Strip or escape control characters (`\x00-\x1F` except allowed newlines, `\x7F-\x9F`) from external feeds (USGS GeoJSON, Open-Meteo, transit feeds) before rendering.
  - Normalize unicode characters to ASCII/Latin-1 compatible equivalents to prevent column alignment distortion.
- Fetch Safety:
  - Enforce timeout `<= 3000ms` via `AbortSignal.timeout(3000)` on all upstream public API calls.
  - Upstream errors, network failures, or rate limits fall back immediately to deterministic in-memory cached broadcast frames with timestamp indication.
  - Never let an external failure break the 40x24 grid or exceed 2,048 bytes.

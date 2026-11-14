// teletext grid formatter and layout engine

import { sanitizeTeletextString } from './sanitizer';
import {
  FastextNav,
  TeletextColor,
  TeletextFrameResponse,
  TeletextSpan,
} from './types';

export const TELETEXT_COLS = 40;
export const TELETEXT_ROWS = 24;
export const MAX_PAYLOAD_BYTES = 2048;

// calculate visible length of a teletext row
// param row list of spans
// return character count
export function getRowLength(row: TeletextSpan[]): number {
  return row.reduce((total, span) => total + span.t.length, 0);
}

// compact a span by omitting default colors and flags
// param span raw span
// return clean minimal span
export function compactSpan(span: TeletextSpan): TeletextSpan {
  const clean: TeletextSpan = { t: span.t };
  if (span.c && span.c !== 'white') clean.c = span.c;
  if (span.b && span.b !== 'black') clean.b = span.b;
  if (span.d) clean.d = true;
  return clean;
}

// optimize and compress a row of spans (merge adjacent and trim redundant spaces)
// param row raw spans
// return compacted spans
export function optimizeRow(row: TeletextSpan[]): TeletextSpan[] {
  if (row.length === 0) return [];

  const compacted: TeletextSpan[] = [];
  for (const s of row) {
    if (!s.t) continue;
    const item = compactSpan(s);
    if (compacted.length > 0) {
      const prev = compacted[compacted.length - 1];
      if (prev.c === item.c && prev.b === item.b && prev.d === item.d) {
        prev.t += item.t;
        continue;
      }
    }
    compacted.push(item);
  }

  // trim trailing empty black background spaces to conserve byte budget
  while (compacted.length > 0) {
    const last = compacted[compacted.length - 1];
    if (!last.b && last.t.trim() === '') {
      compacted.pop();
    } else {
      break;
    }
  }

  return compacted;
}

// clamp a row to ensure visible length never exceeds 40 columns
// param row list of spans
// return row with length <= 40
export function clampRow(row: TeletextSpan[]): TeletextSpan[] {
  const currentLen = getRowLength(row);
  if (currentLen <= TELETEXT_COLS) {
    return optimizeRow(row);
  }

  let overflow = currentLen - TELETEXT_COLS;
  const trimmed: TeletextSpan[] = [];

  for (let i = row.length - 1; i >= 0; i--) {
    const span = row[i];
    if (overflow > 0) {
      if (span.t.length <= overflow) {
        overflow -= span.t.length;
      } else {
        trimmed.unshift({
          ...span,
          t: span.t.slice(0, span.t.length - overflow),
        });
        overflow = 0;
      }
    } else {
      trimmed.unshift(span);
    }
  }

  return optimizeRow(trimmed);
}

// alias for backward compatibility
export const padRow = clampRow;

// build teletext header row 1
// param code 3-digit page code
// param title header title
// param clockTime hh:mm:ss or live ticker
// return formatted row of exactly 40 characters
export function buildHeaderRow(
  code: string,
  title: string,
  clockTime: string,
): TeletextSpan[] {
  const pageTag = `P${code.padEnd(4, ' ')}`; // 5 chars: e.g. "P100 "
  const clock = clockTime.slice(0, 8).padStart(8, ' '); // 8 chars: e.g. "12:34:56"
  const titleBudget = TELETEXT_COLS - pageTag.length - clock.length; // 27 chars
  const cleanTitle = sanitizeTeletextString(title).slice(0, titleBudget).padEnd(titleBudget, ' ');

  return [
    { t: pageTag, c: 'yellow', b: 'blue', d: true },
    { t: cleanTitle, c: 'white', b: 'blue' },
    { t: clock, c: 'yellow', b: 'blue' },
  ];
}

// build teletext fastext navigation row 24
// param fastext 4 navigation links
// return formatted row of exactly 40 characters (4 x 10 cols)
export function buildFastextRow(fastext: FastextNav): TeletextSpan[] {
  const formatSlot = (item: { code: string; label: string }, fg: TeletextColor, bg: TeletextColor): TeletextSpan => {
    const raw = `${item.code} ${item.label}`;
    const text = sanitizeTeletextString(raw).slice(0, 10).padEnd(10, ' ');
    return { t: text, c: fg, b: bg };
  };

  return [
    formatSlot(fastext.red, 'white', 'red'),
    formatSlot(fastext.green, 'black', 'green'),
    formatSlot(fastext.yellow, 'black', 'yellow'),
    formatSlot(fastext.cyan, 'black', 'cyan'),
  ];
}

// wraps text to fit within 40 columns while preserving critical words
// param text input raw text
// param color optional foreground color
// return list of rows
export function wrapTeletextLines(
  text: string,
  color: TeletextColor = 'white',
): TeletextSpan[][] {
  const clean = sanitizeTeletextString(text);
  const words = clean.split(' ');
  const rows: TeletextSpan[][] = [];
  let currentLine = '';

  const protectedWords = ['CRITICAL', 'WARNING', 'ALERT', 'EVACUATE', 'SUSPENDED', 'ON TIME', 'DELAYED'];

  for (const word of words) {
    if (!word) continue;

    // check if adding word exceeds 40 columns
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= TELETEXT_COLS) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        rows.push([{ t: currentLine, c: color }]);
      }
      // handle words longer than 40 chars
      if (word.length > TELETEXT_COLS) {
        const isProtected = protectedWords.some((w) => word.includes(w));
        if (isProtected) {
          // split carefully preserving badge
          rows.push([{ t: word.slice(0, TELETEXT_COLS), c: color }]);
          currentLine = word.slice(TELETEXT_COLS);
        } else {
          rows.push([{ t: word.slice(0, TELETEXT_COLS - 3) + '...', c: color }]);
          currentLine = '';
        }
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    rows.push([{ t: currentLine, c: color }]);
  }

  return rows;
}

// assemble a full 24-row teletext frame
// param options frame configurations
// return complete validated frame response
export function assembleFrame(options: {
  code: string;
  subpage?: number;
  totalSubpages?: number;
  title: string;
  bodyRows: TeletextSpan[][];
  fastext: FastextNav;
  timestamp?: string;
  source?: 'live' | 'cache' | 'fallback';
}): TeletextFrameResponse {
  const code = options.code.slice(0, 3);
  const subpage = options.subpage ?? 1;
  const totalSubpages = options.totalSubpages ?? 1;
  const now = options.timestamp ? new Date(options.timestamp) : new Date();
  const timeStr = now.toTimeString().slice(0, 8);
  const isoTime = now.toISOString();

  // row 1: header
  const headerTitle = `${options.title} [${subpage}/${totalSubpages}]`;
  const headerRow = clampRow(buildHeaderRow(code, headerTitle, timeStr));

  // rows 2-23: body (exactly 22 rows)
  const contentCapacity = TELETEXT_ROWS - 2; // 22 rows
  const paddedBody: TeletextSpan[][] = [];

  for (let i = 0; i < contentCapacity; i++) {
    if (i < options.bodyRows.length) {
      paddedBody.push(clampRow(options.bodyRows[i]));
    } else {
      paddedBody.push([]);
    }
  }

  // row 24: fastext
  const fastextRow = clampRow(buildFastextRow(options.fastext));

  const allRows: TeletextSpan[][] = [headerRow, ...paddedBody, fastextRow];

  const frame: TeletextFrameResponse = {
    code,
    subpage,
    totalSubpages,
    title: options.title,
    timestamp: isoTime,
    rows: allRows,
    fastext: options.fastext,
    source: options.source ?? 'live',
    bytes: 0,
  };

  // calculate utf-8 byte size
  const serialized = JSON.stringify(frame);
  frame.bytes = new TextEncoder().encode(serialized).length;

  return frame;
}

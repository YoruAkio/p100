// property-based test suite for teletext grid and byte-budget invariants

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  assembleFrame,
  getRowLength,
  MAX_PAYLOAD_BYTES,
  TELETEXT_COLS,
  TELETEXT_ROWS,
  wrapTeletextLines,
} from '../src/teletext/formatter';
import { generatePage404 } from '../src/teletext/page404';
import { sanitizeTeletextString } from '../src/teletext/sanitizer';
import { FastextNav, TeletextColor, TeletextSpan } from '../src/teletext/types';
import { checkByteBudget, isValidPageCode } from '../src/teletext/validator';
import { getBulletinPage } from '../src/server/services/bulletin';
import { getDiagnosticsPage } from '../src/server/services/diagnostics';
import { getEarthquakePage } from '../src/server/services/earthquake';
import { getEmergencyPage } from '../src/server/services/emergency';
import { getIndexPage } from '../src/server/services/indexPage';
import { getTransitPage } from '../src/server/services/transit';
import { getWeatherPage } from '../src/server/services/weather';

const DEFAULT_FASTEXT: FastextNav = {
  red: { code: '100', label: 'INDEX' },
  green: { code: '201', label: 'WEATHER' },
  yellow: { code: '301', label: 'TRANSIT' },
  cyan: { code: '401', label: 'EMERGENCY' },
};

const COLOR_ARBITRARY = fc.constantFrom<TeletextColor>(
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
);

const SPAN_ARBITRARY = fc.record({
  t: fc.string({ maxLength: 60 }),
  c: fc.option(COLOR_ARBITRARY, { nil: undefined }),
  b: fc.option(COLOR_ARBITRARY, { nil: undefined }),
  d: fc.option(fc.boolean(), { nil: undefined }),
});

describe('Teletext Core Property-Based Tests (PBT)', () => {
  it('invariant 1 & 2: every assembled frame has exactly 24 rows and width <= 40 columns', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 3 }),
        fc.string({ maxLength: 50 }),
        fc.array(fc.array(SPAN_ARBITRARY, { maxLength: 5 }), { maxLength: 40 }),
        (code, title, bodyRows) => {
          const frame = assembleFrame({
            code,
            title,
            bodyRows,
            fastext: DEFAULT_FASTEXT,
          });

          expect(frame.rows.length).toBe(TELETEXT_ROWS);

          for (const row of frame.rows) {
            const width = getRowLength(row);
            expect(width).toBeLessThanOrEqual(TELETEXT_COLS);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('invariant 3: byte budget stays strictly under 2048 bytes for realistic content frames', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 999 }),
        fc.string({ maxLength: 20 }),
        fc.array(
          fc.record({
            text: fc.string({ maxLength: 38 }),
            color: COLOR_ARBITRARY,
          }),
          { maxLength: 20 },
        ),
        (codeNum, title, lines) => {
          const bodyRows: TeletextSpan[][] = lines.map((l) => [
            { t: sanitizeTeletextString(l.text), c: l.color },
          ]);

          const frame = assembleFrame({
            code: String(codeNum),
            title,
            bodyRows,
            fastext: DEFAULT_FASTEXT,
          });

          const budget = checkByteBudget(frame);
          expect(budget.valid).toBe(true);
          expect(budget.bytes).toBeLessThan(MAX_PAYLOAD_BYTES);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('invariant 4: critical severity badges are never truncated or lost during wrapping', () => {
    const badges = ['CRITICAL', 'WARNING', 'ALERT', 'EVACUATE', 'SUSPENDED', 'ON TIME', 'DELAYED'];

    fc.assert(
      fc.property(
        fc.constantFrom(...badges),
        fc.string({ maxLength: 80 }),
        (badge, extra) => {
          const composite = `${extra} ${badge} ${extra}`;
          const wrapped = wrapTeletextLines(composite);

          // verify the badge exists intact in at least one line
          const fullText = wrapped.map((r) => r.map((s) => s.t).join('')).join(' ');
          expect(fullText).toContain(badge);

          for (const row of wrapped) {
            expect(getRowLength(row)).toBeLessThanOrEqual(TELETEXT_COLS);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it('invariant 5: invalid or adversarial page codes safely resolve to a valid P404 frame', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('000'),
          fc.constant('9999'),
          fc.constant('../../../etc/passwd'),
          fc.constant('<script>alert(1)</script>'),
          fc.constant('NaN'),
          fc.constant(''),
          fc.constant('   '),
          fc.string({ maxLength: 200 }),
        ),
        (invalidCode) => {
          const isValid = isValidPageCode(invalidCode);
          if (!isValid) {
            const frame404 = generatePage404(invalidCode);
            expect(frame404.rows.length).toBe(TELETEXT_ROWS);

            for (const row of frame404.rows) {
              expect(getRowLength(row)).toBeLessThanOrEqual(TELETEXT_COLS);
            }

            const budget = checkByteBudget(frame404);
            expect(budget.valid).toBe(true);
            expect(budget.bytes).toBeLessThan(MAX_PAYLOAD_BYTES);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it('invariant 6: all production channels satisfy strict 40x24 and sub-2KB constraints', async () => {
    const p100 = getIndexPage();
    const p102 = getBulletinPage();
    const [p201_1, p201_2] = await Promise.all([
      getEarthquakePage(),
      getWeatherPage(),
    ]);
    const p301 = getTransitPage();
    const p401 = getEmergencyPage();
    const p999 = getDiagnosticsPage();
    const p404 = generatePage404('777');

    const allPages = [
      { name: 'P100', page: p100 },
      { name: 'P102', page: p102 },
      { name: 'P201_1', page: p201_1 },
      { name: 'P201_2', page: p201_2 },
      { name: 'P301', page: p301 },
      { name: 'P401', page: p401 },
      { name: 'P999', page: p999 },
      { name: 'P404', page: p404 },
    ];

    for (const { name, page } of allPages) {
      // 24 rows exactly
      expect(page.rows.length, `${name} must have 24 rows`).toBe(TELETEXT_ROWS);

      // max 40 columns per row
      for (let r = 0; r < page.rows.length; r++) {
        const row = page.rows[r];
        const len = getRowLength(row);
        expect(len, `${name} row ${r} length ${len} must be <= 40`).toBeLessThanOrEqual(
          TELETEXT_COLS,
        );
      }

      // sub-2kb payload ceiling
      const budget = checkByteBudget(page);
      expect(
        budget.valid,
        `${name} byte size ${budget.bytes} must be < 2048`,
      ).toBe(true);
    }
  }, 15000);
});

// sanitize text against control characters and non-ascii glyphs

// maps common unicode symbols to ascii teletext equivalents
const UNICODE_MAP: Record<string, string> = {
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2013': '-',
  '\u2014': '--',
  '\u2026': '...',
  '\u00A0': ' ',
  '\u2022': '*',
  '\u00B0': 'o',
  '\u00B1': '+-',
  '\u00D7': 'x',
  '\u00F7': '/',
  '\u2190': '<',
  '\u2192': '>',
  '\u2191': '^',
  '\u2193': 'v',
};

// strips control chars and normalizes to 7-bit ascii safe representation
// param raw input string
// return clean uppercase/safe string
export function sanitizeTeletextString(raw: string): string {
  if (!raw) return '';

  let mapped = '';
  for (const char of raw) {
    if (UNICODE_MAP[char]) {
      mapped += UNICODE_MAP[char];
    } else {
      mapped += char;
    }
  }

  // strip non-printable control characters below space (0x20) and between 0x7F-0x9F
  const stripped = mapped.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');

  // replace remaining non-ascii characters with safe question mark or space
  const ascii = stripped.replace(/[^\x20-\x7E]/g, '?');

  return ascii;
}

// limits string to a fixed max length
// param text string to truncate
// param max max characters
// return bounded string
export function clampText(text: string, max: number): string {
  if (text.length <= max) return text;
  if (max <= 3) return text.slice(0, max);
  return text.slice(0, max - 3) + '...';
}

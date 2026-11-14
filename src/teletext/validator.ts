// validation and byte-budget enforcement

import { MAX_PAYLOAD_BYTES } from './formatter';
import { TeletextFrameResponse } from './types';

// validate teletext 3-digit page code format
// param code candidate string
// return true if valid page number between 100 and 999
export function isValidPageCode(code: string): boolean {
  if (typeof code !== 'string') return false;
  return /^[1-9][0-9]{2}$/.test(code.trim());
}

// enforce sub-2kb payload ceiling
// param frame teletext frame response
// return payload byte size in utf-8
export function checkByteBudget(frame: TeletextFrameResponse): {
  valid: boolean;
  bytes: number;
} {
  const json = JSON.stringify(frame);
  const bytes = new TextEncoder().encode(json).length;
  return {
    valid: bytes < MAX_PAYLOAD_BYTES,
    bytes,
  };
}

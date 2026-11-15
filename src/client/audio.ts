// synthesized 1980s retro audio effects using browser-native web audio api
// zero external audio assets or network payloads

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// tactile mechanical keypad click
export function playKeyClick(enabled: boolean): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  } catch {
    // audio not allowed before user gesture
  }
}

// teletext page roll frequency hunt chirp
export function playRollChirp(enabled: boolean): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch {}
}

// crt degauss and power coil hum
export function playDegauss(enabled: boolean): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {}
}

// ax.25 packet radio / lora burst chirp
export function playPacketChirp(enabled: boolean): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.setValueAtTime(2200, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {}
}

export interface AfskTransmission {
  stop: () => void;
  durationMs: number;
}

// real bell 202 afsk 1200 baud modem tone generator
// mark = 1200hz, space = 2200hz, continuous-phase fsk
export function transmitBell202Afsk(
  text: string,
  enabled: boolean,
): AfskTransmission | null {
  if (!enabled) return null;
  try {
    const ctx = getAudioContext();
    if (!ctx) return null;

    // build bitstream: 120ms mark preamble + byte framing + 50ms mark postamble
    // framing per byte: 1 start bit (0/space), 8 data bits (lsb first), 1 stop bit (1/mark)
    const bits: number[] = [];

    // preamble: 144 bits of mark (1) at 1200 baud (~120ms)
    for (let i = 0; i < 144; i++) {
      bits.push(1);
    }

    // encode characters
    const maxChars = Math.min(text.length, 256);
    for (let i = 0; i < maxChars; i++) {
      const code = text.charCodeAt(i) & 0xff;
      // start bit (0)
      bits.push(0);
      // 8 data bits (lsb first)
      for (let b = 0; b < 8; b++) {
        bits.push((code >> b) & 1);
      }
      // stop bit (1)
      bits.push(1);
    }

    // postamble: 60 bits of mark (1) at 1200 baud (~50ms)
    for (let i = 0; i < 60; i++) {
      bits.push(1);
    }

    const baud = 1200;
    const sampleRate = ctx.sampleRate;
    const bitDuration = 1 / baud;
    const totalSamples = Math.ceil(bits.length * bitDuration * sampleRate);
    const audioBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const data = audioBuffer.getChannelData(0);

    let phase = 0;
    const twoPi = 2 * Math.PI;

    for (let b = 0; b < bits.length; b++) {
      const freq = bits[b] === 1 ? 1200 : 2200;
      const startSample = Math.round(b * bitDuration * sampleRate);
      const endSample = Math.round((b + 1) * bitDuration * sampleRate);
      const phaseInc = (twoPi * freq) / sampleRate;

      for (let s = startSample; s < endSample && s < totalSamples; s++) {
        // smooth tapering at buffer edges to prevent audible pops
        data[s] = Math.sin(phase) * 0.22;
        phase += phaseInc;
        if (phase > twoPi) phase -= twoPi;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();

    const durationMs = Math.round((totalSamples / sampleRate) * 1000);

    return {
      stop: () => {
        try {
          source.stop();
        } catch {}
      },
      durationMs,
    };
  } catch {
    return null;
  }
}

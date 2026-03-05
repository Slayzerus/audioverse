/**
 * Jam Session engine — allows pad/keyboard to be used as a musical instrument
 * with preset sounds from public/audioClips and synth fallback.
 * Supports online (SignalR) and offline (local) multiplayer.
 */

export interface JamPreset {
  id: string;
  name: string;
  /** Map of pad/key index → audio file path or synth note */
  mapping: Record<number, JamSound>;
  category: 'drums' | 'synth' | 'sampler' | 'custom';
}

export interface JamSound {
  type: 'sample' | 'synth';
  /** Path to audio file (for 'sample') */
  src?: string;
  /** MIDI note number (for 'synth') */
  note?: number;
  /** Instrument/oscillator type (for 'synth') */
  instrument?: OscillatorType;
  /** Display label */
  label: string;
  /** Velocity sensitivity (0-1) */
  velocitySensitivity: number;
}

export interface JamSessionState {
  players: JamPlayer[];
  bpm: number;
  isPlaying: boolean;
  currentPreset: string;
  mode: 'freeplay' | 'metronome' | 'backing-track';
}

export interface JamPlayer {
  id: string;
  name: string;
  color: string;
  preset: string;
  isLocal: boolean;
  volume: number;
  muted: boolean;
}

export interface JamNoteEvent {
  playerId: string;
  padIndex: number;
  velocity: number;
  timestamp: number;
  duration?: number;
}

// Default drum kit preset using public/audioClips
export const DRUM_KIT_PRESET: JamPreset = {
  id: 'default-drums',
  name: 'Drum Kit',
  category: 'drums',
  mapping: {
    0: { type: 'sample', src: '/audioClips/kick.wav', label: 'Kick', velocitySensitivity: 0.8 },
    1: { type: 'sample', src: '/audioClips/snare.wav', label: 'Snare', velocitySensitivity: 0.9 },
    2: { type: 'sample', src: '/audioClips/hihat.wav', label: 'Hi-Hat', velocitySensitivity: 1.0 },
    3: { type: 'sample', src: '/audioClips/clap.wav', label: 'Clap', velocitySensitivity: 0.7 },
    4: { type: 'sample', src: '/audioClips/A Real Freakin Drum Kit/real-kick-F001.wav', label: 'Deep Kick', velocitySensitivity: 0.8 },
    5: { type: 'sample', src: '/audioClips/A Real Freakin Drum Kit/real-soft-snare.wav', label: 'Soft Snare', velocitySensitivity: 0.9 },
    6: { type: 'sample', src: '/audioClips/A Real Freakin Drum Kit/real-snare-roll.wav', label: 'Snare Roll', velocitySensitivity: 0.85 },
    7: { type: 'sample', src: '/audioClips/A Real Freakin Drum Kit/real-long-ride.wav', label: 'Ride', velocitySensitivity: 1.0 },
  },
};

// Synth preset
export const SYNTH_PRESET: JamPreset = {
  id: 'default-synth',
  name: 'Basic Synth',
  category: 'synth',
  mapping: Object.fromEntries(
    Array.from({ length: 16 }, (_, i) => [
      i,
      {
        type: 'synth' as const,
        note: 48 + i, // C3 to D#4
        instrument: 'sine' as OscillatorType,
        label: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'][i] + (i < 12 ? '3' : '4'),
        velocitySensitivity: 1.0,
      },
    ])
  ),
};

export const DEFAULT_PRESETS: JamPreset[] = [DRUM_KIT_PRESET, SYNTH_PRESET];

/** Load an audio sample and return the decoded AudioBuffer */
export async function loadSample(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

/** Preload all samples in a preset */
export async function preloadPreset(
  ctx: AudioContext,
  preset: JamPreset
): Promise<Map<number, AudioBuffer>> {
  const buffers = new Map<number, AudioBuffer>();
  const entries = Object.entries(preset.mapping).filter(([, s]) => s.type === 'sample' && s.src);
  await Promise.all(
    entries.map(async ([key, sound]) => {
      try {
        const buf = await loadSample(ctx, sound.src!);
        buffers.set(Number(key), buf);
      } catch {
        // Skip failed samples silently
      }
    })
  );
  return buffers;
}

/** Play a single note/sample from the jam preset */
export function playJamNote(
  ctx: AudioContext,
  destination: AudioNode,
  preset: JamPreset,
  padIndex: number,
  velocity: number,
  buffers: Map<number, AudioBuffer>
): void {
  const sound = preset.mapping[padIndex];
  if (!sound) return;

  const gain = ctx.createGain();
  const normalizedVelocity = (velocity / 127) * sound.velocitySensitivity;
  gain.gain.value = normalizedVelocity;
  gain.connect(destination);

  if (sound.type === 'sample') {
    const buffer = buffers.get(padIndex);
    if (!buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start();
  } else if (sound.type === 'synth' && sound.note != null) {
    const osc = ctx.createOscillator();
    osc.type = sound.instrument || 'sine';
    osc.frequency.value = 440 * Math.pow(2, (sound.note - 69) / 12);
    const env = ctx.createGain();
    env.gain.setValueAtTime(normalizedVelocity, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(env).connect(destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }
}

/** Create initial jam session state */
export function createJamSession(playerName: string, presetId: string = 'default-drums'): JamSessionState {
    return {
    players: [{
      id: 'local-1',
      name: playerName,
      color: 'var(--success, #4caf50)',
      preset: presetId,
      isLocal: true,
      volume: 1,
      muted: false,
    }],
    bpm: 120,
    isPlaying: false,
    currentPreset: presetId,
    mode: 'freeplay',
  };
}

/** Serialize a jam note event for network transmission */
export function serializeJamEvent(event: JamNoteEvent): string {
  return JSON.stringify(event);
}

/** Deserialize a jam note event from network */
export function deserializeJamEvent(data: string): JamNoteEvent {
  return JSON.parse(data) as JamNoteEvent;
}

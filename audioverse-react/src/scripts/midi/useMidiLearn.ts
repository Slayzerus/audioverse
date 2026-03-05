// ─── MIDI Learn System ─────────────────────────────────────────────────────────
// Generic MIDI Learn: bind any CC/Note/PitchBend to UI parameters.
// Works with any MIDI device, not just Oxygen 25.

import { useCallback, useEffect, useRef, useState } from 'react';
import { MidiCoreEvent, useWebMidi } from './useWebMidi';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type MidiBindingType = 'cc' | 'note' | 'pitchbend' | 'aftertouch' | 'channel-aftertouch';

export interface MidiBinding {
  id: string;
  /** Human-readable parameter name */
  paramName: string;
  /** What type of MIDI message triggers this */
  type: MidiBindingType;
  /** CC number (for 'cc' type) or note number (for 'note' type) */
  number?: number;
  /** MIDI channel filter (undefined = any) */
  channel?: number;
  /** Min output value */
  min: number;
  /** Max output value */
  max: number;
  /** Current value (0-1 normalized) */
  value: number;
}

export interface MidiLearnState {
  /** Whether we're in learn mode */
  learning: boolean;
  /** Which binding ID is being learned */
  targetId: string | null;
}

export type MidiLearnStorage = Record<string, Omit<MidiBinding, 'value' | 'paramName'>>;

const STORAGE_KEY = 'audioverse.midiLearn';

// ─── Persistence ────────────────────────────────────────────────────────────────

function loadBindings(): MidiLearnStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    /* Expected: localStorage or JSON.parse may fail */
    return {};
  }
}

function saveBindings(bindings: MidiBinding[]): void {
  const storage: MidiLearnStorage = {};
  for (const b of bindings) {
    storage[b.id] = {
      id: b.id,
      type: b.type,
      number: b.number,
      channel: b.channel,
      min: b.min,
      max: b.max,
    };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export interface UseMidiLearnOptions {
  /** Parameters available for binding */
  parameters: { id: string; name: string; min?: number; max?: number }[];
  /** Called when a bound parameter value changes */
  onParameterChange?: (id: string, value: number, normalizedValue: number) => void;
}

export interface UseMidiLearnResult {
  /** All current bindings */
  bindings: MidiBinding[];
  /** Start learning for a specific parameter */
  startLearn: (paramId: string) => void;
  /** Cancel learning */
  cancelLearn: () => void;
  /** Remove a binding */
  removeBinding: (paramId: string) => void;
  /** Clear all bindings */
  clearAll: () => void;
  /** Current learn state */
  learnState: MidiLearnState;
  /** MIDI connection status */
  midiSupported: boolean | null;
  midiGranted: boolean;
  /** Last received MIDI event (for display) */
  lastEvent: MidiCoreEvent | null;
}

export function useMidiLearn(options: UseMidiLearnOptions): UseMidiLearnResult {
  const { parameters, onParameterChange } = options;

  const [bindings, setBindings] = useState<MidiBinding[]>(() => {
    const saved = loadBindings();
    return parameters.map((p) => {
      const s = saved[p.id];
      return {
        id: p.id,
        paramName: p.name,
        type: s?.type ?? 'cc',
        number: s?.number,
        channel: s?.channel,
        min: s?.min ?? p.min ?? 0,
        max: s?.max ?? p.max ?? 127,
        value: 0,
      };
    });
  });

  const [learnState, setLearnState] = useState<MidiLearnState>({
    learning: false,
    targetId: null,
  });

  const [lastEvent, setLastEvent] = useState<MidiCoreEvent | null>(null);
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  const onParameterChangeRef = useRef(onParameterChange);
  onParameterChangeRef.current = onParameterChange;

  const learnStateRef = useRef(learnState);
  learnStateRef.current = learnState;

  const onMidiEvent = useCallback((ev: MidiCoreEvent) => {
    setLastEvent(ev);

    const learn = learnStateRef.current;

    // Learning mode — bind the incoming message to the target parameter
    if (learn.learning && learn.targetId) {
      const binding = bindingsRef.current.find((b) => b.id === learn.targetId);
      if (!binding) return;

      let update: Partial<MidiBinding> = {};

      switch (ev.type) {
        case 'cc':
          update = { type: 'cc', number: ev.controller, channel: ev.channel };
          break;
        case 'noteon':
          update = { type: 'note', number: ev.note, channel: ev.channel };
          break;
        case 'pitchbend':
          update = { type: 'pitchbend', channel: ev.channel };
          break;
        case 'aftertouch':
          update = { type: 'aftertouch', channel: ev.channel };
          break;
        default:
          return; // Ignore other message types during learn
      }

      setBindings((prev) => {
        const next = prev.map((b) =>
          b.id === learn.targetId ? { ...b, ...update } : b,
        );
        saveBindings(next);
        return next;
      });

      setLearnState({ learning: false, targetId: null });
      return;
    }

    // Normal mode — check if this event matches any binding
    for (const binding of bindingsRef.current) {
      if (binding.number === undefined && binding.type !== 'pitchbend' && binding.type !== 'aftertouch') continue;
      if (binding.channel !== undefined && ev.channel !== binding.channel) continue;

      let rawValue: number | null = null;
      let maxRaw = 127;

      if (binding.type === 'cc' && ev.type === 'cc' && ev.controller === binding.number) {
        rawValue = ev.value;
      } else if (binding.type === 'note' && ev.type === 'noteon' && ev.note === binding.number) {
        rawValue = ev.velocity;
      } else if (binding.type === 'pitchbend' && ev.type === 'pitchbend') {
        rawValue = ev.value + 8192; // -8192..8191 → 0..16383
        maxRaw = 16383;
      } else if (binding.type === 'aftertouch' && ev.type === 'aftertouch') {
        rawValue = ev.pressure;
      }

      if (rawValue !== null) {
        const normalized = rawValue / maxRaw;
        const mapped = binding.min + normalized * (binding.max - binding.min);

        setBindings((prev) =>
          prev.map((b) => (b.id === binding.id ? { ...b, value: normalized } : b)),
        );

        onParameterChangeRef.current?.(binding.id, mapped, normalized);
      }
    }
  }, []);

  const { supported, granted } = useWebMidi({
    onEvent: onMidiEvent,
  });

  const startLearn = useCallback((paramId: string) => {
    setLearnState({ learning: true, targetId: paramId });
  }, []);

  const cancelLearn = useCallback(() => {
    setLearnState({ learning: false, targetId: null });
  }, []);

  const removeBinding = useCallback((paramId: string) => {
    setBindings((prev) => {
      const next = prev.map((b) =>
        b.id === paramId ? { ...b, type: 'cc' as const, number: undefined, channel: undefined } : b,
      );
      saveBindings(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setBindings((prev) => {
      const next = prev.map((b) => ({ ...b, type: 'cc' as const, number: undefined, channel: undefined, value: 0 }));
      localStorage.removeItem(STORAGE_KEY);
      return next;
    });
  }, []);

  return {
    bindings,
    startLearn,
    cancelLearn,
    removeBinding,
    clearAll,
    learnState,
    midiSupported: supported,
    midiGranted: granted,
    lastEvent,
  };
}

// ─── MPE (MIDI Polyphonic Expression) ───────────────────────────────────────────

export interface MPENote {
  note: number;
  channel: number;
  velocity: number;
  /** Per-note pitch bend (-8192 to 8191, 14-bit) */
  pitchBend: number;
  /** Per-note pressure / aftertouch (0-127) */
  pressure: number;
  /** Per-note slide / CC74 (0-127) */
  slide: number;
  /** Timestamp of last update */
  lastUpdate: number;
}

export interface MPEZone {
  /** Master channel (usually 0 or 15) */
  masterChannel: number;
  /** Member channels */
  memberChannels: number[];
  /** Pitch bend range in semitones (default 48 for MPE) */
  pitchBendRange: number;
}

export interface UseMPEOptions {
  /** Lower zone config (default: master=0, members=1-14) */
  lowerZone?: MPEZone;
  /** Callback when a note's expression changes */
  onNoteExpression?: (note: MPENote) => void;
  /** Callback when a note starts */
  onNoteOn?: (note: MPENote) => void;
  /** Callback when a note ends */
  onNoteOff?: (channel: number, note: number) => void;
}

const DEFAULT_LOWER_ZONE: MPEZone = {
  masterChannel: 0,
  memberChannels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  pitchBendRange: 48,
};

export function useMPE(options: UseMPEOptions = {}): {
  activeNotes: MPENote[];
  midiSupported: boolean | null;
  midiGranted: boolean;
} {
  const { lowerZone = DEFAULT_LOWER_ZONE, onNoteExpression, onNoteOn, onNoteOff } = options;

  const [activeNotes, setActiveNotes] = useState<MPENote[]>([]);
  const notesRef = useRef<Map<string, MPENote>>(new Map());

  const onNoteExpressionRef = useRef(onNoteExpression);
  onNoteExpressionRef.current = onNoteExpression;
  const onNoteOnRef = useRef(onNoteOn);
  onNoteOnRef.current = onNoteOn;
  const onNoteOffRef = useRef(onNoteOff);
  onNoteOffRef.current = onNoteOff;

  const memberSet = useRef(new Set(lowerZone.memberChannels));

  useEffect(() => {
    memberSet.current = new Set(lowerZone.memberChannels);
  }, [lowerZone.memberChannels]);

  const onEvent = useCallback((ev: MidiCoreEvent) => {
    if (!memberSet.current.has(ev.channel ?? -1)) return;

    const key = `${ev.channel}`;

    switch (ev.type) {
      case 'noteon': {
        const note: MPENote = {
          note: ev.note,
          channel: ev.channel,
          velocity: ev.velocity,
          pitchBend: 0,
          pressure: 0,
          slide: 0,
          lastUpdate: ev.ts,
        };
        notesRef.current.set(key, note);
        setActiveNotes(Array.from(notesRef.current.values()));
        onNoteOnRef.current?.(note);
        break;
      }
      case 'noteoff': {
        notesRef.current.delete(key);
        setActiveNotes(Array.from(notesRef.current.values()));
        onNoteOffRef.current?.(ev.channel, ev.note);
        break;
      }
      case 'pitchbend': {
        const existing = notesRef.current.get(key);
        if (existing) {
          existing.pitchBend = ev.value;
          existing.lastUpdate = ev.ts;
          onNoteExpressionRef.current?.(existing);
          setActiveNotes(Array.from(notesRef.current.values()));
        }
        break;
      }
      case 'aftertouch': {
        const existing = notesRef.current.get(key);
        if (existing) {
          existing.pressure = ev.pressure;
          existing.lastUpdate = ev.ts;
          onNoteExpressionRef.current?.(existing);
          setActiveNotes(Array.from(notesRef.current.values()));
        }
        break;
      }
      case 'cc': {
        // CC74 = slide in MPE
        if (ev.controller === 74) {
          const existing = notesRef.current.get(key);
          if (existing) {
            existing.slide = ev.value;
            existing.lastUpdate = ev.ts;
            onNoteExpressionRef.current?.(existing);
            setActiveNotes(Array.from(notesRef.current.values()));
          }
        }
        break;
      }
    }
  }, []);

  const { supported, granted } = useWebMidi({
    onEvent,
    sysex: false,
  });

  return { activeNotes, midiSupported: supported, midiGranted: granted };
}

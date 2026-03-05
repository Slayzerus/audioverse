// ─── useStepSequencer ──────────────────────────────────────────────────────────
// React hook for step sequencer state management with playback scheduling.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SequencerPattern,
  Step,
  createEmptyPattern,
  toggleStep,
  setStepNote,
  setStepVelocity,
  setStepGate,
  setStepProbability,
  toggleStepSlide,
  transposePattern,
  reversePattern,
  shiftPattern,
  randomizeVelocity,
  clearPattern,
  stepDuration,
  stepTimeOffset,
  shouldTrigger,
} from '../utils/stepSequencer';
import { LFOConfig, createDefaultLFO, evaluateLFOAsCC } from '../utils/lfoEngine';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface StepSequencerState {
  pattern: SequencerPattern;
  /** Current playback step (-1 if stopped) */
  currentStep: number;
  /** Whether playback is running */
  playing: boolean;
  /** Attached LFOs */
  lfos: LFOConfig[];
}

export interface UseStepSequencerOptions {
  /** Called when a step triggers (for sound playback) */
  onTrigger?: (step: Step, index: number, time: number) => void;
  /** Called when LFO generates a CC value */
  onLFOOutput?: (lfoIndex: number, cc: number, value: number) => void;
  /** Initial pattern */
  initialPattern?: SequencerPattern;
}

export interface UseStepSequencerResult {
  // State
  pattern: SequencerPattern;
  currentStep: number;
  playing: boolean;
  lfos: LFOConfig[];

  // Transport
  play: () => void;
  stop: () => void;
  togglePlayback: () => void;

  // Pattern editing
  toggle: (index: number) => void;
  setNote: (index: number, note: number) => void;
  setVelocity: (index: number, velocity: number) => void;
  setGate: (index: number, gate: number) => void;
  setProbability: (index: number, prob: number) => void;
  toggleSlide: (index: number) => void;

  // Pattern operations
  transpose: (semitones: number) => void;
  reverse: () => void;
  shift: (amount: number) => void;
  randomizeVel: (min?: number, max?: number) => void;
  clear: () => void;
  setPattern: (pattern: SequencerPattern) => void;
  setBpm: (bpm: number) => void;
  setSwing: (swing: number) => void;
  setLength: (length: 16 | 32 | 64) => void;

  // LFO management
  addLFO: (config?: LFOConfig) => void;
  removeLFO: (index: number) => void;
  updateLFO: (index: number, updates: Partial<LFOConfig>) => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useStepSequencer(options: UseStepSequencerOptions = {}): UseStepSequencerResult {
  const { onTrigger, onLFOOutput, initialPattern } = options;
  const [pattern, setPatternState] = useState<SequencerPattern>(
    () => initialPattern ?? createEmptyPattern(),
  );
  const [currentStep, setCurrentStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [lfos, setLfos] = useState<LFOConfig[]>([]);

  const patternRef = useRef(pattern);
  patternRef.current = pattern;
  const lfosRef = useRef(lfos);
  lfosRef.current = lfos;
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;
  const onLFOOutputRef = useRef(onLFOOutput);
  onLFOOutputRef.current = onLFOOutput;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepCounterRef = useRef(0);
  const startTimeRef = useRef(0);

  // ─── Playback loop ─────────────────────────────────────────────────────────

  const scheduleNextStep = useCallback(() => {
    if (!playingRef.current) return;

    const pat = patternRef.current;
    const idx = stepCounterRef.current % pat.length;
    const step = pat.steps[idx];

    // Trigger the step
    if (shouldTrigger(step)) {
      const time = stepTimeOffset(stepCounterRef.current, pat.bpm, pat.swing);
      onTriggerRef.current?.(step, idx, time);
    }

    // Process LFOs
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    for (let i = 0; i < lfosRef.current.length; i++) {
      const lfo = lfosRef.current[i];
      if (lfo.enabled && lfo.targetCC !== undefined) {
        const ccValue = evaluateLFOAsCC(lfo, elapsed, pat.bpm);
        onLFOOutputRef.current?.(i, lfo.targetCC, ccValue);
      }
    }

    setCurrentStep(idx);
    stepCounterRef.current++;

    // Schedule next
    const dur = stepDuration(pat.bpm) * 1000;
    // Apply swing timing offset for odd steps
    const swingDelay = idx % 2 === 0 ? 0 : dur * pat.swing * 0.5;
    timerRef.current = setTimeout(scheduleNextStep, dur + swingDelay);
  }, []);

  // ─── Transport ──────────────────────────────────────────────────────────────

  const play = useCallback(() => {
    if (playingRef.current) return;
    stepCounterRef.current = 0;
    startTimeRef.current = Date.now();
    setPlaying(true);
    playingRef.current = true;
    scheduleNextStep();
  }, [scheduleNextStep]);

  const stop = useCallback(() => {
    setPlaying(false);
    playingRef.current = false;
    setCurrentStep(-1);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (playingRef.current) stop();
    else play();
  }, [play, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ─── Pattern editing ────────────────────────────────────────────────────────

  const toggle = useCallback((i: number) => setPatternState((p) => toggleStep(p, i)), []);
  const setNote = useCallback((i: number, n: number) => setPatternState((p) => setStepNote(p, i, n)), []);
  const setVelocity = useCallback((i: number, v: number) => setPatternState((p) => setStepVelocity(p, i, v)), []);
  const setGate = useCallback((i: number, g: number) => setPatternState((p) => setStepGate(p, i, g)), []);
  const setProbability = useCallback((i: number, pr: number) => setPatternState((p) => setStepProbability(p, i, pr)), []);
  const toggleSlideStep = useCallback((i: number) => setPatternState((p) => toggleStepSlide(p, i)), []);

  // ─── Pattern operations ─────────────────────────────────────────────────────

  const transposeOp = useCallback((s: number) => setPatternState((p) => transposePattern(p, s)), []);
  const reverseOp = useCallback(() => setPatternState((p) => reversePattern(p)), []);
  const shiftOp = useCallback((a: number) => setPatternState((p) => shiftPattern(p, a)), []);
  const randomizeVelOp = useCallback(
    (min?: number, max?: number) => setPatternState((p) => randomizeVelocity(p, min, max)),
    [],
  );
  const clearOp = useCallback(() => setPatternState((p) => clearPattern(p)), []);
  const setBpm = useCallback((bpm: number) => setPatternState((p) => ({ ...p, bpm: Math.max(20, Math.min(300, bpm)) })), []);
  const setSwing = useCallback((sw: number) => setPatternState((p) => ({ ...p, swing: Math.max(0, Math.min(1, sw)) })), []);
  const setLength = useCallback((len: 16 | 32 | 64) => {
    setPatternState((p) => {
      if (p.length === len) return p;
      const steps = Array.from({ length: len }, (_, i) =>
        i < p.steps.length ? p.steps[i] : { active: false, note: p.rootNote, velocity: 100, gate: 0.8, probability: 1, slide: false },
      );
      return { ...p, length: len, steps };
    });
  }, []);

  // ─── LFO management ────────────────────────────────────────────────────────

  const addLFO = useCallback((config?: LFOConfig) => {
    setLfos((prev) => [...prev, config ?? createDefaultLFO()]);
  }, []);

  const removeLFO = useCallback((index: number) => {
    setLfos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateLFO = useCallback((index: number, updates: Partial<LFOConfig>) => {
    setLfos((prev) => prev.map((l, i) => (i === index ? { ...l, ...updates } : l)));
  }, []);

  return {
    pattern,
    currentStep,
    playing,
    lfos,
    play,
    stop,
    togglePlayback,
    toggle,
    setNote,
    setVelocity,
    setGate,
    setProbability,
    toggleSlide: toggleSlideStep,
    transpose: transposeOp,
    reverse: reverseOp,
    shift: shiftOp,
    randomizeVel: randomizeVelOp,
    clear: clearOp,
    setPattern: setPatternState,
    setBpm,
    setSwing,
    setLength,
    addLFO,
    removeLFO,
    updateLFO,
  };
}

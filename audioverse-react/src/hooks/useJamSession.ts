import { useState, useEffect, useRef, useCallback } from 'react';
import {
  JamSessionState, JamPreset, JamNoteEvent, JamPlayer,
  DEFAULT_PRESETS, preloadPreset, playJamNote, createJamSession,
} from '../utils/jamSession';

export interface UseJamSessionOptions {
  playerName?: string;
  presetId?: string;
}

export interface UseJamSessionReturn {
  session: JamSessionState;
  presets: JamPreset[];
  isReady: boolean;
  triggerNote: (padIndex: number, velocity?: number) => void;
  setPreset: (presetId: string) => void;
  setBpm: (bpm: number) => void;
  setMode: (mode: JamSessionState['mode']) => void;
  addPlayer: (player: JamPlayer) => void;
  removePlayer: (playerId: string) => void;
  toggleMute: (playerId: string) => void;
  setPlayerVolume: (playerId: string, volume: number) => void;
  recentEvents: JamNoteEvent[];
}

export function useJamSession(options: UseJamSessionOptions = {}): UseJamSessionReturn {
  const { playerName = 'Player 1', presetId = 'default-drums' } = options;
  const [session, setSession] = useState<JamSessionState>(() => createJamSession(playerName, presetId));
  const [isReady, setIsReady] = useState(false);
  const [recentEvents, setRecentEvents] = useState<JamNoteEvent[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Map<number, AudioBuffer>>(new Map());
  const masterGainRef = useRef<GainNode | null>(null);

  // Initialize AudioContext and preload the preset
  useEffect(() => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    masterGainRef.current = master;

    const preset = DEFAULT_PRESETS.find(p => p.id === session.currentPreset) || DEFAULT_PRESETS[0];
    preloadPreset(ctx, preset).then(buffers => {
      buffersRef.current = buffers;
      setIsReady(true);
    });

    return () => {
      ctx.close();
    };
    // Mount-only: AudioContext and preset sample buffers are initialized once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerNote = useCallback((padIndex: number, velocity = 100) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    // Resume if suspended (user gesture needed)
    if (ctx.state === 'suspended') void ctx.resume();

    const preset = DEFAULT_PRESETS.find(p => p.id === session.currentPreset) || DEFAULT_PRESETS[0];
    playJamNote(ctx, master, preset, padIndex, velocity, buffersRef.current);

    const event: JamNoteEvent = {
      playerId: session.players[0]?.id || 'local-1',
      padIndex,
      velocity,
      timestamp: Date.now(),
    };
    setRecentEvents(prev => [...prev.slice(-99), event]);
  }, [session.currentPreset, session.players]);

  const setPreset = useCallback(async (newPresetId: string) => {
    const preset = DEFAULT_PRESETS.find(p => p.id === newPresetId);
    if (!preset || !audioCtxRef.current) return;
    setIsReady(false);
    const buffers = await preloadPreset(audioCtxRef.current, preset);
    buffersRef.current = buffers;
    setSession(prev => ({ ...prev, currentPreset: newPresetId }));
    setIsReady(true);
  }, []);

  const setBpm = useCallback((bpm: number) => {
    setSession(prev => ({ ...prev, bpm: Math.max(20, Math.min(300, bpm)) }));
  }, []);

  const setMode = useCallback((mode: JamSessionState['mode']) => {
    setSession(prev => ({ ...prev, mode }));
  }, []);

  const addPlayer = useCallback((player: JamPlayer) => {
    setSession(prev => ({ ...prev, players: [...prev.players, player] }));
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setSession(prev => ({ ...prev, players: prev.players.filter(p => p.id !== playerId) }));
  }, []);

  const toggleMute = useCallback((playerId: string) => {
    setSession(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === playerId ? { ...p, muted: !p.muted } : p),
    }));
  }, []);

  const setPlayerVolume = useCallback((playerId: string, volume: number) => {
    setSession(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === playerId ? { ...p, volume: Math.max(0, Math.min(1, volume)) } : p),
    }));
  }, []);

  return {
    session, presets: DEFAULT_PRESETS, isReady,
    triggerNote, setPreset, setBpm, setMode,
    addPlayer, removePlayer, toggleMute, setPlayerVolume,
    recentEvents,
  };
}

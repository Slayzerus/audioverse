import React, { useState, useContext, createContext, useEffect, useRef } from "react";
import { useAudioContext } from "./AudioContext";
import { useUser } from "./UserContext";
import { Player, GameState } from "../models/game/modelsGame";
import { getUserMicrophones, PitchDetectionMethod, MicrophoneDto, CurrentUserResponse } from "../scripts/api/apiUser";
import { PlayerService } from "../services/PlayerService";
import { loadUserSettings, syncSettingToBackend } from "../scripts/settingsSync";
import { logger } from '../utils/logger';

const log = logger.scoped('GameContext');

const defaultPlayer: Player = {
  id: 1,
  name: "Gracz 1",
  micId: undefined,
  volume: 1,
};

export type GameMode = 
  | "normal" 
  | "demo" 
  | "no-timeline" 
  | "no-lyrics" 
  | "no-music" 
  | "instrumental" 
  | "blind" 
  | "blind-no-timeline" 
  | "blind-instrumental"
  | "editor"
  | "pad";

export type Difficulty = "easy" | "normal" | "hard";
export type PitchAlgorithm = "autocorr" | "pitchy" | "crepe" | "librosa";

/** Shape of a player object returned by the backend (superset of local Player). */
interface BackendPlayer {
  id: number;
  name?: string;
  isPrimary?: boolean;
  color?: string;
  preferredColors?: string | string[];
}

interface GameContextType {
  state: GameState;
  playersLoading: boolean;
  addPlayer: () => void;
  removePlayer: (id: number) => void;
  importPlayers: (players: { id?: number; name?: string; color?: string }[], append?: boolean, source?: 'local' | 'backend') => void;
  updatePlayer: (id: number, patch: Partial<Player>) => void;
  assignMic: (playerId: number, micId: string) => void;
  setVolume: (playerId: number, volume: number) => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  defaultPitchAlgorithm: PitchAlgorithm;
  setDefaultPitchAlgorithm: (a: PitchAlgorithm) => void;
  micAlgorithms: { [playerId: number]: PitchAlgorithm };
  setMicAlgorithm: (playerId: number, alg: PitchAlgorithm) => void;
  micRmsThresholds: { [deviceId: string]: number };
  /** Per-device latency offset in ms (deviceId → offsetMs). Positive = mic records late. */
  micOffsets: { [deviceId: string]: number };
  /** Per-device gain multiplier (0–3, 1 = unity). */
  micGains: { [deviceId: string]: number };
  /** Per-device pitch clarity threshold (0–1, default 0.6). */
  micPitchThresholds: { [deviceId: string]: number };
  /** Per-device smoothing window size (number of frames). */
  micSmoothingWindows: { [deviceId: string]: number };
  /** Per-device hysteresis frames (consecutive silent frames before zeroing pitch). */
  micHysteresisFrames: { [deviceId: string]: number };
  /** Per-device Hanning window toggle. */
  micUseHanning: { [deviceId: string]: boolean };
  /** Per-device monitor enabled flag. */
  micMonitorEnabled: { [deviceId: string]: boolean };
  /** Per-device monitor volume (0–100). */
  micMonitorVolumes: { [deviceId: string]: number };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([defaultPlayer]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const { audioInputs } = useAudioContext();
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>("demo");
  const gameSyncDone = useRef(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    try {
      const raw = window.localStorage.getItem("audioverse.difficulty");
      if (raw === "easy" || raw === "normal" || raw === "hard") return raw as Difficulty;
    } catch (e) { void e; }
    return "normal";
  });

  const [defaultPitchAlgorithm, setDefaultPitchAlgorithm] = useState<PitchAlgorithm>(() => {
    try {
      const raw = window.localStorage.getItem("audioverse.pitchAlgorithm");
      if (raw === "autocorr" || raw === "pitchy" || raw === "crepe" || raw === "librosa") return raw as PitchAlgorithm;
    } catch (e) { void e; }
    return "autocorr";
  });

  // Hydrate difficulty & pitchAlgorithm from backend
  useEffect(() => {
    if (gameSyncDone.current) return;
    loadUserSettings().then(s => {
      if (s?.difficulty && (s.difficulty === "easy" || s.difficulty === "normal" || s.difficulty === "hard")) {
        setDifficulty(s.difficulty as Difficulty);
      }
      if (s?.pitchAlgorithm && (s.pitchAlgorithm === "autocorr" || s.pitchAlgorithm === "pitchy" || s.pitchAlgorithm === "crepe" || s.pitchAlgorithm === "librosa")) {
        setDefaultPitchAlgorithm(s.pitchAlgorithm as PitchAlgorithm);
      }
      gameSyncDone.current = true;
    });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("audioverse.pitchAlgorithm", defaultPitchAlgorithm);
    } catch (e) { void e; }
    if (gameSyncDone.current) {
      syncSettingToBackend({ pitchAlgorithm: defaultPitchAlgorithm });
    }
  }, [defaultPitchAlgorithm]);

  // per-player algorithm selections (by player id)
  const [micAlgorithms, setMicAlgorithms] = useState<{ [playerId: number]: PitchAlgorithm }>({});
  // per-device RMS thresholds loaded from backend (deviceId → rmsThreshold)
  const [micRmsThresholds, setMicRmsThresholds] = useState<{ [deviceId: string]: number }>({});
  // per-device latency offsets loaded from backend / localStorage (deviceId → offsetMs)
  const [micOffsets, setMicOffsets] = useState<{ [deviceId: string]: number }>({});
  // per-device gain (0-3, 1=unity)
  const [micGains, setMicGains] = useState<{ [deviceId: string]: number }>({});
  // per-device pitch clarity threshold (0-1)
  const [micPitchThresholds, setMicPitchThresholds] = useState<{ [deviceId: string]: number }>({});
  // per-device smoothing window
  const [micSmoothingWindows, setMicSmoothingWindows] = useState<{ [deviceId: string]: number }>({});
  // per-device hysteresis frames
  const [micHysteresisFrames, setMicHysteresisFrames] = useState<{ [deviceId: string]: number }>({});
  // per-device Hanning window flag
  const [micUseHanning, setMicUseHanning] = useState<{ [deviceId: string]: boolean }>({});
  // per-device monitor enabled flag
  const [micMonitorEnabled, setMicMonitorEnabled] = useState<{ [deviceId: string]: boolean }>({});
  // per-device monitor volume (0-100)
  const [micMonitorVolumes, setMicMonitorVolumes] = useState<{ [deviceId: string]: number }>({});

  const setMicAlgorithm = (playerId: number, alg: PitchAlgorithm) => {
    setMicAlgorithms(prev => ({ ...(prev || {}), [playerId]: alg }));
    // Persist to localStorage keyed by deviceId for the player's assigned mic
    const player = players.find(p => p.id === playerId);
    if (player?.micId) {
      try {
        const key = `mic_settings_${player.micId}`;
        const raw = localStorage.getItem(key);
        const cur = raw ? JSON.parse(raw) : {};
        const methodMap: Record<PitchAlgorithm, number> = {
          autocorr: PitchDetectionMethod.UltrastarWP,
          crepe: PitchDetectionMethod.Crepe,
          pitchy: PitchDetectionMethod.Pitchy,
          librosa: PitchDetectionMethod.Librosa,
        };
        cur.pitchDetectionMethod = methodMap[alg] ?? PitchDetectionMethod.UltrastarWP;
        localStorage.setItem(key, JSON.stringify(cur));
      } catch (_e) { /* Expected: localStorage or JSON parse may fail */ }
    }
  };

  // Load microphone preferences from backend and apply pitchDetectionMethod
  const { isAuthenticated } = useUser();
  useEffect(() => {
    if (!isAuthenticated) return; // Don't fetch microphones if not logged in
    let mounted = true;
    const load = async () => {
      try {
        const resp = await getUserMicrophones();
        const mics: MicrophoneDto[] = Array.isArray(resp?.microphones) ? resp.microphones : (resp ?? []);
        if (!mounted) return;
        // Build mapping deviceId -> pitch method and rmsThreshold
        const deviceMap: { [deviceId: string]: number } = {};
        const rmsMap: { [deviceId: string]: number } = {};
        const offsetMap: { [deviceId: string]: number } = {};
        const gainMap: { [deviceId: string]: number } = {};
        const pitchThMap: { [deviceId: string]: number } = {};
        const smoothMap: { [deviceId: string]: number } = {};
        const hystMap: { [deviceId: string]: number } = {};
        const hanningMap: { [deviceId: string]: boolean } = {};
        const monEnabledMap: { [deviceId: string]: boolean } = {};
        const monVolumeMap: { [deviceId: string]: number } = {};
        mics.forEach(m => {
          if (m && m.deviceId) {
            let pm = typeof m.pitchDetectionMethod === 'number' ? m.pitchDetectionMethod : -1;
            // Fallback to localStorage if backend doesn't have pitchDetectionMethod
            if (pm === -1) {
              try {
                const raw = localStorage.getItem(`mic_settings_${m.deviceId}`);
                if (raw) { const j = JSON.parse(raw); if (typeof j.pitchDetectionMethod === 'number') pm = j.pitchDetectionMethod; }
              } catch (_e) { /* Expected: localStorage or JSON parse may fail */ }
            }
            deviceMap[m.deviceId] = pm;
            if (typeof m.rmsThreshold === 'number' && m.rmsThreshold > 0) {
              rmsMap[m.deviceId] = m.rmsThreshold;
            }
            // Load extended mic settings from backend
            if (typeof m.micGain === 'number') gainMap[m.deviceId] = m.micGain;
            else if (typeof m.volume === 'number' && m.volume !== 1) gainMap[m.deviceId] = m.volume;
            if (typeof m.pitchThreshold === 'number') pitchThMap[m.deviceId] = m.pitchThreshold;
            else if (typeof m.threshold === 'number' && m.threshold > 0) pitchThMap[m.deviceId] = m.threshold / 1000;
            if (typeof m.smoothingWindow === 'number') smoothMap[m.deviceId] = m.smoothingWindow;
            if (typeof m.hysteresisFrames === 'number') hystMap[m.deviceId] = m.hysteresisFrames;
            if (typeof m.useHanning === 'boolean') hanningMap[m.deviceId] = m.useHanning;
            if (typeof m.monitorEnabled === 'boolean') monEnabledMap[m.deviceId] = m.monitorEnabled;
            if (typeof m.monitorVolume === 'number') monVolumeMap[m.deviceId] = m.monitorVolume;
            // Load offsetMs from backend or localStorage fallback
            let off = typeof m.offsetMs === 'number' ? m.offsetMs : 0;
            if (!off) {
              try {
                const raw = localStorage.getItem(`mic_settings_${m.deviceId}`);
                if (raw) { const j = JSON.parse(raw); if (typeof j.offsetMs === 'number') off = j.offsetMs; }
              } catch (_e) { /* Expected: localStorage or JSON parse may fail */ }
            }
            if (off) offsetMap[m.deviceId] = off;
          }
        });
        if (!mounted) return;
        setMicRmsThresholds(rmsMap);
        setMicOffsets(offsetMap);
        setMicGains(gainMap);
        setMicPitchThresholds(pitchThMap);
        setMicSmoothingWindows(smoothMap);
        setMicHysteresisFrames(hystMap);
        setMicUseHanning(hanningMap);
        setMicMonitorEnabled(monEnabledMap);
        setMicMonitorVolumes(monVolumeMap);

        // For each player, if they have a micId and no explicit micAlgorithm set, populate it
        setMicAlgorithms(prev => {
          const out = { ...(prev || {}) } as { [playerId: number]: PitchAlgorithm };
          (players || []).forEach(p => {
            if (!p || !p.micId) return;
            if (out[p.id]) return; // respect existing manual selection
            const pm = deviceMap[p.micId];
            if (pm === undefined || pm === -1) return;
            // map backend enum to our PitchAlgorithm
            let mapped: PitchAlgorithm = defaultPitchAlgorithm;
            if (pm === PitchDetectionMethod.UltrastarWP) mapped = 'autocorr';
            else if (pm === PitchDetectionMethod.Crepe) mapped = 'crepe';
            // aubio mapping disabled: do not map backend Aubio enum to frontend algorithm (aubio is temporarily disabled)
            else if (pm === PitchDetectionMethod.Pitchy) mapped = 'pitchy';
            else if (pm === PitchDetectionMethod.Librosa) mapped = 'librosa';
            out[p.id] = mapped;
          });
          return out;
        });
      } catch (e) {
        log.warn('loadMicPreferences', 'Failed to load microphone preferences from backend', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, [players, defaultPitchAlgorithm, isAuthenticated]);

  useEffect(() => {
    try {
      window.localStorage.setItem("audioverse.difficulty", difficulty);
    } catch (e) { void e; }
    if (gameSyncDone.current) {
      syncSettingToBackend({ difficulty });
    }
  }, [difficulty]);

  // Persist per-profile difficulty when user/profile is available
  const { currentUser, userId } = useUser(); // isAuthenticated already destructured above

  // When auth resolves with no user, clear the loading flag so PlayerFormModal can evaluate
  const authCheckedRef = useRef(false);
  useEffect(() => {
    // If not authenticated (no userId) and auth check had a chance to run,
    // clear playersLoading so the UI is not stuck
    if (userId === null && !authCheckedRef.current) {
      const timer = setTimeout(() => {
        if (!authCheckedRef.current) {
          setPlayersLoading(false);
        }
      }, 1500); // give auth time to resolve
      return () => clearTimeout(timer);
    }
  }, [userId]);

  // Load primary player from backend when userId becomes available
  const primaryPlayerLoadedRef = useRef(false);
  useEffect(() => {
    if (!userId || primaryPlayerLoadedRef.current) return;
    authCheckedRef.current = true;
    let cancelled = false;
    const loadPrimary = async () => {
      try {
        const allPlayers: BackendPlayer[] = await PlayerService.getAll(userId);
        if (cancelled) return;
        const primary = (allPlayers || []).find((p: BackendPlayer) => !!p.isPrimary);
        const toLoad = primary || (allPlayers && allPlayers.length > 0 ? allPlayers[0] : null);
        if (toLoad) {
          primaryPlayerLoadedRef.current = true;
          // Extract color: prefer direct color, then first from preferredColors (may be CSV string or array)
          let playerColor = toLoad.color;
          if (!playerColor && toLoad.preferredColors) {
            if (typeof toLoad.preferredColors === 'string') {
              playerColor = toLoad.preferredColors.split(',')[0]?.trim() || undefined;
            } else if (Array.isArray(toLoad.preferredColors) && toLoad.preferredColors.length > 0) {
              playerColor = toLoad.preferredColors[0];
            }
          }
          setPlayers([{
            id: toLoad.id,
            name: toLoad.name || 'Player',
            micId: undefined,
            volume: 1,
            color: playerColor,
          }]);
          log.debug('[GameContext] Loaded primary player from backend:', toLoad, 'color:', playerColor);
        }
        // If no players on backend, keep the default "Gracz 1" so PlayerFormModal opens
      } catch (e) {
        log.warn('[GameContext] Failed to load primary player:', e);
      } finally {
        if (!cancelled) setPlayersLoading(false);
      }
    };
    loadPrimary();
    return () => { cancelled = true; };
  }, [userId]);

  const detectProfileId = (user: CurrentUserResponse | null): number | undefined => {
    if (!user) return undefined;
    const u = user as unknown as Record<string, unknown>;
    const profileObj = (u.userProfile ?? u.profile) as Record<string, unknown> | undefined;
    return (u.userProfileId ?? u.profileId ?? profileObj?.id ?? u.userId) as number | undefined;
  };

  // Load profile-scoped difficulty when currentUser changes
  useEffect(() => {
    try {
      const pid = detectProfileId(currentUser);
      if (!pid) return;
      const key = `audioverse.difficulty.profile.${pid}`;
      const raw = window.localStorage.getItem(key);
      if (raw === "easy" || raw === "normal" || raw === "hard") {
        setDifficulty(raw as Difficulty);
      }
    } catch (e) { void e; }
  }, [currentUser]);

  // Save profile-scoped difficulty
  useEffect(() => {
    try {
      const pid = detectProfileId(currentUser);
      if (!pid) return;
      const key = `audioverse.difficulty.profile.${pid}`;
      window.localStorage.setItem(key, difficulty);
    } catch (e) { void e; }
  }, [difficulty, currentUser]);

  useEffect(() => {
    setMics(audioInputs);
  }, [audioInputs]);

  useEffect(() => {
    if (players.length === 1 && mics.length === 1) {
      const player = players[0];
      const mic = mics[0];
      if (!player.micId || player.micId !== mic.deviceId) {
        log.debug('[GameContext] Auto-assign: 1 player + 1 mic → assigning', mic.deviceId, 'to player', player.id, player.name);
        setPlayers(prev => prev.map((p, i) => i === 0 ? { ...p, micId: mic.deviceId } : p));
      }
    }
  }, [players, mics]);

  const addPlayer = () => {
    setPlayers((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: `Gracz ${prev.length + 1}`,
        micId: undefined,
        volume: 1,
      },
    ]);
  };

  const updatePlayer = (id: number, patch: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  const importPlayers = (newPlayers: { id?: number; name?: string; color?: string }[], append: boolean = true, source: 'local' | 'backend' = 'local') => {
    log.debug('[GameContext] importPlayers called:', { newPlayers, append, source });
    setPlayers((prev) => {
      const base = append ? [...prev] : [];
      const startIndex = base.length;
      const mapped = newPlayers.map((p, i) => ({
        id: p.id ?? (startIndex + i + 1),
        name: p.name || `Gracz ${startIndex + i + 1}`,
        micId: undefined,
        volume: 1,
        color: p.color,
        isLocal: source === 'local',
      }));
      const result = [...base, ...mapped];
      log.debug('[GameContext] importPlayers result:', JSON.stringify(result.map(p => ({ id: p.id, name: p.name, micId: p.micId }))));
      return result;
    });
  };

  const removePlayer = (id: number) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const assignMic = (playerId: number, micId: string) => {
    log.debug('[GameContext] assignMic called:', { playerId, micId });
    setPlayers((prev) => {
      const result = prev.map((p) => (p.id === playerId ? { ...p, micId } : p));
      log.debug('[GameContext] assignMic result:', JSON.stringify(result.map(p => ({ id: p.id, name: p.name, micId: p.micId }))));
      return result;
    });
  };

  const setVolume = (playerId: number, volume: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, volume } : p))
    );
  };

  return (
    <GameContext.Provider value={{
      state: { players, mics },
      playersLoading,
      addPlayer,
      importPlayers,
      updatePlayer,
      removePlayer,
      assignMic,
      setVolume,
      gameMode,
      setGameMode,
      difficulty,
      setDifficulty,
      defaultPitchAlgorithm,
      setDefaultPitchAlgorithm,
      micAlgorithms,
      setMicAlgorithm,
      micRmsThresholds,
      micOffsets,
      micGains,
      micPitchThresholds,
      micSmoothingWindows,
      micHysteresisFrames,
      micUseHanning,
      micMonitorEnabled,
      micMonitorVolumes,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("GameContext not found");
  return ctx;
};

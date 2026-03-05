/**
 * Clip / Scene Launcher — Ableton-style clip grid with follow actions.
 * Manages scenes (rows) of clips (cells) with transport control.
 */

export type ClipState = 'stopped' | 'playing' | 'queued' | 'recording';

export type FollowAction =
  | 'none'
  | 'stop'
  | 'play-again'
  | 'play-next'
  | 'play-prev'
  | 'play-first'
  | 'play-last'
  | 'play-random'
  | 'play-random-other';

export interface LauncherClip {
  id: string;
  trackId: string;
  sceneIndex: number;
  name: string;
  /** Length in bars */
  lengthBars: number;
  /** Color for UI */
  color: string;
  state: ClipState;
  /** Source audio/MIDI clip reference */
  sourceClipId?: string;
  /** Follow action after clip finishes */
  followAction: FollowAction;
  /** Follow action probability (0-1, for random follow) */
  followActionChance: number;
  /** Alternative follow action */
  followActionB?: FollowAction;
  /** Chance for action B (remainder goes to action A) */
  followActionBChance: number;
  /** Loops enabled */
  loop: boolean;
  /** Quantize launch to this many bars (0 = immediate) */
  launchQuantize: number;
  /** Playback count before follow action fires (0 = infinite) */
  playCount: number;
  /** Current play count */
  currentPlayCount: number;
}

export interface LauncherTrack {
  id: string;
  name: string;
  /** Whether track is armed for recording */
  armed: boolean;
  /** Volume 0-1 */
  volume: number;
  /** Muted */
  muted: boolean;
  /** Soloed */
  soloed: boolean;
}

export interface LauncherScene {
  index: number;
  name: string;
  /** Tempo override (null = use global) */
  tempo?: number;
  /** Time signature override */
  timeSignature?: string;
}

export interface ClipLauncherState {
  tracks: LauncherTrack[];
  scenes: LauncherScene[];
  clips: LauncherClip[];
  /** Current global position in bars */
  currentBar: number;
  /** Global BPM */
  bpm: number;
  /** Is global transport playing */
  isPlaying: boolean;
  /** Global launch quantize (bars) */
  globalLaunchQuantize: number;
}

const CLIP_COLORS = [
  'var(--error,#e74c3c)',
  'var(--warning,#e67e22)',
  'var(--warning,#f1c40f)',
  'var(--success,#2ecc71)',
  'var(--accent-secondary,#1abc9c)',
  'var(--accent-primary,#3498db)',
  'var(--accent-hover,#9b59b6)',
  'var(--accent-primary,#e91e63)',
  'var(--info,#00bcd4)',
  'var(--warning,#ff9800)',
];

let clipCounter = 0;

/** Create empty launcher state */
export function createClipLauncher(trackCount: number = 4, sceneCount: number = 8): ClipLauncherState {
  const tracks: LauncherTrack[] = Array.from({ length: trackCount }, (_, i) => ({
    id: `track-${i}`,
    name: `Track ${i + 1}`,
    armed: false,
    volume: 0.8,
    muted: false,
    soloed: false,
  }));

  const scenes: LauncherScene[] = Array.from({ length: sceneCount }, (_, i) => ({
    index: i,
    name: `Scene ${i + 1}`,
  }));

  return {
    tracks,
    scenes,
    clips: [],
    currentBar: 0,
    bpm: 120,
    isPlaying: false,
    globalLaunchQuantize: 1,
  };
}

/** Create a new clip in the grid */
export function createClip(
  trackId: string,
  sceneIndex: number,
  name?: string,
  lengthBars: number = 4,
): LauncherClip {
  clipCounter++;
  return {
    id: `clip-${clipCounter}-${Date.now()}`,
    trackId,
    sceneIndex,
    name: name ?? `Clip ${clipCounter}`,
    lengthBars,
    color: CLIP_COLORS[clipCounter % CLIP_COLORS.length],
    state: 'stopped',
    followAction: 'none',
    followActionChance: 1,
    followActionBChance: 0,
    loop: true,
    launchQuantize: 1,
    playCount: 0,
    currentPlayCount: 0,
  };
}

/** Add clip to launcher state */
export function addClipToLauncher(state: ClipLauncherState, clip: LauncherClip): ClipLauncherState {
  // Remove any existing clip at same position
  const filtered = state.clips.filter(
    (c) => !(c.trackId === clip.trackId && c.sceneIndex === clip.sceneIndex),
  );
  return { ...state, clips: [...filtered, clip] };
}

/** Remove clip from launcher */
export function removeClipFromLauncher(state: ClipLauncherState, clipId: string): ClipLauncherState {
  return { ...state, clips: state.clips.filter((c) => c.id !== clipId) };
}

/** Get clip at grid position */
export function getClipAt(state: ClipLauncherState, trackId: string, sceneIndex: number): LauncherClip | undefined {
  return state.clips.find((c) => c.trackId === trackId && c.sceneIndex === sceneIndex);
}

/** Launch (play) a single clip, stopping others on the same track */
export function launchClip(state: ClipLauncherState, clipId: string): ClipLauncherState {
  const clip = state.clips.find((c) => c.id === clipId);
  if (!clip) return state;

  const updatedClips = state.clips.map((c) => {
    if (c.id === clipId) {
      return { ...c, state: 'playing' as ClipState, currentPlayCount: 0 };
    }
    // Stop other clips on same track
    if (c.trackId === clip.trackId && c.state === 'playing') {
      return { ...c, state: 'stopped' as ClipState };
    }
    return c;
  });

  return { ...state, clips: updatedClips, isPlaying: true };
}

/** Stop a clip */
export function stopClip(state: ClipLauncherState, clipId: string): ClipLauncherState {
  return {
    ...state,
    clips: state.clips.map((c) =>
      c.id === clipId ? { ...c, state: 'stopped' as ClipState, currentPlayCount: 0 } : c,
    ),
  };
}

/** Launch an entire scene (all clips in that row) */
export function launchScene(state: ClipLauncherState, sceneIndex: number): ClipLauncherState {
  const sceneClipIds = state.clips
    .filter((c) => c.sceneIndex === sceneIndex)
    .map((c) => c.id);

  let newState = { ...state };
  for (const id of sceneClipIds) {
    newState = launchClip(newState, id);
  }

  // Apply scene tempo if set
  const scene = state.scenes[sceneIndex];
  if (scene?.tempo) {
    newState = { ...newState, bpm: scene.tempo };
  }

  return newState;
}

/** Stop all clips */
export function stopAll(state: ClipLauncherState): ClipLauncherState {
  return {
    ...state,
    isPlaying: false,
    clips: state.clips.map((c) => ({ ...c, state: 'stopped' as ClipState, currentPlayCount: 0 })),
  };
}

/** Resolve follow action and return next clip to launch (if any) */
export function resolveFollowAction(
  state: ClipLauncherState,
  clipId: string,
): string | null {
  const clip = state.clips.find((c) => c.id === clipId);
  if (!clip) return null;

  // Determine which action to use
  const rng = Math.random();
  const action = rng < clip.followActionBChance && clip.followActionB
    ? clip.followActionB
    : clip.followAction;

  // Get clips on same track, sorted by scene index
  const trackClips = state.clips
    .filter((c) => c.trackId === clip.trackId)
    .sort((a, b) => a.sceneIndex - b.sceneIndex);

  const currentIdx = trackClips.findIndex((c) => c.id === clipId);

  switch (action) {
    case 'none':
      return null;
    case 'stop':
      return null; // caller should stop
    case 'play-again':
      return clipId;
    case 'play-next':
      return trackClips[(currentIdx + 1) % trackClips.length]?.id ?? null;
    case 'play-prev':
      return trackClips[(currentIdx - 1 + trackClips.length) % trackClips.length]?.id ?? null;
    case 'play-first':
      return trackClips[0]?.id ?? null;
    case 'play-last':
      return trackClips[trackClips.length - 1]?.id ?? null;
    case 'play-random': {
      const idx = Math.floor(Math.random() * trackClips.length);
      return trackClips[idx]?.id ?? null;
    }
    case 'play-random-other': {
      const others = trackClips.filter((c) => c.id !== clipId);
      if (others.length === 0) return null;
      return others[Math.floor(Math.random() * others.length)].id;
    }
    default:
      return null;
  }
}

/** Add a new scene */
export function addScene(state: ClipLauncherState, name?: string): ClipLauncherState {
  const newIndex = state.scenes.length;
  return {
    ...state,
    scenes: [...state.scenes, { index: newIndex, name: name ?? `Scene ${newIndex + 1}` }],
  };
}

/** Add a new track */
export function addTrack(state: ClipLauncherState, name?: string): ClipLauncherState {
  const id = `track-${state.tracks.length}`;
  return {
    ...state,
    tracks: [...state.tracks, {
      id,
      name: name ?? `Track ${state.tracks.length + 1}`,
      armed: false,
      volume: 0.8,
      muted: false,
      soloed: false,
    }],
  };
}

/** Get all currently playing clips */
export function getPlayingClips(state: ClipLauncherState): LauncherClip[] {
  return state.clips.filter((c) => c.state === 'playing');
}

/** Duplicate a clip to a new position */
export function duplicateClip(
  state: ClipLauncherState,
  clipId: string,
  targetTrackId: string,
  targetScene: number,
): ClipLauncherState {
  const source = state.clips.find((c) => c.id === clipId);
  if (!source) return state;

  const newClip = createClip(targetTrackId, targetScene, `${source.name} (copy)`, source.lengthBars);
  newClip.color = source.color;
  newClip.followAction = source.followAction;
  newClip.followActionChance = source.followActionChance;
  newClip.loop = source.loop;
  newClip.launchQuantize = source.launchQuantize;
  newClip.sourceClipId = source.sourceClipId;

  return addClipToLauncher(state, newClip);
}

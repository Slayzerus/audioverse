/**
 * KaraokeManager.coverage2.test.tsx
 *
 * Second batch of KaraokeManager coverage tests (split to avoid OOM in single worker).
 */
import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';

/* ---------- hoisted capture variables ---------- */
const cap = vi.hoisted(() => ({
  uploaderProps: null as any,
  playerProps: null as any,
  timelineProps: null as any,
  lyricsProps: null as any,
  navigateFn: vi.fn(),
  setActiveFn: vi.fn(),
  searchYT: vi.fn(),
  postCreateParty: vi.fn(),
  postAddRound: vi.fn(),
  postSaveResults: vi.fn(),
  fetchTopSingings: vi.fn(),
  profileGetAll: vi.fn(),
  getAudioCtx: vi.fn(),
  resumeAudioCtx: vi.fn(),
  importPlayers: vi.fn(),
  getUserMicrophones: vi.fn(),
  gpExternalRef: { play: vi.fn(), pause: vi.fn(), seekTo: vi.fn() } as any,
}));

/* ---------- Media / Audio globals ---------- */
(global as any).AudioContext = (global as any).AudioContext || class {
  state = 'suspended';
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
  createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }));
  createAnalyser = vi.fn(() => ({ fftSize: 2048, getFloatTimeDomainData: vi.fn() }));
  sampleRate = 44100;
};
(global as any).navigator.mediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }),
};
(global as any).navigator.getGamepads = vi.fn(() => []);

/* Prevent infinite rAF loops */
let _rafId = 0;
const _rafCbs = new Map<number, FrameRequestCallback>();
globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => { _rafId++; _rafCbs.set(_rafId, cb); return _rafId; };
globalThis.cancelAnimationFrame = (id: number) => { _rafCbs.delete(id); };

/* Prevent setInterval accumulation */
let _ivId = 0;
const _ivMap = new Map<number, any>();
globalThis.setInterval = ((fn: any, _ms?: any) => { _ivId++; _ivMap.set(_ivId, fn); return _ivId; }) as any;
globalThis.clearInterval = ((id: any) => { _ivMap.delete(id); }) as any;

/* ---------- vi.mock: contexts ---------- */
vi.mock('../contexts/GameContext', () => ({
  useGameContext: () => ({
    state: { players: [{ id: 1, name: 'TestPlayer', micId: 'mic1', color: '#ff0000' }] },
    importPlayers: cap.importPlayers,
    micAlgorithms: {},
    defaultPitchAlgorithm: 'autocorr',
    micRmsThresholds: {},
    micGains: {},
    micPitchThresholds: {},
    micSmoothingWindows: {},
    micHysteresisFrames: {},
    micUseHanning: {},
    micOffsets: {},
    micMonitorEnabled: {},
    micMonitorVolumes: {},
    difficulty: 'medium',
  }),
  GameProvider: ({ children }: any) => children,
}));
vi.mock('../contexts/UserContext', () => ({
  useUser: () => ({ currentUser: { userId: 42, userProfileId: 7 } }),
  UserProvider: ({ children }: any) => children,
}));
vi.mock('../contexts/AudioContext', () => ({
  useAudioContext: () => ({ audioInputs: [{ deviceId: 'mic1', label: 'Test Mic' }] }),
  AudioProvider: ({ children }: any) => children,
}));
vi.mock('../contexts/GamepadNavigationContext', () => ({
  useGamepadNavigation: () => ({ setActive: cap.setActiveFn, pushFocusTrap: vi.fn(), popFocusTrap: vi.fn() }),
  GamepadNavigationProvider: ({ children }: any) => children,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return { ...actual, useNavigate: () => cap.navigateFn };
});

/* ---------- vi.mock: child components ---------- */
vi.mock('../components/controls/karaoke/KaraokeUploader', () => ({
  default: (props: any) => { cap.uploaderProps = props; return <div data-testid="uploader">Uploader</div>; },
}));
vi.mock('../components/controls/player/GenericPlayer', () => ({
  default: React.forwardRef((props: any, _ref: any) => {
    cap.playerProps = props;
    if (props.externalRef) props.externalRef.current = cap.gpExternalRef;
    return <div data-testid="generic-player">Player</div>;
  }),
}));
vi.mock('../components/controls/karaoke/KaraokeTimeline', () => ({
  default: (props: any) => { cap.timelineProps = props; return <div data-testid="timeline" />; },
}));
vi.mock('../components/controls/karaoke/KaraokeLyrics', () => ({
  default: (props: any) => { cap.lyricsProps = props; return <div data-testid="lyrics" />; },
}));
vi.mock('../components/controls/karaoke/AudioPitchAnalyzer', () => ({ default: () => null }));
vi.mock('../components/animations/Jurors', () => ({ default: () => <div data-testid="jurors" /> }));
vi.mock('../components/common/Focusable', () => ({
  Focusable: ({ children, id }: any) => <div aria-label={id}>{children}</div>,
}));

/* ---------- vi.mock: services & APIs ---------- */
vi.mock('../services/rtcService', () => ({
  rtcService: {
    onTimelineUpdate: vi.fn(), offTimelineUpdate: vi.fn(),
    isConnected: vi.fn(() => false), computeClockOffset: vi.fn().mockResolvedValue(0),
    publishTimelineUpdate: vi.fn(),
  },
}));
vi.mock('../services/ProfilePlayerService', () => ({
  ProfilePlayerService: { getAll: (...args: any[]) => cap.profileGetAll(...args) },
}));
vi.mock('../scripts/api/apiKaraoke', () => ({
  postCreateParty: (...args: any[]) => cap.postCreateParty(...args),
  postAddRound: (...args: any[]) => cap.postAddRound(...args),
  postSaveResults: (...args: any[]) => cap.postSaveResults(...args),
  fetchTopSingings: (...args: any[]) => cap.fetchTopSingings(...args),
}));
vi.mock('../scripts/api/apiLibrary', () => ({
  searchYouTubeByArtistTitle: (...args: any[]) => cap.searchYT(...args),
}));
vi.mock('../scripts/api/apiUser', () => ({
  getUserMicrophones: (...args: any[]) => cap.getUserMicrophones(...args),
}));
vi.mock('../scripts/api/audioverseApiClient', () => ({ API_ROOT: 'http://test-api' }));

/* ---------- vi.mock: audio/pitch ---------- */
vi.mock('../scripts/audioContext', () => ({
  getAudioContext: () => cap.getAudioCtx(),
  resumeAudioContext: () => cap.resumeAudioCtx(),
}));
vi.mock('../scripts/recording', () => ({
  AudioRecorder: class {
    startRecording = vi.fn().mockResolvedValue(undefined);
    stopRecording = vi.fn().mockResolvedValue(undefined);
    getStream = vi.fn(() => new MediaStream());
  },
}));
vi.mock('../utils/librosaStreaming', () => ({
  LibrosaStreamClient: class { startWithMediaStream = vi.fn().mockResolvedValue(undefined); stop = vi.fn(); },
}));
vi.mock('../utils/crepeStreaming', () => ({
  CrepeStreamClient: class { startWithMediaStream = vi.fn().mockResolvedValue(undefined); stop = vi.fn(); },
}));
vi.mock('../utils/karaokeScoring', () => ({
  scoreNotesWithPitchPoints: vi.fn(() => ({ total: 0, perNote: [] })),
}));
vi.mock('../constants/karaokeScoringConfig', () => ({
  getScoringPreset: vi.fn(() => ({ semitoneTolerance: 2, preWindow: 0.2, postExtra: 0.1, difficultyMult: 1 })),
}));
vi.mock('../scripts/karaoke/karaokeTimeline', () => ({ parseNotes: vi.fn(() => []) }));
vi.mock('../utils/karaokeMetadata', () => ({
  parseVideoMetadata: vi.fn((v: string) => {
    if (v.startsWith('v=')) return { youtubeId: v.slice(2) };
    return { youtubeId: null };
  }),
}));

/* ---------- Helpers ---------- */
import KaraokeManager from '../components/controls/karaoke/KaraokeManager';
import { KaraokeFormat } from '../models/modelsKaraoke';

function makeSong(overrides: Record<string, any> = {}) {
  return {
    id: 1, title: 'Test Song', artist: 'Test Artist',
    format: KaraokeFormat.Ultrastar,
    notes: [{ noteLine: ': 0 4 60 Hello ' }],
    gap: 0, bpm: 120, ...overrides,
  } as any;
}

function renderKM(props: Record<string, any> = {}) {
  return render(
    <MemoryRouter><KaraokeManager {...props} /></MemoryRouter>,
  );
}

/* ---------- Tests (batch 2) ---------- */
describe('KaraokeManager coverage batch 2', () => {
  beforeEach(() => {
    cap.uploaderProps = null;
    cap.playerProps = null;
    cap.timelineProps = null;
    cap.lyricsProps = null;
    cap.gpExternalRef.play.mockClear();
    cap.gpExternalRef.pause.mockClear();
    cap.gpExternalRef.seekTo.mockClear();
    cap.navigateFn.mockReset();
    cap.setActiveFn.mockReset();
    cap.searchYT.mockReset().mockResolvedValue(null);
    cap.postCreateParty.mockReset().mockResolvedValue({ id: 100 });
    cap.postAddRound.mockReset().mockResolvedValue({ id: 200 });
    cap.postSaveResults.mockReset().mockResolvedValue(undefined);
    cap.fetchTopSingings.mockReset().mockResolvedValue([]);
    cap.profileGetAll.mockReset().mockResolvedValue([]);
    cap.getUserMicrophones.mockReset().mockResolvedValue([]);
    cap.getAudioCtx.mockReset().mockReturnValue({ state: 'suspended', resume: vi.fn().mockResolvedValue(undefined) });
    cap.resumeAudioCtx.mockReset();
    cap.importPlayers.mockReset();
  });

  afterEach(() => {
    cleanup();
    _rafCbs.clear();
    _ivMap.clear();
    vi.restoreAllMocks();
  });

  // ─── 21. YT search skipped when videoPath already has youtube URL ───
  test('YouTube search skipped when videoPath already contains youtube URL', async () => {
    const { getByTestId } = renderKM();
    await act(async () => {
      cap.uploaderProps.onSongUpload(makeSong({ videoPath: 'https://www.youtube.com/watch?v=existing' }));
    });
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    expect(cap.searchYT).not.toHaveBeenCalled();
  });

  // ─── 22. YT search: missing artist/title shows warning ───
  test('YT search shows warning when artist/title missing', async () => {
    const { queryByText } = renderKM();
    await act(async () => {
      cap.uploaderProps.onSongUpload(makeSong({ artist: '', title: '', videoPath: undefined }));
    });
    await waitFor(() => expect(queryByText(/No artist\/title data/)).toBeTruthy());
  });

  // ─── 23. initialSong auto-load ───
  test('initialSong prop auto-loads song', async () => {
    const song = { id: 55, title: 'Auto Song', artist: 'Auto Artist',
      notes: [{ noteLine: ': 0 4 60 La ' }], gap: 500, bpm: 140,
      videoPath: 'https://youtu.be/autoId' };
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
  });

  // ─── 24. initialSong video alias ───
  test('initialSong uses video field as videoPath fallback', async () => {
    const song = makeSong({ videoPath: undefined, video: 'https://youtu.be/videoAlias' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    expect(cap.playerProps.tracks[0].sources.some((s: any) => s.kind === 'youtube')).toBe(true);
  });

  // ─── 25. Header Play/Pause buttons ───
  test('Play/Pause header buttons render after activation', async () => {
    const { getByText, queryByText } = renderKM();
    await act(async () => { cap.uploaderProps.onSongUpload(makeSong()); });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(queryByText('Activate audio')).toBeNull());
    expect(queryByText('▶ Play')).toBeTruthy();
    expect(queryByText('⏮ Reset')).toBeTruthy();
  });

  // ─── 26. Spacebar toggles play/pause ───
  test('spacebar toggles play/pause', async () => {
    const { getByText } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    });
    await waitFor(() => expect(cap.gpExternalRef?.play).toHaveBeenCalled(), { timeout: 2000 });
  });

  // ─── 27. Demo mode renders and handleTrackEnded shows summary ───
  test('demo mode renders and onEnded shows summary', async () => {
    const { getByText, queryByText } = renderKM({ initialSong: makeSong(), gameMode: 'demo' });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    // Direct onEnded — avoids the onPlayingChange→effect cascade that OOMs
    await act(async () => { cap.playerProps.onEnded(); });
    await waitFor(() => expect(queryByText('Restart')).toBeTruthy());
  });

  // ─── 28. blob audioPath ───
  test('blob audioPath accepted', async () => {
    const song = makeSong({ videoPath: undefined, audioPath: 'blob:http://localhost/abc' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    expect(cap.playerProps.tracks[0].sources.some((s: any) => s.kind === 'audio' && s.url.includes('blob:'))).toBe(true);
  });

  // ─── 29. bare filename rejected ───
  test('bare filename audioPath rejected', async () => {
    const song = makeSong({ videoPath: undefined, audioPath: 'song.mp3' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    expect(cap.playerProps.tracks[0].sources.length).toBe(0);
  });

  // ─── 30. Show timelines checkbox ───
  test('show timelines checkbox', async () => {
    const { getByText } = renderKM();
    await act(async () => { cap.uploaderProps.onSongUpload(makeSong({ videoPath: 'https://www.youtube.com/watch?v=x' })); });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    const label = getByText('Show timelines');
    const cb = label.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(cb.checked).toBe(true);
    fireEvent.click(cb);
    expect(cb.checked).toBe(false);
  });

});

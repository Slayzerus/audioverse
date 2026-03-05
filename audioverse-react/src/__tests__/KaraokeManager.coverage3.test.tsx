/**
 * KaraokeManager.coverage3.test.tsx
 *
 * Third batch of KaraokeManager coverage tests (split to avoid OOM in single worker).
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

/* ---------- Tests (batch 3) ---------- */
describe('KaraokeManager coverage batch 3', () => {
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

  // ─── 31. Compact checkbox ───
  test('compact timelines checkbox', async () => {
    const { getByText } = renderKM();
    await act(async () => { cap.uploaderProps.onSongUpload(makeSong({ videoPath: 'https://www.youtube.com/watch?v=x' })); });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    const label = getByText('Compact');
    const cb = label.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(cb.checked).toBe(false);
    fireEvent.click(cb);
    expect(cb.checked).toBe(true);
  });

  // ─── 32. Offset display ───
  test('displays clock offset', async () => {
    const { getByText } = renderKM();
    await act(async () => { cap.uploaderProps.onSongUpload(makeSong({ videoPath: 'https://www.youtube.com/watch?v=z' })); });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    expect(getByText(/Offset:.*ms/)).toBeTruthy();
  });

  // ─── 33. Non-YouTube videoPath falls through ───
  test('non-YouTube videoPath falls through to audio', async () => {
    // Non-YouTube HTTP videoPath is now used directly as audio source
    const song = makeSong({ videoPath: 'https://vimeo.com/12345', audioPath: 'https://example.com/fallback.mp3' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    expect(cap.playerProps.tracks[0].sources.some((s: any) => s.kind === 'audio' && s.url === 'https://vimeo.com/12345')).toBe(true);
  });

  // ─── 34. / prefix audioPath ───
  test('audioPath starting with / is accepted', async () => {
    const song = makeSong({ videoPath: undefined, audioPath: '/api/audio/file.mp3' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    expect(cap.playerProps.tracks[0].sources.some((s: any) => s.url === '/api/audio/file.mp3')).toBe(true);
  });

  // ─── 35. currentTime display ───
  test('currentTime display updates', async () => {
    const { getByText, queryByText } = renderKM();
    await act(async () => { cap.uploaderProps.onSongUpload(makeSong({ videoPath: 'https://www.youtube.com/watch?v=t' })); });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    await act(async () => { cap.playerProps.onTimeUpdate(7.3); });
    await waitFor(() => expect(queryByText(/7\.3 s/)).toBeTruthy());
  });

  // ─── 36. mouseDown scale ───
  test('activate button mouseDown scales', async () => {
    const { getByText } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText(/Kliknij, aby rozpocząć/)).toBeTruthy());
    const btn = getByText(/Kliknij, aby rozpocząć/);
    fireEvent.mouseDown(btn);
    expect(btn.style.transform).toBe('scale(0.96)');
    fireEvent.mouseUp(btn);
    expect(btn.style.transform).toBe('scale(1)');
  });

  // ─── 37. GenericPlayer props ───
  test('GenericPlayer uiMode=nobuttons, autoPlay=false, height=480', async () => {
    const song = makeSong({ videoPath: 'https://www.youtube.com/watch?v=abc' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    expect(cap.playerProps.uiMode).toBe('nobuttons');
    expect(cap.playerProps.autoPlay).toBe(false);
    expect(cap.playerProps.height).toBe(480);
  });

  // ─── 38. Summary song info display ───
  test('summary shows song artist and title', async () => {
    const { getByText, queryByText } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    await act(async () => { cap.playerProps.onEnded(); });
    await waitFor(() => expect(queryByText(/Test Artist — Test Song/)).toBeTruthy());
  });

  // ─── 39. saveSingingResult path triggered ───
  test('track ended triggers saveSingingResult path', async () => {
    const song = makeSong({ id: 42 });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    // Direct onEnded — avoids the onPlayingChange→effect cascade that OOMs
    await act(async () => { cap.playerProps.onEnded(); });
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    expect(getByText('Restart')).toBeTruthy();
  });

  // ─── 40. YT search success updates videoPath ───
  test('YT search success updates song videoPath', async () => {
    cap.searchYT.mockResolvedValue('FOUND_VID');
    const { queryByText } = renderKM();
    await act(async () => {
      cap.uploaderProps.onSongUpload(makeSong({ artist: 'A', title: 'B', videoPath: undefined }));
    });
    await waitFor(() => expect(cap.searchYT).toHaveBeenCalledWith('A', 'B'));
    await waitFor(() => expect(queryByText(/Znaleziono: FOUND_VID/)).toBeTruthy());
  });
});

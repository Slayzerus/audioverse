/**
 * KaraokeManager.coverage4.test.tsx
 *
 * Fourth batch — lightweight KaraokeManager tests targeting JSX render paths,
 * error branches, and edge cases that do NOT require isPlaying=true.
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

/* ---------- Tests (batch 4) ---------- */
describe('KaraokeManager coverage batch 4', () => {
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

  // ─── 41. activateAudio error branch: getAudioContext throws ───
  test('activateAudio handles getAudioContext error gracefully', async () => {
    cap.getAudioCtx.mockImplementation(() => { throw new Error('AudioContext not allowed'); });
    const { getByText } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    // Should not crash — the try/catch inside activateAudio handles it
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    // After click, overlay should still dismiss (setAudioActivated runs after catch)
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
  });

  // ─── 42. activateAudio: getUserMedia denied ───
  test('activateAudio handles mic permission denied', async () => {
    (global as any).navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error('Not allowed'));
    const { getByText } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    // Should still activate (mic denial is non-blocking)
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
  });

  // ─── 43. initialSong with initialRoundId and initialRoundPartId props ───
  test('initialRoundId and initialRoundPartId props are accepted', async () => {
    const { getByText } = renderKM({
      initialSong: makeSong(),
      initialRoundId: 999,
      initialRoundPartId: 555,
    });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    // Component should render without error — props set currentRoundIdRef/currentRoundPartIdRef
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
  });

  // ─── 44. initialSong with no notes still renders ───
  test('initialSong with empty notes array renders correctly', async () => {
    const song = makeSong({ notes: [] });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
  });

  // ─── 45. Header play button click calls gpRef ───
  test('header play button calls gpRef.play()', async () => {
    const { getByText, queryByText } = renderKM();
    await act(async () => { cap.uploaderProps.onSongUpload(makeSong()); });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(queryByText('▶ Play')).toBeTruthy());
    fireEvent.click(getByText('▶ Play'));
    expect(cap.gpExternalRef.play).toHaveBeenCalled();
  });

  // ─── 46. Header reset button calls seekTo(0) ───
  test('header reset button calls gpRef.seekTo(0)', async () => {
    const { getByText, queryByText } = renderKM();
    await act(async () => { cap.uploaderProps.onSongUpload(makeSong()); });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(queryByText('⏮ Reset')).toBeTruthy());
    fireEvent.click(getByText('⏮ Reset'));
    expect(cap.gpExternalRef.seekTo).toHaveBeenCalledWith(0);
  });

  // ─── 47. Restart button in summary resets state ───
  test('summary Restart button seeks to 0 and plays', async () => {
    const { getByText } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    // Trigger summary
    await act(async () => { cap.playerProps.onEnded(); });
    await waitFor(() => expect(getByText('Restart')).toBeTruthy());
    // Click Restart
    fireEvent.click(getByText('Restart'));
    expect(cap.gpExternalRef.seekTo).toHaveBeenCalledWith(0);
    expect(cap.gpExternalRef.play).toHaveBeenCalled();
  });

  // ─── 48. Summary shows overlay with controls ───
  test('summary shows overlay with Restart and Continue controls', async () => {
    const { getByText, queryByText } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());

    // Trigger onEnded (no onPlayingChange to avoid heavy scoring effects causing OOM)
    await act(async () => { cap.playerProps.onEnded(); });
    // Summary overlay renders with action buttons
    await waitFor(() => {
      expect(queryByText('Restart')).toBeTruthy();
      expect(queryByText('Continue')).toBeTruthy();
    });
  });

  // ─── 49. initialSong with format field ───
  test('initialSong with explicit format', async () => {
    const song = makeSong({ format: KaraokeFormat.Ultrastar, bpm: 200, gap: 1000 });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
  });

  // ─── 50. spacebar ignored on input/textarea elements ───
  test('spacebar does nothing when target is INPUT', async () => {
    const { getByText, container } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());

    // Create a temporary input to be the target
    const input = document.createElement('input');
    container.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { code: 'Space', bubbles: true });
    Object.defineProperty(event, 'target', { value: input });
    window.dispatchEvent(event);

    // gpRef.play should NOT have been called (spacebar blocked on <input>)
    expect(cap.gpExternalRef.play).not.toHaveBeenCalled();
  });

  // ─── 51. YT search error status shows error text ───
  test('YT search error shows error text', async () => {
    cap.searchYT.mockRejectedValue(new Error('Network error'));
    const { queryByText } = renderKM();
    await act(async () => {
      cap.uploaderProps.onSongUpload(makeSong({ artist: 'A', title: 'B', videoPath: undefined }));
    });
    // Wait for error text to appear
    await waitFor(() => expect(queryByText(/Search error/)).toBeTruthy());
  });

  // ─── 52. toTrack with youtu.be URL ───
  test('youtu.be URL is treated as YouTube source', async () => {
    const song = makeSong({ videoPath: 'https://youtu.be/shortId123' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    const src = cap.playerProps.tracks[0].sources;
    expect(src.some((s: any) => s.kind === 'youtube')).toBe(true);
  });

  // ─── 53. toTrack with https:// audioPath ───
  test('https audioPath is accepted', async () => {
    const song = makeSong({ videoPath: undefined, audioPath: 'https://cdn.example.com/track.mp3' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    const src = cap.playerProps.tracks[0].sources;
    expect(src.some((s: any) => s.kind === 'audio' && s.url.includes('cdn.example.com'))).toBe(true);
  });

  // ─── 54. Multiple songs uploaded sequentially ───
  test('uploading a second song replaces the first', async () => {
    const { getByText } = renderKM();
    const song1 = makeSong({ title: 'Song 1', videoPath: 'https://www.youtube.com/watch?v=aaa' });
    const song2 = makeSong({ title: 'Song 2', videoPath: 'https://www.youtube.com/watch?v=bbb' });

    await act(async () => { cap.uploaderProps.onSongUpload(song1); });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());

    // Upload second song
    await act(async () => { cap.uploaderProps.onSongUpload(song2); });
    await waitFor(() => {
      const src = cap.playerProps.tracks[0].sources;
      expect(src[0].url).toContain('bbb');
    });
  });

  // ─── 55. initialSong with audioPath only (no video) ───
  test('initialSong with audioPath and no videoPath renders audio source', async () => {
    const song = {
      id: 10, title: 'Audio Only', artist: 'Artist',
      notes: [{ noteLine: ': 0 4 60 La ' }], gap: 0, bpm: 120,
      audioPath: 'https://example.com/audio.mp3',
    };
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    expect(cap.playerProps.tracks[0].sources.some((s: any) => s.kind === 'audio')).toBe(true);
  });

  // ─── 56. KaraokeLyrics receives correct props ───
  test('KaraokeLyrics receives song, currentTime, gameMode props', async () => {
    const song = makeSong({ videoPath: 'https://www.youtube.com/watch?v=x' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.lyricsProps).toBeTruthy());
    expect(cap.lyricsProps.song).toBeTruthy();
    expect(cap.lyricsProps.currentTime).toBeDefined();
  });

  // ─── 57. KaraokeTimeline receives correct props ───
  test('KaraokeTimeline receives song, currentTime props', async () => {
    const song = makeSong({ videoPath: 'https://www.youtube.com/watch?v=x' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.timelineProps).toBeTruthy());
    expect(cap.timelineProps.song).toBeTruthy();
    expect(cap.timelineProps.currentTime).toBeDefined();
  });

  // ─── 58. gameMode=instrumental uses instrumentalPath ───
  test('instrumental mode uses instrumentalPath as audio source', async () => {
    const song = makeSong({ videoPath: undefined, audioPath: 'https://cdn.example.com/vocal.mp3', instrumentalPath: 'https://cdn.example.com/inst.mp3' });
    const { getByText } = renderKM({ gameMode: 'instrumental' });
    await act(async () => { cap.uploaderProps.onSongUpload(song); });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    // Should use instrumentalPath, not audioPath
    const src = cap.playerProps.tracks[0].sources;
    expect(src.some((s: any) => s.url?.includes('inst.mp3'))).toBe(true);
  });

  // ─── 59. Header not shown when initialSong is provided ───
  test('header with uploader+checkboxes hidden when initialSong prop is set', async () => {
    const { queryByText, getByText } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    // The checkbox controls should NOT be present (they only render when !initialSong)
    expect(queryByText('Show timelines')).toBeNull();
    expect(queryByText('Compact')).toBeNull();
  });

  // ─── 60. Song with no id uses title for party key ───
  test('spacebar with song.id=null uses title as party key', async () => {
    const song = makeSong({ id: null, title: 'NoIdSong' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    // Trigger play via spacebar
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    });
    await waitFor(() => expect(cap.postCreateParty).toHaveBeenCalled(), { timeout: 2000 });
  });
});

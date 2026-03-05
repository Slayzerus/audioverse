/**
 * KaraokeManager.coverage.test.tsx
 *
 * Broad coverage tests for KaraokeManager component – targets the ~60% uncovered
 * render paths, callbacks, and effects.
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

/* Prevent infinite rAF loops in pitch detection from leaking memory */
let _rafId = 0;
const _rafCbs = new Map<number, FrameRequestCallback>();
globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => { _rafId++; _rafCbs.set(_rafId, cb); return _rafId; };
globalThis.cancelAnimationFrame = (id: number) => { _rafCbs.delete(id); };

/* Prevent setInterval accumulation: intervals just get stored, never fire */
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

/* ---------- vi.mock: react-router-dom (keep MemoryRouter real) ---------- */
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return { ...actual, useNavigate: () => cap.navigateFn };
});

/* ---------- vi.mock: child components (capture props) ---------- */
vi.mock('../components/controls/karaoke/KaraokeUploader', () => ({
  default: (props: any) => {
    cap.uploaderProps = props;
    return <div data-testid="uploader">Uploader</div>;
  },
}));
vi.mock('../components/controls/player/GenericPlayer', () => ({
  default: React.forwardRef((props: any, _ref: any) => {
    cap.playerProps = props;
    // Expose a stable mock external ref object
    if (props.externalRef) {
      props.externalRef.current = cap.gpExternalRef;
    }
    return <div data-testid="generic-player">Player</div>;
  }),
}));
vi.mock('../components/controls/karaoke/KaraokeTimeline', () => ({
  default: (props: any) => { cap.timelineProps = props; return <div data-testid="timeline" />; },
}));
vi.mock('../components/controls/karaoke/KaraokeLyrics', () => ({
  default: (props: any) => { cap.lyricsProps = props; return <div data-testid="lyrics" />; },
}));
vi.mock('../components/controls/karaoke/AudioPitchAnalyzer', () => ({
  default: () => null,
}));
vi.mock('../components/animations/Jurors', () => ({ default: () => <div data-testid="jurors" /> }));
vi.mock('../components/common/Focusable', () => ({
  Focusable: ({ children, id }: any) => <div aria-label={id}>{children}</div>,
}));

/* ---------- vi.mock: services & APIs ---------- */
vi.mock('../services/rtcService', () => ({
  rtcService: {
    onTimelineUpdate: vi.fn(),
    offTimelineUpdate: vi.fn(),
    isConnected: vi.fn(() => false),
    computeClockOffset: vi.fn().mockResolvedValue(0),
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
vi.mock('../scripts/api/audioverseApiClient', () => ({
  API_ROOT: 'http://test-api',
}));

/* ---------- vi.mock: audio/pitch utilities ---------- */
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
  LibrosaStreamClient: class {
    startWithMediaStream = vi.fn().mockResolvedValue(undefined);
    stop = vi.fn();
  },
}));
vi.mock('../utils/crepeStreaming', () => ({
  CrepeStreamClient: class {
    startWithMediaStream = vi.fn().mockResolvedValue(undefined);
    stop = vi.fn();
  },
}));
vi.mock('../utils/karaokeScoring', () => ({
  scoreNotesWithPitchPoints: vi.fn(() => ({ total: 0, perNote: [] })),
}));
vi.mock('../constants/karaokeScoringConfig', () => ({
  getScoringPreset: vi.fn(() => ({ semitoneTolerance: 2, preWindow: 0.2, postExtra: 0.1, difficultyMult: 1 })),
}));
vi.mock('../scripts/karaoke/karaokeTimeline', () => ({
  parseNotes: vi.fn(() => []),
}));
vi.mock('../utils/karaokeMetadata', () => ({
  parseVideoMetadata: vi.fn((v: string) => {
    // Extract videoId from v=XXXXX format
    if (v.startsWith('v=')) return { youtubeId: v.slice(2) };
    return { youtubeId: null };
  }),
}));

/* ---------- Helpers ---------- */
import KaraokeManager from '../components/controls/karaoke/KaraokeManager';
import { KaraokeFormat } from '../models/modelsKaraoke';

function makeSong(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    format: KaraokeFormat.Ultrastar,
    notes: [{ noteLine: ': 0 4 60 Hello ' }],
    gap: 0,
    bpm: 120,
    ...overrides,
  } as any;
}

function renderKM(props: Record<string, any> = {}) {
  return render(
    <MemoryRouter>
      <KaraokeManager {...props} />
    </MemoryRouter>,
  );
}

/* ---------- Tests ---------- */
describe('KaraokeManager coverage', () => {
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

  // ─── 1. Empty state ───
  test('renders uploader when no song uploaded', () => {
    const { getByTestId } = renderKM();
    expect(getByTestId('uploader')).toBeTruthy();
  });

  // ─── 2. Audio activation overlay ───
  test('shows audio activation overlay when song is uploaded but audio not activated', async () => {
    const { getByText } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    expect(getByText(/Kliknij, aby rozpocząć/)).toBeTruthy();
    expect(getByText(/Możesz też nacisnąć Enter/)).toBeTruthy();
  });

  // ─── 3. Clicking activateAudio dismisses overlay, shows player ───
  test('activateAudio dismisses overlay and shows player', async () => {
    const { getByText, queryByText, getByTestId } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());

    // Click the activation button
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));

    await waitFor(() => expect(queryByText('Activate audio')).toBeNull());
    expect(getByTestId('generic-player')).toBeTruthy();
  });

  // ─── 4. Keyboard activation (Enter) ───
  test('Enter key on overlay activates audio', async () => {
    const { getByText, queryByText } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());

    // The overlay div has onKeyDown handler
    const overlay = getByText('Activate audio').closest('div[style]')!;
    // Walk up to find the overlay with position:fixed
    let el = overlay;
    while (el && !el.getAttribute('style')?.includes('fixed')) {
      el = el.parentElement as HTMLElement;
    }
    if (el) fireEvent.keyDown(el, { code: 'Enter' });

    await waitFor(() => expect(queryByText('Activate audio')).toBeNull());
  });

  // ─── 5. Space key on overlay activates audio ───
  test('Space key on overlay activates audio', async () => {
    const { getByText, queryByText } = renderKM({ initialSong: makeSong() });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());

    let el = getByText('Activate audio').closest('div[style]')!;
    while (el && !el.getAttribute('style')?.includes('fixed')) {
      el = el.parentElement as HTMLElement;
    }
    if (el) fireEvent.keyDown(el, { code: 'Space' });

    await waitFor(() => expect(queryByText('Activate audio')).toBeNull());
  });

  // ─── 6. handleSongUpload via uploader callback ───
  test('uploader onSongUpload sets uploaded song and triggers YT search', async () => {
    const { getByTestId } = renderKM();
    expect(getByTestId('uploader')).toBeTruthy();

    // Trigger the captured onSongUpload callback
    const song = makeSong({ artist: 'Nickelback', title: 'Rockstar' });
    await act(async () => {
      cap.uploaderProps.onSongUpload(song);
    });

    // After uploading, audio activation overlay should appear
    await waitFor(() => {
      expect(document.querySelector('[style*="fixed"]')).toBeTruthy();
    });
  });

  // ─── 7. toTrack: YouTube videoPath ───
  test('GenericPlayer receives YouTube source when videoPath has youtube URL', async () => {
    const song = makeSong({ videoPath: 'https://www.youtube.com/watch?v=abc123' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));

    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    expect(cap.playerProps.tracks.length).toBe(1);
    const src = cap.playerProps.tracks[0].sources;
    expect(src.some((s: any) => s.kind === 'youtube')).toBe(true);
  });

  // ─── 8. toTrack: v= prefix videoPath ───
  test('GenericPlayer handles v= prefix videoPath', async () => {
    const song = makeSong({ videoPath: 'v=XYZ789' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));

    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    const src = cap.playerProps.tracks[0].sources;
    expect(src.some((s: any) => s.kind === 'youtube' && s.url.includes('XYZ789'))).toBe(true);
  });

  // ─── 9. toTrack: audio-only when no videoPath ───
  test('GenericPlayer receives audio source when no videoPath', async () => {
    const song = makeSong({ videoPath: undefined, audioPath: 'https://example.com/song.mp3' });
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));

    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    const src = cap.playerProps.tracks[0].sources;
    expect(src.some((s: any) => s.kind === 'audio' && s.url.includes('song.mp3'))).toBe(true);
  });

  // ─── 10. toTrack: no-music game mode produces empty sources ───
  test('no-music game mode produces empty sources', async () => {
    const song = makeSong({ videoPath: 'https://www.youtube.com/watch?v=abc', audioPath: 'https://example.com/a.mp3' });
    const { getByText } = renderKM({ initialSong: song, gameMode: 'no-music' });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));

    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    expect(cap.playerProps.tracks[0].sources.length).toBe(0);
  });

  // ─── 11. toTrack: instrumental mode uses instrumentalPath ───
  test('instrumental mode uses instrumentalPath instead of audioPath', async () => {
    // Must use uploader callback (not initialSong) because initialSong conversion drops instrumentalPath
    const { getByTestId, getByText } = renderKM({ gameMode: 'instrumental' });
    const song = makeSong({
      videoPath: undefined,
      audioPath: 'https://example.com/vocal.mp3',
      instrumentalPath: 'https://example.com/instrumental.mp3',
    });
    await act(async () => {
      cap.uploaderProps.onSongUpload(song);
    });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));

    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    const src = cap.playerProps.tracks[0].sources;
    expect(src.some((s: any) => s.kind === 'audio' && s.url.includes('instrumental.mp3'))).toBe(true);
  });

  // ─── 12. handleTrackEnded shows summary modal ───
  test('handleTrackEnded shows summary modal', async () => {
    const song = makeSong();
    const { getByText, queryByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());

    // Trigger onEnded callback (no onPlayingChange to avoid heavy scoring effects)
    await act(async () => {
      cap.playerProps.onEnded();
    });

    await waitFor(() => {
      expect(queryByText('Restart')).toBeTruthy();
      expect(queryByText('Continue')).toBeTruthy();
    });
  });

  // ─── 13. Summary modal: Restart button ───
  test('summary Restart button hides modal and seeks to 0', async () => {
    const song = makeSong();
    const { getByText, queryByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());

    // Trigger end → show summary
    await act(async () => { cap.playerProps.onEnded(); });
    await waitFor(() => expect(getByText('Restart')).toBeTruthy());

    // Click Restart
    fireEvent.click(getByText('Restart'));
    await waitFor(() => expect(queryByText('Restart')).toBeNull());
    // Verify gpRef.current.seekTo(0) and .play() were called
    // (the Restart button handler calls them synchronously before re-render)
    expect(cap.gpExternalRef.seekTo).toHaveBeenCalledWith(0);
    expect(cap.gpExternalRef.play).toHaveBeenCalled();
  });

  // ─── 14. Summary modal: Continue button navigates ───
  test('summary Continue button navigates to /songs', async () => {
    const song = makeSong();
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    await act(async () => { cap.playerProps.onEnded(); });
    await waitFor(() => expect(getByText('Continue')).toBeTruthy());

    fireEvent.click(getByText('Continue'));
    expect(cap.navigateFn).toHaveBeenCalledWith('/songs');
  });

  // ─── 15. Summary modal: sets focus via setActive ───
  test('summary modal calls setActive("summary-back")', async () => {
    const song = makeSong();
    const { getByText } = renderKM({ initialSong: song });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());
    await act(async () => { cap.playerProps.onEnded(); });
    await waitFor(() => expect(cap.setActiveFn).toHaveBeenCalledWith('summary-back'));
  });

  // ─── 16. showJurors prop renders Jurors ───
  test('showJurors renders Jurors component', async () => {
    const song = makeSong();
    const { getByText, getByTestId } = renderKM({ initialSong: song, showJurors: true });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    // Jurors render even before activation when uploadedSong is set and showJurors=true
    expect(getByTestId('jurors')).toBeTruthy();
  });

  // ─── 17. blind mode hides timeline and lyrics ───
  test('blind mode hides timeline and lyrics overlays', async () => {
    const song = makeSong({ videoPath: 'https://www.youtube.com/watch?v=abc' });
    const { getByText, queryByTestId } = renderKM({ initialSong: song, gameMode: 'blind' });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());

    // In blind mode, timeline and lyrics should NOT be rendered
    expect(queryByTestId('timeline')).toBeNull();
    expect(queryByTestId('lyrics')).toBeNull();
  });

  // ─── 18. no-timeline mode hides timeline but shows lyrics ───
  test('no-timeline mode hides timeline but shows lyrics', async () => {
    const song = makeSong({ videoPath: 'https://www.youtube.com/watch?v=abc' });
    const { getByText, queryByTestId } = renderKM({ initialSong: song, gameMode: 'no-timeline' });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());

    expect(queryByTestId('timeline')).toBeNull();
    expect(queryByTestId('lyrics')).toBeTruthy();
  });

  // ─── 19. no-lyrics mode hides lyrics but shows timeline ───
  test('no-lyrics mode hides lyrics but shows timeline', async () => {
    const song = makeSong({ videoPath: 'https://www.youtube.com/watch?v=abc' });
    const { getByText, queryByTestId } = renderKM({ initialSong: song, gameMode: 'no-lyrics' });
    await waitFor(() => expect(getByText('Activate audio')).toBeTruthy());
    fireEvent.click(getByText(/Kliknij, aby rozpocząć/));
    await waitFor(() => expect(cap.playerProps).toBeTruthy());

    expect(queryByTestId('timeline')).toBeTruthy();
    expect(queryByTestId('lyrics')).toBeNull();
  });

  // ─── 20. YT search is triggered on song upload with artist+title ───
  test('YouTube search triggered after handleSongUpload', async () => {
    cap.searchYT.mockResolvedValue('YT_VIDEO_ID');
    const { getByTestId } = renderKM();

    await act(async () => {
      cap.uploaderProps.onSongUpload(makeSong({ artist: 'Nickelback', title: 'Rockstar', videoPath: undefined }));
    });

    // Let the useEffect fire
    await waitFor(() => expect(cap.searchYT).toHaveBeenCalledWith('Nickelback', 'Rockstar'));
  });
});

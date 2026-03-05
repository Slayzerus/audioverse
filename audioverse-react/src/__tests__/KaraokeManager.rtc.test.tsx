import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { GameProvider } from '../contexts/GameContext';
import { UserProvider } from '../contexts/UserContext';
import { AudioProvider } from '../contexts/AudioContext';
import { GamepadNavigationProvider } from '../contexts/GamepadNavigationContext';
import { MemoryRouter } from 'react-router-dom';

describe('KaraokeManager SignalR integration', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test('registers and unregisters timeline listener', async () => {
    // Increase timeout for slow async operations
    const handlers: Array<(...args: any[]) => void> = [];

    // Mock context hooks/providers so we don't mount real providers that touch localStorage / navigator
    vi.mock('../contexts/GameContext', () => ({
      useGameContext: () => ({ state: { players: [{ id: 1, name: 'P1', micId: 'mic1' }] }, importPlayers: () => {}, micAlgorithms: {}, defaultPitchAlgorithm: 'autocorr', micRmsThresholds: {}, micGains: {}, micPitchThresholds: {}, micSmoothingWindows: {}, micHysteresisFrames: {}, micUseHanning: {}, micOffsets: {}, micMonitorEnabled: {}, micMonitorVolumes: {} }),
      GameProvider: ({ children }: any) => children,
    }));
    vi.mock('../contexts/UserContext', () => ({
      useUser: () => ({ currentUser: null }),
      UserProvider: ({ children }: any) => children,
    }));
    vi.mock('../contexts/AudioContext', () => ({
      useAudioContext: () => ({ audioInputs: [] }),
      AudioProvider: ({ children }: any) => children,
    }));
    vi.mock('../contexts/GamepadNavigationContext', () => ({
      useGamepadNavigation: () => ({ setActive: () => {}, pushFocusTrap: vi.fn(), popFocusTrap: vi.fn() }),
      GamepadNavigationProvider: ({ children }: any) => children,
    }));

    // Dynamically import KaraokeManager and rtcService after mocks are in place
    const [{ default: KaraokeManager }, { rtcService }] = await Promise.all([
      import('../components/controls/karaoke/KaraokeManager'),
      import('../services/rtcService'),
    ]);

    // Mock the rtcService timeline registration to capture handlers
    vi.spyOn(rtcService, 'onTimelineUpdate').mockImplementation(((h: any) => {
      handlers.push(h);
    }) as any);
    vi.spyOn(rtcService, 'offTimelineUpdate').mockImplementation(((h?: any) => {
      if (!h) { handlers.length = 0; return; }
      const idx = handlers.indexOf(h);
      if (idx >= 0) handlers.splice(idx, 1);
    }) as any);

    // Minimal uploadedSong stub used by KaraokeManager render paths
    const uploadedSong = {
      id: 1,
      title: 'Test Song',
      artist: 'Tester',
      notes: [{ noteLine: '0,0,0' }],
      gap: 0,
      bpm: 120,
    } as any;

    const { unmount } = render(
      <MemoryRouter>
        <KaraokeManager uploadedSong={uploadedSong} />
      </MemoryRouter>
    );

    // onTimelineUpdate should have been called and captured one handler
    expect(handlers.length).toBeGreaterThanOrEqual(1);

    // Invoke the captured handler to simulate an incoming timeline update
    const sample = { playerId: 1, points: [{ t: 0.5, hz: 440 }], serverTimeUtc: new Date().toISOString() };
    handlers.forEach(h => h(sample));

    // Unmount should call offTimelineUpdate and remove handlers
    unmount();
    expect(handlers.length).toBe(0);
  }, 20000);
});

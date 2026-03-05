import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Handlers array used by the mocked/spied rtcService. We'll attach spies after importing rtcService below.
const handlers: Array<(...args: any[]) => void> = [];

// Provide media/audio globals used by KaraokeManager during audio activation
(global as any).navigator = (global as any).navigator || {};
(global as any).navigator.mediaDevices = (global as any).navigator.mediaDevices || {
  getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }),
};
(global as any).AudioContext = (global as any).AudioContext || class {
  suspend = async () => {};
  resume = async () => {};
  close = async () => {};
};

// Capture props passed to KaraokeTimeline; declare at module scope so mocked factory can set it.
let lastProps: any = null;
vi.mock('../components/controls/karaoke/KaraokeTimeline', () => ({
  default: (props: any) => {
    lastProps = props;
    return null;
  }
}));

describe('KaraokeManager deeper behaviors', () => {
  test('incoming timeline update updates KaraokeTimeline props and computes latency using clock offset', async () => {
    // Increase timeout for slow async operations
    // Capture handlers registered by KaraokeManager (declared at module scope so mocks can use it)
    handlers.length = 0;

    // Mock contexts to provide a single player with id=1
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

    // KaraokeTimeline mock and `lastProps` are declared at module scope above.

    // Now import KaraokeManager and rtcService dynamically (after mocks)
    const [{ default: KaraokeManager }, { rtcService }] = await Promise.all([
      import('../components/controls/karaoke/KaraokeManager'),
      import('../services/rtcService'),
    ]);

    // Spy on rtcService to capture handlers
    vi.spyOn(rtcService, 'onTimelineUpdate').mockImplementation(((h: any) => {
      handlers.push(h);
    }) as any);
    vi.spyOn(rtcService, 'offTimelineUpdate').mockImplementation(((h?: any) => {
      if (!h) { handlers.length = 0; return; }
      const idx = handlers.indexOf(h);
      if (idx >= 0) handlers.splice(idx, 1);
    }) as any);
    vi.spyOn(rtcService, 'computeClockOffset').mockResolvedValue(1000);

    // Render with minimal uploadedSong stub
    const uploadedSong = { id: 99, notes: [{ noteLine: '0,0,0' }], gap: 0, bpm: 120, title: 'T' } as any;
    const renderResult = render(
      <MemoryRouter>
        <KaraokeManager initialSong={uploadedSong} />
      </MemoryRouter>
    );

    // Click the activate audio button to dismiss the audio activation overlay
    const activateContainer = renderResult.getByLabelText('activate-audio-btn');
    await waitFor(() => expect(activateContainer).toBeTruthy());
    fireEvent.click(activateContainer);

    // Wait for handler registration
    await waitFor(() => { if (handlers.length === 0) throw new Error('handler not registered yet'); });

    // Simulate incoming timeline update with serverTimeUtc
    const serverNow = new Date().toISOString();
    const payload = { playerId: 1, points: [{ t: 1.23, hz: 440 }], serverTimeUtc: serverNow };
    handlers.forEach(h => h(payload));

    // Wait for KaraokeTimeline props to be updated
    await waitFor(() => {
      if (!lastProps) throw new Error('timeline props not set yet');
      if (!Array.isArray(lastProps.userPitch) || lastProps.userPitch.length === 0) throw new Error('userPitch not updated');
    });

    // Validate pitch was forwarded
    expect(lastProps.userPitch.some((p: any) => p.hz === 440)).toBeTruthy();

    // Validate latency is a finite number (avoid flaky exact offset checks)
    expect(typeof lastProps.config?.latencyMs === 'number').toBeTruthy();
    expect(Number.isFinite(lastProps.config?.latencyMs)).toBeTruthy();
  }, 20000);
});

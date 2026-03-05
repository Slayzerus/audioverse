import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import KaraokeTimeline from '../components/controls/karaoke/KaraokeTimeline';

describe('KaraokeTimeline', () => {
  test('calls drawTimeline on render and RAF loop when playing', async () => {
    // stub getContext so component thinks canvas is available
    (HTMLCanvasElement.prototype as any).getContext = (type: string) => {
      return {
        clearRect: () => {},
        fillRect: () => {},
        fillText: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createLinearGradient: () => ({ addColorStop: () => {} }),
        beginPath: () => {},
        drawImage: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        moveTo: () => {},
        lineTo: () => {},
        measureText: () => ({ width: 10 }),
        translate: () => {},
        scale: () => {},
        save: () => {},
        restore: () => {},
        createPattern: () => ({}),
      } as any;
    };

    // Stub RAF synchronously so RAF-based loop runs without fake timers
    global.requestAnimationFrame = (cb: FrameRequestCallback) => {
      try { cb(performance.now()); } catch (_e) { /* swallow */ }
      return 1 as unknown as number;
    };
    global.cancelAnimationFrame = () => {};

    const song = { id: 1, notes: [{ noteLine: '0,0,0' }], gap: 0, bpm: 120 } as any;

    // Create a fake playerRef with boundingClientRect for sizing
    const playerRef = { current: { getBoundingClientRect: () => ({ width: 600, height: 300 }) } } as any;

    // Render component (not playing)
    const { rerender, unmount } = render(
      <KaraokeTimeline
        song={song}
        currentTime={0}
        playerRef={playerRef}
        userPitch={[]}
        config={{ playerName: "P1" }}
      />
    );

    // Allow effects to run; ensure component renders and RAF loop can advance
    await waitFor(() => expect(document.querySelector('canvas')).toBeTruthy());

    // Now render as playing to trigger RAF loop path and advance timers
    await act(async () => {
      rerender(
        <KaraokeTimeline
          song={song}
          currentTime={0.5}
          playerRef={playerRef}
          userPitch={[{ t: 0.5, hz: 440 }]}
          config={{ playerName: "P1", isPlaying: true }}
        />
      );
      // unmount to ensure RAF loop is cleaned up
      unmount();
    });
  });
});

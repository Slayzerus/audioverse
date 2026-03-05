import React, { createRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Isolated mock for react-youtube exposing player API we assert against
vi.mock('react-youtube', () => {
  return {
    default: ({ onReady }: any) => {
      const player: any = {
        _time: 0,
        _duration: 100,
        playVideo: vi.fn(() => { player._playing = true; }),
        pauseVideo: vi.fn(() => { player._playing = false; }),
        seekTo: vi.fn((s: number, a?: any) => { player._time = s; }),
        getCurrentTime: vi.fn(() => player._time),
        getDuration: vi.fn(() => player._duration),
        setVolume: vi.fn(() => {}),
        _playing: false,
      };
      // signal ready on next tick
      setTimeout(() => onReady({ target: player }), 0);
      return React.createElement('div', { 'data-testid': 'yt-edge-mock' }, 'yt');
    }
  };
});

// For the HLS fallback test we mock hls.js to report not-supported
vi.mock('hls.js', () => ({ default: { isSupported: () => false } }));

import GenericPlayer from '../components/controls/player/GenericPlayer';

describe('GenericPlayer edge behaviors', () => {
  beforeEach(() => {
    // Keep play/pause spies on prototype so existing tests stay stable
    // @ts-ignore
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    // @ts-ignore
    HTMLMediaElement.prototype.pause = vi.fn();
    // no global player exposure used; nothing to clear
  });

  it('YouTube externalRef.setVolume calls underlying setVolume with rounded percent', async () => {
    const tracks = [{ id: 'y1', title: 'V', artist: 'A', sources: [{ kind: 'youtube', videoId: 'vid-edge' }] }];
    const ref = createRef<any>();
    const onPlayingChange = vi.fn();
    const onTimeUpdate = vi.fn();

    const { findByTestId } = render(
      <GenericPlayer tracks={tracks} autoPlay={false} externalRef={ref} onPlayingChange={onPlayingChange} onTimeUpdate={onTimeUpdate} uiMode="full" />
    );

    await findByTestId('yt-edge-mock');

    act(() => { ref.current?.setVolume(0.423); });

    // underlying mock should have been called with Math.round(0.423*100) = 42
    await waitFor(() => {
      const player = ref.current?.getUnderlyingPlayer?.();
      expect(player).toBeTruthy();
      expect(player.setVolume).toHaveBeenCalledWith(42);
    });
  });

  it('YouTube seekTo clamps logical time to 0 for negative values and calls underlying seek', async () => {
    const tracks = [{ id: 'y2', title: 'S', artist: 'A', sources: [{ kind: 'youtube', videoId: 'vid-seek' }] }];
    const ref = createRef<any>();
    const onTimeUpdate = vi.fn();

    const { findByTestId } = render(<GenericPlayer tracks={tracks} autoPlay={false} externalRef={ref} onTimeUpdate={onTimeUpdate} uiMode="full" />);
    await findByTestId('yt-edge-mock');

    act(() => { ref.current?.seekTo(-5); });

    await waitFor(() => expect(onTimeUpdate).toHaveBeenCalledWith(0));
  });

  it('HLS fallback: when Hls.isSupported is false, attachNative calls audio.load', async () => {
    // ensure canPlayType returns empty so dynamic-import path is taken
    // @ts-ignore
    HTMLMediaElement.prototype.canPlayType = vi.fn(() => '');
    const loadSpy = vi.spyOn(HTMLMediaElement.prototype, 'load');

    const tracks = [{ id: 'h1', title: 'H', artist: 'A', sources: [{ kind: 'hls', url: 'http://s.example/stream.m3u8' }] }];
    render(<GenericPlayer tracks={tracks} autoPlay={false} uiMode="full" />);

    await waitFor(() => expect(loadSpy).toHaveBeenCalled());
  });
});

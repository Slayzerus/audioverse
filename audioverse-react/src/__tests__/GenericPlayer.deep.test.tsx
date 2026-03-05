import React, { createRef } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mock react-youtube to provide a controllable player
vi.mock('react-youtube', () => {
  return {
    default: ({ onReady, onEnd }: any) => {
    // create a fake player object
    const player = {
      _time: 0,
      _duration: 120,
      playVideo: vi.fn(() => { player._playing = true; }),
      pauseVideo: vi.fn(() => { player._playing = false; }),
      seekTo: vi.fn((s: number) => { player._time = s; }),
      getCurrentTime: vi.fn(() => player._time),
      getDuration: vi.fn(() => player._duration),
      setVolume: vi.fn(() => {}),
      _playing: false,
    };
    // call onReady in next tick so component receives it
    setTimeout(() => onReady({ target: player }), 0);
    // render a simple placeholder
    return React.createElement('div', { 'data-testid': 'yt-mock' }, 'yt');
    }
  };
});

// Mock hls.js for dynamic import path
vi.mock('hls.js', () => {
  class H {
    static isSupported() { return true; }
    loadSource = vi.fn((s: string) => { this.src = s; });
    attachMedia = vi.fn((a: any) => { this.media = a; });
    on = vi.fn((ev: any, cb: any) => { /* ignore */ });
    destroy = vi.fn();
  }
  return { default: H };
});

import GenericPlayer from '../components/controls/player/GenericPlayer';

describe('GenericPlayer deeper behaviors (YouTube / HLS)', () => {
  beforeEach(() => {
    // stub HTMLMediaElement methods used by GenericPlayer
    // @ts-ignore
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    // @ts-ignore
    HTMLMediaElement.prototype.pause = vi.fn();
    // leave load and canPlayType to global setup; keep play/pause spies
  });

  it('YouTube externalRef methods call underlying player and update playing state', async () => {
    const tracks = [{ id: 'y1', title: 'V', artist: 'A', sources: [{ kind: 'youtube', videoId: 'vid123' }] }];
    const ref = createRef<any>();
    const onPlayingChange = vi.fn();
    const onTimeUpdate = vi.fn();

    const { findByTestId } = render(
      <GenericPlayer tracks={tracks} autoPlay={false} externalRef={ref} onPlayingChange={onPlayingChange} onTimeUpdate={onTimeUpdate} uiMode="full" />
    );

    // wait for mock YouTube onReady to have been called and player attached
    await findByTestId('yt-mock');

    // use act to ensure state updates are flushed
    act(() => {
      ref.current?.play();
    });
    await waitFor(() => expect(onPlayingChange).toHaveBeenCalledWith(true));

    act(() => {
      ref.current?.seekTo(15);
    });
    await waitFor(() => expect(onTimeUpdate).toHaveBeenCalled());

    act(() => {
      ref.current?.pause();
    });
    await waitFor(() => expect(onPlayingChange).toHaveBeenCalledWith(false));
  });

  it('HLS dynamic import path attaches Hls and calls load/attach', async () => {
    const tracks = [{ id: 'h1', title: 'H', artist: 'A', sources: [{ kind: 'hls', url: 'http://s.example/stream.m3u8' }] }];
    const onPlayingChange = vi.fn();

    const loadSpy = vi.spyOn(HTMLMediaElement.prototype, 'load');
    const { container } = render(<GenericPlayer tracks={tracks} autoPlay={false} onPlayingChange={onPlayingChange} uiMode="full" />);

    // query for audio element rendered (it is hidden but present)
    const audio = container.querySelector('audio') as HTMLAudioElement | null;
    expect(audio).toBeTruthy();

    // Since we mocked hls.js, dynamic import will create Hls and attach
    // advance a tick so the async import resolves
    await waitFor(() => {
      expect(loadSpy).toHaveBeenCalled();
    });
  });
});

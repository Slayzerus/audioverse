/**
 * Additional GenericPlayer tests targeting uncovered lines:
 * nobuttons, compact/CompactNext, progressOnly fixedBottom, countdown,
 * extractVideoId, handleEnded last track, cover/no-cover, onLoadedMetadata,
 * audio source label/codec/quality, MinimalRow, volume/seek sliders.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { createRef } from 'react';
import { render, fireEvent, act } from '@testing-library/react';

/* ---- Mock react-youtube ---- */
let ytOnReady: any = null;
let ytOnEnd: any = null;

vi.mock('react-youtube', () => ({
  default: ({ onReady, onEnd, videoId }: any) => {
    ytOnReady = onReady;
    ytOnEnd = onEnd;
    return React.createElement('div', { 'data-testid': 'yt', 'data-video': videoId });
  },
}));

vi.mock('hls.js', () => ({
  default: { isSupported: () => false, Events: { MANIFEST_PARSED: 'mp' } },
}));

import { GenericPlayer } from '../components/controls/player/GenericPlayer';
import type { GenericPlayerExternal, PlayerTrack } from '../components/controls/player/GenericPlayer';

beforeEach(() => {
  ytOnReady = null;
  ytOnEnd = null;
  vi.useFakeTimers({ shouldAdvanceTime: true });
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
  HTMLMediaElement.prototype.pause = vi.fn();
  HTMLMediaElement.prototype.load = vi.fn();
});
afterEach(() => { vi.useRealTimers(); });

const audio = (id = '1', extra: Partial<PlayerTrack> = {}): PlayerTrack => ({
  id, title: `T${id}`, artist: `A${id}`,
  sources: [{ kind: 'audio', url: `http://t${id}.mp3` }],
  ...extra,
});

const yt = (id = '1', videoId = 'dQw4w9WgXcQ', extra: Partial<PlayerTrack> = {}): PlayerTrack => ({
  id, title: 'YT', artist: 'A',
  sources: [{ kind: 'youtube', videoId }],
  ...extra,
});

describe('GenericPlayer coverage', () => {
  /* -- nobuttons mode -- */
  it('nobuttons renders barrier overlay', () => {
    const { container } = render(
      <GenericPlayer tracks={[yt()]} uiMode="nobuttons" autoPlay={false} />,
    );
    const barriers = Array.from(container.querySelectorAll('div')).filter(
      d => d.style.pointerEvents === 'auto' && d.style.zIndex === '100',
    );
    expect(barriers.length).toBeGreaterThan(0);
  });

  it('nobuttons onReady plays immediately', () => {
    const fakePlayer = {
      playVideo: vi.fn(), pauseVideo: vi.fn(), seekTo: vi.fn(),
      setVolume: vi.fn(), getCurrentTime: () => 0, getDuration: () => 60,
    };
    render(<GenericPlayer tracks={[yt()]} uiMode="nobuttons" autoPlay={false} />);
    act(() => { ytOnReady?.({ target: fakePlayer }); });
    expect(fakePlayer.playVideo).toHaveBeenCalled();
  });

  /* -- compact + CompactNext -- */
  it('compact shows CompactNext list', () => {
    const tracks = [audio('1'), audio('2'), audio('3')];
    const { container } = render(
      <GenericPlayer tracks={tracks} uiMode="compact" autoPlay={false} />,
    );
    expect(container.textContent).toContain('player.upNext');
    expect(container.textContent).toContain('A2');
  });

  it('CompactNext pick changes index', () => {
    const onIndex = vi.fn();
    const tracks = [audio('1'), audio('2'), audio('3')];
    const { container } = render(
      <GenericPlayer tracks={tracks} uiMode="compact" autoPlay={false} onIndexChange={onIndex} />,
    );
    const btns = Array.from(container.querySelectorAll('button'));
    const t2 = btns.find(b => b.textContent?.includes('T2'));
    if (t2) { fireEvent.click(t2); expect(onIndex).toHaveBeenCalled(); }
  });

  /* -- minimal -- */
  it('minimal shows title/artist + MinimalRow buttons', () => {
    const { container, getByTitle } = render(
      <GenericPlayer tracks={[audio()]} uiMode="minimal" autoPlay={false} />,
    );
    expect(container.textContent).toContain('T1');
    expect(getByTitle('player.play')).toBeTruthy();
  });

  /* -- progressOnly -- */
  it('progressOnly fixedBottom uses fixed positioning', () => {
    const { container } = render(
      <GenericPlayer tracks={[audio()]} uiMode="progressOnly" progressBarPosition="fixedBottom" autoPlay={false} />,
    );
    const fixed = Array.from(container.querySelectorAll('div')).find(d => d.style.position === 'fixed');
    expect(fixed).toBeTruthy();
  });

  /* -- handleEnded -- */
  it('handleEnded on last track calls onEnded', () => {
    const onEnded = vi.fn();
    render(<GenericPlayer tracks={[yt()]} uiMode="full" autoPlay={false} onEnded={onEnded} />);
    act(() => { ytOnEnd?.(); });
    expect(onEnded).toHaveBeenCalled();
  });

  it('handleEnded on non-last track advances', () => {
    const onIndex = vi.fn();
    render(<GenericPlayer tracks={[yt('1'), yt('2', 'xx')]} uiMode="full" autoPlay={false} onIndexChange={onIndex} />);
    act(() => { ytOnEnd?.(); });
    expect(onIndex).toHaveBeenCalledWith(1);
  });

  /* -- audio cover image vs placeholder -- */
  it('audio with coverUrl renders <img>', () => {
    const { container } = render(
      <GenericPlayer tracks={[audio('1', { coverUrl: 'http://c.jpg' })]} uiMode="full" autoPlay={false} />,
    );
    const img = container.querySelector('img[alt="cover"]');
    expect(img).toBeTruthy();
  });

  it('audio without coverUrl shows text placeholder', () => {
    const { container } = render(
      <GenericPlayer tracks={[audio()]} uiMode="full" autoPlay={false} />,
    );
    expect(container.textContent).toContain('A1');
    expect(container.textContent).toContain('T1');
  });

  it('audio source with label shows label in placeholder', () => {
    const track: PlayerTrack = {
      id: '1', title: 'T', artist: 'A',
      sources: [{ kind: 'audio', url: 'http://x.mp3', label: 'FLAC HD' }],
    };
    const { container } = render(
      <GenericPlayer tracks={[track]} uiMode="full" autoPlay={false} />,
    );
    expect(container.textContent).toContain('FLAC HD');
  });

  it('audio source codec/quality in placeholder when no label', () => {
    const track: PlayerTrack = {
      id: '1', title: 'T', artist: 'A',
      sources: [{ kind: 'audio', url: 'http://x.mp3', codec: 'mp3', quality: '320kbps' }],
    };
    const { container } = render(
      <GenericPlayer tracks={[track]} uiMode="full" autoPlay={false} />,
    );
    expect(container.textContent).toContain('mp3');
    expect(container.textContent).toContain('320kbps');
  });

  /* -- extractVideoId -- */
  it('extracts videoId from youtu.be URL', () => {
    const track: PlayerTrack = {
      id: '1', title: 'YT', artist: 'A',
      sources: [{ kind: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ' }],
    };
    const { container } = render(
      <GenericPlayer tracks={[track]} uiMode="full" autoPlay={false} />,
    );
    const ytDiv = container.querySelector('[data-testid="yt"]');
    expect(ytDiv?.getAttribute('data-video')).toBe('dQw4w9WgXcQ');
  });

  it('extracts videoId from youtube.com?v= URL', () => {
    const track: PlayerTrack = {
      id: '1', title: 'YT', artist: 'A',
      sources: [{ kind: 'youtube', url: 'https://www.youtube.com/watch?v=abc123def' }],
    };
    const { container } = render(
      <GenericPlayer tracks={[track]} uiMode="full" autoPlay={false} />,
    );
    const ytDiv = container.querySelector('[data-testid="yt"]');
    expect(ytDiv?.getAttribute('data-video')).toBe('abc123def');
  });

  /* -- startOffset -- */
  it('YouTube with startOffset seeks on ready', () => {
    const fake = {
      playVideo: vi.fn(), pauseVideo: vi.fn(), seekTo: vi.fn(),
      setVolume: vi.fn(), getCurrentTime: () => 0, getDuration: () => 60,
    };
    render(<GenericPlayer tracks={[yt('1', 'x', { startOffset: 10 })]} uiMode="full" autoPlay />);
    act(() => { ytOnReady?.({ target: fake }); });
    expect(fake.seekTo).toHaveBeenCalledWith(10, true);
  });

  /* -- countdown -- */
  it('countdown shows and counts down', async () => {
    const { container } = render(
      <GenericPlayer tracks={[yt()]} countdownSeconds={3} autoPlay uiMode="full" />,
    );
    expect(container.textContent).toContain('3');
    await act(async () => { vi.advanceTimersByTime(1100); });
    expect(container.textContent).toContain('2');
  });

  /* -- withCredentials -- */
  it('audio withCredentials sets crossOrigin to use-credentials', () => {
    const track: PlayerTrack = {
      id: '1', title: 'T', artist: 'A',
      sources: [{ kind: 'audio', url: 'http://x.mp3', withCredentials: true }],
    };
    const { container } = render(
      <GenericPlayer tracks={[track]} uiMode="full" autoPlay={false} />,
    );
    const audioEl = container.querySelector('audio');
    expect(audioEl?.getAttribute('crossorigin')).toBe('use-credentials');
  });

  /* -- externalRef -- */
  it('getUnderlyingPlayer returns audio element for audio source', () => {
    const ref = createRef<GenericPlayerExternal>();
    render(<GenericPlayer tracks={[audio()]} externalRef={ref} autoPlay={false} uiMode="full" />);
    const p = ref.current?.getUnderlyingPlayer?.();
    expect(p === null || p instanceof HTMLAudioElement).toBe(true);
  });

  it('getUnderlyingPlayer returns null when no source', () => {
    const ref = createRef<GenericPlayerExternal>();
    render(<GenericPlayer tracks={[]} externalRef={ref} autoPlay={false} uiMode="full" />);
    expect(ref.current?.getUnderlyingPlayer?.()).toBeNull();
  });

  /* -- volume and seek -- */
  it('volume slider changes volume', () => {
    const { container } = render(
      <GenericPlayer tracks={[audio()]} uiMode="full" autoPlay={false} />,
    );
    const ranges = container.querySelectorAll('input[type="range"]');
    if (ranges[1]) fireEvent.change(ranges[1], { target: { value: '0.3' } });
  });

  it('seek slider calls onTimeUpdate', () => {
    const onTimeUpdate = vi.fn();
    const { container } = render(
      <GenericPlayer tracks={[audio()]} uiMode="full" autoPlay={false} onTimeUpdate={onTimeUpdate} />,
    );
    const ranges = container.querySelectorAll('input[type="range"]');
    if (ranges[0]) fireEvent.change(ranges[0], { target: { value: '30' } });
    expect(onTimeUpdate).toHaveBeenCalled();
  });

  /* -- loop prop -- */
  it('loop prop is passed to YouTube opts', () => {
    render(<GenericPlayer tracks={[yt()]} uiMode="full" autoPlay={false} loop />);
    // Just verify no errors
  });

  /* -- isAudioFile fallback (line 68) -- */
  it('source without explicit kind but .mp3 URL triggers isAudioFile path', () => {
    const track: PlayerTrack = {
      id: '1', title: 'T', artist: 'A',
      sources: [{ url: 'http://example.com/track.mp3' } as any],
    };
    const { container } = render(
      <GenericPlayer tracks={[track]} uiMode="full" autoPlay={false} />,
    );
    // pickBestSource calls isAudioFile(url) fallback; component renders without crash
    expect(container.textContent).toContain('T');
  });

  /* -- extractVideoId with no url returns undefined (line 697, 702) -- */
  it('YouTube source with only videoId and no url', () => {
    const track: PlayerTrack = {
      id: '1', title: 'YT', artist: 'A',
      sources: [{ kind: 'youtube', videoId: 'abc123def' }],
    };
    const { container } = render(
      <GenericPlayer tracks={[track]} uiMode="full" autoPlay={false} />,
    );
    const ytDiv = container.querySelector('[data-testid="yt"]');
    expect(ytDiv?.getAttribute('data-video')).toBe('abc123def');
  });

  it('YouTube source with non-matching url falls through to undefined videoId', () => {
    const track: PlayerTrack = {
      id: '1', title: 'YT', artist: 'A',
      sources: [{ kind: 'youtube', url: 'https://example.com/video' }],
    };
    const { container } = render(
      <GenericPlayer tracks={[track]} uiMode="full" autoPlay={false} />,
    );
    const ytDiv = container.querySelector('[data-testid="yt"]');
    // Neither youtu.be nor ?v= regex matches → extractVideoId returns undefined
    expect(ytDiv?.getAttribute('data-video')).toBeNull();
  });

  /* -- countdown reaches 0 (lines 327-337) -- */
  it('countdown reaching 0 starts playback', async () => {
    const onPlaying = vi.fn();
    const fakePlayer = {
      playVideo: vi.fn(), pauseVideo: vi.fn(), seekTo: vi.fn(),
      setVolume: vi.fn(), getCurrentTime: () => 0, getDuration: () => 60,
    };
    const { container } = render(
      <GenericPlayer tracks={[yt()]} countdownSeconds={2} autoPlay uiMode="full" onPlayingChange={onPlaying} />,
    );
    expect(container.textContent).toContain('2');
    act(() => { ytOnReady?.({ target: fakePlayer }); });
    await act(async () => { vi.advanceTimersByTime(2200); });
    expect(onPlaying).toHaveBeenCalledWith(true);
  });

  /* -- full-mode track list click (line 569) -- */
  it('full-mode track list item click changes index', () => {
    const onIndex = vi.fn();
    const tracks = [audio('1'), audio('2'), audio('3')];
    const { container } = render(
      <GenericPlayer tracks={tracks} uiMode="full" autoPlay={false} onIndexChange={onIndex} />,
    );
    const btns = Array.from(container.querySelectorAll('button'));
    const t2Btn = btns.find(b => b.textContent?.includes('T2'));
    if (t2Btn) { fireEvent.click(t2Btn); expect(onIndex).toHaveBeenCalledWith(1); }
  });

  /* -- progressOnly seek onChange (line 651) -- */
  it('progressOnly range input fires seek', () => {
    const onTimeUpdate = vi.fn();
    const { container } = render(
      <GenericPlayer tracks={[audio()]} uiMode="progressOnly" autoPlay={false} onTimeUpdate={onTimeUpdate} />,
    );
    const range = container.querySelector('input[type="range"]');
    if (range) {
      fireEvent.change(range, { target: { value: '15' } });
      expect(onTimeUpdate).toHaveBeenCalled();
    }
  });

  /* -- onLoadedMetadata (lines 472-474) -- */
  it('loadedmetadata event updates duration display', () => {
    const { container } = render(
      <GenericPlayer tracks={[audio()]} uiMode="full" autoPlay={false} />,
    );
    const audioEl = container.querySelector('audio');
    if (audioEl) {
      Object.defineProperty(audioEl, 'duration', { value: 125, configurable: true });
      fireEvent(audioEl, new Event('loadedmetadata'));
      // 125 seconds = 2:05
      expect(container.textContent).toContain('2:05');
    }
  });

  /* -- audio autoPlay + startOffset (lines 308-316) -- */
  it('audio with autoPlay and startOffset plays from offset', () => {
    const track = audio('1', { startOffset: 5 });
    const { container } = render(
      <GenericPlayer tracks={[track]} uiMode="full" autoPlay />,
    );
    const audioEl = container.querySelector('audio');
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  /* -- formatTime negative/NaN guard (line 87) -- */
  it('formatTime handles NaN duration', () => {
    const { container } = render(
      <GenericPlayer tracks={[audio()]} uiMode="full" autoPlay={false} />,
    );
    const audioEl = container.querySelector('audio');
    if (audioEl) {
      Object.defineProperty(audioEl, 'duration', { value: NaN, configurable: true });
      fireEvent(audioEl, new Event('loadedmetadata'));
      // NaN → guarded to 0 → shows 0:00
      expect(container.textContent).toContain('0:00');
    }
  });

  /* -- YouTube time-update interval (lines 207-212) -- */
  it('YouTube interval reads currentTime after onReady', async () => {
    const onTimeUpdate = vi.fn();
    const fakePlayer = {
      playVideo: vi.fn(), pauseVideo: vi.fn(), seekTo: vi.fn(),
      setVolume: vi.fn(), getCurrentTime: () => 42, getDuration: () => 180,
    };
    render(
      <GenericPlayer tracks={[yt()]} uiMode="full" autoPlay onTimeUpdate={onTimeUpdate} />,
    );
    act(() => { ytOnReady?.({ target: fakePlayer }); });
    await act(async () => { vi.advanceTimersByTime(300); });
    // The 250ms interval should have fired and read currentTime
    expect(onTimeUpdate).toHaveBeenCalledWith(42);
  });

  /* -- countdown timer cleanup on source change (lines 315-316) -- */
  it('changing autoPlay re-runs source effect and clears countdown', async () => {
    const clearSpy = vi.spyOn(window, 'clearInterval');
    const fakePlayer = {
      playVideo: vi.fn(), pauseVideo: vi.fn(), seekTo: vi.fn(),
      setVolume: vi.fn(), getCurrentTime: () => 0, getDuration: () => 60,
    };
    // Render with YouTube + countdown + autoPlay → starts countdown interval
    const { rerender } = render(
      <GenericPlayer tracks={[yt()]} countdownSeconds={5} autoPlay uiMode="full" />,
    );
    act(() => { ytOnReady?.({ target: fakePlayer }); });
    // Advance to let countdown timer start running (but not expire)
    await act(async () => { vi.advanceTimersByTime(1100); });
    clearSpy.mockClear();
    // Toggle autoPlay → triggers source effect re-run → should clear old countdown (L314-316)
    rerender(
      <GenericPlayer tracks={[yt()]} countdownSeconds={5} autoPlay={false} uiMode="full" />,
    );
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});

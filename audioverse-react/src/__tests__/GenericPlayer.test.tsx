import React, { createRef } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import GenericPlayer, { GenericPlayerExternal } from '../components/controls/player/GenericPlayer';

describe('GenericPlayer basic behaviors', () => {
  beforeEach(() => {
    // stub play/pause on HTMLMediaElement to avoid DOM errors
    // @ts-ignore
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    // @ts-ignore
    HTMLMediaElement.prototype.pause = vi.fn();
  });

  test('externalRef play/pause/seekTo/setVolume work', async () => {
    const tracks = [{ id: '1', title: 'T1', artist: 'A1', sources: [{ kind: 'audio', url: 'http://a.mp3' }] }];
    const ref = createRef<GenericPlayerExternal>();
    const onPlayingChange = vi.fn();
    const onTimeUpdate = vi.fn();

    const { getByText } = render(
      <GenericPlayer tracks={tracks} autoPlay={false} externalRef={ref} onPlayingChange={onPlayingChange} onTimeUpdate={onTimeUpdate} uiMode="full" />
    );

    // external ref should expose methods
    expect(ref.current).toBeTruthy();
    act(() => { ref.current?.play(); });
    await waitFor(() => expect(onPlayingChange).toHaveBeenCalledWith(true));
    act(() => { ref.current?.pause(); });
    await waitFor(() => expect(onPlayingChange).toHaveBeenCalledWith(false));

    // seekTo should call onTimeUpdate
    act(() => { ref.current?.seekTo(12); });
    expect(onTimeUpdate).toHaveBeenCalled();

    // setVolume should not throw
    act(() => { ref.current?.setVolume(0.5); });
  });

  test('controls next/prev and toggle work', async () => {
    const tracks = [
      { id: '1', title: 'T1', artist: 'A1', sources: [{ kind: 'audio', url: 'http://a.mp3' }] },
      { id: '2', title: 'T2', artist: 'A2', sources: [{ kind: 'audio', url: 'http://b.mp3' }] },
    ];
    const onIndexChange = vi.fn();
    const { getByText, getAllByTitle } = render(<GenericPlayer tracks={tracks} autoPlay={false} onIndexChange={onIndexChange} uiMode="full" />);

    // find prev/next buttons by title attributes (i18n keys in test env)
    const prevBtn = getAllByTitle('player.previousTrack')[0];
    const toggleBtn = getAllByTitle('player.play')[0];
    const nextBtn = getAllByTitle('player.nextTrack')[0];

    // prev disabled initially
    expect((prevBtn as HTMLButtonElement).disabled).toBeTruthy();
    // toggle -> play
    fireEvent.click(toggleBtn);
    // now next should work
    fireEvent.click(nextBtn);
    await waitFor(() => expect(onIndexChange).toHaveBeenCalled());
  });
});

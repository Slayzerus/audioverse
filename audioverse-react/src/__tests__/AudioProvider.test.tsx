/**
 * Tests for AudioProvider + useAudioContext
 * Covers: AudioProvider component (line 9), device enumeration, error branch, useAudioContext
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, waitFor, act, renderHook } from '@testing-library/react';
import { AudioProvider, useAudioContext } from '../contexts/AudioContext';

describe('AudioProvider', () => {
  const baseMd = () => ({
    enumerateDevices: vi.fn().mockResolvedValue([]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });

  beforeEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', { value: baseMd(), configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children and provides audioInputs', async () => {
    const fakeMic = {
      deviceId: 'mic-1',
      kind: 'audioinput',
      label: 'Test Mic',
      groupId: 'g1',
      toJSON: () => ({}),
    } as MediaDeviceInfo;

    const md = {
      enumerateDevices: vi.fn().mockResolvedValue([fakeMic]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, 'mediaDevices', { value: md, configurable: true });

    let ctx: any;
    const Consumer = () => {
      ctx = useAudioContext();
      return <div>{ctx.audioInputs.length}</div>;
    };

    const { container } = render(
      <AudioProvider>
        <Consumer />
      </AudioProvider>,
    );

    await waitFor(() => {
      expect(container.textContent).toBe('1');
    });
    expect(ctx.audioInputs[0].deviceId).toBe('mic-1');
  });

  it('filters out default and communications devices', async () => {
    const devices = [
      { deviceId: 'default', kind: 'audioinput', label: 'Default', groupId: 'g', toJSON: () => ({}) },
      { deviceId: 'communications', kind: 'audioinput', label: 'Comms', groupId: 'g', toJSON: () => ({}) },
      { deviceId: 'real-mic', kind: 'audioinput', label: 'Real Mic', groupId: 'g', toJSON: () => ({}) },
      { deviceId: 'speaker', kind: 'audiooutput', label: 'Speaker', groupId: 'g', toJSON: () => ({}) },
    ] as MediaDeviceInfo[];

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        enumerateDevices: vi.fn().mockResolvedValue(devices),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
    });

    let ctx: any;
    const Consumer = () => {
      ctx = useAudioContext();
      return <div>{ctx.audioInputs.length}</div>;
    };

    const { container } = render(
      <AudioProvider>
        <Consumer />
      </AudioProvider>,
    );

    await waitFor(() => expect(container.textContent).toBe('1'));
    expect(ctx.audioInputs[0].deviceId).toBe('real-mic');
  });

  it('handles enumerateDevices error gracefully', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        enumerateDevices: vi.fn().mockRejectedValue(new Error('Not allowed')),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      configurable: true,
    });

    let ctx: any;
    const Consumer = () => {
      ctx = useAudioContext();
      return <div>{ctx.audioInputs.length}</div>;
    };

    const { container } = render(
      <AudioProvider>
        <Consumer />
      </AudioProvider>,
    );

    await waitFor(() => expect(container.textContent).toBe('0'));
  });

  it('registers and removes devicechange listener', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        enumerateDevices: vi.fn().mockResolvedValue([]),
        addEventListener,
        removeEventListener,
      },
      configurable: true,
    });

    const { unmount } = render(
      <AudioProvider>
        <div />
      </AudioProvider>,
    );

    expect(addEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function));
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function));
  });

  it('useAudioContext throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useAudioContext());
    }).toThrow('AudioContext not found');
  });
});

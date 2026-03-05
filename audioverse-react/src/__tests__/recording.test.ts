import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioRecorder } from '../scripts/recording';

// Provide local mocks for browser APIs used by AudioRecorder.
let origGetUserMedia: any;
let origMediaRecorder: any;
let origAudioContext: any;
let origRaf: any;
let origCancelRaf: any;

beforeEach(() => {
  origGetUserMedia = (navigator as any).mediaDevices?.getUserMedia;
  origMediaRecorder = (global as any).MediaRecorder;
  origAudioContext = (global as any).AudioContext;
  origRaf = (global as any).requestAnimationFrame;
  origCancelRaf = (global as any).cancelAnimationFrame;
});

afterEach(() => {
  if (origGetUserMedia) (navigator as any).mediaDevices.getUserMedia = origGetUserMedia;
  else if ((navigator as any).mediaDevices) delete (navigator as any).mediaDevices.getUserMedia;
  (global as any).MediaRecorder = origMediaRecorder;
  (global as any).AudioContext = origAudioContext;
  (global as any).requestAnimationFrame = origRaf;
  (global as any).cancelAnimationFrame = origCancelRaf;
  vi.restoreAllMocks();
});

describe('AudioRecorder', () => {
  it('starts recording, calls level callback, and returns blob on stop', async () => {
    // Mock getUserMedia -> returns fake stream
    const fakeTrack = { stop: vi.fn() };
    const fakeStream = { getTracks: () => [fakeTrack] } as any;
    (navigator as any).mediaDevices = { getUserMedia: vi.fn().mockResolvedValue(fakeStream) };

    // Mock AudioContext / analyser
    class FakeAnalyser {
      fftSize = 2048;
      getByteTimeDomainData(buf: Uint8Array) {
        // fill with midline values to produce near-zero rms
        for (let i = 0; i < buf.length; i++) buf[i] = 128;
      }
      disconnect() {}
    }

    class FakeAudioContext {
      createMediaStreamSource(_s: any) {
        return { connect: (_a: any) => {} };
      }
      createAnalyser() {
        return new FakeAnalyser();
      }
      close() { return Promise.resolve(); }
    }

    (global as any).AudioContext = FakeAudioContext;

    // RAF: run callbacks synchronously so monitor runs during test
    let rafCalled = false;
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      if (rafCalled) return 0;
      rafCalled = true;
      const id = setTimeout(() => cb(0), 0);
      return id;
    };
    (global as any).cancelAnimationFrame = (id: number) => { clearTimeout(id as unknown as number); };

    // Mock MediaRecorder
    class FakeMediaRecorder {
      mimeType = 'audio/webm';
      ondataavailable: ((e: any) => void) | null = null;
      onstop: (() => void) | null = null;
      constructor(_stream: any, _opts: any) {}
      start() {}
      stop() {
        // simulate available data then stop
        const blob = new Blob(['hello'], { type: 'audio/webm' });
        if (this.ondataavailable) this.ondataavailable({ data: blob });
        if (this.onstop) this.onstop();
      }
    }

    (global as any).MediaRecorder = FakeMediaRecorder;

    const levels: number[] = [];
    const rec = new AudioRecorder();

    await rec.startRecording({ onLevel: (l) => levels.push(l) });
    // allow one RAF tick to execute monitorLevel
    await new Promise((r) => setTimeout(r, 20));

    expect((navigator as any).mediaDevices.getUserMedia).toHaveBeenCalled();
    expect(rec.getStream()).toBeTruthy();

    const blob = await rec.stopRecording();
    expect(blob).toBeInstanceOf(Blob);
    // ensure tracks were stopped
    expect(fakeTrack.stop).toHaveBeenCalled();
    // level callback should have been called at least once
    expect(levels.length).toBeGreaterThanOrEqual(1);
  });

  it('ignores startRecording when already recording', async () => {
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as any;
    (navigator as any).mediaDevices = { getUserMedia: vi.fn().mockResolvedValue(fakeStream) };
    (global as any).AudioContext = class { createMediaStreamSource() { return { connect() {} }; } createAnalyser() { return { fftSize: 2048, getByteTimeDomainData() {}, disconnect() {} }; } close() { return Promise.resolve(); } };
    let rafCalled2 = false;
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      if (rafCalled2) return 0;
      rafCalled2 = true;
      const id = setTimeout(() => cb(0), 0);
      return id;
    };
    (global as any).cancelAnimationFrame = (id: number) => { clearTimeout(id as unknown as number); };
    (global as any).MediaRecorder = class { mimeType = 'audio/webm'; ondataavailable = null; onstop = null; start() {}; stop() { if (this.onstop) this.onstop(); } };

    const rec = new AudioRecorder();
    await rec.startRecording();
    // allow one RAF tick to execute monitorLevel
    await new Promise((r) => setTimeout(r, 20));
    // second start should be no-op and not call getUserMedia again
    await rec.startRecording();
    expect((navigator as any).mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    await rec.stopRecording();
  });

  it('cleanup cancels levelRaf when it is non-null (lines 91-92)', async () => {
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as any;
    (navigator as any).mediaDevices = { getUserMedia: vi.fn().mockResolvedValue(fakeStream) };
    (global as any).AudioContext = class {
      createMediaStreamSource() { return { connect() {} }; }
      createAnalyser() { return { fftSize: 2048, getByteTimeDomainData() {}, disconnect() {} }; }
      close() { return Promise.resolve(); }
    };
    // RAF returns non-zero id and NEVER fires callback → levelRaf stays truthy
    const mockCancel = vi.fn();
    (global as any).requestAnimationFrame = () => 42;
    (global as any).cancelAnimationFrame = mockCancel;
    (global as any).MediaRecorder = class {
      mimeType = 'audio/webm';
      ondataavailable: any = null;
      onstop: any = null;
      start() {}
      stop() { if (this.onstop) this.onstop(); }
    };

    const rec = new AudioRecorder();
    await rec.startRecording({ onLevel: () => {} });
    // Don't wait for RAF — levelRaf = 42 (truthy)
    const blob = await rec.stopRecording();
    expect(blob).toBeInstanceOf(Blob);
    expect(mockCancel).toHaveBeenCalledWith(42);
  });
});

/**
 * Deep tests for CrepeStreamClient
 * Covers: connectWs lifecycle, audio processing, reconnect, queue flush, message parsing
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Suppress console before any module load
vi.spyOn(console, 'info').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'debug').mockImplementation(() => {});

/* ---- Mock WebSocket ---- */
let wsInstances: any[] = [];
let autoOpen = true;

class MockWS {
  static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3;
  readyState = 0; binaryType = ''; url: string;
  onopen: any = null; onclose: any = null; onerror: any = null; onmessage: any = null;
  sent: any[] = []; _closed = false;

  constructor(url: string) {
    this.url = url;
    wsInstances.push(this);
    if (autoOpen) {
      setTimeout(() => { if (!this._closed) { this.readyState = 1; this.onopen?.({}); } }, 0);
    }
  }
  send(data: any) {
    if (this.readyState !== 1) throw new Error('not open');
    this.sent.push(data);
  }
  close() {
    this._closed = true;
    const prev = this.readyState;
    this.readyState = 3;
    if (prev !== 3) this.onclose?.({ code: 1000, wasClean: true, reason: '' });
  }
}

/* ---- Mock AudioContext ---- */
let audioProcessor: ((e: any) => void) | null = null;
const mockProc = { onaudioprocess: null as any, connect: vi.fn(), disconnect: vi.fn() };

function mockAudioCtx() {
  return {
    sampleRate: 48000, state: 'running', destination: {},
    createMediaStreamSource: vi.fn(() => ({ connect: vi.fn() })),
    createScriptProcessor: vi.fn(() => {
      return new Proxy(mockProc, {
        set(t, p, v) { (t as any)[p] = v; if (p === 'onaudioprocess') audioProcessor = v; return true; },
      });
    }),
    close: vi.fn(),
  };
}

function mockStream() {
  return {
    getAudioTracks: () => [{ label: 'mic', readyState: 'live', stop: vi.fn() }],
    getTracks: () => [{ stop: vi.fn() }],
  };
}

/* ---- global setup ---- */
const origWS = globalThis.WebSocket;
const origAC = (globalThis as any).AudioContext;

beforeEach(() => {
  wsInstances = []; audioProcessor = null; autoOpen = true;
  (globalThis as any).WebSocket = Object.assign(
    function (url: string) { return new MockWS(url); } as any,
    { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 },
  );
  (globalThis as any).AudioContext = vi.fn(mockAudioCtx);
  if (!navigator.mediaDevices) (navigator as any).mediaDevices = {};
  (navigator as any).mediaDevices.getUserMedia = vi.fn(async () => mockStream());
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  globalThis.WebSocket = origWS;
  if (origAC) (globalThis as any).AudioContext = origAC;
});

/* helper: fire audio event */
const fireAudio = (samples = 12000, value = 0.5) => {
  audioProcessor!({ inputBuffer: { getChannelData: () => new Float32Array(samples).fill(value) } });
};

describe('CrepeStreamClient deep', () => {
  let CrepeStreamClient: any, startCrepeMicStream: any;
  beforeEach(async () => {
    const mod = await import('../utils/crepeStreaming');
    CrepeStreamClient = mod.CrepeStreamClient;
    startCrepeMicStream = mod.startCrepeMicStream;
  });

  it('start() opens WS, calls onOpen, sets up audio', async () => {
    const onOpen = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', onOpen });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    expect(wsInstances.length).toBe(1);
    expect(onOpen).toHaveBeenCalled();
    expect(audioProcessor).toBeTypeOf('function');
    c.stop();
  });

  it('audio processing sends PCM chunks over WS', async () => {
    const onSend = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onSend });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    fireAudio(12000, 0.5);
    expect(wsInstances[0].sent.length).toBeGreaterThan(0);
    expect(onSend).toHaveBeenCalled();
    c.stop();
  });

  it('small audio input does not produce a chunk', async () => {
    const onSend = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onSend });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    fireAudio(10, 0.1); // too few samples
    expect(onSend).not.toHaveBeenCalled();
    c.stop();
  });

  it('queues chunks when WS is CONNECTING', async () => {
    autoOpen = false;
    const onSend = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onSend });
    await c.start();
    expect(wsInstances[0].readyState).toBe(0); // CONNECTING
    fireAudio(12000);
    expect(onSend).toHaveBeenCalledWith(0); // queued, 0 bytes
    c.stop();
  });

  it('flushes queued chunks on WS open', async () => {
    autoOpen = false;
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 200 });
    await c.start();
    fireAudio(12000);
    // now manually open
    const ws = wsInstances[0];
    ws.readyState = 1;
    ws.onopen?.({});
    expect(ws.sent.length).toBeGreaterThan(0);
    c.stop();
  });

  it('drops chunks when WS is CLOSED', async () => {
    autoOpen = false;
    const onSend = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onSend });
    await c.start();
    wsInstances[0].readyState = 3; // CLOSED
    fireAudio(12000);
    expect(onSend).toHaveBeenCalledWith(0);
    c.stop();
  });

  it('onMessage receives parsed JSON string messages', async () => {
    const onMessage = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', onMessage });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    wsInstances[0].onmessage?.({ data: JSON.stringify({ hz: 440, confidence: 0.9 }) });
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ hz: 440 }));
    c.stop();
  });

  it('onMessage handles binary ArrayBuffer data', async () => {
    const onMessage = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', onMessage });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    const buf = new TextEncoder().encode(JSON.stringify({ hz: 220 })).buffer;
    wsInstances[0].onmessage?.({ data: buf });
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ hz: 220 }));
    c.stop();
  });

  it('onError fires on invalid JSON message', async () => {
    const onError = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', onError });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    wsInstances[0].onmessage?.({ data: 'not json' });
    expect(onError).toHaveBeenCalled();
    c.stop();
  });

  it('onError fires on WS error event', async () => {
    const onError = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', onError });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    wsInstances[0].onerror?.(new Error('boom'));
    expect(onError).toHaveBeenCalled();
    c.stop();
  });

  it('onClose fires and WS is cleaned up', async () => {
    const onClose = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', onClose });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    wsInstances[0].readyState = 3;
    wsInstances[0].onclose?.({ code: 1006, wasClean: false, reason: 'gone' });
    expect(onClose).toHaveBeenCalled();
    c.stop();
  });

  it('auto-reconnects after unexpected close', async () => {
    const c = new CrepeStreamClient({ wsUrl: 'ws://test' });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    // Simulate unexpected close
    wsInstances[0].readyState = 3;
    wsInstances[0].onclose?.({ code: 1006, wasClean: false, reason: '' });
    await vi.advanceTimersByTimeAsync(500);
    expect(wsInstances.length).toBe(2); // reconnected
    c.stop();
  });

  it('does not reconnect after intentional stop()', async () => {
    const c = new CrepeStreamClient({ wsUrl: 'ws://test' });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    c.stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(wsInstances.length).toBe(1); // no reconnect
  });

  it('startWithMediaStream() uses external stream, does not request mic', async () => {
    const c = new CrepeStreamClient({ wsUrl: 'ws://test' });
    const stream = mockStream() as any;
    await c.startWithMediaStream(stream);
    await vi.advanceTimersByTimeAsync(10);
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    c.stop();
  });

  it('startWithMediaStream() audio processing works', async () => {
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 200 });
    await c.startWithMediaStream(mockStream() as any);
    await vi.advanceTimersByTimeAsync(10);
    fireAudio(12000);
    expect(wsInstances[0].sent.length).toBeGreaterThan(0);
    c.stop();
  });

  it('startCrepeMicStream creates and starts a client', async () => {
    const c = await startCrepeMicStream({ wsUrl: 'ws://test' });
    expect(c).toBeInstanceOf(CrepeStreamClient);
    c.stop();
  });

  it('audio processing with leftover resampling', async () => {
    // Use an odd chunkMs so there are leftover samples
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 150 });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    // 7000 samples at 48k, resample to 16k ≈ 2333 samples, chunk=2400 → leftover
    fireAudio(7000, 0.3);
    // Then send more to trigger actual chunk
    fireAudio(12000, 0.3);
    expect(wsInstances[0].sent.length).toBeGreaterThan(0);
    c.stop();
  });

  it('status log fires after 5 seconds of streaming', async () => {
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 200 });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    // Fire audio repeatedly over 6 seconds
    for (let i = 0; i < 6; i++) {
      vi.advanceTimersByTime(1000);
      if (audioProcessor) fireAudio(48000);
    }
    // Status log should have been triggered (just testing it doesn't error)
    c.stop();
  });

  /* ---- Additional coverage: resample same-rate, idempotent start, max reconnect ---- */

  it('resampleLinear short-circuits when srcRate === dstRate (line 17)', async () => {
    // Override AudioContext to return sampleRate matching targetRate (16000)
    function MockAC(this: any) {
      const base = mockAudioCtx();
      Object.assign(this, base);
      this.sampleRate = 16000;
    }
    (globalThis as any).AudioContext = MockAC;
    const onSend = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onSend });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    // fire enough samples for a chunk; no resampling needed
    fireAudio(6400, 0.5); // 200ms at 16kHz = 3200 samples → need 6400+ for a chunk
    expect(onSend).toHaveBeenCalled();
    c.stop();
  });

  it('start() is idempotent — second call returns immediately (line 142)', async () => {
    const c = new CrepeStreamClient({ wsUrl: 'ws://test' });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    expect(wsInstances.length).toBe(1);
    // second start should be no-op
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    expect(wsInstances.length).toBe(1); // still just one WS
    c.stop();
  });

  it('max reconnect attempts exhausted stops audio processing (lines 115-116)', async () => {
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', maxReconnectAttempts: 3 });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    // Simulate reconnect failures beyond maxReconnectAttempts
    for (let i = 0; i < 5; i++) {
      const ws = wsInstances[wsInstances.length - 1];
      ws.readyState = 3;
      ws.onclose?.({ code: 1006, wasClean: false, reason: '' });
      await vi.advanceTimersByTimeAsync(2000);
    }
    // After exceeding max, should stop creating new WS
    const finalCount = wsInstances.length;
    await vi.advanceTimersByTimeAsync(5000);
    expect(wsInstances.length).toBe(finalCount);
    c.stop();
  });

  it('queue flush send() error triggers onError (line 88)', async () => {
    autoOpen = false;
    const onError = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onError });
    await c.start();
    // Queue a chunk while CONNECTING
    fireAudio(12000);
    // Make send throw, then open
    const ws = wsInstances[0];
    ws.send = () => { throw new Error('send fail'); };
    ws.readyState = 1;
    ws.onopen?.({});
    expect(onError).toHaveBeenCalled();
    c.stop();
  });

  it('startWithMediaStream queues when WS CONNECTING (lines 252-254)', async () => {
    autoOpen = false;
    const onSend = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onSend });
    await c.startWithMediaStream(mockStream() as any);
    expect(wsInstances[0].readyState).toBe(0);
    fireAudio(12000);
    expect(onSend).toHaveBeenCalledWith(0); // queued
    c.stop();
  });

  it('startWithMediaStream drops when WS CLOSED (lines 255-258)', async () => {
    autoOpen = false;
    const onSend = vi.fn();
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onSend });
    await c.startWithMediaStream(mockStream() as any);
    wsInstances[0].readyState = 3;
    fireAudio(12000);
    expect(onSend).toHaveBeenCalledWith(0); // dropped
    c.stop();
  });

  it('startWithMediaStream leftover resampling (lines 269-274)', async () => {
    const c = new CrepeStreamClient({ wsUrl: 'ws://test', chunkMs: 150 });
    await c.startWithMediaStream(mockStream() as any);
    await vi.advanceTimersByTimeAsync(10);
    // 7000 samples at 48k → ~2333 at 16k, chunk=2400 → leftover
    fireAudio(7000, 0.3);
    // Send more to flush leftover + enough for a complete chunk
    fireAudio(12000, 0.3);
    expect(wsInstances[0].sent.length).toBeGreaterThan(0);
    c.stop();
  });
});

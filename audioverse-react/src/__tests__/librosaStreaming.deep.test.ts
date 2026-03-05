/**
 * Deep tests for LibrosaStreamClient
 * Covers: connectWs, start(), startWithMediaStream(), stop(), onMessage, onError,
 *         audio processing, reconnect, queue flush, drops.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
    createScriptProcessor: vi.fn(() =>
      new Proxy(mockProc, {
        set(t, p, v) { (t as any)[p] = v; if (p === 'onaudioprocess') audioProcessor = v; return true; },
      }),
    ),
    close: vi.fn(),
  };
}

function mockStream() {
  return {
    getAudioTracks: () => [{ label: 'mic', readyState: 'live', stop: vi.fn() }],
    getTracks: () => [{ stop: vi.fn() }],
  };
}

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

const fireAudio = (n = 12000, v = 0.5) => {
  audioProcessor!({ inputBuffer: { getChannelData: () => new Float32Array(n).fill(v) } });
};

describe('LibrosaStreamClient deep', () => {
  let LibrosaStreamClient: any, startLibrosaMicStream: any;
  beforeEach(async () => {
    const mod = await import('../utils/librosaStreaming');
    LibrosaStreamClient = mod.LibrosaStreamClient;
    startLibrosaMicStream = mod.startLibrosaMicStream;
  });

  it('start() opens WS and sets up audio', async () => {
    const onOpen = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', onOpen });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    expect(wsInstances.length).toBe(1);
    expect(onOpen).toHaveBeenCalled();
    expect(audioProcessor).toBeTypeOf('function');
    c.stop();
  });

  it('start() is idempotent', async () => {
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test' });
    await c.start();
    await c.start();
    expect(wsInstances.length).toBe(1);
    c.stop();
  });

  it('audio processing sends PCM', async () => {
    const onSend = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 100, onSend });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    fireAudio(12000);
    expect(wsInstances[0].sent.length).toBeGreaterThan(0);
    expect(onSend).toHaveBeenCalled();
    c.stop();
  });

  it('small input produces no chunk', async () => {
    const onSend = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 100, onSend });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    fireAudio(10);
    expect(onSend).not.toHaveBeenCalled();
    c.stop();
  });

  it('queues when WS CONNECTING', async () => {
    autoOpen = false;
    const onSend = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 100, onSend });
    await c.start();
    fireAudio(12000);
    expect(onSend).toHaveBeenCalledWith(0);
    c.stop();
  });

  it('flushes queue on WS open', async () => {
    autoOpen = false;
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 100 });
    await c.start();
    fireAudio(12000);
    const ws = wsInstances[0];
    ws.readyState = 1;
    ws.onopen?.({});
    expect(ws.sent.length).toBeGreaterThan(0);
    c.stop();
  });

  it('drops when WS CLOSED', async () => {
    autoOpen = false;
    const onSend = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 100, onSend });
    await c.start();
    wsInstances[0].readyState = 3;
    fireAudio(12000);
    expect(onSend).toHaveBeenCalledWith(0);
    c.stop();
  });

  it('onMessage parses JSON string', async () => {
    const onMessage = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', onMessage });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    wsInstances[0].onmessage?.({ data: JSON.stringify({ hz: 440, confidence: 0.95 }) });
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ hz: 440 }));
    c.stop();
  });

  it('onMessage handles ArrayBuffer', async () => {
    const onMessage = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', onMessage });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    const buf = new TextEncoder().encode(JSON.stringify({ hz: 220 })).buffer;
    wsInstances[0].onmessage?.({ data: buf });
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ hz: 220 }));
    c.stop();
  });

  it('onError fires on bad JSON', async () => {
    const onError = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', onError });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    wsInstances[0].onmessage?.({ data: 'bad' });
    expect(onError).toHaveBeenCalled();
    c.stop();
  });

  it('onError fires on WS error event', async () => {
    const onError = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', onError });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    wsInstances[0].onerror?.(new Error('network'));
    expect(onError).toHaveBeenCalled();
    c.stop();
  });

  it('onClose fires', async () => {
    const onClose = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', onClose });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    wsInstances[0].readyState = 3;
    wsInstances[0].onclose?.({ code: 1006, wasClean: false, reason: '' });
    expect(onClose).toHaveBeenCalled();
    c.stop();
  });

  it('auto-reconnects on unexpected close', async () => {
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test' });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    wsInstances[0].readyState = 3;
    wsInstances[0].onclose?.({ code: 1006, wasClean: false, reason: '' });
    await vi.advanceTimersByTimeAsync(500);
    expect(wsInstances.length).toBe(2);
    c.stop();
  });

  it('no reconnect after intentional stop()', async () => {
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test' });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    c.stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(wsInstances.length).toBe(1);
  });

  it('startWithMediaStream() uses external stream', async () => {
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test' });
    await c.startWithMediaStream(mockStream() as any);
    await vi.advanceTimersByTimeAsync(10);
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    c.stop();
  });

  it('startWithMediaStream() audio processing works', async () => {
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 100 });
    await c.startWithMediaStream(mockStream() as any);
    await vi.advanceTimersByTimeAsync(10);
    fireAudio(12000);
    expect(wsInstances[0].sent.length).toBeGreaterThan(0);
    c.stop();
  });

  it('startWithMediaStream() is idempotent', async () => {
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test' });
    await c.startWithMediaStream(mockStream() as any);
    await c.startWithMediaStream(mockStream() as any);
    expect(wsInstances.length).toBe(1);
    c.stop();
  });

  it('startWithMediaStream() throws after close', async () => {
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test' });
    c.stop();
    await expect(c.startWithMediaStream({} as any)).rejects.toThrow('client closed');
  });

  it('startLibrosaMicStream creates and starts', async () => {
    const c = await startLibrosaMicStream({ wsUrl: 'ws://test' });
    expect(c).toBeInstanceOf(LibrosaStreamClient);
    c.stop();
  });

  it('audio leftover resampling path', async () => {
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 150 });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    fireAudio(7000);
    fireAudio(12000);
    expect(wsInstances[0].sent.length).toBeGreaterThan(0);
    c.stop();
  });

  /* ---- Additional coverage ---- */

  it('resampleLinear same-rate returns slice (line 18)', async () => {
    function MockAC(this: any) {
      const base = mockAudioCtx();
      Object.assign(this, base);
      this.sampleRate = 16000;
    }
    (globalThis as any).AudioContext = MockAC;
    const onSend = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onSend });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    fireAudio(6400, 0.5);
    expect(onSend).toHaveBeenCalled();
    c.stop();
  });

  it('max reconnect exhaustion stops reconnecting (line 99)', async () => {
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', maxReconnectAttempts: 3 });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    for (let i = 0; i < 5; i++) {
      const ws = wsInstances[wsInstances.length - 1];
      ws.readyState = 3;
      ws.onclose?.({ code: 1006, wasClean: false, reason: '' });
      await vi.advanceTimersByTimeAsync(2000);
    }
    const finalCount = wsInstances.length;
    await vi.advanceTimersByTimeAsync(5000);
    expect(wsInstances.length).toBe(finalCount);
    c.stop();
  });

  it('queue flush send() error triggers onError (line 76)', async () => {
    autoOpen = false;
    const onError = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onError });
    await c.start();
    fireAudio(12000);
    const ws = wsInstances[0];
    ws.send = () => { throw new Error('send fail'); };
    ws.readyState = 1;
    ws.onopen?.({});
    expect(onError).toHaveBeenCalled();
    c.stop();
  });

  it('start() send error in main loop triggers onError (line 165)', async () => {
    const onError = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onError });
    await c.start();
    await vi.advanceTimersByTimeAsync(10);
    // Make send throw after WS is open
    wsInstances[0].send = () => { throw new Error('mid-stream fail'); };
    fireAudio(12000);
    expect(onError).toHaveBeenCalled();
    c.stop();
  });

  it('startWithMediaStream queues when WS CONNECTING (lines 231-234)', async () => {
    autoOpen = false;
    const onSend = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onSend });
    await c.startWithMediaStream(mockStream() as any);
    fireAudio(12000);
    expect(onSend).toHaveBeenCalledWith(0);
    c.stop();
  });

  it('startWithMediaStream drops when WS CLOSED (lines 235-237)', async () => {
    autoOpen = false;
    const onSend = vi.fn();
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 200, onSend });
    await c.startWithMediaStream(mockStream() as any);
    wsInstances[0].readyState = 3;
    fireAudio(12000);
    expect(onSend).toHaveBeenCalledWith(0);
    c.stop();
  });

  it('startWithMediaStream leftover resampling (lines 241-246)', async () => {
    const c = new LibrosaStreamClient({ wsUrl: 'ws://test', chunkMs: 150 });
    await c.startWithMediaStream(mockStream() as any);
    await vi.advanceTimersByTimeAsync(10);
    fireAudio(7000, 0.3);
    fireAudio(12000, 0.3);
    expect(wsInstances[0].sent.length).toBeGreaterThan(0);
    c.stop();
  });
});

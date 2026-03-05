import { vi, describe, it, expect, beforeEach } from 'vitest';

// --- Mock WebSocket ---
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = MockWebSocket.CONNECTING;
  binaryType = '';
  onopen: any = null;
  onclose: any = null;
  onerror: any = null;
  onmessage: any = null;
  sent: any[] = [];
  url: string;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 5);
  }

  send(data: any) { this.sent.push(data); }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: 1000, wasClean: true, reason: '' });
  }
}

(globalThis as any).WebSocket = MockWebSocket;

// Suppress console noise
vi.spyOn(console, 'info').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'debug').mockImplementation(() => {});

describe('librosaStreaming', () => {
  let mod: typeof import('../utils/librosaStreaming');
  beforeEach(async () => {
    mod = await import('../utils/librosaStreaming');
  });

  it('LibrosaStreamClient can be instantiated', () => {
    const client = new mod.LibrosaStreamClient({ wsUrl: 'ws://localhost:1234' });
    expect(client).toBeTruthy();
  });

  it('stop works without start', () => {
    const client = new mod.LibrosaStreamClient({ wsUrl: 'ws://localhost:1234' });
    expect(() => client.stop()).not.toThrow();
  });

  it('start after stop throws', async () => {
    const client = new mod.LibrosaStreamClient({ wsUrl: 'ws://localhost:1234' });
    client.stop();
    await expect(client.start()).rejects.toThrow('client closed');
  });

  it('startWithMediaStream after stop throws', async () => {
    const client = new mod.LibrosaStreamClient({ wsUrl: 'ws://localhost:1234' });
    client.stop();
    await expect(client.startWithMediaStream({} as any)).rejects.toThrow('client closed');
  });

  it('startLibrosaMicStream is exported as a function', () => {
    expect(mod.startLibrosaMicStream).toBeTypeOf('function');
  });

  it('exports correct types', () => {
    expect(mod.LibrosaStreamClient).toBeTruthy();
  });
});

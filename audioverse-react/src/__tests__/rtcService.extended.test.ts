import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RTCService } from '../services/rtcService';

// Helper: inject a fake connection object
function injectConn(s: RTCService) {
  const calls: any[] = [];
  const conn = {
    on: (ev: string, h: any) => calls.push(['on', ev, h]),
    off: (...args: any[]) => calls.push(['off', ...args]),
    invoke: vi.fn(async (m: string, ...args: any[]) => {
      if (m === 'GetServerTime') return new Date().toISOString();
      return `result:${m}`;
    }),
    state: 'Connected',
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
  } as any;
  (s as any).connection = conn;
  return { conn, calls };
}

describe('RTCService — extended coverage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('isConnected returns false when no connection', () => {
    const s = new RTCService();
    expect(s.isConnected()).toBe(false);
  });

  it('isConnected returns true when connected', () => {
    const s = new RTCService();
    injectConn(s);
    expect(s.isConnected()).toBe(true);
  });

  it('disconnect stops and clears connection', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.disconnect();
    expect(conn.stop).toHaveBeenCalled();
    expect(s.isConnected()).toBe(false);
  });

  it('disconnect is safe when no connection', async () => {
    const s = new RTCService();
    await expect(s.disconnect()).resolves.toBeUndefined();
  });

  it('disconnect clears even if stop throws', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    conn.stop.mockRejectedValueOnce(new Error('stop fail'));
    await expect(s.disconnect()).rejects.toThrow();
    // connection should still be cleared (finally block)
    expect((s as any).connection).toBeUndefined();
  });

  it('joinLobby with channel sends 3 args', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.joinLobby(1, 'bob', 'channelA');
    expect(conn.invoke).toHaveBeenCalledWith('JoinLobby', 1, 'bob', 'channelA');
  });

  it('joinLobby without channel sends 2 args', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.joinLobby(1, 'bob');
    expect(conn.invoke).toHaveBeenCalledWith('JoinLobby', 1, 'bob');
  });

  it('leaveLobby with channel sends 2 args', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.leaveLobby(1, 'channelA');
    expect(conn.invoke).toHaveBeenCalledWith('LeaveLobby', 1, 'channelA');
  });

  it('leaveLobby without channel sends 1 arg', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.leaveLobby(1);
    expect(conn.invoke).toHaveBeenCalledWith('LeaveLobby', 1);
  });

  it('getLobbyMembers calls invoke', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.getLobbyMembers(42);
    expect(conn.invoke).toHaveBeenCalledWith('GetLobbyMembers', 42);
  });

  it('sendChatMessage calls invoke', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.sendChatMessage(1, 'alice', 'Hello!');
    expect(conn.invoke).toHaveBeenCalledWith('SendChatMessage', 1, 'alice', 'Hello!');
  });

  it('sendOffer calls invoke', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.sendOffer('conn1', { sdp: 'offer' });
    expect(conn.invoke).toHaveBeenCalledWith('SendOffer', 'conn1', { sdp: 'offer' });
  });

  it('sendAnswer calls invoke', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.sendAnswer('conn1', { sdp: 'answer' });
    expect(conn.invoke).toHaveBeenCalledWith('SendAnswer', 'conn1', { sdp: 'answer' });
  });

  it('sendIceCandidate calls invoke', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.sendIceCandidate('conn1', { candidate: 'c' });
    expect(conn.invoke).toHaveBeenCalledWith('SendIceCandidate', 'conn1', { candidate: 'c' });
  });

  it('startRound with metadata', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.startRound(1, 2, { songId: 5 });
    expect(conn.invoke).toHaveBeenCalledWith('StartRound', 1, 2, { songId: 5 });
  });

  it('startRound without metadata sends null', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.startRound(1, 2);
    expect(conn.invoke).toHaveBeenCalledWith('StartRound', 1, 2, null);
  });

  it('endRound with results', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.endRound(1, 2, { scores: [100] });
    expect(conn.invoke).toHaveBeenCalledWith('EndRound', 1, 2, { scores: [100] });
  });

  it('endRound without results sends null', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.endRound(1, 2);
    expect(conn.invoke).toHaveBeenCalledWith('EndRound', 1, 2, null);
  });

  it('updateScore calls invoke', async () => {
    const s = new RTCService();
    const { conn } = injectConn(s);
    await s.updateScore(1, 2, 95);
    expect(conn.invoke).toHaveBeenCalledWith('UpdateScore', 1, 2, 95);
  });

  it('onTimelineUpdate registers handler', () => {
    const s = new RTCService();
    const { calls } = injectConn(s);
    const handler = () => {};
    s.onTimelineUpdate(handler);
    expect(calls.some(c => c[0] === 'on' && c[1] === 'ReceiveTimelineUpdate')).toBe(true);
  });

  it('offTimelineUpdate unregisters handler', () => {
    const s = new RTCService();
    const { calls } = injectConn(s);
    const handler = () => {};
    s.offTimelineUpdate(handler);
    expect(calls.some(c => c[0] === 'off' && c[1] === 'ReceiveTimelineUpdate')).toBe(true);
  });

  it('offTimelineUpdate without handler', () => {
    const s = new RTCService();
    const { calls } = injectConn(s);
    s.offTimelineUpdate();
    expect(calls.some(c => c[0] === 'off' && c[1] === 'ReceiveTimelineUpdate')).toBe(true);
  });

  it('off does nothing when no connection', () => {
    const s = new RTCService();
    expect(() => s.off('SomeEvent')).not.toThrow();
  });

  it('off with handler delegates to connection.off', () => {
    const s = new RTCService();
    const { calls } = injectConn(s);
    const handler = () => {};
    s.off('Ev', handler);
    expect(calls.some(c => c[0] === 'off' && c[1] === 'Ev')).toBe(true);
  });

  it('getServerTime returns a string', async () => {
    const s = new RTCService();
    injectConn(s);
    const result = await s.getServerTime();
    expect(typeof result).toBe('string');
  });

  it('computeClockOffset throws when no connection', async () => {
    const s = new RTCService();
    await expect(s.computeClockOffset()).rejects.toThrow('RTC not connected');
  });

  it('computeClockOffset throws when all getServerTime calls fail', async () => {
    const s = new RTCService();
    injectConn(s);
    // Override getServerTime to always throw
    (s as any).getServerTime = vi.fn().mockRejectedValue(new Error('timeout'));
    await expect(s.computeClockOffset(2)).rejects.toThrow('Failed to compute clock offset');
  });

  it('rtcService singleton is exported', async () => {
    const mod = await import('../services/rtcService');
    expect(mod.rtcService).toBeInstanceOf(RTCService);
  });
});

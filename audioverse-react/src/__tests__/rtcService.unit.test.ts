import { RTCService } from '../services/rtcService';

describe('RTCService unit', () => {
  test('invoke throws when no connection', async () => {
    const s = new RTCService('/hubs/test');
    await expect(s.invoke('X')).rejects.toThrow('RTC connection is not established');
  });

  test('on/off delegate to connection and join/leaveLobby call invoke', async () => {
    const s = new RTCService('/hubs/test');
    // inject fake connection
    const calls: any[] = [];
    const conn = {
      on: (ev: string, h: any) => calls.push(['on', ev]),
      off: (ev?: string, h?: any) => calls.push(['off', ev]),
      invoke: async (m: string, ...args: any[]) => {
        calls.push(['invoke', m, args]);
        if (m === 'GetServerTime') return new Date().toISOString();
        return null;
      },
      state: 'Connected',
      start: async () => {},
      stop: async () => {},
    } as any;
    (s as any).connection = conn;

    s.on('Ev', () => {});
    s.off('Ev');
    await s.joinLobby(1, 'bob');
    await s.leaveLobby(1);
    await s.publishTimelineUpdate({ a: 1 });

    expect(calls.some(c => c[0] === 'on' && c[1] === 'Ev')).toBeTruthy();
    expect(calls.some(c => c[0] === 'off' && c[1] === 'Ev')).toBeTruthy();
    expect(calls.some(c => c[0] === 'invoke' && c[1] === 'JoinLobby')).toBeTruthy();
    expect(calls.some(c => c[0] === 'invoke' && c[1] === 'LeaveLobby')).toBeTruthy();
    expect(calls.some(c => c[0] === 'invoke' && c[1] === 'PublishTimelineUpdate')).toBeTruthy();
  });

  test('computeClockOffset returns numeric offset when getServerTime works', async () => {
    const s = new RTCService('/hubs/test');
    (s as any).connection = { state: 'Connected' } as any;
    // mock getServerTime to simulate server time 100ms ahead
    const base = Date.now();
    let calls = 0;
    (s as any).getServerTime = async () => {
      calls++;
      // return server time string equal to (client now + 100)
      return new Date(Date.now() + 100).toISOString();
    };
    // speed up by reducing attempts param
    const offset = await s.computeClockOffset(2);
    expect(typeof offset).toBe('number');
    // offset should be roughly ~100 (server ahead) but allow tolerance
    expect(Math.abs(offset - 100)).toBeLessThan(200);
  });
});

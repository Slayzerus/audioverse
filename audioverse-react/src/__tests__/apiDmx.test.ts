import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
  DMX_BASE: '/api/dmx',
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as dmx from '../scripts/api/apiDmx';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const put = apiClient.put as unknown as ReturnType<typeof vi.fn>;

describe('apiDmx low-level fetchers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetchDmxState returns data', async () => {
    get.mockResolvedValueOnce({ data: { portOpen: true } });
    const res = await dmx.fetchDmxState();
    expect(res.portOpen).toBe(true);
  });

  it('fetchFtdiDevices returns array', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 'd1' }] });
    const res = await dmx.fetchFtdiDevices();
    expect(res).toEqual([{ id: 'd1' }]);
  });

  it('postOpenDmxPort calls post', async () => {
    post.mockResolvedValueOnce({});
    await dmx.postOpenDmxPort('dev1');
    expect(post).toHaveBeenCalled();
  });

  it('postCloseDmxPort calls post', async () => {
    post.mockResolvedValueOnce({});
    await dmx.postCloseDmxPort();
    expect(post).toHaveBeenCalled();
  });

  it('postConfigureDmx calls post with fps and startCode', async () => {
    post.mockResolvedValueOnce({});
    await dmx.postConfigureDmx(40, 0);
    expect(post.mock.calls[0][1]).toEqual({ fps: 40, startCode: 0 });
  });

  it('putDmxChannel calls put with ch and value', async () => {
    put.mockResolvedValueOnce({});
    await dmx.putDmxChannel(5, 128);
    expect(put.mock.calls[0][1]).toEqual({ value: 128 });
  });

  it('putDmxUniverse rejects if not 512 values', async () => {
    await expect(dmx.putDmxUniverse([1, 2, 3])).rejects.toThrow('512');
  });

  it('putDmxUniverse sends 512-element array', async () => {
    put.mockResolvedValueOnce({});
    const arr = new Array(512).fill(0);
    await dmx.putDmxUniverse(arr);
    expect(put).toHaveBeenCalled();
    expect(put.mock.calls[0][1]).toHaveLength(512);
  });

  it('putDmxUniverse accepts Uint8Array', async () => {
    put.mockResolvedValueOnce({});
    const buf = new Uint8Array(512);
    await dmx.putDmxUniverse(buf);
    expect(put).toHaveBeenCalled();
  });

  it('postBlackout calls post', async () => {
    post.mockResolvedValueOnce({});
    await dmx.postBlackout();
    expect(post).toHaveBeenCalled();
  });

  it('DMX_QK keys are well-formed', () => {
    expect(dmx.DMX_QK.state).toEqual(['dmx', 'state']);
    expect(dmx.DMX_QK.devices).toEqual(['dmx', 'devices']);
  });
});

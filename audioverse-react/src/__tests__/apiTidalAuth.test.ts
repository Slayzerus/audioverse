import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as tidal from '../scripts/api/apiTidalAuth';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

describe('apiTidalAuth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetchTidalAuthorizeUrl builds query and returns data', async () => {
    get.mockResolvedValueOnce({ data: { url: 'https://tidal.com/auth' } });
    const res = await tidal.fetchTidalAuthorizeUrl({ redirectUri: 'http://localhost/cb' });
    expect(res.url).toBe('https://tidal.com/auth');
    expect(get).toHaveBeenCalled();
  });

  it('fetchTidalAuthorizeUrl includes optional params', async () => {
    get.mockResolvedValueOnce({ data: { url: 'u' } });
    await tidal.fetchTidalAuthorizeUrl({
      redirectUri: 'http://x',
      scopes: ['r_usr', 'w_usr'],
      state: 'st',
      codeChallenge: 'cc',
      codeChallengeMethod: 'S256',
    });
    const calledUrl = get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('redirectUri');
    expect(calledUrl).toContain('scopes');
    expect(calledUrl).toContain('state');
    expect(calledUrl).toContain('codeChallenge');
    expect(calledUrl).toContain('codeChallengeMethod');
  });

  it('getTidalCallback returns tokens', async () => {
    get.mockResolvedValueOnce({ data: { accessToken: 'a', refreshToken: 'r' } });
    const res = await tidal.getTidalCallback('code1', 'http://localhost/cb');
    expect(res.accessToken).toBe('a');
  });

  it('postTidalRefresh returns new tokens', async () => {
    post.mockResolvedValueOnce({ data: { accessToken: 'new' } });
    const res = await tidal.postTidalRefresh('old_rt');
    expect(res.accessToken).toBe('new');
  });

  it('postTidalSetAccessToken posts token', async () => {
    post.mockResolvedValueOnce({});
    await tidal.postTidalSetAccessToken('tok');
    expect(post).toHaveBeenCalled();
    expect(post.mock.calls[0][1]).toEqual({ accessToken: 'tok' });
  });

  it('AUTH_QK keys are well-formed', () => {
    const key = tidal.AUTH_QK.tidalAuthorizeUrl({ redirectUri: 'x' });
    expect(key[0]).toBe('auth');
    expect(key[1]).toBe('tidal');
  });
});

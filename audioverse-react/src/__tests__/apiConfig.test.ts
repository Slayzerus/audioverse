import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import { getKaraokeScoringConfig } from '../scripts/api/apiConfig';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;

describe('apiConfig', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getKaraokeScoringConfig returns data', async () => {
    get.mockResolvedValueOnce({ data: { maxScore: 1000 } });
    const res = await getKaraokeScoringConfig();
    expect(res).toEqual({ maxScore: 1000 });
    expect(get).toHaveBeenCalledWith('/api/admin/config/karaoke-scoring');
  });
});

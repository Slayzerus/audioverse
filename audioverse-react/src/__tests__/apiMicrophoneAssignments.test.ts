import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as mic from '../scripts/api/apiMicrophoneAssignments';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const put = apiClient.put as unknown as ReturnType<typeof vi.fn>;
const del = apiClient.delete as unknown as ReturnType<typeof vi.fn>;

describe('apiMicrophoneAssignments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getMicrophoneAssignments returns data', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    const res = await mic.getMicrophoneAssignments();
    expect(res).toEqual([{ id: 1 }]);
  });

  it('createMicrophoneAssignment posts and returns data', async () => {
    post.mockResolvedValueOnce({ data: { id: 2 } });
    const res = await mic.createMicrophoneAssignment({ userId: 1, microphoneId: 'm1', color: 'red', slot: 0 });
    expect(res.id).toBe(2);
  });

  it('updateMicrophoneAssignment puts and returns data', async () => {
    put.mockResolvedValueOnce({ data: { id: 2, color: 'blue' } });
    const res = await mic.updateMicrophoneAssignment(2, { color: 'blue', slot: 1 });
    expect(res.color).toBe('blue');
  });

  it('deleteMicrophoneAssignment calls delete', async () => {
    del.mockResolvedValueOnce({});
    await mic.deleteMicrophoneAssignment(2);
    expect(del).toHaveBeenCalled();
  });
});

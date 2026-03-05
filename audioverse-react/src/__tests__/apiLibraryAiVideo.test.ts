import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

vi.mock('../models/modelsAiVideo', () => ({
  toFormDataImage: vi.fn((_f: File) => new FormData()),
  toFormDataVideo: vi.fn((_f: File) => new FormData()),
  MIME: { json: 'application/json' },
  PoseEngine: { MediaPipe: 'mediapipe', MoveNet: 'movenet', BlazePose: 'blazepose' },
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as aiv from '../scripts/api/apiLibraryAiVideo';

const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

describe('apiLibraryAiVideo', () => {
  beforeEach(() => vi.clearAllMocks());
  const dummyFile = new File(['px'], 'img.jpg');

  it('postPoseImage calls post with engine', async () => {
    post.mockResolvedValueOnce({ data: { keypoints: [] } });
    const res = await aiv.postPoseImage('mediapipe' as any, dummyFile);
    expect(res.keypoints).toEqual([]);
    expect(post.mock.calls[0][0]).toContain('mediapipe');
  });

  it('postPoseVideo calls post with engine', async () => {
    post.mockResolvedValueOnce({ data: { frames: [] } });
    const res = await aiv.postPoseVideo('movenet' as any, dummyFile);
    expect(res.frames).toEqual([]);
  });

  it('postPose3dFromSequence posts JSON payload', async () => {
    post.mockResolvedValueOnce({ data: { sequence3d: [] } });
    const res = await aiv.postPose3dFromSequence({ frames: [] } as any);
    expect(res.sequence3d).toEqual([]);
  });

  it('postPose3dFromVideo posts file', async () => {
    post.mockResolvedValueOnce({ data: { poses: [] } });
    const res = await aiv.postPose3dFromVideo(dummyFile);
    expect(res.poses).toEqual([]);
  });

  it('labelForEngine returns labels', () => {
    expect(aiv.labelForEngine('mediapipe' as any)).toBeTruthy();
  });

  it('AI_VIDEO_BASE is defined', () => {
    expect(aiv.AI_VIDEO_BASE).toBe('/api/ai/video');
  });
});

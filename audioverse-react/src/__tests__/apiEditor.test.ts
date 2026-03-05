import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as editor from '../scripts/api/apiEditor';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const put = apiClient.put as unknown as ReturnType<typeof vi.fn>;
const del = apiClient.delete as unknown as ReturnType<typeof vi.fn>;

describe('apiEditor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('addProject returns id', async () => {
    post.mockResolvedValueOnce({ data: 10 });
    const id = await editor.addProject('proj', 1);
    expect(id).toBe(10);
  });

  it('updateProject calls put', async () => {
    put.mockResolvedValueOnce({ data: undefined });
    await editor.updateProject(1, { name: 'p' });
    expect(put).toHaveBeenCalled();
  });

  it('deleteProject calls delete', async () => {
    del.mockResolvedValueOnce({});
    await editor.deleteProject(1);
    expect(del).toHaveBeenCalled();
  });

  it('addSection returns id', async () => {
    post.mockResolvedValueOnce({ data: 5 });
    const id = await editor.addSection(1, 'sec', 0);
    expect(id).toBe(5);
  });

  it('updateSection calls put', async () => {
    put.mockResolvedValueOnce({ data: undefined });
    await editor.updateSection(2, { name: 's', orderNumber: 1 });
    expect(put).toHaveBeenCalled();
  });

  it('deleteSection calls delete', async () => {
    del.mockResolvedValueOnce({});
    await editor.deleteSection(2);
    expect(del).toHaveBeenCalled();
  });

  it('addLayer returns id', async () => {
    post.mockResolvedValueOnce({ data: 7 });
    const id = await editor.addLayer(1, 'lay', 'mic', '{}');
    expect(id).toBe(7);
  });

  it('updateLayer calls put', async () => {
    put.mockResolvedValueOnce({ data: undefined });
    await editor.updateLayer(3, { name: 'l' });
    expect(put).toHaveBeenCalled();
  });

  it('deleteLayer calls delete', async () => {
    del.mockResolvedValueOnce({});
    await editor.deleteLayer(3);
    expect(del).toHaveBeenCalled();
  });

  it('addLayerItem returns id', async () => {
    post.mockResolvedValueOnce({ data: 99 });
    const id = await editor.addLayerItem(1, '00:00', '{}');
    expect(id).toBe(99);
  });

  it('deleteLayerItem calls delete', async () => {
    del.mockResolvedValueOnce({});
    await editor.deleteLayerItem(9);
    expect(del).toHaveBeenCalled();
  });

  it('addLayerItems posts items', async () => {
    post.mockResolvedValueOnce({});
    await editor.addLayerItems([{ layerId: 1 } as any]);
    expect(post).toHaveBeenCalled();
  });

  it('getProjects returns array', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    const res = await editor.getProjects();
    expect(res).toEqual([{ id: 1 }]);
  });

  it('getTemplateProjects returns array', async () => {
    get.mockResolvedValueOnce({ data: [] });
    const res = await editor.getTemplateProjects();
    expect(res).toEqual([]);
  });

  it('getProjectDetails returns project', async () => {
    get.mockResolvedValueOnce({ data: { id: 1, name: 'p' } });
    const res = await editor.getProjectDetails(1);
    expect(res.name).toBe('p');
  });

  it('addAudioClip returns id', async () => {
    post.mockResolvedValueOnce({ data: 15 });
    const id = await editor.addAudioClip({ name: 'c' } as any);
    expect(id).toBe(15);
  });

  it('deleteAudioClip calls delete', async () => {
    del.mockResolvedValueOnce({});
    await editor.deleteAudioClip(15);
    expect(del).toHaveBeenCalled();
  });

  it('getAudioClip returns clip', async () => {
    get.mockResolvedValueOnce({ data: { id: 1 } });
    const res = await editor.getAudioClip(1);
    expect(res.id).toBe(1);
  });

  it('getAudioClips passes params', async () => {
    get.mockResolvedValueOnce({ data: [] });
    await editor.getAudioClips(0, 10, 'tag', 'q');
    expect(get.mock.calls[0][1]).toEqual({ params: { skip: 0, take: 10, tag: 'tag', search: 'q' } });
  });

  it('addInputPreset returns id', async () => {
    post.mockResolvedValueOnce({ data: 3 });
    const id = await editor.addInputPreset('v1', 'pres');
    expect(id).toBe(3);
  });

  it('getInputPreset returns preset', async () => {
    get.mockResolvedValueOnce({ data: { id: 3 } });
    const res = await editor.getInputPreset(3);
    expect(res.id).toBe(3);
  });

  it('getInputPresets passes params', async () => {
    get.mockResolvedValueOnce({ data: [] });
    await editor.getInputPresets(0, 20, 'q');
    expect(get.mock.calls[0][1]).toEqual({ params: { skip: 0, take: 20, search: 'q' } });
  });

  it('addTagToAudioClip posts tag', async () => {
    post.mockResolvedValueOnce({});
    await editor.addTagToAudioClip(1, 'drums');
    expect(post.mock.calls[0][1]).toBe('drums');
  });

  it('removeTagFromAudioClip deletes tag', async () => {
    del.mockResolvedValueOnce({});
    await editor.removeTagFromAudioClip(1, 'drums');
    expect(del.mock.calls[0][1]).toEqual({ data: 'drums' });
  });
});

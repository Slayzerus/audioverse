import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as ev from '../scripts/api/apiEvents';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const put = apiClient.put as unknown as ReturnType<typeof vi.fn>;
const del = (apiClient as any).delete as unknown as ReturnType<typeof vi.fn>;

describe('apiEvents — fetchers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('postCreateEvent posts and returns event', async () => {
    post.mockResolvedValueOnce({ data: { id: 1, name: 'Party' } });
    const res = await ev.postCreateEvent({ name: 'Party' } as any);
    expect(res.id).toBe(1);
    expect(post.mock.calls[0][0]).toContain('/api/events/');
  });

  it('fetchEventById gets event by id', async () => {
    get.mockResolvedValueOnce({ data: { id: 5, name: 'Eve' } });
    const res = await ev.fetchEventById(5);
    expect(res.name).toBe('Eve');
    expect(get.mock.calls[0][0]).toContain('/5');
  });

  it('putUpdateEvent puts event data', async () => {
    put.mockResolvedValueOnce({});
    await ev.putUpdateEvent(3, { name: 'Updated' } as any);
    expect(put.mock.calls[0][0]).toContain('/3');
  });

  it('deleteEvent deletes event', async () => {
    del.mockResolvedValueOnce({});
    await ev.deleteEvent(7);
    expect(del.mock.calls[0][0]).toContain('/7');
  });

  it('fetchEventParty gets party for event', async () => {
    get.mockResolvedValueOnce({ data: { id: 10, partyName: 'P' } });
    const res = await ev.fetchEventParty(5);
    expect(res.id).toBe(10);
    // Event IS the party now — URL is /{eventId} without /party suffix
    expect(get.mock.calls[0][0]).toContain('/5');
  });

  it('fetchEventPosterUrl returns presigned URL with validSeconds', async () => {
    get.mockResolvedValueOnce({ data: 'https://cdn/poster' });
    const res = await ev.fetchEventPosterUrl(5, 600);
    expect(res).toBe('https://cdn/poster');
    expect(get.mock.calls[0][1]?.params?.validSeconds).toBe(600);
  });

  it('fetchEventPosterUrl defaults to 300s', async () => {
    get.mockResolvedValueOnce({ data: 'url' });
    await ev.fetchEventPosterUrl(5);
    expect(get.mock.calls[0][1]?.params?.validSeconds).toBe(300);
  });

  it('fetchEventPosterPublicUrl returns public URL', async () => {
    get.mockResolvedValueOnce({ data: 'https://public/poster' });
    const res = await ev.fetchEventPosterPublicUrl(5);
    expect(res).toBe('https://public/poster');
    expect(get.mock.calls[0][0]).toContain('/poster-public-url');
  });

  it('postAddParticipant posts participant', async () => {
    post.mockResolvedValueOnce({ data: { id: 100 } });
    const res = await ev.postAddParticipant(5, { name: 'Player' } as any);
    expect(res.id).toBe(100);
    expect(post.mock.calls[0][0]).toContain('/5/participants');
  });

  it('postCreateEventInvite posts invite', async () => {
    post.mockResolvedValueOnce({ data: { id: 200 } });
    const res = await ev.postCreateEventInvite(5, { email: 'a@b.com' } as any);
    expect(res.id).toBe(200);
    expect(post.mock.calls[0][0]).toContain('/5/invites');
  });

  it('postCreateEventSession posts session', async () => {
    post.mockResolvedValueOnce({ data: { id: 300 } });
    const res = await ev.postCreateEventSession(5, { name: 'Session1' } as any);
    expect(res.id).toBe(300);
    expect(post.mock.calls[0][0]).toContain('/5/sessions');
  });

  it('EVENTS_QK keys are well-formed', () => {
    expect(ev.EVENTS_QK.all).toEqual(['events']);
    expect(ev.EVENTS_QK.detail(1)).toEqual(['events', 1]);
    expect(ev.EVENTS_QK.party(1)).toEqual(['events', 1, 'party']);
    expect(ev.EVENTS_QK.posterUrl(1)).toEqual(['events', 1, 'poster-url']);
    expect(ev.EVENTS_QK.posterPublicUrl(1)).toEqual(['events', 1, 'poster-public-url']);
  });

  it('EVENTS_BASE is correct', () => {
    expect(ev.EVENTS_BASE).toBe('/api/events');
  });
});

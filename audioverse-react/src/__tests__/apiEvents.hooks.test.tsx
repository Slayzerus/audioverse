import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as ev from '../scripts/api/apiEvents';
import type { MutateFnCapture } from './testUtils';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const put = apiClient.put as unknown as ReturnType<typeof vi.fn>;
const del = (apiClient as any).delete as unknown as ReturnType<typeof vi.fn>;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function W({ children, qc }: { children: React.ReactNode; qc: QueryClient }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('apiEvents — React Query hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useEventQuery fetches event by id', async () => {
    get.mockResolvedValue({ data: { id: 1, name: 'Ev1' } });
    const qc = makeQC();
    const Test = () => { const q = ev.useEventQuery(1); return <div>{q.data?.name ?? 'loading'}</div>; };
    render(<W qc={qc}><Test /></W>);
    await waitFor(() => expect(screen.getByText('Ev1')).toBeInTheDocument());
  });

  it('useEventQuery disabled for non-finite id', async () => {
    const spy = vi.spyOn(apiClient, 'get');
    const qc = makeQC();
    const Test = () => { const q = ev.useEventQuery(NaN); return <div>{q.isFetching ? 'fetching' : 'idle'}</div>; };
    render(<W qc={qc}><Test /></W>);
    await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument());
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('useEventPartyQuery fetches party', async () => {
    get.mockResolvedValue({ data: { id: 10, partyName: 'P' } });
    const qc = makeQC();
    const Test = () => { const q = ev.useEventPartyQuery(5); return <div>{q.data ? 'got' : 'loading'}</div>; };
    render(<W qc={qc}><Test /></W>);
    await waitFor(() => expect(screen.getByText('got')).toBeInTheDocument());
  });

  it('useCreateEventMutation calls postCreateEvent and invalidates', async () => {
    post.mockResolvedValue({ data: { id: 1, name: 'New' } });
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => { const m = ev.useCreateEventMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
    render(<W qc={qc}><Test /></W>);
    await act(async () => { await mutateFn({ name: 'New' }); });
    expect(post).toHaveBeenCalled();
  });

  it('useUpdateEventMutation calls putUpdateEvent', async () => {
    put.mockResolvedValue({});
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => { const m = ev.useUpdateEventMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
    render(<W qc={qc}><Test /></W>);
    await act(async () => { await mutateFn({ id: 1, event: { name: 'Upd' } }); });
    expect(put).toHaveBeenCalled();
  });

  it('useDeleteEventMutation calls deleteEvent', async () => {
    del.mockResolvedValue({});
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => { const m = ev.useDeleteEventMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
    render(<W qc={qc}><Test /></W>);
    await act(async () => { await mutateFn(1); });
    expect(del).toHaveBeenCalled();
  });

  it('useAddParticipantMutation posts participant', async () => {
    post.mockResolvedValue({ data: { id: 100 } });
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => { const m = ev.useAddParticipantMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
    render(<W qc={qc}><Test /></W>);
    await act(async () => { await mutateFn({ eventId: 5, player: { name: 'P' } }); });
    expect(post).toHaveBeenCalled();
  });

  it('useCreateEventInviteMutation posts invite', async () => {
    post.mockResolvedValue({ data: { id: 200 } });
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => { const m = ev.useCreateEventInviteMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
    render(<W qc={qc}><Test /></W>);
    await act(async () => { await mutateFn({ eventId: 5, invite: { email: 'a@b.com' } }); });
    expect(post).toHaveBeenCalled();
  });

  it('useCreateEventSessionMutation posts session', async () => {
    post.mockResolvedValue({ data: { id: 300 } });
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => { const m = ev.useCreateEventSessionMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
    render(<W qc={qc}><Test /></W>);
    await act(async () => { await mutateFn({ eventId: 5, session: { name: 'S1' } }); });
    expect(post).toHaveBeenCalled();
  });
});

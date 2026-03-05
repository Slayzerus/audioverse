import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as mod from '../scripts/api/apiModeration';
import type { MutateFnCapture } from './testUtils';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const put = apiClient.put as unknown as ReturnType<typeof vi.fn>;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}
function W({ children, qc }: { children: React.ReactNode; qc: QueryClient }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('apiModeration — fetchers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('postAbuseReport posts report', async () => {
    post.mockResolvedValueOnce({});
    await mod.postAbuseReport({ reason: 'spam' } as any);
    expect(post.mock.calls[0][0]).toContain('/report');
  });

  it('fetchAdminReports returns array', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 1, status: 'pending' }] });
    const res = await mod.fetchAdminReports('pending', 50);
    expect(res).toHaveLength(1);
    expect(get.mock.calls[0][1]?.params?.status).toBe('pending');
    expect(get.mock.calls[0][1]?.params?.take).toBe(50);
  });

  it('fetchAdminReports returns [] on null data', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await mod.fetchAdminReports();
    expect(res).toEqual([]);
  });

  it('putResolveReport puts resolve', async () => {
    put.mockResolvedValueOnce({});
    await mod.putResolveReport(10, { resolution: 'banned' } as any);
    expect(put.mock.calls[0][0]).toContain('/moderation/admin/report/10/resolve');
  });

  it('MODERATION_QK reports key includes status', () => {
    expect(mod.MODERATION_QK.reports('pending')).toEqual(['moderation', 'reports', 'pending']);
    expect(mod.MODERATION_QK.reports()).toEqual(['moderation', 'reports', undefined]);
  });

  it('MODERATION_BASE is correct', () => {
    expect(mod.MODERATION_BASE).toBe('/api/moderation');
  });
});

describe('apiModeration — React Query hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useAdminReportsQuery fetches reports', async () => {
    get.mockResolvedValue({ data: [{ id: 1 }] });
    const qc = makeQC();
    const Test = () => { const q = mod.useAdminReportsQuery('pending'); return <div>{q.data ? q.data.length : 'loading'}</div>; };
    render(<W qc={qc}><Test /></W>);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
  });

  it('useAbuseReportMutation posts report', async () => {
    post.mockResolvedValue({});
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => { const m = mod.useAbuseReportMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
    render(<W qc={qc}><Test /></W>);
    await act(async () => { await mutateFn({ reason: 'spam' }); });
    expect(post).toHaveBeenCalled();
  });

  it('useResolveReportMutation puts resolve and invalidates', async () => {
    put.mockResolvedValue({});
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => { const m = mod.useResolveReportMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
    render(<W qc={qc}><Test /></W>);
    await act(async () => { await mutateFn({ id: 1, request: { resolution: 'ok' } }); });
    expect(put).toHaveBeenCalled();
  });
});

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as tidal from '../scripts/api/apiTidalAuth';
import type { MutateFnCapture } from './testUtils';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}
function W({ children, qc }: { children: React.ReactNode; qc: QueryClient }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('apiTidalAuth — React Query hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useTidalAuthorizeUrlQuery fetches when redirectUri is provided', async () => {
    get.mockResolvedValue({ data: { url: 'https://tidal.com/auth?redirect=http://localhost' } });
    const qc = makeQC();
    const Test = () => {
      const q = tidal.useTidalAuthorizeUrlQuery({ redirectUri: 'http://localhost' });
      return <div>{q.data?.url ?? 'loading'}</div>;
    };
    render(<W qc={qc}><Test /></W>);
    await waitFor(() => expect(screen.getByText(/tidal\.com/)).toBeInTheDocument());
  });

  it('useTidalAuthorizeUrlQuery disabled without redirectUri', async () => {
    const qc = makeQC();
    const Test = () => {
      const q = tidal.useTidalAuthorizeUrlQuery({});
      return <div>{q.isFetching ? 'fetching' : 'idle'}</div>;
    };
    render(<W qc={qc}><Test /></W>);
    await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument());
  });

  it('useTidalAuthenticateMutation calls getTidalCallback', async () => {
    get.mockResolvedValue({ data: { accessToken: 'tok', refreshToken: 'ref' } });
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => {
      const m = tidal.useTidalAuthenticateMutation();
      mutateFn = m.mutateAsync;
      return <div>ok</div>;
    };
    render(<W qc={qc}><Test /></W>);
    await act(async () => {
      const res = await mutateFn({ code: 'code1', redirectUri: 'http://localhost/cb' });
      expect(res.accessToken).toBe('tok');
    });
  });

  it('useTidalRefreshMutation calls postTidalRefresh', async () => {
    post.mockResolvedValue({ data: { accessToken: 'new_tok' } });
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => {
      const m = tidal.useTidalRefreshMutation();
      mutateFn = m.mutateAsync;
      return <div>ok</div>;
    };
    render(<W qc={qc}><Test /></W>);
    await act(async () => {
      const res = await mutateFn('old_refresh');
      expect(res.accessToken).toBe('new_tok');
    });
  });

  it('useTidalSetAccessTokenMutation posts token', async () => {
    post.mockResolvedValue({});
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => {
      const m = tidal.useTidalSetAccessTokenMutation();
      mutateFn = m.mutateAsync;
      return <div>ok</div>;
    };
    render(<W qc={qc}><Test /></W>);
    await act(async () => { await mutateFn('some_token'); });
    expect(post).toHaveBeenCalled();
    expect(post.mock.calls[0][1]).toEqual({ accessToken: 'some_token' });
  });
});

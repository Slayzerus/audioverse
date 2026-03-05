import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as playlists from '../scripts/api/apiPlaylists';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function W({ children, qc }: { children: React.ReactNode; qc: QueryClient }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('apiPlaylists — React Query hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('usePlaylistsQuery', () => {
    it('fetches all playlists', async () => {
      get.mockResolvedValue({ data: [{ id: 1, name: 'PL1' }, { id: 2, name: 'PL2' }] });
      const qc = makeQC();
      const Test = () => {
        const q = playlists.usePlaylistsQuery();
        return <div>{q.data ? q.data.length : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    });
  });

  describe('useCreatePlaylistMutation', () => {
    it('creates a playlist', async () => {
      post.mockResolvedValue({ data: { playlistId: '123', url: 'https://...' } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = playlists.useCreatePlaylistMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      let result: any;
      await act(async () => {
        result = await mutateAsync({ platform: 'Tidal', name: 'My PL', songs: [] } as any);
      });
      expect(result.playlistId).toBe('123');
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useCreatePlaylistFromInfosMutation', () => {
    it('creates playlist from song infos', async () => {
      post.mockResolvedValue({ data: { playlistId: '456' } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = playlists.useCreatePlaylistFromInfosMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ platform: 'Spotify', name: 'test', songs: [] } as any);
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useGetTidalStreamsMutation', () => {
    it('gets tidal streams for song descriptors', async () => {
      post.mockResolvedValue({ data: { streams: [{ url: 'http://stream' }] } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = playlists.useGetTidalStreamsMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      let result: any;
      await act(async () => {
        result = await mutateAsync([{ isrc: 'US1234' }] as any);
      });
      expect(result.streams).toHaveLength(1);
    });
  });

  describe('useGetTidalStreamsFromInfosMutation', () => {
    it('gets tidal streams from song information', async () => {
      post.mockResolvedValue({ data: { streams: [] } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = playlists.useGetTidalStreamsFromInfosMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync([{ artist: 'Queen', title: 'Bohemian' }] as any);
      });
      expect(post).toHaveBeenCalled();
    });
  });
});

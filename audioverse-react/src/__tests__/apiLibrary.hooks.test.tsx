import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Hoist mock so it's available inside the factory
const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      create: () => ({
        get: mockGet,
        defaults: { baseURL: '' },
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
      }),
    },
  };
});

import { useYouTubeSearchQuery, LIB_QK, searchYouTubeByArtistTitle } from '../scripts/api/apiLibrary';

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function W({ children, qc }: { children: React.ReactNode; qc: QueryClient }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('apiLibrary', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('LIB_QK', () => {
    it('ytSearch generates correct query key', () => {
      expect(LIB_QK.ytSearch('Queen', 'Bohemian')).toEqual(['library', 'yt-search', 'Queen', 'Bohemian']);
    });

    it('handles nullish values', () => {
      expect(LIB_QK.ytSearch('', '')).toEqual(['library', 'yt-search', '', '']);
    });
  });

  describe('useYouTubeSearchQuery', () => {
    it('fetches when both artist and title are truthy', async () => {
      mockGet.mockResolvedValue({ data: { videoId: 'dQw4w9WgXcQ' } });
      const qc = makeQC();
      const Test = () => {
        const q = useYouTubeSearchQuery('Rick Astley', 'Never Gonna Give You Up');
        return <div>{q.data ?? 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('dQw4w9WgXcQ')).toBeInTheDocument());
    });

    it('is disabled when artist is empty', async () => {
      const qc = makeQC();
      const Test = () => {
        const q = useYouTubeSearchQuery('', 'Song');
        return <div>{q.fetchStatus === 'idle' ? 'idle' : 'fetching'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument());
    });

    it('is disabled when title is empty', async () => {
      const qc = makeQC();
      const Test = () => {
        const q = useYouTubeSearchQuery('Artist', '');
        return <div>{q.fetchStatus === 'idle' ? 'idle' : 'fetching'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument());
    });

    it('returns null when search fails', async () => {
      mockGet.mockRejectedValue(new Error('not found'));
      const qc = makeQC();
      const Test = () => {
        const q = useYouTubeSearchQuery('Unknown', 'Nothing');
        if (q.isLoading) return <div>loading</div>;
        return <div>{q.data === null ? 'null-result' : q.data}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('null-result')).toBeInTheDocument());
    });
  });

  describe('searchYouTubeByArtistTitle', () => {
    it('returns videoId on success', async () => {
      mockGet.mockResolvedValue({ data: { videoId: 'abc123' } });
      const result = await searchYouTubeByArtistTitle('Queen', 'Bohemian Rhapsody');
      expect(result).toBe('abc123');
    });

    it('returns null when videoId is missing', async () => {
      mockGet.mockResolvedValue({ data: {} });
      const result = await searchYouTubeByArtistTitle('Unknown', 'NoSong');
      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      mockGet.mockRejectedValue(new Error('network'));
      const result = await searchYouTubeByArtistTitle('A', 'B');
      expect(result).toBeNull();
    });
  });
});

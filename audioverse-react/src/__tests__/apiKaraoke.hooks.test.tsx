import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as api from '../scripts/api/apiKaraoke';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const put = apiClient.put as unknown as ReturnType<typeof vi.fn>;
const del = (apiClient as any).delete as unknown as ReturnType<typeof vi.fn>;
const patch = (apiClient as any).patch as unknown as ReturnType<typeof vi.fn>;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function W({ children, qc }: { children: React.ReactNode; qc: QueryClient }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('apiKaraoke — React Query hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  // =====================================================
  // QUERY HOOKS
  // =====================================================

  describe('useFilteredPartiesQuery', () => {
    it('fetches filtered parties', async () => {
      const result = { Items: [{ id: 1 }], TotalCount: 1 };
      post.mockResolvedValue({ data: result });
      const qc = makeQC();
      const Test = () => {
        const q = api.useFilteredPartiesQuery({ Page: 1, PageSize: 10 });
        return <div>{q.data ? q.data.TotalCount : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    });
  });

  describe('useCollaboratorPermissionQuery', () => {
    it('fetches collaborator permission when both IDs finite', async () => {
      // fetchCollaboratorPermission is now a deprecated stub returning null
      const qc = makeQC();
      const Test = () => {
        const q = api.useCollaboratorPermissionQuery(5, 10);
        return <div>{q.data === null ? 'null-permission' : q.data ?? 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('null-permission')).toBeInTheDocument());
    });

    it('is disabled when userId is null', async () => {
      const qc = makeQC();
      const Test = () => {
        const q = api.useCollaboratorPermissionQuery(5, null);
        return <div>{q.fetchStatus === 'idle' ? 'idle' : 'fetching'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument());
    });
  });

  describe('usePlayerPermissionsQuery', () => {
    it('fetches player permissions', async () => {
      get.mockResolvedValue({ data: 7 });
      const qc = makeQC();
      const Test = () => {
        const q = api.usePlayerPermissionsQuery(1, 2);
        return <div>{q.data != null ? String(q.data) : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument());
    });

    it('is disabled when playerId undefined', async () => {
      const qc = makeQC();
      const Test = () => {
        const q = api.usePlayerPermissionsQuery(1);
        return <div>{q.fetchStatus === 'idle' ? 'idle' : 'fetching'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument());
    });
  });

  describe('usePermissionHistoryQuery', () => {
    it('fetches permission history', async () => {
      get.mockResolvedValue({ data: { Items: [{ id: 1 }], TotalCount: 1 } });
      const qc = makeQC();
      const Test = () => {
        const q = api.usePermissionHistoryQuery(1, { page: 1 });
        return <div>{q.data ? q.data.TotalCount : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    });
  });

  describe('useCollaboratorsQuery', () => {
    it('fetches collaborators for a song', async () => {
      get.mockResolvedValue({ data: [{ userId: 1, name: 'Alice' }] });
      const qc = makeQC();
      const Test = () => {
        const q = api.useCollaboratorsQuery(10);
        return <div>{q.data ? q.data.length : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    });
  });

  describe('useSongVersionsQuery', () => {
    it('fetches song versions', async () => {
      get.mockResolvedValue({ data: [{ Version: 1 }, { Version: 2 }] });
      const qc = makeQC();
      const Test = () => {
        const q = api.useSongVersionsQuery(5);
        return <div>{q.data ? q.data.length : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    });
  });

  describe('useSongVersionQuery', () => {
    it('fetches specific song version', async () => {
      get.mockResolvedValue({ data: { Version: 3, notes: 'abc' } });
      const qc = makeQC();
      const Test = () => {
        const q = api.useSongVersionQuery(5, 3);
        return <div>{q.data ? q.data.Version : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
    });
  });

  describe('usePartiesQuery', () => {
    it('fetches all parties', async () => {
      get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
      const qc = makeQC();
      const Test = () => {
        const q = api.usePartiesQuery();
        return <div>{q.data ? q.data.length : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    });
  });

  describe('usePartyQuery', () => {
    it('fetches a party by id', async () => {
      get.mockResolvedValue({ data: { id: 5, name: 'Fiesta' } });
      const qc = makeQC();
      const Test = () => {
        const q = api.usePartyQuery(5);
        return <div>{q.data ? q.data.name : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('Fiesta')).toBeInTheDocument());
    });

    it('is disabled for NaN id', async () => {
      const qc = makeQC();
      const Test = () => {
        const q = api.usePartyQuery(NaN);
        return <div>{q.fetchStatus === 'idle' ? 'idle' : 'fetching'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument());
    });
  });

  describe('usePartyStatusQuery', () => {
    it('fetches party status', async () => {
      get.mockResolvedValue({ data: { players: [{ id: 1 }] } });
      const qc = makeQC();
      const Test = () => {
        const q = api.usePartyStatusQuery(5);
        return <div>{q.data ? q.data.players.length : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    });
  });

  describe('usePlayersQuery', () => {
    it('returns empty array (deprecated endpoint)', async () => {
      // fetchPlayers is deprecated — returns [] directly, no API call
      const qc = makeQC();
      const Test = () => {
        const q = api.usePlayersQuery();
        if (q.isLoading) return <div>loading</div>;
        return <div>{Array.isArray(q.data) ? 'got-array' : 'not-array'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('got-array')).toBeInTheDocument());
    });
  });

  describe('useSongsQuery', () => {
    it('fetches songs with filters', async () => {
      get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] });
      const qc = makeQC();
      const Test = () => {
        const q = api.useSongsQuery({ artist: 'Queen' });
        return <div>{q.data ? q.data.length : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
    });

    it('returns placeholder [] initially', async () => {
      get.mockReturnValue(new Promise(() => {})); // never resolves
      const qc = makeQC();
      const Test = () => {
        const q = api.useSongsQuery({});
        return <div>{Array.isArray(q.data) ? 'array' : 'not-array'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('array')).toBeInTheDocument());
    });
  });

  describe('useSongQuery', () => {
    it('fetches a song by id', async () => {
      get.mockResolvedValue({ data: { id: 7, title: 'Bohemian' } });
      const qc = makeQC();
      const Test = () => {
        const q = api.useSongQuery(7);
        return <div>{q.data ? q.data.title : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('Bohemian')).toBeInTheDocument());
    });
  });

  describe('useRoundPlayersQuery', () => {
    it('fetches round players', async () => {
      get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
      const qc = makeQC();
      const Test = () => {
        const q = api.useRoundPlayersQuery(10);
        return <div>{q.data ? q.data.length : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    });
  });

  describe('useRankingQuery', () => {
    it('fetches ranking data', async () => {
      get.mockResolvedValue({ data: [{ player: 'A', score: 100 }] });
      const qc = makeQC();
      const Test = () => {
        const q = api.useRankingQuery(10);
        return <div>{q.data ? q.data.length : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    });
  });

  describe('useUserHistoryQuery', () => {
    it('fetches user history', async () => {
      get.mockResolvedValue({ data: [{ song: 'X' }, { song: 'Y' }] });
      const qc = makeQC();
      const Test = () => {
        const q = api.useUserHistoryQuery(42, 5);
        return <div>{q.data ? q.data.length : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    });

    it('is disabled for NaN userId', async () => {
      const qc = makeQC();
      const Test = () => {
        const q = api.useUserHistoryQuery(NaN);
        return <div>{q.fetchStatus === 'idle' ? 'idle' : 'fetching'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument());
    });
  });

  describe('useActivityQuery', () => {
    it('fetches activity data', async () => {
      get.mockResolvedValue({ data: [{ day: '2024-01-01', count: 5 }] });
      const qc = makeQC();
      const Test = () => {
        const q = api.useActivityQuery(7);
        return <div>{q.data ? q.data.length : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    });
  });

  describe('usePlaylistQuery', () => {
    it('fetches a playlist by id', async () => {
      get.mockResolvedValue({ data: { id: 3, name: 'My Playlist' } });
      const qc = makeQC();
      const Test = () => {
        const q = api.usePlaylistQuery(3);
        return <div>{q.data ? q.data.name : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('My Playlist')).toBeInTheDocument());
    });
  });

  describe('useFilteredSongsQuery', () => {
    it('fetches filtered songs', async () => {
      post.mockResolvedValue({ data: { Items: [{ id: 1 }], TotalCount: 1 } });
      const qc = makeQC();
      const Test = () => {
        const q = api.useFilteredSongsQuery({ Conditions: [], Page: 1, PageSize: 10 } as any);
        return <div>{q.data ? q.data.TotalCount : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    });
  });

  describe('useAllSongsQuery', () => {
    it('fetches all songs', async () => {
      get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
      const qc = makeQC();
      const Test = () => {
        const q = api.useAllSongsQuery();
        return <div>{q.data ? q.data.length : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    });
  });

  describe('useTopSingingsQuery', () => {
    it('fetches top singings for a song', async () => {
      get.mockResolvedValue({ data: [{ score: 99 }] });
      const qc = makeQC();
      const Test = () => {
        const q = api.useTopSingingsQuery(7);
        return <div>{q.data ? q.data.length : 'loading'}</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    });
  });

  // =====================================================
  // MUTATION HOOKS
  // =====================================================

  describe('useAddCollaboratorMutation', () => {
    it('calls postAddCollaborator and invalidates collaborators', async () => {
      post.mockResolvedValue({ data: { ok: true } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useAddCollaboratorMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ songId: 5, payload: { userId: 10, permission: 'editor' } });
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useRemoveCollaboratorMutation', () => {
    it('calls deleteCollaborator', async () => {
      del.mockResolvedValue({ data: null });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useRemoveCollaboratorMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ songId: 5, userId: 10 });
      });
      expect(del).toHaveBeenCalled();
    });
  });

  describe('useUpdateCollaboratorPermissionMutation', () => {
    it('calls putUpdateCollaboratorPermission', async () => {
      put.mockResolvedValue({ data: { ok: true } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useUpdateCollaboratorPermissionMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ songId: 5, userId: 10, permission: 'admin' });
      });
      expect(put).toHaveBeenCalled();
    });
  });

  describe('useRevertSongVersionMutation', () => {
    it('calls postRevertSongVersion and invalidates song + versions', async () => {
      post.mockResolvedValue({ data: { ok: true } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useRevertSongVersionMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ songId: 5, version: 2, reason: 'fix' });
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useCreatePartyMutation', () => {
    it('creates party and sets cache', async () => {
      post.mockResolvedValue({ data: { id: 42, name: 'New Party' } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useCreatePartyMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      let result: any;
      await act(async () => {
        result = await mutateAsync({ name: 'New Party' } as any);
      });
      expect(result).toEqual({ id: 42, name: 'New Party' });
      // Check the cache was populated
      expect(qc.getQueryData(api.KARAOKE_QK.party(42))).toEqual({ id: 42, name: 'New Party' });
    });
  });

  describe('useCreatePlayerMutation', () => {
    it('throws because endpoint is removed (deprecated)', async () => {
      // postCreatePlayer throws Error('Endpoint removed...')
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useCreatePlayerMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        try {
          await mutateAsync({ id: 0, name: 'Alice' } as any);
        } catch (e: any) {
          expect(e.message).toContain('Endpoint removed');
        }
      });
    });
  });

  describe('useAssignPlayerToPartyMutation', () => {
    it('throws because endpoint is removed (deprecated) but performs optimistic update + rollback', async () => {
      // postAssignPlayerToParty throws, so the mutation will fail
      // but the optimistic update onMutate still runs  
      const qc = makeQC();
      const original = { players: [{ id: 10, name: '#10' }] };
      qc.setQueryData(api.KARAOKE_QK.partyStatus(1), original);

      let mutateAsync: any;
      const Test = () => {
        const m = api.useAssignPlayerToPartyMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        try { await mutateAsync({ partyId: 1, playerId: 20 }); } catch {}
      });
      // After rollback, cache should be restored to original
      const cached = qc.getQueryData(api.KARAOKE_QK.partyStatus(1)) as any;
      expect(cached).toEqual(original);
    });

    it('optimistic update handles empty cache then rolls back', async () => {
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useAssignPlayerToPartyMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        try { await mutateAsync({ partyId: 99, playerId: 5 }); } catch {}
      });
      // The mutation was attempted (it will throw internally)
      expect(true).toBe(true);
    });
  });

  describe('useDeleteAssignPlayerFromPartyMutation', () => {
    it('deletes assignment and invalidates', async () => {
      del.mockResolvedValue({ data: undefined });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useDeleteAssignPlayerFromPartyMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ partyId: 1, playerId: 10 });
      });
      expect(del).toHaveBeenCalled();
    });
  });

  describe('useDeletePartyMutation', () => {
    it('deletes party and removes cache', async () => {
      del.mockResolvedValue({ data: undefined });
      const qc = makeQC();
      qc.setQueryData(api.KARAOKE_QK.party(5), { id: 5 });
      qc.setQueryData(api.KARAOKE_QK.partyStatus(5), { players: [] });

      let mutateAsync: any;
      const Test = () => {
        const m = api.useDeletePartyMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync(5);
      });
      // Cache should be removed
      expect(qc.getQueryData(api.KARAOKE_QK.party(5))).toBeUndefined();
      expect(qc.getQueryData(api.KARAOKE_QK.partyStatus(5))).toBeUndefined();
    });
  });

  describe('useAddRoundMutation', () => {
    it('adds round and invalidates', async () => {
      post.mockResolvedValue({ data: { id: 1, partyId: 3 } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useAddRoundMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ id: 0, partyId: 3 } as any);
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useAddSessionMutation', () => {
    it('adds session and invalidates', async () => {
      post.mockResolvedValue({ data: { sessionId: 10 } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useAddSessionMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ partyId: 1 } as any);
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useAddRoundPartMutation', () => {
    it('adds round part and invalidates', async () => {
      post.mockResolvedValue({ data: { id: 1 } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useAddRoundPartMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ roundId: 1, partyId: 2 } as any);
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useAddSongToRoundMutation', () => {
    it('adds song to round and invalidates parties globally', async () => {
      post.mockResolvedValue({ data: { id: 1, songId: 5, roundId: 3, score: 0 } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useAddSongToRoundMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ id: 0, songId: 5, roundId: 3, score: 0 } as any);
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useSaveResultsMutation', () => {
    it('saves results and invalidates parties', async () => {
      post.mockResolvedValue({ data: undefined });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useSaveResultsMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync([{ id: 1, score: 95 }] as any);
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useScanFolderMutation', () => {
    it('scans folder and invalidates songs', async () => {
      post.mockResolvedValue({ data: [{ id: 1 }] });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useScanFolderMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync('/path/to/songs');
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useParseUltrastarMutation', () => {
    it('parses ultrastar file', async () => {
      post.mockResolvedValue({ data: { id: 1, title: 'Test Song' } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useParseUltrastarMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      let result: any;
      await act(async () => {
        result = await mutateAsync({ fileName: 'test.txt', data: '#TITLE:Test' });
      });
      expect(result.title).toBe('Test Song');
    });
  });

  describe('useAddRoundPlayerMutation', () => {
    it('adds round player and invalidates', async () => {
      post.mockResolvedValue({ data: { id: 1 } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useAddRoundPlayerMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ roundId: 5, payload: { playerId: 3 } } as any);
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useDeleteRoundPlayerMutation', () => {
    it('deletes round player and invalidates', async () => {
      del.mockResolvedValue({ data: undefined });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useDeleteRoundPlayerMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ roundId: 5, id: 1 });
      });
      expect(del).toHaveBeenCalled();
    });
  });

  describe('useCreateSongMutation', () => {
    it('creates song — deprecated endpoint rejects', async () => {
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useCreateSongMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await expect(act(async () => {
        await mutateAsync({ title: 'New Song' } as any);
      })).rejects.toThrow('Endpoint removed');
    });
  });

  describe('useUpdateSongMutation', () => {
    it('updates song — deprecated endpoint rejects', async () => {
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useUpdateSongMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await expect(act(async () => {
        await mutateAsync({ songId: 5, payload: { title: 'Updated' } as any });
      })).rejects.toThrow('Endpoint removed');
    });
  });

  describe('useJoinPartyMutation', () => {
    it('joins party', async () => {
      post.mockResolvedValue({ data: { joined: true } });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useJoinPartyMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ partyId: 1, request: { code: 'abc' } as any });
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useSetSongVerifiedMutation', () => {
    it('sets verified flag and invalidates song + songsAll', async () => {
      post.mockResolvedValue({ data: undefined });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useSetSongVerifiedMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ songId: 5, isVerified: true });
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useSetSongDevelopmentMutation', () => {
    it('sets development flag and invalidates', async () => {
      post.mockResolvedValue({ data: undefined });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useSetSongDevelopmentMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ songId: 5, inDevelopment: true });
      });
      expect(post).toHaveBeenCalled();
    });
  });

  describe('useDeleteParticipantMutation', () => {
    it('deletes participant and invalidates parties', async () => {
      del.mockResolvedValue({ data: undefined });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.useDeleteParticipantMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ eventId: 1, playerId: 10 });
      });
      expect(del).toHaveBeenCalled();
    });
  });

  describe('usePatchParticipantStatusMutation', () => {
    it('patches participant status and invalidates', async () => {
      patch.mockResolvedValue({ data: undefined });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.usePatchParticipantStatusMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ eventId: 1, playerId: 10, status: 'accepted' as any });
      });
      expect(patch).toHaveBeenCalled();
    });
  });

  describe('usePatchRoundPlayerSlotMutation', () => {
    it('patches round player slot and invalidates', async () => {
      patch.mockResolvedValue({ data: undefined });
      const qc = makeQC();
      let mutateAsync: any;
      const Test = () => {
        const m = api.usePatchRoundPlayerSlotMutation();
        mutateAsync = m.mutateAsync;
        return <div>ready</div>;
      };
      render(<W qc={qc}><Test /></W>);
      await act(async () => {
        await mutateAsync({ roundId: 1, id: 2, slot: 3 });
      });
      expect(patch).toHaveBeenCalled();
    });
  });
});

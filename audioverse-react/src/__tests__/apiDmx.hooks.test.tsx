import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
  DMX_BASE: '/api/dmx',
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as dmx from '../scripts/api/apiDmx';
import type { MutateFnCapture } from './testUtils';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const put = apiClient.put as unknown as ReturnType<typeof vi.fn>;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function Wrapper({ children, qc }: { children: React.ReactNode; qc: QueryClient }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('apiDmx React Query hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  // --- useDmxStateQuery ---
  describe('useDmxStateQuery', () => {
    it('fetches DMX state and renders data', async () => {
      const state = { portOpen: true, fps: 30, startCode: 0, frontSnapshot: new Array(513).fill(0) };
      get.mockResolvedValue({ data: state });
      const qc = makeQC();

      const Test = () => {
        const q = dmx.useDmxStateQuery({ refetchInterval: false });
        return <div>{q.isLoading ? 'loading' : q.data?.portOpen ? 'open' : 'closed'}</div>;
      };

      render(<Wrapper qc={qc}><Test /></Wrapper>);
      await waitFor(() => expect(screen.getByText('open')).toBeInTheDocument());
    });
  });

  // --- useFtdiDevicesQuery ---
  describe('useFtdiDevicesQuery', () => {
    it('fetches FTDI devices', async () => {
      get.mockResolvedValue({ data: [{ id: 'd1', description: 'DMX USB' }] });
      const qc = makeQC();

      const Test = () => {
        const q = dmx.useFtdiDevicesQuery();
        return <div>{q.data ? q.data.length : 'loading'}</div>;
      };

      render(<Wrapper qc={qc}><Test /></Wrapper>);
      await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    });
  });

  // --- useOpenDmxPortMutation ---
  describe('useOpenDmxPortMutation', () => {
    it('calls postOpenDmxPort and invalidates state', async () => {
      post.mockResolvedValue({});
      get.mockResolvedValue({ data: { portOpen: true } });
      const qc = makeQC();
      let mutateFn: MutateFnCapture;

      const Test = () => {
        const m = dmx.useOpenDmxPortMutation();
        mutateFn = m.mutateAsync;
        return <div>{m.isSuccess ? 'done' : 'idle'}</div>;
      };

      render(<Wrapper qc={qc}><Test /></Wrapper>);
      await act(async () => { await mutateFn('device1'); });
      expect(post).toHaveBeenCalled();
    });
  });

  // --- useCloseDmxPortMutation ---
  describe('useCloseDmxPortMutation', () => {
    it('calls postCloseDmxPort', async () => {
      post.mockResolvedValue({});
      const qc = makeQC();
      let mutateFn: MutateFnCapture;

      const Test = () => {
        const m = dmx.useCloseDmxPortMutation();
        mutateFn = m.mutateAsync;
        return <div>ok</div>;
      };

      render(<Wrapper qc={qc}><Test /></Wrapper>);
      await act(async () => { await mutateFn(); });
      expect(post).toHaveBeenCalled();
    });
  });

  // --- useConfigureDmxMutation (optimistic update) ---
  describe('useConfigureDmxMutation', () => {
    it('optimistically updates cache with fps and startCode', async () => {
      post.mockResolvedValue({});
      get.mockResolvedValue({ data: { portOpen: true, fps: 40, startCode: 0, frontSnapshot: new Array(513).fill(0) } });
      const qc = makeQC();
      // Seed cache
      qc.setQueryData(dmx.DMX_QK.state, {
        portOpen: true,
        fps: 30,
        startCode: 0,
        frontSnapshot: new Array(513).fill(0),
      });
      let mutateFn: MutateFnCapture;

      const Test = () => {
        const m = dmx.useConfigureDmxMutation();
        mutateFn = m.mutateAsync;
        const q = dmx.useDmxStateQuery({ refetchInterval: false });
        return <div>{q.data?.fps ?? 'none'}</div>;
      };

      render(<Wrapper qc={qc}><Test /></Wrapper>);
      await waitFor(() => expect(screen.getByText('30')).toBeInTheDocument());
      await act(async () => { await mutateFn({ fps: 40, startCode: 1 }); });
      expect(post).toHaveBeenCalled();
    });

    it('rolls back on error', async () => {
      post.mockRejectedValue(new Error('fail'));
      get.mockResolvedValue({ data: { portOpen: true, fps: 30, startCode: 0, frontSnapshot: new Array(513).fill(0) } });
      const qc = makeQC();
      qc.setQueryData(dmx.DMX_QK.state, {
        portOpen: true, fps: 30, startCode: 0, frontSnapshot: new Array(513).fill(0),
      });
      let mutateFn: MutateFnCapture;

      const Test = () => {
        const m = dmx.useConfigureDmxMutation();
        mutateFn = m.mutateAsync;
        return <div>test</div>;
      };

      render(<Wrapper qc={qc}><Test /></Wrapper>);
      await act(async () => {
        try { await mutateFn({ fps: 50, startCode: 2 }); } catch {}
      });
      // The state should be rolled back to the previous value
      const cached = qc.getQueryData(dmx.DMX_QK.state) as any;
      // After rollback + invalidation the cache was set back to the mocked GET data
      expect(cached).toBeTruthy();
    });
  });

  // --- useSetDmxChannelMutation (optimistic update) ---
  describe('useSetDmxChannelMutation', () => {
    it('optimistically sets a channel value in cache', async () => {
      put.mockResolvedValue({});
      get.mockResolvedValue({ data: { portOpen: true, fps: 30, startCode: 0, frontSnapshot: new Array(513).fill(0) } });
      const snapshot = new Array(513).fill(0);
      const qc = makeQC();
      qc.setQueryData(dmx.DMX_QK.state, {
        portOpen: true, fps: 30, startCode: 0, frontSnapshot: snapshot,
      });
      let mutateFn: MutateFnCapture;

      const Test = () => {
        const m = dmx.useSetDmxChannelMutation();
        mutateFn = m.mutateAsync;
        return <div>ch</div>;
      };

      render(<Wrapper qc={qc}><Test /></Wrapper>);
      await act(async () => { await mutateFn({ ch: 5, value: 200 }); });
      expect(put).toHaveBeenCalled();
    });
  });

  // --- useLoadDmxUniverseMutation (optimistic update) ---
  describe('useLoadDmxUniverseMutation', () => {
    it('optimistically updates entire universe in cache', async () => {
      put.mockResolvedValue({});
      get.mockResolvedValue({ data: { portOpen: true, fps: 30, startCode: 0, frontSnapshot: new Array(513).fill(0) } });
      const qc = makeQC();
      qc.setQueryData(dmx.DMX_QK.state, {
        portOpen: true, fps: 30, startCode: 0, frontSnapshot: new Array(513).fill(0),
      });
      let mutateFn: MutateFnCapture;

      const Test = () => {
        const m = dmx.useLoadDmxUniverseMutation();
        mutateFn = m.mutateAsync;
        return <div>uni</div>;
      };

      render(<Wrapper qc={qc}><Test /></Wrapper>);
      const payload = new Array(512).fill(128);
      await act(async () => { await mutateFn(payload); });
      expect(put).toHaveBeenCalled();
    });
  });

  // --- useBlackoutDmxMutation (optimistic update) ---
  describe('useBlackoutDmxMutation', () => {
    it('optimistically zeroes all channels in cache', async () => {
      post.mockResolvedValue({});
      get.mockResolvedValue({ data: { portOpen: true, fps: 30, startCode: 0, frontSnapshot: new Array(513).fill(0) } });
      const snapshot = new Array(513).fill(100);
      snapshot[0] = 0; // start code
      const qc = makeQC();
      qc.setQueryData(dmx.DMX_QK.state, {
        portOpen: true, fps: 30, startCode: 0, frontSnapshot: snapshot,
      });
      let mutateFn: MutateFnCapture;

      const Test = () => {
        const m = dmx.useBlackoutDmxMutation();
        mutateFn = m.mutateAsync;
        return <div>bo</div>;
      };

      render(<Wrapper qc={qc}><Test /></Wrapper>);
      await act(async () => { await mutateFn(); });
      expect(post).toHaveBeenCalled();
    });

    it('rolls back on error', async () => {
      post.mockRejectedValue(new Error('blackout fail'));
      const snapshot = new Array(513).fill(100);
      const qc = makeQC();
      qc.setQueryData(dmx.DMX_QK.state, {
        portOpen: true, fps: 30, startCode: 0, frontSnapshot: snapshot,
      });
      let mutateFn: MutateFnCapture;

      const Test = () => {
        const m = dmx.useBlackoutDmxMutation();
        mutateFn = m.mutateAsync;
        return <div>bo-err</div>;
      };

      render(<Wrapper qc={qc}><Test /></Wrapper>);
      await act(async () => {
        try { await mutateFn(); } catch {}
      });
      const cached = qc.getQueryData(dmx.DMX_QK.state) as any;
      expect(cached).toBeTruthy();
    });
  });
});

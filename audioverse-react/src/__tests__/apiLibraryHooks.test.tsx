import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the unified API client used by apiLibraryStream
vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
  API_ROOT: 'http://localhost:5000',
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as stream from '../scripts/api/apiLibraryStream';
import * as us from '../scripts/api/apiLibraryUltrastar';
import type { MutateFnCapture } from './testUtils';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}
function W({ children, qc }: { children: React.ReactNode; qc: QueryClient }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('apiLibraryStream — React Query hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useAudioFilesQuery fetches files', async () => {
    get.mockResolvedValue({ data: [{ id: 'f1', name: 'song.mp3' }] });
    const qc = makeQC();
    const Test = () => { const q = stream.useAudioFilesQuery(); return <div>{q.data ? q.data.length : 'loading'}</div>; };
    render(<W qc={qc}><Test /></W>);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
  });

  it('useAudioRecordsQuery fetches records', async () => {
    get.mockResolvedValue({ data: [{ id: 'r1', title: 'Rock' }] });
    const qc = makeQC();
    const Test = () => { const q = stream.useAudioRecordsQuery(); return <div>{q.data ? q.data.length : 'loading'}</div>; };
    render(<W qc={qc}><Test /></W>);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
  });

  it('useAudioRecordQuery fetches single record by id', async () => {
    get.mockResolvedValue({ data: [{ id: 'r1', title: 'Rock' }, { id: 'r2', title: 'Pop' }] });
    const qc = makeQC();
    const Test = () => { const q = stream.useAudioRecordQuery('r2'); return <div>{q.data?.title ?? 'loading'}</div>; };
    render(<W qc={qc}><Test /></W>);
    await waitFor(() => expect(screen.getByText('Pop')).toBeInTheDocument());
  });

  it('useAudioRecordQuery disabled when id is empty', async () => {
    const qc = makeQC();
    const Test = () => { const q = stream.useAudioRecordQuery(''); return <div>{q.isFetching ? 'fetching' : 'idle'}</div>; };
    render(<W qc={qc}><Test /></W>);
    await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument());
  });

  it('useScanAudioMutation calls postScanAudio and invalidates', async () => {
    post.mockResolvedValue({ data: 42 });
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => { const m = stream.useScanAudioMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
    render(<W qc={qc}><Test /></W>);
    await act(async () => { const res = await mutateFn(); expect(res).toBe(42); });
    expect(post).toHaveBeenCalled();
  });

  // --- re-exports ---
  it('re-exports are defined', () => {
    expect(stream.getAllAudioFiles).toBe(stream.fetchAudioFiles);
    expect(stream.getAllAudioRecords).toBe(stream.fetchAudioRecords);
    expect(stream.scanAudio).toBe(stream.postScanAudio);
  });

  it('default export has correct keys', () => {
    const def = stream.default;
    expect(def.scanAudio).toBe(stream.postScanAudio);
    expect(def.getAllAudioFiles).toBe(stream.fetchAudioFiles);
    expect(def.getAllAudioRecords).toBe(stream.fetchAudioRecords);
    expect(def.buildStreamUrl).toBe(stream.buildStreamUrl);
  });
});

describe('apiLibraryUltrastar — React Query hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useUltrastarSongsQuery fetches songs', async () => {
    get.mockResolvedValue({ data: [{ title: 'Song1' }] });
    const qc = makeQC();
    const Test = () => { const q = us.useUltrastarSongsQuery(); return <div>{q.data ? q.data.length : 'loading'}</div>; };
    render(<W qc={qc}><Test /></W>);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
  });

  it('useScanUltrastarMutation calls postScanUltrastar', async () => {
    post.mockResolvedValue({ data: [{ title: 'Scanned' }] });
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => { const m = us.useScanUltrastarMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
    render(<W qc={qc}><Test /></W>);
    await act(async () => { await mutateFn(); });
    expect(post).toHaveBeenCalled();
  });

  it('useParseUltrastarMutation parses file', async () => {
    post.mockResolvedValue({ data: { title: 'Parsed' } });
    const qc = makeQC();
    let mutateFn: MutateFnCapture;
    const Test = () => { const m = us.useParseUltrastarMutation(); mutateFn = m.mutateAsync; return <div>ok</div>; };
    render(<W qc={qc}><Test /></W>);
    const file = new File(['data'], 'test.txt', { type: 'text/plain' });
    await act(async () => { const res = await mutateFn(file); expect(res.title).toBe('Parsed'); });
    expect(post).toHaveBeenCalled();
  });

  // --- re-exports ---
  it('re-exports work', () => {
    expect(us.getAllUltrastarSongs).toBe(us.fetchUltrastarSongs);
    expect(us.scanUltrastar).toBe(us.postScanUltrastar);
    expect(us.parseUltrastar).toBe(us.postParseUltrastar);
  });

  it('default export', () => {
    const def = us.default;
    expect(def.scanUltrastar).toBe(us.postScanUltrastar);
    expect(def.getAllUltrastarSongs).toBe(us.fetchUltrastarSongs);
    expect(def.parseUltrastar).toBe(us.postParseUltrastar);
    expect(def.useUltrastarSongsQuery).toBe(us.useUltrastarSongsQuery);
    expect(def.useScanUltrastarMutation).toBe(us.useScanUltrastarMutation);
    expect(def.useParseUltrastarMutation).toBe(us.useParseUltrastarMutation);
  });
});

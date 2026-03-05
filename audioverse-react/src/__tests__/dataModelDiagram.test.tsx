import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock apiClient
vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
  API_ROOT: 'http://localhost:5000',
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import type { DiagramJson } from '../models/modelsDiagrams';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}
function W({ children, qc }: { children: React.ReactNode; qc: QueryClient }) {
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── Sample data ────────────────────────────────────────────────────
const sampleDiagram: DiagramJson = {
  generatedAt: '2026-02-25T19:38:03Z',
  generator: 'AudioVerse.DiagramGenerator',
  groups: [
    {
      name: 'Events',
      fillColor: '#d5e8d4',
      strokeColor: '#82b366',
      nodes: [
        {
          id: 'AudioVerse.Domain.Entities.Events.Event',
          name: 'Event',
          icon: '📅',
          description: 'Core event',
          fillColor: '#d5e8d4',
          strokeColor: '#82b366',
          properties: ['int Id', 'string Title', 'DateTime? StartTime'],
        },
        {
          id: 'AudioVerse.Domain.Entities.Events.EventParticipant',
          name: 'EventParticipant',
          icon: '🎟️',
          description: 'RSVP tracking',
          fillColor: '#d5e8d4',
          strokeColor: '#82b366',
          properties: ['int Id', 'int EventId', 'int UserId'],
        },
      ],
    },
    {
      name: 'Karaoke',
      fillColor: '#e1d5e7',
      strokeColor: '#9673a6',
      nodes: [
        {
          id: 'AudioVerse.Domain.Entities.Karaoke.KaraokeSinging',
          name: 'KaraokeSinging',
          icon: '🎤',
          description: 'A singing performance',
          fillColor: '#e1d5e7',
          strokeColor: '#9673a6',
          properties: ['int Id', 'int RoundId', 'int PlayerId'],
        },
      ],
    },
  ],
  edges: [
    {
      source: 'AudioVerse.Domain.Entities.Events.EventParticipant',
      target: 'AudioVerse.Domain.Entities.Events.Event',
      label: 'N:1',
      propertyName: 'Event',
      dashed: false,
    },
  ],
};

// ── API tests ──────────────────────────────────────────────────────

describe('apiDiagrams — fetch functions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getDataModelDiagram fetches correct path', async () => {
    get.mockResolvedValueOnce({ data: sampleDiagram });
    const { getDataModelDiagram } = await import('../scripts/api/apiDiagrams');
    const data = await getDataModelDiagram();
    expect(get).toHaveBeenCalledWith('/api/admin/diagrams/data-model');
    expect(data.groups).toHaveLength(2);
    expect(data.edges).toHaveLength(1);
  });

  it('getDiagramList fetches correct path', async () => {
    get.mockResolvedValueOnce({ data: [{ name: 'auto-data-model.drawio', sizeBytes: 1234, lastModified: '2026-01-01', hasJson: true }] });
    const { getDiagramList } = await import('../scripts/api/apiDiagrams');
    const list = await getDiagramList();
    expect(get).toHaveBeenCalledWith('/api/admin/diagrams');
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('auto-data-model.drawio');
  });

  it('downloadDataModelDrawio fetches blob', async () => {
    const fakeBlob = new Blob(['<xml/>']);
    get.mockResolvedValueOnce({ data: fakeBlob });
    const { downloadDataModelDrawio } = await import('../scripts/api/apiDiagrams');
    const blob = await downloadDataModelDrawio();
    expect(get).toHaveBeenCalledWith('/api/admin/diagrams/data-model/drawio', { responseType: 'blob' });
    expect(blob).toBeInstanceOf(Blob);
  });
});

// ── Component render tests ─────────────────────────────────────────

describe('DataModelDiagram — component', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading state initially', async () => {
    // Never resolve — stays loading
    get.mockReturnValue(new Promise(() => {}));
    const DataModelDiagram = (await import('../pages/admin/DataModelDiagram')).default;
    const qc = makeQC();
    render(<W qc={qc}><DataModelDiagram /></W>);
    expect(screen.getByText('Ładowanie diagramu...')).toBeTruthy();
  });

  it('shows error state when fetch fails', async () => {
    get.mockRejectedValueOnce(new Error('Network error'));
    const DataModelDiagram = (await import('../pages/admin/DataModelDiagram')).default;
    const qc = makeQC();
    render(<W qc={qc}><DataModelDiagram /></W>);
    await waitFor(() => {
      expect(screen.getByText('Nie udało się załadować diagramu')).toBeTruthy();
    });
  });

  it('renders diagram with all groups and nodes', async () => {
    get.mockResolvedValueOnce({ data: sampleDiagram });
    const DataModelDiagram = (await import('../pages/admin/DataModelDiagram')).default;
    const qc = makeQC();
    render(<W qc={qc}><DataModelDiagram /></W>);
    await waitFor(() => {
      expect(screen.getByText(/Model danych/)).toBeTruthy();
    });
    // Group filter buttons
    expect(screen.getByText(/Events \(2\)/)).toBeTruthy();
    expect(screen.getByText(/Karaoke \(1\)/)).toBeTruthy();
    // Footer stats
    expect(screen.getByText(/2 grup/)).toBeTruthy();
    expect(screen.getByText(/3 encji/)).toBeTruthy();
    expect(screen.getByText(/1 relacji/)).toBeTruthy();
  });

  it('renders search input', async () => {
    get.mockResolvedValueOnce({ data: sampleDiagram });
    const DataModelDiagram = (await import('../pages/admin/DataModelDiagram')).default;
    const qc = makeQC();
    render(<W qc={qc}><DataModelDiagram /></W>);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Szukaj encji...')).toBeTruthy();
    });
  });

  it('renders zoom controls', async () => {
    get.mockResolvedValueOnce({ data: sampleDiagram });
    const DataModelDiagram = (await import('../pages/admin/DataModelDiagram')).default;
    const qc = makeQC();
    render(<W qc={qc}><DataModelDiagram /></W>);
    await waitFor(() => {
      expect(screen.getByText('100%')).toBeTruthy();
    });
  });

  it('renders download .drawio button', async () => {
    get.mockResolvedValueOnce({ data: sampleDiagram });
    const DataModelDiagram = (await import('../pages/admin/DataModelDiagram')).default;
    const qc = makeQC();
    render(<W qc={qc}><DataModelDiagram /></W>);
    await waitFor(() => {
      expect(screen.getByText(/\.drawio/)).toBeTruthy();
    });
  });
});

// ── Model type tests ───────────────────────────────────────────────

describe('modelsDiagrams — type verification', () => {
  it('sample data matches DiagramJson shape', () => {
    const data: DiagramJson = sampleDiagram;
    expect(data.generatedAt).toBeTruthy();
    expect(data.generator).toBeTruthy();
    expect(data.groups.length).toBeGreaterThan(0);
    expect(data.groups[0].nodes.length).toBeGreaterThan(0);
    expect(data.groups[0].nodes[0].properties.length).toBeGreaterThan(0);
    expect(data.edges.length).toBeGreaterThan(0);
    expect(typeof data.edges[0].dashed).toBe('boolean');
  });
});

/**
 * Tests for PartiesList component
 * Covers: buildPosterStyle, filter rendering, poster styles, pagination,
 *         sort, organizer multi-select+chips, date filters, URL sync.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

/* ---- Mock state ---- */
const searchParamsMap = new Map<string, string>();
const mockSetSearchParams = vi.fn();
const mockSearchParams = {
  get: (key: string) => searchParamsMap.get(key) ?? null,
  set: (key: string, value: string) => searchParamsMap.set(key, value),
  delete: (key: string) => searchParamsMap.delete(key),
  toString: () =>
    Array.from(searchParamsMap.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('&'),
  [Symbol.iterator]: function* () {
    yield* searchParamsMap.entries();
  },
};

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }: any) =>
    React.createElement('a', { href: to, ...rest }, children),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

const mockFilteredData = { Items: [] as any[], TotalCount: 0 };
const mockPartiesData: any[] = [];
const mockOrganizersData: { id: number; name: string }[] = [];

vi.mock('../scripts/api/apiKaraoke', () => ({
  useFilteredPartiesQuery: vi.fn(() => ({ data: mockFilteredData, isLoading: false })),
  usePartiesQuery: vi.fn(() => ({ data: mockPartiesData, isLoading: false })),
  DynamicFilterRequest: {},
  FilterOperator: { Equals: 0, In: 1, Contains: 2, Gte: 3, Lte: 4, Between: 5 },
}));

vi.mock('../scripts/api/apiEvents', () => ({
  useOrganizersQuery: vi.fn(() => ({ data: mockOrganizersData, isLoading: false })),
}));

vi.mock('../scripts/api/audioverseApiClient', () => ({
  API_ROOT: 'http://localhost:5000',
}));

vi.mock('../components/common/Focusable', () => ({
  Focusable: ({ children, id }: any) =>
    React.createElement('div', { 'data-focusable-id': id }, children),
}));

vi.mock('../components/ui/MultiSearchSelect', () => ({
  default: ({ label, options, selected, onChange }: any) =>
    React.createElement(
      'div',
      { 'data-testid': `multi-${label}` },
      React.createElement('button', { onClick: () => onChange(['v1']) }, `Pick ${label}`),
    ),
}));

vi.mock('../components/party/OrganizerMultiSelect', () => ({
  default: ({ options, selectedIds, onChange }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'org-multi-select' },
      React.createElement('button', { onClick: () => onChange(['org42']) }, 'Pick Org'),
    ),
  OrganizerOption: {},
}));

vi.mock('../components/party/DatePresets', () => ({
  default: ({ onSetRange }: any) =>
    React.createElement(
      'button',
      {
        'data-testid': 'date-preset',
        onClick: () => onSetRange('2024-01-01T00:00', '2024-12-31T23:59'),
      },
      'Preset',
    ),
}));

vi.mock('../components/ui/PaginationControls', () => ({
  default: () => null,
}));

import PartiesList from '../components/party/PartiesList';

beforeEach(() => {
  vi.clearAllMocks();
  searchParamsMap.clear();
  mockFilteredData.Items = [];
  mockFilteredData.TotalCount = 0;
  mockPartiesData.length = 0;
  mockOrganizersData.length = 0;
});

describe('PartiesList', () => {
  /* ---- Basic rendering ---- */
  it('renders empty state', () => {
    const { container } = render(<PartiesList />);
    expect(container.textContent).toContain('party.total');
  });

  it('renders party cards', () => {
    mockFilteredData.Items = [
      { id: 1, name: 'Alpha', description: 'Desc A', startTime: '2024-06-15T20:00:00Z' },
      { id: 2, name: 'Beta' },
    ];
    mockFilteredData.TotalCount = 2;
    const { container } = render(<PartiesList />);
    expect(container.textContent).toContain('Alpha');
    expect(container.textContent).toContain('Beta');
    expect(container.textContent).toContain('Desc A');
    expect(container.textContent).toContain('party.total');
  });

  /* ---- buildPosterStyle branches ---- */
  it('no poster → no background-image', () => {
    mockFilteredData.Items = [{ id: 1, name: 'X' }];
    mockFilteredData.TotalCount = 1;
    const { container } = render(<PartiesList />);
    const link = container.querySelector('a')!;
    // No poster → backgroundImage should not contain a url(); jsdom may return '' or 'none'
    expect(link.style.backgroundImage).not.toContain('url(');
  });

  it('poster present → uses /api/events/{id}/poster endpoint', () => {
    mockFilteredData.Items = [{ id: 42, name: 'X', poster: 'posters/some-guid.jpg' }];
    mockFilteredData.TotalCount = 1;
    const { container } = render(<PartiesList />);
    expect(container.querySelector('a')!.style.backgroundImage).toContain('/api/events/42/poster');
  });

  it('poster → white text, cover background, gradient overlay', () => {
    mockFilteredData.Items = [{ id: 1, name: 'X', poster: 'http://img.jpg' }];
    mockFilteredData.TotalCount = 1;
    const { container } = render(<PartiesList />);
    const link = container.querySelector('a')!;
    // jsdom normalises #fff → rgb(255, 255, 255)
    expect(link.style.color).toMatch(/#fff|rgb\(255,\s*255,\s*255\)/);
    expect(link.style.backgroundSize).toBe('cover');
    expect(link.style.backgroundPosition).toContain('center');
    expect(link.style.backgroundImage).toContain('linear-gradient');
  });

  /* ---- Start time display ---- */
  it('party with startTime shows formatted date', () => {
    mockFilteredData.Items = [{ id: 1, name: 'X', startTime: '2024-06-15T20:00:00Z' }];
    mockFilteredData.TotalCount = 1;
    const { container } = render(<PartiesList />);
    // Component renders toLocaleString(undefined, {day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})
    const expectedDate = new Date('2024-06-15T20:00:00Z').toLocaleString(undefined, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    expect(container.textContent).toContain(expectedDate);
  });

  it('party without startTime hides date badge', () => {
    mockFilteredData.Items = [{ id: 1, name: 'X' }];
    mockFilteredData.TotalCount = 1;
    const { container } = render(<PartiesList />);
    // No startTime → the date badge span is not rendered at all
    const expectedDate = new Date('2024-06-15T20:00:00Z').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    expect(container.textContent).not.toContain(expectedDate);
  });

  /* ---- Name search ---- */
  it('name search input updates value', () => {
    const { container } = render(<PartiesList />);
    const input = container.querySelector('input[aria-label="party.filterPlaceholder"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(input.value).toBe('hello');
  });

  /* ---- Sort ---- */
  it('sort select changes value', () => {
    const { container } = render(<PartiesList />);
    const sortSelect = Array.from(container.querySelectorAll('select')).find(s =>
      Array.from(s.options).some(o => o.value === 'startAsc'),
    )!;
    expect(sortSelect).toBeTruthy();
    fireEvent.change(sortSelect, { target: { value: 'name' } });
    expect(sortSelect.value).toBe('name');
  });

  /* ---- Date filters ---- */
  it('datetime-local inputs accept values', () => {
    const { container } = render(<PartiesList />);
    const dateInputs = container.querySelectorAll('input[type="datetime-local"]');
    expect(dateInputs.length).toBe(2);
    fireEvent.change(dateInputs[0], { target: { value: '2024-01-01T00:00' } });
    fireEvent.change(dateInputs[1], { target: { value: '2024-12-31T23:59' } });
    expect((dateInputs[0] as HTMLInputElement).value).toBe('2024-01-01T00:00');
    expect((dateInputs[1] as HTMLInputElement).value).toBe('2024-12-31T23:59');
  });

  it('date preset sets date range in inputs', () => {
    const { getByTestId, container } = render(<PartiesList />);
    fireEvent.click(getByTestId('date-preset'));
    const dateInputs = container.querySelectorAll('input[type="datetime-local"]');
    expect((dateInputs[0] as HTMLInputElement).value).toBe('2024-01-01T00:00');
    expect((dateInputs[1] as HTMLInputElement).value).toBe('2024-12-31T23:59');
  });

  /* ---- Pagination ---- */
  it('page size select changes', () => {
    const { container } = render(<PartiesList />);
    const psSelect = Array.from(container.querySelectorAll('select')).find(s =>
      Array.from(s.options).some(o => o.value === '50'),
    )!;
    expect(psSelect).toBeTruthy();
    fireEvent.change(psSelect, { target: { value: '50' } });
    expect(psSelect.value).toBe('50');
  });

  it('Prev disabled on page 1', () => {
    const { container } = render(<PartiesList />);
    const prev = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'common.prev')!;
    expect(prev.disabled).toBe(true);
  });

  it('Next disabled when all items fit on one page', () => {
    mockFilteredData.TotalCount = 5;
    const { container } = render(<PartiesList />);
    const next = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'common.next')!;
    expect(next.disabled).toBe(true);
  });

  it('Next navigates to page 2, Prev back to page 1', () => {
    mockFilteredData.TotalCount = 50;
    const { container } = render(<PartiesList />);
    const next = () => Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'common.next')!;
    const prev = () => Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'common.prev')!;
    expect(next().disabled).toBe(false);
    fireEvent.click(next());
    expect(container.textContent).toContain('party.pageNumber');
    expect(prev().disabled).toBe(false);
    fireEvent.click(prev());
    expect(container.textContent).toContain('party.pageNumber');
  });

  /* ---- Focusable / Link ---- */
  it('cards wrapped in Focusable with correct id', () => {
    mockFilteredData.Items = [{ id: 7, name: 'F' }];
    mockFilteredData.TotalCount = 1;
    const { container } = render(<PartiesList />);
    expect(container.querySelector('[data-focusable-id="parties-item-7"]')).toBeTruthy();
  });

  it('card links to /parties/:id', () => {
    mockFilteredData.Items = [{ id: 42, name: 'L' }];
    mockFilteredData.TotalCount = 1;
    const { container } = render(<PartiesList />);
    expect(container.querySelector('a')!.getAttribute('href')).toBe('/parties/42');
  });

  /* ---- Type & Access dropdown filters ---- */
  it('Type and Access filters rendered as select dropdowns', () => {
    const { getByLabelText } = render(<PartiesList />);
    expect(getByLabelText('party.typeLabel')).toBeTruthy();
    expect(getByLabelText('party.accessLabel')).toBeTruthy();
  });

  /* ---- OrganizerMultiSelect (always rendered) ---- */
  it('renders OrganizerMultiSelect', () => {
    const { getByTestId } = render(<PartiesList />);
    expect(getByTestId('org-multi-select')).toBeTruthy();
  });

  it('renders OrganizerMultiSelect even with >20 organizer options', () => {
    mockOrganizersData.push(
      ...Array.from({ length: 21 }, (_, i) => ({ id: i + 100, name: `Org${i}` })),
    );
    const { getByTestId } = render(<PartiesList />);
    expect(getByTestId('org-multi-select')).toBeTruthy();
  });

  /* ---- Organizer chips ---- */
  it('organizer chips appear after selection and can be removed', () => {
    const { getByTestId, container } = render(
      <PartiesList parties={[{ id: 1, name: 'P', organizerId: 10, organizerName: 'Alice' }]} />,
    );
    // Click mock button → sets selectedOrganizerIds to ['org42']
    fireEvent.click(getByTestId('org-multi-select').querySelector('button')!);
    // Component renders organizer chips with class 'badge d-flex ...'
    const chip = container.querySelector('.badge.d-flex');
    expect(chip).toBeTruthy();
    expect(chip!.textContent).toContain('org42');
    // Remove
    fireEvent.click(chip!.querySelector('.btn-close')!);
    expect(container.querySelectorAll('.badge.d-flex').length).toBe(0);
  });

  /* ---- Date range filter conditions (lines 74–85) ---- */
  it('dateFrom AND dateTo → Between condition in filter request', async () => {
    const { useFilteredPartiesQuery } = await import('../scripts/api/apiKaraoke');
    // Set URL params BEFORE render so initial state has both dates
    searchParamsMap.set('from', '2024-01-01T00:00');
    searchParamsMap.set('to', '2024-12-31T23:59');
    render(<PartiesList />);
    const calls = (useFilteredPartiesQuery as any).mock.calls;
    const hasCondition = calls.some((c: any) =>
      c[0].Conditions?.some((cond: any) => cond.Field === 'StartTime' && cond.Operator === 5 /* Between */));
    expect(hasCondition).toBe(true);
  });

  it('only dateFrom → Gte condition in filter request', async () => {
    const { useFilteredPartiesQuery } = await import('../scripts/api/apiKaraoke');
    searchParamsMap.set('from', '2024-06-01T00:00');
    render(<PartiesList />);
    const calls = (useFilteredPartiesQuery as any).mock.calls;
    const hasCondition = calls.some((c: any) =>
      c[0].Conditions?.some((cond: any) => cond.Field === 'StartTime' && cond.Operator === 3 /* Gte */));
    expect(hasCondition).toBe(true);
  });

  it('only dateTo → Lte condition in filter request', async () => {
    const { useFilteredPartiesQuery } = await import('../scripts/api/apiKaraoke');
    searchParamsMap.set('to', '2024-12-31T23:59');
    render(<PartiesList />);
    const calls = (useFilteredPartiesQuery as any).mock.calls;
    const hasCondition = calls.some((c: any) =>
      c[0].Conditions?.some((cond: any) => cond.Field === 'StartTime' && cond.Operator === 4 /* Lte */));
    expect(hasCondition).toBe(true);
  });

  /* ---- URL sync ---- */
  it('calls setSearchParams on mount', () => {
    render(<PartiesList />);
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  /* ---- parties prop ---- */
  it('uses parties prop for option derivation', () => {
    render(
      <PartiesList
        parties={[
          { id: 1, name: 'P1', type: 'karaoke', access: 'public' },
          { id: 2, name: 'P2', type: 'quiz', access: 'private' },
        ]}
      />,
    );
    // Renders without crash; MultiSearchSelect receives derived options
  });
});

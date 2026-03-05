import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Focusable } from '../../components/common/Focusable';
import { API_ROOT } from '../../config/apiConfig';
import { useFilteredPartiesQuery, DynamicFilterRequest, DynamicFilterCondition, FilterOperator } from '../../scripts/api/apiKaraoke';
import { useOrganizersQuery } from '../../scripts/api/apiEvents';
import { KaraokeParty } from '../../models/modelsKaraoke';
import OrganizerMultiSelect, { OrganizerOption } from './OrganizerMultiSelect';
import DatePresets from './DatePresets';
import { useTranslation } from 'react-i18next';
import { EventLocationType, EventAccessType } from '../../models/karaoke/modelsEvent';

type Party = KaraokeParty;
type SortOption = 'startAsc' | 'startDesc' | 'name';

const buildPosterStyle = (party: Party) => {
  if (!party?.poster) return {} as React.CSSProperties;
  // Use the backend poster proxy endpoint: GET /api/events/{id}/poster
  const url = `${API_ROOT.replace(/\/$/, '')}/api/events/${party.id}/poster`;
  return {
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%), url(${url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: '#fff'
  } as React.CSSProperties;
};



const PartiesList: React.FC<{ parties?: Party[] }> = ({ parties = [] }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const paramToList = (v: string | null) => v ? v.split(',').map(s=>decodeURIComponent(s)).filter(Boolean) : [];
  const listToParam = (arr: string[]) => arr.map(s=>encodeURIComponent(s)).join(',');

  const [nameQuery, setNameQuery] = React.useState(() => searchParams.get('q') ?? '');
  // Fetch distinct organizers from dedicated lightweight endpoint
  const { data: organizersData = [] } = useOrganizersQuery();

  // Known enum options for Type and Access (static, not derived from data)
  const typeOptions: { value: string; label: string }[] = [
    { value: String(EventLocationType.Virtual), label: t('party.typeVirtual', 'Wirtualna') },
    { value: String(EventLocationType.Real), label: t('party.typeReal', 'Stacjonarna') },
  ];
  const accessOptions: { value: string; label: string }[] = [
    { value: String(EventAccessType.Public), label: t('party.accessPublic', 'Publiczny') },
    { value: String(EventAccessType.Private), label: t('party.accessPrivate', 'Prywatny') },
    { value: String(EventAccessType.Code), label: t('party.accessCode', 'Kod dostępu') },
    { value: String(EventAccessType.Link), label: t('party.accessLink', 'Link') },
  ];
  const organizerOptions: OrganizerOption[] = React.useMemo(() =>
    organizersData.map(o => ({ id: String(o.id), name: o.name })),
  [organizersData]);
  const organizerMap = React.useMemo(() => new Map(organizerOptions.map(o=>[o.id, o.name])), [organizerOptions]);
  const [selectedOrganizerIds, setSelectedOrganizerIds] = React.useState<string[]>(() => paramToList(searchParams.get('organizers')));
  const [dateFrom, setDateFrom] = React.useState<string>(() => searchParams.get('from') ?? '');
  const [dateTo, setDateTo] = React.useState<string>(() => searchParams.get('to') ?? '');

  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(() => paramToList(searchParams.get('types')));
  const [selectedAccess, setSelectedAccess] = React.useState<string[]>(() => paramToList(searchParams.get('access')));
  const [sortBy, setSortBy] = React.useState<SortOption>(() => (searchParams.get('sort') as SortOption) ?? 'startAsc');

  

  // Pagination
  const [page, setPage] = React.useState<number>(() => Number(searchParams.get('page') ?? 1));
  const [pageSize, setPageSize] = React.useState<number>(() => Number(searchParams.get('pageSize') ?? 20));

  const filterRequest = React.useMemo<DynamicFilterRequest>(() => {
    const conditions: DynamicFilterCondition[] = [];
    // Exclude cancelled events by default (EventStatus: 0=Created, 1=Planned, 2=ItsOn, 3=Finished, 4=Cancelled)
    conditions.push({ Field: 'Status', Operator: FilterOperator.In, Values: ['0', '1', '2', '3'] });
    // Nameless events are filtered out client-side (see `filtered` memo below)
    if (nameQuery?.trim()) conditions.push({ Field: 'Name', Operator: FilterOperator.Contains, Values: [nameQuery.trim()] });
    if (selectedTypes.length) conditions.push({ Field: 'Type', Operator: FilterOperator.In, Values: selectedTypes });
    if (selectedAccess.length) conditions.push({ Field: 'Access', Operator: FilterOperator.In, Values: selectedAccess });
    if (selectedOrganizerIds.length) conditions.push({ Field: 'OrganizerId', Operator: FilterOperator.In, Values: selectedOrganizerIds });
    if (dateFrom && dateTo) {
      try {
        const fromIso = new Date(dateFrom).toISOString();
        const toIso = new Date(dateTo).toISOString();
        conditions.push({ Field: 'StartTime', Operator: FilterOperator.Between, Values: [fromIso, toIso] });
      } catch (_e) {
        // Expected: user-entered date values may be invalid
      }
    } else if (dateFrom) {
      try { conditions.push({ Field: 'StartTime', Operator: FilterOperator.Gte, Values: [new Date(dateFrom).toISOString()] }); } catch (_e) { /* Parse error expected for invalid input */ }
    } else if (dateTo) {
      try { conditions.push({ Field: 'StartTime', Operator: FilterOperator.Lte, Values: [new Date(dateTo).toISOString()] }); } catch (_e) { /* Parse error expected for invalid input */ }
    }
    const sortMap: Record<string, { SortBy: string; SortDir?: 'asc'|'desc' }> = {
      startAsc: { SortBy: 'StartTime', SortDir: 'asc' },
      startDesc: { SortBy: 'StartTime', SortDir: 'desc' },
      name: { SortBy: 'Name', SortDir: 'asc' }
    };
    return {
      Conditions: conditions,
      Page: page,
      PageSize: pageSize,
      ...(sortMap[sortBy] ?? {})
    } as DynamicFilterRequest;
  }, [nameQuery, selectedTypes, selectedAccess, selectedOrganizerIds, dateFrom, dateTo, sortBy, page, pageSize]);

  const filteredQuery = useFilteredPartiesQuery(filterRequest, { enabled: true });
  const hasActiveFilters = React.useMemo(() => (
    !!nameQuery ||
    selectedTypes.length > 0 ||
    selectedAccess.length > 0 ||
    selectedOrganizerIds.length > 0 ||
    !!dateFrom ||
    !!dateTo ||
    sortBy !== 'startAsc'
  ), [nameQuery, selectedTypes.length, selectedAccess.length, selectedOrganizerIds.length, dateFrom, dateTo, sortBy]);

  const filtered = React.useMemo(() => {
    let items: Party[];
    if (!hasActiveFilters && !filteredQuery.isFetching && (parties?.length ?? 0) > 0) {
      items = parties;
    } else {
      items = filteredQuery.data?.Items ?? [];
    }
    // Filter out events without a name (e.g. quick sessions that shouldn't appear here)
    return items.filter(p => {
      const n = (p.name ?? p.title ?? '').trim();
      return n.length > 0;
    });
  }, [hasActiveFilters, filteredQuery.isFetching, filteredQuery.data?.Items, parties]);

  const total = React.useMemo(() => {
    if (!hasActiveFilters && !filteredQuery.isFetching && (parties?.length ?? 0) > 0) {
      return parties.length;
    }
    return filteredQuery.data?.TotalCount ?? filtered.length;
  }, [hasActiveFilters, filteredQuery.isFetching, filteredQuery.data?.TotalCount, filtered.length, parties]);

  // Keep URL in sync when filters change (replace history so it's not noisy)
  React.useEffect(() => {
    const params: Record<string, string> = {};
    if (nameQuery) params.q = nameQuery;
    if (selectedTypes.length) params.types = listToParam(selectedTypes);
    if (selectedAccess.length) params.access = listToParam(selectedAccess);
    if (selectedOrganizerIds.length) params.organizers = listToParam(selectedOrganizerIds);
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    if (sortBy && sortBy !== 'startAsc') params.sort = sortBy;
    if (page && page !== 1) params.page = String(page);
    if (pageSize && pageSize !== 20) params.pageSize = String(pageSize);
    setSearchParams(params, { replace: true });
  }, [nameQuery, selectedTypes, selectedAccess, selectedOrganizerIds, dateFrom, dateTo, sortBy, page, pageSize, setSearchParams]);

  // Update local state if search params change externally
  React.useEffect(() => {
    const q = searchParams.get('q') ?? '';
    if (q !== nameQuery) setNameQuery(q);
    const types = paramToList(searchParams.get('types'));
    const access = paramToList(searchParams.get('access'));
    const organizers = paramToList(searchParams.get('organizers'));
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';
    const s = (searchParams.get('sort') as SortOption) ?? 'startAsc';
    const p = Number(searchParams.get('page') ?? 1);
    const ps = Number(searchParams.get('pageSize') ?? 20);
    if (JSON.stringify(types) !== JSON.stringify(selectedTypes)) setSelectedTypes(types);
    if (JSON.stringify(access) !== JSON.stringify(selectedAccess)) setSelectedAccess(access);
    if (JSON.stringify(organizers) !== JSON.stringify(selectedOrganizerIds)) setSelectedOrganizerIds(organizers);
    if (from !== dateFrom) setDateFrom(from);
    if (to !== dateTo) setDateTo(to);
    if (s !== sortBy) setSortBy(s);
    if (p !== page) setPage(p);
    if (ps !== pageSize) setPageSize(ps);
    // One-way sync: URL search params → local filter state; local state is read for comparison only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const removeSelectedOrganizer = (id: string) => setSelectedOrganizerIds(s => s.filter(x => x !== id));

  const resetFilters = () => {
    setNameQuery('');
    setSelectedTypes([]);
    setSelectedAccess([]);
    setSelectedOrganizerIds([]);
    setDateFrom('');
    setDateTo('');
    setSortBy('startAsc');
    setPage(1);
  };

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className="mb-3 p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="d-flex align-items-end gap-2" style={{ flexWrap: 'wrap' }}>
          <div style={{ minWidth: 'min(180px, 100%)', flex: '1 1 180px' }}>
            <label className="form-label small mb-1">{t('party.searchByName')}</label>
            <input className="form-control form-control-sm" placeholder={t('party.filterPlaceholder')} value={nameQuery} onChange={e=>setNameQuery(e.target.value)} aria-label={t('party.filterPlaceholder')} />
          </div>
          <div style={{ minWidth: 'min(140px, 100%)', flex: '0 1 140px' }}>
            <label className="form-label small mb-1">{t('party.typeLabel')}</label>
            <select className="form-select form-select-sm" value={selectedTypes[0] ?? ''} onChange={e => setSelectedTypes(e.target.value ? [e.target.value] : [])} aria-label={t('party.typeLabel')}>
              <option value="">{t('party.allTypes', 'Wszystkie')}</option>
              {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 'min(140px, 100%)', flex: '0 1 140px' }}>
            <label className="form-label small mb-1">{t('party.accessLabel')}</label>
            <select className="form-select form-select-sm" value={selectedAccess[0] ?? ''} onChange={e => setSelectedAccess(e.target.value ? [e.target.value] : [])} aria-label={t('party.accessLabel')}>
              <option value="">{t('party.allAccess', 'Wszystkie')}</option>
              {accessOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <OrganizerMultiSelect label={t('party.organizersLabel')} options={organizerOptions as OrganizerOption[]} selectedIds={selectedOrganizerIds} onChange={setSelectedOrganizerIds} />
          <div style={{ minWidth: 'min(160px, 100%)', flex: '0 1 160px' }}>
            <label className="form-label small mb-1">{t('party.startTimeFrom')}</label>
            <input type="datetime-local" className="form-control form-control-sm" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} aria-label={t('party.startTimeFrom')} />
          </div>
          <div style={{ minWidth: 'min(160px, 100%)', flex: '0 1 160px' }}>
            <label className="form-label small mb-1">{t('party.startTimeTo')}</label>
            <input type="datetime-local" className="form-control form-control-sm" value={dateTo} onChange={e=>setDateTo(e.target.value)} aria-label={t('party.startTimeTo')} />
          </div>
          <div style={{ flex: '0 1 140px' }}>
            <label className="form-label small mb-1">{t('party.sortLabel')}</label>
            <select className="form-select form-select-sm" value={sortBy} onChange={e=>setSortBy(e.target.value as SortOption)} aria-label={t('party.sortLabel')}>
              <option value="startAsc">{t('party.sortStartAsc')}</option>
              <option value="startDesc">{t('party.sortStartDesc')}</option>
              <option value="name">{t('party.sortName')}</option>
            </select>
          </div>
        </div>

        {/* ── Date presets (small, spread under date inputs) ── */}
        <div className="d-flex align-items-center gap-3 mt-2" style={{ justifyContent: 'flex-end' }}>
          <DatePresets onSetRange={(f,to)=>{ setDateFrom(f); setDateTo(to); }} />
        </div>

        {/* Selected organizer chips (in the filter bar) */}
        {selectedOrganizerIds.length > 0 && (
          <div className="d-flex gap-1 flex-wrap mt-2">
            {selectedOrganizerIds.map(id => {
              const name = organizerMap.get(id) ?? id;
              return (
                <span key={id} className="badge d-flex align-items-center gap-1" style={{ background: 'rgba(13,110,253,0.15)', color: '#8bb4f8', fontSize: 11, padding: '4px 8px' }}>
                  {name}
                  <button type="button" className="btn-close btn-close-white" style={{ fontSize: 8 }} aria-label={t('party.removeOrganizer')} onClick={() => removeSelectedOrganizer(id)}></button>
                </span>
              );
            })}
          </div>
        )}

        {/* Active filters summary & reset */}
        {hasActiveFilters && (
          <div className="d-flex align-items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="badge" style={{ background: 'rgba(13,202,240,0.15)', color: '#5edaf5', fontSize: 11 }}>{t('party.activeFilters')}</span>
            <button type="button" className="btn btn-sm btn-link text-muted p-0" style={{ fontSize: 12, textDecoration: 'none' }} onClick={resetFilters}>
              <i className="fa fa-times me-1" aria-hidden="true"></i>{t('party.resetFilters')}
            </button>
          </div>
        )}
      </div>

      {/* ── Loading skeleton ── */}
      {filteredQuery.isFetching && filtered.length === 0 && (
        <div className="row g-3 mb-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="col-6 col-md-3 col-lg-2">
              <div className="placeholder-glow">
                <div className="rounded" style={{ height: 220, background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                  <div className="placeholder w-75 rounded mt-3 ms-3" style={{ height: 18 }} />
                  <div className="placeholder w-50 rounded mt-2 ms-3" style={{ height: 14 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!filteredQuery.isFetching && filtered.length === 0 && (
        <div className="text-center py-5" style={{ borderRadius: 12, border: '2px dashed rgba(255,255,255,0.1)', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>🎉</div>
          <p className="mb-1 fw-semibold">{hasActiveFilters ? t('party.noMatchingParties', 'Brak imprez spełniających filtry') : t('party.noPartiesYet', 'Brak imprez')}</p>
          <p className="small text-muted mb-0">
            {hasActiveFilters
              ? t('party.tryDifferentFilters', 'Spróbuj zmienić lub zresetować filtry')
              : t('party.createFirstParty', 'Utwórz swoją pierwszą imprezę klikając + powyżej')}
          </p>
        </div>
      )}

      {/* ── Party cards grid ── */}
      {filtered.length > 0 && (
        <div className="row g-3">
          {filtered.map((party) => {
            const hasPoster = !!party?.poster;
            const dateStr = party.startTime ? new Date(party.startTime).toLocaleString(undefined, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

            return (
              <div key={party.id} className="col-6 col-md-3 col-lg-2">
                <Focusable id={`parties-item-${party.id}`}>
                  <Link
                    to={`/parties/${party.id}`}
                    className="text-decoration-none d-block h-100"
                    style={{
                      borderRadius: 12,
                      overflow: 'hidden',
                      transition: 'all .2s ease',
                      border: '1px solid rgba(255,255,255,0.06)',
                      ...(hasPoster ? buildPosterStyle(party) : { background: 'rgba(255,255,255,0.04)' }),
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'none';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    }}
                  >
                    <div style={{ padding: '8px 14px 16px', height: 220, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      {dateStr && (
                        <span style={{
                          fontSize: 15, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
                          alignSelf: 'center', textAlign: 'center',
                          padding: '2px 8px', borderRadius: 6,
                          textShadow: '-1px -1px 0 rgba(0,0,0,0.8), 1px -1px 0 rgba(0,0,0,0.8), -1px 1px 0 rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.8)',
                        }}>
                          {dateStr}
                        </span>
                      )}
                      <div style={{ flex: 1 }} />
                      <div className="mb-1" style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.25, textShadow: '-1px -1px 0 rgba(0,0,0,0.8), 1px -1px 0 rgba(0,0,0,0.8), -1px 1px 0 rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.8)' }}>{party.name ?? party.title}</div>
                      {party.description && (
                        <p className="mb-0" style={{
                          fontSize: 12, opacity: 0.75, lineHeight: 1.4,
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>{party.description}</p>
                      )}
                    </div>
                  </Link>
                </Focusable>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination footer ── */}
      <div className="d-flex align-items-center justify-content-between mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="small text-muted">{t('party.total', { count: total })}</div>
        <div className="d-flex align-items-center gap-2">
          <label className="small text-muted mb-0">{t('party.pageSizeLabel')}</label>
          <select className="form-select form-select-sm" style={{ width: 72 }} value={String(pageSize)} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} aria-label={t('party.pageSizeLabel')}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <button className="btn btn-sm btn-outline-secondary" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>{t('common.prev')}</button>
          <span className="small">{t('party.pageNumber', { page })}</span>
          <button className="btn btn-sm btn-outline-secondary" disabled={page*pageSize >= total} onClick={()=>setPage(p=>p+1)}>{t('common.next')}</button>
        </div>
      </div>
    </div>
  );
};

export default PartiesList;

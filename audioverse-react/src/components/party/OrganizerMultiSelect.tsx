import React from 'react';
import { useTranslation } from 'react-i18next';

export type OrganizerOption = { id: string; name: string };

const OrganizerMultiSelect: React.FC<{ label: string; options: OrganizerOption[]; selectedIds: string[]; onChange: (ids: string[]) => void }> = ({ label, options, selectedIds, onChange }) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const filtered = options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter(s => s !== id) : [...selectedIds, id]);
  return (
    <div style={{ minWidth: 'min(180px, 100%)', flex: '1 1 180px' }}>
      <label className="form-label small mb-1">{label}</label>
      <div className="position-relative" onBlur={() => setTimeout(()=>setOpen(false), 120)}>
        <input className="form-control form-control-sm" placeholder={t('party.searchUsers', `Search ${label.toLowerCase()}`)} value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>setOpen(true)} aria-label={`Search ${label}`} />
        {open && (
          <div className="mt-1 border rounded position-absolute w-100 shadow" style={{ maxHeight: 200, overflow: 'auto', zIndex: 10, background: 'var(--dropdown-bg, #1a1a1a)' }} role="listbox" aria-label={`${label} options`}>
            {filtered.map(opt => (
              <label key={opt.id} className="d-flex align-items-center px-2 py-1" style={{ cursor: 'pointer', color: 'var(--text-primary, #fff)' }}>
                <input type="checkbox" checked={selectedIds.includes(opt.id)} onChange={() => toggle(opt.id)} className="me-2" />
                <span>{opt.name}</span>
              </label>
            ))}
            {filtered.length === 0 && <div className="text-muted small px-2 py-1">{t('common.noMatches', 'No matches')}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerMultiSelect;

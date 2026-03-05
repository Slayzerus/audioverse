import React from 'react';
import { useTranslation } from 'react-i18next';

const MultiSearchSelect: React.FC<{ label: string; options: string[]; selected: string[]; onChange: (s: string[]) => void }> = ({ label, options, selected, onChange }) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));
  const toggle = (opt: string) => onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  return (
    <div className="me-2" style={{ minWidth: 180 }}>
      <label className="form-label small">{label}</label>
      <div className="border rounded p-2 bg-white" onBlur={() => setTimeout(()=>setOpen(false), 120)}>
        <div className="d-flex">
          <input className="form-control form-control-sm me-2" placeholder={`Search ${label.toLowerCase()}`} value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>setOpen(true)} aria-label={`Search ${label}`} />
          <button className="btn btn-sm btn-outline-secondary" type="button" onClick={()=>setOpen(o=>!o)} aria-expanded={open}>{selected.length} selected</button>
        </div>
        {open && (
          <div className="mt-2" style={{ maxHeight: 180, overflow: 'auto' }} role="listbox" aria-label={`${label} options`}>
            {filtered.map(opt => {
              const display = opt.includes(':') ? opt.split(':').slice(1).join(':') : opt;
              return (
                <label key={opt} className="d-flex align-items-center" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="me-2" />
                  <span>{display}</span>
                </label>
              );
            })}
            {filtered.length === 0 && <div className="text-muted small">{t('common.noMatches', 'No matches')}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSearchSelect;

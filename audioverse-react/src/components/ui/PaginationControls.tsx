import React from 'react';
import { useTranslation } from 'react-i18next';

const PaginationControls: React.FC<{ page: number; pageSize: number; total: number; onPageChange: (p:number)=>void; onPageSizeChange:(s:number)=>void }> = React.memo(function PaginationControls({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const { t } = useTranslation();
  return (
    <div className="d-flex align-items-center justify-content-between mt-3">
      <div className="small text-muted">Total: {total}</div>
      <div className="d-flex align-items-center">
        <label className="me-2 small">{t('pagination.pageSize')}</label>
        <select className="form-select form-select-sm me-3" style={{ width: 100 }} value={String(pageSize)} onChange={e=>onPageSizeChange(Number(e.target.value))}>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
        <button className="btn btn-sm btn-outline-secondary me-2" disabled={page<=1} onClick={()=>onPageChange(Math.max(1,page-1))}>{t('pagination.prev')}</button>
        <span className="small">Page {page}</span>
        <button className="btn btn-sm btn-outline-secondary ms-2" disabled={page*pageSize >= total} onClick={()=>onPageChange(page+1)}>{t('pagination.next')}</button>
      </div>
    </div>
  );
});
PaginationControls.displayName = "PaginationControls";

export default PaginationControls;

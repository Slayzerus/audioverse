import React from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../ui/ToastProvider';
import { postGrantPermission, postRevokePermission, postBulkGrantPermissions, postBulkRevokePermissions, usePlayerPermissionsQuery, usePermissionHistoryQuery } from '../../../scripts/api/apiKaraoke';
import { useQueryClient } from '@tanstack/react-query';
import styles from './permissionsPanel.module.css';

// Local bitmask flags (must match backend)
const PermissionFlags: Record<string, number> = {
  Invite: 1,
  ManageMusic: 2,
  Admit: 4,
  Moderate: 8,
};

interface Participant {
  id: number;
  name?: string;
  username?: string;
}

interface Props {
  partyId: number;
  participants: Participant[];
  isOrganizer: boolean;
}

const PermissionsPanel: React.FC<Props> = ({ partyId, participants, isOrganizer }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = React.useState<Record<number, boolean>>({});
  const [bulkPerm, setBulkPerm] = React.useState<string>('Invite');
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [toggleLoadingMap] = React.useState<Record<number, boolean>>({});

  // Permission history pagination
  const [historyPage, setHistoryPage] = React.useState<number>(1);
  const [historyPageSize, setHistoryPageSize] = React.useState<number>(10);
  const historyQ = usePermissionHistoryQuery(partyId, { page: historyPage, pageSize: historyPageSize });

  const toggleSelect = (id: number) => setSelected(s => ({ ...s, [id]: !s[id] }));

  const doBulk = async (grant: boolean) => {
    const items = Object.keys(selected).filter(k=>selected[Number(k)]).map(k=>({ playerId: Number(k), permission: bulkPerm }));
    if (!items.length) { showToast(t('party.permissions.noPlayersSelected'), 'error'); return; }
    setBulkLoading(true);
    try {
      if (grant) await postBulkGrantPermissions(partyId, items);
      else await postBulkRevokePermissions(partyId, items);
      showToast(grant ? t('party.permissions.bulkGrantDone') : t('party.permissions.bulkRevokeDone'), 'success');
      queryClient.invalidateQueries({ queryKey: ['party', 'permissions', partyId, 'history'] });
    } catch (_e) { showToast(t('party.permissions.bulkFailed'), 'error'); }
    setBulkLoading(false);
  };

  return (
    <div className={`card ${styles['av-permissions-panel']}`} aria-labelledby={`permissions-heading-${partyId}`}>
      <div className="card-body">
        <h5 className="card-title">{t('party.permissions.title')}</h5>
        <div className="mb-3">
          <label className="form-label">{t('party.permissions.bulkAction')}</label>
          <div className="d-flex" role="group" aria-label="Bulk permission actions" aria-busy={bulkLoading}>
            <select className="form-select me-2" value={bulkPerm} onChange={e=>setBulkPerm(e.target.value)} aria-label="Select permission to apply in bulk">
              {Object.keys(PermissionFlags).map(p=> <option key={p} value={p}>{p}</option>)}
            </select>
            <button className="btn btn-sm btn-success me-2" onClick={()=>doBulk(true)} disabled={!isOrganizer || bulkLoading} aria-label={`Grant ${bulkPerm} to selected`}>
              {bulkLoading ? t('party.permissions.working') : t('party.permissions.grantSelected')}
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={()=>doBulk(false)} disabled={!isOrganizer || bulkLoading} aria-label={`Revoke ${bulkPerm} from selected`}>
              {bulkLoading ? t('party.permissions.working') : t('party.permissions.revokeSelected')}
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}><table className="table table-sm" role="grid" aria-describedby={`permissions-caption-${partyId}`}>
          <caption id={`permissions-caption-${partyId}`} className="visually-hidden">Table of player permissions and controls</caption>
          <thead>
            <tr>
              <th scope="col" className={styles['col-select']} aria-label="select"> </th>
              <th scope="col">{t('party.permissions.player')}</th>
              {Object.keys(PermissionFlags).map(p=> <th key={p} scope="col">{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {participants.map(pl=> (
              <tr key={pl.id}>
                <td><input aria-label={`Select ${pl.name ?? pl.username ?? `#${pl.id}`}`} type="checkbox" checked={!!selected[pl.id]} onChange={()=>toggleSelect(pl.id)} /></td>
                <td>{pl.name ?? pl.username ?? `#${pl.id}`}</td>
                {Object.keys(PermissionFlags).map(p=> (
                  <td key={p}>
                    <PlayerPermissionCell playerName={pl.name ?? pl.username ?? `#${pl.id}`} partyId={partyId} playerId={pl.id} permission={p} isOrganizer={isOrganizer} busy={!!toggleLoadingMap[pl.id]} onToggleResult={()=>{ queryClient.invalidateQueries({ queryKey: ['party','permissions', partyId, pl.id] }); queryClient.invalidateQueries({ queryKey: ['party','permissions', partyId, 'history'] }); }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table></div>

        <div className="mt-3">
          <h6>{t('party.permissions.history')}</h6>
          {historyQ.isLoading ? <div className="text-muted">{t('party.permissions.loadingHistory')}</div> : (
            <>
              <div className="mb-2">{t('party.permissions.total', { count: historyQ.data?.TotalCount ?? 0 })}</div>
              <div style={{ overflowX: 'auto' }}><table className="table table-sm">
                <thead><tr><th>{t('party.permissions.when')}</th><th>{t('party.permissions.user')}</th><th>{t('party.permissions.action')}</th><th>{t('party.permissions.details')}</th></tr></thead>
                <tbody>
                  {(historyQ.data?.Items ?? []).map((it: unknown, idx:number)=> {
                    const rec = it as Record<string, unknown>;
                    return <tr key={idx}><td>{new Date(String(rec.Timestamp ?? rec.timestamp ?? rec.ChangedAt ?? '')).toLocaleString()}</td><td>{String(rec.UserId ?? rec.userId ?? '')}</td><td>{String(rec.Action ?? rec.action ?? '')}</td><td style={{maxWidth:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{JSON.stringify(rec.Details ?? rec.details ?? {})}</td></tr>;
                  })}
                </tbody>
              </table></div>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <button className="btn btn-sm btn-outline-secondary me-2" disabled={historyPage<=1} onClick={()=>setHistoryPage(p=>Math.max(1,p-1))}>{t('common.prev')}</button>
                  <button className="btn btn-sm btn-outline-secondary" disabled={(historyQ.data?.TotalCount ?? 0) <= historyPage * historyPageSize} onClick={()=>setHistoryPage(p=>p+1)}>{t('common.next')}</button>
                </div>
                <div>
                  <label className="form-label me-2">{t('party.permissions.pageSize')}</label>
                  <select className="form-select d-inline-block" style={{width:110}} value={historyPageSize} onChange={e=>{ setHistoryPageSize(Number(e.target.value)); setHistoryPage(1); }}>
                    {[5,10,20,50].map(n=> <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const PlayerPermissionCell: React.FC<{ partyId:number; playerId:number; permission:string; isOrganizer:boolean; busy?:boolean; onToggleResult?: ()=>void; playerName?: string }> = ({ partyId, playerId, permission, isOrganizer, busy, onToggleResult, playerName }) => {
  const { t } = useTranslation();
  const displayName = playerName ?? `#${playerId}`;
  const { data: perms } = usePlayerPermissionsQuery(partyId, playerId as number);
  const { showToast } = useToast();
  const [localBusy, setLocalBusy] = React.useState(false);

  const pval = perms ?? 0;
  const has = !!(pval & PermissionFlags[permission]);

  const onToggle = async () => {
    if (busy || localBusy) return;
    setLocalBusy(true);
    try {
      if (!isOrganizer) { showToast(t('party.permissions.requiresOrganizer'), 'error'); setLocalBusy(false); return; }
      if (has) await postRevokePermission(partyId, playerId, permission);
      else await postGrantPermission(partyId, playerId, permission);
      showToast(t('party.permissions.updated'), 'success');
      onToggleResult && onToggleResult();
    } catch (_e) { showToast(t('party.permissions.updateFailed'), 'error'); }
    setLocalBusy(false);
  };

  return <button aria-pressed={has} aria-label={`${permission} for ${displayName}`} className={`btn btn-sm ${has ? 'btn-success' : 'btn-outline-secondary'}`} onClick={onToggle} onKeyDown={(e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }} disabled={busy || localBusy}>{(busy || localBusy) ? '…' : (has ? t('common.yes') : t('common.no'))}</button>;
};

export default React.memo(PermissionsPanel);

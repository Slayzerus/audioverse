import React from "react";
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../ui/ConfirmProvider';
import type { KaraokeParty, KaraokePartyStatus, KaraokePlayer, KaraokeRoundPart, KaraokePartyRound } from '../../../models/modelsKaraoke';
import type { QueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

interface Props {
  show: boolean;
  roundId: number | null;
  onClose: () => void;
  partsPage: number;
  setPartsPage: React.Dispatch<React.SetStateAction<number>>;
  partsPageSize: number;
  partsSortBy: 'partNumber' | 'player';
  setPartsSortBy: React.Dispatch<React.SetStateAction<'partNumber' | 'player'>>;
  partsSortDir: 'asc' | 'desc';
  setPartsSortDir: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  editingPartKey: string | null;
  setEditingPartKey: React.Dispatch<React.SetStateAction<string | null>>;
  editingPlayerId: number | null;
  setEditingPlayerId: React.Dispatch<React.SetStateAction<number | null>>;
  newPartNumber: number;
  setNewPartNumber: React.Dispatch<React.SetStateAction<number>>;
  newPartPlayerId: number | null;
  setNewPartPlayerId: React.Dispatch<React.SetStateAction<number | null>>;
  status: KaraokePartyStatus | undefined;
  participants: KaraokePlayer[];
  party: KaraokeParty | undefined;
  userId: number | null | undefined;
  queryClient: QueryClient;
  addRoundPartMutation: UseMutationResult<{ roundPartId: number } & KaraokeRoundPart, unknown, Partial<KaraokeRoundPart>>;
}

const PartsModal: React.FC<Props> = ({
  show, roundId, onClose, partsPage, setPartsPage, partsPageSize,
  partsSortBy, setPartsSortBy, partsSortDir, setPartsSortDir,
  editingPartKey, setEditingPartKey, editingPlayerId, setEditingPlayerId,
  newPartNumber, setNewPartNumber, newPartPlayerId, setNewPartPlayerId,
  status, participants, party, userId, queryClient, addRoundPartMutation
}) => {
  const { t } = useTranslation();

  if (!show || roundId == null) return null;

  const confirm = useConfirm();

  const parts: KaraokeRoundPart[] = (status?.rounds ?? []).filter((r: KaraokePartyRound) => r.id === roundId).flatMap((r: KaraokePartyRound) => r.parts ?? []);
  if (!parts.length) {
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="parts-empty-title" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1050}} onClick={onClose}>
        <div className="card p-3" style={{width:520}} onClick={e => e.stopPropagation()}>
          <h5 id="parts-empty-title">{t('party.parts.title', { id: roundId })}</h5>
          <div className="d-flex justify-content-end">
            <button className="btn btn-secondary" onClick={onClose}>{t('common.close')}</button>
          </div>
        </div>
      </div>
    );
  }

  const sorted = [...parts].sort((a: KaraokeRoundPart, b: KaraokeRoundPart) => {
    if (partsSortBy === 'partNumber') return (a.partNumber - b.partNumber) * (partsSortDir === 'asc' ? 1 : -1);
    const an = a.playerId ? (participants.find((x: KaraokePlayer)=>x.id===a.playerId)?.name ?? `#${a.playerId}`) : '';
    const bn = b.playerId ? (participants.find((x: KaraokePlayer)=>x.id===b.playerId)?.name ?? `#${b.playerId}`) : '';
    return an.localeCompare(bn) * (partsSortDir === 'asc' ? 1 : -1);
  });
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / partsPageSize));
  const page = Math.min(Math.max(1, partsPage), pages);
  const pageItems = sorted.slice((page-1)*partsPageSize, page*partsPageSize);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="parts-title" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1050}} onClick={onClose}>
      <div className="card p-3" style={{width:520}} onClick={e => e.stopPropagation()}>
        <h5 id="parts-title">{t('party.parts.title', { id: roundId })}</h5>
        <div className="mb-2">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <div className="small text-muted">{t('party.parts.existing')}</div>
            <div className="d-flex align-items-center">
              <select className="form-select form-select-sm me-2" aria-label="Sort parts by" style={{width:120}} value={partsSortBy} onChange={e => setPartsSortBy(e.target.value as 'partNumber' | 'player')}>
                <option value="partNumber">{t('party.parts.sortNumber')}</option>
                <option value="player">{t('party.parts.sortPlayer')}</option>
              </select>
              <button className="btn btn-sm btn-outline-secondary" aria-label="Toggle sort direction" onClick={() => setPartsSortDir(d => d === 'asc' ? 'desc' : 'asc')}>{partsSortDir === 'asc' ? '↑' : '↓'}</button>
            </div>
          </div>

          <ul className="list-group mb-2">
            {pageItems.map((p: KaraokeRoundPart, i: number) => (
              <li key={p.id ?? i} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-bold">{t('party.parts.partNumber', { number: p.partNumber })}</div>
                  <div className="text-muted small">{p.playerId ? (participants.find((x: KaraokePlayer) => x.id === p.playerId)?.name ?? `#${p.playerId}`) : t('common.free')}</div>
                </div>
                <div className="d-flex align-items-center">
                  {!p.playerId ? (
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={async () => {
                      if (!party) return;
                      try {
                        await addRoundPartMutation.mutateAsync({ roundId: roundId, partNumber: p.partNumber, playerId: userId });
                        queryClient.invalidateQueries({ queryKey: ["karaoke", "party", party?.id, "status"] });
                      } catch (_e) { /* Best-effort — no action needed on failure */ }
                    }}>{t('party.parts.reserve')}</button>
                  ) : (
                    <>
                      {p.playerId === userId ? <span className="badge bg-success me-2">{t('common.mine')}</span> : <span className="badge bg-secondary me-2">{t('common.taken')}</span>}
                      {editingPartKey === `${roundId}:${p.partNumber}` ? (
                        <div className="d-flex align-items-center">
                          <input className="form-control form-control-sm me-2" aria-label="Player ID" style={{width:120}} type="number" value={editingPlayerId ?? ''} onChange={e => setEditingPlayerId(e.target.value ? Number(e.target.value) : null)} />
                          <button className="btn btn-sm btn-primary me-2" onClick={async () => {
                            try {
                              await addRoundPartMutation.mutateAsync({ roundId: roundId, partNumber: p.partNumber, playerId: editingPlayerId });
                              queryClient.invalidateQueries({ queryKey: ["karaoke", "party", party?.id, "status"] });
                            } catch (_e) { /* Best-effort — no action needed on failure */ }
                            setEditingPartKey(null);
                            setEditingPlayerId(null);
                          }}>{t('common.save')}</button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditingPartKey(null); setEditingPlayerId(null); }}>{t('common.cancel')}</button>
                        </div>
                      ) : (
                        <>
                          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => { setEditingPartKey(`${roundId}:${p.partNumber}`); setEditingPlayerId(p.playerId ?? null); }}>{t('common.edit')}</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={async () => {
                            try {
                              const ok = await confirm(t('party.parts.removeConfirm'));
                              if (!ok) return;
                            } catch (_e) { return; }
                            try {
                              await addRoundPartMutation.mutateAsync({ roundId: roundId, partNumber: p.partNumber, playerId: null });
                              queryClient.invalidateQueries({ queryKey: ["karaoke", "party", party?.id, "status"] });
                            } catch (_e) { /* Best-effort — no action needed on failure */ }
                          }}>{t('common.delete')}</button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="d-flex justify-content-between align-items-center">
            <div className="small text-muted">{t('common.page', { current: page, total: pages })}</div>
            <div>
              <button className="btn btn-sm btn-outline-secondary me-2" aria-label="Previous page" disabled={page<=1} onClick={() => setPartsPage(p => Math.max(1, p-1))}>◀</button>
              <button className="btn btn-sm btn-outline-secondary" aria-label="Next page" disabled={page>=pages} onClick={() => setPartsPage(p => Math.min(pages, p+1))}>▶</button>
            </div>
          </div>

        </div>

        <hr />

        <label className="form-label">{t('party.parts.addNew')}</label>
        <div className="mb-2">
          <label className="form-label">{t('party.parts.partNumberLabel')}</label>
          <input className="form-control form-control-sm mb-2" type="number" value={newPartNumber} onChange={e => setNewPartNumber(Number(e.target.value) || 1)} />
          <label className="form-label">{t('party.parts.playerIdOptional')}</label>
          <input className="form-control form-control-sm mb-2" type="number" value={newPartPlayerId ?? ''} onChange={e => setNewPartPlayerId(e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div className="d-flex justify-content-end">
          <button className="btn btn-secondary me-2" onClick={onClose}>{t('common.close')}</button>
          <button className="btn btn-primary" onClick={async () => {
            try {
              await addRoundPartMutation.mutateAsync({ roundId: roundId, partNumber: newPartNumber, playerId: newPartPlayerId });
              queryClient.invalidateQueries({ queryKey: ["karaoke", "party", party?.id, "status"] });
              onClose();
            } catch (_e) { /* Best-effort — no action needed on failure */ }
          }}>{t('party.parts.addPart')}</button>
        </div>
      </div>
    </div>
  );
};

export default PartsModal;

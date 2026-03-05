import React from "react";
import { useTranslation } from 'react-i18next';
import { useQueryClient } from "@tanstack/react-query";
import { useRoundPlayersQuery, useAddRoundPlayerMutation, useDeleteRoundPlayerMutation } from "../../../scripts/api/apiKaraoke";
import { ProfilePlayerService } from "../../../services/ProfilePlayerService";
import { useUser } from "../../../contexts/UserContext";
import { useToast } from "../../ui/ToastProvider";
import { KaraokeParty, KaraokeRoundPlayer, UserProfilePlayer, AddRoundPlayerRequest } from "../../../models/modelsKaraoke";

interface Props {
  show: boolean;
  roundId: number | null;
  onClose: () => void;
  party?: KaraokeParty;
}

const RoundPlayersModal: React.FC<Props> = ({ show, roundId, onClose, party: _party }) => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { currentUser } = useUser();
  const { data: players = [], isLoading: _isLoading } = useRoundPlayersQuery(Number(roundId ?? 0));
  const addMutation = useAddRoundPlayerMutation();
  const deleteMutation = useDeleteRoundPlayerMutation();

  const [profilePlayers, setProfilePlayers] = React.useState<UserProfilePlayer[]>([]);
  const [selectedProfilePlayerId, setSelectedProfilePlayerId] = React.useState<number | null>(null);
  const [manualPlayerId, setManualPlayerId] = React.useState<number | null>(null);
  const [slotInput, setSlotInput] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [selectedWaitingIds, setSelectedWaitingIds] = React.useState<number[]>([]);
  const [bulkSlotInput, setBulkSlotInput] = React.useState<number | null>(null);
  const [editingSlotId, setEditingSlotId] = React.useState<number | null>(null);
  const [editingSlotValue, setEditingSlotValue] = React.useState<number | null>(null);
  const [processingIds, setProcessingIds] = React.useState<number[]>([]);
  const { showToast } = useToast();

  const setProcessing = (id: number, on: boolean) => {
    setProcessingIds(prev => on ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id));
  };

  React.useEffect(() => {
    (async () => {
      try {
        const detectProfileId = (u: unknown): number | undefined => {
          const o = (u && typeof u === 'object' ? u : {}) as Record<string, unknown>;
          return (o.userProfileId ?? o.profileId ?? (o.userProfile as Record<string, unknown> | undefined)?.id ?? (o.profile as Record<string, unknown> | undefined)?.id ?? o.userId) as number | undefined;
        };
        const pid = detectProfileId(currentUser);
        if (pid) {
          const res = await ProfilePlayerService.getAll(pid);
          setProfilePlayers(res ?? []);
        }
      } catch (_e) { /* Expected: profile player fetch may fail if user is not authenticated */ }
    })();
  }, [currentUser]);

  if (!show || !roundId) return null;

  const waiting = (players ?? []).filter((p: KaraokeRoundPlayer) => p.slot == null);
  const approved = (players ?? []).filter((p: KaraokeRoundPlayer) => p.slot != null);

  const handleAdd = async () => {
    const pid = selectedProfilePlayerId ?? manualPlayerId;
    if (!pid) { showToast(t('party.roundPlayers.selectPlayerOrId')); return; }
    setBusy(true);
    try {
      const payload: AddRoundPlayerRequest = { playerId: pid, slot: slotInput };
      await addMutation.mutateAsync({ roundId, payload });
      qc.invalidateQueries({ queryKey: ['karaoke', 'round', roundId, 'players'] });
    } catch (_e) { showToast(t('party.roundPlayers.addError'), 'error'); }
    setBusy(false);
  };

  const handleBulkApprove = async () => {
    if (!selectedWaitingIds.length) return showToast(t('party.roundPlayers.selectToApprove'));
    if (bulkSlotInput == null) return showToast(t('party.roundPlayers.provideSlotNumber'));
    setBusy(true);
    try {
      for (const id of selectedWaitingIds) {
        const entry = waiting.find((w: KaraokeRoundPlayer) => w.id === id);
        if (!entry) continue;
        try {
          setProcessing(entry.id, true);
          await addMutation.mutateAsync({ roundId, payload: { playerId: entry.playerId, slot: bulkSlotInput } });
          await deleteMutation.mutateAsync({ roundId, id: entry.id });
          setProcessing(entry.id, false);
          } catch (_e) { showToast(t('party.roundPlayers.approveError'), 'error'); }
      }
      qc.invalidateQueries({ queryKey: ['karaoke', 'round', roundId, 'players'] });
      setSelectedWaitingIds([]);
    } finally { setBusy(false); }
  };

  const handleApprove = async (entry: KaraokeRoundPlayer) => {
    const slot = Number(prompt(t('party.roundPlayers.slotPrompt'), '1')) || 1;
    setBusy(true);
    try {
      setProcessing(entry.id, true);
      await addMutation.mutateAsync({ roundId, payload: { playerId: entry.playerId, slot } });
      await deleteMutation.mutateAsync({ roundId, id: entry.id });
      setProcessing(entry.id, false);
      qc.invalidateQueries({ queryKey: ['karaoke', 'round', roundId, 'players'] });
    } catch (_e) { showToast(t('party.roundPlayers.approveError'), 'error'); }
    setBusy(false);
  };

  const handleRemove = async (entry: KaraokeRoundPlayer) => {
    try {
      const ok = await confirm(t('party.roundPlayers.removeConfirm'));
      if (!ok) return;
    } catch (_e) { return; }
    setBusy(true);
    try {
      setProcessing(entry.id, true);
      await deleteMutation.mutateAsync({ roundId, id: entry.id });
      setProcessing(entry.id, false);
      qc.invalidateQueries({ queryKey: ['karaoke', 'round', roundId, 'players'] });
    } catch (_e) { showToast(t('party.roundPlayers.removeError'), 'error'); }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="round-players-title" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1050}} onClick={onClose}>
      <div className="card p-3 position-relative" style={{width:640}} onClick={e => e.stopPropagation()}>
        {/* toasts are shown via centralized ToastProvider */}
        <h5 id="round-players-title">{t('party.roundPlayers.title', { id: roundId })}</h5>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-2">
              <div className="small text-muted mb-1">{t('party.roundPlayers.waiting')}</div>
              <ul className="list-group mb-2">
                {waiting.map((w: KaraokeRoundPlayer) => (
                  <li key={w.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <input type="checkbox" className="form-check-input me-2" aria-label={`Select ${w.player?.name ?? w.playerId}`} checked={selectedWaitingIds.includes(w.id)} onChange={e => {
                        const checked = e.target.checked;
                        setSelectedWaitingIds(s => checked ? [...s, w.id] : s.filter(x => x !== w.id));
                      }} />
                      <div>
                        <div className="fw-bold">{w.player?.name ?? `#${w.playerId}`}</div>
                        <div className="text-muted small">ID: {w.playerId} • joined: {w.joinedAt ?? '—'}</div>
                      </div>
                    </div>
                    <div>
                      {processingIds.includes(w.id) ? (
                        <div className="d-inline-block me-2"><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span></div>
                      ) : null}
                      <button className="btn btn-sm btn-success me-2" disabled={busy || processingIds.includes(w.id)} onClick={() => handleApprove(w)}>{t('party.roundPlayers.approve')}</button>
                      <button className="btn btn-sm btn-outline-danger" disabled={busy || processingIds.includes(w.id)} onClick={() => handleRemove(w)}>{t('common.delete')}</button>
                    </div>
                  </li>
                ))}
                {waiting.length === 0 && <li className="list-group-item text-muted">{t('party.roundPlayers.noWaiting')}</li>}
              </ul>
              <div className="d-flex gap-2 mb-2 align-items-center">
                <input className="form-control form-control-sm" placeholder={t('party.roundPlayers.slotPlaceholder')} aria-label="Slot number for bulk approvals" type="number" value={bulkSlotInput ?? ''} onChange={e => setBulkSlotInput(e.target.value ? Number(e.target.value) : null)} style={{width:140}} />
                <button className="btn btn-sm btn-primary" disabled={busy || selectedWaitingIds.length===0 || bulkSlotInput==null} onClick={handleBulkApprove}>{t('party.roundPlayers.approveSelected')}</button>
                <div className="text-muted small ms-2">{t('common.selected', { count: selectedWaitingIds.length })}</div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-2">
              <div className="small text-muted mb-1">{t('party.roundPlayers.approved')}</div>
              <ul className="list-group mb-2">
                {approved.map((a: KaraokeRoundPlayer) => (
                  <li key={a.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{a.player?.name ?? `#${a.playerId}`}</div>
                      <div className="text-muted small">joined: {a.joinedAt ?? '—'}</div>
                    </div>
                    <div className="d-flex align-items-center">
                      {editingSlotId === a.id ? (
                        <>
                          <input className="form-control form-control-sm me-2" style={{width:100}} type="number" aria-label="Slot number" value={editingSlotValue ?? ''} onChange={e => setEditingSlotValue(e.target.value ? Number(e.target.value) : null)} />
                          <button className="btn btn-sm btn-primary me-2" disabled={busy} onClick={async () => {
                            if (editingSlotValue == null) { showToast(t('party.roundPlayers.provideSlotNumber'), 'error'); return; }
                            setBusy(true);
                            try {
                              await addMutation.mutateAsync({ roundId, payload: { playerId: a.playerId, slot: editingSlotValue } });
                              await deleteMutation.mutateAsync({ roundId, id: a.id });
                              qc.invalidateQueries({ queryKey: ['karaoke', 'round', roundId, 'players'] });
                            } catch (_e) { showToast(t('party.roundPlayers.slotUpdateError'), 'error'); }
                            setBusy(false);
                            setEditingSlotId(null);
                            setEditingSlotValue(null);
                          }}>{t('common.save')}</button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditingSlotId(null); setEditingSlotValue(null); }}>{t('common.cancel')}</button>
                        </>
                      ) : (
                        <>
                          <div className="me-3 small text-muted">Slot: <strong>{a.slot}</strong></div>
                          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => { setEditingSlotId(a.id); setEditingSlotValue(a.slot ?? null); }}>{t('party.roundPlayers.editSlot')}</button>
                          <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => handleRemove(a)}>{t('common.delete')}</button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
                {approved.length === 0 && <li className="list-group-item text-muted">{t('party.roundPlayers.noApproved')}</li>}
              </ul>
            </div>
          </div>
        </div>

        <hr />
        <div className="mb-2">
          <label className="form-label">{t('party.roundPlayers.addAssignment')}</label>
          <div className="d-flex gap-2">
            <select className="form-select form-select-sm" aria-label="Select player from profile" value={selectedProfilePlayerId ?? ''} onChange={e => setSelectedProfilePlayerId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">{t('party.roundPlayers.selectPlayer')}</option>
              {profilePlayers.map(p => <option key={p.id} value={p.id}>{p.name ?? `#${p.id}`}</option>)}
            </select>
            <input className="form-control form-control-sm" placeholder={t('party.roundPlayers.orTypePlayerId')} aria-label="Manual player ID" value={manualPlayerId ?? ''} onChange={e => setManualPlayerId(e.target.value ? Number(e.target.value) : null)} />
            <input className="form-control form-control-sm" placeholder={t('party.roundPlayers.slotOptional')} aria-label="Slot number" type="number" value={slotInput ?? ''} onChange={e => setSlotInput(e.target.value ? Number(e.target.value) : null)} style={{width:120}} />
            <button className="btn btn-sm btn-primary" disabled={busy} onClick={handleAdd}>{t('common.add')}</button>
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button className="btn btn-secondary me-2" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  );
};

export default RoundPlayersModal;

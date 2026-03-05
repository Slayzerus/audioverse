import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../ui/ToastProvider';
import { useSongVersionsQuery, useSongVersionQuery, useRevertSongVersionMutation, useSongQuery, useCollaboratorPermissionQuery } from '../../scripts/api/apiKaraoke';
import { useCurrentUserQuery } from '../../scripts/api/apiUser';

interface Props {
  songId?: number | null;
}

const VersionHistoryPanel: React.FC<Props> = ({ songId }) => {
  const { t } = useTranslation();
  const { data: versions } = useSongVersionsQuery(songId ?? NaN);
  const [selected, setSelected] = useState<number | null>(null);
  const { data: snapshot } = useSongVersionQuery(songId ?? NaN, selected ?? NaN);
  const revertMut = useRevertSongVersionMutation();
  const { data: currentUser } = useCurrentUserQuery();
  const { data: song } = useSongQuery(songId ?? NaN);
  const { data: collaboratorPermission } = useCollaboratorPermissionQuery(songId ??NaN, currentUser?.userId ?? NaN);
  const canManage = !!currentUser && (
    currentUser.isAdmin === true ||
    song?.ownerId === currentUser.userId ||
    song?.canBeModifiedByAll === true ||
    collaboratorPermission === 'Manage' ||
    collaboratorPermission === 2
  );
  const [reason, setReason] = useState('');

  const { showToast } = useToast();

  const doRevert = () => {
    if (!songId || selected == null) return;
    if (!canManage) { showToast(t('versionHistory.noPermission', 'No permission to revert'), 'error'); return; }
    revertMut.mutate({ songId, version: selected, reason });
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: 8, borderRadius: 6, marginTop: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('versionHistory.title', 'Version History')}</div>
      {!songId ? (
        <div style={{ color: '#666' }}>No `songId` provided — history unavailable for unsaved songs.</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ minWidth: 220 }}>
              {(versions || []).length === 0 ? <div style={{ color: '#888' }}>{t('versionHistory.noVersions', 'No versions')}</div> : (
                versions!.map(v => (
                  <div key={v.Version} style={{ padding: 6, borderBottom: '1px solid #eee', cursor: 'pointer', background: selected === v.Version ? '#f3f9ff' : 'transparent' }} onClick={() => setSelected(v.Version)}>
                    <div style={{ fontWeight: 600 }}>{v.Version}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{new Date(v.ChangedAt).toLocaleString()} — by {v.ChangedByUserId}</div>
                    {v.Reason && <div style={{ fontSize: 12, color: '#444' }}>{v.Reason}</div>}
                  </div>
                ))
              )}
            </div>

            <div style={{ flex: 1 }}>
              {selected == null ? <div style={{ color: '#888' }}>{t('versionHistory.selectVersion', 'Select version to preview')}</div> : (
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 600 }}>{t('versionHistory.previewJson', 'Preview (JSON)')}</div>
                  <pre style={{ maxHeight: 300, overflow: 'auto', background: '#0f172a', color: '#e6eef8', padding: 8 }}>{JSON.stringify(snapshot, null, 2)}</pre>
                  <div style={{ marginTop: 8 }}>
                    <input placeholder={t('versionHistory.revertReason', 'Reason for revert (optional)')} value={reason} onChange={e => setReason(e.target.value)} style={{ width: '100%' }} />
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={doRevert} disabled={!canManage || revertMut.isPending}>{revertMut.isPending ? t('versionHistory.reverting', 'Reverting...') : t('versionHistory.revert', 'Revert to this version')}</button>
                      {!canManage && <div style={{ color: '#666', fontSize: 13 }}>{t('versionHistory.noRevertPermission', "You don't have permission to revert this song.")}</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VersionHistoryPanel;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../ui/ToastProvider';
import { fetchUserSearch, useCollaboratorsQuery, useAddCollaboratorMutation, useRemoveCollaboratorMutation, useSongQuery, useCollaboratorPermissionQuery, useUpdateSongMutation } from '../../scripts/api/apiKaraoke';
import { useCurrentUserQuery } from '../../scripts/api/apiUser';
import { logger } from '../../utils/logger';
const log = logger.scoped('CollaboratorsPanel');

interface Props {
  songId?: number | null;
}

const CollaboratorsPanel: React.FC<Props> = ({ songId }) => {
  const { t } = useTranslation();
  const [term, setTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ Id: number; UserName: string; Email: string }>>([]);
  const { data: collabIds } = useCollaboratorsQuery(songId ?? NaN);
  const { data: currentUser } = useCurrentUserQuery();
  const addMut = useAddCollaboratorMutation();
  const removeMut = useRemoveCollaboratorMutation();
  const { data: song } = useSongQuery(songId ?? NaN);
  const updateMut = useUpdateSongMutation();
  const { data: collaboratorPermission } = useCollaboratorPermissionQuery(songId ?? NaN, currentUser?.userId ?? NaN);

  const isOwnerOrAdmin = !!currentUser && (currentUser.isAdmin === true || song?.ownerId === currentUser.userId);

  const doSearch = async () => {
    if (!term || term.trim().length < 3) return setSearchResults([]);
    try {
      const res = await fetchUserSearch(term.trim());
      setSearchResults(res);
    } catch (e) {
      log.warn('User search failed', e);
      setSearchResults([]);
    }
  };

  const canManage = !!currentUser && (
    currentUser.isAdmin === true ||
    song?.ownerId === currentUser.userId ||
    song?.canBeModifiedByAll === true ||
    collaboratorPermission === 'Manage' ||
    collaboratorPermission === 2
  );

  const { showToast } = useToast();

  const handleAdd = async (userId: number) => {
    if (!songId) return;
    if (!canManage) { showToast(t('collaborators.noPermission'), 'error'); return; }
    addMut.mutate({ songId, payload: { userId, permission: 'Write' } });
  };

  const handleRemove = async (userId: number) => {
    if (!songId) return;
    if (!canManage) { showToast(t('collaborators.noPermission'), 'error'); return; }
    removeMut.mutate({ songId, userId });
  };

  return (
    <div style={{ border: '1px solid var(--border-color, #ddd)', padding: 8, borderRadius: 6, marginTop: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('collaborators.title')}</div>
      {!songId ? (
        <div style={{ color: 'var(--text-secondary, #666)' }}>No `songId` provided — collaborators unavailable for unsaved songs.</div>
      ) : (
        <>
          <div style={{ marginBottom: 8 }}>
            <input placeholder={t('collaborators.searchPlaceholder')} value={term} onChange={e => setTerm(e.target.value)} style={{ width: 240 }} />
            <button onClick={doSearch} style={{ marginLeft: 8 }}>{t('collaborators.search')}</button>
          </div>

          <div style={{ marginBottom: 8 }}>
            {!canManage && <div style={{ color: '#666', marginBottom: 8 }}>{t('collaborators.noPermission', "You don't have permission to manage collaborators for this song.")}</div>}
            {isOwnerOrAdmin && songId != null && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={!!song?.canBeModifiedByAll}
                    disabled={updateMut.isPending}
                    onChange={(e) => {
                      const newVal = e.target.checked;
                      if (!songId) return;
                      updateMut.mutate({ songId, payload: { canBeModifiedByAll: newVal } });
                    }}
                  />
                  <div style={{ fontSize: 13 }}>{t('collaborators.allowAll', 'Allow everyone to modify this song')}</div>
                </label>
                {updateMut.isPending && <div style={{ color: '#666', fontSize: 13 }}>Updating...</div>}
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--text-secondary, #666)', marginBottom: 6 }}>{t('collaborators.currentCollaborators', 'Current collaborators')}:</div>
            <div>
              {(collabIds || []).length === 0 ? <div style={{ color: '#888' }}>{t('collaborators.none', 'None')}</div> : (
                (collabIds || []).map((id: number) => (
                  <div key={id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontFamily: 'monospace' }}>{id}</div>
                    <button onClick={() => handleRemove(id)} style={{ marginLeft: 'auto' }} disabled={!canManage}>{t('collaborators.remove')}</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            {searchResults.length === 0 ? <div style={{ color: 'var(--muted, #888)' }}>{t('collaborators.noResults', 'No search results')}</div> : (
              searchResults.map(r => (
                <div key={r.Id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{r.UserName}</div><div style={{ fontSize: 12, color: 'var(--text-secondary, #666)' }}>{r.Email}</div></div>
                  <button onClick={() => handleAdd(r.Id)} disabled={!canManage}>{t('collaborators.addWrite')}</button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CollaboratorsPanel;

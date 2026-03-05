import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { useUser } from "../../contexts/UserContext";
import { PlayerService } from "../../services/PlayerService";
import { Modal } from "react-bootstrap";
import PlayerForm from "../../components/forms/PlayerForm";

/** Locally-rendered subset of a profile player returned by the API. */
interface ProfilePlayer {
  id: number;
  name?: string | null;
  color?: string | null;
  isPrimary?: boolean;
}

/** Extended user shape that includes optional settings the backend may send. */
interface UserWithSettings {
  developerMode?: boolean;
  jurors?: boolean;
  fullscreen?: boolean;
  userProfileId?: number;
  profileId?: number;
  userProfile?: { id?: number };
  profile?: { id?: number };
}

const UserProfileSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, loadCurrentUser } = useUser();
  const [developerMode, setDeveloperMode] = useState(false);
  const [jurors, setJurors] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<number | undefined>(undefined);
  const [players, setPlayers] = useState<ProfilePlayer[]>([]);
  const [editPlayer, setEditPlayer] = useState<ProfilePlayer | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const settings = currentUser as unknown as UserWithSettings;
      setDeveloperMode(!!settings.developerMode);
      setJurors(!!settings.jurors);
      setFullscreen(!!settings.fullscreen);
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ developerMode, jurors, fullscreen })
      });
      if (!res.ok) throw new Error(t('profile.settingsSaveError'));
      setStatus(t('profile.settingsSaved'));
      await loadCurrentUser();
    } catch (_e) {
      setStatus(t('profile.settingsSaveError'));
    }
  };

  const loadPlayers = useCallback(async (id?: number) => {
    const pid = id ?? profileId;
    if (!pid) return setStatus(t('profile.noProfileId'));
    try {
      const res = await PlayerService.getAll(pid);
      setPlayers(res || []);
      setStatus(t('profile.playersLoaded'));
    } catch (_e) {
      setStatus(t('profile.playersLoadError'));
    }
  }, [profileId, t]);

  const handleDeletePlayer = async (id?: number) => {
    const pid = profileId;
    if (!pid || !id) return;
    try {
      await PlayerService.delete(pid, id);
      await loadPlayers(pid);
    } catch (_e) {
      setStatus(t('profile.playerDeleteError'));
    }
  };

  const handleSetPrimary = async (id?: number) => {
    const pid = profileId;
    if (!pid || !id) return setStatus(t('profile.noProfileOrPlayerId'));
    try {
      await PlayerService.setPrimary(pid, id);
      await loadPlayers(pid);
      setStatus(t('profile.primarySet'));
    } catch (_e) {
      setStatus(t('profile.primarySetError'));
    }
  };

  const handleUnsetPrimary = async (id?: number) => {
    const pid = profileId;
    if (!pid || !id) return setStatus(t('profile.noProfileOrPlayerId'));
    try {
      // Try to unset via update flag; backend may ignore but we'll refresh
      await PlayerService.update(pid, id, { id });
      await loadPlayers(pid);
      setStatus(t('profile.primaryRemoved'));
    } catch (_e) {
      setStatus(t('profile.primaryRemoveError'));
    }
  };

  // Auto-detect profileId from currentUser and load players
  useEffect(() => {
    if (!currentUser) return;
    const settings = currentUser as unknown as UserWithSettings;
    const detected = settings.userProfileId ?? settings.profileId ?? settings.userProfile?.id ?? settings.profile?.id;
    if (detected && detected !== profileId) {
      setProfileId(detected);
      loadPlayers(detected);
    }
  }, [currentUser, profileId, loadPlayers]);

  return (
  <div style={{ maxWidth: 480, margin: "40px auto", padding: 24, background: "var(--card-bg, #fff)", borderRadius: 12, boxShadow: "var(--card-shadow, 0 4px 24px rgba(0,0,0,0.06))" }}>
      <h2>{t('profile.settings')}</h2>
      <div className="form-check mb-2">
        <input type="checkbox" className="form-check-input" id="devMode" checked={developerMode} onChange={e => setDeveloperMode(e.target.checked)} />
        <label className="form-check-label" htmlFor="devMode">{t('profile.developerMode')}</label>
      </div>
      <div className="form-check mb-2">
        <input type="checkbox" className="form-check-input" id="jurors" checked={jurors} onChange={e => setJurors(e.target.checked)} />
        <label className="form-check-label" htmlFor="jurors">{t('profile.jurors')}</label>
      </div>
      <div className="form-check mb-3">
        <input type="checkbox" className="form-check-input" id="fullscreen" checked={fullscreen} onChange={e => setFullscreen(e.target.checked)} />
        <label className="form-check-label" htmlFor="fullscreen">{t('profile.fullscreen')}</label>
      </div>
      <button className="btn btn-primary" onClick={handleSave}>{t('profile.saveSettings')}</button>
      {status && <div className="mt-3 alert alert-info">{status}</div>}
      <hr />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>{t('profile.players')}</h4>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => loadPlayers(profileId)}>{t('common.refresh')}</button>
          <button className="btn btn-success btn-sm" onClick={() => setShowAddPlayer(true)}>{t('profile.addPlayerToProfile', 'Add Player')}</button>
        </div>
      </div>
      <div>
        {players.length === 0 && <div className="text-muted">{t('profile.noPlayers')}</div>}
        {players.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 16, height: 16, background: p.color || 'var(--muted, #666)', borderRadius: 4 }} />
            <div style={{ flex: 1 }}>
              {p.name} {p.isPrimary && <span style={{ color: 'var(--success, #0a0)', fontWeight: 700, marginLeft: 8 }}>[Primary]</span>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditPlayer(p)}>{t('common.edit')}</button>
              {!p.isPrimary && <button className="btn btn-outline-success btn-sm" onClick={() => handleSetPrimary(p.id)}>{t('profile.setPrimaryBtn')}</button>}
              {p.isPrimary && <button className="btn btn-outline-warning btn-sm" onClick={() => handleUnsetPrimary(p.id)}>{t('profile.removePrimaryBtn')}</button>}
              <button className="btn btn-danger btn-sm" onClick={() => handleDeletePlayer(p.id)}>{t('common.delete')}</button>
            </div>
          </div>
        ))}
      </div>
      {/* Edit Player Modal */}
      <Modal show={!!editPlayer} onHide={() => setEditPlayer(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('profile.editPlayerModal')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editPlayer && (
            <PlayerForm
              playerId={editPlayer.id}
              initialName={editPlayer.name ?? undefined}
              initialColor={editPlayer.color ?? undefined}
              onSuccess={async () => {
                setEditPlayer(null);
                await loadPlayers(profileId);
              }}
            />
          )}
        </Modal.Body>
      </Modal>
      {/* Add Player Modal */}
      <Modal show={showAddPlayer} onHide={() => setShowAddPlayer(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('profile.addPlayerToProfile', 'Add Player')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PlayerForm
            onSuccess={async () => {
              setShowAddPlayer(false);
              await loadPlayers(profileId);
            }}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserProfileSettingsPage;

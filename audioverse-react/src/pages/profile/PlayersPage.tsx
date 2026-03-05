import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from 'react-bootstrap';
import { FaCrown, FaEdit, FaTrash, FaStar, FaPlus, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useUser } from '../../contexts/UserContext';
import { PlayerService } from '../../services/PlayerService';
import PlayerForm from '../../components/forms/PlayerForm';
import { API_ROOT } from '../../config/apiConfig';
import { MINI_GAMES } from '../games/mini/gameRegistry';
import styles from './PlayersPage.module.css';

interface ProfilePlayer {
  id: number;
  name?: string | null;
  color?: string | null;
  icon?: string | null;
  photoUrl?: string | null;
  isPrimary?: boolean;
}

/** Per-game stats stored in localStorage */
interface GameStat {
  gameId: string;
  played: number;
  wins: number;
  lastPlayed?: string;
}

const GAME_STATS_KEY = 'miniGamePlayerStats';

function loadGameStats(): Record<number, GameStat[]> {
  try {
    const raw = localStorage.getItem(GAME_STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { /* Expected: localStorage or JSON.parse may fail */ return {}; }
}

const PlayersPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, userId } = useUser();
  const [players, setPlayers] = useState<ProfilePlayer[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editPlayer, setEditPlayer] = useState<ProfilePlayer | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [gameStats] = useState(() => loadGameStats());

  const getProfileId = useCallback((): number | undefined => {
    if (userId) return userId;
    if (!currentUser) return undefined;
    return currentUser.userId ?? undefined;
  }, [currentUser, userId]);

  const loadPlayers = useCallback(async () => {
    const pid = getProfileId();
    if (!pid) return;
    try {
      const res = await PlayerService.getAll(pid);
      setPlayers(res || []);
    } catch { /* Expected: profile player fetch may fail */ }
  }, [getProfileId]);

  useEffect(() => { loadPlayers(); }, [loadPlayers]);

  const handleDelete = async (id: number) => {
    const pid = getProfileId();
    if (!pid) return;
    try {
      await PlayerService.delete(pid, id);
      await loadPlayers();
    } catch { /* Expected: player delete may fail */ }
  };

  const handleSetPrimary = async (id: number) => {
    const pid = getProfileId();
    if (!pid) return;
    try {
      await PlayerService.setPrimary(pid, id);
      await loadPlayers();
    } catch { /* Expected: setPrimary may fail */ }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getPlayerStats = (playerId: number): GameStat[] => {
    return gameStats[playerId] || [];
  };

  /** Get a photo URL for a player, checking both photoUrl field and the API endpoint */
  const getPlayerPhoto = (p: ProfilePlayer): string | null => {
    if (p.photoUrl) return `${API_ROOT}${p.photoUrl}`;
    return null;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('playersPage.title', 'Players')}</h2>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>
          <FaPlus style={{ marginRight: 6 }} />
          {t('playersPage.addPlayer', 'Add Player')}
        </button>
      </div>

      {players.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎤</div>
          <div className={styles.emptyText}>
            {t('playersPage.noPlayers', 'No players yet. Add a player to get started!')}
          </div>
        </div>
      )}

      <div className={styles.playerGrid}>
        {players.map(p => {
          const stats = getPlayerStats(p.id);
          const expanded = expandedId === p.id;
          const photo = getPlayerPhoto(p);
          const playerColor = p.color || '#6c63ff';

          return (
            <div
              key={p.id}
              className={styles.playerCard}
              style={{ borderLeftColor: playerColor }}
            >
              {/* Avatar area */}
              <div className={styles.avatarRow}>
                <div className={styles.avatar} style={{ background: photo ? `url(${photo}) center/cover no-repeat` : playerColor }}>
                  {!photo && (p.icon ? <i className={`fa ${p.icon}`} /> : <span>{(p.name || 'P')[0].toUpperCase()}</span>)}
                </div>
                <div className={styles.playerInfo}>
                  <div className={styles.playerName}>
                    {p.name || `Player ${p.id}`}
                    {p.isPrimary && (
                      <span className={styles.primaryBadge} title={t('playersPage.primary', 'Primary')}>
                        <FaCrown />
                      </span>
                    )}
                  </div>
                  <div className={styles.playerColor}>
                    <span className={styles.colorSwatch} style={{ background: playerColor }} />
                    {playerColor}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button className={styles.actionBtn} onClick={() => setEditPlayer(p)} title={t('common.edit', 'Edit')}>
                  <FaEdit />
                </button>
                {!p.isPrimary && (
                  <button className={`${styles.actionBtn} ${styles.actionPrimary}`} onClick={() => handleSetPrimary(p.id)} title={t('playersPage.setPrimary', 'Set Primary')}>
                    <FaStar />
                  </button>
                )}
                <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => handleDelete(p.id)} title={t('common.delete', 'Delete')}>
                  <FaTrash />
                </button>
              </div>

              {/* Expand toggle for game stats */}
              <button className={styles.expandToggle} onClick={() => toggleExpand(p.id)}>
                {expanded ? <FaChevronUp /> : <FaChevronDown />}
                <span>{t('playersPage.gameHistory', 'Game History')}</span>
              </button>

              {expanded && (
                <div className={styles.gameConfigs}>
                  {stats.length === 0 ? (
                    <div className={styles.noStats}>
                      {t('playersPage.noGamesPlayed', 'No games played yet')}
                      <div className={styles.noStatsHint}>
                        {t('playersPage.gamesAvailable', '{{count}} games available — stats will appear after playing', { count: MINI_GAMES.length })}
                      </div>
                    </div>
                  ) : (
                    stats.map(s => {
                      const gameMeta = MINI_GAMES.find(g => g.id === s.gameId);
                      return (
                        <div key={s.gameId} className={styles.gameConfigItem}>
                          <span className={styles.gameIcon}>{gameMeta?.icon || '🎮'}</span>
                          <span className={styles.gameName}>{gameMeta?.title || s.gameId}</span>
                          <span className={styles.gameStats}>
                            {t('playersPage.played', 'Played')}: {s.played} &middot;{' '}
                            {t('playersPage.wins', 'Wins')}: {s.wins}
                            {s.lastPlayed && <> &middot; {new Date(s.lastPlayed).toLocaleDateString()}</>}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Player Modal */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)} size="lg" centered dialogClassName={styles.darkModal}>
        <Modal.Header closeButton className={styles.modalHeader}>
          <Modal.Title>{t('playersPage.addPlayer', 'Add Player')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          <PlayerForm
            onSuccess={async () => { setShowAdd(false); await loadPlayers(); }}
          />
        </Modal.Body>
      </Modal>

      {/* Edit Player Modal */}
      <Modal show={!!editPlayer} onHide={() => setEditPlayer(null)} size="lg" centered dialogClassName={styles.darkModal}>
        <Modal.Header closeButton className={styles.modalHeader}>
          <Modal.Title>{t('playersPage.editPlayer', 'Edit Player')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          {editPlayer && (
            <PlayerForm
              playerId={editPlayer.id}
              initialName={editPlayer.name ?? undefined}
              initialColor={editPlayer.color ?? undefined}
              onSuccess={async () => { setEditPlayer(null); await loadPlayers(); }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default PlayersPage;

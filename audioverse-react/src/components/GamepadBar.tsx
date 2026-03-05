/**
 * GamepadBar — fixed bar below the Navbar showing connected / available gamepads.
 *
 * Visible only when at least one gamepad is detected by the browser.
 * Each pad shows a FontAwesome gamepad icon colored by the assigned player.
 * Clicking a pad opens an inline 1-position carousel with left/right arrows
 * to pick a profile player. A check icon shows the assigned player.
 * Pressing gamepad Y opens the PlayerForm for the assigned player.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaGamepad, FaCheck, FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import { useMiniGameLobby, type ProfilePlayerInfo } from '../contexts/MiniGameLobbyContext';
import PlayerForm from './forms/PlayerForm';
import styles from './GamepadBar.module.css';

/** Internal state for each gamepad slot (up to 4 displayed) */
interface PadSlotState {
  index: number;
  connected: boolean;
  /** Assigned profile player id */
  profilePlayerId?: number;
}

const MAX_PADS = 4;

const GamepadBar: React.FC = () => {
  const { t } = useTranslation();
  const { profilePlayers, reloadProfilePlayers } = useMiniGameLobby();
  const [pads, setPads] = useState<PadSlotState[]>([]);
  const [anyConnected, setAnyConnected] = useState(false);
  const [selectedPadIndex, setSelectedPadIndex] = useState<number | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0); // current position in carousel
  const [editPlayer, setEditPlayer] = useState<ProfilePlayerInfo | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const prevButtonsRef = useRef<Map<number, boolean[]>>(new Map());
  const padsRef = useRef<PadSlotState[]>(pads);
  padsRef.current = pads;

  const profilePlayersRef = useRef(profilePlayers);
  profilePlayersRef.current = profilePlayers;

  /** Poll gamepads */
  useEffect(() => {
    let raf: number;

    const poll = () => {
      const raw = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
      let found = false;

      for (let i = 0; i < MAX_PADS; i++) {
        if (raw[i]) { found = true; break; }
      }

      setPads(prev => {
        let changed = false;
        const result: PadSlotState[] = [];
        for (let i = 0; i < MAX_PADS; i++) {
          const connected = !!raw[i];
          const old = prev[i];
          if (old && old.connected === connected) {
            result.push(old);
          } else {
            changed = true;
            result.push({ index: i, connected, profilePlayerId: old?.profilePlayerId });
          }
        }
        if (!changed && prev.length === MAX_PADS) return prev;
        return result;
      });
      setAnyConnected(found);

      // Check Y button (index 3) for opening edit form
      const currentPads = padsRef.current;
      const currentPlayers = profilePlayersRef.current;
      for (let i = 0; i < MAX_PADS; i++) {
        const gp = raw[i];
        if (!gp) continue;
        const yPressed = gp.buttons[3]?.pressed;
        const prevButtons = prevButtonsRef.current.get(i);
        const wasYPressed = prevButtons?.[3] ?? false;

        if (yPressed && !wasYPressed) {
          const padState = currentPads[i];
          if (padState?.profilePlayerId) {
            const player = currentPlayers.find(p => p.id === padState.profilePlayerId);
            if (player) setEditPlayer(player);
          }
        }

        prevButtonsRef.current.set(i, gp.buttons.map(b => b.pressed));
      }

      raf = requestAnimationFrame(poll);
    };

    poll();
    return () => cancelAnimationFrame(raf);
  }, []);

  /** Don't render at all if no gamepad ever connected */
  if (!anyConnected) return null;

  const assignPlayer = (padIndex: number, playerId: number) => {
    setPads(prev => prev.map((p, i) => i === padIndex ? { ...p, profilePlayerId: playerId } : p));
    setSelectedPadIndex(null); // Close carousel after assignment
  };

  const getAssignedPlayer = (padIndex: number): ProfilePlayerInfo | undefined => {
    const pid = pads[padIndex]?.profilePlayerId;
    if (!pid) return undefined;
    return profilePlayers.find(p => p.id === pid);
  };

  const handlePadClick = (padIndex: number) => {
    if (selectedPadIndex === padIndex) {
      // Already open — clicking again confirms current selection
      if (profilePlayers.length > 0) {
        const idx = carouselIdx % profilePlayers.length;
        assignPlayer(padIndex, profilePlayers[idx].id);
      }
      setSelectedPadIndex(null);
    } else {
      // Open carousel for this pad
      setSelectedPadIndex(padIndex);
      // If pad has assigned player, start carousel at that player
      const assigned = getAssignedPlayer(padIndex);
      const startIdx = assigned ? profilePlayers.findIndex(p => p.id === assigned.id) : 0;
      setCarouselIdx(Math.max(0, startIdx));
    }
  };

  const cycleCarousel = (direction: 1 | -1) => {
    if (profilePlayers.length === 0) return;
    setCarouselIdx(prev => {
      let next = prev + direction;
      if (next < 0) next = profilePlayers.length - 1;
      if (next >= profilePlayers.length) next = 0;
      return next;
    });
  };

  const carouselPlayer = profilePlayers.length > 0
    ? profilePlayers[carouselIdx % profilePlayers.length]
    : null;

  return (
    <>
      <div className={styles.bar}>
        {/* Gamepad slots */}
        {pads.map(pad => {
          const assigned = getAssignedPlayer(pad.index);
          const isSelected = selectedPadIndex === pad.index;
          const iconColor = assigned?.color ?? undefined;
          return (
            <div
              key={pad.index}
              className={`${styles.padSlot} ${isSelected ? styles.padSlotSelected : ''}`}
              onClick={() => handlePadClick(pad.index)}
            >
              <FaGamepad
                className={`${styles.padIcon} ${
                  !pad.connected ? styles.padDisconnected
                  : assigned ? styles.padAssigned
                  : styles.padConnected
                }`}
                style={iconColor ? { color: iconColor } : undefined}
              />
              <span className={`${styles.padLabel} ${pad.connected ? styles.padLabelConnected : ''}`}>
                {assigned ? assigned.name : `Pad ${pad.index + 1}`}
              </span>
              {assigned && <FaCheck className={styles.checkIcon} />}
            </div>
          );
        })}

        <div className={styles.separator} />

        {/* Inline 1-position carousel — visible when a pad is selected */}
        {selectedPadIndex !== null && profilePlayers.length > 0 && (
          <div className={styles.carousel}>
            <button
              className={styles.carouselArrow}
              onClick={(e) => { e.stopPropagation(); cycleCarousel(-1); }}
              title={t('gamepadBar.prev', 'Previous')}
            >
              <FaChevronLeft />
            </button>

            {carouselPlayer && (
              <div
                className={`${styles.carouselItem} ${
                  pads[selectedPadIndex]?.profilePlayerId === carouselPlayer.id
                    ? styles.carouselItemActive
                    : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  assignPlayer(selectedPadIndex, carouselPlayer.id);
                }}
              >
                <div className={styles.carouselDot} style={{ background: carouselPlayer.color }} />
                {carouselPlayer.name}
              </div>
            )}

            <button
              className={styles.carouselArrow}
              onClick={(e) => { e.stopPropagation(); cycleCarousel(1); }}
              title={t('gamepadBar.next', 'Next')}
            >
              <FaChevronRight />
            </button>

            <button
              className={styles.addNewBtn}
              onClick={(e) => { e.stopPropagation(); setShowAddPlayer(true); }}
            >
              <FaPlus style={{ marginRight: 4 }} />
              {t('gamepadBar.newPlayer', 'New')}
            </button>
          </div>
        )}

        {selectedPadIndex !== null && profilePlayers.length === 0 && (
          <div className={styles.carousel}>
            <button
              className={styles.addNewBtn}
              onClick={(e) => { e.stopPropagation(); setShowAddPlayer(true); }}
            >
              <FaPlus style={{ marginRight: 4 }} />
              {t('gamepadBar.createFirstPlayer', 'Create player')}
            </button>
          </div>
        )}

        {selectedPadIndex === null && (
          <span className={styles.hint}>
            {t('gamepadBar.hint', 'Click a pad to assign a player · Y to edit')}
          </span>
        )}
      </div>

      {/* Edit Player Modal */}
      <Modal show={!!editPlayer} onHide={() => setEditPlayer(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('gamepadBar.editPlayer', 'Edit Player')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editPlayer && (
            <PlayerForm
              playerId={editPlayer.id}
              initialName={editPlayer.name}
              initialColor={editPlayer.color}
              onSuccess={async () => { setEditPlayer(null); await reloadProfilePlayers(); }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Add Player Modal */}
      <Modal show={showAddPlayer} onHide={() => setShowAddPlayer(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('gamepadBar.addPlayer', 'Add Player')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PlayerForm
            onSuccess={async () => { setShowAddPlayer(false); await reloadProfilePlayers(); }}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default GamepadBar;

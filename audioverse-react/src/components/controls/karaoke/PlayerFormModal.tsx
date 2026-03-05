import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "react-bootstrap";
import PlayerForm from "../../forms/PlayerForm";
import { useGameContext } from "../../../contexts/GameContext";
import { logger } from "../../../utils/logger";
const log = logger.scoped('PlayerFormModal');

interface PlayerSaveResult {
    name?: string;
    color?: string;
    player?: { name?: string; color?: string };
    [key: string]: unknown;
}

const PlayerFormModal = () => {
  const { t } = useTranslation();
  const { state, updatePlayer, importPlayers, playersLoading } = useGameContext();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Wait for backend player load to complete before deciding to show modal
    if (playersLoading) {
      setShow(false);
      return;
    }
    // Show modal only when there are truly no players
    // (after backend load, if a real player was loaded, it won't be "auto-created")
    const onlyOne = state.players.length === 1;
    const first = state.players[0];
    const isAutoCreated = first && typeof first.name === 'string' && /^Gracz\b/i.test(first.name);
    setShow(state.players.length === 0 || (onlyOne && isAutoCreated));
  }, [state.players, playersLoading]);

  const handleSaved = (saved: PlayerSaveResult | null) => {
    if (!saved) return;
    const p = saved?.player ?? saved;
    log.debug('handleSaved raw:', saved, 'extracted:', p);
    const first = state.players[0];
    if (first?.id != null) {
      // Update existing auto-created player with backend data
      updatePlayer(first.id, {
        name: p.name ?? first.name,
        color: p.color ?? first.color,
      });
    } else {
      // Import as new player from backend
      importPlayers([{ name: p.name, color: p.color }], true, 'backend');
    }
  };

  return (
    <Modal show={show} backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title>{t('playerForm.addPlayer', 'Add Player')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {state.players.length > 0 ? (
          (() => {
            const first = state.players[0];
            const isAutoCreated = first && typeof first.name === 'string' && /^Gracz\b/i.test(first.name);
            if (isAutoCreated) {
              return (
                <PlayerForm
                  initialName={first.name ?? undefined}
                  initialColor={first.color ?? undefined}
                  onSuccess={() => setShow(false)}
                  onSaved={handleSaved}
                />
              );
            }
            return (
              <PlayerForm
                playerId={first.id}
                initialName={first.name ?? undefined}
                initialColor={first.color ?? undefined}
                onSuccess={() => setShow(false)}
                onSaved={handleSaved}
              />
            );
          })()
        ) : (
          <PlayerForm onSuccess={() => setShow(false)} onSaved={handleSaved} />
        )}
      </Modal.Body>
    </Modal>
  );
};

export default PlayerFormModal;

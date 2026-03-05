// Nowa wersja z obsługą edycji gracza po hold click/A
import React, { useState, useEffect } from "react";
import { useUser } from "../../../contexts/UserContext";
// ProfilePlayerService import removed (unused)
import { DeviceType, createDevice, createMicrophone, getUserDevices, getUserMicrophones, DeviceDto, MicrophoneDto } from "../../../scripts/api/apiUser";
import { useGameContext, GameMode, Difficulty } from "../../../contexts/GameContext";
import { logger } from '../../../utils/logger';

const log = logger.scoped('KaraokeSettingsPanel');
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import AudioVolumeLevel from "../input/source/AudioVolumeLevel";
import PlayerFormModal from "./PlayerFormModal";
import PlayerForm from "../../forms/PlayerForm";
import { Modal } from "react-bootstrap";
import { PLAYER_COLORS } from "../../../constants/playerColors";
// CircularLoader import removed (unused)
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface KaraokePlayer {
  id?: number;
  name?: string | null;
  color?: string;
  micId?: string;
}

interface SavedPlayerData {
  name?: string;
  color?: string;
  player?: { name?: string; color?: string };
}


interface KaraokeSettingsPanelProps {
  variant: "minimal" | "full";
  maxPlayers?: number;
}

const KaraokeSettingsPanel: React.FC<KaraokeSettingsPanelProps> = ({ variant, maxPlayers = 4 }) => {
  const { state, addPlayer: _addPlayer, importPlayers, assignMic, updatePlayer, gameMode, setGameMode, difficulty, setDifficulty } = useGameContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const { userId: _userId, currentUser: _currentUser, userDevices, userMicrophones } = useUser();
  const { t } = useTranslation();
  const [syncDone, setSyncDone] = useState(false);
  const [draggedMicId, setDraggedMicId] = useState<string | null>(null);
  const [editPlayer, setEditPlayer] = useState<KaraokePlayer | null>(null);
  // Usunięto logikę przytrzymania, będzie dwuklik
  const navigate = useNavigate();

  // Synchronizacja mikrofonów z backendem na starcie panelu
  useEffect(() => {
    if (syncDone) return;
    setSyncDone(true);
    const syncMics = async () => {
      try {
        const localMics = state.mics;
        const devices = await getUserDevices();
        const microphones = await getUserMicrophones();
        for (const mic of localMics) {
          const exists = devices.some((d: { deviceId: string; deviceType: number }) => d.deviceId === mic.deviceId && d.deviceType === DeviceType.Microphone);
          if (!exists) {
            await createDevice({ deviceId: mic.deviceId, deviceType: DeviceType.Microphone, visible: true });
          }
          const micExists = microphones.some((m: { deviceId: string }) => m.deviceId === mic.deviceId);
          if (!micExists) {
            await createMicrophone({ deviceId: mic.deviceId, visible: true });
          }
        }
      } catch (e) {
        log.warn('syncMics', 'Failed to sync microphones to backend', e);
      }
    };
    syncMics();
    // Mount-only: sync local microphones to backend once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag handlers for microphones
  const handleMicDragStart = (micId: string) => setDraggedMicId(micId);
  const handleMicDragEnd = () => setDraggedMicId(null);
  const handlePlayerDrop = (playerId?: number) => {
    if (draggedMicId && playerId !== undefined) {
      assignMic(playerId, draggedMicId);
      setDraggedMicId(null);
    }
  };

  return (
    <>
      <PlayerFormModal />
      <Modal show={!!editPlayer} onHide={() => setEditPlayer(null)}>
        <Modal.Header closeButton>
          <Modal.Title>{t('karaoke.editPlayer')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editPlayer && (
            <PlayerForm
              playerId={editPlayer.id}
              initialName={editPlayer.name ?? undefined}
              initialColor={editPlayer.color ?? undefined}
              onSuccess={() => setEditPlayer(null)}
              onSaved={(saved: SavedPlayerData) => {
                if (editPlayer.id == null) return;
                // Backend may return data directly or nested under .player
                const p = saved?.player ?? saved;
                console.debug('[KaraokeSettingsPanel] onSaved editPlayer.id:', editPlayer.id, 'saved:', saved, 'extracted:', p);
                if (p) {
                  updatePlayer(editPlayer.id, {
                    name: p.name ?? editPlayer.name ?? undefined,
                    color: p.color ?? editPlayer.color ?? undefined,
                  });
                }
              }}
            />
          )}
        </Modal.Body>
      </Modal>
      <div
        id="karaoke-settings-panel"
        style={{
          height: variant === "minimal" ? 70 : "100vh",
          width: "100%",
          background: "#222",
          borderRadius: 12,
          padding: 8,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          boxSizing: "border-box",
          minHeight: 40,
          paddingLeft: 20,
          gap: 24,
        }}
      >
        {/* Game Mode Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{t('karaoke.mode')}</label>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value as GameMode)}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <option value="normal">{t('karaoke.gameModes.normal')}</option>
            <option value="demo">{t('karaoke.gameModes.demo')}</option>
            <option value="pad">{t('karaoke.gameModes.pad')}</option>
            {/*
            <option value="no-timeline">Bez Timeline</option>
            <option value="no-lyrics">Bez Tekstu</option>
            <option value="no-music">Bez Muzyki - A cappella</option>
            <option value="instrumental">Instrumental</option>
            <option value="blind">Blind - Śpiewanie w ciemno</option>
            <option value="blind-no-timeline">Blind + Bez Timeline</option>
            <option value="blind-instrumental">Blind + Instrumental</option>
            */}
          </select>
        </div>

        {/* Difficulty Selector (per-profile via GameContext) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{t('karaoke.difficulty')}</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <option value="easy">{t('karaoke.difficulties.easy')}</option>
            <option value="normal">{t('karaoke.difficulties.normal')}</option>
            <option value="hard">{t('karaoke.difficulties.hard')}</option>
          </select>
        </div>

        {/* Gracze jako ikony */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {state.players.map((player: KaraokePlayer, idx: number) => {
            const assignedMic = state.mics.find((m: MediaDeviceInfo) => m.deviceId === player.micId);
            const assignedMicIndex = assignedMic ? state.mics.findIndex((m: MediaDeviceInfo) => m.deviceId === assignedMic.deviceId) : -1;
            return (
              <div key={player.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handlePlayerDrop(player.id)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: player.color || PLAYER_COLORS[idx % PLAYER_COLORS.length],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    cursor: "pointer"
                  }}
                  tabIndex={0}
                  onDoubleClick={() => setEditPlayer(player)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") setEditPlayer(player);
                  }}
                  title={player.micId ? t('karaoke.assignedMic', { micId: player.micId }) : t('karaoke.dragMicHere')}
                >
                  <FontAwesomeIcon icon={faUser} style={{ fontSize: 16, color: "#fff" }} />
                  {/* Przyklejona miniatura mikrofonu w lewym dolnym rogu ikony gracza */}
                  {player.micId && (
                    <>
                      <div style={{ position: "absolute", right: -6, bottom: -6 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <AudioVolumeLevel deviceId={player.micId} size={12} />
                        </div>
                      </div>
                      <div style={{ position: "absolute", right: 13, fontSize: 8, color: "#bbb", transform: "translate(22px, 0)" }}>{assignedMicIndex >= 0 ? assignedMicIndex + 1 : "-"}</div>
                    </>
                  )}
                </div>
                {/* Player name under icon (small) */}
                <div style={{ fontSize: 11, color: "#ddd", maxWidth: 80, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {player.name ?? t('karaoke.defaultPlayerName', { index: idx + 1 })}
                </div>
                {/* Assigned mic info is now anchored to the icon (bottom-left) */}
              </div>
            );
          })}
          {state.players.length < maxPlayers && (
            <>
              {/*}
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#444",
                  color: "#fff",
                  border: "none",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
                title="Add player"
              >
                  +
                </button>
                */}
              <Modal show={showAddModal} onHide={() => setShowAddModal(false)} backdrop="static">
                <Modal.Header closeButton>
                  <Modal.Title>{t('karaoke.addPlayer')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <PlayerForm
                    onSuccess={() => setShowAddModal(false)}
                    onSaved={(saved: SavedPlayerData) => {
                      // Import saved player into game and auto-assign mic to them
                      importPlayers([{ name: saved?.name, color: saved?.color }], true, 'backend');
                      setTimeout(() => {
                        const players = [...state.players];
                        const newPlayer = players[players.length - 1];
                        if (!newPlayer) return;
                        // Count mic usage
                        const micUsage: Record<string, number> = {};
                        state.mics.forEach((mic: MediaDeviceInfo) => { micUsage[mic.deviceId] = 0; });
                        players.forEach((p: KaraokePlayer) => {
                          if (p.micId && micUsage[p.micId] !== undefined) micUsage[p.micId]++;
                        });
                        const unassigned = state.mics.find((mic: MediaDeviceInfo) => !players.some((p: KaraokePlayer) => p.micId === mic.deviceId));
                        let micToAssign = unassigned?.deviceId;
                        if (!micToAssign && state.mics.length > 0) {
                          micToAssign = Object.entries(micUsage).sort((a, b) => a[1] - b[1])[0]?.[0];
                        }
                        if (micToAssign && newPlayer.id) {
                          assignMic(newPlayer.id, micToAssign);
                        }
                      }, 0);
                    }}
                  />
                </Modal.Body>
              </Modal>
            </>
          )}
          {/* Import button removed — profile import flow is handled when starting a game (primary player only) */}
        </div>
        {/* Microphones as icons with volume level */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {state.mics.map((mic: MediaDeviceInfo, idx: number) => {
            const deviceRecord = (userDevices || []).find((d: DeviceDto) => (d.deviceId || '').trim().toLowerCase() === (mic.deviceId || '').trim().toLowerCase());
            const userMicRecord = (userMicrophones || []).find((m: MicrophoneDto) => (m.deviceId || '').trim().toLowerCase() === (mic.deviceId || '').trim().toLowerCase());
            const micLabel = deviceRecord?.userDeviceName || deviceRecord?.deviceName || mic.label || (userMicRecord && `mic-${userMicRecord.id}`) || t('karaoke.micLabel');
            const assignedPlayer = state.players.find((p: KaraokePlayer) => p.micId === mic.deviceId);
            const assignedPlayerIdx = assignedPlayer ? state.players.indexOf(assignedPlayer) : -1;
            const ringColor = assignedPlayer
              ? (assignedPlayer.color || PLAYER_COLORS[assignedPlayerIdx % PLAYER_COLORS.length])
              : "#555";
            return (
              <div key={mic.deviceId} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: 8, color: "#bbb" }}>{idx + 1}</div>
                <div
                  draggable
                  onDragStart={() => handleMicDragStart(mic.deviceId)}
                  onDragEnd={handleMicDragEnd}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "transparent",
                    border: `3px solid ${ringColor}`,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    cursor: "grab",
                    position: "relative",
                    boxSizing: "border-box",
                  }}
                  title={micLabel}
                  onDoubleClick={() => navigate('/settings/audioInput')}
                >
                  {/* Volume level as a small filled circle */}
                  <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                    <AudioVolumeLevel deviceId={mic.deviceId} size={30} />
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#ddd", maxWidth: 100, textAlign: "center", whiteSpace: "nowrap",  textOverflow: "ellipsis" }}>
                  {micLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default KaraokeSettingsPanel;

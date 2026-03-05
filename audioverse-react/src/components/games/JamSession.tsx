import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useJamSession } from '../../hooks/useJamSession';
import { Focusable } from '../common/Focusable';
import { useGameFocusLock } from '../../hooks/useGameFocusLock';

// Keyboard mapping: number keys 1-8 and Q-I for 16 pads
const KEY_MAP: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7,
  'q': 8, 'w': 9, 'e': 10, 'r': 11, 't': 12, 'y': 13, 'u': 14, 'i': 15,
};

/**
 * Jam Session component — pad/keyboard used as a musical instrument.
 * Supports preset switching, BPM control, and multi-player jam sessions.
 */
const JamSession: React.FC = () => {
  useGameFocusLock();
  const { t } = useTranslation();
  const {
    session, presets, isReady,
    triggerNote, setPreset, setBpm, setMode,
    recentEvents,
  } = useJamSession({ playerName: 'Player 1' });

  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    const idx = KEY_MAP[e.key.toLowerCase()];
    if (idx !== undefined) {
      triggerNote(idx, 100);
      setActiveKeys(prev => new Set(prev).add(idx));
    }
  }, [triggerNote]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const idx = KEY_MAP[e.key.toLowerCase()];
    if (idx !== undefined) {
      setActiveKeys(prev => { const n = new Set(prev); n.delete(idx); return n; });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const currentPreset = presets.find(p => p.id === session.currentPreset) || presets[0];
  const padLabels = Object.entries(currentPreset.mapping).map(([idx, s]) => ({ idx: Number(idx), label: s.label }));
  const cols = Math.min(padLabels.length, 8);

  return (
    <div className="container py-4">
      <h2 className="mb-3">
        <i className="bi bi-music-note-beamed text-primary me-2" />
        {t('jamSession.title', 'Jam Session')}
      </h2>

      {/* Controls */}
      <div className="d-flex flex-wrap gap-3 align-items-center mb-4">
        <Focusable id="jam-preset-select">
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 small fw-semibold">{t('jamSession.preset', 'Preset')}:</label>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={session.currentPreset}
              onChange={e => setPreset(e.target.value)}
            >
              {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </Focusable>

        <Focusable id="jam-bpm-control">
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 small fw-semibold">{t('jamSession.bpm', 'BPM')}:</label>
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: 80 }}
              value={session.bpm}
              onChange={e => setBpm(Number(e.target.value))}
              min={20} max={300}
            />
          </div>
        </Focusable>

        <Focusable id="jam-mode-select">
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 small fw-semibold">{t('jamSession.mode', 'Mode')}:</label>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={session.mode}
              onChange={e => setMode(e.target.value as 'freeplay' | 'metronome' | 'backing-track')}
            >
              <option value="freeplay">{t('jamSession.freeplay', 'Free Play')}</option>
              <option value="metronome">{t('jamSession.metronome', 'Metronome')}</option>
              <option value="backing-track">{t('jamSession.backingTrack', 'Backing Track')}</option>
            </select>
          </div>
        </Focusable>

        <span className={`badge ${isReady ? 'bg-success' : 'bg-warning text-dark'}`}>
          {isReady ? t('jamSession.ready', 'Ready') : t('jamSession.loading', 'Loading...')}
        </span>
      </div>

      {/* Pad Grid */}
      <div
        className="mb-4 mx-auto"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 8,
          maxWidth: 800,
        }}
      >
        {padLabels.map(({ idx, label }) => {
          const isActive = activeKeys.has(idx);
          const keyLabel = Object.entries(KEY_MAP).find(([, v]) => v === idx)?.[0]?.toUpperCase() || '';
          return (
            <Focusable id={`jam-pad-${idx}`} key={idx}>
              <button
                className={`btn w-100 d-flex flex-column align-items-center justify-content-center fw-semibold ${isActive ? 'btn-warning' : 'btn-outline-secondary'}`}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  fontSize: 14,
                  transition: 'transform 0.05s',
                  transform: isActive ? 'scale(0.95)' : 'scale(1)',
                }}
                onMouseDown={() => { triggerNote(idx, 100); setActiveKeys(prev => new Set(prev).add(idx)); }}
                onMouseUp={() => setActiveKeys(prev => { const n = new Set(prev); n.delete(idx); return n; })}
                onMouseLeave={() => setActiveKeys(prev => { const n = new Set(prev); n.delete(idx); return n; })}
              >
                <span>{label}</span>
                <span className="text-muted" style={{ fontSize: 10 }}>[{keyLabel}]</span>
              </button>
            </Focusable>
          );
        })}
      </div>

      {/* Event log */}
      <div className="card mb-4">
        <div className="card-body" style={{ maxHeight: 160, overflowY: 'auto' }}>
          <h6 className="card-subtitle mb-2 text-muted">{t('jamSession.recentEvents', 'Recent events')}</h6>
          {recentEvents.length === 0 && (
            <p className="text-muted small mb-0">{t('jamSession.noEvents', 'Press keys or tap pads to start jamming!')}</p>
          )}
          {recentEvents.slice(-10).reverse().map((ev, i) => (
            <div key={i} className="small text-body-secondary">
              Pad {ev.padIndex} — vel: {ev.velocity} — {new Date(ev.timestamp).toLocaleTimeString()}
            </div>
          ))}
        </div>
      </div>

      {/* Players */}
      <div>
        <h5>{t('jamSession.players', 'Players')} ({session.players.length})</h5>
        <div className="d-flex flex-wrap gap-2">
          {session.players.map(p => (
            <div key={p.id} className="badge bg-body-secondary text-body border-start border-3 px-3 py-2" style={{ borderColor: `${p.color} !important` }}>
              {p.name} {p.muted && <i className="bi bi-volume-mute ms-1" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JamSession;

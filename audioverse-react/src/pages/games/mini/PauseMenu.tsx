/**
 * PauseMenu — in-game overlay shown when the player presses ESC or Start.
 *
 * Features:
 *  - Resume
 *  - Save game (calls backend AvGameSave endpoint if player has a profile)
 *  - Settings (inline volume/controls overview)
 *  - Controller assignments (shows current input map per player)
 *  - Back to Menu (exit game)
 *
 * Props:
 *  - onResume: resume gameplay
 *  - onBack: exit to menu
 *  - players: current player slots (for controller display)
 *  - gameId: string identifier for the game (used for save)
 *  - config: current game settings (for display/save)
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GameConfig, PlayerSlot } from './types'
import styles from './PauseMenu.module.css'
import SfwPauseScreen from './SfwPauseScreen'
import { GAME_INSTRUCTIONS } from './gameInstructions'

// Keyboard group labels
const KB_LABELS: Record<number, { name: string; keys: string }> = {
  0: { name: 'WASD', keys: 'W A S D + Space' },
  1: { name: 'Arrows', keys: '↑ ↓ ← → + Enter' },
  2: { name: 'IJKL', keys: 'I J K L + U' },
  3: { name: 'Numpad', keys: '8 4 5 6 + Num0' },
}

interface Props {
  onResume: () => void
  onBack: () => void
  players: PlayerSlot[]
  gameId?: string
  config?: GameConfig
}

type PauseTab = 'main' | 'settings' | 'controls' | 'save'

export default function PauseMenu({ onResume, onBack, players, gameId, config }: Props) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<PauseTab>('main')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [sfwMode, setSfwMode] = useState(false)

  // ── F9 global hotkey for SFW toggle ─────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault()
        setSfwMode(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Save ────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!gameId) return
    // Check if any player has a profilePlayerId
    const profilePlayers = players.filter(p => p.profilePlayerId)
    if (profilePlayers.length === 0) {
      setSaveStatus('error')
      return
    }

    setSaveStatus('saving')
    try {
      // Save game state to localStorage for now (backend AvGameSave endpoint
      // is ready in the repo layer but not yet exposed via controller —
      // see BACKEND_NOTE.md)
      const saveData = {
        gameId,
        timestamp: new Date().toISOString(),
        players: players.map(p => ({
          index: p.index,
          name: p.name,
          color: p.color,
          profilePlayerId: p.profilePlayerId,
          inputType: p.input.type,
        })),
        config: config ?? {},
      }
      const key = `av_game_save_${gameId}_${profilePlayers[0].profilePlayerId}`
      localStorage.setItem(key, JSON.stringify(saveData))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }, [gameId, players, config])

  // ── Render tab content ──────────────────────────────────

  const renderMain = () => (
    <div className={styles.menuItems}>
      <button className={styles.menuItem} onClick={onResume} autoFocus>
        ▶ {t('pauseMenu.resume', 'Resume')}
      </button>
      <button className={styles.menuItem} onClick={() => setTab('save')}>
        💾 {t('pauseMenu.save', 'Save Game')}
      </button>
      <button className={styles.menuItem} onClick={() => setTab('settings')}>
        ⚙️ {t('pauseMenu.settings', 'Settings')}
      </button>
      <button className={styles.menuItem} onClick={() => setTab('controls')}>
        🎮 {t('pauseMenu.controls', 'Controls')}
      </button>
      <button className={styles.menuItem} onClick={() => setSfwMode(true)}>
        💼 {t('pauseMenu.sfwMode', 'Boss Key (F9)')}
      </button>
      <div className={styles.divider} />
      <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={onBack}>
        🚪 {t('pauseMenu.quit', 'Back to Menu')}
      </button>
    </div>
  )

  const renderSave = () => (
    <div className={styles.subPanel}>
      <h3 className={styles.subTitle}>💾 {t('pauseMenu.save', 'Save Game')}</h3>
      {players.some(p => p.profilePlayerId) ? (
        <>
          <p className={styles.subHint}>
            {t('pauseMenu.saveHint', 'Save your current game progress.')}
          </p>
          <button
            className={`${styles.menuItem} ${styles.saveBtn}`}
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' && t('pauseMenu.saving', 'Saving…')}
            {saveStatus === 'saved' && `✓ ${t('pauseMenu.saved', 'Saved!')}`}
            {saveStatus === 'error' && `✕ ${t('pauseMenu.saveError', 'Error')}`}
            {saveStatus === 'idle' && `💾 ${t('pauseMenu.saveNow', 'Save Now')}`}
          </button>
          {gameId && (
            <p className={styles.subDetail}>
              {t('pauseMenu.gameLabel', 'Game')}: <strong>{gameId}</strong>
            </p>
          )}
        </>
      ) : (
        <p className={styles.subHint}>
          {t('pauseMenu.noProfile', 'No player profile linked. Assign a profile in the lobby to enable saving.')}
        </p>
      )}
      <button className={styles.backLink} onClick={() => setTab('main')}>
        ← {t('pauseMenu.backToPause', 'Back')}
      </button>
    </div>
  )

  const renderSettings = () => (
    <div className={styles.subPanel}>
      <h3 className={styles.subTitle}>⚙️ {t('pauseMenu.settings', 'Settings')}</h3>

      {config && Object.keys(config).length > 0 && (
        <div className={styles.settingsList}>
          <h4 className={styles.settingsGroup}>{t('pauseMenu.gameSettings', 'Game Settings')}</h4>
          {Object.entries(config).map(([key, value]) => (
            <div key={key} className={styles.settingsRow}>
              <span className={styles.settingsKey}>{key}</span>
              <span className={styles.settingsValue}>{String(value)}</span>
            </div>
          ))}
        </div>
      )}

      {(!config || Object.keys(config).length === 0) && (
        <p className={styles.subHint}>
          {t('pauseMenu.noSettings', 'No configurable settings for this game.')}
        </p>
      )}

      <button className={styles.backLink} onClick={() => setTab('main')}>
        ← {t('pauseMenu.backToPause', 'Back')}
      </button>
    </div>
  )

  const renderControls = () => (
    <div className={styles.subPanel}>
      <h3 className={styles.subTitle}>🎮 {t('pauseMenu.controls', 'Controls')}</h3>

      <div className={styles.controlsList}>
        {players.map((p, i) => (
          <div key={i} className={styles.controlRow}>
            <span className={styles.playerDot} style={{ background: p.color }} />
            <span className={styles.playerName}>{p.name}</span>
            <span className={styles.controlType}>
              {p.input.type === 'keyboard' && (
                <>
                  ⌨️ {KB_LABELS[p.input.group]?.name ?? `Group ${p.input.group}`}
                  <span className={styles.controlKeys}>
                    {KB_LABELS[p.input.group]?.keys ?? ''}
                  </span>
                </>
              )}
              {p.input.type === 'gamepad' && (
                <>
                  🎮 Gamepad {p.input.padIndex + 1}
                  <span className={styles.controlKeys}>
                    D-pad / L-Stick + A/B
                  </span>
                </>
              )}
              {p.input.type === 'remote' && (
                <>
                  🖥️ {t('pauseMenu.remoteWindow', 'Remote Window')}
                </>
              )}
            </span>
          </div>
        ))}

        {players.length === 0 && (
          <p className={styles.subHint}>{t('pauseMenu.noPlayers', 'No players connected.')}</p>
        )}
      </div>

      <div className={styles.controlHints}>
        <h4 className={styles.settingsGroup}>{t('pauseMenu.globalControls', 'Global Controls')}</h4>
        <div className={styles.settingsRow}>
          <span className={styles.settingsKey}>ESC / Start</span>
          <span className={styles.settingsValue}>{t('pauseMenu.pauseToggle', 'Pause / Resume')}</span>
        </div>
        <div className={styles.settingsRow}>
          <span className={styles.settingsKey}>Space / Enter</span>
          <span className={styles.settingsValue}>{t('pauseMenu.restart', 'Restart (game over)')}</span>
        </div>
      </div>

      {gameId && GAME_INSTRUCTIONS[gameId] && (() => {
        const info = GAME_INSTRUCTIONS[gameId]
        return (
          <div className={styles.settingsList}>
            <h4 className={styles.settingsGroup}>{t('pauseMenu.objective', 'Objective')}</h4>
            <p className={styles.subHint}>{info.objective}</p>

            <h4 className={styles.settingsGroup}>{t('pauseMenu.keyboardControls', 'Keyboard Controls')}</h4>
            {info.keyboard.map((k, i) => (
              <div key={`kb-${i}`} className={styles.settingsRow}>
                <span className={styles.settingsKey}>{k.keys}</span>
                <span className={styles.settingsValue}>{k.action}</span>
              </div>
            ))}

            <h4 className={styles.settingsGroup}>{t('pauseMenu.gamepadControls', 'Gamepad Controls')}</h4>
            {info.gamepad.map((g, i) => (
              <div key={`gp-${i}`} className={styles.settingsRow}>
                <span className={styles.settingsKey}>{g.button}</span>
                <span className={styles.settingsValue}>{g.action}</span>
              </div>
            ))}

            {info.tips && info.tips.length > 0 && (
              <>
                <h4 className={styles.settingsGroup}>{t('pauseMenu.tips', 'Tips')}</h4>
                {info.tips.map((tip, i) => (
                  <p key={`tip-${i}`} className={styles.subHint}>💡 {tip}</p>
                ))}
              </>
            )}
          </div>
        )
      })()}

      <button className={styles.backLink} onClick={() => setTab('main')}>
        ← {t('pauseMenu.backToPause', 'Back')}
      </button>
    </div>
  )

  return (
    <>
      {sfwMode && <SfwPauseScreen onDismiss={() => setSfwMode(false)} />}
      <div className={styles.overlay} onClick={onResume}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>⏸ {t('pauseMenu.paused', 'Paused')}</h2>
        {tab === 'main' && renderMain()}
        {tab === 'save' && renderSave()}
        {tab === 'settings' && renderSettings()}
        {tab === 'controls' && renderControls()}
      </div>
    </div>
    </>
  )
}

/**
 * GameSettings — pre-game configuration panel shown between lobby and game.
 *
 * Each mini-game defines its own settings fields via `SettingDef` array.
 * Common settings (difficulty, bot count) are added automatically if requested.
 * The component renders the fields, lets the user tweak them, then calls
 * `onStart` with the final settings object.
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './GameSettings.module.css'
import type { GameConfig } from './types'

export type SettingType = 'select' | 'range' | 'toggle'

export interface SettingOption {
  value: string | number
  label: string
}

export interface SettingDef {
  key: string
  label: string
  hint?: string
  type: SettingType
  /** For 'select' */
  options?: SettingOption[]
  /** For 'range' */
  min?: number
  max?: number
  step?: number
  /** Default value */
  defaultValue: string | number | boolean
}

export interface GameSettingsProps {
  /** Game title for the header */
  title: string
  /** Custom settings for this game */
  settings: SettingDef[]
  /** Maximum bots this game supports (0 = no bots) */
  maxBots?: number
  /** Current human player count */
  humanPlayers: number
  /** Max total players the game supports */
  maxPlayers: number
  onStart: (config: GameConfig) => void
  onBack: () => void
}

import type { TFunction } from 'i18next'

type TFn = TFunction

/** Standard difficulty options — call with t() for i18n */
export const DIFFICULTY_SETTING = (t: TFn): SettingDef => ({
  key: 'difficulty',
  label: t('gameSettings.botDifficulty', 'Bot Difficulty'),
  type: 'select',
  options: [
    { value: 'easy', label: t('gameSettings.easy', 'Easy') },
    { value: 'normal', label: t('gameSettings.normal', 'Normal') },
    { value: 'hard', label: t('gameSettings.hard', 'Hard') },
  ],
  defaultValue: 'normal',
})

/** Player mode — coop vs versus (always first setting shown) */
export const PLAYER_MODE_SETTING = (t: TFn): SettingDef => ({
  key: 'playerMode',
  label: t('miniGames.playerMode', 'Player Mode'),
  type: 'select',
  options: [
    { value: 'vs', label: t('miniGames.versus', 'Versus') },
    { value: 'coop', label: t('miniGames.coop', 'Co-op') },
  ],
  defaultValue: 'vs',
})

/** Co-op player mode (for primarily coop games where coop is default) */
export const PLAYER_MODE_COOP_DEFAULT = (t: TFn): SettingDef => ({
  key: 'playerMode',
  label: t('miniGames.playerMode', 'Player Mode'),
  type: 'select',
  options: [
    { value: 'coop', label: t('miniGames.coop', 'Co-op') },
    { value: 'vs', label: t('miniGames.versus', 'Versus') },
  ],
  defaultValue: 'coop',
})

export default function GameSettings({
  title, settings, maxBots = 0, humanPlayers, maxPlayers, onStart, onBack,
}: GameSettingsProps) {
  const { t } = useTranslation()

  // Build initial values from setting defs
  const initialValues = useMemo(() => {
    const vals: GameConfig = {}
    for (const s of settings) vals[s.key] = s.defaultValue
    vals._botCount = 0
    vals._botDifficulty = 'normal'
    return vals
  }, [settings])

  const [values, setValues] = useState(initialValues)

  const set = (key: string, val: unknown) =>
    setValues(prev => ({ ...prev, [key]: val }))

  const maxBotSlots = Math.max(0, maxPlayers - humanPlayers)
  const effectiveMaxBots = Math.min(maxBots, maxBotSlots)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <p>{t('gameSettings.configure', 'Configure your game')}</p>
      </div>

      {settings.map(s => (
        <div key={s.key} className={styles.field}>
          <div>
            <div className={styles.fieldLabel}>{s.label}</div>
            {s.hint && <div className={styles.fieldHint}>{s.hint}</div>}
          </div>
          <div className={styles.fieldControl}>
            {s.type === 'select' && (
              <select
                value={String(values[s.key])}
                onChange={e => set(s.key, e.target.value)}
              >
                {s.options?.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}
            {s.type === 'range' && (
              <>
                <input
                  type="range"
                  min={s.min ?? 1}
                  max={s.max ?? 10}
                  step={s.step ?? 1}
                  value={Number(values[s.key])}
                  onChange={e => set(s.key, Number(e.target.value))}
                />
                <span className={styles.rangeValue}>{values[s.key]}</span>
              </>
            )}
            {s.type === 'toggle' && (
              <input
                type="checkbox"
                checked={!!values[s.key]}
                onChange={e => set(s.key, e.target.checked)}
              />
            )}
          </div>
        </div>
      ))}

      {/* Bot section */}
      {effectiveMaxBots > 0 && (
        <div className={styles.botSection}>
          <div className={styles.botRow}>
            <span className={styles.botLabel}>🤖 {t('gameSettings.bots', 'Bots')}</span>
            <div className={styles.fieldControl}>
              <input
                type="range"
                min={0}
                max={effectiveMaxBots}
                step={1}
                value={Number(values._botCount)}
                onChange={e => set('_botCount', Number(e.target.value))}
              />
              <span className={styles.rangeValue}>{values._botCount}</span>
            </div>
          </div>
          {Number(values._botCount) > 0 && (
            <div className={styles.botRow}>
              <span className={styles.botLabel}>{t('gameSettings.botDifficulty', 'Bot Difficulty')}</span>
              <div className={styles.fieldControl}>
                <select
                  value={String(values._botDifficulty)}
                  onChange={e => set('_botDifficulty', e.target.value)}
                >
                  <option value="easy">{t('gameSettings.easy', 'Easy')}</option>
                  <option value="normal">{t('gameSettings.normal', 'Normal')}</option>
                  <option value="hard">{t('gameSettings.hard', 'Hard')}</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.backBtn} onClick={onBack}>
          {t('miniGames.back', 'Back')}
        </button>
        <button className={styles.startBtn} onClick={() => onStart(values)}>
          {t('miniGames.startGame', 'Start Game')}
        </button>
      </div>
    </div>
  )
}

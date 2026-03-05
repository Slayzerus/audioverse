/**
 * AutoSurvivorsPage — lobby → settings → title → game flow for Auto Survivors.
 *
 * Follows the standard SnakesPage template pattern.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import AutoSurvivorsGame from './AutoSurvivorsGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function AutoSurvivorsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'auto-survivors')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    {
      key: 'gameMode',
      label: t('miniGames.gameMode', 'Game Mode'),
      type: 'select' as const,
      options: [
        { value: 'gather', label: t('miniGames.gather', 'Gather (collect only, no enemies)') },
        { value: 'survival', label: t('miniGames.survival', 'Survival (auto-shoot waves)') },
        { value: 'combo', label: t('miniGames.combo', 'Combo (gather + survival)') },
      ],
      defaultValue: 'combo',
    },
    DIFFICULTY_SETTING(t),
    {
      key: 'spawnRate',
      label: t('miniGames.spawnRate', 'Spawn Rate'),
      type: 'select' as const,
      options: [
        { value: 'slow', label: t('miniGames.slow', 'Slow') },
        { value: 'normal', label: t('miniGames.normal', 'Normal') },
        { value: 'frenzy', label: t('miniGames.frenzy', 'Frenzy') },
      ],
      defaultValue: 'normal',
    },
    {
      key: 'startingWeapon',
      label: t('miniGames.startingWeapon', 'Starting Weapon'),
      type: 'select' as const,
      options: [
        { value: 'single-shot', label: t('miniGames.singleShot', 'Single Shot') },
        { value: 'spread', label: t('miniGames.spread', 'Spread (3 projectiles)') },
        { value: 'rapid', label: t('miniGames.rapid', 'Rapid Fire') },
      ],
      defaultValue: 'single-shot',
    },
  ]

  if (phase === 'game') {
    return <AutoSurvivorsGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
  }

  if (phase === 'title') {
    return <TitleCard game={gameMeta} playerCount={allPlayers.length} onDone={() => setPhase('game')} />
  }

  if (phase === 'settings') {
    return (
      <GameSettings
        title={`${gameMeta.icon} ${gameMeta.title}`}
        settings={settingsDefs}
        maxBots={3}
        humanPlayers={humanPlayers.length}
        maxPlayers={gameMeta.maxPlayers}
        onBack={() => setPhase('lobby')}
        onStart={(config) => {
          const bots = createBotSlots(humanPlayers.length, config._botCount || 0)
          setAllPlayers([...humanPlayers, ...bots])
          setGameConfig(config)
          setPhase('title')
        }}
      />
    )
  }

  return (
    <PlayerLobby
      title={`${gameMeta.icon} ${t('miniGames.autoSurvivors', 'Auto Survivors')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

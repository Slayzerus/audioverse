/**
 * IcyTowerPage — lobby → settings → title → game flow for Icy Tower mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import IcyTowerGame from './IcyTowerGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function IcyTowerPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'icy-tower')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'climb', label: t('miniGames.climb', 'Climb') },
      { value: 'vs-height', label: t('miniGames.vsHeight', 'VS Height') },
      { value: 'coop-climb', label: t('miniGames.coopClimb', 'Co-op Climb') },
    ], defaultValue: 'climb' },
    DIFFICULTY_SETTING(t),
    { key: 'platformDensity', label: t('miniGames.platformDensity', 'Platform Density'), type: 'select' as const, options: [
      { value: 'dense', label: t('miniGames.dense', 'Dense') },
      { value: 'normal', label: t('miniGames.normal', 'Normal') },
      { value: 'sparse', label: t('miniGames.sparse', 'Sparse') },
    ], defaultValue: 'normal' },
    { key: 'gravity', label: t('miniGames.gravity', 'Gravity'), type: 'select' as const, options: [
      { value: 'low', label: t('miniGames.low', 'Low') },
      { value: 'normal', label: t('miniGames.normal', 'Normal') },
      { value: 'high', label: t('miniGames.high', 'High') },
    ], defaultValue: 'normal' },
  ]

  if (phase === 'game') {
    return <IcyTowerGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
  }

  if (phase === 'title') {
    return <TitleCard game={gameMeta} playerCount={allPlayers.length} onDone={() => setPhase('game')} />
  }

  if (phase === 'settings') {
    return (
      <GameSettings
        title={`${gameMeta.icon} ${gameMeta.title}`}
        settings={settingsDefs}
        maxBots={7}
        humanPlayers={humanPlayers.length}
        maxPlayers={gameMeta.maxPlayers}
        onBack={() => setPhase('lobby')}
        onStart={(cfg) => {
          const bots = createBotSlots(humanPlayers.length, cfg._botCount || 0)
          setAllPlayers([...humanPlayers, ...bots])
          setGameConfig(cfg)
          setPhase('title')
        }}
      />
    )
  }

  return (
    <PlayerLobby
      title={`${gameMeta.icon} ${t('miniGames.icyTower', 'Icy Tower')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

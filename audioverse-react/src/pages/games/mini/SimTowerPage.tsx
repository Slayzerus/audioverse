/**
 * SimTowerPage — lobby → settings → title → game flow for the SimTower mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import SimTowerGame from './SimTowerGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function SimTowerPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'sim-tower')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'sandbox', label: t('miniGames.sandbox', 'Sandbox') },
      { value: 'vs-rating', label: t('miniGames.vsRating', 'VS Rating') },
      { value: 'coop-tower', label: t('miniGames.coopTower', 'Co-op Tower') },
    ], defaultValue: 'sandbox' },
    DIFFICULTY_SETTING(t),
    { key: 'maxFloors', label: t('miniGames.maxFloors', 'Max Floors'), type: 'select' as const, options: [
      { value: 15, label: '15' },
      { value: 30, label: '30' },
      { value: 50, label: '50' },
    ], defaultValue: 30 },
    { key: 'startingMoney', label: t('miniGames.startingMoney', 'Starting Money'), type: 'select' as const, options: [
      { value: 'low', label: t('miniGames.low', 'Low') },
      { value: 'normal', label: t('miniGames.normal', 'Normal') },
      { value: 'rich', label: t('miniGames.rich', 'Rich') },
    ], defaultValue: 'normal' },
  ]

  if (phase === 'game') {
    return <SimTowerGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.simTower', 'SimTower')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

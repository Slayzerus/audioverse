/**
 * TransportTycoonPage — lobby → settings → title → game flow for Transport Tycoon.
 *
 * Follows the SnakesPage pattern exactly.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import TransportTycoonGame from './TransportTycoonGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function TransportTycoonPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'transport-tycoon')!

  // Settings definitions for this game
  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'free-build', label: t('miniGames.freeBuild', 'Free Build') },
      { value: 'vs-tycoon', label: t('miniGames.vsTycoon', 'VS Tycoon') },
      { value: 'coop-network', label: t('miniGames.coopNetwork', 'Co-op Network') },
    ], defaultValue: 'vs-tycoon' },
    DIFFICULTY_SETTING(t),
    { key: 'mapSize', label: t('miniGames.mapSize', 'Map Size'), type: 'select', options: [
      { value: 'small', label: t('miniGames.small', 'Small (6 cities)') },
      { value: 'medium', label: t('miniGames.medium', 'Medium (8 cities)') },
      { value: 'large', label: t('miniGames.large', 'Large (12 cities)') },
    ], defaultValue: 'medium' },
    { key: 'startingCash', label: t('miniGames.startingCash', 'Starting Cash'), type: 'select', options: [
      { value: 500, label: '$500' },
      { value: 1000, label: '$1,000' },
      { value: 2000, label: '$2,000' },
    ], defaultValue: 1000 },
  ]

  if (phase === 'game') {
    return <TransportTycoonGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.transportTycoon', 'Transport Tycoon')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

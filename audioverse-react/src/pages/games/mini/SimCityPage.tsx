/**
 * SimCityPage — lobby → settings → title → game flow for the SimCity mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import SimCityGame from './SimCityGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function SimCityPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'sim-city')!

  // Settings definitions for this game
  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'free-build', label: t('miniGames.freeBuild', 'Free Build') },
      { value: 'vs-mayor', label: t('miniGames.vsMayor', 'VS Mayor (compete for highest population)') },
      { value: 'coop-city', label: t('miniGames.coopCity', 'Co-op City (reach population target together)') },
    ], defaultValue: 'free-build' },
    DIFFICULTY_SETTING(t),
    { key: 'gameDuration', label: t('miniGames.gameDuration', 'Game Duration'), type: 'select' as const, options: [
      { value: 180, label: t('miniGames.threeMin', '3 Minutes') },
      { value: 300, label: t('miniGames.fiveMin', '5 Minutes') },
      { value: 600, label: t('miniGames.tenMin', '10 Minutes') },
    ], defaultValue: 300 },
    { key: 'disasterFrequency', label: t('miniGames.disasterFrequency', 'Disaster Frequency'), type: 'select' as const, options: [
      { value: 'none', label: t('miniGames.none', 'None') },
      { value: 'low', label: t('miniGames.low', 'Low') },
      { value: 'high', label: t('miniGames.high', 'High') },
    ], defaultValue: 'low' },
  ]

  if (phase === 'game') {
    return <SimCityGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.simCity', 'SimCity')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

/**
 * HorizonChasePage — lobby → settings → title → game flow for Horizon Chase mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import HorizonChaseGame from './HorizonChaseGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function HorizonChasePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'horizon-chase')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'grand-prix', label: t('miniGames.grandPrix', 'Grand Prix') },
      { value: 'vs-race', label: t('miniGames.vsRace', 'VS Race') },
      { value: 'coop-relay', label: t('miniGames.coopRelay', 'Co-op Relay') },
    ], defaultValue: 'grand-prix' },
    DIFFICULTY_SETTING(t),
    { key: 'laps', label: t('miniGames.laps', 'Laps'), type: 'select' as const, options: [
      { value: 3, label: '3' },
      { value: 5, label: '5' },
      { value: 7, label: '7' },
    ], defaultValue: 5 },
    { key: 'aiDifficulty', label: t('miniGames.aiDifficulty', 'AI Difficulty'), type: 'select' as const, options: [
      { value: 'easy', label: t('miniGames.easy', 'Easy') },
      { value: 'normal', label: t('miniGames.normal', 'Normal') },
      { value: 'hard', label: t('miniGames.hard', 'Hard') },
    ], defaultValue: 'normal' },
  ]

  if (phase === 'game') {
    return <HorizonChaseGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.horizonChase', 'Horizon Chase')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

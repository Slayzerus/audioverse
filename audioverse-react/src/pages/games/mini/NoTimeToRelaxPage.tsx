/**
 * NoTimeToRelaxPage — lobby → settings → title → game flow for the
 * No Time To Relax life/vacation simulation mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import NoTimeToRelaxGame from './NoTimeToRelaxGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function NoTimeToRelaxPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'no-time-to-relax')!

  // Settings definitions for this game
  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'chill', label: t('miniGames.chill', 'Chill (solo relaxation)') },
      { value: 'competitive', label: t('miniGames.competitive', 'Competitive (VS)') },
      { value: 'coop', label: t('miniGames.coop', 'Co-op (team goal)') },
    ], defaultValue: 'competitive' },
    DIFFICULTY_SETTING(t),
    { key: 'gameDuration', label: t('miniGames.gameDuration', 'Game Duration'), type: 'select' as const, options: [
      { value: 3, label: t('miniGames.threeMin', '3 Minutes') },
      { value: 5, label: t('miniGames.fiveMin', '5 Minutes') },
      { value: 7, label: t('miniGames.sevenMin', '7 Minutes') },
    ], defaultValue: 5 },
    { key: 'season', label: t('miniGames.season', 'Season'), type: 'select' as const, options: [
      { value: 'summer', label: t('miniGames.summer', 'Summer') },
      { value: 'winter', label: t('miniGames.winter', 'Winter') },
      { value: 'spring', label: t('miniGames.spring', 'Spring') },
    ], defaultValue: 'summer' },
  ]

  if (phase === 'game') {
    return <NoTimeToRelaxGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.noTimeToRelax', 'No Time To Relax')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

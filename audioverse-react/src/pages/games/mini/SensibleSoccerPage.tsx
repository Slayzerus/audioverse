/**
 * SensibleSoccerPage — lobby → settings → title → game flow for the
 * Sensible World of Soccer mini-game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import SensibleSoccerGame from './SensibleSoccerGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function SensibleSoccerPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'sensible-soccer')!

  // Settings definitions for this game
  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'quick-match', label: t('miniGames.quickMatch', 'Quick Match') },
      { value: 'tournament', label: t('miniGames.tournament', 'Tournament') },
      { value: 'coop-vs-ai', label: t('miniGames.coopVsAI', 'Co-op vs AI') },
    ], defaultValue: 'quick-match' },
    DIFFICULTY_SETTING(t),
    { key: 'matchDuration', label: t('miniGames.matchDuration', 'Match Duration'), type: 'select' as const, options: [
      { value: 2, label: t('miniGames.twoMin', '2 Minutes') },
      { value: 3, label: t('miniGames.threeMin', '3 Minutes') },
      { value: 5, label: t('miniGames.fiveMin', '5 Minutes') },
    ], defaultValue: 3 },
    { key: 'teamSize', label: t('miniGames.teamSize', 'Team Size'), type: 'select' as const, options: [
      { value: '3v3', label: '3v3' },
      { value: '5v5', label: '5v5' },
      { value: '7v7', label: '7v7' },
    ], defaultValue: '5v5' },
  ]

  if (phase === 'game') {
    return <SensibleSoccerGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.sensibleSoccer', 'Sensible Soccer')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

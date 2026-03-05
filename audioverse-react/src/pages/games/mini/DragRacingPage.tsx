/**
 * DragRacingPage — lobby → settings → title → game flow for Drag Racing.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import DragRacingGame from './DragRacingGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function DragRacingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'drag-racing')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'single-race', label: t('miniGames.singleRace', 'Single Race') },
      { value: 'tournament', label: t('miniGames.tournament', 'Tournament (5 races)') },
      { value: 'coop-relay', label: t('miniGames.coopRelay', 'Co-op Relay') },
    ], defaultValue: 'single-race' },
    DIFFICULTY_SETTING(t),
    { key: 'raceCount', label: t('miniGames.raceCount', 'Race Count'), type: 'select' as const, options: [
      { value: 1, label: '1' },
      { value: 3, label: '3' },
      { value: 5, label: '5' },
    ], defaultValue: 3 },
    { key: 'startingMoney', label: t('miniGames.startingMoney', 'Starting Money'), type: 'select' as const, options: [
      { value: 'low', label: t('miniGames.low', 'Low (50)') },
      { value: 'normal', label: t('miniGames.normal', 'Normal (200)') },
      { value: 'rich', label: t('miniGames.rich', 'Rich (500)') },
    ], defaultValue: 'normal' },
  ]

  if (phase === 'game') {
    return <DragRacingGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.dragRacing', 'Drag Racing')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

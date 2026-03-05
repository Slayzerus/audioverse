/**
 * EscapeRoomPage — lobby → settings → title → game flow for the Escape Room mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import EscapeRoomGame from './EscapeRoomGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function EscapeRoomPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'escape-room')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'adventure', label: t('miniGames.adventure', 'Adventure') },
      { value: 'vs-race', label: t('miniGames.vsRace', 'VS Race') },
      { value: 'coop-escape', label: t('miniGames.coopEscape', 'Co-op Escape') },
    ], defaultValue: 'adventure' },
    DIFFICULTY_SETTING(t),
    { key: 'roomCount', label: t('miniGames.roomCount', 'Room Count'), type: 'select' as const, options: [
      { value: 5, label: '5' },
      { value: 10, label: '10' },
      { value: 15, label: '15' },
    ], defaultValue: 10 },
    { key: 'hintCost', label: t('miniGames.hintCost', 'Hint Cost'), type: 'select' as const, options: [
      { value: 'free', label: t('miniGames.free', 'Free') },
      { value: 'cheap', label: t('miniGames.cheap', 'Cheap (5 coins)') },
      { value: 'expensive', label: t('miniGames.expensive', 'Expensive (20 coins)') },
    ], defaultValue: 'cheap' },
  ]

  if (phase === 'game') {
    return <EscapeRoomGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.escapeRoom', 'Escape Room')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

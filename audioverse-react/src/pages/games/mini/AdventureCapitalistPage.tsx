/**
 * AdventureCapitalistPage — lobby → settings → title → game flow for Adventure Capitalist.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import AdventureCapitalistGame from './AdventureCapitalistGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function AdventureCapitalistPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'adventure-capitalist')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'idle', label: t('miniGames.idle', 'Idle (Free Play)') },
      { value: 'vs-race', label: t('miniGames.vsRace', 'VS Race (Timed)') },
      { value: 'coop-target', label: t('miniGames.coopTarget', 'Co-op Target ($1B)') },
    ], defaultValue: 'idle' },
    DIFFICULTY_SETTING(t),
    { key: 'timeLimit', label: t('miniGames.timeLimit', 'Time Limit (min)'), type: 'select' as const, options: [
      { value: 3, label: '3' },
      { value: 5, label: '5' },
      { value: 10, label: '10' },
    ], defaultValue: 5 },
    { key: 'startingCash', label: t('miniGames.startingCash', 'Starting Cash'), type: 'select' as const, options: [
      { value: 100, label: '$100' },
      { value: 500, label: '$500' },
      { value: 1000, label: '$1,000' },
    ], defaultValue: 100 },
  ]

  if (phase === 'game') {
    return <AdventureCapitalistGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.adventureCapitalist', 'Adventure Capitalist')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

/**
 * OilImperiumPage — lobby → settings → title → game flow for Oil Imperium.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import OilImperiumGame from './OilImperiumGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function OilImperiumPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'oil-imperium')!

  // Settings definitions for this game
  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'tycoon', label: t('miniGames.tycoon', 'Tycoon (Free Play)') },
      { value: 'vs-market', label: t('miniGames.vsMarket', 'VS Market (Sabotage enabled)') },
      { value: 'coop-empire', label: t('miniGames.coopEmpire', 'Co-op Empire (Shared wealth)') },
    ], defaultValue: 'tycoon' },
    DIFFICULTY_SETTING(t),
    { key: 'gameDuration', label: t('miniGames.gameDuration', 'Game Duration'), type: 'select', options: [
      { value: 3, label: t('miniGames.threeMin', '3 Minutes') },
      { value: 5, label: t('miniGames.fiveMin', '5 Minutes') },
      { value: 10, label: t('miniGames.tenMin', '10 Minutes') },
    ], defaultValue: 5 },
    { key: 'startingCash', label: t('miniGames.startingCash', 'Starting Cash'), type: 'select', options: [
      { value: 500, label: '$500' },
      { value: 1000, label: '$1,000' },
      { value: 2000, label: '$2,000' },
    ], defaultValue: 1000 },
  ]

  if (phase === 'game') {
    return <OilImperiumGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.oilImperium', 'Oil Imperium')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

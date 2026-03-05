/**
 * UltimateChickenHorsePage — lobby → settings → title → game flow
 * for the Ultimate Chicken Horse platform-builder / racer mini-game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import UltimateChickenHorseGame from './UltimateChickenHorseGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function UltimateChickenHorsePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'ultimate-chicken-horse')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'party', label: t('miniGames.party', 'Party (competitive)') },
      { value: 'coop-build', label: t('miniGames.coopBuild', 'Co-op Build') },
    ], defaultValue: 'party' },
    DIFFICULTY_SETTING(t),
    { key: 'rounds', label: t('miniGames.rounds', 'Rounds'), type: 'select' as const, options: [
      { value: 3, label: '3' },
      { value: 5, label: '5' },
      { value: 7, label: '7' },
    ], defaultValue: 5 },
    { key: 'buildTime', label: t('miniGames.buildTime', 'Build Time (seconds)'), type: 'range', min: 10, max: 20, step: 5, defaultValue: 15 },
  ]

  if (phase === 'game') {
    return <UltimateChickenHorseGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.ultimateChickenHorse', 'Ultimate Chicken Horse')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

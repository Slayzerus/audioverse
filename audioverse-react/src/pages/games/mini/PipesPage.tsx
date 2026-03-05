/**
 * PipesPage — lobby → settings → title → game flow for the Pipes mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import PipesGame from './PipesGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function PipesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'pipes')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'puzzle', label: t('miniGames.puzzle', 'Puzzle') },
      { value: 'vs-race', label: t('miniGames.vsRace', 'VS Race') },
      { value: 'coop-plumb', label: t('miniGames.coopPlumb', 'Co-op Plumb') },
    ], defaultValue: 'puzzle' },
    DIFFICULTY_SETTING(t),
    { key: 'gridSize', label: t('miniGames.gridSize', 'Grid Size'), type: 'select' as const, options: [
      { value: '6', label: '6×6' },
      { value: '8', label: '8×8' },
      { value: '10', label: '10×10' },
    ], defaultValue: '8' },
    { key: 'flowSpeed', label: t('miniGames.flowSpeed', 'Flow Speed'), type: 'select' as const, options: [
      { value: 'slow', label: t('miniGames.slow', 'Slow') },
      { value: 'normal', label: t('miniGames.normal', 'Normal') },
      { value: 'fast', label: t('miniGames.fast', 'Fast') },
    ], defaultValue: 'normal' },
  ]

  if (phase === 'game') {
    return <PipesGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.pipes', 'Pipes')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

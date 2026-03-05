/**
 * PuzzlePage — lobby → settings → title → game flow for the Puzzle mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import PuzzleGame from './PuzzleGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function PuzzlePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'puzzle')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'race', label: t('miniGames.race', 'Race') },
      { value: 'vs-puzzle', label: t('miniGames.vsPuzzle', 'VS Puzzle') },
      { value: 'coop-solve', label: t('miniGames.coopSolve', 'Co-op Solve') },
    ], defaultValue: 'race' },
    DIFFICULTY_SETTING(t),
    { key: 'gridSize', label: t('miniGames.gridSize', 'Grid Size'), type: 'select' as const, options: [
      { value: 4, label: '4×4' },
      { value: 5, label: '5×5' },
      { value: 6, label: '6×6' },
    ], defaultValue: 4 },
    { key: 'powerUps', label: t('miniGames.powerUps', 'Power-Ups'), type: 'select' as const, options: [
      { value: 'on', label: t('miniGames.on', 'On') },
      { value: 'off', label: t('miniGames.off', 'Off') },
    ], defaultValue: 'on' },
  ]

  if (phase === 'game') {
    return <PuzzleGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.puzzle', 'Puzzle')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

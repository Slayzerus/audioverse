/**
 * MemoPage — lobby → settings → title → game flow for the Memo mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import MemoGame from './MemoGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function MemoPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'memo')!

  // Settings definitions for this game
  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'vs-race', label: t('miniGames.vsRace', 'VS Race') },
      { value: 'coop-clear', label: t('miniGames.coopClear', 'Co-op Clear') },
      { value: 'solo-challenge', label: t('miniGames.soloChallenge', 'Solo Challenge') },
    ], defaultValue: 'vs-race' },
    DIFFICULTY_SETTING(t),
    { key: 'boardSize', label: t('miniGames.boardSize', 'Board Size'), type: 'select' as const, options: [
      { value: '4x4', label: '4×4 (8 pairs)' },
      { value: '4x6', label: '4×6 (12 pairs)' },
      { value: '6x6', label: '6×6 (18 pairs)' },
    ], defaultValue: '4x4' },
    { key: 'powerUps', label: t('miniGames.powerUps', 'Power-Ups'), type: 'select' as const, options: [
      { value: 'on', label: t('miniGames.on', 'On') },
      { value: 'off', label: t('miniGames.off', 'Off') },
    ], defaultValue: 'on' },
    { key: 'timeLimit', label: t('miniGames.timeLimit', 'Time Limit'), type: 'select' as const, options: [
      { value: 60, label: '60s' },
      { value: 120, label: '120s' },
      { value: 180, label: '180s' },
    ], defaultValue: 60 },
  ]

  if (phase === 'game') {
    return <MemoGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.memo', 'Memo')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

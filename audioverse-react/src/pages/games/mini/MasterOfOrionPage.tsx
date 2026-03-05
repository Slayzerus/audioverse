/**
 * MasterOfOrionPage — lobby → settings → title → game flow for Master of Orion.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import MasterOfOrionGame from './MasterOfOrionGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function MasterOfOrionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'master-of-orion')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'conquest', label: t('miniGames.conquest', 'Conquest (60% systems)') },
      { value: 'science', label: t('miniGames.science', 'Science (all techs)') },
      { value: 'timed-score', label: t('miniGames.timedScore', 'Timed — High Score') },
    ], defaultValue: 'conquest' },
    DIFFICULTY_SETTING(t),
    { key: 'galaxySize', label: t('miniGames.galaxySize', 'Galaxy Size'), type: 'select' as const, options: [
      { value: 'small', label: t('miniGames.small', 'Small (12)') },
      { value: 'medium', label: t('miniGames.medium', 'Medium (16)') },
      { value: 'large', label: t('miniGames.large', 'Large (20)') },
    ], defaultValue: 'medium' },
    { key: 'startingSystems', label: t('miniGames.startingSystems', 'Starting Systems'), type: 'select' as const, options: [
      { value: 1, label: '1' },
      { value: 2, label: '2' },
      { value: 3, label: '3' },
    ], defaultValue: 1 },
  ]

  if (phase === 'game') {
    return <MasterOfOrionGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.masterOfOrion', 'Master of Orion')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

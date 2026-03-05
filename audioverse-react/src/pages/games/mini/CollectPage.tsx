import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import CollectGame from './CollectGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function CollectPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'collect')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'classic', label: t('miniGames.classic', 'Classic') },
      { value: 'hoarder', label: t('miniGames.hoarder', 'Hoarder') },
      { value: 'teamCollect', label: t('miniGames.teamCollect', 'Team Collect') },
    ], defaultValue: 'classic' },
    DIFFICULTY_SETTING(t),
    { key: 'roundTime', label: t('miniGames.roundTime', 'Round Time (sec)'), type: 'range', min: 30, max: 120, step: 10, defaultValue: 60 },
    { key: 'coinFrequency', label: t('miniGames.coinFrequency', 'Coin Frequency'), type: 'select', options: [
      { value: 'low', label: t('miniGames.low', 'Low') },
      { value: 'normal', label: t('miniGames.normal', 'Normal') },
      { value: 'high', label: t('miniGames.high', 'High') },
    ], defaultValue: 'normal' },
  ]

  if (phase === 'game') {
    return <CollectGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.collect', 'Collect')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

/**
 * ShmupPage — lobby → settings → title → game flow for the Shmup mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import ShmupGame from './ShmupGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function ShmupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'shmup')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'arcade', label: t('miniGames.arcade', 'Arcade') },
      { value: 'vs-score', label: t('miniGames.vsScore', 'VS Score') },
      { value: 'coop-campaign', label: t('miniGames.coopCampaign', 'Co-op Campaign') },
    ], defaultValue: 'arcade' },
    DIFFICULTY_SETTING(t),
    { key: 'autoFire', label: t('miniGames.autoFire', 'Auto-Fire'), type: 'select' as const, options: [
      { value: 'on', label: t('miniGames.on', 'On') },
      { value: 'off', label: t('miniGames.off', 'Off') },
    ], defaultValue: 'on' },
    { key: 'bulletDensity', label: t('miniGames.bulletDensity', 'Bullet Density'), type: 'select' as const, options: [
      { value: 'low', label: t('miniGames.low', 'Low') },
      { value: 'normal', label: t('miniGames.normal', 'Normal') },
      { value: 'bullet-hell', label: t('miniGames.bulletHell', 'Bullet Hell') },
    ], defaultValue: 'normal' },
  ]

  if (phase === 'game') {
    return <ShmupGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.shmup', 'Shmup')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

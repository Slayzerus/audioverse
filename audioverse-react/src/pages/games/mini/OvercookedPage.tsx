/**
 * OvercookedPage — lobby → settings → title → game flow for the Overcooked mini game.
 *
 * Cooperative cooking chaos for 1-4 players.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import UnderpaidTimeManagementGame from '../../../games/underpaid-timemanagement/UnderpaidTimeManagementGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function OvercookedPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'underpaid-timemanagement')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'coop-kitchen', label: t('miniGames.coopKitchen', 'Co-op Kitchen') },
      { value: 'vs-kitchen', label: t('miniGames.vsKitchen', 'VS Kitchen') },
    ], defaultValue: 'coop-kitchen' },
    DIFFICULTY_SETTING(t),
    { key: 'orderSpeed', label: t('miniGames.orderSpeed', 'Order Speed'), type: 'select' as const, options: [
      { value: 'slow', label: t('miniGames.slow', 'Slow') },
      { value: 'normal', label: t('miniGames.normal', 'Normal') },
      { value: 'fast', label: t('miniGames.fast', 'Fast') },
    ], defaultValue: 'normal' },
    { key: 'kitchenLayout', label: t('miniGames.kitchenLayout', 'Kitchen Layout'), type: 'select' as const, options: [
      { value: 'simple', label: t('miniGames.simple', 'Simple') },
      { value: 'medium', label: t('miniGames.medium', 'Medium') },
      { value: 'complex', label: t('miniGames.complex', 'Complex') },
    ], defaultValue: 'simple' },
  ]

  if (phase === 'game') {
    return <UnderpaidTimeManagementGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.overcooked', 'Overcooked')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

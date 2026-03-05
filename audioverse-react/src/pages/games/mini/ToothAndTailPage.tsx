/**
 * ToothAndTailPage — lobby → settings → title → game flow for the
 * War Is On medieval RTS mini game.
 *
 * Supports single / couch / online modes, VS and co-op.
 * Split-screen viewports for each player.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import WarIsOnGame from '../../../games/war-is-on-rts/WarIsOnGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'
import { ALL_MAPS } from '../../../games/war-is-on-rts/maps'

export default function ToothAndTailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'war-is-on-rts')!

  // Settings definitions for this game
  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'skirmish', label: t('miniGames.skirmish', 'Skirmish (FFA)') },
      { value: 'coop-campaign', label: t('miniGames.coopCampaign', 'Co-op Campaign') },
      { value: 'survival', label: t('miniGames.survival', 'Survival') },
    ], defaultValue: 'skirmish' },
    DIFFICULTY_SETTING(t),
    { key: 'mapId', label: t('miniGames.map', 'Map'), type: 'select' as const, options: [
      { value: 'random', label: '🎲 ' + t('miniGames.randomMap', 'Random') },
      ...ALL_MAPS.map(m => ({ value: m.id, label: m.name })),
    ], defaultValue: 'random' },
    { key: 'startingGold', label: t('miniGames.startingGold', 'Starting Gold'), type: 'select' as const, options: [
      { value: 30, label: '30' },
      { value: 50, label: '50' },
      { value: 100, label: '100' },
    ], defaultValue: 50 },
  ]

  if (phase === 'game') {
    return <WarIsOnGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.toothAndTail', 'Tooth & Tail')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

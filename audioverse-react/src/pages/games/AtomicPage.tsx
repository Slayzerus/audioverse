/**
 * FalloutPage — lobby → settings → title → game flow for the Fallout mini game.
 *
 * Isometric action RPG in a post-apocalyptic wasteland.
 * Supports single / couch / online modes, VS and co-op.
 */
import { useState } from 'react'
import { useGamePhase } from './mini/useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './mini/PlayerLobby'
import FalloutGame from '../../games/atomic-postapo/AtomicPostApoGame'
import TitleCard from './mini/TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './mini/GameSettings'
import { createBotSlots } from './mini/botAI'
import { MINI_GAMES } from './mini/gameRegistry'
import type { GameConfig, PlayerSlot } from './mini/types'

export default function FalloutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'atomic-postapo')!

  // Settings definitions for this game
  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'explore', label: t('miniGames.explore', 'Explore') },
      { value: 'coop-survival', label: t('miniGames.coopSurvival', 'Co-op Survival') },
      { value: 'vs-wasteland', label: t('miniGames.vsWasteland', 'VS Wasteland') },
    ], defaultValue: 'explore' },
    DIFFICULTY_SETTING(t),
    { key: 'mapSize', label: t('miniGames.mapSize', 'Map Size'), type: 'select' as const, options: [
      { value: 'small', label: t('miniGames.small', 'Small') },
      { value: 'medium', label: t('miniGames.medium', 'Medium') },
      { value: 'large', label: t('miniGames.large', 'Large') },
    ], defaultValue: 'medium' },
    { key: 'startingGear', label: t('miniGames.startingGear', 'Starting Gear'), type: 'select' as const, options: [
      { value: 'basic', label: t('miniGames.basic', 'Basic') },
      { value: 'military', label: t('miniGames.military', 'Military') },
      { value: 'scavenger', label: t('miniGames.scavenger', 'Scavenger') },
    ], defaultValue: 'basic' },
  ]

  if (phase === 'game') {
    return <FalloutGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.fallout', 'Fallout')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

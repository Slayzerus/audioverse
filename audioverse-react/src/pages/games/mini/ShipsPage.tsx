/**
 * ShipsPage — lobby → settings → title → game flow for Ships mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import ShipsGame from './ShipsGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function ShipsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'ships')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'adventure', label: t('miniGames.adventure', 'Adventure') },
      { value: 'vs-naval', label: t('miniGames.vsNaval', 'VS Naval') },
      { value: 'coop-pirates', label: t('miniGames.coopPirates', 'Co-op Pirates') },
    ], defaultValue: 'adventure' },
    DIFFICULTY_SETTING(t),
    { key: 'mapSize', label: t('miniGames.mapSize', 'Map Size'), type: 'select' as const, options: [
      { value: 'small', label: t('miniGames.small', 'Small') },
      { value: 'medium', label: t('miniGames.medium', 'Medium') },
      { value: 'large', label: t('miniGames.large', 'Large') },
    ], defaultValue: 'medium' },
    { key: 'enemyCount', label: t('miniGames.enemyCount', 'Enemy Count'), type: 'select' as const, options: [
      { value: 'few', label: t('miniGames.few', 'Few') },
      { value: 'normal', label: t('miniGames.normal', 'Normal') },
      { value: 'many', label: t('miniGames.many', 'Many') },
    ], defaultValue: 'normal' },
  ]

  if (phase === 'game') {
    return <ShipsGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
        onStart={(cfg) => {
          const bots = createBotSlots(humanPlayers.length, cfg._botCount || 0)
          setAllPlayers([...humanPlayers, ...bots])
          setGameConfig(cfg)
          setPhase('title')
        }}
      />
    )
  }

  return (
    <PlayerLobby
      title={`${gameMeta.icon} ${t('miniGames.ships', 'Ships')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

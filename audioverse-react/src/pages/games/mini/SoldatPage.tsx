/**
 * SoldatPage — lobby → settings → title → game flow for the Soldat mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import FlatworldGame from '../../../games/flatworld-survival-shooter/FlatworldGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function SoldatPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'flatworld-survival-shooter')!

  // Settings definitions for this game
  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'survival', label: t('miniGames.survival', 'Survival') },
      { value: 'deathmatch', label: t('miniGames.deathmatch', 'Deathmatch') },
      { value: 'team-deathmatch', label: t('miniGames.teamDeathmatch', 'Team Deathmatch') },
      { value: 'coop-survival', label: t('miniGames.coopSurvival', 'Co-op Survival') },
    ], defaultValue: 'survival' },
    DIFFICULTY_SETTING(t),
    { key: 'killsToWin', label: t('miniGames.killsToWin', 'Kills to Win'), type: 'select', options: [
      { value: 5, label: '5' },
      { value: 10, label: '10' },
      { value: 20, label: '20' },
    ], defaultValue: 10 },
    { key: 'mapSize', label: t('miniGames.mapSize', 'Map Size'), type: 'select', options: [
      { value: 'small', label: t('miniGames.small', 'Small') },
      { value: 'medium', label: t('miniGames.medium', 'Medium') },
      { value: 'large', label: t('miniGames.large', 'Large') },
    ], defaultValue: 'medium' },
  ]

  if (phase === 'game') {
    return <FlatworldGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.soldat', 'Soldat')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

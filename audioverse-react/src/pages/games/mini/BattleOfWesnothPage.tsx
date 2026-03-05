/**
 * BattleOfWesnothPage — lobby → settings → title → game flow for the
 * Battle of Wesnoth-inspired hex strategy mini-game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import BattleOfWesnothGame from './BattleOfWesnothGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function BattleOfWesnothPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'battle-of-wesnoth')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'skirmish', label: t('miniGames.skirmish', 'Skirmish') },
      { value: 'coop-campaign', label: t('miniGames.coopCampaign', 'Co-op Campaign') },
      { value: 'survival', label: t('miniGames.survival', 'Survival') },
    ], defaultValue: 'skirmish' },
    DIFFICULTY_SETTING(t),
    { key: 'mapSize', label: t('miniGames.mapSize', 'Map Size'), type: 'select' as const, options: [
      { value: 'small', label: t('miniGames.small', 'Small') },
      { value: 'medium', label: t('miniGames.medium', 'Medium') },
      { value: 'large', label: t('miniGames.large', 'Large') },
    ], defaultValue: 'medium' },
    { key: 'goldPerVillage', label: t('miniGames.goldPerVillage', 'Gold per Village'), type: 'select' as const, options: [
      { value: 1, label: '1' },
      { value: 2, label: '2' },
      { value: 3, label: '3' },
    ], defaultValue: 2 },
  ]

  if (phase === 'game') {
    return <BattleOfWesnothGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.battleOfWesnoth', 'Battle of Wesnoth')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

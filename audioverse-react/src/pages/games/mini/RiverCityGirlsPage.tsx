/**
 * RiverCityGirlsPage — lobby → settings → title → game flow for the
 * River City Girls beat 'em up mini-game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import RiverCityGirlsGame from './RiverCityGirlsGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function RiverCityGirlsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'river-city-girls')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'story-coop', label: t('miniGames.storyCoop', 'Story Co-op') },
      { value: 'vs-brawl', label: t('miniGames.vsBrawl', 'VS Brawl') },
      { value: 'survival', label: t('miniGames.survival', 'Survival') },
    ], defaultValue: 'story-coop' },
    DIFFICULTY_SETTING(t),
    { key: 'lives', label: t('miniGames.lives', 'Lives'), type: 'select' as const, options: [
      { value: 3, label: '3' },
      { value: 5, label: '5' },
      { value: 7, label: '7' },
    ], defaultValue: 3 },
    { key: 'waveCount', label: t('miniGames.waveCount', 'Wave Count'), type: 'select' as const, options: [
      { value: 5, label: '5' },
      { value: 10, label: '10' },
      { value: 15, label: '15' },
    ], defaultValue: 5 },
  ]

  if (phase === 'game') {
    return <RiverCityGirlsGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.riverCityGirls', 'River City Girls')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

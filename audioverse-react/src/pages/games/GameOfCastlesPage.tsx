/**
 * HeroesOfMightAndMagicPage — lobby → settings → title → game flow for the
 * Heroes of Might & Magic mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './mini/useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './mini/PlayerLobby'
import GameOfCastlesGame from '../../games/game-of-castles/GameOfCastlesGame'
import TitleCard from './mini/TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './mini/GameSettings'
import { createBotSlots } from './mini/botAI'
import { MINI_GAMES } from './mini/gameRegistry'
import type { GameConfig, PlayerSlot } from './mini/types'

export default function HeroesOfMightAndMagicPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'game-of-castles')!

  // Settings definitions for this game
  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'conquest', label: t('miniGames.conquest', 'Conquest') },
      { value: 'coop-campaign', label: t('miniGames.coopCampaign', 'Coop Campaign') },
      { value: 'vs-skirmish', label: t('miniGames.vsSkirmish', 'VS Skirmish') },
    ], defaultValue: 'conquest' },
    DIFFICULTY_SETTING(t),
    { key: 'combatMode', label: t('miniGames.combatMode', 'Combat Mode'), type: 'select' as const, options: [
      { value: 'real-time', label: t('miniGames.realTime', 'Real-Time') },
      { value: 'turn-based', label: t('miniGames.turnBased', 'Turn-Based') },
    ], defaultValue: 'turn-based' },
    { key: 'mapSize', label: t('miniGames.mapSize', 'Map Size'), type: 'select' as const, options: [
      { value: 'small', label: t('miniGames.small', 'Small') },
      { value: 'medium', label: t('miniGames.medium', 'Medium') },
      { value: 'large', label: t('miniGames.large', 'Large') },
    ], defaultValue: 'medium' },
  ]

  if (phase === 'game') {
    return <GameOfCastlesGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.heroesOfMightAndMagic', 'Heroes of Might & Magic')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

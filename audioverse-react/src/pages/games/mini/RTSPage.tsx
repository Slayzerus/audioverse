/**
 * RTSPage — lobby → settings → title → game flow for the RTS mini game.
 *
 * Classic RTS combining Red Alert / StarCraft / Age of Empires with
 * base building, resource gathering, army building, and era advancement.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import RTSGame from './RTSGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function RTSPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'rts')!

  // Settings definitions for this game
  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'skirmish', label: t('miniGames.skirmish', 'Skirmish') },
      { value: 'coop-campaign', label: t('miniGames.coopCampaign', 'Co-op Campaign') },
      { value: 'vs-deathmatch', label: t('miniGames.vsDeathmatch', 'VS Deathmatch') },
    ], defaultValue: 'skirmish' },
    DIFFICULTY_SETTING(t),
    { key: 'worldTheme', label: t('miniGames.worldTheme', 'World Theme'), type: 'select' as const, options: [
      { value: 'temperate', label: t('miniGames.temperate', 'Temperate') },
      { value: 'desert', label: t('miniGames.desert', 'Desert') },
      { value: 'snow', label: t('miniGames.snow', 'Snow') },
      { value: 'alien', label: t('miniGames.alien', 'Alien') },
    ], defaultValue: 'temperate' },
    { key: 'startingAge', label: t('miniGames.startingAge', 'Starting Age'), type: 'select' as const, options: [
      { value: 1, label: t('miniGames.stone', 'Age 1 — Stone') },
      { value: 2, label: t('miniGames.medieval', 'Age 2 — Medieval') },
      { value: 3, label: t('miniGames.industrial', 'Age 3 — Industrial') },
    ], defaultValue: 1 },
  ]

  if (phase === 'game') {
    return <RTSGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.rts', 'RTS Command')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

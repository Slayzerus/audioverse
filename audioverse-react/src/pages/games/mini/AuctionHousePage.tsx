/**
 * AuctionHousePage — lobby → settings → title → game flow for the Auction House mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import AuctionHouseGame from './AuctionHouseGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function AuctionHousePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'auction-house')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'career', label: t('miniGames.career', 'Career') },
      { value: 'vs-tycoon', label: t('miniGames.vsTycoon', 'VS — Tycoon') },
      { value: 'coop-dealers', label: t('miniGames.coopDealers', 'Co-op — Dealers') },
    ], defaultValue: 'career' },
    DIFFICULTY_SETTING(t),
    { key: 'rounds', label: t('miniGames.rounds', 'Rounds'), type: 'select' as const, options: [
      { value: 5, label: '5' },
      { value: 8, label: '8' },
      { value: 12, label: '12' },
    ], defaultValue: 8 },
    { key: 'startingBudget', label: t('miniGames.startingBudget', 'Starting Budget'), type: 'select' as const, options: [
      { value: 'low', label: t('miniGames.low', 'Low (200)') },
      { value: 'normal', label: t('miniGames.normal', 'Normal (500)') },
      { value: 'high', label: t('miniGames.high', 'High (1000)') },
    ], defaultValue: 'normal' },
  ]

  if (phase === 'game') {
    return <AuctionHouseGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.auctionHouse', 'Auction House')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

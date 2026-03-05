/**
 * StarMerchantPage — lobby → settings → title → game flow for Star Merchant.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import StarMerchantGame from './StarMerchantGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function StarMerchantPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'star-merchant')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'free-trade', label: t('miniGames.freeTrade', 'Free Trade') },
      { value: 'vs-wealth', label: t('miniGames.vsWealth', 'VS — Wealth') },
      { value: 'coop-target', label: t('miniGames.coopTarget', 'Co-op Target') },
    ], defaultValue: 'free-trade' },
    DIFFICULTY_SETTING(t),
    { key: 'planetCount', label: t('miniGames.planetCount', 'Planets'), type: 'select' as const, options: [
      { value: 8, label: '8' },
      { value: 10, label: '10' },
      { value: 12, label: '12' },
    ], defaultValue: 8 },
    { key: 'pirateFrequency', label: t('miniGames.pirateFrequency', 'Pirates'), type: 'select' as const, options: [
      { value: 'none', label: t('miniGames.none', 'None') },
      { value: 'few', label: t('miniGames.few', 'Few') },
      { value: 'many', label: t('miniGames.many', 'Many') },
    ], defaultValue: 'few' },
  ]

  if (phase === 'game') {
    return <StarMerchantGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.starMerchant', 'Star Merchant')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

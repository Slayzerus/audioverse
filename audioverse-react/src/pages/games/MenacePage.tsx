/**
 * GTA2Page — lobby → settings → title → game flow for the GTA2 mini game.
 */
import { useState } from 'react'
import { useGamePhase } from './mini/useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './mini/PlayerLobby'
import GTA2Game from '../../games/menace-shooter/MenaceGame'
import TitleCard from './mini/TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './mini/GameSettings'
import { createBotSlots } from './mini/botAI'
import { MINI_GAMES } from './mini/gameRegistry'
import type { GameConfig, PlayerSlot } from './mini/types'

export default function GTA2Page() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'menace-shooter')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'free-roam', label: t('miniGames.freeRoam', 'Free Roam') },
      { value: 'vs-rampage', label: t('miniGames.vsRampage', 'VS Rampage') },
      { value: 'coop-heist', label: t('miniGames.coopHeist', 'Co-op Heist') },
    ], defaultValue: 'free-roam' },
    DIFFICULTY_SETTING(t),
    { key: 'policeAggression', label: t('miniGames.policeAggression', 'Police Aggression'), type: 'select' as const, options: [
      { value: 'low', label: t('miniGames.low', 'Low') },
      { value: 'normal', label: t('miniGames.normal', 'Normal') },
      { value: 'high', label: t('miniGames.high', 'High') },
    ], defaultValue: 'normal' },
    { key: 'citySize', label: t('miniGames.citySize', 'City Size'), type: 'select' as const, options: [
      { value: 'small', label: t('miniGames.small', 'Small') },
      { value: 'medium', label: t('miniGames.medium', 'Medium') },
      { value: 'large', label: t('miniGames.large', 'Large') },
    ], defaultValue: 'medium' },
  ]

  if (phase === 'game') {
    return <GTA2Game players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.gta2', 'GTA 2')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

/**
 * UplinkPage — lobby → settings → title → game flow for the Uplink mini game.
 *
 * Uplink-inspired hacking simulation: hack servers, steal data, avoid traces.
 * Supports single/couch/online, vs and coop modes.
 */
import { useState } from 'react'
import { useGamePhase } from './useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './PlayerLobby'
import UplinkGame from './UplinkGame'
import TitleCard from './TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './GameSettings'
import { createBotSlots } from './botAI'
import { MINI_GAMES } from './gameRegistry'
import type { GameConfig, PlayerSlot } from './types'

export default function UplinkPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'uplink')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'contracts', label: t('miniGames.contracts', 'Contracts') },
      { value: 'vs-hack-race', label: t('miniGames.vsHackRace', 'VS Hack Race') },
      { value: 'coop-heist', label: t('miniGames.coopHeist', 'Co-op Heist') },
    ], defaultValue: 'contracts' },
    DIFFICULTY_SETTING(t),
    { key: 'traceSpeed', label: t('miniGames.traceSpeed', 'Trace Speed'), type: 'select' as const, options: [
      { value: 'slow', label: t('miniGames.slow', 'Slow') },
      { value: 'normal', label: t('miniGames.normal', 'Normal') },
      { value: 'fast', label: t('miniGames.fast', 'Fast') },
    ], defaultValue: 'normal' },
    { key: 'contractDifficulty', label: t('miniGames.contractDifficulty', 'Contract Difficulty'), type: 'select' as const, options: [
      { value: 'easy', label: t('miniGames.easy', 'Easy (3 nodes)') },
      { value: 'medium', label: t('miniGames.medium', 'Medium (5 nodes)') },
      { value: 'hard', label: t('miniGames.hard', 'Hard (7 nodes)') },
    ], defaultValue: 'medium' },
  ]

  if (phase === 'game') {
    return <UplinkGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('miniGames.uplink', 'Uplink')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

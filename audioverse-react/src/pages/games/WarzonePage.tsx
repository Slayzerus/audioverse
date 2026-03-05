/**
 * BattlefieldPage — lobby → settings → title → game flow for the Warzone FPP game.
 *
 * 3D First-Person Shooter — Cops vs Robbers.
 * 11 game modes, 8+ procedural city maps, Three.js rendering.
 * Supports single, couch, and online modes; VS and co-op.
 */
import { useState } from 'react'
import { useGamePhase } from './mini/useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './mini/PlayerLobby'
import BattlefieldGame from '../../games/warzone-fpp/WarzoneFppGame'
import TitleCard from './mini/TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './mini/GameSettings'
import { createBotSlots } from './mini/botAI'
import { MINI_GAMES } from './mini/gameRegistry'
import type { GameConfig, PlayerSlot } from './mini/types'
import { getMapsForMode, MAP_PRESETS } from '../../games/warzone-fpp/mapPresets'
import type { GameMode } from '../../games/warzone-fpp/types'

const ALL_MODES: { value: GameMode; label: string }[] = [
  { value: 'battle-royale', label: '\uD83C\uDFC6 Battle Royale' },
  { value: 'deathmatch', label: 'Deathmatch' },
  { value: 'team-deathmatch', label: 'Team Deathmatch' },
  { value: 'conquest', label: 'Conquest' },
  { value: 'bomb', label: 'Bomb (Search & Destroy)' },
  { value: 'heist', label: 'Heist (Asymmetric CTF)' },
  { value: 'ctf', label: 'Capture the Flag' },
  { value: 'escort', label: 'Escort VIP' },
  { value: 'convoy', label: 'Convoy' },
  { value: 'race', label: 'Race (Vehicles)' },
  { value: 'survival', label: 'Survival' },
  { value: 'coop-assault', label: 'Co-op Assault' },
]

export default function BattlefieldPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'warzone-fpp')!

  // Build dynamic map list based on selected mode
  const selectedMode = (gameConfig.gameMode as GameMode) || 'conquest'
  const mapsForMode = getMapsForMode(selectedMode)
  const mapOptions = mapsForMode.length > 0
    ? mapsForMode.map(mp => ({ value: mp.id, label: mp.name }))
    : MAP_PRESETS.map(mp => ({ value: mp.id, label: mp.name }))

  // Settings definitions for this game
  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameModeType', label: t('miniGames.modeType', 'Mode Type'), type: 'select' as const,
      options: [
        { value: 'realistic', label: 'Realistic (fast death)' },
        { value: 'arcade', label: 'Arcade (slow death)' },
      ],
      defaultValue: 'realistic',
    },
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const,
      options: ALL_MODES.map(m => ({ value: m.value, label: m.label })),
      defaultValue: 'conquest',
    },
    { key: 'mapId', label: t('miniGames.map', 'Map'), type: 'select' as const,
      options: mapOptions,
      defaultValue: mapOptions[0]?.value || 'bank_district',
    },
    DIFFICULTY_SETTING(t),
    { key: 'ticketsPerTeam', label: t('miniGames.tickets', 'Tickets per Team'), type: 'select' as const, options: [
      { value: 50, label: '50' },
      { value: 100, label: '100' },
      { value: 200, label: '200' },
      { value: 500, label: '500' },
    ], defaultValue: 200 },
    { key: 'maxRounds', label: t('miniGames.rounds', 'Max Rounds'), type: 'select' as const, options: [
      { value: 3, label: '3' },
      { value: 5, label: '5' },
      { value: 7, label: '7' },
      { value: 13, label: '13' },
    ], defaultValue: 5 },
  ]

  if (phase === 'game') {
    return <BattlefieldGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
  }

  if (phase === 'title') {
    return <TitleCard game={gameMeta} playerCount={allPlayers.length} onDone={() => setPhase('game')} />
  }

  if (phase === 'settings') {
    return (
      <GameSettings
        title={`${gameMeta.icon} ${gameMeta.title}`}
        settings={settingsDefs}
        maxBots={15}
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
      title={`${gameMeta.icon} ${t('miniGames.battlefield', 'Warzone')}`}
      minPlayers={1}
      maxPlayers={16}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

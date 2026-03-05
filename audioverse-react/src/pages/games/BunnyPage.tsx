/**
 * BunnyPage — lobby → settings → title → game for the Bunny physics game.
 *
 * Inspired by Super Bunny Man — physics-based ragdoll platformer.
 * Supports arena (fight), puzzle (obstacles), and free (sandbox) modes.
 */
import { useState } from 'react'
import { useGamePhase } from './mini/useGamePhase'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PlayerLobby from './mini/PlayerLobby'
import BunnyGame from '../../games/bunny-arena/BunnyGame'
import TitleCard from './mini/TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './mini/GameSettings'
import { createBotSlots } from './mini/botAI'
import { MINI_GAMES } from './mini/gameRegistry'
import type { GameConfig, PlayerSlot } from './mini/types'

export default function BunnyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<'lobby' | 'settings' | 'title' | 'game'>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})

  const gameMeta = MINI_GAMES.find(g => g.id === 'bunny-arena')!

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    {
      key: 'mode', label: t('bunny.gameMode', 'Game Mode'), type: 'select',
      options: [
        { value: 'arena', label: t('bunny.arena', 'Arena Fight') },
        { value: 'puzzle', label: t('bunny.puzzle', 'Puzzle') },
        { value: 'free', label: t('bunny.free', 'Free Play') },
      ],
      defaultValue: 'arena',
    },
    DIFFICULTY_SETTING(t),
    {
      key: 'lives', label: t('bunny.lives', 'Lives'), type: 'range',
      min: 1, max: 10, step: 1, defaultValue: 3,
    },
    {
      key: 'gravity', label: t('bunny.gravity', 'Gravity'), type: 'range',
      min: 1, max: 5, step: 1, defaultValue: 3,
    },
    {
      key: 'motorcycle', label: t('bunny.motorcycle', 'Motorcycle'), type: 'toggle',
      defaultValue: false,
    },
  ]

  if (phase === 'game') {
    return <BunnyGame players={allPlayers} config={gameConfig} onBack={() => setPhase('lobby')} />
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
      title={`${gameMeta.icon} ${t('bunny.title', 'Bunny')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

/**
 * EightMinuteEmpirePage — lobby → settings → title → game flow for
 * the Eight Minute Empire-inspired area-control strategy mini game.
 * Now includes card-editor and map-editor phases.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGamePhase } from './mini/useGamePhase'
import PlayerLobby from './mini/PlayerLobby'
import EightMinuteEmpireGame, { type CardDef, type MapTemplate } from '../../games/danger-zone-area-control/DangeZoneGame'
import CardEditor from '../../games/danger-zone-area-control/CardEditor'
import MapEditor from '../../games/danger-zone-area-control/MapEditor'
import TitleCard from './mini/TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './mini/GameSettings'
import { createBotSlots } from './mini/botAI'
import { MINI_GAMES } from './mini/gameRegistry'
import type { GameConfig, PlayerSlot } from './mini/types'

type Phase = 'lobby' | 'settings' | 'title' | 'game' | 'card-editor' | 'map-editor'

export default function EightMinuteEmpirePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phase, setPhase] = useGamePhase<Phase>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})
  const [customCards, setCustomCards] = useState<Omit<CardDef, 'id'>[] | undefined>()
  const [customMap, setCustomMap] = useState<MapTemplate | undefined>()

  const gameMeta = MINI_GAMES.find(g => g.id === 'danger-zone-area-control')!

  // Load persisted custom content on mount
  useEffect(() => {
    try {
      const rawC = localStorage.getItem('eme-custom-cards')
      if (rawC) setCustomCards(JSON.parse(rawC))
    } catch { /* Expected: localStorage or JSON parse may fail */ }
    try {
      const rawM = localStorage.getItem('eme-custom-map')
      if (rawM) setCustomMap(JSON.parse(rawM))
    } catch { /* Expected: localStorage or JSON parse may fail */ }
  }, [])

  const handleCardSave = useCallback((cards: Omit<CardDef, 'id'>[]) => {
    setCustomCards(cards)
    setPhase('settings')
  }, [])

  const handleMapSave = useCallback((map: MapTemplate) => {
    setCustomMap(map)
    setPhase('settings')
  }, [])

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'turnMode', label: t('miniGames.turnMode', 'Turn Mode'), type: 'select' as const, options: [
      { value: 'turn-based', label: t('miniGames.turnBased', 'Turn-based (sequential)') },
      { value: 'real-time', label: t('miniGames.realTime', 'Real-time (simultaneous)') },
    ], defaultValue: 'turn-based' },
    { key: 'combatMode', label: t('miniGames.combatMode', 'Combat Mode'), type: 'select' as const, options: [
      { value: 'classic', label: t('miniGames.classicCombat', 'Classic (endgame scoring)') },
      { value: 'immediate', label: t('miniGames.immediateCombat', 'Immediate (resolve on contact)') },
    ], defaultValue: 'classic' },
    DIFFICULTY_SETTING(t),
    { key: 'gameDuration', label: t('miniGames.gameDuration', 'Game Duration'), type: 'select' as const, options: [
      { value: '5', label: t('miniGames.fiveMin', '5 Minutes') },
      { value: '8', label: t('miniGames.eightMin', '8 Minutes') },
      { value: '12', label: t('miniGames.twelveMin', '12 Minutes') },
    ], defaultValue: '8' },
    { key: 'mapSize', label: t('miniGames.mapSize', 'Map Size'), type: 'select' as const, options: [
      { value: 'small', label: t('miniGames.small', 'Small') },
      { value: 'medium', label: t('miniGames.medium', 'Medium') },
      { value: 'large', label: t('miniGames.large', 'Large') },
    ], defaultValue: 'medium' },
  ]

  if (phase === 'card-editor') {
    return <CardEditor onBack={() => setPhase('settings')} onSave={handleCardSave} initialCards={customCards} />
  }

  if (phase === 'map-editor') {
    return <MapEditor onBack={() => setPhase('settings')} onSave={handleMapSave} initialMap={customMap} />
  }

  if (phase === 'game') {
    return (
      <EightMinuteEmpireGame
        players={allPlayers}
        config={gameConfig}
        customCards={customCards}
        customMap={customMap}
        onBack={() => setPhase('lobby')}
      />
    )
  }

  if (phase === 'title') {
    return <TitleCard game={gameMeta} playerCount={allPlayers.length} onDone={() => setPhase('game')} />
  }

  if (phase === 'settings') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
        {/* Editor buttons under settings */}
        <div style={{
          display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <button
            onClick={() => setPhase('card-editor')}
            style={editorBtnStyle}
          >
            🃏 Card Editor {customCards ? `(${customCards.length})` : ''}
          </button>
          <button
            onClick={() => setPhase('map-editor')}
            style={editorBtnStyle}
          >
            🗺️ Map Editor {customMap ? `(${customMap.name})` : ''}
          </button>
          {(customCards || customMap) && (
            <button
              onClick={() => { setCustomCards(undefined); setCustomMap(undefined); localStorage.removeItem('eme-custom-cards'); localStorage.removeItem('eme-custom-map') }}
              style={{ ...editorBtnStyle, borderColor: '#c0392b' }}
            >
              🔄 Reset Custom Content
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <PlayerLobby
      title={`${gameMeta.icon} ${t('miniGames.eightMinuteEmpire', 'Eight Minute Empire')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => { setHumanPlayers(p); setPhase('settings') }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

const editorBtnStyle: React.CSSProperties = {
  background: '#1a1a2e', color: '#ddd', border: '1px solid #555',
  borderRadius: 6, padding: '8px 18px', fontSize: 14, cursor: 'pointer',
}

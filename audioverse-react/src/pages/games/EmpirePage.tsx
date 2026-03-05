/**
 * EmpirePage — Full meta-game flow for Empire RTS:
 *   lobby → menu → (campaign | settings | online) → title → game → result
 *
 * Kingdom Two Crowns-style side-scrolling RTS with economy, combat, waves.
 * Supports 1-8 players, 1-4 teams, PVE/PVP, campaign/skirmish/endless.
 * Full i18n, campaign progression, online multiplayer, couch split-screen.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGamePhase } from './mini/useGamePhase'
import PlayerLobby from './mini/PlayerLobby'
import EmpireGame from '../../games/empire-rts/EmpireGame'
import TitleCard from './mini/TitleCard'
import GameSettings, { DIFFICULTY_SETTING, type SettingDef } from './mini/GameSettings'
import { createBotSlots } from './mini/botAI'
import { MINI_GAMES } from './mini/gameRegistry'
import type { GameConfig, PlayerSlot } from './mini/types'

import EmpireMenu from '../../games/empire-rts/EmpireMenu'
import type { EmpireMenuScreen } from '../../games/empire-rts/EmpireMenu'
import EmpireCampaignMap from '../../games/empire-rts/EmpireCampaignMap'
import type { EmpireProfile, MatchResult, CampaignChapter } from '../../games/empire-rts/campaign'
import {
  loadProfile, saveProfile, createNewProfile, processMatchResult,
} from '../../games/empire-rts/campaign'
import css from '../../games/empire-rts/SharedGame.module.css'

type Phase =
  | 'lobby'
  | 'menu'
  | 'campaign'
  | 'settings'
  | 'title'
  | 'game'
  | 'result'

export default function EmpirePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [phase, setPhase] = useGamePhase<Phase>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})
  const [profile, setProfile] = useState<EmpireProfile | null>(null)
  const [lastResult, setLastResult] = useState<MatchResult | null>(null)
  const [_activeChapter, setActiveChapter] = useState<CampaignChapter | null>(null)

  const gameMeta = MINI_GAMES.find(g => g.id === 'empire-rts')!

  // Load/create profile on mount
  useEffect(() => {
    const p = loadProfile()
    if (p) setProfile(p)
  }, [])

  const updateProfile = useCallback((p: EmpireProfile) => {
    setProfile(p)
    saveProfile(p)
  }, [])

  // ── Battle end handler ──────────────────────────────────
  const handleBattleEnd = useCallback((result: Omit<MatchResult, 'xpGained'>) => {
    if (!profile) return
    const p = { ...profile, stats: { ...profile.stats }, campaignProgress: { ...profile.campaignProgress, bestWaves: { ...profile.campaignProgress.bestWaves }, completedChapters: [...profile.campaignProgress.completedChapters] } }
    const finalResult = processMatchResult(p, result)
    updateProfile(p)
    setLastResult(finalResult)
    setActiveChapter(null)
    setPhase('result')
  }, [profile, updateProfile])

  // ── Menu navigation ─────────────────────────────────────
  const handleMenuNavigate = useCallback((screen: EmpireMenuScreen) => {
    switch (screen) {
      case 'campaign':
        setPhase('campaign')
        break
      case 'skirmish':
        setGameConfig({ mode: 'skirmish', difficulty: 2, teamCount: 1, heroCanAttack: true })
        goToSettings('skirmish')
        break
      case 'endless':
        setGameConfig({ mode: 'endless', difficulty: 2, teamCount: 1, heroCanAttack: true })
        goToSettings('endless')
        break
      case 'pvp':
        setGameConfig({ mode: 'pvp', difficulty: 1, teamCount: 2, heroCanAttack: true })
        goToSettings('pvp')
        break
      case 'online':
        // Use skirmish mode for online (simplified for now)
        setGameConfig({ mode: 'coop', difficulty: 2, teamCount: 1, heroCanAttack: true })
        goToSettings('coop')
        break
      case 'quickPlay':
        setPhase('settings')
        break
    }
  }, [])

  function goToSettings(mode: string) {
    setGameConfig(prev => ({ ...prev, mode }))
    setPhase('settings')
  }

  // ── Campaign battle start ───────────────────────────────
  const handleCampaignStart = useCallback((chapter: CampaignChapter) => {
    setActiveChapter(chapter)
    const bots = createBotSlots(humanPlayers.length, Math.max(0, 2 - humanPlayers.length))
    setAllPlayers([...humanPlayers, ...bots])
    setGameConfig({
      mode: 'coop',
      difficulty: chapter.difficulty,
      teamCount: 1,
      heroCanAttack: true,
      isCampaign: true,
      chapterId: chapter.id,
      wavesToSurvive: chapter.wavesToSurvive,
      startGold: chapter.startGold,
      startWood: chapter.startWood,
      startMeat: chapter.startMeat,
      hasBoss: chapter.hasBoss,
    })
    setPhase('title')
  }, [humanPlayers])

  // ── Settings definitions ────────────────────────────────
  const settingsDefs: SettingDef[] = [
    {
      key: 'mode', label: t('empire.gameMode', 'Game Mode'), type: 'select',
      options: [
        { value: 'coop', label: t('empire.coop', 'Co-op Campaign') },
        { value: 'pvp', label: t('empire.pvp', 'PvP') },
        { value: 'skirmish', label: t('empire.skirmish', 'Skirmish') },
        { value: 'endless', label: t('empire.endless', 'Endless Survival') },
      ],
      defaultValue: gameConfig.mode || 'coop',
    },
    DIFFICULTY_SETTING(t),
    {
      key: 'teamCount', label: t('empire.teamCount', 'Teams'), type: 'range',
      min: 1, max: 4, step: 1, defaultValue: gameConfig.teamCount || 1,
    },
    {
      key: 'heroCanAttack', label: t('empire.heroAttack', 'Hero Can Attack'), type: 'toggle',
      defaultValue: true,
    },
  ]

  // ── Render phases ───────────────────────────────────────

  if (phase === 'game') {
    return (
      <EmpireGame
        players={allPlayers}
        config={gameConfig}
        onBack={() => profile ? setPhase('menu') : setPhase('lobby')}
        onMatchEnd={handleBattleEnd}
      />
    )
  }

  if (phase === 'title') {
    return <TitleCard game={gameMeta} playerCount={allPlayers.length} onDone={() => setPhase('game')} />
  }

  if (phase === 'result' && lastResult) {
    return (
      <div className={css.menuContainer}>
        <div className={css.overlay} style={{ position: 'relative', background: 'none' }}>
          <h2>
            {lastResult.won
              ? `🏆 ${t('miniGames.victory', 'Victory!')}`
              : `💀 ${t('miniGames.gameOver', 'Game Over')}`}
          </h2>
          <div className={css.statsRow} style={{ flexDirection: 'column', gap: '8px', margin: '16px 0' }}>
            <span>📅 {t('empire.statsDaysSurvived', 'Days Survived')}: {lastResult.daysSurvived}</span>
            <span>🌊 {t('empire.statsWavesCleared', 'Waves Cleared')}: {lastResult.wavesCleared}</span>
            <span>👥 {t('empire.statsUnitsRecruited', 'Units Recruited')}: {lastResult.unitsRecruited}</span>
            <span>⚔️ {t('empire.statsEnemiesSlain', 'Enemies Slain')}: {lastResult.enemiesSlain}</span>
            <span>🏗️ {t('empire.statsBuildingsBuilt', 'Buildings Built')}: {lastResult.buildingsBuilt}</span>
          </div>
          <div style={{ fontSize: '1.3rem', color: '#ffd700', margin: '12px 0' }}>
            ✨ +{lastResult.xpGained} XP
          </div>
          <div className={css.overlayActions}>
            <button className={css.restartBtn} onClick={() => setPhase('menu')}>
              {t('miniGames.continue', 'Continue')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'campaign' && profile) {
    return (
      <EmpireCampaignMap
        profile={profile}
        onStartChapter={handleCampaignStart}
        onBack={() => setPhase('menu')}
      />
    )
  }

  if (phase === 'menu' && profile) {
    return (
      <EmpireMenu
        profile={profile}
        onNavigate={handleMenuNavigate}
        onBack={() => setPhase('lobby')}
      />
    )
  }

  if (phase === 'settings') {
    return (
      <GameSettings
        title={`${gameMeta.icon} ${gameMeta.title}`}
        settings={settingsDefs}
        maxBots={7}
        humanPlayers={humanPlayers.length}
        maxPlayers={gameMeta.maxPlayers}
        onBack={() => profile ? setPhase('menu') : setPhase('lobby')}
        onStart={(config) => {
          const bots = createBotSlots(humanPlayers.length, config._botCount || 0)
          setAllPlayers([...humanPlayers, ...bots])
          setGameConfig(prev => ({ ...prev, ...config }))
          setPhase('title')
        }}
      />
    )
  }

  return (
    <PlayerLobby
      title={`${gameMeta.icon} ${t('empire.title', 'Empire RTS')}`}
      minPlayers={1}
      maxPlayers={8}
      onStart={(p) => {
        setHumanPlayers(p)
        let prof = loadProfile()
        if (!prof) {
          prof = createNewProfile()
          saveProfile(prof)
        }
        setProfile(prof)
        setPhase('menu')
      }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

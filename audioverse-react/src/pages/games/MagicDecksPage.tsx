/**
 * MagicTheGatheringPage — full meta-game flow:
 *   lobby → menu → (campaign | skirmish | tutorial | online | deckBuilder | quickPlay)
 *
 * Integrates profile persistence, XP/levels, campaign progression,
 * card capture, deck building, matchmaking, and tutorial.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGamePhase } from './mini/useGamePhase'
import PlayerLobby from './mini/PlayerLobby'
import MagicTheGatheringGame from '../../games/magic-decks-tcg/MagicDecksGame'
import TitleCard from './mini/TitleCard'
import GameSettings, { DIFFICULTY_SETTING, PLAYER_MODE_SETTING, type SettingDef } from './mini/GameSettings'
import { createBotSlots } from './mini/botAI'
import { MINI_GAMES } from './mini/gameRegistry'
import type { GameConfig, PlayerSlot } from './mini/types'

import MagicDecksMenu from '../../games/magic-decks-tcg/MagicDecksMenu'
import CampaignMap from '../../games/magic-decks-tcg/CampaignMap'
import DeckBuilder from '../../games/magic-decks-tcg/DeckBuilder'
import Shop from '../../games/magic-decks-tcg/Shop'
import type { MenuScreen, PlayerProfile, BattleResult, CampaignBattle } from '../../games/magic-decks-tcg/types'
import {
  loadProfile, saveProfile, createNewProfile,
  addXP, addCardToCollection, advanceCampaign,
} from '../../games/magic-decks-tcg/progression'
import { XP_REWARDS, CAMPAIGN_CHAPTERS } from '../../games/magic-decks-tcg/constants'
import {
  buildCampaignOpponentDeck,
  generateSkirmishOpponent,
  type SkirmishOpponent,
} from '../../games/magic-decks-tcg/campaign'
import { getCardsByElement } from '../../games/magic-decks-tcg/cardDatabase'
import {
  initMatchmaking, startSearch, cancelSearch,
  simulateMatchFound, shouldSimulateMatch, startMatch, endMatch,
  getSearchDuration, getOnlineBotDifficulty, getOnlineOpponentElements,
} from '../../games/magic-decks-tcg/matchmaking'
import type { MatchmakingState } from '../../games/magic-decks-tcg/types'
import styles from '../../games/magic-decks-tcg/SharedGame.module.css'

type Phase =
  | 'lobby'
  | 'menu'
  | 'campaign'
  | 'deckBuilder'
  | 'shop'
  | 'settings'
  | 'title'
  | 'game'
  | 'matchmaking'
  | 'result'

export default function MagicTheGatheringPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Core state
  const [phase, setPhase] = useGamePhase<Phase>('lobby')
  const [humanPlayers, setHumanPlayers] = useState<PlayerSlot[]>([])
  const [allPlayers, setAllPlayers] = useState<PlayerSlot[]>([])
  const [gameConfig, setGameConfig] = useState<GameConfig>({})
  const [profile, setProfile] = useState<PlayerProfile | null>(null)

  // Campaign/skirmish state
  const [activeBattle, setActiveBattle] = useState<{ chapterId: string; battleIndex: number; battle: CampaignBattle } | null>(null)
  const [activeSkirmish, setActiveSkirmish] = useState<SkirmishOpponent | null>(null)

  // Matchmaking
  const [matchmaking, setMatchmaking] = useState<MatchmakingState>(initMatchmaking())
  const [matchmakingTimer, setMatchmakingTimer] = useState<NodeJS.Timeout | null>(null)

  // Battle result
  const [lastResult, setLastResult] = useState<BattleResult | null>(null)

  const gameMeta = MINI_GAMES.find(g => g.id === 'magic-decks-tcg')!

  // Load profile on mount
  useEffect(() => {
    const p = loadProfile()
    if (p) setProfile(p)
  }, [])

  // Save profile whenever it changes
  const updateProfile = useCallback((p: PlayerProfile) => {
    setProfile(p)
    saveProfile(p)
  }, [])

  // ── Battle end handler ──────────────────────────────────
  const handleBattleEnd = useCallback((result: BattleResult) => {
    if (!profile) return
    const p = { ...profile }

    // Calculate XP
    let xp: number = result.won ? XP_REWARDS.battleWin : XP_REWARDS.battleLoss
    if (result.isCampaign && result.won) xp = XP_REWARDS.campaignWin

    // Campaign result — advance progress & attempt card capture
    if (activeBattle && result.isCampaign && result.won) {
      const chapter = CAMPAIGN_CHAPTERS.find(c => c.id === activeBattle.chapterId)
      const battle = chapter?.battles[activeBattle.battleIndex]
      // Simple card capture: random card from capture pool
      if (battle && battle.capturePool.length > 0 && Math.random() < 0.5) {
        const capturedId = battle.capturePool[Math.floor(Math.random() * battle.capturePool.length)]
        result.cardCaptured = capturedId
        addCardToCollection(p, capturedId)
        xp += XP_REWARDS.cardCapture
      }
      const chapterDone = advanceCampaign(p, activeBattle.chapterId, activeBattle.battleIndex, chapter?.battles.length ?? 3)
      if (chapterDone) {
        result.chapterCompleted = true
        xp += XP_REWARDS.chapterComplete
        // Grant chapter rewards
        if (chapter) {
          for (const cardId of chapter.reward.cards) {
            p.collection.push(cardId)
          }
        }
      }
    }

    // Skirmish result
    if (activeSkirmish && result.won) {
      // Simple capture from skirmish elements
      if (Math.random() < 0.3) {
        const el = activeSkirmish.elements[Math.floor(Math.random() * activeSkirmish.elements.length)]
        const pool = getCardsByElement(el)
        if (pool.length > 0) {
          const capturedId = pool[Math.floor(Math.random() * pool.length)].id
          result.cardCaptured = capturedId
          addCardToCollection(p, capturedId)
          xp += XP_REWARDS.cardCapture
        }
      }
    }

    // Online result
    if (gameConfig.isOnline && matchmaking.opponent) {
      const mmState = endMatch(matchmaking, result.won)
      setMatchmaking(mmState)
      if (result.won) xp += XP_REWARDS.onlineWin
    }

    // Apply XP
    result.xpGained = xp
    addXP(p, xp)

    // Update profile stats
    p.stats.totalBattles++
    p.stats.cardsPlayed += result.cardsPlayed
    p.stats.creaturesKilled += result.creaturesKilled
    p.stats.damageDealt += result.damageDealt
    if (result.won) {
      p.stats.wins++
      p.stats.currentWinStreak++
      if (p.stats.currentWinStreak > p.stats.longestWinStreak) {
        p.stats.longestWinStreak = p.stats.currentWinStreak
      }
      p.coins += result.isCampaign ? 150 : 100
      p.gems += result.isCampaign ? 5 : 2
    } else {
      p.stats.losses++
      p.stats.currentWinStreak = 0
      p.coins += 30
    }

    updateProfile(p)
    setLastResult({ ...result, xpGained: xp })
    setActiveBattle(null)
    setActiveSkirmish(null)
    setPhase('result')
  }, [profile, activeBattle, activeSkirmish, gameConfig, matchmaking, updateProfile])

  // ── Menu navigation ─────────────────────────────────────
  const handleMenuNavigate = useCallback((screen: MenuScreen) => {
    switch (screen) {
      case 'tutorial':
        if (humanPlayers.length > 0) {
          const bots = createBotSlots(1, 1)
          setAllPlayers([humanPlayers[0], ...bots])
          setGameConfig({ isTutorial: true, difficulty: 'easy' })
          setPhase('title')
        }
        break
      case 'campaign':
        setPhase('campaign')
        break
      case 'skirmish':
        if (profile) {
          const opp = generateSkirmishOpponent(profile)
          setActiveSkirmish(opp)
          startSkirmishBattle(opp)
        }
        break
      case 'online':
        startMatchmaking()
        break
      case 'deckBuilder':
        setPhase('deckBuilder')
        break
      case 'shop':
        setPhase('shop')
        break
      case 'quickPlay':
        setPhase('settings')
        break
      default:
        break
    }
  }, [humanPlayers, profile])

  // ── Campaign battle start ───────────────────────────────
  const handleCampaignBattle = useCallback((chapterId: string, battleIndex: number, battle: CampaignBattle) => {
    if (!profile || humanPlayers.length === 0) return
    setActiveBattle({ chapterId, battleIndex, battle })
    const oppDeck = buildCampaignOpponentDeck(battle)
    const bots = createBotSlots(1, 1)
    setAllPlayers([humanPlayers[0], ...bots])
    setGameConfig({
      isCampaign: true,
      difficulty: battle.isBoss ? 'hard' : 'normal',
      opponentDeck: oppDeck,
      opponentElements: battle.opponentElements,
    })
    setPhase('title')
  }, [profile, humanPlayers])

  // ── Skirmish battle start ───────────────────────────────
  const startSkirmishBattle = useCallback((opp: SkirmishOpponent) => {
    if (humanPlayers.length === 0) return
    const bots = createBotSlots(1, 1)
    setAllPlayers([humanPlayers[0], ...bots])
    setGameConfig({
      isSkirmish: true,
      difficulty: opp.difficulty,
      opponentElements: opp.elements,
    })
    setPhase('title')
  }, [humanPlayers])

  // ── Matchmaking ─────────────────────────────────────────
  const startMatchmaking = useCallback(() => {
    const mm = startSearch(matchmaking)
    setMatchmaking(mm)
    setPhase('matchmaking')

    // Start polling for simulated match
    const timer = setInterval(() => {
      setMatchmaking(prev => {
        if (prev.status !== 'searching') return prev
        if (shouldSimulateMatch(prev)) {
          const found = simulateMatchFound(prev, profile?.level ?? 1)
          clearInterval(timer)
          // Auto-start after 2 seconds
          setTimeout(() => {
            setMatchmaking(prev2 => {
              if (prev2.status !== 'found') return prev2
              const started = startMatch(prev2)
              // Start the actual game
              if (humanPlayers.length > 0 && profile) {
                const bots = createBotSlots(1, 1)
                setAllPlayers([humanPlayers[0], ...bots])
                setGameConfig({
                  isOnline: true,
                  difficulty: getOnlineBotDifficulty(profile.level),
                  opponentElements: getOnlineOpponentElements(),
                })
                setPhase('title')
              }
              return started
            })
          }, 2000)
          return found
        }
        return prev
      })
    }, 500)
    setMatchmakingTimer(timer)
  }, [matchmaking, profile, humanPlayers])

  const handleCancelMatchmaking = useCallback(() => {
    if (matchmakingTimer) clearInterval(matchmakingTimer)
    setMatchmaking(cancelSearch(matchmaking))
    setPhase('menu')
  }, [matchmaking, matchmakingTimer])

  // Cleanup matchmaking timer
  useEffect(() => {
    return () => { if (matchmakingTimer) clearInterval(matchmakingTimer) }
  }, [matchmakingTimer])

  const settingsDefs: SettingDef[] = [
    PLAYER_MODE_SETTING(t),
    { key: 'gameMode', label: t('miniGames.gameMode', 'Game Mode'), type: 'select' as const, options: [
      { value: 'duel', label: t('miniGames.duel', 'Duel (1v1)') },
      { value: 'coop-raid', label: t('miniGames.coopRaid', 'Co-op Raid (vs Boss)') },
      { value: 'draft', label: t('miniGames.draft', 'Draft (pick cards first)') },
    ], defaultValue: 'duel' },
    DIFFICULTY_SETTING(t),
    { key: 'startingLife', label: t('miniGames.startingLife', 'Starting Life'), type: 'select' as const, options: [
      { value: 20, label: '20' },
      { value: 30, label: '30' },
      { value: 40, label: '40' },
    ], defaultValue: 20 },
    { key: 'deckStyle', label: t('miniGames.deckStyle', 'Deck Style'), type: 'select' as const, options: [
      { value: 'aggro', label: t('miniGames.aggro', 'Aggro') },
      { value: 'control', label: t('miniGames.control', 'Control') },
      { value: 'balanced', label: t('miniGames.balanced', 'Balanced') },
    ], defaultValue: 'balanced' },
  ]

  // ── Render ──────────────────────────────────────────────

  if (phase === 'game') {
    return (
      <MagicTheGatheringGame
        players={allPlayers}
        config={gameConfig}
        onBack={() => profile ? setPhase('menu') : setPhase('lobby')}
        onBattleEnd={handleBattleEnd}
      />
    )
  }

  if (phase === 'title') {
    return <TitleCard game={gameMeta} playerCount={allPlayers.length} onDone={() => setPhase('game')} />
  }

  if (phase === 'result' && lastResult) {
    return (
      <div className={styles.menuContainer}>
        <div className={styles.resultOverlay}>
          <h2 className={styles.resultTitle}>
            {lastResult.won ? '🏆 ' + t('magicDecks.victory', 'Victory!') : '💀 ' + t('magicDecks.defeat', 'Defeat')}
          </h2>
          <div className={styles.resultStats}>
            <p>⚔️ {t('magicDecks.damageDealt', 'Damage')}: {lastResult.damageDealt}</p>
            <p>💀 {t('magicDecks.creaturesKilled', 'Kills')}: {lastResult.creaturesKilled}</p>
            <p>🃏 {t('magicDecks.cardsPlayed', 'Cards Played')}: {lastResult.cardsPlayed}</p>
            <p>⏱️ {t('magicDecks.turns', 'Turns')}: {lastResult.turnsPlayed}</p>
          </div>
          <div className={styles.resultXP}>
            ✨ +{lastResult.xpGained} XP
          </div>
          {lastResult.cardCaptured && (
            <div className={styles.resultCapture}>
              🎴 {t('magicDecks.cardCaptured', 'Card captured')}: {lastResult.cardCaptured}
            </div>
          )}
          {lastResult.chapterCompleted && (
            <div className={styles.resultUnlocks}>
              📖 {t('magicDecks.chapterComplete', 'Chapter completed!')}
            </div>
          )}
          <button className={styles.menuCard} onClick={() => setPhase('menu')}>
            {t('magicDecks.continue', 'Continue')}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'matchmaking') {
    return (
      <div className={styles.menuContainer}>
        <div className={styles.matchmakingContainer}>
          {matchmaking.status === 'searching' && (
            <>
              <div className={styles.matchmakingSpinner} />
              <h2>{t('magicDecks.searching', 'Searching for opponent...')}</h2>
              <p>{Math.floor(getSearchDuration(matchmaking) / 1000)}s</p>
              <button className={styles.menuCard} onClick={handleCancelMatchmaking}>
                {t('magicDecks.cancel', 'Cancel')}
              </button>
            </>
          )}
          {matchmaking.status === 'found' && matchmaking.opponent && (
            <div className={styles.matchmakingFound}>
              <h2>{t('magicDecks.opponentFound', 'Opponent Found!')}</h2>
              <div className={styles.matchmakingOpponent}>
                <span>{matchmaking.opponent.name}</span>
                <span>⭐ {matchmaking.opponent.rating}</span>
              </div>
              <p>{t('magicDecks.preparingBattle', 'Preparing battle...')}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'campaign' && profile) {
    return (
      <CampaignMap
        profile={profile}
        onStartBattle={handleCampaignBattle}
        onStartSkirmish={(opp) => {
          setActiveSkirmish(opp)
          startSkirmishBattle(opp)
        }}
        onBack={() => setPhase('menu')}
      />
    )
  }

  if (phase === 'deckBuilder' && profile) {
    return (
      <DeckBuilder
        profile={profile}
        onBack={() => setPhase('menu')}
        onProfileUpdate={updateProfile}
      />
    )
  }

  if (phase === 'shop' && profile) {
    return (
      <Shop
        profile={profile}
        onBack={() => setPhase('menu')}
        onProfileUpdate={updateProfile}
      />
    )
  }

  if (phase === 'menu' && profile) {
    return (
      <MagicDecksMenu
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
        maxBots={3}
        humanPlayers={humanPlayers.length}
        maxPlayers={gameMeta.maxPlayers}
        onBack={() => profile ? setPhase('menu') : setPhase('lobby')}
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
      title={`${gameMeta.icon} ${t('miniGames.magicTheGathering', 'Magic The Gathering')}`}
      minPlayers={1}
      maxPlayers={4}
      onStart={(p) => {
        setHumanPlayers(p)
        // Load or create profile
        let prof = loadProfile()
        if (!prof) {
          prof = createNewProfile(p[0]?.name || 'Player')
          saveProfile(prof)
        }
        setProfile(prof)
        setPhase('menu')
      }}
      onBack={() => navigate('/mini-games')}
    />
  )
}

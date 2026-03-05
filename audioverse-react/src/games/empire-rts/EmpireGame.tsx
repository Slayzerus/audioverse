import type { GameConfig } from '../../pages/games/mini/types'
/**
 * EmpireGame — Kingdom Two Crowns-style side-scrolling RTS
 *
 * Split-screen canvas game supporting 1-8 players (up to 4 teams).
 * Modes: coop, pvp, skirmish, endless.
 * Features: tutorial overlay, match statistics, campaign support, i18n.
 *
 * Architecture:
 *   Canvas per viewport → drawGame() renders world from each hero's camera.
 *   Shared GameState ref mutated by gameTick() each frame.
 */
import { useRef, useEffect, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerSlot } from '../../pages/games/mini/types'
import { usePause } from '../../pages/games/mini/usePause'
import PauseMenu from '../../pages/games/mini/PauseMenu'
import css from './SharedGame.module.css'

import type { GameState, GameMode, Camera, BuildingType } from './types'
import { TICK_MS, VIEW_W, VIEW_H, CAM_LERP, TEAM_HEX, BUILD_MENU } from './constants'
import { initGameState, gameTick } from './gameLogic'
import type { HeroInput } from './gameLogic'
import { drawGame } from './renderer'
import { getInput, consumeEdges } from './input'
import type { MatchResult } from './campaign'
import { useGameFocusLock } from '../../hooks/useGameFocusLock'

// ─── Props ────────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
  onMatchEnd?: (result: Omit<MatchResult, 'xpGained'>) => void
}

// ─── Match stats tracker ──────────────────────────────────
interface MatchStats {
  unitsRecruited: number
  enemiesSlain: number
  buildingsBuilt: number
}

// ─── Determine grid layout for split-screen ───────────────
function splitLayout(n: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 }
  if (n <= 2) return { cols: 2, rows: 1 }
  if (n <= 4) return { cols: 2, rows: 2 }
  if (n <= 6) return { cols: 3, rows: 2 }
  return { cols: 4, rows: 2 }
}

// ─── Bot AI — improved state machine ─────────────────────
function botInput(st: GameState, heroIdx: number): HeroInput {
  const hero = st.heroes[heroIdx]
  if (!hero) return { moveX: 0, interact: false, attack: false, buildPrev: false, buildNext: false, buildPlace: false }

  const inp: HeroInput = { moveX: 0, interact: false, attack: false, buildPrev: false, buildNext: false, buildPlace: false }
  const team = st.teams[hero.team]
  if (!team?.alive) return inp

  // Count buildings by type
  const teamBuildings = st.buildings.filter(b => b.team === hero.team && b.built)
  const has = (type: string) => teamBuildings.some(b => b.type === type)
  const count = (type: string) => teamBuildings.filter(b => b.type === type).length

  // Find nearest enemy
  let nearestEnemy: { x: number; dist: number } | null = null
  for (const e of st.enemies) {
    if (e.state === 'dying') continue
    const d = Math.abs(e.x - hero.x)
    if (!nearestEnemy || d < nearestEnemy.dist) {
      nearestEnemy = { x: e.x, dist: d }
    }
  }

  // Find nearest gold resource
  let nearestGold: { x: number; dist: number } | null = null
  for (const n of st.resourceNodes) {
    if (n.type !== 'gold' || n.amount <= 0) continue
    const d = Math.abs(n.x - hero.x)
    if (!nearestGold || d < nearestGold.dist) {
      nearestGold = { x: n.x, dist: d }
    }
  }

  // Find own castle
  const castle = st.buildings.find(b => b.team === hero.team && b.type === 'castle')
  const castleX = castle ? castle.x + castle.w / 2 : hero.x

  // Phase-based decision making
  const tick = st.tick

  // PHASE 1: Emergency — enemies very close
  if (nearestEnemy && nearestEnemy.dist < 150) {
    if (hero.canAttack && nearestEnemy.dist < 120) {
      inp.moveX = nearestEnemy.x > hero.x ? 1 : -1
      if (nearestEnemy.dist < 50) inp.attack = true
    } else {
      // Retreat toward castle
      inp.moveX = castleX > hero.x ? 1 : -1
    }
    return inp
  }

  // PHASE 2: If pouch is near full, deposit
  if (hero.gold >= hero.maxGold * 0.7) {
    inp.moveX = castleX > hero.x ? 1 : -1
    if (Math.abs(hero.x - castleX) < 60) {
      inp.interact = true
    }
    return inp
  }

  // PHASE 3: Strategic building (varies with game progression)
  if (team.gold >= 8 && tick % 90 < 3) { // Check periodically
    let wantBuild: BuildingType | null = null

    // Priority: houses first if pop is tight
    if (team.popMax < 10 && count('house') < 2) wantBuild = 'house'
    // Then walls for defense
    else if (!has('wall') && team.gold >= 10) wantBuild = 'wall'
    // Then military buildings
    else if (!has('barracks') && team.gold >= 15 && team.wood >= 10) wantBuild = 'barracks'
    else if (!has('archery') && count('barracks') >= 1 && team.gold >= 12) wantBuild = 'archery'
    // Economy buildings
    else if (!has('goldmine') && team.gold >= 20) wantBuild = 'goldmine'
    else if (!has('lumbermill') && team.gold >= 10) wantBuild = 'lumbermill'
    else if (!has('farm') && team.gold >= 8) wantBuild = 'farm'
    // Tower for defense
    else if (count('tower') < 2 && team.gold >= 10 && team.wood >= 15) wantBuild = 'tower'
    // Treasury for storage
    else if (!has('treasury') && team.gold >= 25) wantBuild = 'treasury'
    // More houses as pop grows
    else if (team.popCurrent >= team.popMax - 2 && team.gold >= 8) wantBuild = 'house'
    // Monastery late game
    else if (!has('monastery') && team.popMax >= 15 && team.gold >= 18) wantBuild = 'monastery'

    if (wantBuild) {
      // Navigate to correct build menu item
      const wantIdx = BUILD_MENU.indexOf(wantBuild)
      const curIdx = hero.selectedBuilding ? BUILD_MENU.indexOf(hero.selectedBuilding) : -1

      if (curIdx !== wantIdx) {
        inp.buildNext = true
      } else {
        // Move away from castle a bit to place building
        const offset = (count(wantBuild) % 2 === 0 ? 1 : -1) * (60 + count(wantBuild) * 50)
        const targetX = castleX + offset
        if (Math.abs(hero.x - targetX) < 30) {
          inp.buildPlace = true
        } else {
          inp.moveX = targetX > hero.x ? 1 : -1
        }
      }
      return inp
    }
  }

  // PHASE 4: Recruit units if near recruiting buildings
  const recruitBuilding = teamBuildings.find(b =>
    ['barracks', 'archery', 'monastery'].includes(b.type) &&
    b.cooldown <= 0 &&
    team.popCurrent < team.popMax &&
    Math.abs(b.x + b.w / 2 - hero.x) < 80
  )
  if (recruitBuilding && team.gold >= 10) {
    inp.interact = true
    return inp
  }

  // PHASE 5: Go gather gold
  if (nearestGold && hero.gold < hero.maxGold * 0.5) {
    inp.moveX = nearestGold.x > hero.x ? 1 : -1
    if (nearestGold.dist < 40) inp.interact = true
    return inp
  }

  // PHASE 6: Patrol around castle
  const patrol = Math.sin(tick * 0.01) * 200
  const patrolX = castleX + patrol
  if (Math.abs(hero.x - patrolX) > 30) {
    inp.moveX = patrolX > hero.x ? 1 : -1
  }

  return inp
}

// ─── Component ────────────────────────────────────────────
export default function EmpireGame({ players, config = {}, onBack, onMatchEnd }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()

  // ── Config extraction ──────────────────────────────────
  const mode = (config.mode as GameMode) || 'coop'
  const difficulty = Number(config.difficulty) || 1
  const heroCanAttack = config.heroCanAttack !== false
  const teamCount = Math.max(1, Math.min(4, Number(config.teamCount) || (mode === 'pvp' ? Math.min(players.length, 4) : 1)))

  // ── Refs ───────────────────────────────────────────────
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const stateRef = useRef<GameState | null>(null)
  const camerasRef = useRef<Camera[]>([])
  const rafRef = useRef(0)
  const statsRef = useRef<MatchStats>({ unitsRecruited: 0, enemiesSlain: 0, buildingsBuilt: 0 })
  const prevUnitsRef = useRef(0)
  const prevEnemiesRef = useRef(0)
  const prevBuildingsRef = useRef(0)

  const [gameOver, setGameOver] = useState(false)
  const [winnerTeam, setWinnerTeam] = useState(-1)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)

  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  const playerCount = players.length
  const layout = splitLayout(playerCount)
  const isSplit = playerCount > 1

  // ── Tutorial steps ─────────────────────────────────────
  const tutorialSteps = [
    { title: t('empire.tutorialWelcome', 'Welcome to Empire RTS!'), desc: t('empire.tutorialWelcomeDesc', '') },
    { title: t('empire.tutorialEconomy', 'Economy'), desc: t('empire.tutorialEconomyDesc', '') },
    { title: t('empire.tutorialBuilding', 'Building'), desc: t('empire.tutorialBuildingDesc', '') },
    { title: t('empire.tutorialCombat', 'Combat'), desc: t('empire.tutorialCombatDesc', '') },
    { title: t('empire.tutorialWaves', 'Enemy Waves'), desc: t('empire.tutorialWavesDesc', '') },
  ]

  // ── Canvas ref callback ────────────────────────────────
  const setCanvasRef = useCallback((el: HTMLCanvasElement | null, idx: number) => {
    canvasRefs.current[idx] = el
  }, [])

  // ── Initialize game state ──────────────────────────────
  useEffect(() => {
    const st = initGameState(players, mode, difficulty, heroCanAttack, teamCount)

    // Campaign overrides
    if (config.startGold != null) {
      for (const tm of st.teams) {
        tm.gold = config.startGold
        tm.wood = config.startWood ?? 20
        tm.meat = config.startMeat ?? 10
      }
    }

    stateRef.current = st
    camerasRef.current = st.heroes.map(h => ({ x: h.x, targetX: h.x }))
    statsRef.current = { unitsRecruited: 0, enemiesSlain: 0, buildingsBuilt: 0 }
    prevUnitsRef.current = st.units.length
    prevEnemiesRef.current = 0
    prevBuildingsRef.current = st.buildings.length

    setGameOver(false)
    setWinnerTeam(-1)

    // Show tutorial on first play (only if not campaign)
    if (!config.isCampaign && !localStorage.getItem('empire_tutorial_done')) {
      setShowTutorial(true)
      setTutorialStep(0)
    }

    return () => { stateRef.current = null }
  }, [players, mode, difficulty, heroCanAttack, teamCount, config])

  // ── Dismiss tutorial ───────────────────────────────────
  const dismissTutorial = useCallback(() => {
    setShowTutorial(false)
    localStorage.setItem('empire_tutorial_done', '1')
  }, [])

  // ── Game loop ──────────────────────────────────────────
  useEffect(() => {
    let lastTime = performance.now()
    let accumulator = 0

    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop)

      const st = stateRef.current
      if (!st) return
      if (pauseRef.current || showTutorial) return

      const delta = Math.min(now - lastTime, 100)
      lastTime = now
      accumulator += delta

      let ticked = false
      while (accumulator >= TICK_MS) {
        accumulator -= TICK_MS

        if (!st.gameOver) {
          const inputs: HeroInput[] = st.heroes.map((hero, i) => {
            if (hero.isBot) return botInput(st, i)
            const humanIndex = players.findIndex(p => p.index === hero.playerIndex)
            const kbGroup = humanIndex >= 0 ? humanIndex : i
            const padIndex = humanIndex >= 0 ? humanIndex : i
            return getInput(i, kbGroup, padIndex)
          })

          gameTick(st, inputs)
          consumeEdges()
          ticked = true

          // Track stats
          const stats = statsRef.current
          const currentUnits = st.units.length
          if (currentUnits > prevUnitsRef.current) {
            stats.unitsRecruited += currentUnits - prevUnitsRef.current
          }
          prevUnitsRef.current = currentUnits

          const dyingEnemies = st.enemies.filter(e => e.state === 'dying').length
          if (dyingEnemies > prevEnemiesRef.current) {
            stats.enemiesSlain += dyingEnemies - prevEnemiesRef.current
          }
          prevEnemiesRef.current = dyingEnemies

          const builtCount = st.buildings.filter(b => b.built).length
          if (builtCount > prevBuildingsRef.current) {
            stats.buildingsBuilt += builtCount - prevBuildingsRef.current
          }
          prevBuildingsRef.current = builtCount

          // Campaign win condition: survive N waves
          if (config.wavesToSurvive && st.waveNumber >= config.wavesToSurvive && !st.gameOver) {
            st.gameOver = true
            st.winner = 0 // Co-op win
          }

          // Camera update
          for (let i = 0; i < st.heroes.length; i++) {
            const cam = camerasRef.current[i]
            if (!cam) continue
            cam.targetX = st.heroes[i].x
            cam.x += (cam.targetX - cam.x) * CAM_LERP
            const halfView = VIEW_W / 2
            cam.x = Math.max(halfView, Math.min(st.worldW - halfView, cam.x))
          }
        }
      }

      if (ticked || !st.gameOver) {
        for (let i = 0; i < st.heroes.length; i++) {
          const cvs = canvasRefs.current[i]
          if (!cvs) continue
          const ctx = cvs.getContext('2d')
          if (!ctx) continue
          if (cvs.width !== VIEW_W || cvs.height !== VIEW_H) {
            cvs.width = VIEW_W
            cvs.height = VIEW_H
          }
          const cam = camerasRef.current[i] || { x: VIEW_W / 2, targetX: VIEW_W / 2 }
          drawGame(ctx, st, cam, VIEW_W, VIEW_H, i)
        }
      }

      if (st.gameOver && !gameOver) {
        setGameOver(true)
        setWinnerTeam(st.winner)

        // Report match result
        if (onMatchEnd) {
          const stats = statsRef.current
          const won = st.mode === 'coop' || st.mode === 'endless'
            ? st.winner >= 0
            : st.teams.findIndex(tm => tm.alive) === st.heroes[0]?.team

          onMatchEnd({
            won,
            daysSurvived: st.day,
            wavesCleared: st.waveNumber,
            unitsRecruited: stats.unitsRecruited,
            enemiesSlain: stats.enemiesSlain,
            buildingsBuilt: stats.buildingsBuilt,
            isCampaign: !!config.isCampaign,
            chapterId: config.chapterId,
          })
        }
      }
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [pauseRef, gameOver, players, showTutorial, config, onMatchEnd])

  // ── Restart ────────────────────────────────────────────
  const restart = useCallback(() => {
    const st = initGameState(players, mode, difficulty, heroCanAttack, teamCount)
    if (config.startGold != null) {
      for (const tm of st.teams) {
        tm.gold = config.startGold
        tm.wood = config.startWood ?? 20
        tm.meat = config.startMeat ?? 10
      }
    }
    stateRef.current = st
    camerasRef.current = st.heroes.map(h => ({ x: h.x, targetX: h.x }))
    statsRef.current = { unitsRecruited: 0, enemiesSlain: 0, buildingsBuilt: 0 }
    prevUnitsRef.current = st.units.length
    prevEnemiesRef.current = 0
    prevBuildingsRef.current = st.buildings.length
    setGameOver(false)
    setWinnerTeam(-1)
  }, [players, mode, difficulty, heroCanAttack, teamCount, config])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showTutorial) {
        dismissTutorial()
        return
      }
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, restart, showTutorial, dismissTutorial])

  // ── Winner display ─────────────────────────────────────
  const winnerColor = winnerTeam >= 0 ? TEAM_HEX[winnerTeam] : '#fff'
  const winnerLabel = winnerTeam >= 0
    ? t('empire.teamN', 'Team {{n}}', { n: winnerTeam + 1 })
    : t('empire.draw', 'Draw')

  // ── Render ─────────────────────────────────────────────
  return (
    <div className={css.container}>
      {/* Single-player viewport */}
      {!isSplit && (
        <div className={css.gameViewport}>
          <canvas
            ref={el => setCanvasRef(el, 0)}
            className={css.canvas}
            width={VIEW_W}
            height={VIEW_H}
            aria-label="Empire RTS game canvas"
          />
        </div>
      )}

      {/* Split-screen grid */}
      {isSplit && (
        <div
          className={`${css.splitGrid} ${layout.cols <= 2 ? css.cols2 : css.cols1}`}
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
            gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
          }}
        >
          {players.map((_, i) => (
            <div key={i} className={css.splitCell}>
              <canvas
                ref={el => setCanvasRef(el, i)}
                width={VIEW_W}
                height={VIEW_H}
                aria-label="Empire RTS game canvas"
              />
            </div>
          ))}
        </div>
      )}

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {/* Tutorial overlay */}
      {showTutorial && (
        <div className={css.overlay} onClick={dismissTutorial}>
          <div className={css.tutorialCard} onClick={e => e.stopPropagation()}>
            <h2>{tutorialSteps[tutorialStep].title}</h2>
            <p style={{ maxWidth: 400, lineHeight: 1.5, margin: '12px auto' }}>
              {tutorialSteps[tutorialStep].desc}
            </p>
            <div className={css.tutorialNav}>
              <span className={css.tutorialStepIndicator}>
                {t('empire.tutorialStep', 'Step {{current}} of {{total}}', {
                  current: tutorialStep + 1, total: tutorialSteps.length,
                })}
              </span>
            </div>
            <div className={css.overlayActions}>
              {tutorialStep > 0 && (
                <button className={css.backBtnOverlay} onClick={() => setTutorialStep(s => s - 1)}>
                  {t('empire.tutorialPrev', 'Back')}
                </button>
              )}
              {tutorialStep < tutorialSteps.length - 1 ? (
                <button className={css.restartBtn} onClick={() => setTutorialStep(s => s + 1)}>
                  {t('empire.tutorialNext', 'Next')}
                </button>
              ) : (
                <button className={css.restartBtn} onClick={dismissTutorial}>
                  {t('empire.tutorialFinish', 'Got it!')}
                </button>
              )}
            </div>
            <div className={css.overlayHint}>
              {t('empire.tutorialSkip', 'Press any key to skip')}
            </div>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {gameOver && !onMatchEnd && (
        <div className={css.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          <div className={css.winnerText} style={{ color: winnerColor }}>
            {winnerLabel} {t('miniGames.wins', 'wins')}! 🏰
          </div>
          {stateRef.current && (
            <div className={css.statsRow}>
              {t('empire.dayN', 'Day {{day}}', { day: stateRef.current.day })}
              {' — '}
              {t('empire.waveN', 'Wave {{wave}}', { wave: stateRef.current.waveNumber })}
            </div>
          )}
          <div className={css.overlayActions}>
            <button className={css.restartBtn} onClick={restart}>
              {t('miniGames.playAgain', 'Play Again')}
            </button>
            <button className={css.backBtnOverlay} onClick={onBack}>
              {t('miniGames.backToMenu', 'Back to Menu')}
            </button>
          </div>
          <div className={css.overlayHint}>
            {t('miniGames.pressRestart', 'Press Space or Enter to restart')}
          </div>
        </div>
      )}
    </div>
  )
}

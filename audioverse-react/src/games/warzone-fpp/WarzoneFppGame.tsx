import type { GameConfig } from '../../pages/games/mini/types'
/**
 * WarzoneFppGame  3D FPS with full split-screen support (up to 8 players).
 *
 * Each human player gets their own Three.js viewport with independent camera,
 * HUD (crosshair, HP/armor, weapon, posture, player name).
 *
 * Controls:
 *   Keyboard 0: W/A/S/D move, Mouse look, LMB/Space shoot, F interact,
 *               Shift sprint, C crouch, Z prone, Q prev weapon, 1-9 weapon
 *   Keyboard 1: Arrows move, Enter shoot, Shift interact, Ctrl sprint
 *   Gamepad:    L-stick move, R-stick aim, RT/X shoot, A interact,
 *               B sprint, LB crouch, LT prone
 *   Tab: scoreboard   ESC: pause
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMiniGameFocusTrap } from '../../hooks/useMiniGameFocusTrap'
import type { PlayerSlot } from '../../pages/games/mini/types'
import { useGamepads, type GamepadSnapshot } from '../../pages/games/mini/useGamepads'
import { usePause } from '../../pages/games/mini/usePause'
import PauseMenu from '../../pages/games/mini/PauseMenu'

import { TICK_MS, MOUSE_SENS } from './constants'
import { keysDown, consumeMouseDelta, addMouseDelta, setMouseDown, setMouseRightDown } from './input'
import { initState } from './mapGenerator'
import { gameTick, resetCooldowns } from './gameLoop'
import { createThreeEngine, type ThreeEngine } from './threeEngine'
import {
  createDefaultCareer, awardMatchResults, getRank, xpToNextLevel,
  generateShopItems, PRESTIGE_ICONS,
  type CareerState, type LootboxResult,
} from './shopAndCareer'
import { createVoiceChat, type VoiceChat } from './voiceChat'
import styles from './SharedGame.module.css'
import { MAX_PLAYERS, GAMEPAD_AIM_SENS, GAMEPAD_DEADZONE, clampPitch, getGrid } from './warzoneFppTypes'
import type { HudData, SharedHud } from './warzoneFppTypes'
import WarzoneFppOverlays from './WarzoneFppOverlays'

//  Component 
interface ScoreboardEntry {
  idx: number
  name: string
  team: number
  kills: number
  deaths: number
  captures: number
  score: number
  color: string
  coins: number
  gems: number
  stars: number
}

interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function WarzoneFppGame({ players, config = {}, onBack }: Props) {
  const { t } = useTranslation()
  const playerCount = Math.min(players.length, MAX_PLAYERS)
  const modeType = config?.gameModeType || 'realistic'

  //  Refs (single useRef per array  no hooks-in-loop) 
  const containerEls = useRef<(HTMLDivElement | null)[]>(new Array(MAX_PLAYERS).fill(null))
  const enginesArr   = useRef<(ThreeEngine | null)[]>(new Array(MAX_PLAYERS).fill(null))
  const yaws         = useRef<number[]>(new Array(MAX_PLAYERS).fill(0))
  const pitches      = useRef<number[]>(new Array(MAX_PLAYERS).fill(0))
  const stateRef     = useRef(initState(players, { ...config, mode: modeType }))

  //  React state 
  const [perPlayer, setPerPlayer] = useState<HudData[]>(() =>
    players.map((p) => ({
      hp: 100, maxHp: 100, armor: 0,
      weapon: '', posture: 'stand' as const,
      name: p.name, alive: true,
      bleeding: false, bandageProgress: 0, bandages: 3,
      cameraPerspective: 'fpp' as const,
      aimAssist: (p.input.type === 'gamepad' ? 'semi' : 'none') as 'none' | 'semi' | 'full',
      isAiming: false,
      sensitivity: 5,
    }))
  )
  const [shared, setShared] = useState<SharedHud>({
    tickets: [100, 100], killFeed: [], gameOver: false,
    winTeam: -1, mode: 'deathmatch', round: 1, roundScore: [0, 0],
    brAliveCount: 0, brTotalCount: 0, brZonePhase: 0, brZoneTimer: 0, brPlacement: 0,
    vcSpeakers: [], vcMode: 'proximity',
  })
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [showScoreboard, setShowScoreboard] = useState(false)

  // ── Shop / Career / Loadout state ─────────────────────
  const [career, setCareer] = useState<CareerState>(() => createDefaultCareer())
  const [showShop, setShowShop] = useState(false)
  const [showLoadout, setShowLoadout] = useState(false)
  const [shopMessage, setShopMessage] = useState('')
  const [lootResult, setLootResult] = useState<LootboxResult | null>(null)
  const [editingWeapon, setEditingWeapon] = useState<string | null>(null)
  const [tempLoadout, setTempLoadout] = useState<Record<string, Record<string, string>>>({})
  const shopItems = useRef(generateShopItems())

  // Voice chat
  const voiceChatRef = useRef<VoiceChat | null>(null)
  // TPP toggle debounce
  const tppToggleRef = useRef<boolean[]>(new Array(MAX_PLAYERS).fill(false))
  // Aim assist cycle debounce
  const aimAssistToggleRef = useRef<boolean[]>(new Array(MAX_PLAYERS).fill(false))
  // Sensitivity adjust debounce (up / down per player)
  const sensUpRef = useRef<boolean[]>(new Array(MAX_PLAYERS).fill(false))
  const sensDownRef = useRef<boolean[]>(new Array(MAX_PLAYERS).fill(false))
  // Pointer lock cleanup for player 0
  const pointerCleanupRef = useRef<(() => void) | null>(null)

  const pads = useGamepads()
  const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })
  useMiniGameFocusTrap(true, 'warzone-')

  //  Engine setup (one Three.js renderer per viewport) 
  useEffect(() => {
    for (let i = 0; i < playerCount; i++) {
      const el = containerEls.current[i]
      if (!el || enginesArr.current[i]) continue
      const engine = createThreeEngine(el)
      enginesArr.current[i] = engine
      el.appendChild(engine.getDomElement())
      engine.buildWorld(stateRef.current)
      engine.resize(el.clientWidth, el.clientHeight)
    }
    const onResize = () => {
      for (let i = 0; i < playerCount; i++) {
        const el = containerEls.current[i]
        const eng = enginesArr.current[i]
        if (el && eng) eng.resize(el.clientWidth, el.clientHeight)
      }
    }
    window.addEventListener('resize', onResize)
    // Small delay to let layout settle, then resize once
    const t0 = setTimeout(onResize, 50)
    return () => {
      clearTimeout(t0)
      window.removeEventListener('resize', onResize)
      for (let i = 0; i < playerCount; i++) {
        enginesArr.current[i]?.dispose()
        enginesArr.current[i] = null
      }
    }
    // Engine setup re-runs only when playerCount changes; refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerCount])

  // Voice chat init
  useEffect(() => {
    const vc = createVoiceChat({ mode: 'proximity' })
    vc.init(stateRef.current.soldiers.filter((_s, i) => i < playerCount).map(s => ({
      playerIndex: s.playerIndex,
      name: s.name,
      team: s.team,
    })))
    voiceChatRef.current = vc
    return () => { vc.dispose(); voiceChatRef.current = null }
  }, [playerCount])

  //  Pointer lock + mouse (player 0 only) 
  useEffect(() => {
    // Slight delay so ref callback has populated
    const tid = setTimeout(() => {
      const el = containerEls.current[0]
      if (!el) return
      const onClick       = () => { if (!document.pointerLockElement) el.requestPointerLock() }
      const onMouseMove   = (e: MouseEvent) => { if (document.pointerLockElement === el) addMouseDelta(e.movementX, e.movementY) }
      const onMouseDown   = (e: MouseEvent) => {
        if (e.button === 0 && document.pointerLockElement === el) setMouseDown(true)
        if (e.button === 2 && document.pointerLockElement === el) setMouseRightDown(true)
      }
      const onMouseUp     = (e: MouseEvent) => {
        if (e.button === 0) setMouseDown(false)
        if (e.button === 2) setMouseRightDown(false)
      }
      const onContextMenu = (e: MouseEvent) => { e.preventDefault() }
      el.addEventListener('click', onClick)
      el.addEventListener('contextmenu', onContextMenu)
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mousedown', onMouseDown)
      document.addEventListener('mouseup', onMouseUp)
      ;pointerCleanupRef.current = () => {
        el.removeEventListener('click', onClick)
        el.removeEventListener('contextmenu', onContextMenu)
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mousedown', onMouseDown)
        document.removeEventListener('mouseup', onMouseUp)
        if (document.pointerLockElement === el) document.exitPointerLock()
        setMouseDown(false)
        setMouseRightDown(false)
      }
    }, 60)
    return () => {
      clearTimeout(tid)
      pointerCleanupRef.current?.()
      pointerCleanupRef.current = null
    }
  }, [playerCount])

  //  Key events 
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysDown.add(e.key)
      if (e.key === 'Tab') { e.preventDefault(); setShowScoreboard(true) }
      if (e.key === 'p' || e.key === 'P') { setShowShop(v => !v); setShowLoadout(false) }
      if (e.key === 'l' || e.key === 'L') { setShowLoadout(v => !v); setShowShop(false) }
    }
    const up = (e: KeyboardEvent) => {
      keysDown.delete(e.key)
      if (e.key === 'Tab') setShowScoreboard(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); keysDown.clear() }
  }, [])

  //  Game tick (logic) 
  useEffect(() => {
    resetCooldowns()
    const timer = setInterval(() => {
      if (pauseRef.current) return
      const st = stateRef.current

      // Mouse look  player 0  — apply per-player sensitivity
      const p0sens = (st.soldiers[0]?.sensitivity ?? 5) / 5
      const { dx, dy } = consumeMouseDelta()
      yaws.current[0] += dx * MOUSE_SENS * p0sens
      pitches.current[0] -= dy * MOUSE_SENS * p0sens
      pitches.current[0] = clampPitch(pitches.current[0])

      // Gamepad R-stick  all gamepad players — apply per-player sensitivity
      try {
        const rawPads = navigator.getGamepads?.()
        if (rawPads) {
          for (let i = 0; i < playerCount; i++) {
            const s = st.soldiers[i]
            if (!s || s.isBot || s.input.type !== 'gamepad') continue
            const raw = rawPads[s.input.padIndex]
            if (!raw) continue
            const gpSens = (s.sensitivity / 5) * GAMEPAD_AIM_SENS
            const rx = raw.axes[2] ?? 0
            const ry = raw.axes[3] ?? 0
            if (Math.abs(rx) > GAMEPAD_DEADZONE) yaws.current[i] += rx * gpSens
            if (Math.abs(ry) > GAMEPAD_DEADZONE) {
              pitches.current[i] -= ry * gpSens
              pitches.current[i] = clampPitch(pitches.current[i])
            }
          }
        }
      } catch { /* getGamepads may throw in some contexts */ }

      // Apply yaw/pitch to all human soldiers
      for (let i = 0; i < playerCount; i++) {
        const s = st.soldiers[i]
        if (s && !s.isBot) {
          s.angle = yaws.current[i]
          s.pitch = pitches.current[i]
        }
      }

      gameTick(st, padsRef.current)

      // TPP toggle handling (debounced per player)
      for (let i = 0; i < playerCount; i++) {
        const s = st.soldiers[i]
        if (!s || s.isBot) continue
        const vPressed = keysDown.has('v')
        if (vPressed && !tppToggleRef.current[i]) {
          s.cameraPerspective = s.cameraPerspective === 'tpp' ? 'fpp' : 'tpp'
        }
        tppToggleRef.current[i] = vPressed
      }

      // Aim assist cycle: Y on gamepad, or numpad 0 on keyboard
      for (let i = 0; i < playerCount; i++) {
        const s = st.soldiers[i]
        if (!s || s.isBot) continue
        let togglePressed = false
        const sInput = s.input
        if (sInput.type === 'gamepad') {
          const gp = padsRef.current.find((p: GamepadSnapshot) => p.index === sInput.padIndex)
          togglePressed = !!gp?.y
        } else {
          togglePressed = keysDown.has('0') // numpad 0 or regular 0
        }
        if (togglePressed && !aimAssistToggleRef.current[i]) {
          const cycle: Array<'none' | 'semi' | 'full'> = ['none', 'semi', 'full']
          const idx = cycle.indexOf(s.aimAssist)
          s.aimAssist = cycle[(idx + 1) % cycle.length]
        }
        aimAssistToggleRef.current[i] = togglePressed
      }

      // Sensitivity adjust: LB/RB on gamepad, Ctrl + +/- on keyboard
      for (let i = 0; i < playerCount; i++) {
        const s = st.soldiers[i]
        if (!s || s.isBot) continue
        let upPressed = false
        let downPressed = false
        const sInput2 = s.input
        if (sInput2.type === 'gamepad') {
          const gp = padsRef.current.find((p: GamepadSnapshot) => p.index === sInput2.padIndex)
          upPressed = !!gp?.rb
          downPressed = !!gp?.lb
        } else {
          upPressed = keysDown.has('Control') && (keysDown.has('=') || keysDown.has('+'))
          downPressed = keysDown.has('Control') && keysDown.has('-')
        }
        if (upPressed && !sensUpRef.current[i]) {
          s.sensitivity = Math.min(10, s.sensitivity + 1)
        }
        sensUpRef.current[i] = upPressed
        if (downPressed && !sensDownRef.current[i]) {
          s.sensitivity = Math.max(1, s.sensitivity - 1)
        }
        sensDownRef.current[i] = downPressed
      }

      // Voice chat tick
      const vc = voiceChatRef.current
      if (vc) {
        vc.updateProximity(st.soldiers.filter(s => s.alive).map(s => ({
          playerIndex: s.playerIndex, x: s.x, y: s.y, team: s.team,
        })))
        // PTT from keyboard T
        if (st.soldiers[0] && !st.soldiers[0].isBot) {
          vc.updatePTT(st.soldiers[0].playerIndex, keysDown.has('t'))
        }
        vc.tick()
      }

      // Trigger per-player shoot effects
      for (let i = 0; i < playerCount; i++) {
        const eng = enginesArr.current[i]
        const s = st.soldiers[i]
        if (eng && s?.alive) {
          const justShot = st.bullets.some(b => b.owner === s.playerIndex && b.life >= 48)
          if (justShot) eng.triggerShoot(s.weapons[s.weaponIndex] || '')
        }
      }

      // Update per-player HUD
      setPerPlayer(players.map((_, i) => {
        const s = st.soldiers[i]
        return {
          hp: s?.hp ?? 0, maxHp: s?.maxHp ?? 100, armor: s?.armor ?? 0,
          weapon: s ? (s.weapons[s.weaponIndex] ?? '') : '',
          posture: (s?.posture || 'stand') as 'stand' | 'crouch' | 'prone',
          name: s?.name ?? players[i].name,
          alive: s?.alive ?? false,
          bleeding: s?.bleeding ?? false,
          bandageProgress: s?.bandageProgress ?? 0,
          bandages: s?.bandages ?? 0,
          cameraPerspective: (s?.cameraPerspective || 'fpp') as 'fpp' | 'tpp',
          aimAssist: (s?.aimAssist || 'none') as 'none' | 'semi' | 'full',
          isAiming: s?.isAiming ?? false,
          sensitivity: s?.sensitivity ?? 5,
        }
      }))

      // Update shared HUD
      setShared({
        tickets: [...st.tickets] as [number, number],
        killFeed: [...st.killFeed],
        gameOver: st.gameOver, winTeam: st.winTeam,
        mode: st.mode,
        round: st.round ?? 1,
        roundScore: st.roundScore ? [...st.roundScore] as [number, number] : [0, 0],
        brAliveCount: st.brState?.aliveCount ?? 0,
        brTotalCount: st.brState?.totalCount ?? 0,
        brZonePhase: st.brState?.zone.phase ?? 0,
        brZoneTimer: st.brState?.zone.phaseTimer ?? 0,
        brPlacement: st.soldiers[0]?.brPlacement ?? 0,
        vcSpeakers: vc ? vc.getSpeakers().map(u => u.name) : [],
        vcMode: vc?.state.mode ?? 'proximity',
      })

      setScoreboard(
        st.soldiers
          .filter(s => !s.isBot || s.kills > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 16)
          .map(s => ({
            idx: s.playerIndex, name: s.name, team: s.team,
            kills: s.kills, deaths: s.deaths, captures: s.captures,
            score: s.score, color: s.color,
            coins: s.coins, gems: s.gems, stars: s.stars,
          })),
      )

      if (st.gameOver && !gameOver) {
        setGameOver(true)
        st.soldiers.filter(s => s.team === st.winTeam && !s.isBot).forEach(s => { s.stars++ })
        // Award career XP/coins to player 0
        const p0 = st.soldiers[0]
        if (p0 && !p0.isBot) {
          setCareer(prev => {
            const next = { ...prev, ownedAttachments: new Set(prev.ownedAttachments), boosts: new Map(prev.boosts) }
            awardMatchResults(next, p0.kills, p0.deaths, p0.captures, p0.coins, p0.gems, p0.stars, p0.team === st.winTeam)
            return next
          })
        }
      }
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [pauseRef, playerCount, players])

  //  Render loop (all viewports in rAF) 
  useEffect(() => {
    let raf = 0
    function frame() {
      for (let i = 0; i < playerCount; i++) {
        const eng = enginesArr.current[i]
        if (eng) eng.syncFrame(stateRef.current, i, yaws.current[i], pitches.current[i])
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [playerCount])

  //  Restart 
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, { ...config, mode: modeType })
    yaws.current.fill(0)
    pitches.current.fill(0)
    setGameOver(false)
    for (let i = 0; i < playerCount; i++) {
      enginesArr.current[i]?.buildWorld(stateRef.current)
    }
  }, [players, config, modeType, playerCount])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  //  Layout helpers 
  const { cols, rows } = getGrid(playerCount)
  const compact = playerCount > 1
  const teamName = (tm: number) => tm === 0 ? 'Robbers' : tm === 1 ? 'Police' : '???'

  //  JSX 
  return (
    <div className={styles.container} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', cursor: 'none' }}>

      {/*  Split-screen grid  */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        width: '100%', height: '100%',
        position: 'absolute', inset: 0,
      }}>
        {Array.from({ length: playerCount }, (_, i) => {
          const h = perPlayer[i]
          if (!h) return null
          const hpPct    = Math.max(0, Math.min(100, (h.hp / h.maxHp) * 100))
          const armorPct = Math.max(0, Math.min(100, (h.armor / 90) * 100))
          const fs = compact ? 11 : 14
          const bh = compact ? 5 : 8
          const pad = compact ? 6 : 16
          return (
            <div key={i} style={{ position: 'relative', overflow: 'hidden', outline: compact ? '1px solid #222' : 'none' }}>
              {/* Three.js viewport */}
              <div ref={(el) => { containerEls.current[i] = el }} style={{ position: 'absolute', inset: 0 }} />

              {/* Per-player HUD */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>

                {/* Crosshair — tighter when ADS */}
                {(() => {
                  const aimSize = h.isAiming ? 12 : 20
                  const aimLen  = h.isAiming ? 4 : 6
                  const aimClr  = h.isAiming ? '#0ffa' : '#fffa'
                  return (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: aimSize, height: aimSize }}>
                      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 2, height: aimLen, background: aimClr, borderRadius: 1 }} />
                      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 2, height: aimLen, background: aimClr, borderRadius: 1 }} />
                      <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: aimLen, height: 2, background: aimClr, borderRadius: 1 }} />
                      <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: aimLen, height: 2, background: aimClr, borderRadius: 1 }} />
                      {h.isAiming && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 3, height: 3, borderRadius: '50%', background: '#f008' }} />}
                    </div>
                  )
                })()}

                {/* Player name + posture icon (top-left) */}
                <div style={{
                  position: 'absolute', top: pad / 2, left: pad,
                  color: '#fff', fontSize: fs, fontWeight: 'bold',
                  textShadow: '1px 1px 2px #000',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>{h.name}</span>
                  <span style={{ fontSize: fs + 2 }}>
                    {h.posture === 'prone' ? '\uD83D\uDECC' : h.posture === 'crouch' ? '\uD83E\uDDCE' : '\uD83E\uDDCD'}
                  </span>
                </div>

                {/* Dead overlay */}
                {!h.alive && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#0008', flexDirection: 'column', gap: 4,
                  }}>
                    {shared.mode === 'battle-royale' ? (
                      <>
                        <span style={{ color: '#fa0', fontSize: compact ? 14 : 22, fontWeight: 'bold', textShadow: '2px 2px 4px #000' }}>
                          ELIMINATED
                        </span>
                        {shared.brPlacement > 0 && (
                          <span style={{ color: '#fff', fontSize: compact ? 12 : 18, textShadow: '1px 1px 3px #000' }}>
                            Placement: #{shared.brPlacement}
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: '#f55', fontSize: compact ? 16 : 28, fontWeight: 'bold', textShadow: '2px 2px 4px #000' }}>
                        RESPAWNING...
                      </span>
                    )}
                  </div>
                )}

                {/* HP + Armor (bottom-left) */}
                <div style={{
                  position: 'absolute', bottom: pad, left: pad,
                  display: 'flex', flexDirection: 'column', gap: 2, minWidth: compact ? 90 : 180,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: fs - 2 }}>{'\uD83D\uDEE1\uFE0F'}</span>
                    <div style={{ flex: 1, height: bh - 2, background: '#333a', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${armorPct}%`, height: '100%', background: '#0af', transition: 'width 0.15s' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: fs - 2 }}>{'\u2764\uFE0F'}</span>
                    <div style={{ flex: 1, height: bh, background: '#333a', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${hpPct}%`, height: '100%',
                        background: hpPct > 60 ? '#4f4' : hpPct > 30 ? '#ff0' : '#f44',
                        transition: 'width 0.15s',
                      }} />
                    </div>
                    <span style={{ color: '#fff', fontSize: fs - 2 }}>{Math.ceil(h.hp)}</span>
                  </div>
                </div>

                {/* Weapon (bottom-right) */}
                <div style={{
                  position: 'absolute', bottom: pad, right: pad,
                  color: '#fff', fontSize: compact ? 12 : 18, fontWeight: 'bold',
                  textAlign: 'right', textShadow: '1px 1px 3px #000',
                }}>
                  {h.weapon}
                  {/* ADS indicator */}
                  {h.isAiming && (
                    <div style={{ fontSize: compact ? 8 : 11, color: '#0ff', fontWeight: 'normal', marginTop: 2 }}>
                      ADS
                    </div>
                  )}
                  {/* Aim assist mode */}
                  {h.aimAssist !== 'none' && (
                    <div style={{
                      fontSize: compact ? 8 : 10, marginTop: 2,
                      color: h.aimAssist === 'full' ? '#f80' : '#8f8',
                      fontWeight: 'normal',
                    }}>
                      AA: {h.aimAssist.toUpperCase()}
                    </div>
                  )}
                  {/* Sensitivity value */}
                  <div style={{
                    fontSize: compact ? 8 : 10, marginTop: 2,
                    color: h.sensitivity === 5 ? '#aaa' : h.sensitivity > 5 ? '#fa0' : '#8af',
                    fontWeight: 'normal',
                  }}>
                    SENS: {h.sensitivity}/10
                  </div>
                </div>

                {/* Camera perspective indicator (top-right) */}
                {shared.mode === 'battle-royale' && (
                  <div style={{
                    position: 'absolute', top: pad / 2, right: pad,
                    color: h.cameraPerspective === 'tpp' ? '#0ff' : '#aaa',
                    fontSize: compact ? 10 : 13, fontWeight: 'bold',
                    textShadow: '1px 1px 2px #000', letterSpacing: 1,
                  }}>
                    {h.cameraPerspective.toUpperCase()}
                  </div>
                )}

                {/* Voice chat speakers (top-right, below camera mode) */}
                {shared.mode === 'battle-royale' && shared.vcSpeakers.length > 0 && (
                  <div style={{
                    position: 'absolute', top: pad / 2 + (compact ? 14 : 18), right: pad,
                    display: 'flex', gap: 4, alignItems: 'center',
                  }}>
                    <span style={{ fontSize: compact ? 10 : 14, filter: 'drop-shadow(0 0 3px #0f0)' }}>
                      {'\uD83C\uDF99\uFE0F'}
                    </span>
                    {shared.vcSpeakers.slice(0, 3).map((s, si) => (
                      <span key={si} style={{ color: '#4f4', fontSize: fs - 2, textShadow: '1px 1px 2px #000' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bleeding indicator + bandage progress */}
                {h.bleeding && (
                  <div style={{
                    position: 'absolute', top: '50%', left: pad, transform: 'translateY(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{
                      fontSize: compact ? 16 : 24,
                      animation: 'pulse 0.6s infinite alternate',
                      filter: 'drop-shadow(0 0 4px #f00)',
                    }}>
                      {'\uD83E\uDE78'}
                    </span>
                    <span style={{ color: '#f88', fontSize: fs - 2, textShadow: '1px 1px 2px #000' }}>
                      BLEEDING
                    </span>
                    {h.bandageProgress > 0 && (
                      <div style={{ width: 40, height: 4, background: '#333a', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${h.bandageProgress}%`, height: '100%', background: '#fff', transition: 'width 0.1s' }} />
                      </div>
                    )}
                    <span style={{ color: '#aaa', fontSize: fs - 3 }}>
                      {'\uD83E\uDE79'} ×{h.bandages}
                    </span>
                  </div>
                )}

                {/* Bandage hint (bottom center) */}
                {h.bleeding && h.bandages > 0 && h.bandageProgress === 0 && (
                  <div style={{
                    position: 'absolute', bottom: pad + 25, left: '50%', transform: 'translateX(-50%)',
                    color: '#ff8', fontSize: fs - 1, textShadow: '1px 1px 2px #000',
                    animation: 'pulse 1s infinite alternate',
                  }}>
                    Hold B to bandage
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/*  Shared overlays (above grid)  */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>

        {/* Tickets (conquest / coop) */}
        {(shared.mode === 'conquest' || shared.mode === 'coop-assault') && (
          <div style={{
            position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 14, fontSize: 16, fontWeight: 'bold',
            textShadow: '1px 1px 3px #000', background: '#0008', borderRadius: 8, padding: '3px 12px',
          }}>
            <span style={{ color: '#f55' }}>{'\uD83D\uDD34'} {shared.tickets[0]}</span>
            <span style={{ color: '#888' }}>vs</span>
            <span style={{ color: '#58f' }}>{'\uD83D\uDD35'} {shared.tickets[1]}</span>
          </div>
        )}

        {/* Battle Royale HUD */}
        {shared.mode === 'battle-royale' && (
          <>
            {/* Alive counter (top center) */}
            <div style={{
              position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 16, fontSize: 16, fontWeight: 'bold',
              textShadow: '1px 1px 3px #000', background: '#0008', borderRadius: 8, padding: '4px 16px',
              alignItems: 'center',
            }}>
              <span style={{ color: '#4f4' }}>{'\uD83D\uDC64'} {shared.brAliveCount}/{shared.brTotalCount}</span>
              <span style={{ color: '#fa0' }}>Phase {shared.brZonePhase + 1}</span>
              {shared.brZoneTimer > 0 && (
                <span style={{ color: '#ff4', fontFamily: 'monospace' }}>
                  {'\u23F1'} {Math.ceil(shared.brZoneTimer * 0.033)}s
                </span>
              )}
              {shared.brZoneTimer <= 0 && (
                <span style={{ color: '#f44', animation: 'pulse 0.5s infinite alternate' }}>
                  ZONE SHRINKING
                </span>
              )}
            </div>

            {/* Placement (when dead) */}
            {shared.brPlacement > 0 && (
              <div style={{
                position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
                fontSize: 32, fontWeight: 'bold', color: '#fff',
                textShadow: '2px 2px 8px #000', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, color: '#aaa' }}>YOU PLACED</div>
                <div style={{ color: shared.brPlacement <= 3 ? '#ffd700' : '#fff' }}>
                  #{shared.brPlacement}
                </div>
                {shared.brPlacement === 1 && (
                  <div style={{ fontSize: 24, color: '#ffd700', marginTop: 8 }}>
                    {'\uD83C\uDFC6'} WINNER WINNER CHICKEN DINNER! {'\uD83D\uDC14'}
                  </div>
                )}
              </div>
            )}

            {/* BR Controls hint (bottom) */}
            <div style={{
              position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
              color: '#fff8', fontSize: 10, textShadow: '1px 1px 2px #000',
              display: 'flex', gap: 10,
            }}>
              <span>[F] Loot</span>
              <span>[V] FPP/TPP</span>
              <span>[G] Place Trap</span>
              <span>[T] Push-to-Talk</span>
              <span>[Ctrl+/-] Sensitivity</span>
              <span>[0] Aim Assist</span>
            </div>
          </>
        )}

        {/* Round score (bomb / heist) */}
        {(shared.mode === 'bomb' || shared.mode === 'heist') && (
          <div style={{
            position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
            fontSize: 15, fontWeight: 'bold', color: '#fff',
            textShadow: '1px 1px 3px #000', background: '#0008', borderRadius: 8, padding: '3px 12px',
          }}>
            R{shared.round} {'\u2014'} {'\uD83D\uDD34'} {shared.roundScore[0]} : {shared.roundScore[1]} {'\uD83D\uDD35'}
          </div>
        )}

        {/* Mode label (top right) */}
        <div style={{
          position: 'absolute', top: 6, right: 10,
          color: '#aaa', fontSize: 10, textTransform: 'uppercase',
          textShadow: '1px 1px 2px #000', background: '#0004', borderRadius: 4, padding: '2px 6px',
        }}>
          {shared.mode.replace(/-/g, ' ')}
        </div>

        {/* Kill feed (top right, below mode) */}
        <div style={{ position: 'absolute', top: 26, right: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {shared.killFeed.slice(0, 4).map((kf, i) => (
            <div key={i} style={{
              color: '#fff', fontSize: 10, padding: '1px 6px',
              background: '#0004', borderRadius: 3, textShadow: '1px 1px 2px #000',
            }}>
              {kf.text}
            </div>
          ))}
        </div>

        {/* Tab scoreboard */}
        {showScoreboard && (
          <div style={{
            position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
            background: '#111e', borderRadius: 8, padding: 14, minWidth: 360,
            pointerEvents: 'auto',
          }}>
            <h3 style={{ color: '#fff', textAlign: 'center', margin: '0 0 6px', fontSize: 15 }}>Scoreboard</h3>
            <table style={{ width: '100%', color: '#fff', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #555' }}>
                  <th style={{ textAlign: 'left', padding: 3 }}>Name</th>
                  <th style={{ padding: 3 }}>K</th>
                  <th style={{ padding: 3 }}>D</th>
                  <th style={{ padding: 3 }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((s: ScoreboardEntry) => (
                  <tr key={s.idx} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: 3 }}>
                      <span style={{
                        display: 'inline-block', width: 8, height: 8,
                        borderRadius: '50%', background: s.team === 0 ? '#f55' : '#58f',
                        marginRight: 4,
                      }} />
                      {s.name}
                    </td>
                    <td style={{ textAlign: 'center', padding: 3 }}>{s.kills}</td>
                    <td style={{ textAlign: 'center', padding: 3 }}>{s.deaths}</td>
                    <td style={{ textAlign: 'center', padding: 3 }}>{s.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Click to play (single player only) */}
        {!gameOver && playerCount === 1 && (
          <div style={{
            position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)',
            color: '#fff8', fontSize: 13, textShadow: '1px 1px 2px #000',
          }}>
            Click to play
          </div>
        )}

        {/* Career bar (bottom center) */}
        {(() => {
          const rank = getRank(career.xp)
          const prog = xpToNextLevel(career.xp)
          return (
            <div style={{
              position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#0008', borderRadius: 6, padding: '2px 10px',
              fontSize: 10, color: '#ccc',
            }}>
              <span>{PRESTIGE_ICONS[career.prestige] || ''}</span>
              <span>{rank.icon} {rank.name}</span>
              <div style={{ width: 60, height: 4, background: '#333', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${prog.progress * 100}%`, height: '100%', background: '#fa0' }} />
              </div>
              <span style={{ color: '#fa0' }}>{career.xp} XP</span>
              <span style={{ color: '#ff0' }}>{'\uD83D\uDCB0'}{career.coins}</span>
              <span style={{ color: '#4df' }}>{'\uD83D\uDC8E'}{career.gems}</span>
              <span style={{ color: '#fff' }}>{'\u2B50'}{career.stars}</span>
              <span style={{ color: '#888', fontSize: 9 }}>[P] Shop  [L] Loadout</span>
            </div>
          )
        })()}
      </div>

      <WarzoneFppOverlays
        showShop={showShop} setShowShop={setShowShop}
        showLoadout={showLoadout} setShowLoadout={setShowLoadout}
        career={career} setCareer={setCareer}
        shopMessage={shopMessage} setShopMessage={setShopMessage}
        lootResult={lootResult} setLootResult={setLootResult}
        editingWeapon={editingWeapon} setEditingWeapon={setEditingWeapon}
        tempLoadout={tempLoadout} setTempLoadout={setTempLoadout}
        shopItems={shopItems} stateRef={stateRef}
      />

      {/* Pause menu */}
      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {/* Game over overlay */}
      {gameOver && (
        <div className={styles.overlay} style={{ zIndex: 30 }}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          <p className={styles.winnerText}>{teamName(shared.winTeam)} {t('miniGames.wins', 'wins')}!</p>
          <div style={{ fontSize: '0.9rem', color: '#ccc', textAlign: 'center' }}>
            {scoreboard.filter((s: ScoreboardEntry) => s.team === shared.winTeam).map((s: ScoreboardEntry) => (
              <div key={s.idx}>
                {s.name}: {s.kills}K / {s.captures}C
              </div>
            ))}
          </div>
          <div className={styles.overlayActions}>
            <button className={styles.restartBtn} onClick={handleRestart}>
              {t('miniGames.playAgain', 'Play Again')}
            </button>
            <button className={styles.backBtnOverlay} onClick={onBack}>
              {t('miniGames.backToMenu', 'Back to Menu')}
            </button>
          </div>
          <p className={styles.overlayHint}>
            {t('miniGames.pressRestart', 'Press Space or Enter to restart')}
          </p>
        </div>
      )}
    </div>
  )
}

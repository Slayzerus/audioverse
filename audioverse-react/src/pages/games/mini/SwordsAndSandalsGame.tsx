/**
 * SwordsAndSandalsGame — real-time gladiator combat mini-game.
 *
 * Controls (per keyboard group):
 *   Group 0: W (jump) / A (left) / S (block) / D (right) / Space (attack) / E (special)
 *   Group 1: Arrows (move/jump/block) / Enter (attack) / Shift (special)
 * Gamepad: Left stick move, A jump, X attack, B block, Y special
 *
 * All combat is real-time with cooldowns — both gladiators act simultaneously.
 *
 * Currencies: coins (damage dealt), gems (combos), stars (arena victories).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import styles from './SharedGame.module.css'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

// ─── Constants ───────────────────────────────────────────────
const W = 800
const H = 400
const GROUND_Y = 320
const GRAVITY = 0.6
const JUMP_VEL = -10
const MOVE_SPEED = 3
const BODY_W = 30
const BODY_H = 50
const HEAD_R = 10
const SWORD_LEN = 28
const ATTACK_RANGE = 55
const ATTACK_COOLDOWN = 500
const SPECIAL_CHARGE = 1000
const SPECIAL_COOLDOWN = 3000
const BLOCK_REDUCTION = 0.75
const STAMINA_COST_ATTACK = 15
const STAMINA_COST_SPECIAL = 30
const STAMINA_REGEN = 0.15
const BASE_DAMAGE = 12
const TICK_MS = 16

// ─── Types ───────────────────────────────────────────────────
interface Gladiator {
  x: number; y: number; vx: number; vy: number
  facingRight: boolean; onGround: boolean
  hp: number; maxHp: number; stamina: number; maxStamina: number; armor: number
  attacking: boolean; attackTimer: number; attackCooldown: number
  blocking: boolean
  charging: boolean; chargeTimer: number; specialCooldown: number
  alive: boolean; color: string; name: string
  playerIndex: number; input: PlayerSlot['input']
  wins: number; totalDamage: number; comboCount: number; consecutiveHits: number
  coins: number; gems: number; stars: number
}

interface WaveEnemy {
  x: number; y: number; vx: number; vy: number; hp: number; maxHp: number
  facingRight: boolean; onGround: boolean; alive: boolean
  attackTimer: number; attackCooldown: number; color: string
}

interface GameState {
  gladiators: Gladiator[]; enemies: WaveEnemy[]
  round: number; roundsToWin: number; gameMode: string
  roundOver: boolean; roundTimer: number; matchOver: boolean
  wave: number; waveSpawnTimer: number
  arenaW: number
}

// ─── Helpers ─────────────────────────────────────────────────
function spawnGladiator(p: PlayerSlot, idx: number, arenaW: number): Gladiator {
  const spacing = arenaW / 3
  return {
    x: spacing + idx * spacing, y: GROUND_Y - BODY_H, vx: 0, vy: 0,
    facingRight: idx === 0, onGround: true,
    hp: 100, maxHp: 100, stamina: 100, maxStamina: 100, armor: 20,
    attacking: false, attackTimer: 0, attackCooldown: 0,
    blocking: false, charging: false, chargeTimer: 0, specialCooldown: 0,
    alive: true, color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name, playerIndex: p.index, input: p.input,
    wins: 0, totalDamage: 0, comboCount: 0, consecutiveHits: 0,
    coins: 0, gems: 0, stars: 0,
  }
}

function spawnWaveEnemy(wave: number, arenaW: number): WaveEnemy {
  const side = Math.random() > 0.5
  return {
    x: side ? arenaW - 60 : 60, y: GROUND_Y - BODY_H, vx: 0, vy: 0,
    hp: 40 + wave * 15, maxHp: 40 + wave * 15,
    facingRight: !side, onGround: true, alive: true,
    attackTimer: 0, attackCooldown: 0, color: '#8B4513',
  }
}

function arenaWidth(size: string): number {
  return size === 'small' ? 600 : size === 'large' ? 1000 : 800
}

function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const aw = arenaWidth(config.arenaSize || 'medium')
  const glads = players.map((p, i) => spawnGladiator(p, i, aw))
  return {
    gladiators: glads, enemies: [],
    round: 1, roundsToWin: Number(config.roundsToWin) || 3,
    gameMode: config.gameMode || 'arena-vs',
    roundOver: false, roundTimer: 0, matchOver: false,
    wave: 1, waveSpawnTimer: 0, arenaW: aw,
  }
}

// ─── Component ───────────────────────────────────────────────
interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function SwordsAndSandalsGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const keysRef = useRef<Set<string>>(new Set())
  const [scoreboard, setScoreboard] = useState<Gladiator[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ─── Keyboard tracking ──────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key); e.preventDefault() }
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ─── Input reading ──────────────────────────────────────
  function readInput(g: Gladiator) {
    const keys = keysRef.current
    const cp = padsRef.current
    let left = false, right = false, jump = false, attack = false, block = false, special = false
    if (g.input.type === 'keyboard') {
      const gr = g.input.group
      if (gr === 0) {
        left = keys.has('a') || keys.has('A'); right = keys.has('d') || keys.has('D')
        jump = keys.has('w') || keys.has('W'); block = keys.has('s') || keys.has('S')
        attack = keys.has(' '); special = keys.has('e') || keys.has('E')
      } else {
        left = keys.has('ArrowLeft'); right = keys.has('ArrowRight')
        jump = keys.has('ArrowUp'); block = keys.has('ArrowDown')
        attack = keys.has('Enter'); special = keys.has('Shift')
      }
    } else if (g.input.type === 'gamepad') {
      const gp = cp.find(p => p.index === (g.input as { type: 'gamepad'; padIndex: number }).padIndex)
      if (gp) {
        left = gp.left; right = gp.right; jump = gp.a; attack = gp.x; block = gp.b; special = gp.y
      }
    }
    return { left, right, jump, attack, block, special }
  }

  // ─── Deal damage helper ─────────────────────────────────
  function dealDamage(attacker: Gladiator, target: { hp: number; armor?: number; blocking?: boolean; alive: boolean }, dmg: number) {
    let actual = dmg
    if (target.blocking) actual *= (1 - BLOCK_REDUCTION)
    if ((target.armor ?? 0) > 0) { const absorb = Math.min(target.armor!, actual * 0.5); target.armor! -= absorb; actual -= absorb }
    target.hp = Math.max(0, target.hp - actual)
    attacker.totalDamage += actual
    attacker.coins += Math.floor(actual)
    attacker.consecutiveHits++
    if (attacker.consecutiveHits >= 3) { attacker.comboCount++; attacker.gems += attacker.consecutiveHits; attacker.consecutiveHits = 0 }
    if (target.hp <= 0) target.alive = false
  }

  // ─── Main game loop ─────────────────────────────────────
  useEffect(() => {
    let lastTime = performance.now()

    function tick() {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.matchOver) return
      const now = performance.now()
      const dt = (now - lastTime) / 1000
      lastTime = now

      if (st.roundOver) { st.roundTimer -= dt; if (st.roundTimer <= 0) startNewRound(st); return }

      // Update gladiators
      for (const g of st.gladiators) {
        if (!g.alive) continue
        const inp = readInput(g)
        g.blocking = inp.block && g.onGround && !g.attacking && !g.charging
        // Movement
        if (!g.blocking) {
          if (inp.left) { g.vx = -MOVE_SPEED; g.facingRight = false }
          else if (inp.right) { g.vx = MOVE_SPEED; g.facingRight = true }
          else g.vx = 0
        } else g.vx = 0
        // Jump
        if (inp.jump && g.onGround && !g.blocking) { g.vy = JUMP_VEL; g.onGround = false }
        // Gravity
        g.vy += GRAVITY; g.y += g.vy; g.x += g.vx
        if (g.y >= GROUND_Y - BODY_H) { g.y = GROUND_Y - BODY_H; g.vy = 0; g.onGround = true }
        g.x = Math.max(30, Math.min(st.arenaW - 30, g.x))
        // Attack
        if (g.attackCooldown > 0) g.attackCooldown -= dt * 1000
        if (inp.attack && !g.blocking && g.attackCooldown <= 0 && g.stamina >= STAMINA_COST_ATTACK && !g.charging) {
          g.attacking = true; g.attackTimer = 150; g.attackCooldown = ATTACK_COOLDOWN; g.stamina -= STAMINA_COST_ATTACK
        }
        if (g.attacking) {
          g.attackTimer -= dt * 1000
          if (g.attackTimer <= 0) g.attacking = false
        }
        // Special
        if (g.specialCooldown > 0) g.specialCooldown -= dt * 1000
        if (inp.special && !g.blocking && g.specialCooldown <= 0 && g.stamina >= STAMINA_COST_SPECIAL && !g.attacking) {
          g.charging = true; g.chargeTimer = SPECIAL_CHARGE; g.stamina -= STAMINA_COST_SPECIAL; g.specialCooldown = SPECIAL_COOLDOWN
        }
        if (g.charging) {
          g.chargeTimer -= dt * 1000
          if (g.chargeTimer <= 0) {
            g.charging = false; g.attacking = true; g.attackTimer = 200
            // Hit check for special (double damage)
            for (const o of st.gladiators) {
              if (o === g || !o.alive) continue
              if (Math.abs(o.x - g.x) < ATTACK_RANGE) dealDamage(g, o, BASE_DAMAGE * 2)
            }
            for (const e of st.enemies) {
              if (!e.alive) continue
              if (Math.abs(e.x - g.x) < ATTACK_RANGE) dealDamage(g, e, BASE_DAMAGE * 2)
            }
          }
        }
        // Normal attack hit check
        if (g.attacking && g.attackTimer > 100) {
          for (const o of st.gladiators) {
            if (o === g || !o.alive) continue
            if (Math.abs(o.x - g.x) < ATTACK_RANGE) dealDamage(g, o, BASE_DAMAGE)
          }
          for (const e of st.enemies) {
            if (!e.alive) continue
            if (Math.abs(e.x - g.x) < ATTACK_RANGE) dealDamage(g, e, BASE_DAMAGE)
          }
        }
        // Stamina regen
        g.stamina = Math.min(g.maxStamina, g.stamina + STAMINA_REGEN)
      }

      // AI enemies (coop/survival)
      for (const e of st.enemies) {
        if (!e.alive) continue
        const closest = st.gladiators.filter(g => g.alive).sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x))[0]
        if (closest) {
          const dx = closest.x - e.x
          e.facingRight = dx > 0
          if (Math.abs(dx) > ATTACK_RANGE) e.vx = dx > 0 ? 2 : -2
          else { e.vx = 0; e.attackCooldown -= dt * 1000; if (e.attackCooldown <= 0) { e.attackTimer = 150; e.attackCooldown = 800 } }
        }
        e.vy += GRAVITY; e.y += e.vy; e.x += e.vx
        if (e.y >= GROUND_Y - BODY_H) { e.y = GROUND_Y - BODY_H; e.vy = 0; e.onGround = true }
        e.x = Math.max(30, Math.min(st.arenaW - 30, e.x))
        // Enemy attack hits
        if (e.attackTimer > 0) {
          e.attackTimer -= dt * 1000
          if (e.attackTimer > 100) {
            for (const g of st.gladiators) {
              if (!g.alive) continue
              if (Math.abs(g.x - e.x) < ATTACK_RANGE) {
                let dmg = 8 + st.wave * 2
                if (g.blocking) dmg *= (1 - BLOCK_REDUCTION)
                if (g.armor > 0) { const ab = Math.min(g.armor, dmg * 0.5); g.armor -= ab; dmg -= ab }
                g.hp = Math.max(0, g.hp - dmg); if (g.hp <= 0) g.alive = false
              }
            }
          }
        }
      }
      st.enemies = st.enemies.filter(e => e.alive)

      // Coop/survival spawning
      if ((st.gameMode === 'coop-tournament' || st.gameMode === 'survival') && st.enemies.length === 0) {
        st.waveSpawnTimer -= dt * 1000
        if (st.waveSpawnTimer <= 0) {
          const count = Math.min(st.wave + 1, 5)
          for (let i = 0; i < count; i++) st.enemies.push(spawnWaveEnemy(st.wave, st.arenaW))
          st.wave++; st.waveSpawnTimer = 2000
        }
      }

      // Round / match end checks
      const aliveGlads = st.gladiators.filter(g => g.alive)
      if (st.gameMode === 'arena-vs') {
        if (aliveGlads.length <= 1 && st.gladiators.length > 1) {
          if (aliveGlads.length === 1) { aliveGlads[0].wins++; aliveGlads[0].stars++ }
          const champ = st.gladiators.find(g => g.wins >= st.roundsToWin)
          if (champ) { st.matchOver = true; setWinner(champ.name); setGameOver(true) }
          else { st.roundOver = true; st.roundTimer = 3 }
        }
        if (st.gladiators.length === 1 && !aliveGlads.length) {
          st.matchOver = true; setGameOver(true)
        }
      } else if (st.gameMode === 'coop-tournament') {
        if (aliveGlads.length === 0) { st.matchOver = true; setGameOver(true) }
        if (st.wave > st.roundsToWin * 2) {
          st.matchOver = true; const best = st.gladiators.sort((a, b) => b.totalDamage - a.totalDamage)[0]
          setWinner(best?.name ?? null); setGameOver(true)
        }
      } else {
        if (aliveGlads.length === 0) { st.matchOver = true; setGameOver(true) }
      }

      setScoreboard([...st.gladiators])
    }

    function startNewRound(st: GameState) {
      st.round++; st.roundOver = false
      for (const g of st.gladiators) {
        const idx = st.gladiators.indexOf(g)
        const spacing = st.arenaW / 3
        g.x = spacing + idx * spacing; g.y = GROUND_Y - BODY_H
        g.vx = 0; g.vy = 0; g.hp = g.maxHp; g.stamina = g.maxStamina; g.armor = 20
        g.alive = true; g.attacking = false; g.blocking = false; g.charging = false
        g.attackCooldown = 0; g.specialCooldown = 0; g.consecutiveHits = 0
      }
    }

    const timerId = setInterval(tick, TICK_MS)
    return () => clearInterval(timerId)
    // Mount-only: game loop timer initialized once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Render ─────────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current

      const cw = Math.max(W, st.arenaW + 60)
      canvas.width = cw; canvas.height = H

      // Sky
      ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, cw, H)
      // Sand ground
      ctx.fillStyle = '#d2b48c'; ctx.fillRect(0, GROUND_Y, cw, H - GROUND_Y)
      // Ground line
      ctx.strokeStyle = '#a08060'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(cw, GROUND_Y); ctx.stroke()

      // Pillars
      const pillarW = 20, pillarH = 120
      ctx.fillStyle = '#808080'
      ctx.fillRect(15, GROUND_Y - pillarH, pillarW, pillarH)
      ctx.fillRect(cw - 35, GROUND_Y - pillarH, pillarW, pillarH)
      // Pillar caps
      ctx.fillStyle = '#a0a0a0'
      ctx.fillRect(10, GROUND_Y - pillarH - 10, 30, 12)
      ctx.fillRect(cw - 40, GROUND_Y - pillarH - 10, 30, 12)

      // Arena walls (low)
      ctx.fillStyle = '#9e8a6e'
      ctx.fillRect(0, GROUND_Y + 2, cw, 6)

      // Draw gladiators
      for (const g of st.gladiators) {
        drawGladiator(ctx, g, g.alive ? 1 : 0.3)
      }
      // Draw enemies
      for (const e of st.enemies) {
        drawEnemy(ctx, e)
      }

      // Round info (between-round overlay)
      if (st.roundOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, cw, H)
        ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`Round ${st.round} complete`, cw / 2, H / 2 - 20)
        ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'
        for (let i = 0; i < st.gladiators.length; i++) {
          const g = st.gladiators[i]
          ctx.fillText(`${g.name}: ${g.wins} wins | ${Math.floor(g.totalDamage)} dmg`, cw / 2, H / 2 + 20 + i * 28)
        }
      }

      // Wave indicator
      if (st.gameMode !== 'arena-vs') {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'
        ctx.fillText(`Wave ${st.wave}`, 10, 20)
      }

      raf = requestAnimationFrame(draw)
    }

    function drawGladiator(ctx: CanvasRenderingContext2D, g: Gladiator, alpha: number) {
      ctx.globalAlpha = alpha
      const cx = g.x, cy = g.y
      // Body
      ctx.fillStyle = g.color
      ctx.fillRect(cx - BODY_W / 2, cy, BODY_W, BODY_H)
      // Head
      ctx.beginPath()
      ctx.arc(cx, cy - HEAD_R + 2, HEAD_R, 0, Math.PI * 2)
      ctx.fillStyle = '#fdd'; ctx.fill()
      ctx.strokeStyle = g.color; ctx.lineWidth = 2; ctx.stroke()
      // Sword
      const swordDir = g.facingRight ? 1 : -1
      const swordY = cy + 15
      const swordAngle = g.attacking ? -0.8 : g.charging ? -0.3 : 0.2
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx + swordDir * BODY_W / 2, swordY)
      ctx.lineTo(cx + swordDir * (BODY_W / 2 + SWORD_LEN * Math.cos(swordAngle)),
                 swordY - SWORD_LEN * Math.sin(swordAngle))
      ctx.stroke()
      // Shield if blocking
      if (g.blocking) {
        ctx.fillStyle = '#a08040'
        const shX = cx + swordDir * -BODY_W / 2 - swordDir * 8
        ctx.fillRect(shX - 5, cy + 5, 10, 25)
      }
      // Charging glow
      if (g.charging) {
        ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2
        ctx.strokeRect(cx - BODY_W / 2 - 4, cy - 4, BODY_W + 8, BODY_H + 8)
      }
      // HP bar
      const barW = 40, barH = 5, barY = cy - HEAD_R * 2 - 10
      ctx.fillStyle = '#600'; ctx.fillRect(cx - barW / 2, barY, barW, barH)
      ctx.fillStyle = g.hp > 30 ? '#2ecc71' : '#e74c3c'
      ctx.fillRect(cx - barW / 2, barY, barW * (g.hp / g.maxHp), barH)
      // Stamina bar
      ctx.fillStyle = '#224'; ctx.fillRect(cx - barW / 2, barY + barH + 2, barW, 3)
      ctx.fillStyle = '#3498db'
      ctx.fillRect(cx - barW / 2, barY + barH + 2, barW * (g.stamina / g.maxStamina), 3)
      // Armor indicator
      if (g.armor > 0) {
        ctx.fillStyle = '#888'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`🛡${Math.floor(g.armor)}`, cx, barY - 3)
      }
      // Name
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(g.name, cx, barY - (g.armor > 0 ? 14 : 3))
      ctx.globalAlpha = 1
    }

    function drawEnemy(ctx: CanvasRenderingContext2D, e: WaveEnemy) {
      ctx.fillStyle = e.color
      ctx.fillRect(e.x - BODY_W / 2, e.y, BODY_W, BODY_H)
      ctx.beginPath(); ctx.arc(e.x, e.y - 6, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#c66'; ctx.fill()
      // Sword
      const dir = e.facingRight ? 1 : -1
      ctx.strokeStyle = '#999'; ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(e.x + dir * BODY_W / 2, e.y + 15)
      ctx.lineTo(e.x + dir * (BODY_W / 2 + 20), e.y + 5)
      ctx.stroke()
      // HP bar
      const barW = 30
      ctx.fillStyle = '#600'; ctx.fillRect(e.x - barW / 2, e.y - 18, barW, 4)
      ctx.fillStyle = '#e74c3c'; ctx.fillRect(e.x - barW / 2, e.y - 18, barW * (e.hp / e.maxHp), 4)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Restart ────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false); setWinner(null); setScoreboard([])
  }, [players, config])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  return (
    <div className={styles.container}>
      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        {scoreboard.map(g => (
          <div key={g.playerIndex} className={`${styles.scoreItem} ${!g.alive ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: g.color }} />
            <span>{g.name}</span>
            <span className={styles.scoreValue}>W{g.wins}</span>
            <span style={{ color: '#f1c40f', fontSize: '0.8em' }}>🪙{g.coins}</span>
            <span style={{ color: '#e74c3c', fontSize: '0.8em' }}>💎{g.gems}</span>
            <span style={{ color: '#2ecc71', fontSize: '0.8em' }}>⭐{g.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Swords And Sandals canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && stateRef.current.gameMode !== 'arena-vs' && (
            <p className={styles.winnerText}>Wave {stateRef.current.wave - 1} reached</p>
          )}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {scoreboard.map(g => (
              <div key={g.playerIndex} style={{ color: g.color, textAlign: 'center', fontSize: '0.9rem' }}>
                <div style={{ fontWeight: 700 }}>{g.name}</div>
                <div>Wins: {g.wins} | Dmg: {Math.floor(g.totalDamage)}</div>
                <div>🪙{g.coins} 💎{g.gems} ⭐{g.stars}</div>
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
          <p className={styles.overlayHint}>{t('miniGames.pressRestart', 'Press Space or Enter to restart')}</p>
        </div>
      )}
    </div>
  )
}

/**
 * MightAndMagicGame — first-person party RPG dungeon crawler.
 *
 * Controls:
 *   W/↑ — Move forward    A/← — Turn left
 *   S/↓ — Turn around     D/→ — Turn right
 *   1-4 — Use ability     Space — Attack
 *   I — Toggle instructions
 * Gamepads: D-pad move, face buttons for abilities.
 *
 * Modes:
 *  - Adventure: explore dungeon floors solo/coop
 *  - Coop Dungeon: shared dungeon exploration
 *  - VS Race: race to clear more floors
 *
 * Combat:
 *  - Real-time (default): auto-attack every 2s, abilities on cooldown
 *  - Turn-based: select action from menu per hero
 *
 * Currencies: coins (gold loot), gems (rare drops), stars (dungeon clears)
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import styles from './SharedGame.module.css'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

// ─── Constants ───────────────────────────────────────────────
const CW = 800, CH = 500
const GRID = 10
const AUTO_ATK_MS = 2000
const CLASSES = ['Warrior', 'Mage', 'Ranger', 'Cleric'] as const
type HeroClass = typeof CLASSES[number]

const CLASS_LETTER: Record<HeroClass, string> = { Warrior: 'W', Mage: 'M', Ranger: 'R', Cleric: 'C' }
const CLASS_COLOR: Record<HeroClass, string> = { Warrior: '#c0392b', Mage: '#2980b9', Ranger: '#27ae60', Cleric: '#f39c12' }

type RoomType = 'empty' | 'monster' | 'treasure' | 'trap' | 'stairs' | 'shop'
type Dir4 = 0 | 1 | 2 | 3 // N E S W
const DX = [0, 1, 0, -1]
const DY = [-1, 0, 1, 0]

interface Ability { name: string; cd: number; timer: number; kind: 'dmg' | 'heal' | 'buff' | 'revive' }
interface Hero {
  cls: HeroClass; hp: number; maxHp: number; mp: number; maxMp: number
  atk: number; def: number; alive: boolean; abilities: Ability[]
  atkTimer: number; owner: number
}
interface Monster {
  kind: string; color: string; shape: 'rect' | 'tri' | 'circle'
  hp: number; maxHp: number; atk: number; def: number; goldDrop: number; gemChance: number
  alpha: number
}
interface Room { type: RoomType; explored: boolean; monster?: Monster; gold?: number; trapDmg?: number }
interface GS {
  heroes: Hero[]; dungeon: Room[][]; px: number; py: number; dir: Dir4
  floor: number; coins: number; gems: number; stars: number
  inCombat: boolean; monsters: Monster[]; combatLog: string[]
  turnBased: boolean; turnIndex: number; turnMenu: boolean
  gameOver: boolean; winner: string | null; showInstructions: boolean
  mode: string; time: number
}

// ─── Helpers ─────────────────────────────────────────────────
function rng(min: number, max: number) { return Math.random() * (max - min) + min }
function rngI(min: number, max: number) { return Math.floor(rng(min, max)) }

function makeAbilities(cls: HeroClass): Ability[] {
  switch (cls) {
    case 'Warrior': return [
      { name: 'Heavy Strike', cd: 5000, timer: 0, kind: 'dmg' },
      { name: 'Shield Block', cd: 5000, timer: 0, kind: 'buff' },
    ]
    case 'Mage': return [
      { name: 'Fireball', cd: 4000, timer: 0, kind: 'dmg' },
      { name: 'Heal', cd: 6000, timer: 0, kind: 'heal' },
    ]
    case 'Ranger': return [
      { name: 'Quick Shot', cd: 3000, timer: 0, kind: 'dmg' },
      { name: 'Dodge', cd: 3000, timer: 0, kind: 'buff' },
    ]
    case 'Cleric': return [
      { name: 'Holy Light', cd: 5000, timer: 0, kind: 'dmg' },
      { name: 'Resurrect', cd: 10000, timer: 0, kind: 'revive' },
    ]
  }
}

function makeMonster(floor: number): Monster {
  const kinds: { kind: string; color: string; shape: Monster['shape']; alpha: number }[] = [
    { kind: 'Skeleton', color: '#aaa', shape: 'rect', alpha: 1 },
    { kind: 'Slime', color: '#2ecc71', shape: 'circle', alpha: 1 },
    { kind: 'Dragon', color: '#e74c3c', shape: 'tri', alpha: 1 },
    { kind: 'Ghost', color: '#ecf0f1', shape: 'rect', alpha: 0.5 },
  ]
  const k = kinds[rngI(0, kinds.length)]
  const mult = 1 + floor * 0.4
  return { ...k, hp: Math.round(30 * mult), maxHp: Math.round(30 * mult), atk: Math.round(8 * mult), def: Math.round(2 * mult), goldDrop: rngI(5, 15 + floor * 5), gemChance: 0.1 + floor * 0.02 }
}

function generateDungeon(floor: number): Room[][] {
  const grid: Room[][] = []
  for (let y = 0; y < GRID; y++) {
    grid[y] = []
    for (let x = 0; x < GRID; x++) {
      const r = Math.random()
      let type: RoomType = 'empty'
      if (r < 0.3) type = 'monster'
      else if (r < 0.4) type = 'treasure'
      else if (r < 0.45) type = 'trap'
      else if (r < 0.48) type = 'shop'
      grid[y][x] = {
        type, explored: false,
        monster: type === 'monster' ? makeMonster(floor) : undefined,
        gold: type === 'treasure' ? rngI(10, 30 + floor * 10) : undefined,
        trapDmg: type === 'trap' ? rngI(5, 15 + floor * 3) : undefined,
      }
    }
  }
  // place stairs in far corner
  grid[GRID - 1][GRID - 1] = { type: 'stairs', explored: false }
  // start room is empty
  grid[0][0] = { type: 'empty', explored: true }
  return grid
}

function initState(players: PlayerSlot[], config: GameConfig): GS {
  const heroes: Hero[] = CLASSES.map((cls, i) => ({
    cls, hp: cls === 'Warrior' ? 120 : cls === 'Cleric' ? 90 : 80,
    maxHp: cls === 'Warrior' ? 120 : cls === 'Cleric' ? 90 : 80,
    mp: cls === 'Mage' ? 60 : cls === 'Cleric' ? 50 : 30,
    maxMp: cls === 'Mage' ? 60 : cls === 'Cleric' ? 50 : 30,
    atk: cls === 'Warrior' ? 18 : cls === 'Ranger' ? 15 : 10,
    def: cls === 'Warrior' ? 12 : cls === 'Cleric' ? 8 : 4,
    alive: true, abilities: makeAbilities(cls), atkTimer: 0,
    owner: i % Math.max(1, players.length),
  }))
  const turnBased = config.combatMode === 'turn-based'
  return {
    heroes, dungeon: generateDungeon(0), px: 0, py: 0, dir: 1,
    floor: 0, coins: 0, gems: 0, stars: 0,
    inCombat: false, monsters: [], combatLog: [],
    turnBased, turnIndex: 0, turnMenu: false,
    gameOver: false, winner: null, showInstructions: false,
    mode: config.gameMode || 'adventure', time: 0,
  }
}

// ─── Component ───────────────────────────────────────────────
interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function MightAndMagicGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GS>(initState(players, config))
  const keysRef = useRef<Set<string>>(new Set())
  const { isPaused, pauseRef, resume } = usePause({ onBack })
  const gamepads = useGamepads()
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [scoreboard, setScoreboard] = useState<{ coins: number; gems: number; stars: number; floor: number }>(
    { coins: 0, gems: 0, stars: 0, floor: 0 },
  )

  // ─── Keyboard ──────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); e.preventDefault() }
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ─── Movement helper ──────────
  const tryMove = useCallback((s: GS) => {
    const nx = s.px + DX[s.dir]
    const ny = s.py + DY[s.dir]
    if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) return
    s.px = nx; s.py = ny
    const room = s.dungeon[ny][nx]
    room.explored = true
    if (room.type === 'monster' && room.monster && room.monster.hp > 0) {
      s.inCombat = true
      s.monsters = [room.monster]
      s.combatLog = [`Encountered ${room.monster.kind}!`]
      if (s.turnBased) { s.turnIndex = 0; s.turnMenu = true }
    } else if (room.type === 'treasure' && room.gold) {
      s.coins += room.gold
      s.combatLog = [`Found ${room.gold} gold!`]
      room.gold = 0; room.type = 'empty'
    } else if (room.type === 'trap' && room.trapDmg) {
      const dmg = room.trapDmg
      s.heroes.forEach(h => { if (h.alive) h.hp = Math.max(0, h.hp - dmg) })
      s.combatLog = [`Trap! ${dmg} damage to all!`]
      room.trapDmg = 0; room.type = 'empty'
    } else if (room.type === 'stairs') {
      s.floor++; s.stars++
      s.dungeon = generateDungeon(s.floor)
      s.px = 0; s.py = 0; s.dir = 1
      s.dungeon[0][0].explored = true
      s.combatLog = [`Descended to floor ${s.floor + 1}!`]
      s.heroes.forEach(h => { if (h.alive) { h.hp = Math.min(h.maxHp, h.hp + 20); h.mp = Math.min(h.maxMp, h.mp + 10) } })
    } else if (room.type === 'shop') {
      // Simple shop: spend 20 gold to heal party
      if (s.coins >= 20) {
        s.coins -= 20
        s.heroes.forEach(h => { if (h.alive) { h.hp = h.maxHp; h.mp = h.maxMp } })
        s.combatLog = ['Shop: Healed party for 20 gold!']
      } else {
        s.combatLog = ['Shop: Not enough gold (need 20)!']
      }
    }
  }, [])

  // ─── Use ability helper ──────────
  const useAbility = useCallback((s: GS, heroIdx: number, abilityIdx: number) => {
    const hero = s.heroes[heroIdx]
    if (!hero || !hero.alive) return
    const ab = hero.abilities[abilityIdx]
    if (!ab || ab.timer > 0) return
    const mpCost = 5
    if (hero.mp < mpCost) return
    hero.mp -= mpCost
    ab.timer = ab.cd
    if (ab.kind === 'dmg') {
      const mult = hero.cls === 'Warrior' ? 2 : hero.cls === 'Ranger' ? 1.5 : 1.8
      const dmg = Math.round(hero.atk * mult)
      s.monsters.forEach(m => { m.hp = Math.max(0, m.hp - Math.max(1, dmg - m.def)) })
      s.combatLog.push(`${hero.cls} used ${ab.name} for ${dmg} dmg!`)
    } else if (ab.kind === 'heal') {
      const amt = 25
      s.heroes.forEach(h => { if (h.alive) h.hp = Math.min(h.maxHp, h.hp + amt) })
      s.combatLog.push(`${hero.cls} healed party for ${amt}!`)
    } else if (ab.kind === 'buff') {
      hero.def += 3
      s.combatLog.push(`${hero.cls} used ${ab.name}!`)
    } else if (ab.kind === 'revive') {
      const dead = s.heroes.find(h => !h.alive)
      if (dead) { dead.alive = true; dead.hp = Math.round(dead.maxHp * 0.3); s.combatLog.push(`${hero.cls} revived ${dead.cls}!`) }
      else s.combatLog.push('No one to revive.')
    }
  }, [])

  // ─── Game loop ─────────
  useEffect(() => {
    let prev = performance.now()
    let raf = 0
    let moveCd = 0 // movement cooldown to prevent double-step

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (pauseRef.current) return
      const s = stateRef.current
      if (s.gameOver) return
      const dt = Math.min(now - prev, 50)
      prev = now
      s.time += dt
      moveCd = Math.max(0, moveCd - dt)

      const keys = keysRef.current

      // ─── Toggle instructions ──────
      if (keys.has('i')) { s.showInstructions = !s.showInstructions; keys.delete('i') }

      if (s.inCombat) {
        // ── Combat ─────────────────
        if (s.turnBased) {
          // Turn-based: wait for key input per hero
          const hero = s.heroes[s.turnIndex]
          if (hero && hero.alive) {
            if (keys.has(' ') || keys.has('enter')) {
              // basic attack
              const dmg = Math.max(1, hero.atk - (s.monsters[0]?.def || 0))
              s.monsters.forEach(m => { m.hp = Math.max(0, m.hp - dmg) })
              s.combatLog.push(`${hero.cls} attacks for ${dmg}!`)
              keys.delete(' '); keys.delete('enter')
              s.turnIndex = (s.turnIndex + 1) % 4
              // Enemy turn after all heroes
              if (s.turnIndex === 0) {
                s.monsters.forEach(m => {
                  if (m.hp > 0) {
                    const target = s.heroes.filter(h => h.alive)[rngI(0, s.heroes.filter(h => h.alive).length)]
                    if (target) {
                      const ed = Math.max(1, m.atk - target.def)
                      target.hp = Math.max(0, target.hp - ed)
                      if (target.hp <= 0) target.alive = false
                      s.combatLog.push(`${m.kind} hits ${target.cls} for ${ed}!`)
                    }
                  }
                })
              }
            }
            // abilities
            for (let a = 0; a < 2; a++) {
              if (keys.has(`${a + 1}`)) { useAbility(s, s.turnIndex, a); keys.delete(`${a + 1}`); s.turnIndex = (s.turnIndex + 1) % 4 }
            }
          } else {
            // skip dead heroes
            s.turnIndex = (s.turnIndex + 1) % 4
          }
        } else {
          // Real-time combat
          s.heroes.forEach((hero, _hi) => {
            if (!hero.alive) return
            hero.atkTimer += dt
            // auto-attack
            if (hero.atkTimer >= AUTO_ATK_MS) {
              hero.atkTimer = 0
              const dmg = Math.max(1, hero.atk - (s.monsters[0]?.def || 0))
              s.monsters.forEach(m => { m.hp = Math.max(0, m.hp - dmg) })
              s.combatLog.push(`${hero.cls} attacks for ${dmg}`)
            }
            // cooldowns
            hero.abilities.forEach(ab => { if (ab.timer > 0) ab.timer = Math.max(0, ab.timer - dt) })
          })
          // Player ability keys 1-4 map to hero abilities
          for (let a = 0; a < 4; a++) {
            if (keys.has(`${a + 1}`)) { useAbility(s, a, 0); keys.delete(`${a + 1}`) }
            if (keys.has(`${a + 5}`)) { useAbility(s, a, 1); keys.delete(`${a + 5}`) }
          }
          // space for active hero basic attack
          if (keys.has(' ')) {
            keys.delete(' ')
            const alive = s.heroes.filter(h => h.alive)
            if (alive.length > 0) {
              const hero = alive[0]
              const dmg = Math.max(1, hero.atk - (s.monsters[0]?.def || 0))
              s.monsters.forEach(m => { m.hp = Math.max(0, m.hp - dmg) })
              s.combatLog.push(`${hero.cls} strikes for ${dmg}!`)
            }
          }
          // Monster attacks
          s.monsters.forEach(m => {
            if (m.hp <= 0) return
            // monsters attack every 3s encoded via time
            if (Math.floor(s.time / 3000) !== Math.floor((s.time - dt) / 3000)) {
              const alive = s.heroes.filter(h => h.alive)
              if (alive.length > 0) {
                const target = alive[rngI(0, alive.length)]
                const ed = Math.max(1, m.atk - target.def)
                target.hp = Math.max(0, target.hp - ed)
                if (target.hp <= 0) target.alive = false
                s.combatLog.push(`${m.kind} hits ${target.cls} for ${ed}`)
              }
            }
          })
        }
        // Check combat end
        if (s.monsters.every(m => m.hp <= 0)) {
          s.inCombat = false
          s.monsters.forEach(m => {
            s.coins += m.goldDrop
            if (Math.random() < m.gemChance) { s.gems++; s.combatLog.push('💎 Rare gem dropped!') }
          })
          s.combatLog.push('Victory!')
          const room = s.dungeon[s.py][s.px]
          room.type = 'empty'; room.monster = undefined
          s.monsters = []
        }
        // Party wipe
        if (s.heroes.every(h => !h.alive)) {
          s.gameOver = true; s.winner = null
        }
        // Trim log
        if (s.combatLog.length > 6) s.combatLog = s.combatLog.slice(-6)
      } else {
        // ── Exploration ────────────
        if (moveCd <= 0) {
          if (keys.has('w') || keys.has('arrowup')) { tryMove(s); moveCd = 200; keys.delete('w'); keys.delete('arrowup') }
          else if (keys.has('a') || keys.has('arrowleft')) { s.dir = ((s.dir + 3) % 4) as Dir4; moveCd = 200; keys.delete('a'); keys.delete('arrowleft') }
          else if (keys.has('d') || keys.has('arrowright')) { s.dir = ((s.dir + 1) % 4) as Dir4; moveCd = 200; keys.delete('d'); keys.delete('arrowright') }
          else if (keys.has('s') || keys.has('arrowdown')) { s.dir = ((s.dir + 2) % 4) as Dir4; moveCd = 200; keys.delete('s'); keys.delete('arrowdown') }
        }
        // Gamepad input
        const gp = gamepads[0]
        if (gp && moveCd <= 0) {
          if (gp.up) { tryMove(s); moveCd = 250 }
          else if (gp.left) { s.dir = ((s.dir + 3) % 4) as Dir4; moveCd = 250 }
          else if (gp.right) { s.dir = ((s.dir + 1) % 4) as Dir4; moveCd = 250 }
          else if (gp.down) { s.dir = ((s.dir + 2) % 4) as Dir4; moveCd = 250 }
          // Face buttons for abilities in combat
          if (s.inCombat) {
            if (gp.a) { useAbility(s, 0, 0) }
            if (gp.b) { useAbility(s, 1, 0) }
            if (gp.x) { useAbility(s, 2, 0) }
            if (gp.y) { useAbility(s, 3, 0) }
          }
        }
      }

      // ─── Update scoreboard state ──────
      setScoreboard({ coins: s.coins, gems: s.gems, stars: s.stars, floor: s.floor })
      if (s.gameOver && !gameOver) { setGameOver(true); setWinner(s.winner) }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pauseRef, gamepads, gameOver, tryMove, useAbility])

  // ─── Render loop ───────
  useEffect(() => {
    let raf = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const cvs = canvasRef.current
      if (!cvs) return
      const ctx = cvs.getContext('2d')
      if (!ctx) return
      cvs.width = CW; cvs.height = CH
      const s = stateRef.current

      // Background
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, CW, CH)

      // ── FPP dungeon view (top area, 800x320) ──
      const vpW = CW, vpH = 320
      // Draw corridor / depth effect
      const layers = 5
      for (let i = layers; i >= 0; i--) {
        const t = i / layers
        const shrink = t * 0.4
        const lx = vpW * shrink * 0.5
        const ty = vpH * shrink * 0.5
        const w = vpW * (1 - shrink)
        const h = vpH * (1 - shrink)
        // Wall color gradient (darker further)
        const shade = 40 + Math.round(t * 60)
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 10})`
        ctx.fillRect(lx, ty, w, h)
        // Wall outlines
        ctx.strokeStyle = `rgb(${shade + 30},${shade + 30},${shade + 40})`
        ctx.strokeRect(lx, ty, w, h)
      }
      // Floor
      ctx.fillStyle = '#2c3e50'
      ctx.fillRect(0, vpH * 0.6, vpW, vpH * 0.4)
      // Ceiling
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, vpW, vpH * 0.25)

      // Check what's ahead
      const aheadX = s.px + DX[s.dir]
      const aheadY = s.py + DY[s.dir]
      const aheadRoom = (aheadX >= 0 && aheadX < GRID && aheadY >= 0 && aheadY < GRID) ? s.dungeon[aheadY][aheadX] : null

      if (aheadRoom) {
        // Draw door/exit indicator
        if (aheadRoom.type === 'stairs') {
          ctx.fillStyle = '#e67e22'
          ctx.fillRect(vpW * 0.35, vpH * 0.25, vpW * 0.3, vpH * 0.45)
          ctx.fillStyle = '#fff'
          ctx.font = '16px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('⬇ STAIRS', vpW * 0.5, vpH * 0.5)
        } else if (aheadRoom.type === 'shop') {
          ctx.fillStyle = '#9b59b6'
          ctx.fillRect(vpW * 0.3, vpH * 0.2, vpW * 0.4, vpH * 0.5)
          ctx.fillStyle = '#fff'
          ctx.font = '16px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('🛍 SHOP', vpW * 0.5, vpH * 0.48)
        }
      }

      // Draw monsters if in combat
      if (s.inCombat && s.monsters.length > 0) {
        const mCount = s.monsters.length
        s.monsters.forEach((m, mi) => {
          const mx = vpW * (0.3 + (mi / Math.max(1, mCount)) * 0.4)
          const my = vpH * 0.25
          const mw = 80, mh = 100
          ctx.globalAlpha = m.alpha
          ctx.fillStyle = m.color
          if (m.shape === 'rect') {
            ctx.fillRect(mx - mw / 2, my, mw, mh)
          } else if (m.shape === 'circle') {
            ctx.beginPath()
            ctx.arc(mx, my + mh / 2, mw / 2, 0, Math.PI * 2)
            ctx.fill()
          } else if (m.shape === 'tri') {
            ctx.beginPath()
            ctx.moveTo(mx, my)
            ctx.lineTo(mx - mw / 2, my + mh)
            ctx.lineTo(mx + mw / 2, my + mh)
            ctx.closePath()
            ctx.fill()
          }
          ctx.globalAlpha = 1
          // Monster HP bar
          ctx.fillStyle = '#333'
          ctx.fillRect(mx - mw / 2, my - 15, mw, 10)
          ctx.fillStyle = '#e74c3c'
          ctx.fillRect(mx - mw / 2, my - 15, mw * Math.max(0, m.hp / m.maxHp), 10)
          // Name
          ctx.fillStyle = '#fff'
          ctx.font = '11px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(`${m.kind} ${m.hp}/${m.maxHp}`, mx, my - 20)
        })
      }

      // ── Minimap (top-right, 120x120) ──
      const mmSize = 120, mmX = CW - mmSize - 10, mmY = 10, cs = mmSize / GRID
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(mmX, mmY, mmSize, mmSize)
      for (let gy = 0; gy < GRID; gy++) {
        for (let gx = 0; gx < GRID; gx++) {
          const room = s.dungeon[gy][gx]
          if (!room.explored) { ctx.fillStyle = '#222'; ctx.fillRect(mmX + gx * cs, mmY + gy * cs, cs - 1, cs - 1); continue }
          switch (room.type) {
            case 'empty': ctx.fillStyle = '#555'; break
            case 'monster': ctx.fillStyle = '#e74c3c'; break
            case 'treasure': ctx.fillStyle = '#f1c40f'; break
            case 'trap': ctx.fillStyle = '#e67e22'; break
            case 'stairs': ctx.fillStyle = '#3498db'; break
            case 'shop': ctx.fillStyle = '#9b59b6'; break
          }
          ctx.fillRect(mmX + gx * cs, mmY + gy * cs, cs - 1, cs - 1)
        }
      }
      // Player position on minimap
      ctx.fillStyle = '#fff'
      ctx.fillRect(mmX + s.px * cs + 2, mmY + s.py * cs + 2, cs - 4, cs - 4)
      // Direction arrow
      ctx.fillStyle = '#2ecc71'
      const ax = mmX + s.px * cs + cs / 2 + DX[s.dir] * cs * 0.4
      const ay = mmY + s.py * cs + cs / 2 + DY[s.dir] * cs * 0.4
      ctx.beginPath(); ctx.arc(ax, ay, 2, 0, Math.PI * 2); ctx.fill()

      // ── HUD: floor & gold ──
      ctx.fillStyle = '#fff'
      ctx.font = '14px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`Floor ${s.floor + 1}  🪙${s.coins}  💎${s.gems}  ⭐${s.stars}`, 10, 20)
      ctx.fillText(`Facing: ${['North', 'East', 'South', 'West'][s.dir]}  [${s.px},${s.py}]`, 10, 38)
      if (s.inCombat) {
        ctx.fillStyle = '#e74c3c'
        ctx.font = 'bold 16px monospace'
        ctx.fillText(s.turnBased ? '⚔ TURN-BASED COMBAT' : '⚔ REAL-TIME COMBAT', 10, 58)
      }

      // ── Party stats (bottom, 800x180) ──
      const partyY = vpH + 5
      const heroW = (CW - 20) / 4
      s.heroes.forEach((hero, i) => {
        const hx = 10 + i * heroW
        // Portrait background
        ctx.fillStyle = hero.alive ? CLASS_COLOR[hero.cls] : '#444'
        ctx.fillRect(hx, partyY, heroW - 8, 50)
        // Class letter
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 24px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(CLASS_LETTER[hero.cls], hx + (heroW - 8) / 2, partyY + 34)
        // Name
        ctx.font = '10px monospace'
        ctx.fillText(hero.cls, hx + (heroW - 8) / 2, partyY + 48)
        // HP bar
        const barY = partyY + 55
        ctx.fillStyle = '#333'; ctx.fillRect(hx, barY, heroW - 8, 8)
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(hx, barY, (heroW - 8) * (hero.hp / hero.maxHp), 8)
        ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'left'
        ctx.fillText(`HP ${hero.hp}/${hero.maxHp}`, hx + 2, barY + 7)
        // MP bar
        const mpY = barY + 11
        ctx.fillStyle = '#333'; ctx.fillRect(hx, mpY, heroW - 8, 8)
        ctx.fillStyle = '#3498db'; ctx.fillRect(hx, mpY, (heroW - 8) * (hero.mp / hero.maxMp), 8)
        ctx.fillText(`MP ${hero.mp}/${hero.maxMp}`, hx + 2, mpY + 7)
        // Ability cooldowns
        hero.abilities.forEach((ab, ai) => {
          const abY = mpY + 12 + ai * 12
          ctx.fillStyle = ab.timer > 0 ? '#666' : '#2ecc71'
          ctx.font = '9px monospace'
          ctx.fillText(`${ai + 1}: ${ab.name} ${ab.timer > 0 ? `(${(ab.timer / 1000).toFixed(1)}s)` : '✓'}`, hx + 2, abY + 9)
        })
        if (!hero.alive) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)'
          ctx.fillRect(hx, partyY, heroW - 8, 100)
          ctx.fillStyle = '#e74c3c'
          ctx.font = 'bold 14px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('DEAD', hx + (heroW - 8) / 2, partyY + 55)
        }
      })

      // ── Combat log ──
      if (s.combatLog.length > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(10, vpH - 90, 350, 85)
        ctx.fillStyle = '#ddd'
        ctx.font = '10px monospace'
        ctx.textAlign = 'left'
        s.combatLog.slice(-6).forEach((line, i) => {
          ctx.fillText(line.slice(0, 50), 15, vpH - 78 + i * 13)
        })
      }

      // ── Instructions overlay ──
      if (s.showInstructions) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'
        ctx.fillRect(50, 40, CW - 100, CH - 80)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 16px monospace'
        ctx.textAlign = 'left'
        const lines = [
          '🎮 CONTROLS:',
          'W/↑ — Move forward    A/← — Turn left',
          'S/↓ — Turn around     D/→ — Turn right',
          '1-4 — Use ability     Space — Attack',
          'I — Toggle instructions',
          '',
          '📋 HOW TO PLAY:',
          'Explore the dungeon in first-person view.',
          'Fight monsters, find treasure, descend',
          'deeper! Use abilities wisely in combat.',
          '',
          `Mode: ${s.turnBased ? 'Turn-Based' : 'Real-Time'} Combat`,
          `Floor: ${s.floor + 1}   Gold: ${s.coins}`,
        ]
        lines.forEach((l, i) => ctx.fillText(l, 75, 75 + i * 22))
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Restart ─────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false); setWinner(null)
    setScoreboard({ coins: 0, gems: 0, stars: 0, floor: 0 })
  }, [players, config])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  return (
    <div className={styles.container}>
      <div className={styles.scoreboard}>
        <div className={styles.scoreItem}>
          <span>🪙 {scoreboard.coins}</span>
          <span style={{ marginLeft: 12 }}>💎 {scoreboard.gems}</span>
          <span style={{ marginLeft: 12 }}>⭐ {scoreboard.stars}</span>
          <span style={{ marginLeft: 12 }}>Floor {scoreboard.floor + 1}</span>
        </div>
      </div>
      <canvas ref={canvasRef} width={CW} height={CH} className={styles.canvas}  role="img" aria-label="Might And Magic canvas"/>
      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}
      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner ? (
            <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>
          ) : (
            <p className={styles.winnerText}>{t('miniGames.defeated', 'The dungeon has claimed your party...')}</p>
          )}
          <p>🪙 {scoreboard.coins} coins · 💎 {scoreboard.gems} gems · ⭐ {scoreboard.stars} stars · Floor {scoreboard.floor + 1}</p>
          <div className={styles.overlayActions}>
            <button className={styles.restartBtn} onClick={handleRestart}>{t('miniGames.playAgain', 'Play Again')}</button>
            <button className={styles.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu', 'Back to Menu')}</button>
          </div>
          <p className={styles.overlayHint}>{t('miniGames.pressRestart', 'Press Space or Enter to restart')}</p>
        </div>
      )}
    </div>
  )
}

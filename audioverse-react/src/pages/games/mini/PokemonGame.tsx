/**
 * PokemonGame — creature collector & real-time battler for 1-4 players.
 *
 * Controls:
 *   WASD / Arrows / Gamepad D-pad: Move trainer in overworld
 *   1 or Gamepad A: Attack move 1
 *   2 or Gamepad X: Attack move 2
 *   E or Gamepad Y: Switch creature
 *   Q or Gamepad B: Throw catch ball (wild only)
 *   Hold back direction 1s: Run from battle
 *
 * Modes:
 *   adventure — explore overworld, catch creatures, beat 4 gyms + champion
 *   vs-battle — trainers battle each other directly
 *   coop-quest — explore together, double battles vs gyms
 *
 * 3 Currencies: coins (wins), gems (rare drops), stars (badges/champion)
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
const CW = 800
const CH = 600
const TILE = 50
const COLS = 16
const ROWS = 12
const TRAINER_R = 12
const CREATURE_R = 30
const ATTACK_CD = 1500
const STRONG_CD = 2500
const CATCH_CD = 2000
const TYPE_ADV = 1.5
const TYPE_DIS = 0.67
const ENCOUNTER_CHANCE = 0.30
const MAX_PARTY = 6
const MAX_LEVEL = 10
const RUN_HOLD_MS = 1000

// ─── Terrain ─────────────────────────────────────────────────
const T_GRASS = 0
const T_TALL  = 1
const T_WATER = 2
const T_PATH  = 3
const T_TOWN  = 4
const T_GYM   = 5

const TERRAIN_COLORS: Record<number, string> = {
  [T_GRASS]: '#3a7d44',
  [T_TALL]:  '#5dbb63',
  [T_WATER]: '#2980b9',
  [T_PATH]:  '#d4b896',
  [T_TOWN]:  '#bdc3c7',
  [T_GYM]:   '#c0392b',
}

// ─── Creature types ──────────────────────────────────────────
type CType = 'fire' | 'water' | 'plant' | 'electric' | 'rock' | 'psychic' | 'dark' | 'normal'

interface MoveTemplate { name: string; baseDmg: number; cooldown: number }
interface CreatureTemplate { type: CType; color: string; shape: 'triangle' | 'circle' | 'diamond' | 'star' | 'square' | 'rect'; moves: [MoveTemplate, MoveTemplate]; baseHP: [number, number] }

const CREATURE_TEMPLATES: CreatureTemplate[] = [
  { type: 'fire',     color: '#e74c3c', shape: 'triangle', moves: [{ name: 'Ember', baseDmg: 15, cooldown: ATTACK_CD }, { name: 'Blaze', baseDmg: 25, cooldown: STRONG_CD }], baseHP: [45, 55] },
  { type: 'water',    color: '#3498db', shape: 'circle',   moves: [{ name: 'Splash', baseDmg: 15, cooldown: ATTACK_CD }, { name: 'Torrent', baseDmg: 25, cooldown: STRONG_CD }], baseHP: [45, 60] },
  { type: 'plant',    color: '#27ae60', shape: 'diamond',  moves: [{ name: 'Vine', baseDmg: 15, cooldown: ATTACK_CD }, { name: 'Bloom', baseDmg: 25, cooldown: STRONG_CD }], baseHP: [40, 55] },
  { type: 'electric', color: '#f1c40f', shape: 'star',     moves: [{ name: 'Shock', baseDmg: 15, cooldown: ATTACK_CD }, { name: 'Thunder', baseDmg: 25, cooldown: STRONG_CD }], baseHP: [40, 50] },
  { type: 'rock',     color: '#95a5a6', shape: 'square',   moves: [{ name: 'Smash', baseDmg: 15, cooldown: ATTACK_CD }, { name: 'Avalanche', baseDmg: 25, cooldown: STRONG_CD }], baseHP: [50, 60] },
  { type: 'psychic',  color: '#9b59b6', shape: 'circle',   moves: [{ name: 'Mind', baseDmg: 15, cooldown: ATTACK_CD }, { name: 'Psywave', baseDmg: 25, cooldown: STRONG_CD }], baseHP: [40, 52] },
  { type: 'dark',     color: '#2c3e50', shape: 'rect',     moves: [{ name: 'Bite', baseDmg: 15, cooldown: ATTACK_CD }, { name: 'Shadow', baseDmg: 25, cooldown: STRONG_CD }], baseHP: [42, 55] },
  { type: 'normal',   color: '#ecf0f1', shape: 'circle',   moves: [{ name: 'Tackle', baseDmg: 12, cooldown: ATTACK_CD }, { name: 'Slam', baseDmg: 20, cooldown: STRONG_CD }], baseHP: [45, 58] },
]

const TYPE_CHART: Record<CType, CType[]> = {
  fire:     ['plant'],
  water:    ['fire'],
  plant:    ['water'],
  electric: ['water'],
  rock:     ['fire'],
  psychic:  ['normal'],
  dark:     ['psychic'],
  normal:   [],
}
const TYPE_WEAK: Record<CType, CType[]> = {
  fire:     ['water'],
  water:    ['plant'],
  plant:    ['fire'],
  electric: [],
  rock:     [],
  psychic:  ['dark'],
  dark:     [],
  normal:   [],
}

// ─── Types ───────────────────────────────────────────────────
interface CreatureMove { name: string; baseDmg: number; cooldown: number }

interface Creature {
  id: number
  type: CType
  color: string
  shape: string
  hp: number
  maxHP: number
  level: number
  moves: [CreatureMove, CreatureMove]
  template: CreatureTemplate
}

interface Trainer {
  x: number
  y: number
  playerIndex: number
  color: string
  name: string
  party: Creature[]
  activeIdx: number
  coins: number
  gems: number
  stars: number
  badges: boolean[]
  championDefeated: boolean
  input: PlayerSlot['input']
}

interface BattleState {
  trainerIdx: number
  enemyCreature: Creature
  enemyParty: Creature[]
  enemyActiveIdx: number
  isWild: boolean
  isGym: boolean
  gymIndex: number
  isChampion: boolean
  playerCooldown: number
  enemyCooldown: number
  catchCooldown: number
  playerLunge: number
  enemyLunge: number
  runHold: number
  message: string
  messageTimer: number
  battleOver: boolean
  result: 'win' | 'lose' | 'catch' | 'run' | ''
}

type Phase = 'overworld' | 'battle'

interface GameState {
  trainers: Trainer[]
  phase: Phase
  battles: (BattleState | null)[]
  map: number[][]
  nextCreatureId: number
  gameOver: boolean
  winner: string | null
  gameMode: string
  wildFrequency: number
  gymPositions: { x: number; y: number }[]
  townPositions: { x: number; y: number }[]
}

// ─── Helpers ─────────────────────────────────────────────────
let _creatureId = 0

function rng(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function createCreature(level: number): Creature {
  const tmpl = CREATURE_TEMPLATES[rng(0, CREATURE_TEMPLATES.length - 1)]
  const maxHP = rng(tmpl.baseHP[0], tmpl.baseHP[1]) + (level - 1) * 5
  return {
    id: ++_creatureId,
    type: tmpl.type,
    color: tmpl.color,
    shape: tmpl.shape,
    hp: maxHP,
    maxHP,
    level,
    moves: [
      { ...tmpl.moves[0], baseDmg: tmpl.moves[0].baseDmg + (level - 1) * 2 },
      { ...tmpl.moves[1], baseDmg: tmpl.moves[1].baseDmg + (level - 1) * 2 },
    ],
    template: tmpl,
  }
}

function calcDamage(move: CreatureMove, attacker: Creature, defender: Creature): number {
  let dmg = move.baseDmg
  if (TYPE_CHART[attacker.type]?.includes(defender.type)) dmg = Math.round(dmg * TYPE_ADV)
  else if (TYPE_WEAK[attacker.type]?.includes(defender.type)) dmg = Math.round(dmg * TYPE_DIS)
  return dmg
}

function levelUp(c: Creature) {
  if (c.level >= MAX_LEVEL) return
  c.level++
  c.maxHP += 5
  c.hp = c.maxHP
  c.moves[0].baseDmg += 2
  c.moves[1].baseDmg += 2
}

function generateMap(): { map: number[][], gymPositions: { x: number; y: number }[], townPositions: { x: number; y: number }[] } {
  const map: number[][] = []
  for (let y = 0; y < ROWS; y++) {
    const row: number[] = []
    for (let x = 0; x < COLS; x++) {
      row.push(T_GRASS)
    }
    map.push(row)
  }

  // Paths: horizontal and vertical cross
  for (let x = 0; x < COLS; x++) { map[6][x] = T_PATH; map[3][x] = T_PATH }
  for (let y = 0; y < ROWS; y++) { map[y][4] = T_PATH; map[y][11] = T_PATH }

  // Water strip
  for (let x = 6; x <= 9; x++) { map[0][x] = T_WATER; map[1][x] = T_WATER }

  // Tall grass patches
  const tallPatches = [[1, 8], [2, 8], [1, 9], [7, 1], [8, 1], [7, 2], [8, 2], [9, 7], [10, 7], [9, 8], [10, 8],
    [2, 13], [3, 13], [2, 14], [3, 14], [7, 13], [8, 13], [7, 14], [8, 14], [10, 3], [10, 4], [11, 3], [11, 4],
    [5, 5], [5, 6], [5, 7], [6, 5], [6, 7]]
  for (const [r, c] of tallPatches) { if (r < ROWS && c < COLS) map[r][c] = T_TALL }

  // Towns
  const townPositions = [{ x: 1, y: 1 }, { x: 14, y: 1 }, { x: 1, y: 10 }, { x: 14, y: 10 }]
  for (const t of townPositions) { map[t.y][t.x] = T_TOWN; if (t.x + 1 < COLS) map[t.y][t.x + 1] = T_TOWN }

  // Gyms
  const gymPositions = [{ x: 7, y: 3 }, { x: 13, y: 6 }, { x: 2, y: 9 }, { x: 12, y: 9 }]
  for (const g of gymPositions) { map[g.y][g.x] = T_GYM }

  return { map, gymPositions, townPositions }
}

function initState(players: PlayerSlot[], config: GameConfig): GameState {
  _creatureId = 0
  const { map, gymPositions, townPositions } = generateMap()
  const startingCount = Number(config.startingCreatures) || 1
  const wildFreq = config.wildFrequency === 'low' ? 0.15 : config.wildFrequency === 'high' ? 0.45 : ENCOUNTER_CHANCE
  const startPositions = [{ x: 2, y: 2 }, { x: 13, y: 2 }, { x: 2, y: 9 }, { x: 13, y: 9 }]

  const trainers: Trainer[] = players.map((p, i) => {
    const pos = startPositions[i % startPositions.length]
    const party: Creature[] = []
    for (let c = 0; c < startingCount; c++) party.push(createCreature(1))
    return {
      x: pos.x, y: pos.y,
      playerIndex: p.index,
      color: p.color || PLAYER_COLORS[p.index] || '#fff',
      name: p.name,
      party,
      activeIdx: 0,
      coins: 0, gems: 0, stars: 0,
      badges: [false, false, false, false],
      championDefeated: false,
      input: p.input,
    }
  })

  return {
    trainers,
    phase: config.gameMode === 'vs-battle' ? 'battle' as Phase : 'overworld' as Phase,
    battles: trainers.map(() => null),
    map,
    nextCreatureId: _creatureId,
    gameOver: false,
    winner: null,
    gameMode: config.gameMode || 'adventure',
    wildFrequency: wildFreq,
    gymPositions,
    townPositions,
  }
}

function startWildBattle(st: GameState, tIdx: number) {
  const trainer = st.trainers[tIdx]
  const avgLevel = Math.max(1, Math.round(trainer.party.reduce((s, c) => s + c.level, 0) / trainer.party.length))
  const wildLevel = Math.max(1, avgLevel + rng(-1, 1))
  const wild = createCreature(wildLevel)
  st.nextCreatureId = _creatureId
  st.battles[tIdx] = {
    trainerIdx: tIdx, enemyCreature: wild, enemyParty: [wild], enemyActiveIdx: 0,
    isWild: true, isGym: false, gymIndex: -1, isChampion: false,
    playerCooldown: 0, enemyCooldown: 1000, catchCooldown: 0,
    playerLunge: 0, enemyLunge: 0, runHold: 0,
    message: `Wild ${wild.type} appeared!`, messageTimer: 1500,
    battleOver: false, result: '',
  }
}

function startGymBattle(st: GameState, tIdx: number, gymIdx: number) {
  const gymLevel = (gymIdx + 1) * 2 + 1
  const party: Creature[] = []
  for (let i = 0; i < gymIdx + 2; i++) party.push(createCreature(gymLevel))
  st.nextCreatureId = _creatureId
  st.battles[tIdx] = {
    trainerIdx: tIdx, enemyCreature: party[0], enemyParty: party, enemyActiveIdx: 0,
    isWild: false, isGym: true, gymIndex: gymIdx, isChampion: false,
    playerCooldown: 0, enemyCooldown: 1200, catchCooldown: 0,
    playerLunge: 0, enemyLunge: 0, runHold: 0,
    message: `Gym Leader ${gymIdx + 1} wants to battle!`, messageTimer: 1500,
    battleOver: false, result: '',
  }
}

function startChampionBattle(st: GameState, tIdx: number) {
  const party: Creature[] = []
  for (let i = 0; i < 4; i++) party.push(createCreature(rng(8, 10)))
  st.nextCreatureId = _creatureId
  st.battles[tIdx] = {
    trainerIdx: tIdx, enemyCreature: party[0], enemyParty: party, enemyActiveIdx: 0,
    isWild: false, isGym: false, gymIndex: -1, isChampion: true,
    playerCooldown: 0, enemyCooldown: 1200, catchCooldown: 0,
    playerLunge: 0, enemyLunge: 0, runHold: 0,
    message: 'The Champion challenges you!', messageTimer: 1500,
    battleOver: false, result: '',
  }
}

function startVsBattle(st: GameState, p1: number, p2: number) {
  const t2 = st.trainers[p2]
  const enemyParty = t2.party.map(c => ({ ...c, hp: c.maxHP }))
  st.battles[p1] = {
    trainerIdx: p1, enemyCreature: enemyParty[0], enemyParty, enemyActiveIdx: 0,
    isWild: false, isGym: false, gymIndex: -1, isChampion: false,
    playerCooldown: 0, enemyCooldown: 1200, catchCooldown: 0,
    playerLunge: 0, enemyLunge: 0, runHold: 0,
    message: `${t2.name} wants to battle!`, messageTimer: 1500,
    battleOver: false, result: '',
  }
}

// ─── Draw helpers ────────────────────────────────────────────
function drawCreatureShape(ctx: CanvasRenderingContext2D, shape: string, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  switch (shape) {
    case 'triangle':
      ctx.moveTo(cx, cy - r)
      ctx.lineTo(cx - r, cy + r)
      ctx.lineTo(cx + r, cy + r)
      ctx.closePath()
      break
    case 'diamond':
      ctx.moveTo(cx, cy - r)
      ctx.lineTo(cx + r, cy)
      ctx.lineTo(cx, cy + r)
      ctx.lineTo(cx - r, cy)
      ctx.closePath()
      break
    case 'square':
      ctx.rect(cx - r, cy - r, r * 2, r * 2)
      break
    case 'rect':
      ctx.rect(cx - r * 1.2, cy - r * 0.7, r * 2.4, r * 1.4)
      break
    case 'star': {
      const spikes = 5
      for (let i = 0; i < spikes * 2; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45
        const angle = (Math.PI / 2) * -1 + (Math.PI / spikes) * i
        const px = cx + Math.cos(angle) * rad
        const py = cy + Math.sin(angle) * rad
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.closePath()
      break
    }
    default: // circle
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      break
  }
  ctx.fill()
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  ctx.stroke()
}

// ─── Keyboard mappings ───────────────────────────────────────
interface InputState {
  up: boolean; down: boolean; left: boolean; right: boolean
  atk1: boolean; atk2: boolean; switchC: boolean; catchB: boolean
}

const KB_MAPS: { group: number; keys: Record<string, keyof InputState> }[] = [
  { group: 0, keys: { w: 'up', s: 'down', a: 'left', d: 'right', '1': 'atk1', '2': 'atk2', e: 'switchC', q: 'catchB' } },
  { group: 1, keys: { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', '/': 'atk1', '*': 'atk2', Shift: 'switchC', Control: 'catchB' } },
]

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function PokemonGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config || {}))
  const inputsRef = useRef<InputState[]>(players.map(() => ({ up: false, down: false, left: false, right: false, atk1: false, atk2: false, switchC: false, catchB: false })))
  const prevInputsRef = useRef<InputState[]>(players.map(() => ({ up: false, down: false, left: false, right: false, atk1: false, atk2: false, switchC: false, catchB: false })))
  const [hud, setHud] = useState<{ trainers: Trainer[]; battles: (BattleState | null)[] }>({ trainers: [], battles: [] })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ─── Keyboard input ───
  useEffect(() => {
    function onKey(e: KeyboardEvent, pressed: boolean) {
      const st = stateRef.current
      for (const trainer of st.trainers) {
        if (trainer.input.type !== 'keyboard') continue
        const mapEntry = KB_MAPS.find(m => m.group === (trainer.input as { type: 'keyboard'; group: number }).group)
        if (!mapEntry) continue
        const action = mapEntry.keys[e.key]
        if (action) {
          inputsRef.current[trainer.playerIndex] = { ...inputsRef.current[trainer.playerIndex], [action]: pressed }
        }
      }
    }
    const down = (e: KeyboardEvent) => onKey(e, true)
    const up = (e: KeyboardEvent) => onKey(e, false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ─── Gamepad polling ───
  useEffect(() => {
    let raf = 0
    function poll() {
      const st = stateRef.current
      const currentPads = padsRef.current
      for (const trainer of st.trainers) {
        if (trainer.input.type !== 'gamepad') continue
        const inp = trainer.input as { type: 'gamepad'; padIndex: number }
        const gp = currentPads.find(p => p.index === inp.padIndex)
        if (!gp) continue
        inputsRef.current[trainer.playerIndex] = {
          up: gp.up, down: gp.down, left: gp.left, right: gp.right,
          atk1: gp.a, atk2: gp.x, switchC: gp.y, catchB: gp.b,
        }
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Main game loop ───
  useEffect(() => {
    let lastTime = performance.now()
    let raf = 0

    function update(now: number) {
      if (pauseRef.current) { raf = requestAnimationFrame(update); return }
      const dt = Math.min(now - lastTime, 50)
      lastTime = now
      const st = stateRef.current
      if (st.gameOver) { raf = requestAnimationFrame(update); return }

      // VS-battle auto-start
      if (st.gameMode === 'vs-battle' && st.phase === 'battle' && !st.battles.some(b => b !== null)) {
        if (st.trainers.length >= 2) {
          startVsBattle(st, 0, 1)
          if (st.trainers.length >= 4) startVsBattle(st, 2, 3)
        }
      }

      for (let tIdx = 0; tIdx < st.trainers.length; tIdx++) {
        const trainer = st.trainers[tIdx]
        const inp = inputsRef.current[tIdx]
        const prevInp = prevInputsRef.current[tIdx]
        const battle = st.battles[tIdx]

        if (battle && !battle.battleOver) {
          // ── Battle update ──
          if (battle.messageTimer > 0) { battle.messageTimer -= dt; continue }

          const playerCreature = trainer.party[trainer.activeIdx]
          if (!playerCreature || playerCreature.hp <= 0) {
            // Find next alive
            const nextAlive = trainer.party.findIndex(c => c.hp > 0)
            if (nextAlive === -1) {
              battle.battleOver = true
              battle.result = 'lose'
              battle.message = 'All your creatures fainted!'
              battle.messageTimer = 2000
              continue
            }
            trainer.activeIdx = nextAlive
            continue
          }

          // Cooldowns
          if (battle.playerCooldown > 0) battle.playerCooldown -= dt
          if (battle.enemyCooldown > 0) battle.enemyCooldown -= dt
          if (battle.catchCooldown > 0) battle.catchCooldown -= dt
          if (battle.playerLunge > 0) battle.playerLunge -= dt
          if (battle.enemyLunge > 0) battle.enemyLunge -= dt

          // Player attack 1
          if (inp.atk1 && !prevInp.atk1 && battle.playerCooldown <= 0) {
            const move = playerCreature.moves[0]
            const dmg = calcDamage(move, playerCreature, battle.enemyCreature)
            battle.enemyCreature.hp = Math.max(0, battle.enemyCreature.hp - dmg)
            battle.playerCooldown = move.cooldown
            battle.playerLunge = 200
            battle.message = `${move.name}: ${dmg} dmg!`
            battle.messageTimer = 600
          }

          // Player attack 2
          if (inp.atk2 && !prevInp.atk2 && battle.playerCooldown <= 0) {
            const move = playerCreature.moves[1]
            const dmg = calcDamage(move, playerCreature, battle.enemyCreature)
            battle.enemyCreature.hp = Math.max(0, battle.enemyCreature.hp - dmg)
            battle.playerCooldown = move.cooldown
            battle.playerLunge = 300
            battle.message = `${move.name}: ${dmg} dmg!`
            battle.messageTimer = 600
          }

          // Switch creature
          if (inp.switchC && !prevInp.switchC) {
            const aliveIndices = trainer.party.map((c, i) => c.hp > 0 ? i : -1).filter(i => i !== -1 && i !== trainer.activeIdx)
            if (aliveIndices.length > 0) {
              trainer.activeIdx = aliveIndices[0]
              battle.message = `Go, ${trainer.party[trainer.activeIdx].type}!`
              battle.messageTimer = 500
            }
          }

          // Catch (wild only)
          if (inp.catchB && !prevInp.catchB && battle.isWild && battle.catchCooldown <= 0 && trainer.party.length < MAX_PARTY) {
            const chance = (1 - battle.enemyCreature.hp / battle.enemyCreature.maxHP) * 0.5
            battle.catchCooldown = CATCH_CD
            if (Math.random() < chance) {
              trainer.party.push({ ...battle.enemyCreature })
              battle.battleOver = true
              battle.result = 'catch'
              battle.message = `Caught ${battle.enemyCreature.type}!`
              battle.messageTimer = 1500
              trainer.coins += 5
              if (Math.random() < 0.1) trainer.gems += 1
            } else {
              battle.message = 'Catch failed!'
              battle.messageTimer = 600
            }
          }

          // Run (hold back)
          if (inp.left && battle.isWild) {
            battle.runHold += dt
            if (battle.runHold >= RUN_HOLD_MS) {
              battle.battleOver = true
              battle.result = 'run'
              battle.message = 'Got away safely!'
              battle.messageTimer = 800
            }
          } else {
            battle.runHold = 0
          }

          // Enemy AI attack
          if (battle.enemyCooldown <= 0 && battle.enemyCreature.hp > 0 && !battle.battleOver) {
            const moveIdx = Math.random() < 0.6 ? 0 : 1
            const move = battle.enemyCreature.moves[moveIdx]
            const dmg = calcDamage(move, battle.enemyCreature, playerCreature)
            playerCreature.hp = Math.max(0, playerCreature.hp - dmg)
            battle.enemyCooldown = move.cooldown + rng(-200, 200)
            battle.enemyLunge = 200
            battle.message = `Enemy ${move.name}: ${dmg} dmg!`
            battle.messageTimer = 500
          }

          // Check enemy fainted
          if (battle.enemyCreature.hp <= 0 && !battle.battleOver) {
            levelUp(playerCreature)
            trainer.coins += 10
            if (Math.random() < 0.15) trainer.gems += 1

            // Check if more enemies in party
            const nextEnemy = battle.enemyParty.findIndex((c, i) => i > battle.enemyActiveIdx && c.hp > 0)
            if (nextEnemy !== -1) {
              battle.enemyActiveIdx = nextEnemy
              battle.enemyCreature = battle.enemyParty[nextEnemy]
              battle.message = `Opponent sends ${battle.enemyCreature.type}!`
              battle.messageTimer = 800
            } else {
              battle.battleOver = true
              battle.result = 'win'
              trainer.coins += 20
              if (battle.isGym) {
                trainer.badges[battle.gymIndex] = true
                trainer.stars += 1
                battle.message = `Gym ${battle.gymIndex + 1} defeated! Badge earned!`
                // Check if all 4 badges => champion
                if (trainer.badges.every(b => b) && !trainer.championDefeated) {
                  battle.messageTimer = 1500
                }
              } else if (battle.isChampion) {
                trainer.championDefeated = true
                trainer.stars += 3
                trainer.gems += 5
                battle.message = 'You defeated the Champion!'
                st.gameOver = true
                st.winner = trainer.name
              } else {
                battle.message = 'Battle won!'
              }
              battle.messageTimer = 1500
            }
          }

          // Check player all fainted
          if (playerCreature.hp <= 0 && trainer.party.every(c => c.hp <= 0) && !battle.battleOver) {
            battle.battleOver = true
            battle.result = 'lose'
            battle.message = 'All your creatures fainted...'
            battle.messageTimer = 2000
          }

        } else if (battle && battle.battleOver) {
          // End battle after message
          if (battle.messageTimer > 0) { battle.messageTimer -= dt; continue }
          if (battle.result === 'lose') {
            // Heal and return to town
            for (const c of trainer.party) c.hp = c.maxHP
            trainer.x = 1; trainer.y = 1
          }
          st.battles[tIdx] = null
          st.phase = 'overworld'

        } else if (st.phase === 'overworld') {
          // ── Overworld movement ──
          let dx = 0, dy = 0
          if (inp.up && !prevInp.up) dy = -1
          else if (inp.down && !prevInp.down) dy = 1
          else if (inp.left && !prevInp.left) dx = -1
          else if (inp.right && !prevInp.right) dx = 1

          if (dx !== 0 || dy !== 0) {
            const nx = trainer.x + dx
            const ny = trainer.y + dy
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
              const tile = st.map[ny][nx]
              if (tile !== T_WATER) {
                trainer.x = nx
                trainer.y = ny

                // Town => heal
                if (tile === T_TOWN) {
                  for (const c of trainer.party) c.hp = c.maxHP
                }

                // Gym
                if (tile === T_GYM) {
                  const gymIdx = st.gymPositions.findIndex(g => g.x === nx && g.y === ny)
                  if (gymIdx !== -1 && !trainer.badges[gymIdx]) {
                    startGymBattle(st, tIdx, gymIdx)
                    st.phase = 'battle'
                  } else if (trainer.badges.every(b => b) && !trainer.championDefeated) {
                    startChampionBattle(st, tIdx)
                    st.phase = 'battle'
                  }
                }

                // Tall grass encounter
                if (tile === T_TALL) {
                  if (Math.random() < st.wildFrequency) {
                    startWildBattle(st, tIdx)
                    st.phase = 'battle'
                  }
                }
              }
            }
          }
        }

        // Save prev inputs
        prevInputsRef.current[tIdx] = { ...inp }
      }

      // Update HUD
      setHud({ trainers: st.trainers.map(t => ({ ...t })), battles: [...st.battles] })
      if (st.gameOver) {
        setGameOver(true)
        setWinner(st.winner)
      }

      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Render ───
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      canvas.width = CW
      canvas.height = CH

      const activeBattle = st.battles.find(b => b !== null) as BattleState | null

      if (activeBattle && !activeBattle.battleOver) {
        // ── Draw battle ──
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, CW, CH)

        // Battle arena background
        ctx.fillStyle = '#16213e'
        ctx.fillRect(50, 100, CW - 100, CH - 200)
        ctx.strokeStyle = '#e94560'
        ctx.lineWidth = 2
        ctx.strokeRect(50, 100, CW - 100, CH - 200)

        const trainer = st.trainers[activeBattle.trainerIdx]
        const playerCreature = trainer.party[trainer.activeIdx]
        const enemy = activeBattle.enemyCreature

        if (playerCreature && playerCreature.hp > 0) {
          // Player creature (left side)
          const px = 200 + (activeBattle.playerLunge > 0 ? 30 : 0)
          const py = 350
          drawCreatureShape(ctx, playerCreature.shape, px, py, CREATURE_R, playerCreature.color)
          // Level
          ctx.fillStyle = '#fff'
          ctx.font = '12px monospace'
          ctx.fillText(`Lv${playerCreature.level}`, px - 15, py + CREATURE_R + 18)
          // HP bar
          ctx.fillStyle = '#333'
          ctx.fillRect(120, 280, 160, 14)
          const hpRatio = playerCreature.hp / playerCreature.maxHP
          ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c'
          ctx.fillRect(120, 280, 160 * hpRatio, 14)
          ctx.strokeStyle = '#555'
          ctx.strokeRect(120, 280, 160, 14)
          ctx.fillStyle = '#fff'
          ctx.font = '11px monospace'
          ctx.fillText(`${playerCreature.hp}/${playerCreature.maxHP}`, 130, 292)
          ctx.fillText(playerCreature.type.toUpperCase(), 120, 275)
        }

        // Enemy creature (right side)
        if (enemy) {
          const ex = 600 - (activeBattle.enemyLunge > 0 ? 30 : 0)
          const ey = 220
          drawCreatureShape(ctx, enemy.shape, ex, ey, CREATURE_R, enemy.color)
          ctx.fillStyle = '#fff'
          ctx.font = '12px monospace'
          ctx.fillText(`Lv${enemy.level}`, ex - 15, ey + CREATURE_R + 18)
          // HP bar
          ctx.fillStyle = '#333'
          ctx.fillRect(520, 150, 160, 14)
          const hpRatio = enemy.hp / enemy.maxHP
          ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c'
          ctx.fillRect(520, 150, 160 * hpRatio, 14)
          ctx.strokeStyle = '#555'
          ctx.strokeRect(520, 150, 160, 14)
          ctx.fillStyle = '#fff'
          ctx.font = '11px monospace'
          ctx.fillText(`${enemy.hp}/${enemy.maxHP}`, 530, 162)
          ctx.fillText(enemy.type.toUpperCase(), 520, 145)
          if (activeBattle.isWild) ctx.fillText('(Wild)', 590, 145)
          if (activeBattle.isGym) ctx.fillText(`(Gym ${activeBattle.gymIndex + 1})`, 590, 145)
          if (activeBattle.isChampion) ctx.fillText('(Champion)', 580, 145)
        }

        // Message
        if (activeBattle.message) {
          ctx.fillStyle = 'rgba(0,0,0,0.7)'
          ctx.fillRect(100, CH - 100, CW - 200, 50)
          ctx.fillStyle = '#fff'
          ctx.font = '16px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(activeBattle.message, CW / 2, CH - 70)
          ctx.textAlign = 'left'
        }

        // Move hints
        ctx.fillStyle = '#aaa'
        ctx.font = '12px monospace'
        if (playerCreature && playerCreature.hp > 0) {
          const cd1 = activeBattle.playerCooldown > 0 ? ` (${Math.ceil(activeBattle.playerCooldown / 1000)}s)` : ''
          ctx.fillText(`[1] ${playerCreature.moves[0].name}${cd1}`, 60, CH - 30)
          ctx.fillText(`[2] ${playerCreature.moves[1].name}${cd1}`, 250, CH - 30)
          ctx.fillText('[E] Switch', 440, CH - 30)
          if (activeBattle.isWild) ctx.fillText('[Q] Catch', 570, CH - 30)
          ctx.fillText('Hold ← to Run', 680, CH - 30)
        }

        // Party icons
        ctx.fillStyle = '#fff'
        ctx.font = '11px monospace'
        ctx.fillText('Party:', 60, 30)
        trainer.party.forEach((c, i) => {
          const ix = 110 + i * 40
          const iy = 25
          const r = 8
          ctx.globalAlpha = c.hp > 0 ? 1 : 0.3
          drawCreatureShape(ctx, c.shape, ix, iy, r, c.color)
          ctx.globalAlpha = 1
          if (i === trainer.activeIdx) {
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.strokeRect(ix - r - 3, iy - r - 3, r * 2 + 6, r * 2 + 6)
          }
        })

        // Run hold indicator
        if (activeBattle.runHold > 0) {
          const pct = activeBattle.runHold / RUN_HOLD_MS
          ctx.fillStyle = '#f39c12'
          ctx.fillRect(350, CH - 50, 100 * pct, 8)
          ctx.strokeStyle = '#ccc'
          ctx.strokeRect(350, CH - 50, 100, 8)
        }

      } else {
        // ── Draw overworld ──
        // Terrain
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            ctx.fillStyle = TERRAIN_COLORS[st.map[y][x]] || '#333'
            ctx.fillRect(x * TILE, y * TILE, TILE, TILE)
            ctx.strokeStyle = 'rgba(0,0,0,0.15)'
            ctx.lineWidth = 0.5
            ctx.strokeRect(x * TILE, y * TILE, TILE, TILE)
          }
        }

        // Gym labels
        for (let i = 0; i < st.gymPositions.length; i++) {
          const g = st.gymPositions[i]
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 14px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(`G${i + 1}`, g.x * TILE + TILE / 2, g.y * TILE + TILE / 2 + 5)
          ctx.textAlign = 'left'
        }

        // Town labels
        for (const tw of st.townPositions) {
          ctx.fillStyle = '#333'
          ctx.font = '10px monospace'
          ctx.fillText('HEAL', tw.x * TILE + 5, tw.y * TILE + TILE / 2 + 3)
        }

        // Trainers
        for (const trainer of st.trainers) {
          const tx = trainer.x * TILE + TILE / 2
          const ty = trainer.y * TILE + TILE / 2
          ctx.fillStyle = trainer.color
          ctx.beginPath()
          ctx.arc(tx, ty, TRAINER_R, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ctx.stroke()
          // Name tag
          ctx.fillStyle = '#fff'
          ctx.font = '9px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(trainer.name, tx, ty - TRAINER_R - 4)
          ctx.textAlign = 'left'
          // Badge count
          const badgeCount = trainer.badges.filter(b => b).length
          if (badgeCount > 0) {
            ctx.fillStyle = '#f1c40f'
            ctx.font = '8px monospace'
            ctx.fillText(`★${badgeCount}`, tx + TRAINER_R + 2, ty - 2)
          }
        }

        // HUD overlay (bottom)
        ctx.fillStyle = 'rgba(0,0,0,0.75)'
        ctx.fillRect(0, CH - 60, CW, 60)
        ctx.fillStyle = '#fff'
        ctx.font = '12px monospace'
        let hudX = 10
        for (const trainer of st.trainers) {
          ctx.fillStyle = trainer.color
          ctx.fillText(trainer.name, hudX, CH - 42)
          ctx.fillStyle = '#f1c40f'
          ctx.fillText(`$${trainer.coins}`, hudX, CH - 28)
          ctx.fillStyle = '#e74c3c'
          ctx.fillText(`💎${trainer.gems}`, hudX + 60, CH - 28)
          ctx.fillStyle = '#fff'
          ctx.fillText(`★${trainer.stars}`, hudX + 110, CH - 28)
          // Party mini icons
          trainer.party.forEach((c, i) => {
            const ix = hudX + i * 16
            const iy = CH - 14
            ctx.globalAlpha = c.hp > 0 ? 1 : 0.3
            ctx.fillStyle = c.color
            ctx.fillRect(ix, iy, 10, 10)
            ctx.globalAlpha = 1
          })
          hudX += 200
        }

        // Minimap (top-right)
        const mmSize = 80
        const mmX = CW - mmSize - 10
        const mmY = 10
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(mmX, mmY, mmSize, mmSize * (ROWS / COLS))
        for (const trainer of st.trainers) {
          const mx = mmX + (trainer.x / COLS) * mmSize
          const my = mmY + (trainer.y / ROWS) * (mmSize * (ROWS / COLS))
          ctx.fillStyle = trainer.color
          ctx.fillRect(mx - 2, my - 2, 4, 4)
        }
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Restart ───
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config || {})
    setGameOver(false)
    setWinner(null)
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
      {/* HUD Scoreboard */}
      <div className={styles.scoreboard}>
        {hud.trainers.map(tr => (
          <div key={tr.playerIndex} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: tr.color }} />
            <span>{tr.name}</span>
            <span className={styles.scoreValue}>★{tr.stars} 💎{tr.gems} ${tr.coins}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas} width={CW} height={CH}  role="img" aria-label="Pokemon canvas"/>

      {isPaused && (
        <PauseMenu onResume={resume} onBack={onBack} players={players} />
      )}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && <p className={styles.winnerText}>{t('miniGames.allGymsBeat', 'Adventure complete!')}</p>}
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

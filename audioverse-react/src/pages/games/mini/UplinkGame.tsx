/**
 * UplinkGame — Uplink-inspired hacking simulation for 1-4 couch players.
 *
 * Controls:
 *   Group 0: WASD navigate, Space hack/action, E delete logs
 *   Group 1: Arrows navigate, Enter hack/action, Shift delete logs
 *   Gamepad: D-pad navigate, A hack, X delete logs
 *
 * Rules:
 *  - Network of connected server nodes; players navigate between them.
 *  - Hack nodes to create bounce points, reach target server, steal data.
 *  - Trace detection bar fills — get caught = lose points.
 *  - More bounce nodes = slower trace.
 *  - Earn coins (contracts), gems (data stolen), stars (reputation).
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
const H = 500
const NODE_R = 18
const FG = '#0f0'
const BG = '#000'
const FONT = '12px monospace'
const FONT_LG = '16px monospace'
const HACK_TIME = 2500       // ms base hack time
const FIREWALL_MULT = 2.0    // firewall nodes take 2x longer
const DOWNLOAD_TIME = 3000   // ms to download data
const TRACE_BASE = 15000     // ms base trace time (slow)
const LOG_DELETE_TIME = 1500  // ms to delete logs
const CRACK_MASH = 12        // button presses to crack a password node
const ROUND_DELAY = 2000     // ms between rounds

// ─── Types ───────────────────────────────────────────────────
interface NetNode {
  id: number
  x: number; y: number
  firewall: boolean
  password: boolean
  isTarget: boolean
  isGateway: number | -1  // player index or -1
  hacked: boolean
  hackedBy: number        // player index or -1
}

interface NetEdge { a: number; b: number }

interface PlayerState {
  index: number
  name: string
  color: string
  input: PlayerSlot['input']
  currentNode: number
  hackProgress: number       // 0-1
  hackingNode: number | -1
  downloading: boolean
  downloadProgress: number   // 0-1
  deletingLogs: boolean
  deleteProgress: number     // 0-1
  crackPresses: number
  coins: number
  gems: number
  stars: number
  reputation: number
  caught: boolean
  contractsDone: number
  dataStolen: number
  bounceNodes: number[]
}

interface GameState {
  nodes: NetNode[]
  edges: NetEdge[]
  players: PlayerState[]
  traceProgress: number      // 0-1
  traceActive: boolean
  traceSpeed: number         // ms for full trace
  round: number
  gameOver: boolean
  roundComplete: boolean
  message: string
  messageTimer: number
  gameMode: string
  contractDiff: string
}

// ─── Network generation ─────────────────────────────────────
function generateNetwork(playerCount: number, difficulty: string): { nodes: NetNode[]; edges: NetEdge[] } {
  const nodeCount = difficulty === 'easy' ? 8 : difficulty === 'hard' ? 15 : 11
  const nodes: NetNode[] = []
  const edges: NetEdge[] = []

  // Gateway nodes at bottom for each player
  for (let i = 0; i < playerCount; i++) {
    const spacing = W / (playerCount + 1)
    nodes.push({
      id: i, x: spacing * (i + 1), y: H - 50,
      firewall: false, password: false, isTarget: false,
      isGateway: i, hacked: true, hackedBy: i,
    })
  }

  // Intermediate + target nodes
  const intermediateCount = nodeCount - playerCount - 1
  for (let i = 0; i < intermediateCount; i++) {
    const margin = 60
    const x = margin + Math.random() * (W - margin * 2)
    const y = 80 + Math.random() * (H - 200)
    nodes.push({
      id: nodes.length, x, y,
      firewall: Math.random() < 0.25,
      password: Math.random() < 0.2,
      isTarget: false, isGateway: -1,
      hacked: false, hackedBy: -1,
    })
  }

  // Target node at top center
  nodes.push({
    id: nodes.length, x: W / 2, y: 40,
    firewall: true, password: true, isTarget: true,
    isGateway: -1, hacked: false, hackedBy: -1,
  })

  // Generate edges — ensure connectivity
  const sortedByY = [...nodes].sort((a, b) => b.y - a.y)
  for (let i = 0; i < sortedByY.length; i++) {
    const n = sortedByY[i]
    // Connect to 1-3 nodes above (closer in Y)
    const above = sortedByY.filter(o => o.y < n.y && o.id !== n.id)
      .sort((a, b) => dist(n, a) - dist(n, b))
    const connCount = Math.min(above.length, 1 + Math.floor(Math.random() * 2))
    for (let j = 0; j < connCount; j++) {
      const edgeExists = edges.some(e =>
        (e.a === n.id && e.b === above[j].id) || (e.a === above[j].id && e.b === n.id))
      if (!edgeExists) edges.push({ a: n.id, b: above[j].id })
    }
  }

  // Ensure each node has at least 1 edge
  for (const n of nodes) {
    const hasEdge = edges.some(e => e.a === n.id || e.b === n.id)
    if (!hasEdge) {
      const closest = nodes.filter(o => o.id !== n.id)
        .sort((a, b) => dist(n, a) - dist(n, b))[0]
      if (closest) edges.push({ a: n.id, b: closest.id })
    }
  }

  return { nodes, edges }
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function getNeighbors(nodeId: number, edges: NetEdge[]): number[] {
  const ns: number[] = []
  for (const e of edges) {
    if (e.a === nodeId) ns.push(e.b)
    else if (e.b === nodeId) ns.push(e.a)
  }
  return ns
}

function getTraceSpeed(setting: string): number {
  if (setting === 'slow') return TRACE_BASE * 1.5
  if (setting === 'fast') return TRACE_BASE * 0.5
  return TRACE_BASE
}

// ─── Init ────────────────────────────────────────────────────
function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const contractDiff = config.contractDifficulty || 'medium'
  const { nodes, edges } = generateNetwork(players.length, contractDiff)
  const traceSpd = getTraceSpeed(config.traceSpeed || 'normal')

  const ps: PlayerState[] = players.map((p, i) => ({
    index: i,
    name: p.name,
    color: p.color || PLAYER_COLORS[i] || '#fff',
    input: p.input,
    currentNode: i, // start at own gateway
    hackProgress: 0,
    hackingNode: -1,
    downloading: false,
    downloadProgress: 0,
    deletingLogs: false,
    deleteProgress: 0,
    crackPresses: 0,
    coins: 0, gems: 0, stars: 0,
    reputation: 0, caught: false,
    contractsDone: 0, dataStolen: 0,
    bounceNodes: [i],
  }))

  return {
    nodes, edges, players: ps,
    traceProgress: 0, traceActive: false, traceSpeed: traceSpd,
    round: 1, gameOver: false, roundComplete: false,
    message: '[ CONNECT TO TARGET SERVER ]', messageTimer: 3000,
    gameMode: config.gameMode || 'contracts',
    contractDiff,
  }
}

// ─── KB mappings ─────────────────────────────────────────────
interface KeyAction { group: number; action: 'up' | 'down' | 'left' | 'right' | 'hack' | 'logs' }

const KEY_MAP: Record<string, KeyAction> = {
  w: { group: 0, action: 'up' }, a: { group: 0, action: 'left' },
  s: { group: 0, action: 'down' }, d: { group: 0, action: 'right' },
  ' ': { group: 0, action: 'hack' }, e: { group: 0, action: 'logs' },
  ArrowUp: { group: 1, action: 'up' }, ArrowLeft: { group: 1, action: 'left' },
  ArrowDown: { group: 1, action: 'down' }, ArrowRight: { group: 1, action: 'right' },
  Enter: { group: 1, action: 'hack' }, Shift: { group: 1, action: 'logs' },
}

function findBestNeighbor(
  dir: 'up' | 'down' | 'left' | 'right',
  current: NetNode, neighbors: number[], nodes: NetNode[],
): number | null {
  let best: number | null = null
  let bestScore = -Infinity
  for (const nid of neighbors) {
    const n = nodes[nid]
    if (!n) continue
    const dx = n.x - current.x
    const dy = n.y - current.y
    let score = 0
    if (dir === 'up') score = -dy
    else if (dir === 'down') score = dy
    else if (dir === 'left') score = -dx
    else if (dir === 'right') score = dx
    if (score > 0 && score > bestScore) { bestScore = score; best = nid }
  }
  // fallback: nearest if no node strictly in that direction
  if (best === null && neighbors.length > 0) {
    best = neighbors.sort((a, b) => {
      const na = nodes[a], nb = nodes[b]
      return dist(current, na) - dist(current, nb)
    })[0]
  }
  return best
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function UplinkGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config || {}))
  const [scores, setScores] = useState<{ index: number; name: string; coins: number; gems: number; stars: number; color: string }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })
  const actionRef = useRef<Map<number, Set<string>>>(new Map())

  // ─── Keyboard input ──────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const km = KEY_MAP[e.key]
      if (!km) return
      e.preventDefault()
      const st = stateRef.current
      for (const p of st.players) {
        if (p.input.type !== 'keyboard' || p.input.group !== km.group) continue
        if (km.action === 'hack' || km.action === 'logs') {
          if (!actionRef.current.has(p.index)) actionRef.current.set(p.index, new Set())
          actionRef.current.get(p.index)!.add(km.action)
        } else {
          // Navigate
          const cur = st.nodes[p.currentNode]
          if (!cur) continue
          const neighbors = getNeighbors(p.currentNode, st.edges)
          const target = findBestNeighbor(km.action, cur, neighbors, st.nodes)
          if (target !== null && p.hackingNode === -1 && !p.downloading && !p.deletingLogs) {
            p.currentNode = target
            p.crackPresses = 0
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ─── Gamepad polling ─────────────────────────────────────
  useEffect(() => {
    let raf = 0
    const cooldown = new Map<number, number>()
    function poll() {
      const st = stateRef.current
      const now = Date.now()
      for (const p of st.players) {
        if (p.input.type !== 'gamepad') continue
        const gp = padsRef.current.find(g => g.index === (p.input as { padIndex: number }).padIndex)
        if (!gp) continue
        const cd = cooldown.get(p.index) || 0
        if (now - cd > 200) {
          let dir: 'up' | 'down' | 'left' | 'right' | null = null
          if (gp.up) dir = 'up'
          else if (gp.down) dir = 'down'
          else if (gp.left) dir = 'left'
          else if (gp.right) dir = 'right'
          if (dir && p.hackingNode === -1 && !p.downloading && !p.deletingLogs) {
            const cur = st.nodes[p.currentNode]
            const neighbors = getNeighbors(p.currentNode, st.edges)
            const target = findBestNeighbor(dir, cur, neighbors, st.nodes)
            if (target !== null) { p.currentNode = target; p.crackPresses = 0 }
            cooldown.set(p.index, now)
          }
        }
        if (gp.a) {
          if (!actionRef.current.has(p.index)) actionRef.current.set(p.index, new Set())
          actionRef.current.get(p.index)!.add('hack')
        }
        if (gp.x) {
          if (!actionRef.current.has(p.index)) actionRef.current.set(p.index, new Set())
          actionRef.current.get(p.index)!.add('logs')
        }
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Game tick (16ms) ────────────────────────────────────
  useEffect(() => {
    let raf = 0
    let lastTime = performance.now()

    function tick(now: number) {
      raf = requestAnimationFrame(tick)
      if (pauseRef.current) { lastTime = now; return }
      const dt = Math.min(now - lastTime, 50)
      lastTime = now
      const st = stateRef.current
      if (st.gameOver) return

      // Message timer
      if (st.messageTimer > 0) st.messageTimer -= dt

      // Process round complete -> next round
      if (st.roundComplete) {
        st.messageTimer -= dt
        if (st.messageTimer <= 0) {
          startNewRound(st)
        }
        return
      }

      // Process actions
      for (const p of st.players) {
        if (p.caught) continue
        const actions = actionRef.current.get(p.index)
        const node = st.nodes[p.currentNode]
        if (!node) continue

        // Hack action
        if (actions?.has('hack')) {
          if (p.hackingNode === -1 && !node.hacked && !p.downloading && !p.deletingLogs) {
            // Start hacking
            p.hackingNode = p.currentNode
            p.hackProgress = 0
            p.crackPresses = 0
            if (!st.traceActive) st.traceActive = true
          } else if (p.hackingNode !== -1 && node.password && !node.hacked) {
            // Mash for password crack
            p.crackPresses++
          } else if (node.isTarget && node.hacked && !p.downloading && !p.deletingLogs) {
            // Start downloading
            p.downloading = true
            p.downloadProgress = 0
          }
        }

        // Log deletion action
        if (actions?.has('logs') && !p.deletingLogs && !p.downloading && p.hackingNode === -1) {
          if (node.hacked && node.hackedBy === p.index && !node.isGateway && node.isGateway === -1) {
            p.deletingLogs = true
            p.deleteProgress = 0
          }
        }
      }
      actionRef.current.clear()

      // Update hack progress
      for (const p of st.players) {
        if (p.caught) continue

        // Hacking
        if (p.hackingNode !== -1) {
          const node = st.nodes[p.hackingNode]
          if (!node) { p.hackingNode = -1; continue }
          const hackTime = node.firewall ? HACK_TIME * FIREWALL_MULT : HACK_TIME
          if (node.password && p.crackPresses < CRACK_MASH) {
            // Need more mashing — progress capped at 50% until cracked
            p.hackProgress = Math.min(0.5, p.hackProgress + dt / hackTime)
          } else {
            p.hackProgress += dt / hackTime
          }
          if (p.hackProgress >= 1) {
            node.hacked = true
            node.hackedBy = p.index
            p.bounceNodes.push(node.id)
            p.hackingNode = -1
            p.hackProgress = 0
          }
        }

        // Downloading
        if (p.downloading) {
          p.downloadProgress += dt / DOWNLOAD_TIME
          if (p.downloadProgress >= 1) {
            p.downloading = false
            p.downloadProgress = 0
            p.dataStolen++
            p.gems++
            p.reputation += 10
            if (p.reputation >= 50 && p.reputation - 10 < 50) p.stars++
            if (p.reputation >= 100 && p.reputation - 10 < 100) p.stars++
            st.message = `[ ${p.name}: DATA ACQUIRED +1 GEM ]`
            st.messageTimer = 2000
            // Contract complete
            p.contractsDone++
            p.coins += 2
            completeRound(st, p)
          }
        }

        // Log deletion
        if (p.deletingLogs) {
          p.deleteProgress += dt / LOG_DELETE_TIME
          if (p.deleteProgress >= 1) {
            p.deletingLogs = false
            p.deleteProgress = 0
            // Slow down trace
            st.traceProgress = Math.max(0, st.traceProgress - 0.15)
            st.message = `[ ${p.name}: LOGS DELETED — TRACE SLOWED ]`
            st.messageTimer = 1500
          }
        }
      }

      // Trace progression
      if (st.traceActive) {
        // Bounces reduce trace speed
        const maxBounces = Math.max(...st.players.map(p => p.bounceNodes.length))
        const traceMult = 1 / (1 + maxBounces * 0.15)
        st.traceProgress += (dt / st.traceSpeed) * traceMult

        if (st.traceProgress >= 1) {
          // Caught!
          for (const p of st.players) {
            if (!p.caught && p.hackingNode !== -1 || p.downloading) {
              p.caught = true
              p.hackingNode = -1
              p.downloading = false
              p.coins = Math.max(0, p.coins - 1)
              p.reputation = Math.max(0, p.reputation - 5)
            }
          }
          st.message = '[ TRACE COMPLETE — INTRUDER DETECTED ]'
          st.messageTimer = 2500
          // If all caught or all done, end round
          const allCaught = st.players.every(p => p.caught)
          if (allCaught) completeRound(st, null)
        }
      }

      // Check 5-round game over
      if (st.round > 5) {
        st.gameOver = true
        setGameOver(true)
        const best = [...st.players].sort((a, b) =>
          (b.coins + b.gems * 2 + b.stars * 5) - (a.coins + a.gems * 2 + a.stars * 5))[0]
        if (best) setWinner(best.name)
      }

      // Update scoreboard
      setScores(st.players.map(p => ({
        index: p.index, name: p.name, coins: p.coins, gems: p.gems, stars: p.stars, color: p.color,
      })))
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  function completeRound(st: GameState, _winner: PlayerState | null) {
    st.roundComplete = true
    st.traceActive = false
    st.round++
    st.messageTimer = ROUND_DELAY
    if (st.round <= 5) {
      st.message = `[ ROUND ${st.round - 1} COMPLETE — NEXT ROUND IN... ]`
    }
  }

  function startNewRound(st: GameState) {
    const { nodes, edges } = generateNetwork(st.players.length, st.contractDiff)
    st.nodes = nodes
    st.edges = edges
    st.traceProgress = 0
    st.traceActive = false
    st.roundComplete = false
    st.message = `[ ROUND ${st.round} — HACK THE TARGET ]`
    st.messageTimer = 2500
    for (const p of st.players) {
      p.currentNode = p.index
      p.hackingNode = -1
      p.hackProgress = 0
      p.downloading = false
      p.downloadProgress = 0
      p.deletingLogs = false
      p.deleteProgress = 0
      p.crackPresses = 0
      p.caught = false
      p.bounceNodes = [p.index]
    }
  }

  // ─── Render ──────────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      canvas.width = W
      canvas.height = H

      // Background
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)

      // Scanline effect
      ctx.fillStyle = 'rgba(0,255,0,0.015)'
      for (let y = 0; y < H; y += 3) {
        ctx.fillRect(0, y, W, 1)
      }

      // Edges
      ctx.strokeStyle = '#030'
      ctx.lineWidth = 1
      for (const e of st.edges) {
        const a = st.nodes[e.a], b = st.nodes[e.b]
        if (!a || !b) continue
        // Highlight if both hacked
        if (a.hacked && b.hacked) ctx.strokeStyle = '#0a0'
        else ctx.strokeStyle = '#030'
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }

      // Player connection path highlight
      for (const p of st.players) {
        if (p.bounceNodes.length < 2) continue
        ctx.strokeStyle = p.color
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.4
        for (let i = 0; i < p.bounceNodes.length - 1; i++) {
          const a = st.nodes[p.bounceNodes[i]], b = st.nodes[p.bounceNodes[i + 1]]
          if (!a || !b) continue
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
        ctx.lineWidth = 1
      }

      // Nodes
      for (const node of st.nodes) {
        const isPlayerHere = st.players.some(p => p.currentNode === node.id)
        ctx.beginPath()
        ctx.arc(node.x, node.y, NODE_R, 0, Math.PI * 2)

        // Fill
        if (node.isTarget) ctx.fillStyle = '#ff0'
        else if (node.isGateway >= 0) ctx.fillStyle = st.players[node.isGateway]?.color || FG
        else if (node.hacked) ctx.fillStyle = '#0a0'
        else ctx.fillStyle = '#111'
        ctx.fill()

        // Border
        ctx.strokeStyle = node.firewall ? '#f80' : FG
        ctx.lineWidth = isPlayerHere ? 3 : 1.5
        ctx.stroke()

        // Double border for firewall
        if (node.firewall) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, NODE_R + 4, 0, Math.PI * 2)
          ctx.strokeStyle = '#f80'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Password icon
        if (node.password && !node.hacked) {
          ctx.fillStyle = '#f00'
          ctx.font = '10px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('🔒', node.x, node.y + 4)
        }

        // Target label
        if (node.isTarget) {
          ctx.fillStyle = '#ff0'
          ctx.font = FONT
          ctx.textAlign = 'center'
          ctx.fillText('TARGET', node.x, node.y - NODE_R - 8)
        }

        // Node id
        ctx.fillStyle = node.hacked ? '#000' : FG
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${node.id}`, node.x, node.y)
        ctx.textBaseline = 'alphabetic'
      }

      // Player cursors
      for (const p of st.players) {
        const node = st.nodes[p.currentNode]
        if (!node) continue
        ctx.strokeStyle = p.color
        ctx.lineWidth = 2
        ctx.strokeRect(node.x - NODE_R - 5, node.y - NODE_R - 5, (NODE_R + 5) * 2, (NODE_R + 5) * 2)
        // Player name
        ctx.fillStyle = p.color
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(p.name, node.x, node.y + NODE_R + 14)

        // Hack progress bar
        if (p.hackingNode !== -1) {
          const barW = 40, barH = 6
          const bx = node.x - barW / 2, by = node.y + NODE_R + 18
          ctx.fillStyle = '#333'
          ctx.fillRect(bx, by, barW, barH)
          ctx.fillStyle = FG
          ctx.fillRect(bx, by, barW * p.hackProgress, barH)
          ctx.strokeStyle = FG
          ctx.strokeRect(bx, by, barW, barH)
          // Password crack indicator
          const pwNode = st.nodes[p.hackingNode]
          if (pwNode?.password && !pwNode.hacked) {
            ctx.fillStyle = '#f00'
            ctx.font = '8px monospace'
            ctx.fillText(`CRACK ${p.crackPresses}/${CRACK_MASH}`, node.x, by + barH + 10)
          }
        }

        // Download progress
        if (p.downloading) {
          const barW = 50, barH = 6
          const bx = node.x - barW / 2, by = node.y + NODE_R + 18
          ctx.fillStyle = '#333'
          ctx.fillRect(bx, by, barW, barH)
          ctx.fillStyle = '#0ff'
          ctx.fillRect(bx, by, barW * p.downloadProgress, barH)
          ctx.strokeStyle = '#0ff'
          ctx.strokeRect(bx, by, barW, barH)
          ctx.fillStyle = '#0ff'
          ctx.font = '8px monospace'
          ctx.fillText('DOWNLOADING...', node.x, by + barH + 10)
        }

        // Log deletion
        if (p.deletingLogs) {
          ctx.fillStyle = '#ff0'
          ctx.font = '8px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('DELETING LOGS...', node.x, node.y + NODE_R + 30)
        }

        // Caught indicator
        if (p.caught) {
          ctx.fillStyle = '#f00'
          ctx.font = FONT_LG
          ctx.textAlign = 'center'
          ctx.fillText('TRACED!', node.x, node.y - NODE_R - 20)
        }
      }

      // ── HUD ──
      // Trace bar (top)
      if (st.traceActive || st.traceProgress > 0) {
        const barW = W - 40, barH = 12
        const bx = 20, by = 8
        ctx.fillStyle = '#200'
        ctx.fillRect(bx, by, barW, barH)
        ctx.fillStyle = st.traceProgress > 0.7 ? '#f00' : '#a00'
        ctx.fillRect(bx, by, barW * st.traceProgress, barH)
        ctx.strokeStyle = '#f00'
        ctx.lineWidth = 1
        ctx.strokeRect(bx, by, barW, barH)
        ctx.fillStyle = '#f00'
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`TRACE: ${Math.floor(st.traceProgress * 100)}%`, W / 2, by + barH + 12)
      }

      // Message
      if (st.messageTimer > 0 && st.message) {
        ctx.fillStyle = FG
        ctx.font = FONT_LG
        ctx.textAlign = 'center'
        ctx.globalAlpha = Math.min(1, st.messageTimer / 500)
        ctx.fillText(st.message, W / 2, H - 15)
        ctx.globalAlpha = 1
      }

      // Round indicator
      ctx.fillStyle = FG
      ctx.font = FONT
      ctx.textAlign = 'left'
      ctx.fillText(`ROUND ${Math.min(st.round, 5)}/5`, 10, H - 8)

      // Controls hint
      ctx.fillStyle = '#060'
      ctx.font = '9px monospace'
      ctx.textAlign = 'right'
      ctx.fillText('WASD/Arrows:Move  Space/Enter:Hack  E/Shift:Logs', W - 10, H - 8)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Restart ─────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config || {})
    setGameOver(false)
    setWinner(null)
    setScores([])
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
        {scores.map(s => (
          <div key={s.index} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className={styles.scoreValue}>🪙{s.coins} 💎{s.gems} ⭐{s.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas} style={{ background: '#000' }}  role="img" aria-label="Uplink canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}
      {gameOver && (
        <div className={styles.overlay}>
          <h2 style={{ color: FG, fontFamily: 'monospace' }}>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText} style={{ color: FG }}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          <div style={{ color: FG, fontFamily: 'monospace', textAlign: 'left', fontSize: '14px' }}>
            {stateRef.current.players.map(p => (
              <div key={p.index} style={{ margin: '4px 0' }}>
                <span style={{ color: p.color }}>{p.name}</span>: 🪙{p.coins} 💎{p.gems} ⭐{p.stars} | Rep:{p.reputation} | Contracts:{p.contractsDone}
              </div>
            ))}
          </div>
          <div className={styles.overlayActions}>
            <button className={styles.restartBtn} style={{ background: '#0a0', color: '#000', fontFamily: 'monospace' }} onClick={handleRestart}>
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

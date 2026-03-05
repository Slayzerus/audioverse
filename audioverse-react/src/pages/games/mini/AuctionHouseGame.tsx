/**
 * AuctionHouseGame — buy from garage sales, appraise, restore, sell at auction.
 *
 * Phases cycle: BUYING (30s) → APPRAISING (20s) → AUCTION (30s) → repeat.
 *
 * Controls:
 *   Group 0: W/A/S/D move cursor, Space select/bid, E appraise/restore
 *   Group 1: Arrows move cursor, Enter select/bid, Shift appraise/restore
 *   Gamepad: D-pad move, A select/bid, X appraise/restore
 *
 * Currencies: coins (profits), gems (rare finds), stars (auction records).
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
const H = 600
const TICK_MS = 16
const BUY_PHASE_MS = 30_000
const APPRAISE_PHASE_MS = 20_000
const AUCTION_PHASE_MS = 30_000
const MAX_INVENTORY = 6
const BID_INCREMENT = 0.1 // 10% of current price
const ITEM_ICONS = ['🏺', '🖼️', '⌚', '💍', '🪑', '🧸', '📚', '🏛️']
const ITEM_NAMES = ['Vase', 'Painting', 'Watch', 'Jewelry', 'Furniture', 'Toy', 'Book', 'Antique']
const ITEM_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#e67e22', '#2ecc71', '#1abc9c', '#e91e63']
const STARTING_BUDGET_MAP: Record<string, number> = { low: 200, normal: 500, high: 1000 }

// ─── Types ───────────────────────────────────────────────────
type Phase = 'buying' | 'appraising' | 'auction'

interface AuctionItem {
  id: number; name: string; icon: string; color: string
  trueValue: number; sellerPrice: number
  isFake: boolean; appraised: boolean; restored: boolean
  revealedInfo: string
  ownerId: number | null // playerIndex or null
}

interface Equipment {
  betterEye: number    // 0-3 levels
  betterCatalog: number
  storage: number      // extra slots
  reputation: number
  fastHands: number
}

interface PlayerState {
  index: number; name: string; color: string
  coins: number; gems: number; stars: number
  inventory: AuctionItem[]
  equipment: Equipment
  cursorX: number; cursorY: number
  input: PlayerSlot['input']
  totalWealth: number
}

interface AuctionState {
  currentItem: AuctionItem | null
  currentBid: number
  bidLeader: number | null // playerIndex
  aiBids: number
  bidTimer: number
}

interface GameState {
  players: PlayerState[]
  phase: Phase
  phaseTimer: number
  round: number
  totalRounds: number
  shopItems: AuctionItem[]
  auctionQueue: AuctionItem[]
  auction: AuctionState
  gameOver: boolean
  winner: string | null
  nextId: number
  gameMode: string
  difficulty: string
}

// ─── Helpers ─────────────────────────────────────────────────
function randomItem(id: number, difficulty: string): AuctionItem {
  const idx = Math.floor(Math.random() * ITEM_NAMES.length)
  const baseValue = 50 + Math.floor(Math.random() * 4950)
  const isFake = Math.random() < (difficulty === 'hard' ? 0.3 : difficulty === 'easy' ? 0.1 : 0.2)
  const trueValue = isFake ? Math.floor(baseValue * 0.05) : baseValue
  const priceVariance = 0.4 + Math.random() * 1.2 // 40% to 160% of true value
  const sellerPrice = Math.max(10, Math.floor(trueValue * priceVariance))
  return {
    id, name: ITEM_NAMES[idx], icon: ITEM_ICONS[idx], color: ITEM_COLORS[idx],
    trueValue, sellerPrice, isFake, appraised: false, restored: false,
    revealedInfo: '', ownerId: null,
  }
}

function generateShopItems(count: number, startId: number, difficulty: string): AuctionItem[] {
  return Array.from({ length: count }, (_, i) => randomItem(startId + i, difficulty))
}

function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const totalRounds = Number(config.rounds) || 8
  const gameMode = String(config.gameMode || 'career')
  const difficulty = String(config.difficulty || 'normal')
  const budget = STARTING_BUDGET_MAP[config.startingBudget as string] ?? 500
  let nextId = 1

  const pStates: PlayerState[] = players.map((p) => ({
    index: p.index, name: p.name,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    coins: budget, gems: 0, stars: 0,
    inventory: [], cursorX: 0, cursorY: 0,
    equipment: { betterEye: 0, betterCatalog: 0, storage: 0, reputation: 0, fastHands: 0 },
    input: p.input, totalWealth: budget,
  }))

  const shopItems = generateShopItems(8, nextId, difficulty)
  nextId += 8

  return {
    players: pStates, phase: 'buying', phaseTimer: BUY_PHASE_MS,
    round: 1, totalRounds, shopItems,
    auctionQueue: [], auction: { currentItem: null, currentBid: 0, bidLeader: null, aiBids: 0, bidTimer: 0 },
    gameOver: false, winner: null, nextId, gameMode, difficulty,
  }
}

// ─── Keyboard maps ───────────────────────────────────────────
interface KeyAction { group: number; action: 'up' | 'down' | 'left' | 'right' | 'select' | 'appraise' }
const KEY_MAP = new Map<string, KeyAction>([
  ['w', { group: 0, action: 'up' }], ['s', { group: 0, action: 'down' }],
  ['a', { group: 0, action: 'left' }], ['d', { group: 0, action: 'right' }],
  [' ', { group: 0, action: 'select' }], ['e', { group: 0, action: 'appraise' }],
  ['ArrowUp', { group: 1, action: 'up' }], ['ArrowDown', { group: 1, action: 'down' }],
  ['ArrowLeft', { group: 1, action: 'left' }], ['ArrowRight', { group: 1, action: 'right' }],
  ['Enter', { group: 1, action: 'select' }], ['Shift', { group: 1, action: 'appraise' }],
])

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function AuctionHouseGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const [hud, setHud] = useState<{
    phase: Phase; round: number; timer: number
    players: { name: string; coins: number; gems: number; stars: number; color: string; invCount: number; wealth: number }[]
    auctionBid: number; bidLeader: string | null
  }>({ phase: 'buying', round: 1, timer: BUY_PHASE_MS, players: [], auctionBid: 0, bidLeader: null })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Apply action ──
  const applyAction = useCallback((playerIdx: number, action: string) => {
    const st = stateRef.current
    if (st.gameOver) return
    const p = st.players.find(pl => pl.index === playerIdx)
    if (!p) return

    if (action === 'up') p.cursorY = Math.max(0, p.cursorY - 1)
    else if (action === 'down') p.cursorY = Math.min(3, p.cursorY + 1)
    else if (action === 'left') p.cursorX = Math.max(0, p.cursorX - 1)
    else if (action === 'right') p.cursorX = Math.min(3, p.cursorX + 1)
    else if (action === 'select') {
      if (st.phase === 'buying') {
        const itemIdx = p.cursorY * 4 + p.cursorX
        const item = st.shopItems[itemIdx]
        if (item && item.ownerId == null && p.coins >= item.sellerPrice) {
          const maxSlots = MAX_INVENTORY + p.equipment.storage * 2
          if (p.inventory.length < maxSlots) {
            p.coins -= item.sellerPrice
            item.ownerId = p.index
            p.inventory.push(item)
          }
        }
      } else if (st.phase === 'auction') {
        const auc = st.auction
        if (auc.currentItem) {
          const newBid = Math.ceil(auc.currentBid * (1 + BID_INCREMENT))
          if (p.coins >= newBid) {
            auc.currentBid = newBid
            auc.bidLeader = p.index
            auc.bidTimer = 3000 // reset countdown
          }
        }
      }
    } else if (action === 'appraise') {
      if (st.phase === 'appraising') {
        const itemIdx = p.cursorY * 4 + p.cursorX
        const item = p.inventory[itemIdx]
        if (item && !item.appraised) {
          item.appraised = true
          const eyeLevel = p.equipment.betterEye
          if (item.isFake && eyeLevel >= 1) {
            item.revealedInfo = 'FAKE!'
          } else if (!item.isFake) {
            const accuracy = 0.3 + eyeLevel * 0.2
            const estimate = Math.floor(item.trueValue * (1 - accuracy + Math.random() * accuracy * 2))
            item.revealedInfo = `~${estimate} coins`
          } else {
            item.revealedInfo = 'Looks genuine...'
          }
        } else if (item && item.appraised && !item.restored) {
          // Restore item
          const cost = Math.floor(item.trueValue * 0.15)
          if (p.coins >= cost) {
            p.coins -= cost
            item.restored = true
            item.trueValue = Math.floor(item.trueValue * (1.2 + Math.random() * 0.3))
          }
        }
      }
    }
  }, [])

  // ── Keyboard input ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (pauseRef.current) return
      const mapping = KEY_MAP.get(e.key)
      if (!mapping) return
      const st = stateRef.current
      for (const p of st.players) {
        if (p.input.type === 'keyboard' && p.input.group === mapping.group) {
          applyAction(p.index, mapping.action)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [applyAction])

  // ── Gamepad polling ──
  useEffect(() => {
    let raf = 0
    let lastFrame = 0
    function poll(time: number) {
      if (time - lastFrame > 150) {
        lastFrame = time
        const st = stateRef.current
        const currentPads = padsRef.current
        for (const p of st.players) {
          if (p.input.type !== 'gamepad') continue
          const gp = currentPads.find(pad => pad.index === (p.input as { type: 'gamepad'; padIndex: number }).padIndex)
          if (!gp) continue
          if (gp.up) applyAction(p.index, 'up')
          else if (gp.down) applyAction(p.index, 'down')
          else if (gp.left) applyAction(p.index, 'left')
          else if (gp.right) applyAction(p.index, 'right')
          if (gp.a) applyAction(p.index, 'select')
          if (gp.x) applyAction(p.index, 'appraise')
        }
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [applyAction])

  // ── Game tick ──
  useEffect(() => {
    let timer = 0
    function tick() {
      if (pauseRef.current) { timer = window.setTimeout(tick, TICK_MS); return }
      const st = stateRef.current
      if (st.gameOver) return

      st.phaseTimer -= TICK_MS

      // Phase transitions
      if (st.phaseTimer <= 0) {
        if (st.phase === 'buying') {
          st.phase = 'appraising'
          st.phaseTimer = APPRAISE_PHASE_MS
        } else if (st.phase === 'appraising') {
          // Prepare auction queue from all player inventories
          st.auctionQueue = []
          for (const p of st.players) {
            for (const item of p.inventory) {
              st.auctionQueue.push(item)
            }
          }
          st.phase = 'auction'
          st.phaseTimer = AUCTION_PHASE_MS
          // Start first auction
          if (st.auctionQueue.length > 0) {
            const item = st.auctionQueue.shift()!
            st.auction = { currentItem: item, currentBid: Math.floor(item.trueValue * 0.3), bidLeader: null, aiBids: 0, bidTimer: 5000 }
          }
        } else if (st.phase === 'auction') {
          // End of round
          // Finalize current auction if active
          finalizeAuction(st)
          // Update wealth
          for (const p of st.players) {
            p.totalWealth = p.coins + p.inventory.reduce((sum, it) => sum + it.trueValue, 0)
          }
          st.round++
          if (st.round > st.totalRounds) {
            st.gameOver = true
            const best = st.players.reduce((a, b) => a.totalWealth > b.totalWealth ? a : b)
            st.winner = best.name
            setGameOver(true)
            setWinner(best.name)
            return
          }
          // New round: buying phase
          st.shopItems = generateShopItems(8, st.nextId, st.difficulty)
          st.nextId += 8
          st.phase = 'buying'
          st.phaseTimer = BUY_PHASE_MS
          // Reset cursors
          for (const p of st.players) { p.cursorX = 0; p.cursorY = 0 }
        }
      }

      // Auction AI bidding
      if (st.phase === 'auction' && st.auction.currentItem) {
        st.auction.bidTimer -= TICK_MS
        // AI bids occasionally
        if (Math.random() < 0.005 && st.auction.currentBid < st.auction.currentItem.trueValue * 0.9) {
          st.auction.currentBid = Math.ceil(st.auction.currentBid * (1 + BID_INCREMENT))
          st.auction.aiBids++
          st.auction.bidLeader = null // AI leads
          st.auction.bidTimer = 3000
        }
        // Auction item done
        if (st.auction.bidTimer <= 0) {
          finalizeAuction(st)
          // Next item
          if (st.auctionQueue.length > 0) {
            const item = st.auctionQueue.shift()!
            st.auction = { currentItem: item, currentBid: Math.floor(item.trueValue * 0.3), bidLeader: null, aiBids: 0, bidTimer: 5000 }
          } else {
            st.auction.currentItem = null
          }
        }
      }

      // HUD
      const bidLeaderName = st.auction.bidLeader != null
        ? st.players.find(p => p.index === st.auction.bidLeader)?.name ?? 'AI'
        : (st.auction.currentItem ? 'AI' : null)
      setHud({
        phase: st.phase, round: st.round, timer: st.phaseTimer,
        players: st.players.map(p => ({
          name: p.name, coins: p.coins, gems: p.gems, stars: p.stars,
          color: p.color, invCount: p.inventory.length,
          wealth: p.coins + p.inventory.reduce((s, it) => s + it.trueValue, 0),
        })),
        auctionBid: st.auction.currentBid,
        bidLeader: bidLeaderName,
      })

      timer = window.setTimeout(tick, TICK_MS)
    }

    function finalizeAuction(st: GameState) {
      const auc = st.auction
      if (!auc.currentItem) return
      if (auc.bidLeader != null) {
        const buyer = st.players.find(p => p.index === auc.bidLeader)
        const seller = st.players.find(p => p.index === auc.currentItem!.ownerId)
        if (buyer) {
          buyer.coins -= auc.currentBid
          const maxSlots = MAX_INVENTORY + buyer.equipment.storage * 2
          if (buyer.inventory.length < maxSlots) {
            buyer.inventory.push(auc.currentItem!)
          }
          // Record bonus
          if (auc.currentBid >= 1000) buyer.stars++
        }
        if (seller) {
          seller.coins += auc.currentBid
          seller.inventory = seller.inventory.filter(it => it.id !== auc.currentItem!.id)
          if (auc.currentItem!.trueValue >= 2000) seller.gems++
        }
      }
    }

    timer = window.setTimeout(tick, TICK_MS)
    return () => clearTimeout(timer)
  }, [])

  // ── Render ──
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      canvas.width = W; canvas.height = H

      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, W, H)

      // Phase header
      ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif'; ctx.textAlign = 'center'
      const phaseLabel = st.phase === 'buying' ? '🛒 BUYING PHASE' : st.phase === 'appraising' ? '🔍 APPRAISING PHASE' : '🔨 AUCTION PHASE'
      ctx.fillText(`${phaseLabel} — Round ${st.round}/${st.totalRounds} — ${Math.ceil(st.phaseTimer / 1000)}s`, W / 2, 30)

      if (st.phase === 'buying') {
        // Draw shop grid (2 rows × 4 cols)
        const cellW = 160, cellH = 120, startX = 80, startY = 60
        for (let i = 0; i < st.shopItems.length; i++) {
          const item = st.shopItems[i]
          const col = i % 4, row = Math.floor(i / 4)
          const x = startX + col * cellW, y = startY + row * (cellH + 20)

          ctx.fillStyle = item.ownerId != null ? '#333' : '#2a2a4a'
          ctx.fillRect(x, y, cellW - 10, cellH)
          ctx.strokeStyle = item.color; ctx.lineWidth = 2
          ctx.strokeRect(x, y, cellW - 10, cellH)

          ctx.fillStyle = '#fff'; ctx.font = '28px serif'; ctx.textAlign = 'center'
          ctx.fillText(item.icon, x + (cellW - 10) / 2, y + 40)
          ctx.font = '12px sans-serif'
          ctx.fillText(item.name, x + (cellW - 10) / 2, y + 60)
          ctx.fillStyle = '#f1c40f'
          ctx.fillText(`${item.sellerPrice} coins`, x + (cellW - 10) / 2, y + 80)
          if (item.ownerId != null) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y, cellW - 10, cellH)
            ctx.fillStyle = '#2ecc71'; ctx.font = '14px sans-serif'
            ctx.fillText('SOLD', x + (cellW - 10) / 2, y + 55)
          }
        }
        // Cursors
        for (const p of st.players) {
          const i = p.cursorY * 4 + p.cursorX
          if (i < st.shopItems.length) {
            const col = i % 4, row = Math.floor(i / 4)
            const x = startX + col * cellW, y = startY + row * (cellH + 20)
            ctx.strokeStyle = p.color; ctx.lineWidth = 3
            ctx.strokeRect(x - 2, y - 2, cellW - 6, cellH + 4)
          }
        }
      } else if (st.phase === 'appraising') {
        // Show each player's inventory
        const slotW = W / st.players.length
        for (const p of st.players) {
          const baseX = p.index * slotW
          ctx.fillStyle = '#222'; ctx.fillRect(baseX + 5, 50, slotW - 10, H - 80)
          ctx.fillStyle = p.color; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'
          ctx.fillText(p.name, baseX + slotW / 2, 70)

          for (let i = 0; i < p.inventory.length; i++) {
            const item = p.inventory[i]
            const ix = baseX + 15, iy = 85 + i * 70
            ctx.fillStyle = '#2a2a4a'; ctx.fillRect(ix, iy, slotW - 30, 60)
            ctx.strokeStyle = item.color; ctx.lineWidth = 1; ctx.strokeRect(ix, iy, slotW - 30, 60)
            ctx.fillStyle = '#fff'; ctx.font = '20px serif'; ctx.textAlign = 'left'
            ctx.fillText(item.icon, ix + 5, iy + 30)
            ctx.font = '11px sans-serif'
            ctx.fillText(item.name, ix + 30, iy + 20)
            if (item.appraised) {
              ctx.fillStyle = item.isFake && item.revealedInfo === 'FAKE!' ? '#e74c3c' : '#2ecc71'
              ctx.fillText(item.revealedInfo, ix + 30, iy + 35)
            }
            if (item.restored) {
              ctx.fillStyle = '#f1c40f'; ctx.fillText('✨ Restored', ix + 30, iy + 50)
            }
          }
          // Cursor highlight
          const ci = p.cursorY * 4 + p.cursorX
          if (ci < p.inventory.length) {
            const iy = 85 + ci * 70
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
            ctx.strokeRect(baseX + 13, iy - 2, slotW - 26, 64)
          }
        }
      } else if (st.phase === 'auction') {
        const auc = st.auction
        if (auc.currentItem) {
          // Big item display
          ctx.fillStyle = '#2a2a4a'; ctx.fillRect(W / 2 - 150, 80, 300, 280)
          ctx.strokeStyle = auc.currentItem.color; ctx.lineWidth = 3
          ctx.strokeRect(W / 2 - 150, 80, 300, 280)
          ctx.fillStyle = '#fff'; ctx.font = '60px serif'; ctx.textAlign = 'center'
          ctx.fillText(auc.currentItem.icon, W / 2, 170)
          ctx.font = '18px sans-serif'
          ctx.fillText(auc.currentItem.name, W / 2, 210)
          if (auc.currentItem.appraised) {
            ctx.fillStyle = '#aaa'; ctx.font = '13px sans-serif'
            ctx.fillText(auc.currentItem.revealedInfo, W / 2, 235)
          }
          // Current bid
          ctx.fillStyle = '#f1c40f'; ctx.font = '24px sans-serif'
          ctx.fillText(`Current Bid: ${auc.currentBid} coins`, W / 2, 280)
          ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'
          const leaderName = auc.bidLeader != null
            ? st.players.find(p => p.index === auc.bidLeader)?.name ?? 'AI'
            : 'AI'
          ctx.fillText(`Leader: ${leaderName}`, W / 2, 305)
          ctx.fillText(`Time: ${Math.ceil(auc.bidTimer / 1000)}s`, W / 2, 330)
          // Seller info
          const seller = st.players.find(p => p.index === auc.currentItem!.ownerId)
          if (seller) {
            ctx.fillStyle = seller.color; ctx.font = '12px sans-serif'
            ctx.fillText(`Seller: ${seller.name}`, W / 2, 350)
          }
        } else {
          ctx.fillStyle = '#888'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'
          ctx.fillText('Waiting for next item...', W / 2, H / 2)
        }
      }

      // Player wealth bar at bottom
      const barH = 50, barY = H - barH
      ctx.fillStyle = '#111'; ctx.fillRect(0, barY, W, barH)
      const pW = W / st.players.length
      for (const p of st.players) {
        const px = p.index * pW
        ctx.fillStyle = p.color; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`${p.name}: 🪙${p.coins} 💎${p.gems} ⭐${p.stars}`, px + pW / 2, barY + 18)
        const wealth = p.coins + p.inventory.reduce((s, it) => s + it.trueValue, 0)
        ctx.fillStyle = '#aaa'; ctx.fillText(`Wealth: ${wealth} | Items: ${p.inventory.length}`, px + pW / 2, barY + 36)
      }

      // Phase timer bar
      const maxPhaseTime = st.phase === 'buying' ? BUY_PHASE_MS : st.phase === 'appraising' ? APPRAISE_PHASE_MS : AUCTION_PHASE_MS
      const phasePct = st.phaseTimer / maxPhaseTime
      ctx.fillStyle = '#333'; ctx.fillRect(0, 40, W, 6)
      ctx.fillStyle = phasePct > 0.3 ? '#2ecc71' : '#e74c3c'
      ctx.fillRect(0, 40, W * phasePct, 6)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false); setWinner(null)
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
      <div className={styles.scoreboard}>
        {hud.players.map((p, i) => (
          <div key={i} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: p.color }} />
            <span>{p.name}</span>
            <span className={styles.scoreValue}>🪙{p.coins} 💎{p.gems} ⭐{p.stars} W:{p.wealth}</span>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Auction House canvas"/>
      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}
      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
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

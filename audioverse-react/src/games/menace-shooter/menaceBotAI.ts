/**
 * menaceBotAI.ts — Bot AI logic for Menace 3D.
 *
 * Extracted from gameLogic.ts for file-size management.
 */
import type { GameState, Player } from './types'
import { dist, KEY_MAP, isAction, type InputSnapshot } from './menaceHelpers'

// ── BOT AI ────────────────────────────────────────────────
export function botAI(p: Player, st: GameState, input: InputSnapshot) {
  if (!p.alive || !(p.input.type === 'keyboard' && p.input.group === -1)) return

  // Find nearest enemy or NPC
  let nearestDist = 9999
  let nearestX = p.x, nearestY = p.y
  for (const other of st.players) {
    if (other.pIndex === p.pIndex || !other.alive) continue
    const d = dist(p, other)
    if (d < nearestDist) { nearestDist = d; nearestX = other.x; nearestY = other.y }
  }

  const dx = nearestX - p.x
  const dy = nearestY - p.y

  if (p.inVehicle !== null) {
    // Bot driving — drive toward target
    const targetAngle = Math.atan2(dy, dx)
    const vehicle = st.vehicles[p.inVehicle]
    if (!vehicle) return

    let angleDiff = targetAngle - vehicle.angle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

    // Simulate input: steer and accelerate
    const fakeInput: InputSnapshot = { keys: new Set(), pads: [] }
    if (angleDiff > 0.1) {
      p.input = { ...p.input }; simulateBotKey(p, 'right', fakeInput)
    } else if (angleDiff < -0.1) {
      simulateBotKey(p, 'left', fakeInput)
    }
    simulateBotKey(p, 'up', fakeInput)

    // Dismount if stuck or vehicle damaged
    if (Math.abs(vehicle.speed) < 5 && Math.random() < 0.005) {
      simulateBotKey(p, 'enter', fakeInput)
    }
    // Apply bot's simulated input
    applyBotInput(p, fakeInput, input)
  } else {
    // Bot on foot
    const fakeInput: InputSnapshot = { keys: new Set(), pads: [] }

    // Move toward nearest enemy
    if (nearestDist > 30) {
      if (Math.abs(dx) > Math.abs(dy)) {
        simulateBotKey(p, dx > 0 ? 'right' : 'left', fakeInput)
      } else {
        simulateBotKey(p, dy > 0 ? 'down' : 'up', fakeInput)
      }
    }

    // Shoot if close enough and has weapon
    if (nearestDist < 200 && p.weapon && p.weapon.ammo > 0) {
      p.angle = Math.atan2(dy, dx)
      if (Math.random() < 0.3) simulateBotKey(p, 'shoot', fakeInput)
    }

    // Try to enter nearby vehicle
    if (nearestDist > 150 || !p.weapon) {
      for (const v of st.vehicles) {
        if (v.driver === null && dist(p, v) < 40) {
          simulateBotKey(p, 'enter', fakeInput)
          break
        }
      }
    }

    // Pick up nearby items
    for (const pk of st.pickups) {
      if (!pk.collected && dist(p, pk) < 30) {
        simulateBotKey(p, 'pickup', fakeInput)
        break
      }
    }

    applyBotInput(p, fakeInput, input)
  }
}

// Bot helper: simulate a key press
function simulateBotKey(p: Player, action: string, fakeInput: InputSnapshot) {
  // We mark the action by adding a dummy key for the player's group
  for (const [key, ka] of KEY_MAP) {
    if (ka.group === 99 && ka.action === action) {
      fakeInput.keys.add(key); return
    }
  }
  // Use group 99 for bots
  fakeInput.keys.add(`__bot_${p.pIndex}_${action}`)
}

function applyBotInput(p: Player, fakeInput: InputSnapshot, _realInput: InputSnapshot) {
  // Bot actions are checked directly
  const hasAction = (action: string) => fakeInput.keys.has(`__bot_${p.pIndex}_${action}`)
  // Store in a way gameTick can read
  ;(p as unknown as Record<string, boolean>).__botUp = hasAction('up')
  ;(p as unknown as Record<string, boolean>).__botDown = hasAction('down')
  ;(p as unknown as Record<string, boolean>).__botLeft = hasAction('left')
  ;(p as unknown as Record<string, boolean>).__botRight = hasAction('right')
  ;(p as unknown as Record<string, boolean>).__botShoot = hasAction('shoot')
  ;(p as unknown as Record<string, boolean>).__botEnter = hasAction('enter')
  ;(p as unknown as Record<string, boolean>).__botPickup = hasAction('pickup')
  ;(p as unknown as Record<string, boolean>).__botSprint = hasAction('sprint')
}

export function isBotAction(p: Player, action: string, input: InputSnapshot): boolean {
  if (p.input.type === 'keyboard' && p.input.group === -1) {
    return (p as unknown as Record<string, boolean>)[`__bot${action.charAt(0).toUpperCase() + action.slice(1)}`] || false
  }
  return isAction(p, action, input)
}

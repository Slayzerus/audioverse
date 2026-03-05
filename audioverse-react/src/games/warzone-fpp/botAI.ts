/**
 * Bot AI for computer-controlled soldiers.
 *
 * Behaviours:
 * - Seek health pickups when low HP
 * - Switch weapon based on engagement distance (metre-based)
 * - Strafe during combat instead of standing still
 * - Patrol toward uncaptured objectives / mode-specific goals
 * - Wander when nothing to do
 *
 * All distances in metres (3D tile-based world).
 */
import type { Soldier, GameState, Vec } from './types'
import type { SoldierInput } from './input'
import { dist } from './helpers'

export function botAI(s: Soldier, st: GameState): SoldierInput {
  let nearest: Soldier | null = null
  let nd = Infinity
  for (const e of st.soldiers) {
    if (!e.alive || e.team === s.team) continue
    const d = dist(s, e)
    if (d < nd) { nd = d; nearest = e }
  }

  let mx = 0, my = 0, shoot = false, sprint = false
  let weaponSwitch = -1
  let interact = false

  // ── Battle Royale AI ──────────────────────────────────
  if (st.mode === 'battle-royale' && st.brState) {
    const zone = st.brState.zone
    const dx = s.x - zone.centerX
    const dy = s.y - zone.centerY
    const distToCenter = Math.sqrt(dx * dx + dy * dy)

    // Priority 1: Stay inside zone
    if (distToCenter > zone.radius * 0.75) {
      const toCenter = Math.atan2(zone.centerY - s.y, zone.centerX - s.x)
      mx = Math.cos(toCenter)
      my = Math.sin(toCenter)
      s.angle = toCenter
      sprint = true

      // Still fight if enemy very close
      if (nearest && nd < 8) {
        s.angle = Math.atan2(nearest.y - s.y, nearest.x - s.x)
        shoot = st.frame % 6 === 0
      }

      return { mx, my, shoot, interact, sprint, weaponSwitch, posture: 'stand', bandage: false, toggleTPP: false, ptt: false, placeTrap: false, aim: false, cycleAimAssist: false }
    }

    // Priority 2: Seek weapon pickups if only have pistol
    if (s.weapons.length <= 1 && st.brState.weaponPickups.length > 0) {
      let closestWp: { x: number; y: number } | null = null
      let wpd = Infinity
      for (const wp of st.brState.weaponPickups) {
        if (!wp.alive) continue
        const d = dist(s, wp)
        if (d < wpd) { wpd = d; closestWp = wp }
      }
      if (closestWp && wpd < 40) {
        const a = Math.atan2(closestWp.y - s.y, closestWp.x - s.x)
        mx = Math.cos(a); my = Math.sin(a)
        s.angle = a; sprint = wpd > 10
        return { mx, my, shoot: false, interact, sprint, weaponSwitch, posture: 'stand', bandage: false, toggleTPP: false, ptt: false, placeTrap: false, aim: false, cycleAimAssist: false }
      }
    }

    // Priority 3: Loot supply drops
    for (const drop of st.brState.supplyDrops) {
      if (!drop.landed || drop.looted) continue
      const dd = dist(s, drop)
      if (dd < 20) {
        const a = Math.atan2(drop.y - s.y, drop.x - s.x)
        mx = Math.cos(a); my = Math.sin(a)
        s.angle = a; sprint = dd > 5
        interact = dd < 4
        return { mx, my, shoot: false, interact, sprint, weaponSwitch, posture: 'stand', bandage: false, toggleTPP: false, ptt: false, placeTrap: false, aim: false, cycleAimAssist: false }
      }
    }
  }

  // ── Low health → seek health pickup ────────────────────
  if (s.hp < s.maxHp * 0.3) {
    let closestPk: Vec | null = null, pd = Infinity
    for (const p of st.pickups) {
      if (!p.alive || p.type !== 'health') continue
      const d = dist(s, p)
      if (d < pd) { pd = d; closestPk = p }
    }
    if (closestPk && pd < 20) {
      const a = Math.atan2(closestPk.y - s.y, closestPk.x - s.x)
      mx = Math.cos(a); my = Math.sin(a)
      sprint = true; s.angle = a
      if (nearest && nd < 5) {
        s.angle = Math.atan2(nearest.y - s.y, nearest.x - s.x)
        shoot = st.frame % 8 === 0
      }
      return { mx, my, shoot, interact: false, sprint, weaponSwitch, posture: 'stand', bandage: false, toggleTPP: false, ptt: false, placeTrap: false, aim: false, cycleAimAssist: false }
    }
  }

  // ── Combat mode ────────────────────────────────────────
  if (nearest && nd < 30) {
    s.angle = Math.atan2(nearest.y - s.y, nearest.x - s.x)

    // Weapon selection by distance (metres)
    if (nd < 4 && s.weapons.includes('Shotgun'))        weaponSwitch = s.weapons.indexOf('Shotgun')
    else if (nd > 18 && s.weapons.includes('Sniper'))   weaponSwitch = s.weapons.indexOf('Sniper')
    else if (nd < 10 && s.weapons.includes('SMG'))      weaponSwitch = s.weapons.indexOf('SMG')

    shoot = st.frame % 6 === 0

    if (nd > 10) {
      // Close the gap
      mx = Math.cos(s.angle); my = Math.sin(s.angle)
    } else if (nd < 3) {
      // Back off
      mx = -Math.cos(s.angle); my = -Math.sin(s.angle)
    } else {
      // Strafe
      const strafeDir = st.frame % 120 < 60 ? Math.PI / 2 : -Math.PI / 2
      mx = Math.cos(s.angle + strafeDir) * 0.5
      my = Math.sin(s.angle + strafeDir) * 0.5
    }
    return { mx, my, shoot, interact: false, sprint, weaponSwitch, posture: 'stand', bandage: false, toggleTPP: false, ptt: false, placeTrap: false, aim: false, cycleAimAssist: false }
  }

  // ── Patrol → nearest uncaptured objective ──────────────
  let target: Vec | null = null, td = Infinity
  for (const cp of st.capturePoints) {
    if (cp.team === s.team) continue
    const d = dist(s, cp)
    if (d < td) { td = d; target = cp }
  }

  // Mode-specific goals for bots
  if (!target) {
    // Heist: robber bots go for loot, cop bots defend
    if (st.mode === 'heist' && st.lootBags) {
      for (const lb of st.lootBags) {
        if (!lb.extracted && lb.carrier < 0) {
          const d = dist(s, lb)
          if (d < td) { td = d; target = lb }
        }
      }
    }
    // CTF: go for enemy flag
    if (st.mode === 'ctf' && st.flags) {
      const enemyFlag = st.flags.find(f => f.team !== s.team && f.atBase)
      if (enemyFlag) {
        const d = dist(s, enemyFlag)
        if (d < td) { td = d; target = enemyFlag }
      }
    }
  }

  if (target) {
    const a = Math.atan2(target.y - s.y, target.x - s.x)
    mx = Math.cos(a); my = Math.sin(a)
    s.angle = a
    sprint = td > 15
  } else {
    // Wander
    if (st.frame % 60 === 0) s.angle = Math.random() * Math.PI * 2
    mx = Math.cos(s.angle) * 0.5
    my = Math.sin(s.angle) * 0.5
  }

  return { mx, my, shoot, interact: false, sprint, weaponSwitch, posture: 'stand', bandage: false, toggleTPP: false, ptt: false, placeTrap: false, aim: false, cycleAimAssist: false }
}

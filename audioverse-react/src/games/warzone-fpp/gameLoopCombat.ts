/**
 * Combat & round helpers extracted from gameLoop.ts.
 *
 * Contains: handleModeInteract, scoreRound, applyDamage, applySplash,
 *           registerKill, checkWinConditions.
 */
import type { GameState, Soldier, Bullet } from './types'
import { VEHICLE_RESPAWN, RESPAWN_TIME, BLEED_CHANCE, BLEED_RATE_MIN, BLEED_RATE_MAX } from './constants'
import { dist } from './helpers'
import { spawnPos } from './mapGenerator'

// ═════════════════════════════════════════════════════════
// Mode-specific interact
// ═════════════════════════════════════════════════════════
export function handleModeInteract(st: GameState, s: Soldier): void {
  // Bomb: plant or defuse
  if (st.mode === 'bomb' && st.bombSites) {
    for (const site of st.bombSites) {
      if (dist(s, site) > 3) continue
      if (s.team === 0 && !site.planted && site.planter < 0) {
        site.planter = s.playerIndex
      }
      if (s.team === 1 && site.planted && !site.detonated && site.defuser < 0) {
        site.defuser = s.playerIndex
      }
    }
  }

  // Heist: pick up loot
  if (st.mode === 'heist' && st.lootBags) {
    if (s.team === 0 && s.carryingLoot === undefined) {
      for (const bag of st.lootBags) {
        if (!bag.extracted && bag.carrier < 0 && dist(s, bag) < 3) {
          bag.carrier = s.playerIndex; s.carryingLoot = bag.id; break
        }
      }
    }
  }
}

// ═════════════════════════════════════════════════════════
// Round system (bomb / heist)
// ═════════════════════════════════════════════════════════
export function scoreRound(st: GameState, winningTeam: number): void {
  if (!st.roundScore) st.roundScore = [0, 0]
  st.roundScore[winningTeam]++

  const maxR = st.maxRounds ?? 6
  const needed = Math.ceil(maxR / 2)

  if (st.roundScore[winningTeam] >= needed) {
    st.gameOver = true; st.winTeam = winningTeam; return
  }

  // Reset round state
  st.round = (st.round ?? 1) + 1

  // Reset soldiers
  for (const s of st.soldiers) {
    const pos = spawnPos(s.team, st.capturePoints, st.tileMap)
    s.x = pos.x; s.y = pos.y; s.alive = true
    s.hp = s.maxHp; s.armor = 0; s.vehicleIndex = -1
    s.carryingLoot = undefined; s.carryingFlag = undefined
  }
  st.bullets = []

  // Reset bomb sites
  if (st.bombSites) {
    for (const site of st.bombSites) {
      site.planted = false; site.plantProgress = 0
      site.defuseProgress = 0; site.planter = -1
      site.defuser = -1; site.detonated = false
    }
  }

  // Reset loot bags
  if (st.lootBags) {
    for (const bag of st.lootBags) {
      bag.extracted = false; bag.carrier = -1
      // Reset loot position to original (near center of map)
      const ts = st.tileMap.tileSize
      bag.x = (st.tileMap.w / 2) * ts + (bag.id - 1) * 4
      bag.y = (st.tileMap.h / 2) * ts
    }
  }
}

// ═════════════════════════════════════════════════════════
// Damage helpers
// ═════════════════════════════════════════════════════════
export function applyDamage(st: GameState, s: Soldier, b: Bullet): void {
  if (s.vehicleIndex >= 0) {
    const v = st.vehicles[s.vehicleIndex]
    v.hp -= b.dmg
    if (v.hp <= 0) {
      v.alive = false; v.rider = -1; v.respawnTimer = VEHICLE_RESPAWN
      s.vehicleIndex = -1; s.hp -= 20
    }
  } else {
    let dmg = b.dmg
    if (s.armor > 0) {
      const armorAbs = Math.min(s.armor, dmg * 0.6)
      s.armor -= armorAbs
      dmg -= armorAbs * 0.5
    }
    s.hp -= dmg

    // ── Wound / bleed trigger ──────────────────────────
    if (s.hp > 0 && !s.bleeding && dmg > 8) {
      // Higher damage → higher bleed chance and rate
      const chance = BLEED_CHANCE + (dmg / 100) * 0.3
      if (Math.random() < chance) {
        s.bleeding = true
        s.bleedRate = BLEED_RATE_MIN + (dmg / 100) * (BLEED_RATE_MAX - BLEED_RATE_MIN)
        s.bleedRate = Math.min(s.bleedRate, BLEED_RATE_MAX)
      }
    }
  }
  if (s.hp <= 0) registerKill(st, s, b)
}

export function applySplash(st: GameState, b: Bullet): void {
  const r = b.splash || 4
  for (const s of st.soldiers) {
    if (!s.alive || s.team === b.team) continue
    const d = dist(s, b)
    if (d < r) {
      const falloff = 1 - d / r
      let dmg = b.dmg * falloff
      if (s.armor > 0) {
        const armorAbs = Math.min(s.armor, dmg * 0.6)
        s.armor -= armorAbs
        dmg -= armorAbs * 0.5
      }
      s.hp -= dmg
      if (s.hp <= 0) registerKill(st, s, b)
    }
  }
}

export function registerKill(st: GameState, victim: Soldier, b: Bullet): void {
  victim.alive = false; victim.deaths++
  victim.respawnTimer = RESPAWN_TIME; victim.killStreak = 0

  // BR: permanent elimination
  if (st.mode === 'battle-royale' && st.brState) {
    victim.brEliminated = true
    const aliveNow = st.soldiers.filter(s => s.alive && !s.brEliminated).length
    victim.brPlacement = aliveNow + 1
    st.brState.placements.push(victim.playerIndex)
  }

  // Drop flag if carrying
  if (victim.carryingFlag !== undefined && st.flags) {
    const flag = st.flags.find(f => f.team === victim.carryingFlag)
    if (flag) { flag.carrier = -1; flag.atBase = false }
    victim.carryingFlag = undefined
  }

  // Drop loot if carrying
  if (victim.carryingLoot !== undefined && st.lootBags) {
    const bag = st.lootBags.find(b => b.id === victim.carryingLoot)
    if (bag) { bag.carrier = -1 }
    victim.carryingLoot = undefined
  }

  // VIP killed = cops win
  if (victim.isVip && st.mode === 'escort') {
    st.gameOver = true; st.winTeam = 1
  }

  const killer = st.soldiers.find(k => k.playerIndex === b.owner)
  if (killer) {
    killer.kills++; killer.score += 100; killer.coins++
    killer.killStreak++
    if (killer.killStreak >= 3) killer.score += killer.killStreak * 25
    if (killer.killStreak >= 5) killer.hp = Math.min(killer.maxHp, killer.hp + 30)
  }

  st.killFeed.unshift({ text: `${killer?.name ?? '?'} [${b.weapon || '?'}] ${victim.name}`, time: st.frame })
  if (st.killFeed.length > 6) st.killFeed.pop()
}

// ═════════════════════════════════════════════════════════
// Win conditions
// ═════════════════════════════════════════════════════════
export function checkWinConditions(st: GameState): void {
  if (st.gameOver) return

  switch (st.mode) {
    case 'conquest':
      if (st.tickets[0] <= 0 || st.tickets[1] <= 0) {
        st.gameOver = true; st.winTeam = st.tickets[0] > 0 ? 0 : 1
      }
      break

    case 'coop-assault':
      if (st.capturePoints.every(cp => cp.team === 0)) {
        st.gameOver = true; st.winTeam = 0
      }
      break

    case 'deathmatch':
      for (const s of st.soldiers) {
        if (s.kills >= st.targetKills) {
          st.gameOver = true; st.winTeam = s.team; break
        }
      }
      break

    case 'team-deathmatch': {
      for (let t = 0; t < 2; t++) {
        const teamK = st.soldiers.filter(s => s.team === t).reduce((a, s) => a + s.kills, 0)
        if (teamK >= st.targetKills) { st.gameOver = true; st.winTeam = t }
      }
      break
    }

    case 'bomb':
      // Round timeout: cops win if no bomb planted
      if (st.frame > 3600 && st.bombSites && !st.bombSites.some(s => s.planted)) {
        scoreRound(st, 1)
      }
      // All robbers dead and no bomb planted = cops win
      if (st.soldiers.filter(s => s.team === 0).every(s => !s.alive)
        && st.bombSites && !st.bombSites.some(s => s.planted)) {
        scoreRound(st, 1)
      }
      break

    // heist, ctf, escort, convoy, race, survival handled in main tick

    case 'battle-royale': {
      if (!st.brState) break
      const alive = st.soldiers.filter(s => s.alive && !s.brEliminated)
      if (alive.length <= 1) {
        st.gameOver = true
        if (alive.length === 1) {
          const winner = alive[0]
          winner.brPlacement = 1
          st.winTeam = winner.team
          winner.score += 1000
          winner.stars += 3
          st.killFeed.unshift({ text: `🏆 ${winner.name} wins the Battle Royale! 🐔🍗`, time: st.frame })
          if (st.killFeed.length > 6) st.killFeed.pop()
        } else {
          st.winTeam = -1 // draw
        }
      }
      break
    }
  }
}

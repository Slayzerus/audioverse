/**
 * Weapon customization system — scopes, suppressors, magazines, grips, barrels, stocks, lasers.
 *
 * Each weapon has 7 attachment slots. Attachments modify base weapon stats.
 * Attachments have rarity tiers that determine how good their bonuses are.
 */

import type { WeaponDef } from './constants'

// ─── Attachment Slots ────────────────────────────────────
export type AttachmentSlot =
  | 'scope'
  | 'suppressor'
  | 'magazine'
  | 'grip'
  | 'barrel'
  | 'stock'
  | 'laser'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export const RARITY_COLORS: Record<Rarity, string> = {
  common:    '#aaa',
  uncommon:  '#5f5',
  rare:      '#48f',
  epic:      '#c4f',
  legendary: '#fa0',
}

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

// ─── Stat Modifiers ──────────────────────────────────────
export interface AttachmentMods {
  /** Multiplicative damage modifier (1.0 = no change) */
  dmgMult?: number
  /** Additive range bonus in metres */
  rangeAdd?: number
  /** Multiplicative fire rate modifier (<1 = faster) */
  fireRateMult?: number
  /** Multiplicative spread modifier (<1 = tighter) */
  spreadMult?: number
  /** Multiplicative recoil modifier */
  recoilMult?: number
  /** Additional bullet speed multiplier */
  bulletSpeedMult?: number
  /** Magazine size multiplier for lifetime (more bullets = longer life) */
  lifetimeMult?: number
  /** Suppressed: no muzzle flash, reduced sound reveal */
  suppressed?: boolean
  /** Zoom FOV override (smaller = more zoom) */
  zoomFov?: number
  /** Laser: tighter hipfire spread */
  hipfireSpreadMult?: number
  /** Extra pellets (for shotguns) */
  pelletsAdd?: number
}

// ─── Attachment Definition ───────────────────────────────
export interface AttachmentDef {
  id: string
  name: string
  slot: AttachmentSlot
  rarity: Rarity
  description: string
  icon: string        // emoji
  mods: AttachmentMods
  /** Which weapon names this fits (empty = universal) */
  compatibleWeapons?: string[]
  /** Cost in shop coins */
  cost: number
}

// ═════════════════════════════════════════════════════════
// ALL ATTACHMENTS CATALOG
// ═════════════════════════════════════════════════════════

export const ALL_ATTACHMENTS: AttachmentDef[] = [
  // ─── SCOPES ────────────────────────────────────────────
  { id: 'rds', name: 'Red Dot Sight', slot: 'scope', rarity: 'common',
    description: '1x magnification, cleaner aim', icon: '🔴',
    mods: { spreadMult: 0.9 }, cost: 100 },
  { id: 'holo', name: 'Holographic Sight', slot: 'scope', rarity: 'common',
    description: '1x holo reticle, slight accuracy boost', icon: '🟢',
    mods: { spreadMult: 0.85 }, cost: 150 },
  { id: 'acog', name: 'ACOG 4x', slot: 'scope', rarity: 'uncommon',
    description: '4x magnification, better range', icon: '🔭',
    mods: { spreadMult: 0.7, zoomFov: 30, rangeAdd: 20 }, cost: 350 },
  { id: 'sniper_scope', name: 'Sniper Scope 8x', slot: 'scope', rarity: 'rare',
    description: '8x zoom for long-range elimination', icon: '🎯',
    mods: { spreadMult: 0.4, zoomFov: 15, rangeAdd: 60 }, cost: 800,
    compatibleWeapons: ['Sniper', 'Bandit Rifle', 'Rifle'] },
  { id: 'thermal', name: 'Thermal Scope', slot: 'scope', rarity: 'epic',
    description: '4x thermal imaging, see through smoke', icon: '🌡️',
    mods: { spreadMult: 0.6, zoomFov: 25, rangeAdd: 30 }, cost: 1200 },
  { id: 'hybrid', name: 'Hybrid Sight (1x/6x)', slot: 'scope', rarity: 'legendary',
    description: 'Toggle between 1x and 6x magnification', icon: '💎',
    mods: { spreadMult: 0.5, zoomFov: 20, rangeAdd: 40 }, cost: 2500 },

  // ─── SUPPRESSORS ──────────────────────────────────────
  { id: 'flash_hider', name: 'Flash Hider', slot: 'suppressor', rarity: 'common',
    description: 'Reduces muzzle flash', icon: '🔇',
    mods: { spreadMult: 0.95 }, cost: 80 },
  { id: 'compensator', name: 'Compensator', slot: 'suppressor', rarity: 'uncommon',
    description: 'Reduces vertical recoil', icon: '⬇️',
    mods: { recoilMult: 0.75, spreadMult: 0.9 }, cost: 250 },
  { id: 'lightweight_sup', name: 'Lightweight Suppressor', slot: 'suppressor', rarity: 'rare',
    description: 'Suppressed fire, slight damage loss', icon: '🤫',
    mods: { suppressed: true, dmgMult: 0.92 }, cost: 600 },
  { id: 'heavy_sup', name: 'Heavy Suppressor', slot: 'suppressor', rarity: 'epic',
    description: 'Full suppression, minimal stat loss', icon: '🔕',
    mods: { suppressed: true, dmgMult: 0.96, recoilMult: 0.85 }, cost: 1500 },
  { id: 'monolithic_sup', name: 'Monolithic Suppressor', slot: 'suppressor', rarity: 'legendary',
    description: 'Suppressed + damage boost + range', icon: '🏆',
    mods: { suppressed: true, dmgMult: 1.05, rangeAdd: 15, recoilMult: 0.9 }, cost: 3000 },

  // ─── MAGAZINES ─────────────────────────────────────────
  { id: 'ext_mag_s', name: 'Extended Mag (+25%)', slot: 'magazine', rarity: 'common',
    description: '25% more ammo per magazine', icon: '📦',
    mods: { lifetimeMult: 1.25 }, cost: 100 },
  { id: 'ext_mag_m', name: 'Extended Mag (+50%)', slot: 'magazine', rarity: 'uncommon',
    description: '50% more ammo, slightly slower reload', icon: '📦',
    mods: { lifetimeMult: 1.5, fireRateMult: 1.05 }, cost: 300 },
  { id: 'drum_mag', name: 'Drum Magazine (+100%)', slot: 'magazine', rarity: 'rare',
    description: 'Double capacity, heavier handling', icon: '🥁',
    mods: { lifetimeMult: 2.0, fireRateMult: 1.15 }, cost: 700 },
  { id: 'fast_mag', name: 'Fast Mag', slot: 'magazine', rarity: 'uncommon',
    description: 'Faster reload speed', icon: '⚡',
    mods: { fireRateMult: 0.85 }, cost: 250 },
  { id: 'ap_rounds', name: 'Armor-Piercing Rounds', slot: 'magazine', rarity: 'epic',
    description: '+15% damage, ignores some armor', icon: '🔩',
    mods: { dmgMult: 1.15 }, cost: 1200 },
  { id: 'hollow_point', name: 'Hollow Point Rounds', slot: 'magazine', rarity: 'legendary',
    description: '+25% damage to flesh, less vs armor', icon: '💀',
    mods: { dmgMult: 1.25 }, cost: 2800 },

  // ─── GRIPS ─────────────────────────────────────────────
  { id: 'vertical_grip', name: 'Vertical Foregrip', slot: 'grip', rarity: 'common',
    description: 'Better recoil control', icon: '✊',
    mods: { recoilMult: 0.8 }, cost: 120 },
  { id: 'angled_grip', name: 'Angled Foregrip', slot: 'grip', rarity: 'uncommon',
    description: 'Faster ADS + reduced spread', icon: '📐',
    mods: { spreadMult: 0.85, recoilMult: 0.9 }, cost: 280 },
  { id: 'stubby_grip', name: 'Stubby Grip', slot: 'grip', rarity: 'rare',
    description: 'Strong recoil reduction', icon: '🤏',
    mods: { recoilMult: 0.65, spreadMult: 0.9 }, cost: 600 },
  { id: 'ranger_grip', name: 'Ranger Foregrip', slot: 'grip', rarity: 'epic',
    description: 'All-round handling improvement', icon: '🫱',
    mods: { recoilMult: 0.7, spreadMult: 0.8, fireRateMult: 0.95 }, cost: 1100 },

  // ─── BARRELS ───────────────────────────────────────────
  { id: 'short_barrel', name: 'Short Barrel', slot: 'barrel', rarity: 'common',
    description: 'Faster handling, less range', icon: '🔧',
    mods: { fireRateMult: 0.9, rangeAdd: -10, bulletSpeedMult: 0.9 }, cost: 80 },
  { id: 'long_barrel', name: 'Long Barrel', slot: 'barrel', rarity: 'uncommon',
    description: 'More range and bullet velocity', icon: '📏',
    mods: { rangeAdd: 25, bulletSpeedMult: 1.15, fireRateMult: 1.05 }, cost: 300 },
  { id: 'heavy_barrel', name: 'Heavy Barrel', slot: 'barrel', rarity: 'rare',
    description: 'More damage and range, slower fire', icon: '🏋️',
    mods: { dmgMult: 1.1, rangeAdd: 30, fireRateMult: 1.12, bulletSpeedMult: 1.1 }, cost: 650 },
  { id: 'precision_barrel', name: 'Precision Barrel', slot: 'barrel', rarity: 'epic',
    description: 'Excellent accuracy and range', icon: '🎯',
    mods: { spreadMult: 0.65, rangeAdd: 35, bulletSpeedMult: 1.2, recoilMult: 0.85 }, cost: 1400 },
  { id: 'rapid_barrel', name: 'Rapid-Fire Barrel', slot: 'barrel', rarity: 'legendary',
    description: 'Insane fire rate, slight accuracy loss', icon: '🔥',
    mods: { fireRateMult: 0.7, spreadMult: 1.15, recoilMult: 1.1 }, cost: 2200 },

  // ─── STOCKS ────────────────────────────────────────────
  { id: 'no_stock', name: 'No Stock', slot: 'stock', rarity: 'common',
    description: 'Faster movement, more recoil', icon: '🏃',
    mods: { recoilMult: 1.2 }, cost: 50 },
  { id: 'padded_stock', name: 'Padded Stock', slot: 'stock', rarity: 'uncommon',
    description: 'Reduced flinch and recoil', icon: '🛡️',
    mods: { recoilMult: 0.8 }, cost: 200 },
  { id: 'sniper_stock', name: 'Sniper Stock', slot: 'stock', rarity: 'rare',
    description: 'Maximum stability for sniping', icon: '🔩',
    mods: { recoilMult: 0.6, spreadMult: 0.75, fireRateMult: 1.08 }, cost: 550,
    compatibleWeapons: ['Sniper', 'Rifle', 'Bandit Rifle'] },
  { id: 'tactical_stock', name: 'Tactical Stock', slot: 'stock', rarity: 'epic',
    description: 'Balanced improvement to all handling', icon: '🎖️',
    mods: { recoilMult: 0.75, spreadMult: 0.85 }, cost: 900 },

  // ─── LASERS ────────────────────────────────────────────
  { id: 'tac_laser', name: 'Tactical Laser', slot: 'laser', rarity: 'common',
    description: 'Visible laser, tighter hipfire', icon: '🔴',
    mods: { hipfireSpreadMult: 0.8 }, cost: 100 },
  { id: 'ir_laser', name: 'IR Laser', slot: 'laser', rarity: 'uncommon',
    description: 'Infrared laser, moderate hipfire boost', icon: '🟠',
    mods: { hipfireSpreadMult: 0.7, spreadMult: 0.95 }, cost: 250 },
  { id: 'green_laser', name: 'Green Laser Pointer', slot: 'laser', rarity: 'rare',
    description: 'High-vis laser, strong hipfire accuracy', icon: '🟢',
    mods: { hipfireSpreadMult: 0.6, spreadMult: 0.9 }, cost: 500 },
  { id: 'mlaser', name: 'Master Laser Module', slot: 'laser', rarity: 'legendary',
    description: 'Best-in-class target acquisition', icon: '💚',
    mods: { hipfireSpreadMult: 0.5, spreadMult: 0.85, recoilMult: 0.9 }, cost: 2000 },
]

// ─── Weapon Loadout ──────────────────────────────────────
export interface WeaponLoadout {
  weaponName: string
  /** Equipped attachments by slot */
  attachments: Partial<Record<AttachmentSlot, string>>  // slot → attachmentId
}

export interface PlayerLoadout {
  /** Up to 5 weapon loadouts */
  loadouts: WeaponLoadout[]
  /** Currently selected loadout index */
  activeLoadout: number
}

// ─── Default loadout (no attachments) ────────────────────
export function createDefaultLoadout(weapons: string[]): PlayerLoadout {
  return {
    loadouts: weapons.map(w => ({ weaponName: w, attachments: {} })),
    activeLoadout: 0,
  }
}

// ─── Apply attachment modifiers to a weapon ──────────────
export function applyAttachments(baseDef: WeaponDef, loadout: WeaponLoadout): WeaponDef {
  const w = { ...baseDef }
  const slots = Object.values(loadout.attachments)

  for (const attId of slots) {
    if (!attId) continue
    const att = ALL_ATTACHMENTS.find(a => a.id === attId)
    if (!att) continue
    const m = att.mods

    if (m.dmgMult)          w.dmg = Math.round(w.dmg * m.dmgMult)
    if (m.rangeAdd)         w.range += m.rangeAdd
    if (m.fireRateMult)     w.fireRate = Math.round(w.fireRate * m.fireRateMult)
    if (m.bulletSpeedMult)  w.bulletSpeed *= m.bulletSpeedMult
    if (m.lifetimeMult)     w.lifetime = Math.round(w.lifetime * m.lifetimeMult)
    if (m.spreadMult)       w.spread = (w.spread || 0.02) * m.spreadMult
    if (m.pelletsAdd)       w.pellets = (w.pellets || 1) + m.pelletsAdd
    // recoilMult, suppressed, zoomFov, hipfireSpreadMult are passed through to engine
  }

  return w
}

// ─── Get combined recoil modifier from attachments ───────
export function getAttachmentRecoilMult(loadout: WeaponLoadout): number {
  let mult = 1.0
  for (const attId of Object.values(loadout.attachments)) {
    if (!attId) continue
    const att = ALL_ATTACHMENTS.find(a => a.id === attId)
    if (att?.mods.recoilMult) mult *= att.mods.recoilMult
  }
  return mult
}

// ─── Check if weapon is suppressed ───────────────────────
export function isSuppressed(loadout: WeaponLoadout): boolean {
  for (const attId of Object.values(loadout.attachments)) {
    if (!attId) continue
    const att = ALL_ATTACHMENTS.find(a => a.id === attId)
    if (att?.mods.suppressed) return true
  }
  return false
}

// ─── Get attachments for a specific slot ─────────────────
export function getAttachmentsForSlot(slot: AttachmentSlot, weaponName?: string): AttachmentDef[] {
  return ALL_ATTACHMENTS.filter(a => {
    if (a.slot !== slot) return false
    if (a.compatibleWeapons && weaponName && !a.compatibleWeapons.includes(weaponName)) return false
    return true
  })
}

// ─── Random attachments for bot loadouts ─────────────────
export function randomBotLoadout(weapons: string[]): PlayerLoadout {
  const loadouts: WeaponLoadout[] = weapons.map(wName => {
    const lo: WeaponLoadout = { weaponName: wName, attachments: {} }
    // Bots get 0-3 random common/uncommon attachments
    const count = Math.floor(Math.random() * 4)
    const slots: AttachmentSlot[] = ['scope', 'suppressor', 'magazine', 'grip', 'barrel', 'stock', 'laser']
    const shuffled = slots.sort(() => Math.random() - 0.5).slice(0, count)
    for (const slot of shuffled) {
      const options = getAttachmentsForSlot(slot, wName)
        .filter(a => a.rarity === 'common' || a.rarity === 'uncommon')
      if (options.length > 0) {
        lo.attachments[slot] = options[Math.floor(Math.random() * options.length)].id
      }
    }
    return lo
  })
  return { loadouts, activeLoadout: 0 }
}

// ─── Attachment count ────────────────────────────────────
export function countAttachments(loadout: WeaponLoadout): number {
  return Object.values(loadout.attachments).filter(Boolean).length
}

/**
 * GameHUD.tsx — In-game HUD overlay for Flatworld Survival.
 * Shows health/hunger bars, hotbar, day/night, wave/score info.
 */

import { useTranslation } from 'react-i18next'
import { type FlatWorldState, ITEMS, BLOCKS, DAY_LENGTH, NOON, DUSK, MIDNIGHT, VEHICLE_DEFS } from './types'
import css from './FlatworldGame.module.css'

// ─── Time Formatting ──────────────────────────────────────
function formatTime(time: number): string {
  // Convert game time (0-24000) to clock (06:00 = dawn)
  const hours = Math.floor(((time / DAY_LENGTH) * 24 + 6) % 24)
  const mins = Math.floor(((time / DAY_LENGTH) * 24 * 60) % 60)
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function getTimeEmoji(time: number): string {
  if (time < 3000) return '🌅'       // sunrise
  if (time < NOON) return '☀️'       // morning
  if (time < DUSK - 2000) return '☀️' // afternoon
  if (time < DUSK) return '🌅'       // sunset
  if (time < MIDNIGHT) return '🌙'    // night
  return '🌙'                         // late night
}

// ─── Item Icon ────────────────────────────────────────────
export function ItemIcon({ itemId, size = 28 }: { itemId: number; size?: number }) {
  const item = ITEMS[itemId]
  const block = BLOCKS[itemId]
  const color = item?.color || block?.color || '#555'
  const name = item?.name || block?.name || ''

  return (
    <div
      style={{
        width: size, height: size, borderRadius: 2,
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, color: '#fff', textShadow: '0 0 2px #000',
        fontWeight: 700,
      }}
      title={name}
    >
      {name.charAt(0)}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────
interface HUDProps {
  state: FlatWorldState
  activePlayer: number
  onHotbarSelect: (index: number) => void
  onOpenInventory: () => void
}

export default function GameHUD({ state, activePlayer, onHotbarSelect, onOpenInventory }: HUDProps) {
  const { t } = useTranslation()
  const p = state.players[activePlayer]
  if (!p) return null

  const { config } = state
  const isSurvival = config.mode === 'survival' || config.mode === 'coop-survival'

  // Vehicle info
  const vehicle = p.vehicleId >= 0 ? state.vehicles.find(v => v.id === p.vehicleId) : null
  const vehicleDef = vehicle ? VEHICLE_DEFS[vehicle.type] : null

  return (
    <div className={css.hud}>
      {/* Health & Hunger bars */}
      <div className={css.bars}>
        <div className={css.bar}>
          <div className={`${css.barFill} ${css.barHealth}`} style={{ width: `${(p.hp / p.maxHp) * 100}%` }} />
          <span className={css.barLabel}>❤ {p.hp}/{p.maxHp}</span>
        </div>
        {isSurvival && (
          <div className={css.bar}>
            <div className={`${css.barFill} ${css.barHunger}`} style={{ width: `${(p.hunger / p.maxHunger) * 100}%` }} />
            <span className={css.barLabel}>🍖 {p.hunger}/{p.maxHunger}</span>
          </div>
        )}
      </div>

      {/* Stance indicator */}
      {p.stance !== 'standing' && (
        <div style={{
          position: 'absolute', top: 8, left: 200, fontSize: 11,
          color: p.stance === 'prone' ? '#f80' : '#8cf', textShadow: '0 0 4px #000',
        }}>
          {p.stance === 'crouching' ? `🧎 ${t('miniGames.crouching', 'Crouching')}` : `🛌 ${t('miniGames.proneStance', 'Prone')}`}
        </div>
      )}

      {/* Vehicle HUD */}
      {vehicle && vehicleDef && (
        <div style={{
          position: 'absolute', top: 60, left: 8, fontSize: 11,
          background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 4,
          textShadow: '0 0 4px #000',
        }}>
          <div>🚗 {t(`miniGames.${vehicle.type}`, vehicleDef.name)}</div>
          <div className={css.bar} style={{ width: 120, height: 6, marginTop: 2 }}>
            <div className={`${css.barFill}`} style={{
              width: `${(vehicle.hp / vehicle.maxHp) * 100}%`,
              background: vehicle.hp / vehicle.maxHp > 0.3 ? '#0c0' : '#f00',
            }} />
          </div>
          <div style={{ marginTop: 2 }}>⛽ {t('miniGames.fuel', 'Fuel')}: {Math.ceil(vehicle.fuel / 60)}s</div>
          {!vehicleDef.flying && !vehicleDef.watercraft && (
            <div>↔ {t('miniGames.stance', 'Tilt')}: {vehicle.tilt > 0 ? '→' : vehicle.tilt < 0 ? '←' : '•'}</div>
          )}
        </div>
      )}

      {/* Day/Night */}
      {isSurvival && (
        <div className={css.timeInfo}>
          <div className={css.timeIcon}>{getTimeEmoji(state.time)}</div>
          <div>{formatTime(state.time)}</div>
          <div style={{ fontSize: 10, opacity: 0.6 }}>{t('miniGames.day', 'Day')} {Math.floor(state.frame / DAY_LENGTH) + 1}</div>
        </div>
      )}

      {/* Score / Wave info */}
      {config.mode === 'deathmatch' || config.mode === 'team-deathmatch' ? (
        <div className={css.scoreInfo}>
          <div className={css.scoreboard}>
            {state.players.map(sp => (
              <div key={sp.index} className={`${css.scoreItem} ${!sp.alive ? css.dead : ''}`}>
                <span className={css.scoreColor} style={{ background: sp.color }} />
                <span>{sp.name}</span>
                <span className={css.scoreValue}>{sp.kills}/{config.killsToWin}</span>
              </div>
            ))}
          </div>
        </div>
      ) : config.mode === 'coop-survival' ? (
        <div className={css.scoreInfo}>
          <div className={css.waveInfo}>{t('miniGames.wave', 'Wave')} {state.waveNum}</div>
          <div className={css.scoreboard}>
            {state.players.map(sp => (
              <div key={sp.index} className={`${css.scoreItem} ${!sp.alive ? css.dead : ''}`}>
                <span className={css.scoreColor} style={{ background: sp.color }} />
                <span>{sp.name}: ☠{sp.deaths}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Currency (survival) */}
      {isSurvival && (
        <div style={{ position: 'absolute', bottom: 56, right: 8, fontSize: 12, textShadow: '0 0 4px #000' }}>
          🪙{p.coins} 💎{p.gems} ⭐{p.stars}
        </div>
      )}

      {/* Hotbar */}
      <div className={css.hotbar}>
        {Array.from({ length: 10 }, (_, i) => {
          const slot = p.inventory[i]
          const hasItem = slot && slot.id >= 0
          return (
            <div
              key={i}
              className={`${css.hotbarSlot} ${i === p.hotbar ? css.hotbarActive : ''}`}
              onClick={() => onHotbarSelect(i)}
              onDoubleClick={onOpenInventory}
            >
              <span className={css.slotKey}>{i === 9 ? 0 : i + 1}</span>
              {hasItem && <ItemIcon itemId={slot.id} />}
              {hasItem && slot.count > 1 && <span className={css.slotCount}>{slot.count}</span>}
            </div>
          )
        })}
      </div>

      {/* Held item name */}
      {p.inventory[p.hotbar]?.id >= 0 && (
        <div style={{
          position: 'absolute', bottom: 56, left: '50%', transform: 'translateX(-50%)',
          fontSize: 11, opacity: 0.7, textShadow: '0 0 4px #000',
        }}>
          {ITEMS[p.inventory[p.hotbar].id]?.name || BLOCKS[p.inventory[p.hotbar].id]?.name || ''}
        </div>
      )}

      {/* Boss HP bar */}
      {state.bossAlive && (() => {
        const boss = state.enemies.find(e => e.alive && (e.type === 'zombie_king' || e.type === 'mech_boss'))
        if (!boss) return null
        const def = { zombie_king: { name: 'Zombie King' }, mech_boss: { name: 'Mech Overlord' } }[boss.type]
        return (
          <div style={{
            position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)',
            width: 300, textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f44', marginBottom: 4 }}>
              💀 {def?.name || boss.type}
            </div>
            <div className={css.bar} style={{ height: 10 }}>
              <div className={`${css.barFill} ${css.barHealth}`} style={{ width: `${(boss.hp / boss.maxHp) * 100}%` }} />
            </div>
          </div>
        )
      })()}
    </div>
  )
}



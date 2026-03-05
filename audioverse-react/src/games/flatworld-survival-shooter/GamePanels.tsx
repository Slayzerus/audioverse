/**
 * GamePanels.tsx — Inventory and Crafting panels for Flatworld Survival.
 */

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ITEMS, BLOCKS, RECIPES, type FlatWorldState, type InvSlot, type Recipe,
} from './types'
import {
  getAvailableStation, craftRecipe,
  addToInventory, countInInventory,
} from './gameState'
import { ItemIcon } from './GameHUD'
import css from './FlatworldGame.module.css'

// ─── Inventory Panel ──────────────────────────────────────
interface InventoryPanelProps {
  state: FlatWorldState
  activePlayer: number
  onClose: () => void
}

export function InventoryPanel({ state, activePlayer, onClose }: InventoryPanelProps) {
  const { t } = useTranslation()
  const p = state.players[activePlayer]
  if (!p) return null

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [heldItem, setHeldItem] = useState<InvSlot | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; item: number } | null>(null)

  const ww = state.config.worldWidth
  const wh = state.config.worldHeight

  const stations = useMemo(
    () => getAvailableStation(p, state.world, ww, wh),
    [p, state.world, ww, wh]
  )

  const allRecipes = useMemo(() => {
    // Show all recipes (available ones first, then unavailable grayed out)
    return RECIPES.filter(r => stations.has(r.station)).map(r => ({
      recipe: r,
      canCraft: r.ingredients.every(([id, cnt]) => countInInventory(p.inventory, id) >= cnt),
    }))
  }, [p.inventory, stations])

  // Slot click: pick up / put down
  const handleSlotClick = useCallback((index: number) => {
    if (heldItem) {
      // Put down
      const slot = p.inventory[index]
      if (slot.id < 0 || slot.id === heldItem.id) {
        const maxStack = ITEMS[heldItem.id]?.stackSize ?? 99
        const space = slot.id < 0 ? maxStack : maxStack - slot.count
        const add = Math.min(heldItem.count, space)
        if (add > 0) {
          slot.id = heldItem.id
          slot.count += add
          heldItem.count -= add
          if (heldItem.count <= 0) setHeldItem(null)
        }
      } else {
        // Swap
        const temp = { id: slot.id, count: slot.count }
        slot.id = heldItem.id
        slot.count = heldItem.count
        setHeldItem(temp)
      }
    } else {
      // Pick up
      const slot = p.inventory[index]
      if (slot.id >= 0) {
        setHeldItem({ id: slot.id, count: slot.count })
        slot.id = -1
        slot.count = 0
      }
    }
    setSelectedSlot(index)
  }, [heldItem, p.inventory])

  const handleCraft = useCallback((recipe: Recipe) => {
    craftRecipe(p, recipe)
  }, [p])

  const handleArmorClick = useCallback((slotIdx: number) => {
    const armorId = p.armor[slotIdx]
    if (armorId >= 0) {
      // Unequip
      addToInventory(p.inventory, armorId, 1)
      p.armor[slotIdx] = -1
    } else if (heldItem && ITEMS[heldItem.id]?.armorSlot) {
      const def = ITEMS[heldItem.id]
      const targetSlot = def.armorSlot === 'head' ? 0 : def.armorSlot === 'chest' ? 1 : 2
      if (targetSlot === slotIdx) {
        p.armor[slotIdx] = heldItem.id
        heldItem.count--
        if (heldItem.count <= 0) setHeldItem(null)
      }
    }
  }, [p, heldItem])

  const getItemName = (id: number) => ITEMS[id]?.name || BLOCKS[id]?.name || '?'

  return (
    <div className={css.panelOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={css.panel} style={{ position: 'relative' }}>
        <h3 className={css.panelTitle}>📦 {t('miniGames.inventory', 'Inventory')} & {t('miniGames.crafting', 'Crafting')}</h3>
        <button className={css.panelClose} onClick={onClose}>✕</button>

        {/* Armor */}
        <div className={css.invSection}>
          <div className={css.invLabel}>{t('miniGames.armor', 'Armor')}</div>
          <div className={css.armorRow}>
            {(['🪖 Head', '🛡️ Chest', '👖 Legs'] as const).map((label, i) => (
              <div key={i} className={css.armorSlot} onClick={() => handleArmorClick(i)}>
                <span className={css.armorLabel}>{label.split(' ')[0]}</span>
                {p.armor[i] >= 0 && <ItemIcon itemId={p.armor[i]} size={32} />}
              </div>
            ))}
            <div style={{ marginLeft: 12, fontSize: 11, color: '#aaa', alignSelf: 'center' }}>
              🛡️ Total: {p.armor.reduce((s, id) => s + (id >= 0 ? (ITEMS[id]?.armor || 0) : 0), 0)}
            </div>
          </div>
        </div>

        {/* Hotbar */}
        <div className={css.invSection}>
          <div className={css.invLabel}>{t('miniGames.hotbarLabel', 'Hotbar')}</div>
          <div className={css.invGrid}>
            {p.inventory.slice(0, 10).map((slot, i) => (
              <div
                key={i}
                className={`${css.invSlot} ${i === selectedSlot ? css.invSlotSelected : ''}`}
                onClick={() => handleSlotClick(i)}
                onMouseEnter={(e) => slot.id >= 0 && setTooltip({ x: e.clientX, y: e.clientY, item: slot.id })}
                onMouseLeave={() => setTooltip(null)}
              >
                {slot.id >= 0 && <ItemIcon itemId={slot.id} size={24} />}
                {slot.id >= 0 && slot.count > 1 && <span className={css.slotCount}>{slot.count}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Backpack */}
        <div className={css.invSection}>
          <div className={css.invLabel}>{t('miniGames.backpack', 'Backpack')}</div>
          <div className={css.invGrid}>
            {p.inventory.slice(10).map((slot, i) => (
              <div
                key={i + 10}
                className={`${css.invSlot} ${(i + 10) === selectedSlot ? css.invSlotSelected : ''}`}
                onClick={() => handleSlotClick(i + 10)}
                onMouseEnter={(e) => slot.id >= 0 && setTooltip({ x: e.clientX, y: e.clientY, item: slot.id })}
                onMouseLeave={() => setTooltip(null)}
              >
                {slot.id >= 0 && <ItemIcon itemId={slot.id} size={24} />}
                {slot.id >= 0 && slot.count > 1 && <span className={css.slotCount}>{slot.count}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Held item indicator */}
        {heldItem && (
          <div style={{
            position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)', padding: '4px 12px', borderRadius: 4, fontSize: 12,
            border: '1px solid #f1c40f', zIndex: 200,
          }}>
            {t('miniGames.holding', 'Holding')}: {getItemName(heldItem.id)} x{heldItem.count} — {t('miniGames.clickToPlace', 'click a slot to place')}
          </div>
        )}

        {/* Crafting */}
        <div className={css.craftSection}>
          <div className={css.craftTitle}>
            ⚒️ {t('miniGames.crafting', 'Crafting')}
            <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>
              {t('miniGames.stations', 'Stations')}: {[...stations].join(', ')}
            </span>
          </div>
          <div className={css.craftList}>
            {allRecipes.length === 0 && (
              <div style={{ color: '#666', fontSize: 12, padding: 8 }}>
                {t('miniGames.noRecipes', 'No recipes available. Place a Workbench, Furnace, or Anvil nearby.')}
              </div>
            )}
            {allRecipes.map(({ recipe: r, canCraft }, idx) => (
              <div key={idx} className={css.craftItem} style={{ opacity: canCraft ? 1 : 0.4 }}>
                <div className={css.craftItemIcon}>
                  <ItemIcon itemId={r.result} size={28} />
                </div>
                <div className={css.craftItemInfo}>
                  <div className={css.craftItemName}>
                    {getItemName(r.result)} x{r.count}
                  </div>
                  <div className={css.craftItemMats}>
                    {r.ingredients.map(([id, cnt], j) => (
                      <span key={j}>
                        {j > 0 ? ' + ' : ''}
                        {getItemName(id)} x{cnt}
                        ({countInInventory(p.inventory, id)})
                      </span>
                    ))}
                    <span style={{ color: '#666' }}> [{r.station}]</span>
                  </div>
                </div>
                <button
                  className={`${css.craftBtn} ${!canCraft ? css.craftBtnDisabled : ''}`}
                  onClick={() => canCraft && handleCraft(r)}
                  disabled={!canCraft}
                >
                  {t('miniGames.craftBtn', 'Craft')}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div className={css.tooltip} style={{ left: tooltip.x + 10, top: tooltip.y - 40, position: 'fixed' }}>
            <div className={css.tooltipName}>{getItemName(tooltip.item)}</div>
            {ITEMS[tooltip.item]?.damage && (
              <div className={css.tooltipStat}>⚔️ Damage: {ITEMS[tooltip.item].damage}</div>
            )}
            {ITEMS[tooltip.item]?.mineSpeed && (
              <div className={css.tooltipStat}>⛏️ Mine Speed: {ITEMS[tooltip.item].mineSpeed}x</div>
            )}
            {ITEMS[tooltip.item]?.armor && (
              <div className={css.tooltipStat}>🛡️ Armor: {ITEMS[tooltip.item].armor}</div>
            )}
            {ITEMS[tooltip.item]?.heal && (
              <div className={css.tooltipStat}>❤ Heal: +{ITEMS[tooltip.item].heal}</div>
            )}
            {ITEMS[tooltip.item]?.hunger && (
              <div className={css.tooltipStat}>🍖 Hunger: +{ITEMS[tooltip.item].hunger}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

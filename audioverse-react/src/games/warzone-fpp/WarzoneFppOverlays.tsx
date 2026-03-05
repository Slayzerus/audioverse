import React from 'react'
import type { GameState } from './types'
import {
  ALL_ATTACHMENTS, type AttachmentSlot,
  getAttachmentsForSlot, RARITY_COLORS,
} from './weaponCustomization'
import {
  buyShopItem, generateShopItems,
  type CareerState, type LootboxResult,
} from './shopAndCareer'

interface WarzoneFppOverlaysProps {
  showShop: boolean
  setShowShop: (v: boolean) => void
  showLoadout: boolean
  setShowLoadout: (v: boolean) => void
  career: CareerState
  setCareer: React.Dispatch<React.SetStateAction<CareerState>>
  shopMessage: string
  setShopMessage: (msg: string) => void
  lootResult: LootboxResult | null
  setLootResult: (r: LootboxResult | null) => void
  editingWeapon: string | null
  setEditingWeapon: (w: string | null) => void
  tempLoadout: Record<string, Record<string, string>>
  setTempLoadout: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>
  shopItems: React.MutableRefObject<ReturnType<typeof generateShopItems>>
  stateRef: React.MutableRefObject<GameState>
}

export default function WarzoneFppOverlays(props: WarzoneFppOverlaysProps) {
  const {
    showShop, setShowShop, showLoadout, setShowLoadout,
    career, setCareer, shopMessage, setShopMessage,
    lootResult, setLootResult, editingWeapon, setEditingWeapon,
    tempLoadout, setTempLoadout, shopItems, stateRef,
  } = props

  return (
    <>
      {/* ── Shop Overlay ─────────────────────────────── */}
      {showShop && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 25,
          background: '#000c', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          paddingTop: 40, overflow: 'auto',
        }}>
          <div style={{
            background: '#1a1a2e', borderRadius: 12, padding: 20, minWidth: 500, maxWidth: 700,
            maxHeight: '85vh', overflow: 'auto', color: '#fff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{'\uD83D\uDED2'} Shop</h2>
              <button onClick={() => setShowShop(false)} style={{
                background: '#333', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer',
              }}>Close [P]</button>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14, fontSize: 13 }}>
              <span style={{ color: '#ff0' }}>{'\uD83D\uDCB0'} {career.coins} coins</span>
              <span style={{ color: '#4df' }}>{'\uD83D\uDC8E'} {career.gems} gems</span>
            </div>
            {shopMessage && (
              <div style={{ background: '#2a4', color: '#fff', padding: 6, borderRadius: 4, marginBottom: 8, fontSize: 12 }}>
                {shopMessage}
              </div>
            )}
            {lootResult && (
              <div style={{ background: '#224', padding: 8, borderRadius: 6, marginBottom: 10 }}>
                <div style={{ fontSize: 13, color: '#fa0', marginBottom: 4 }}>Lootbox Results:</div>
                {lootResult.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: RARITY_COLORS[item.rarity] }}>
                    {item.icon} {item.name} ({item.rarity})
                  </div>
                ))}
                {lootResult.duplicateCoinsRefund > 0 && (
                  <div style={{ fontSize: 11, color: '#aa8' }}>+{lootResult.duplicateCoinsRefund} coins from duplicates</div>
                )}
                <button onClick={() => setLootResult(null)} style={{
                  marginTop: 4, background: '#444', color: '#fff', border: 'none', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: 11,
                }}>OK</button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {shopItems.current.map(item => (
                <div key={item.id} style={{
                  background: '#222', borderRadius: 8, padding: 10, border: '1px solid #333',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ fontSize: 22 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 'bold' }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>{item.description}</div>
                  <div style={{ display: 'flex', gap: 6, fontSize: 11, marginTop: 'auto' }}>
                    {item.costCoins > 0 && <span style={{ color: '#ff0' }}>{'\uD83D\uDCB0'}{item.costCoins}</span>}
                    {item.costGems > 0 && <span style={{ color: '#4df' }}>{'\uD83D\uDC8E'}{item.costGems}</span>}
                  </div>
                  <button onClick={() => {
                    setCareer(prev => {
                      const next = { ...prev, ownedAttachments: new Set(prev.ownedAttachments), boosts: new Map(prev.boosts) }
                      const result = buyShopItem(next, item)
                      setShopMessage(result.message)
                      if (result.lootboxResult) setLootResult(result.lootboxResult)
                      setTimeout(() => setShopMessage(''), 3000)
                      return next
                    })
                  }} style={{
                    background: '#48f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px',
                    cursor: 'pointer', fontSize: 11, fontWeight: 'bold',
                  }}>
                    Buy
                  </button>
                </div>
              ))}
            </div>
            {/* Owned attachments */}
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14, color: '#aaa', margin: '0 0 6px' }}>Owned Attachments ({career.ownedAttachments.size})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {Array.from(career.ownedAttachments).map(id => {
                  const att = ALL_ATTACHMENTS.find(a => a.id === id)
                  if (!att) return null
                  return (
                    <span key={id} style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 3,
                      background: '#333', color: RARITY_COLORS[att.rarity],
                    }}>
                      {att.icon} {att.name}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Loadout Editor Overlay ────────────────────── */}
      {showLoadout && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 25,
          background: '#000c', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          paddingTop: 40, overflow: 'auto',
        }}>
          <div style={{
            background: '#1a1a2e', borderRadius: 12, padding: 20, minWidth: 500, maxWidth: 700,
            maxHeight: '85vh', overflow: 'auto', color: '#fff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{'\uD83D\uDD27'} Weapon Loadout</h2>
              <button onClick={() => { setShowLoadout(false); setEditingWeapon(null) }} style={{
                background: '#333', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer',
              }}>Close [L]</button>
            </div>
            <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 10px' }}>
              Customize each weapon with attachments. Changes apply on next respawn.
            </p>
            {/* Weapon list */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {(stateRef.current.soldiers[0]?.weapons ?? []).map((wName: string) => (
                <button key={wName} onClick={() => {
                  setEditingWeapon(wName)
                  setTempLoadout(prev => ({ ...prev, [wName]: prev[wName] ?? { ...(stateRef.current.soldiers[0]?.loadout[wName] ?? {}) } }))
                }} style={{
                  background: editingWeapon === wName ? '#48f' : '#333',
                  color: '#fff', border: '1px solid #555', borderRadius: 6, padding: '6px 12px',
                  cursor: 'pointer', fontSize: 12, fontWeight: editingWeapon === wName ? 'bold' : 'normal',
                }}>
                  {wName}
                </button>
              ))}
            </div>
            {/* Slot editor */}
            {editingWeapon && (() => {
              const slots: AttachmentSlot[] = ['scope', 'suppressor', 'magazine', 'grip', 'barrel', 'stock', 'laser']
              const current = tempLoadout[editingWeapon] ?? {}
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {slots.map(slot => {
                    const options = getAttachmentsForSlot(slot, editingWeapon).filter(a => career.ownedAttachments.has(a.id))
                    const selected = current[slot]
                    return (
                      <div key={slot} style={{
                        background: '#222', borderRadius: 6, padding: 8,
                        border: selected ? '1px solid #48f' : '1px solid #333',
                      }}>
                        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>{slot}</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <button onClick={() => {
                            setTempLoadout(prev => {
                              const copy = { ...prev, [editingWeapon!]: { ...prev[editingWeapon!] } }
                              delete copy[editingWeapon!][slot]
                              return copy
                            })
                          }} style={{
                            background: !selected ? '#555' : '#333', color: '#aaa', border: 'none',
                            borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 10,
                          }}>
                            None
                          </button>
                          {options.map(att => (
                            <button key={att.id} onClick={() => {
                              setTempLoadout(prev => ({
                                ...prev, [editingWeapon!]: { ...prev[editingWeapon!], [slot]: att.id },
                              }))
                            }} style={{
                              background: selected === att.id ? '#48f' : '#333',
                              color: RARITY_COLORS[att.rarity], border: 'none', borderRadius: 4,
                              padding: '3px 8px', cursor: 'pointer', fontSize: 10,
                            }}>
                              {att.icon} {att.name}
                            </button>
                          ))}
                          {options.length === 0 && <span style={{ fontSize: 10, color: '#666' }}>No owned attachments for this slot</span>}
                        </div>
                      </div>
                    )
                  })}
                  <button onClick={() => {
                    // Apply loadout to soldier
                    const s = stateRef.current.soldiers[0]
                    if (s) {
                      s.loadout = { ...s.loadout, ...tempLoadout }
                    }
                    setShowLoadout(false)
                    setEditingWeapon(null)
                  }} style={{
                    background: '#4a4', color: '#fff', border: 'none', borderRadius: 6,
                    padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 'bold',
                    alignSelf: 'center', marginTop: 8,
                  }}>
                    {'\u2705'} Apply Loadout
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
}

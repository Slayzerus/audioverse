/**
 * CardEditor — Create, edit, delete and manage custom card decks for Eight Minute Empire.
 * Cards are persisted to localStorage and can be exported/imported as JSON.
 */
import { useCallback, useState } from 'react'
import {
  CARD_TEMPLATES,
  ALL_ABILITIES,
  ALL_ACTIONS,
  ABILITY_LABELS,
  type CardDef,
  type CardAction,
  type SpecialAbility,
} from './DangeZoneGame'
import styles from './SharedGame.module.css'

const LS_KEY = 'eme-custom-cards'

type CardTemplate = Omit<CardDef, 'id'>

const EMOJIS = [
  '⚔️','🛡️','📯','🏰','💂','🙋','📦','📜','👑',
  '🚶','🏇','🧭','🔭','⛵','🏃','💨','🔙','🚢','🤝','🐎','↗️','👁️',
  '🏘️','🏗️','🏪','⛩️','⛏️','🪵','🏜️','🏯','🏬','⚓','🎓','📚','🕍',
  '💥','🔥','🗡️','💰','🥷','💣','☠️','⚡','🌋','🕵️',
  '🐉','🧙','🗝️','🏹','👸','🪄','🎯','🦅','🐺','🦁',
]

function loadCustomCards(): CardTemplate[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as CardTemplate[]
  } catch { /* Expected: localStorage or JSON parse may fail */ }
  return null
}

function saveCustomCards(cards: CardTemplate[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(cards))
}

function emptyCard(): CardTemplate {
  return { name: 'New Card', action: 'deploy', value: 2, coins: 0, special: null, emoji: '⚔️' }
}

interface Props {
  onBack: () => void
  onSave: (cards: CardTemplate[]) => void
  initialCards?: CardTemplate[]
}

export default function CardEditor({ onBack, onSave, initialCards }: Props) {
  const [cards, setCards] = useState<CardTemplate[]>(
    () => initialCards || loadCustomCards() || [...CARD_TEMPLATES],
  )
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [filter, setFilter] = useState<CardAction | 'all'>('all')
  const [dirty, setDirty] = useState(false)

  const filtered = filter === 'all' ? cards : cards.filter(c => c.action === filter)
  const selected = cards[selectedIdx] || null

  const updateCard = useCallback((idx: number, patch: Partial<CardTemplate>) => {
    setCards(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], ...patch }
      return next
    })
    setDirty(true)
  }, [])

  const addCard = useCallback(() => {
    const c = emptyCard()
    setCards(prev => [...prev, c])
    setSelectedIdx(cards.length)
    setDirty(true)
  }, [cards.length])

  const duplicateCard = useCallback(() => {
    if (!selected) return
    const c = { ...selected, name: selected.name + ' (copy)' }
    setCards(prev => [...prev, c])
    setSelectedIdx(cards.length)
    setDirty(true)
  }, [selected, cards.length])

  const deleteCard = useCallback(() => {
    if (cards.length <= 1) return
    setCards(prev => prev.filter((_, i) => i !== selectedIdx))
    setSelectedIdx(Math.max(0, selectedIdx - 1))
    setDirty(true)
  }, [selectedIdx, cards.length])

  const resetToDefaults = useCallback(() => {
    setCards([...CARD_TEMPLATES])
    setSelectedIdx(0)
    setDirty(true)
  }, [])

  const handleSave = useCallback(() => {
    saveCustomCards(cards)
    onSave(cards)
    setDirty(false)
  }, [cards, onSave])

  const handleExport = useCallback(() => {
    const json = JSON.stringify(cards, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'eme-cards.json'; a.click()
    URL.revokeObjectURL(url)
  }, [cards])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result as string) as CardTemplate[]
          if (Array.isArray(imported) && imported.length > 0) {
            setCards(imported)
            setSelectedIdx(0)
            setDirty(true)
          }
        } catch { /* Expected: imported JSON may be malformed */ }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [])

  const actionCounts = {
    all: cards.length,
    deploy: cards.filter(c => c.action === 'deploy').length,
    move: cards.filter(c => c.action === 'move').length,
    build: cards.filter(c => c.action === 'build').length,
    destroy: cards.filter(c => c.action === 'destroy').length,
  }

  return (
    <div className={styles.container}>
      <h2 style={{ color: '#eee', margin: '0.5rem 0' }}>🃏 Card Editor</h2>
      <p style={{ color: '#888', fontSize: 12, margin: 0 }}>
        {cards.length} cards · Deck size: {cards.length * (cards.length >= 40 ? 2 : 3)} (with copies)
      </p>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, margin: '8px 0', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className={styles.btn} onClick={addCard}>➕ Add</button>
        <button className={styles.btn} onClick={duplicateCard}>📋 Duplicate</button>
        <button className={styles.btn} onClick={deleteCard} disabled={cards.length <= 1}>🗑️ Delete</button>
        <button className={styles.btn} onClick={resetToDefaults}>🔄 Reset</button>
        <span style={{ width: 8 }} />
        <button className={styles.btn} onClick={handleExport}>📥 Export</button>
        <button className={styles.btn} onClick={handleImport}>📤 Import</button>
        <span style={{ width: 8 }} />
        <button className={styles.restartBtn} onClick={handleSave} style={{ fontSize: 13, padding: '4px 16px' }}>
          💾 Save {dirty ? '*' : ''}
        </button>
        <button className={styles.btn} onClick={onBack}>← Back</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, margin: '4px 0' }}>
        {(['all', 'deploy', 'move', 'build', 'destroy'] as const).map(f => (
          <button
            key={f}
            className={styles.btn}
            style={{
              background: filter === f ? '#335' : undefined,
              borderColor: filter === f ? '#88f' : undefined,
              textTransform: 'capitalize',
            }}
            onClick={() => setFilter(f)}
          >
            {f} ({actionCounts[f]})
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8, width: '100%', maxWidth: 960, minHeight: 420 }}>
        {/* Card list */}
        <div style={{
          flex: '0 0 340px', overflowY: 'auto', maxHeight: 460,
          background: '#111', borderRadius: 6, border: '1px solid #333', padding: 4,
        }}>
          {filtered.map((c) => {
            const realIdx = cards.indexOf(c)
            return (
              <div
                key={`${realIdx}-${c.name}`}
                onClick={() => setSelectedIdx(realIdx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
                  cursor: 'pointer', borderRadius: 4,
                  background: realIdx === selectedIdx ? '#224' : 'transparent',
                  borderBottom: '1px solid #222',
                }}
              >
                <span style={{ fontSize: 18 }}>{c.emoji}</span>
                <span style={{ color: '#ddd', fontSize: 13, flex: 1 }}>{c.name}</span>
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 4,
                  background: c.action === 'deploy' ? '#2a4' : c.action === 'move' ? '#48c'
                    : c.action === 'build' ? '#a84' : '#c44',
                  color: '#fff',
                }}>{c.action}</span>
                <span style={{ color: '#aaa', fontSize: 11 }}>{c.value}</span>
                {c.coins > 0 && <span style={{ color: '#FFD700', fontSize: 11 }}>+{c.coins}🪙</span>}
                {c.special && <span style={{ color: '#9b59b6', fontSize: 10 }}>★</span>}
              </div>
            )
          })}
        </div>

        {/* Card editor form */}
        {selected && (
          <div style={{
            flex: 1, background: '#111', borderRadius: 6, border: '1px solid #333',
            padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <h3 style={{ color: '#eee', margin: 0 }}>
              {selected.emoji} Editing: {selected.name}</h3>

            {/* Card preview */}
            <div style={{
              width: 160, height: 120, background: '#1a2a3a', borderRadius: 8,
              border: '2px solid #446', padding: 8, textAlign: 'center', margin: '0 auto',
            }}>
              <div style={{ fontSize: 28 }}>{selected.emoji}</div>
              <div style={{ color: '#ddd', fontWeight: 700, fontSize: 13 }}>{selected.name}</div>
              <div style={{ color: '#aaa', fontSize: 11 }}>
                {selected.action === 'deploy' ? `Deploy ${selected.value}`
                  : selected.action === 'move' ? `Move ${selected.value}`
                  : selected.action === 'build' ? 'Build City' : `Destroy ${selected.value}`}
              </div>
              {selected.coins > 0 && <div style={{ color: '#FFD700', fontSize: 11 }}>+{selected.coins} coins</div>}
              {selected.special && (
                <div style={{ color: '#9b59b6', fontSize: 10 }}>★ {ABILITY_LABELS[selected.special]}</div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center' }}>
              <label style={labelStyle}>Name</label>
              <input
                style={inputStyle}
                value={selected.name}
                onChange={e => updateCard(selectedIdx, { name: e.target.value })}
                maxLength={20}
              />

              <label style={labelStyle}>Emoji</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {EMOJIS.map(em => (
                  <button
                    key={em}
                    style={{
                      fontSize: 16, padding: 2, cursor: 'pointer', border: 'none',
                      background: selected.emoji === em ? '#335' : 'transparent',
                      borderRadius: 4,
                    }}
                    onClick={() => updateCard(selectedIdx, { emoji: em })}
                  >{em}</button>
                ))}
              </div>

              <label style={labelStyle}>Action</label>
              <select
                style={inputStyle}
                value={selected.action}
                onChange={e => updateCard(selectedIdx, { action: e.target.value as CardAction })}
              >
                {ALL_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <label style={labelStyle}>Value</label>
              <input
                style={inputStyle} type="number" min={1} max={10}
                value={selected.value}
                onChange={e => updateCard(selectedIdx, { value: Math.max(1, parseInt(e.target.value) || 1) })}
              />

              <label style={labelStyle}>Coins</label>
              <input
                style={inputStyle} type="number" min={0} max={10}
                value={selected.coins}
                onChange={e => updateCard(selectedIdx, { coins: Math.max(0, parseInt(e.target.value) || 0) })}
              />

              <label style={labelStyle}>Special</label>
              <select
                style={inputStyle}
                value={selected.special || ''}
                onChange={e => updateCard(selectedIdx, {
                  special: e.target.value ? e.target.value as SpecialAbility : null,
                })}
              >
                <option value="">None</option>
                {ALL_ABILITIES.map(a => (
                  <option key={a} value={a}>{a} — {ABILITY_LABELS[a]}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { color: '#aaa', fontSize: 13, textAlign: 'right' }
const inputStyle: React.CSSProperties = {
  background: '#1a1a2e', color: '#eee', border: '1px solid #444',
  borderRadius: 4, padding: '4px 8px', fontSize: 13, outline: 'none',
}

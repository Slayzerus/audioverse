/**
 * GameSetup.tsx — New game setup screen.
 *
 * Allows players to:
 *   - Configure player slots (human / AI / closed)
 *   - Choose factions and colors per slot
 *   - Set map size, game mode, difficulty
 *   - Browse and select campaigns
 *   - Access map editor
 */
import { useState, useMemo } from 'react'
import type { FactionId, AIDifficulty, GameSetupConfig, PlayerSetupSlot } from './types'
import { FACTION_BONUSES } from './factionBonuses'
import { ALL_CAMPAIGNS, getCampaignsForPlayerCount } from './campaigns'

// ═══════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════

const AVAILABLE_COLORS = [
  { name: 'Red',    hex: '#CC3333' },
  { name: 'Blue',   hex: '#3366CC' },
  { name: 'Green',  hex: '#33AA33' },
  { name: 'Yellow', hex: '#CCAA33' },
  { name: 'Orange', hex: '#CC6633' },
  { name: 'Purple', hex: '#9933CC' },
  { name: 'Teal',   hex: '#33AAAA' },
  { name: 'Pink',   hex: '#CC33AA' },
]

const FACTION_IDS: FactionId[] = ['castle', 'rampart', 'tower', 'inferno', 'necropolis', 'dungeon', 'wilds']

const FACTION_EMOJI: Record<FactionId, string> = {
  castle: '🏰', rampart: '🌲', tower: '🔮',
  inferno: '🔥', necropolis: '💀', dungeon: '🕳️', wilds: '🐺',
}

const MAP_SIZES: { key: 'small' | 'medium' | 'large'; label: string; desc: string }[] = [
  { key: 'small',  label: 'Small',  desc: '36×36 — Quick games' },
  { key: 'medium', label: 'Medium', desc: '72×72 — Standard' },
  { key: 'large',  label: 'Large',  desc: '108×108 — Epic' },
]

const GAME_MODES: { key: string; label: string; desc: string }[] = [
  { key: 'conquest',       label: '⚔️ Conquest',       desc: 'Capture all enemy towns' },
  { key: 'vs-skirmish',    label: '🤺 Skirmish',       desc: 'Free-for-all PvP/PvAI' },
  { key: 'king-of-hill',   label: '👑 King of the Hill', desc: 'Hold the center town' },
  { key: 'treasure-hunt',  label: '💰 Treasure Hunt',   desc: 'Collect 50,000 gold first' },
  { key: 'survival',       label: '🛡️ Survival',       desc: 'Survive endless AI waves' },
  { key: 'coop-campaign',  label: '🤝 Co-op Campaign',  desc: 'Play with a friend vs AI' },
  { key: 'campaign',       label: '📜 Campaign',        desc: 'Story-driven scenarios' },
]

const DIFFICULTIES: { key: AIDifficulty; label: string }[] = [
  { key: 'easy',   label: '😊 Easy' },
  { key: 'normal', label: '😐 Normal' },
  { key: 'hard',   label: '😤 Hard' },
  { key: 'expert', label: '🤯 Expert' },
]

const MAX_SLOTS = 8

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════
const S = {
  root: {
    position: 'absolute' as const, inset: 0,
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    color: '#e0d8c8', fontFamily: "'Segoe UI', sans-serif",
    display: 'flex', flexDirection: 'column' as const, overflow: 'auto',
  },
  header: {
    textAlign: 'center' as const, padding: '18px 0 10px',
    borderBottom: '2px solid #FFD700',
  },
  title: {
    fontSize: 28, fontWeight: 700, color: '#FFD700', margin: 0,
    textShadow: '0 2px 8px rgba(255,215,0,.4)',
  },
  subtitle: { fontSize: 13, opacity: 0.7, marginTop: 4 },
  tabs: {
    display: 'flex', justifyContent: 'center', gap: 4, padding: '10px 0',
    borderBottom: '1px solid #333',
  },
  tab: (active: boolean) => ({
    padding: '8px 18px', borderRadius: 6,
    background: active ? '#FFD700' : 'rgba(255,255,255,.08)',
    color: active ? '#1a1a2e' : '#e0d8c8',
    fontWeight: active ? 700 : 400,
    cursor: 'pointer', border: 'none', fontSize: 14,
    transition: 'all .2s',
  }),
  body: {
    flex: 1, padding: '12px 24px', overflowY: 'auto' as const,
    maxWidth: 900, margin: '0 auto', width: '100%',
  },
  slotRow: (type: string) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', marginBottom: 6,
    borderRadius: 8,
    background: type === 'closed' ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.07)',
    border: type === 'human' ? '1px solid #FFD700' : '1px solid rgba(255,255,255,.1)',
    opacity: type === 'closed' ? 0.5 : 1,
  }),
  select: {
    padding: '4px 8px', borderRadius: 4, border: '1px solid #555',
    background: '#2a2a4a', color: '#e0d8c8', fontSize: 13,
  },
  input: {
    padding: '4px 8px', borderRadius: 4, border: '1px solid #555',
    background: '#2a2a4a', color: '#e0d8c8', fontSize: 13, width: 120,
  },
  colorSwatch: (hex: string, selected: boolean) => ({
    width: 24, height: 24, borderRadius: '50%', cursor: 'pointer',
    background: hex, border: selected ? '3px solid #FFD700' : '2px solid #555',
    boxShadow: selected ? '0 0 8px ' + hex : 'none',
  }),
  label: {
    fontSize: 12, opacity: 0.6, marginBottom: 2, display: 'block' as const,
  },
  settingRow: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)',
  },
  settingLabel: { flex: '0 0 120px', fontWeight: 600, fontSize: 14 },
  settingOptions: { display: 'flex', gap: 6, flexWrap: 'wrap' as const },
  optionBtn: (active: boolean) => ({
    padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
    background: active ? '#FFD700' : 'rgba(255,255,255,.08)',
    color: active ? '#1a1a2e' : '#e0d8c8',
    fontWeight: active ? 700 : 400,
    border: 'none', fontSize: 13,
  }),
  campaignCard: (selected: boolean) => ({
    padding: 14, marginBottom: 10, borderRadius: 10,
    background: selected ? 'rgba(255,215,0,.12)' : 'rgba(255,255,255,.05)',
    border: selected ? '2px solid #FFD700' : '1px solid rgba(255,255,255,.1)',
    cursor: 'pointer', transition: 'all .2s',
  }),
  campaignName: { fontSize: 17, fontWeight: 700, color: '#FFD700', marginBottom: 4 },
  campaignDesc: { fontSize: 13, opacity: 0.8 },
  scenarioList: { marginTop: 8, marginLeft: 12 },
  scenarioItem: (active: boolean) => ({
    padding: '4px 10px', marginBottom: 3, borderRadius: 4,
    background: active ? 'rgba(255,215,0,.2)' : 'transparent',
    cursor: 'pointer', fontSize: 13,
    border: active ? '1px solid #FFD700' : '1px solid transparent',
  }),
  factionInfo: {
    marginTop: 8, padding: 10, borderRadius: 6,
    background: 'rgba(0,0,0,.3)', fontSize: 12, lineHeight: 1.5,
  },
  footer: {
    display: 'flex', justifyContent: 'center', gap: 12,
    padding: '14px 0', borderTop: '2px solid #FFD700',
  },
  btnPrimary: {
    padding: '10px 28px', borderRadius: 8, cursor: 'pointer',
    background: '#FFD700', color: '#1a1a2e', fontWeight: 700,
    fontSize: 16, border: 'none',
    boxShadow: '0 2px 12px rgba(255,215,0,.3)',
  },
  btnSecondary: {
    padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
    background: 'rgba(255,255,255,.1)', color: '#e0d8c8',
    fontWeight: 600, fontSize: 14, border: '1px solid #555',
  },
  btnDanger: {
    padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
    background: '#C62828', color: '#fff',
    fontWeight: 600, fontSize: 14, border: 'none',
  },
}

// ═══════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════
interface GameSetupProps {
  initialPlayers: { name: string }[]
  onStartGame: (config: GameSetupConfig) => void
  onOpenEditor: () => void
  onBack: () => void
}

export default function GameSetup({ initialPlayers, onStartGame, onOpenEditor, onBack }: GameSetupProps) {

  // --- State ---
  const [slots, setSlots] = useState<PlayerSetupSlot[]>(() => {
    const init: PlayerSetupSlot[] = []
    for (let i = 0; i < Math.min(initialPlayers.length, MAX_SLOTS); i++) {
      init.push({
        type: 'human',
        name: initialPlayers[i].name || `Player ${i + 1}`,
        faction: FACTION_IDS[i % FACTION_IDS.length],
        color: AVAILABLE_COLORS[i].hex,
      })
    }
    // Add 1 default AI
    if (init.length < MAX_SLOTS) {
      init.push({
        type: 'ai', name: 'AI 1', faction: 'wilds',
        color: AVAILABLE_COLORS[init.length].hex, difficulty: 'normal',
      })
    }
    // Fill rest closed
    while (init.length < MAX_SLOTS) {
      init.push({
        type: 'closed', name: `Slot ${init.length + 1}`, faction: 'castle',
        color: AVAILABLE_COLORS[init.length % AVAILABLE_COLORS.length].hex,
      })
    }
    return init
  })

  const [mapSize, setMapSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [gameMode, setGameMode] = useState('conquest')
  const [difficulty, setDifficulty] = useState<AIDifficulty>('normal')
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [selectedScenario, setSelectedScenario] = useState(0)
  const [tab, setTab] = useState<'players' | 'settings' | 'campaigns' | 'factions'>('players')
  const [hoveredFaction, setHoveredFaction] = useState<FactionId | null>(null)

  // --- Derived ---
  const activePlayers = slots.filter(s => s.type !== 'closed')
  const humanCount = slots.filter(s => s.type === 'human').length
  const aiCount = slots.filter(s => s.type === 'ai').length

  const availableCampaigns = useMemo(() => getCampaignsForPlayerCount(humanCount), [humanCount])

  // --- Handlers ---
  function updateSlot(idx: number, patch: Partial<PlayerSetupSlot>) {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  function cycleSlotType(idx: number) {
    const order: PlayerSetupSlot['type'][] = ['human', 'ai', 'closed']
    const current = slots[idx].type
    const next = order[(order.indexOf(current) + 1) % order.length]
    updateSlot(idx, { type: next })
  }

  function handleStart() {
    const config: GameSetupConfig = {
      players: slots.filter(s => s.type !== 'closed'),
      mapSize,
      gameMode: gameMode as GameSetupConfig['gameMode'],
      campaignId: gameMode === 'campaign' ? (selectedCampaign ?? undefined) : undefined,
      scenarioIndex: gameMode === 'campaign' ? selectedScenario : undefined,
      difficulty,
      seed: Math.floor(Math.random() * 999999),
    }
    onStartGame(config)
  }

  // --- Render: Players Tab ---
  function renderPlayersTab() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Player Slots ({activePlayers.length} active)</span>
          <span style={{ fontSize: 12, opacity: 0.5 }}>Click type to cycle: Human → AI → Closed</span>
        </div>

        {slots.map((slot, idx) => (
          <div key={idx} style={S.slotRow(slot.type)}>
            {/* Slot number */}
            <span style={{ width: 24, fontWeight: 700, opacity: 0.4 }}>#{idx + 1}</span>

            {/* Type button */}
            <button
              style={{
                ...S.select, width: 70, textAlign: 'center' as const, cursor: 'pointer',
                background: slot.type === 'human' ? '#2a4a2a'
                          : slot.type === 'ai' ? '#4a2a2a'
                          : '#2a2a2a',
              }}
              onClick={() => cycleSlotType(idx)}
            >
              {slot.type === 'human' ? '👤 Human' : slot.type === 'ai' ? '🤖 AI' : '🚫 —'}
            </button>

            {slot.type !== 'closed' && (
              <>
                {/* Name */}
                <input
                  style={S.input}
                  value={slot.name}
                  onChange={e => updateSlot(idx, { name: e.target.value })}
                  placeholder="Name"
                />

                {/* Faction */}
                <select
                  style={S.select}
                  value={slot.faction}
                  onChange={e => updateSlot(idx, { faction: e.target.value as FactionId })}
                >
                  {FACTION_IDS.map(f => (
                    <option key={f} value={f}>
                      {FACTION_EMOJI[f]} {f.charAt(0).toUpperCase() + f.slice(1)}
                    </option>
                  ))}
                </select>

                {/* Color */}
                <div style={{ display: 'flex', gap: 3 }}>
                  {AVAILABLE_COLORS.map(c => (
                    <div
                      key={c.hex}
                      style={S.colorSwatch(c.hex, slot.color === c.hex)}
                      onClick={() => updateSlot(idx, { color: c.hex })}
                      title={c.name}
                    />
                  ))}
                </div>

                {/* AI Difficulty */}
                {slot.type === 'ai' && (
                  <select
                    style={S.select}
                    value={slot.difficulty || 'normal'}
                    onChange={e => updateSlot(idx, { difficulty: e.target.value as AIDifficulty })}
                  >
                    {DIFFICULTIES.map(d => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>
        ))}

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.5 }}>
          {humanCount} human · {aiCount} AI · {MAX_SLOTS - humanCount - aiCount} closed
        </div>
      </div>
    )
  }

  // --- Render: Settings Tab ---
  function renderSettingsTab() {
    return (
      <div>
        {/* Map Size */}
        <div style={S.settingRow}>
          <span style={S.settingLabel}>Map Size</span>
          <div style={S.settingOptions}>
            {MAP_SIZES.map(s => (
              <button key={s.key} style={S.optionBtn(mapSize === s.key)}
                onClick={() => setMapSize(s.key)}
                title={s.desc}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {/* Game Mode */}
        <div style={S.settingRow}>
          <span style={S.settingLabel}>Game Mode</span>
          <div style={S.settingOptions}>
            {GAME_MODES.map(m => (
              <button key={m.key} style={S.optionBtn(gameMode === m.key)}
                onClick={() => setGameMode(m.key)}
                title={m.desc}
              >{m.label}</button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div style={S.settingRow}>
          <span style={S.settingLabel}>AI Difficulty</span>
          <div style={S.settingOptions}>
            {DIFFICULTIES.map(d => (
              <button key={d.key} style={S.optionBtn(difficulty === d.key)}
                onClick={() => setDifficulty(d.key)}
              >{d.label}</button>
            ))}
          </div>
        </div>

        {/* Game mode description */}
        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(0,0,0,.3)' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {GAME_MODES.find(m => m.key === gameMode)?.label}
          </div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            {GAME_MODES.find(m => m.key === gameMode)?.desc}
          </div>
        </div>
      </div>
    )
  }

  // --- Render: Campaigns Tab ---
  function renderCampaignsTab() {
    return (
      <div>
        <div style={{ marginBottom: 12, fontSize: 13, opacity: 0.7 }}>
          Campaigns available for {humanCount} human player{humanCount !== 1 ? 's' : ''}.
          Select a campaign and scenario to play.
        </div>

        {availableCampaigns.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', opacity: 0.5 }}>
            No campaigns available for {humanCount} player{humanCount !== 1 ? 's' : ''}.
          </div>
        )}

        {ALL_CAMPAIGNS.map(camp => {
          const available = availableCampaigns.includes(camp)
          const isSelected = selectedCampaign === camp.id
          return (
            <div
              key={camp.id}
              style={{
                ...S.campaignCard(isSelected),
                opacity: available ? 1 : 0.4,
                pointerEvents: available ? 'auto' : 'none',
              }}
              onClick={() => {
                setSelectedCampaign(isSelected ? null : camp.id)
                setSelectedScenario(0)
                setGameMode('campaign')
              }}
            >
              <div style={S.campaignName}>{camp.name}</div>
              <div style={S.campaignDesc}>{camp.description}</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.5 }}>
                {camp.playerRange.min}-{camp.playerRange.max} players ·
                {camp.scenarios.length} scenarios ·
                {camp.coopAllowed ? ' Co-op ✓' : ''} {camp.pvpAllowed ? ' PvP ✓' : ''}
              </div>

              {/* Scenario selection */}
              {isSelected && (
                <div style={S.scenarioList}>
                  {camp.scenarios.map((sc, si) => (
                    <div
                      key={sc.id}
                      style={S.scenarioItem(selectedScenario === si)}
                      onClick={(e) => { e.stopPropagation(); setSelectedScenario(si) }}
                    >
                      <span style={{ fontWeight: 600 }}>#{si + 1}:</span> {sc.name}
                      <span style={{ marginLeft: 8, opacity: 0.5, fontSize: 11 }}>
                        ({sc.mapSize} map · {sc.objectives.filter(o => !o.optional).length} objectives)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // --- Render: Factions Tab ---
  function renderFactionsTab() {
    const displayFaction = hoveredFaction || 'castle'
    const bonus = FACTION_BONUSES[displayFaction]
    return (
      <div>
        <div style={{ marginBottom: 12, fontSize: 13, opacity: 0.7 }}>
          Each faction has unique strengths and weaknesses. Castle is the easiest and most balanced.
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {FACTION_IDS.map(f => {
            const b = FACTION_BONUSES[f]
            return (
              <button
                key={f}
                style={{
                  ...S.optionBtn(hoveredFaction === f),
                  padding: '10px 16px',
                }}
                onClick={() => setHoveredFaction(f)}
              >
                {FACTION_EMOJI[f]} {f.charAt(0).toUpperCase() + f.slice(1)}
                <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6 }}>
                  ({b.difficulty})
                </span>
              </button>
            )
          })}
        </div>

        <div style={S.factionInfo}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD700', marginBottom: 6 }}>
            {FACTION_EMOJI[displayFaction]} {bonus.name}
          </div>
          <div style={{ marginBottom: 8 }}>{bonus.description}</div>
          <div style={{ fontWeight: 600, color: '#4CAF50', marginBottom: 3 }}>
            ✅ Strengths:
          </div>
          <ul style={{ margin: '0 0 8px 16px', padding: 0 }}>
            {bonus.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          <div style={{ fontWeight: 600, color: '#f44336', marginBottom: 3 }}>
            ❌ Weaknesses:
          </div>
          <ul style={{ margin: '0 0 8px 16px', padding: 0 }}>
            {bonus.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
            Difficulty: {bonus.difficulty} •
            Special: {bonus.specialMechanic}
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  //  MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  const canStart = activePlayers.length >= 2

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>⚔️ Game of Castles</h1>
        <div style={S.subtitle}>Configure your game and start playing</div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {(['players', 'settings', 'campaigns', 'factions'] as const).map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'players' ? '👥 Players' :
             t === 'settings' ? '⚙️ Settings' :
             t === 'campaigns' ? '📜 Campaigns' :
             '🏰 Factions'}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={S.body}>
        {tab === 'players' && renderPlayersTab()}
        {tab === 'settings' && renderSettingsTab()}
        {tab === 'campaigns' && renderCampaignsTab()}
        {tab === 'factions' && renderFactionsTab()}
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <button style={S.btnDanger} onClick={onBack}>← Back</button>
        <button style={S.btnSecondary} onClick={onOpenEditor}>🗺️ Map Editor</button>
        <button
          style={{ ...S.btnPrimary, opacity: canStart ? 1 : 0.4 }}
          onClick={canStart ? handleStart : undefined}
          title={canStart ? 'Start the game!' : 'Need at least 2 active players'}
        >
          ▶ Start Game
        </button>
      </div>
    </div>
  )
}

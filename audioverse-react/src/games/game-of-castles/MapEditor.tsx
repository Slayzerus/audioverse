/**
 * MapEditor.tsx — Visual map & campaign editor.
 *
 * Canvas-based terrain painter with:
 *   - Terrain brush (grass / forest / mountain / water / desert / snow / swamp / road / lava)
 *   - Object placement (towns, mines, treasures, map objects)
 *   - Player start positions
 *   - Eraser
 *   - Map metadata (name, max players)
 *   - Save / Load as JSON
 *   - Play-test with current map
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  FactionId, Terrain, ResourceBundle,
} from './types'

// ═══════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════
type EditorTool = 'terrain' | 'town' | 'mine' | 'treasure' | 'object' | 'start' | 'erase'

interface EditorTown {
  x: number; y: number
  faction: FactionId
  owner: number  // -1 = neutral
  name: string
}

interface EditorMine {
  x: number; y: number
  resource: keyof ResourceBundle
}

interface EditorTreasure {
  x: number; y: number
  gold: number
}

interface EditorObject {
  x: number; y: number
  type: string
  label: string
}

interface EditorStart {
  x: number; y: number
  playerIndex: number
}

interface EditorState {
  mapName: string
  mapWidth: number
  mapHeight: number
  tiles: Terrain[][]
  towns: EditorTown[]
  mines: EditorMine[]
  treasures: EditorTreasure[]
  objects: EditorObject[]
  starts: EditorStart[]
  maxPlayers: number
}

// ═══════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════
const EDITOR_TILE = 20
const CANVAS_W = 800
const CANVAS_H = 560

const TERRAIN_TYPES: { key: Terrain; label: string; color: string }[] = [
  { key: 'grass',    label: '🌿 Grass',    color: '#4a8f3f' },
  { key: 'forest',   label: '🌲 Forest',   color: '#2d6b2d' },
  { key: 'mountain', label: '⛰️ Mountain', color: '#7a7a7a' },
  { key: 'water',    label: '🌊 Water',    color: '#3366aa' },
  { key: 'sand',     label: '🏜️ Sand',     color: '#c4a94d' },
  { key: 'snow',     label: '❄️ Snow',      color: '#d4e6f1' },
  { key: 'swamp',    label: '🐊 Swamp',    color: '#5a7a5a' },
  { key: 'road',     label: '🛤️ Road',     color: '#b8a080' },
  { key: 'lava',     label: '🌋 Lava',     color: '#cc4422' },
  { key: 'dirt',     label: '🟫 Dirt',     color: '#8B6914' },
]

const TERRAIN_COLORS: Record<string, string> = {}
TERRAIN_TYPES.forEach(t => { TERRAIN_COLORS[t.key] = t.color })
TERRAIN_COLORS[''] = '#333'

const MINE_RESOURCES: (keyof ResourceBundle)[] = ['gold', 'wood', 'ore', 'crystals', 'gems', 'mercury', 'sulfur']

const MAP_OBJECT_TYPES = [
  { type: 'windmill',    label: '🏭 Windmill' },
  { type: 'water_wheel', label: '💧 Water Wheel' },
  { type: 'monolith',    label: '🗿 Monolith' },
  { type: 'obelisk',     label: '📍 Obelisk' },
  { type: 'tavern',      label: '🍺 Tavern' },
  { type: 'shrine',      label: '⛩️ Shrine' },
  { type: 'arena',       label: '🏟️ Arena' },
  { type: 'learning_stone', label: '📖 Learning Stone' },
]

const FACTION_IDS: FactionId[] = ['castle', 'rampart', 'tower', 'inferno', 'necropolis', 'dungeon', 'wilds']

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function createBlankMap(w: number, h: number): Terrain[][] {
  const tiles: Terrain[][] = []
  for (let y = 0; y < h; y++) {
    const row: Terrain[] = []
    for (let x = 0; x < w; x++) {
      row.push('grass')
    }
    tiles.push(row)
  }
  return tiles
}

function createInitialEditorState(): EditorState {
  return {
    mapName: 'Untitled Map',
    mapWidth: 48,
    mapHeight: 48,
    tiles: createBlankMap(48, 48),
    towns: [],
    mines: [],
    treasures: [],
    objects: [],
    starts: [],
    maxPlayers: 2,
  }
}

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════
const S = {
  root: {
    position: 'absolute' as const, inset: 0,
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    color: '#e0d8c8', fontFamily: "'Segoe UI', sans-serif",
    display: 'flex', flexDirection: 'column' as const,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 16px', borderBottom: '2px solid #FFD700',
  },
  title: { fontSize: 18, fontWeight: 700, color: '#FFD700' },
  main: {
    flex: 1, display: 'flex', overflow: 'hidden',
  },
  toolbar: {
    width: 200, padding: '8px 10px',
    borderRight: '1px solid #333', overflowY: 'auto' as const,
    fontSize: 12,
  },
  canvasWrap: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#111', overflow: 'auto',
  },
  section: {
    marginBottom: 12, paddingBottom: 8,
    borderBottom: '1px solid rgba(255,255,255,.08)',
  },
  sectionTitle: { fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#FFD700' },
  toolBtn: (active: boolean) => ({
    display: 'block', width: '100%', padding: '5px 8px',
    marginBottom: 3, borderRadius: 4, cursor: 'pointer',
    background: active ? '#FFD700' : 'rgba(255,255,255,.06)',
    color: active ? '#1a1a2e' : '#e0d8c8',
    fontWeight: active ? 700 : 400,
    border: 'none', textAlign: 'left' as const, fontSize: 12,
  }),
  input: {
    width: '100%', padding: '3px 6px', borderRadius: 3,
    border: '1px solid #555', background: '#2a2a4a', color: '#e0d8c8',
    fontSize: 12, marginBottom: 4,
  },
  select: {
    width: '100%', padding: '3px 6px', borderRadius: 3,
    border: '1px solid #555', background: '#2a2a4a', color: '#e0d8c8', fontSize: 12,
  },
  btn: {
    padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
    background: 'rgba(255,255,255,.1)', color: '#e0d8c8',
    border: '1px solid #555', fontSize: 12,
  },
  btnGold: {
    padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
    background: '#FFD700', color: '#1a1a2e', fontWeight: 700,
    border: 'none', fontSize: 12,
  },
  statusBar: {
    padding: '4px 16px', borderTop: '1px solid #333',
    display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.6,
  },
}

// ═══════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════
interface MapEditorProps {
  onBack: () => void
  onPlayTest?: (mapData: string) => void
}

export default function MapEditor({ onBack, onPlayTest }: MapEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [es, setEs] = useState<EditorState>(createInitialEditorState)

  // Editor tool state
  const [tool, setTool] = useState<EditorTool>('terrain')
  const [selectedTerrain, setSelectedTerrain] = useState<Terrain>('grass')
  const [brushSize, setBrushSize] = useState(1)
  const [selectedMineResource, setSelectedMineResource] = useState<keyof ResourceBundle>('gold')
  const [selectedObjectType, setSelectedObjectType] = useState('windmill')
  const [selectedFaction, setSelectedFaction] = useState<FactionId>('castle')
  const [selectedOwner, setSelectedOwner] = useState(-1)
  const [selectedPlayerStart, setSelectedPlayerStart] = useState(0)

  // Camera / scroll
  const [camX, setCamX] = useState(0)
  const [camY, setCamY] = useState(0)
  const isPaintingRef = useRef(false)
  const [cursorTile, setCursorTile] = useState<{ x: number; y: number } | null>(null)

  // === Drawing ===
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    const { tiles, mapWidth, mapHeight, towns, mines, treasures, objects, starts } = es

    // Draw terrain
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const px = x * EDITOR_TILE - camX
        const py = y * EDITOR_TILE - camY
        if (px > CANVAS_W || py > CANVAS_H || px + EDITOR_TILE < 0 || py + EDITOR_TILE < 0) continue

        const terrain = tiles[y]?.[x] || 'grass'
        ctx.fillStyle = TERRAIN_COLORS[terrain] || '#333'
        ctx.fillRect(px, py, EDITOR_TILE, EDITOR_TILE)

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,.08)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(px, py, EDITOR_TILE, EDITOR_TILE)
      }
    }

    // Draw towns
    for (const town of towns) {
      const px = town.x * EDITOR_TILE - camX + EDITOR_TILE / 2
      const py = town.y * EDITOR_TILE - camY + EDITOR_TILE / 2
      ctx.fillStyle = town.owner >= 0 ? ['#CC3333', '#3366CC', '#33AA33', '#CCAA33'][town.owner] || '#888' : '#888'
      ctx.beginPath()
      ctx.arc(px, py, EDITOR_TILE / 2 - 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `${EDITOR_TILE - 6}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🏰', px, py)
    }

    // Draw mines
    for (const mine of mines) {
      const px = mine.x * EDITOR_TILE - camX
      const py = mine.y * EDITOR_TILE - camY
      ctx.fillStyle = '#aa8844'
      ctx.fillRect(px + 2, py + 2, EDITOR_TILE - 4, EDITOR_TILE - 4)
      ctx.fillStyle = '#fff'
      ctx.font = `${EDITOR_TILE - 8}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⛏', px + EDITOR_TILE / 2, py + EDITOR_TILE / 2)
    }

    // Draw treasures
    for (const tr of treasures) {
      const px = tr.x * EDITOR_TILE - camX
      const py = tr.y * EDITOR_TILE - camY
      ctx.fillStyle = '#cc9922'
      ctx.fillRect(px + 3, py + 3, EDITOR_TILE - 6, EDITOR_TILE - 6)
      ctx.fillStyle = '#fff'
      ctx.font = `${EDITOR_TILE - 8}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('💰', px + EDITOR_TILE / 2, py + EDITOR_TILE / 2)
    }

    // Draw objects
    for (const obj of objects) {
      const px = obj.x * EDITOR_TILE - camX
      const py = obj.y * EDITOR_TILE - camY
      ctx.fillStyle = '#6666aa'
      ctx.fillRect(px + 2, py + 2, EDITOR_TILE - 4, EDITOR_TILE - 4)
      ctx.fillStyle = '#fff'
      ctx.font = `${EDITOR_TILE - 8}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('◆', px + EDITOR_TILE / 2, py + EDITOR_TILE / 2)
    }

    // Draw player starts
    for (const st of starts) {
      const px = st.x * EDITOR_TILE - camX
      const py = st.y * EDITOR_TILE - camY
      const colors = ['#CC3333', '#3366CC', '#33AA33', '#CCAA33', '#CC6633', '#9933CC', '#33AAAA', '#CC33AA']
      ctx.fillStyle = colors[st.playerIndex] || '#fff'
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(px + EDITOR_TILE / 2, py + 2)
      ctx.lineTo(px + EDITOR_TILE - 2, py + EDITOR_TILE - 2)
      ctx.lineTo(px + 2, py + EDITOR_TILE - 2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`P${st.playerIndex + 1}`, px + EDITOR_TILE / 2, py + EDITOR_TILE / 2 + 2)
    }

    // Draw cursor highlight
    if (cursorTile) {
      const half = Math.floor(brushSize / 2)
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 2
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const tx = cursorTile.x + dx
          const ty = cursorTile.y + dy
          if (tx >= 0 && tx < mapWidth && ty >= 0 && ty < mapHeight) {
            const px = tx * EDITOR_TILE - camX
            const py = ty * EDITOR_TILE - camY
            ctx.strokeRect(px, py, EDITOR_TILE, EDITOR_TILE)
          }
        }
      }
    }

    // Map border
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 2
    ctx.strokeRect(-camX, -camY, mapWidth * EDITOR_TILE, mapHeight * EDITOR_TILE)
  }, [es, camX, camY, cursorTile, brushSize])

  // Redraw on state change
  useEffect(() => { draw() }, [draw])

  // === Mouse handlers ===
  function tileFromEvent(e: React.MouseEvent): { x: number; y: number } | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const tx = Math.floor((mx + camX) / EDITOR_TILE)
    const ty = Math.floor((my + camY) / EDITOR_TILE)
    if (tx < 0 || tx >= es.mapWidth || ty < 0 || ty >= es.mapHeight) return null
    return { x: tx, y: ty }
  }

  function applyTool(tile: { x: number; y: number }) {
    const { x, y } = tile

    if (tool === 'terrain') {
      setEs(prev => {
        const newTiles = prev.tiles.map(row => [...row])
        const half = Math.floor(brushSize / 2)
        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const tx = x + dx, ty = y + dy
            if (tx >= 0 && tx < prev.mapWidth && ty >= 0 && ty < prev.mapHeight) {
              newTiles[ty][tx] = selectedTerrain
            }
          }
        }
        return { ...prev, tiles: newTiles }
      })
    } else if (tool === 'erase') {
      setEs(prev => {
        const newTiles = prev.tiles.map(row => [...row])
        const half = Math.floor(brushSize / 2)
        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const tx = x + dx, ty = y + dy
            if (tx >= 0 && tx < prev.mapWidth && ty >= 0 && ty < prev.mapHeight) {
              newTiles[ty][tx] = 'grass'
            }
          }
        }
        // Also remove objects at this position
        return {
          ...prev,
          tiles: newTiles,
          towns: prev.towns.filter(t => t.x !== x || t.y !== y),
          mines: prev.mines.filter(m => m.x !== x || m.y !== y),
          treasures: prev.treasures.filter(t => t.x !== x || t.y !== y),
          objects: prev.objects.filter(o => o.x !== x || o.y !== y),
          starts: prev.starts.filter(s => s.x !== x || s.y !== y),
        }
      })
    } else if (tool === 'town') {
      setEs(prev => ({
        ...prev,
        towns: [
          ...prev.towns.filter(t => t.x !== x || t.y !== y),
          { x, y, faction: selectedFaction, owner: selectedOwner, name: `Town ${prev.towns.length + 1}` },
        ],
      }))
    } else if (tool === 'mine') {
      setEs(prev => ({
        ...prev,
        mines: [
          ...prev.mines.filter(m => m.x !== x || m.y !== y),
          { x, y, resource: selectedMineResource },
        ],
      }))
    } else if (tool === 'treasure') {
      setEs(prev => ({
        ...prev,
        treasures: [
          ...prev.treasures.filter(t => t.x !== x || t.y !== y),
          { x, y, gold: 1000 },
        ],
      }))
    } else if (tool === 'object') {
      const objDef = MAP_OBJECT_TYPES.find(o => o.type === selectedObjectType)
      setEs(prev => ({
        ...prev,
        objects: [
          ...prev.objects.filter(o => o.x !== x || o.y !== y),
          { x, y, type: selectedObjectType, label: objDef?.label || selectedObjectType },
        ],
      }))
    } else if (tool === 'start') {
      setEs(prev => ({
        ...prev,
        starts: [
          ...prev.starts.filter(s => s.playerIndex !== selectedPlayerStart),
          { x, y, playerIndex: selectedPlayerStart },
        ],
      }))
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    const tile = tileFromEvent(e)
    if (!tile) return
    isPaintingRef.current = true
    applyTool(tile)
  }

  function handleMouseMove(e: React.MouseEvent) {
    const tile = tileFromEvent(e)
    setCursorTile(tile)
    if (isPaintingRef.current && tile && (tool === 'terrain' || tool === 'erase')) {
      applyTool(tile)
    }
  }

  function handleMouseUp() {
    isPaintingRef.current = false
  }

  // Scroll with right mouse drag
  const scrollRef = useRef<{ dragging: boolean; startX: number; startY: number; camStartX: number; camStartY: number }>({
    dragging: false, startX: 0, startY: 0, camStartX: 0, camStartY: 0,
  })

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
  }

  function handleMouseDownScroll(e: React.MouseEvent) {
    if (e.button === 2) {
      scrollRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, camStartX: camX, camStartY: camY }
    } else {
      handleMouseDown(e)
    }
  }

  function handleMouseMoveScroll(e: React.MouseEvent) {
    if (scrollRef.current.dragging) {
      const dx = e.clientX - scrollRef.current.startX
      const dy = e.clientY - scrollRef.current.startY
      setCamX(Math.max(0, scrollRef.current.camStartX - dx))
      setCamY(Math.max(0, scrollRef.current.camStartY - dy))
    }
    handleMouseMove(e)
  }

  function handleMouseUpScroll(e: React.MouseEvent) {
    if (e.button === 2) {
      scrollRef.current.dragging = false
    }
    handleMouseUp()
  }

  // === Save / Load ===
  function handleSave() {
    const json = JSON.stringify(es, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${es.mapName.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleLoad() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (re) => {
        try {
          const data = JSON.parse(re.target?.result as string)
          if (data.tiles && data.mapWidth && data.mapHeight) {
            setEs(data as EditorState)
          } else {
            alert('Invalid map file')
          }
        } catch {
          alert('Failed to parse map file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // === Resize map ===
  function resizeMap(newW: number, newH: number) {
    setEs(prev => {
      const newTiles = createBlankMap(newW, newH)
      for (let y = 0; y < Math.min(prev.mapHeight, newH); y++) {
        for (let x = 0; x < Math.min(prev.mapWidth, newW); x++) {
          newTiles[y][x] = prev.tiles[y][x]
        }
      }
      return {
        ...prev,
        mapWidth: newW,
        mapHeight: newH,
        tiles: newTiles,
        towns: prev.towns.filter(t => t.x < newW && t.y < newH),
        mines: prev.mines.filter(m => m.x < newW && m.y < newH),
        treasures: prev.treasures.filter(t => t.x < newW && t.y < newH),
        objects: prev.objects.filter(o => o.x < newW && o.y < newH),
        starts: prev.starts.filter(s => s.x < newW && s.y < newH),
      }
    })
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <span style={S.title}>🗺️ Map Editor</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={S.btn} onClick={handleLoad}>📂 Load</button>
          <button style={S.btnGold} onClick={handleSave}>💾 Save</button>
          {onPlayTest && (
            <button style={S.btnGold} onClick={() => onPlayTest(JSON.stringify(es))}>
              ▶ Test
            </button>
          )}
          <button style={S.btn} onClick={onBack}>← Back</button>
        </div>
      </div>

      <div style={S.main}>
        {/* Toolbar */}
        <div style={S.toolbar}>

          {/* Map Settings */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Map Settings</div>
            <label style={{ fontSize: 11, opacity: 0.6 }}>Name</label>
            <input
              style={S.input}
              value={es.mapName}
              onChange={e => setEs(prev => ({ ...prev, mapName: e.target.value }))}
            />
            <label style={{ fontSize: 11, opacity: 0.6 }}>Width × Height</label>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <input
                style={{ ...S.input, width: '45%' }}
                type="number" min={16} max={144}
                value={es.mapWidth}
                onChange={e => resizeMap(Number(e.target.value) || 48, es.mapHeight)}
              />
              <span>×</span>
              <input
                style={{ ...S.input, width: '45%' }}
                type="number" min={16} max={144}
                value={es.mapHeight}
                onChange={e => resizeMap(es.mapWidth, Number(e.target.value) || 48)}
              />
            </div>
            <label style={{ fontSize: 11, opacity: 0.6 }}>Max Players</label>
            <input
              style={S.input}
              type="number" min={2} max={8}
              value={es.maxPlayers}
              onChange={e => setEs(prev => ({ ...prev, maxPlayers: Math.max(2, Math.min(8, Number(e.target.value))) }))}
            />
          </div>

          {/* Tools */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Tools</div>
            <button style={S.toolBtn(tool === 'terrain')} onClick={() => setTool('terrain')}>🌿 Terrain</button>
            <button style={S.toolBtn(tool === 'town')} onClick={() => setTool('town')}>🏰 Town</button>
            <button style={S.toolBtn(tool === 'mine')} onClick={() => setTool('mine')}>⛏️ Mine</button>
            <button style={S.toolBtn(tool === 'treasure')} onClick={() => setTool('treasure')}>💰 Treasure</button>
            <button style={S.toolBtn(tool === 'object')} onClick={() => setTool('object')}>◆ Object</button>
            <button style={S.toolBtn(tool === 'start')} onClick={() => setTool('start')}>🚩 Start Pos</button>
            <button style={S.toolBtn(tool === 'erase')} onClick={() => setTool('erase')}>🧹 Erase</button>
          </div>

          {/* Tool options */}
          {tool === 'terrain' && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Terrain Type</div>
              {TERRAIN_TYPES.map(t => (
                <button
                  key={t.key}
                  style={{
                    ...S.toolBtn(selectedTerrain === t.key),
                    borderLeft: `4px solid ${t.color}`,
                  }}
                  onClick={() => setSelectedTerrain(t.key)}
                >
                  {t.label}
                </button>
              ))}
              <label style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>Brush Size</label>
              <input
                style={S.input}
                type="range" min={1} max={5}
                value={brushSize}
                onChange={e => setBrushSize(Number(e.target.value))}
              />
              <span style={{ fontSize: 11 }}>{brushSize}×{brushSize}</span>
            </div>
          )}

          {tool === 'town' && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Town Options</div>
              <label style={{ fontSize: 11, opacity: 0.6 }}>Faction</label>
              <select
                style={S.select}
                value={selectedFaction}
                onChange={e => setSelectedFaction(e.target.value as FactionId)}
              >
                {FACTION_IDS.map(f => (
                  <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                ))}
              </select>
              <label style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>Owner</label>
              <select
                style={S.select}
                value={selectedOwner}
                onChange={e => setSelectedOwner(Number(e.target.value))}
              >
                <option value={-1}>Neutral</option>
                {Array.from({ length: es.maxPlayers }, (_, i) => (
                  <option key={i} value={i}>Player {i + 1}</option>
                ))}
              </select>
            </div>
          )}

          {tool === 'mine' && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Mine Resource</div>
              {MINE_RESOURCES.map(r => (
                <button
                  key={r}
                  style={S.toolBtn(selectedMineResource === r)}
                  onClick={() => setSelectedMineResource(r)}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          )}

          {tool === 'object' && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Object Type</div>
              {MAP_OBJECT_TYPES.map(o => (
                <button
                  key={o.type}
                  style={S.toolBtn(selectedObjectType === o.type)}
                  onClick={() => setSelectedObjectType(o.type)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {tool === 'start' && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Player Start</div>
              {Array.from({ length: es.maxPlayers }, (_, i) => (
                <button
                  key={i}
                  style={S.toolBtn(selectedPlayerStart === i)}
                  onClick={() => setSelectedPlayerStart(i)}
                >
                  🚩 Player {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* Summary */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Map Contents</div>
            <div style={{ fontSize: 11, lineHeight: 1.8 }}>
              🏰 Towns: {es.towns.length}<br />
              ⛏️ Mines: {es.mines.length}<br />
              💰 Treasures: {es.treasures.length}<br />
              ◆ Objects: {es.objects.length}<br />
              🚩 Starts: {es.starts.length}/{es.maxPlayers}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div style={S.canvasWrap}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ cursor: tool === 'terrain' || tool === 'erase' ? 'crosshair' : 'pointer' }}
            onMouseDown={handleMouseDownScroll}
            onMouseMove={handleMouseMoveScroll}
            onMouseUp={handleMouseUpScroll}
            onMouseLeave={() => { isPaintingRef.current = false; setCursorTile(null) }}
            onContextMenu={handleContextMenu}
          />
        </div>
      </div>

      {/* Status bar */}
      <div style={S.statusBar}>
        <span>
          {cursorTile ? `Tile: (${cursorTile.x}, ${cursorTile.y})` : 'Hover over map'}
          {' · '}{es.mapWidth}×{es.mapHeight} tiles
        </span>
        <span>Right-click drag to scroll · Left-click to paint/place</span>
      </div>
    </div>
  )
}

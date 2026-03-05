/**
 * MapEditor — Visual map editor for Eight Minute Empire.
 * Paint terrain, assign continents, place player start positions.
 * Maps are persisted to localStorage and can be exported/imported as JSON.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ALL_TERRAINS,
  TERRAIN_COLORS,
  type Terrain,
  type MapTemplate,
} from './DangeZoneGame'
import styles from './SharedGame.module.css'

const LS_KEY = 'eme-custom-map'

const TERRAIN_LABELS: Record<Terrain, string> = {
  plains: '🌾 Plains', forest: '🌲 Forest', mountain: '⛰️ Mountain',
  water: '🌊 Water', desert: '🏜️ Desert',
}

const CONTINENT_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']

function emptyMap(cols: number, rows: number): MapTemplate {
  const terrains: Terrain[][] = []
  const continents: number[][] = []
  const contSize = Math.ceil(rows / (rows <= 4 ? 2 : 3))
  for (let r = 0; r < rows; r++) {
    terrains.push(new Array(cols).fill('plains'))
    continents.push(new Array(cols).fill(Math.min(2, Math.floor(r / contSize))))
  }
  return {
    name: 'Custom Map',
    cols, rows, terrains, continents,
    startPositions: [
      { col: 0, row: 0 },
      { col: cols - 1, row: rows - 1 },
      { col: cols - 1, row: 0 },
      { col: 0, row: rows - 1 },
    ],
  }
}

function loadCustomMap(): MapTemplate | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as MapTemplate
  } catch { /* Expected: localStorage or JSON parse may fail */ }
  return null
}

function saveCustomMap(map: MapTemplate) {
  localStorage.setItem(LS_KEY, JSON.stringify(map))
}

interface Props {
  onBack: () => void
  onSave: (map: MapTemplate) => void
  initialMap?: MapTemplate
}

type PaintTool = 'terrain' | 'continent' | 'startPos'

export default function MapEditor({ onBack, onSave, initialMap }: Props) {
  const [map, setMap] = useState<MapTemplate>(
    () => initialMap || loadCustomMap() || emptyMap(8, 5),
  )
  const [tool, setTool] = useState<PaintTool>('terrain')
  const [selectedTerrain, setSelectedTerrain] = useState<Terrain>('plains')
  const [selectedContinent, setSelectedContinent] = useState(0)
  const [selectedStartPlayer, setSelectedStartPlayer] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [showContinents, setShowContinents] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapRef = useRef(map)
  mapRef.current = map
  const toolRef = useRef(tool)
  toolRef.current = tool
  const isPainting = useRef(false)

  const CW = 740
  const CH = 460

  const cellW = CW / map.cols
  const cellH = CH / map.rows

  // Apply paint at cell
  const paintCell = useCallback((col: number, row: number) => {
    setMap(prev => {
      const next = { ...prev }
      if (toolRef.current === 'terrain') {
        const newTerrains = prev.terrains.map(r => [...r])
        newTerrains[row][col] = selectedTerrain
        next.terrains = newTerrains
      } else if (toolRef.current === 'continent') {
        const newCont = prev.continents.map(r => [...r])
        newCont[row][col] = selectedContinent
        next.continents = newCont
      } else if (toolRef.current === 'startPos') {
        const sp = [...prev.startPositions]
        while (sp.length <= selectedStartPlayer) sp.push({ col: 0, row: 0 })
        sp[selectedStartPlayer] = { col, row }
        next.startPositions = sp
      }
      return next
    })
    setDirty(true)
  }, [selectedTerrain, selectedContinent, selectedStartPlayer])

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    const col = Math.floor(x / cellW), row = Math.floor(y / cellH)
    if (col >= 0 && col < mapRef.current.cols && row >= 0 && row < mapRef.current.rows) {
      paintCell(col, row)
      isPainting.current = true
    }
  }, [cellW, cellH, paintCell])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting.current) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    const col = Math.floor(x / cellW), row = Math.floor(y / cellH)
    if (col >= 0 && col < mapRef.current.cols && row >= 0 && row < mapRef.current.rows) {
      paintCell(col, row)
    }
  }, [cellW, cellH, paintCell])

  const handleMouseUp = useCallback(() => { isPainting.current = false }, [])

  // Resize map
  const resizeMap = useCallback((newCols: number, newRows: number) => {
    setMap(prev => {
      const terrains: Terrain[][] = []
      const continents: number[][] = []
      const contSize = Math.ceil(newRows / (newRows <= 4 ? 2 : 3))
      for (let r = 0; r < newRows; r++) {
        const tRow: Terrain[] = []
        const cRow: number[] = []
        for (let c = 0; c < newCols; c++) {
          tRow.push(prev.terrains[r]?.[c] || 'plains')
          cRow.push(prev.continents[r]?.[c] ?? Math.min(2, Math.floor(r / contSize)))
        }
        terrains.push(tRow)
        continents.push(cRow)
      }
      const sp = prev.startPositions.map(s => ({
        col: Math.min(s.col, newCols - 1),
        row: Math.min(s.row, newRows - 1),
      }))
      return { ...prev, cols: newCols, rows: newRows, terrains, continents, startPositions: sp }
    })
    setDirty(true)
  }, [])

  const randomize = useCallback(() => {
    setMap(prev => {
      const terrains: Terrain[][] = []
      for (let r = 0; r < prev.rows; r++) {
        const row: Terrain[] = []
        for (let c = 0; c < prev.cols; c++) {
          const rng = Math.random()
          if (rng < 0.10) row.push('water')
          else if (rng < 0.25) row.push('mountain')
          else if (rng < 0.38) row.push('forest')
          else if (rng < 0.48) row.push('desert')
          else row.push('plains')
        }
        terrains.push(row)
      }
      // Keep start positions passable
      for (const sp of prev.startPositions) {
        if (terrains[sp.row]?.[sp.col]) terrains[sp.row][sp.col] = 'plains'
      }
      return { ...prev, terrains }
    })
    setDirty(true)
  }, [])

  const handleSave = useCallback(() => {
    saveCustomMap(map)
    onSave(map)
    setDirty(false)
  }, [map, onSave])

  const handleExport = useCallback(() => {
    const json = JSON.stringify(map, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'eme-map.json'; a.click()
    URL.revokeObjectURL(url)
  }, [map])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result as string) as MapTemplate
          if (imported.cols && imported.rows && imported.terrains) {
            setMap(imported)
            setDirty(true)
          }
        } catch { /* Expected: imported JSON may be malformed */ }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [])

  // Canvas rendering
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const m = mapRef.current
      const cw = CW / m.cols, ch = CH / m.rows

      ctx.fillStyle = '#0a0a1a'
      ctx.fillRect(0, 0, CW, CH)

      for (let r = 0; r < m.rows; r++) {
        for (let c = 0; c < m.cols; c++) {
          const x = c * cw, y = r * ch
          const terrain = m.terrains[r]?.[c] || 'plains'

          // Terrain color
          ctx.fillStyle = TERRAIN_COLORS[terrain]
          ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2)

          // Continent overlay
          if (showContinents) {
            const ci = m.continents[r]?.[c] || 0
            ctx.globalAlpha = 0.3
            ctx.fillStyle = CONTINENT_COLORS[ci % CONTINENT_COLORS.length]
            ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2)
            ctx.globalAlpha = 1
            // Continent label
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText(String(ci), x + cw / 2, y + ch / 2 + 12)
          }

          // Continent border
          if (r > 0 && (m.continents[r - 1]?.[c] ?? 0) !== (m.continents[r]?.[c] ?? 0)) {
            ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cw, y); ctx.stroke()
          }

          ctx.strokeStyle = '#333'; ctx.lineWidth = 0.5
          ctx.strokeRect(x, y, cw, ch)

          // Terrain icon
          const icon = terrain === 'water' ? '~' : terrain === 'mountain' ? '▲'
            : terrain === 'forest' ? '♣' : terrain === 'desert' ? '∴' : ''
          if (icon) {
            ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.4
            ctx.font = `${Math.min(cw, ch) * 0.4}px sans-serif`
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText(icon, x + cw / 2, y + ch / 2)
            ctx.globalAlpha = 1
          }
        }
      }

      // Start positions
      const spColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12']
      for (let i = 0; i < m.startPositions.length; i++) {
        const sp = m.startPositions[i]
        const x = sp.col * cw, y = sp.row * ch
        ctx.fillStyle = spColors[i % spColors.length]
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.arc(x + cw / 2, y + ch / 2, Math.min(cw, ch) * 0.25, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(`P${i + 1}`, x + cw / 2, y + ch / 2)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [showContinents])

  return (
    <div className={styles.container}>
      <h2 style={{ color: '#eee', margin: '0.5rem 0' }}>🗺️ Map Editor</h2>
      <p style={{ color: '#888', fontSize: 12, margin: 0 }}>
        {map.cols}×{map.rows} · "{map.name}"
      </p>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, margin: '8px 0', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className={styles.btn} onClick={randomize}>🎲 Random</button>
        <button className={styles.btn} onClick={() => setShowContinents(!showContinents)}>
          {showContinents ? '🗺️ Hide' : '🗺️ Show'} Continents
        </button>
        <span style={{ width: 8 }} />
        <button className={styles.btn} onClick={handleExport}>📥 Export</button>
        <button className={styles.btn} onClick={handleImport}>📤 Import</button>
        <span style={{ width: 8 }} />
        <button className={styles.restartBtn} onClick={handleSave} style={{ fontSize: 13, padding: '4px 16px' }}>
          💾 Save {dirty ? '*' : ''}
        </button>
        <button className={styles.btn} onClick={onBack}>← Back</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 4, width: '100%', maxWidth: 960 }}>
        {/* Tool panel */}
        <div style={{
          flex: '0 0 180px', background: '#111', borderRadius: 6, border: '1px solid #333',
          padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* Map name */}
          <label style={{ color: '#aaa', fontSize: 11 }}>Map Name</label>
          <input
            style={inputStyle}
            value={map.name}
            maxLength={30}
            onChange={e => { setMap(prev => ({ ...prev, name: e.target.value })); setDirty(true) }}
          />

          {/* Map size */}
          <label style={{ color: '#aaa', fontSize: 11 }}>Size (cols × rows)</label>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              style={{ ...inputStyle, width: 50 }} type="number" min={4} max={14}
              value={map.cols}
              onChange={e => resizeMap(Math.max(4, Math.min(14, parseInt(e.target.value) || 4)), map.rows)}
            />
            <span style={{ color: '#666' }}>×</span>
            <input
              style={{ ...inputStyle, width: 50 }} type="number" min={3} max={10}
              value={map.rows}
              onChange={e => resizeMap(map.cols, Math.max(3, Math.min(10, parseInt(e.target.value) || 3)))}
            />
          </div>

          {/* Tool selection */}
          <label style={{ color: '#aaa', fontSize: 11, marginTop: 4 }}>Paint Tool</label>
          {(['terrain', 'continent', 'startPos'] as const).map(t => (
            <button
              key={t}
              className={styles.btn}
              style={{
                background: tool === t ? '#335' : undefined,
                borderColor: tool === t ? '#88f' : undefined,
                textAlign: 'left', padding: '6px 8px',
              }}
              onClick={() => setTool(t)}
            >
              {t === 'terrain' ? '🌾 Terrain' : t === 'continent' ? '🗺️ Continent' : '📍 Start Pos'}
            </button>
          ))}

          {/* Tool options */}
          {tool === 'terrain' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {ALL_TERRAINS.map(tr => (
                <button
                  key={tr}
                  className={styles.btn}
                  style={{
                    background: selectedTerrain === tr ? TERRAIN_COLORS[tr] + '44' : undefined,
                    borderColor: selectedTerrain === tr ? TERRAIN_COLORS[tr] : undefined,
                    textAlign: 'left', fontSize: 12,
                  }}
                  onClick={() => setSelectedTerrain(tr)}
                >
                  {TERRAIN_LABELS[tr]}
                </button>
              ))}
            </div>
          )}

          {tool === 'continent' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[0, 1, 2, 3, 4].map(ci => (
                <button
                  key={ci}
                  className={styles.btn}
                  style={{
                    background: selectedContinent === ci ? CONTINENT_COLORS[ci] + '33' : undefined,
                    borderColor: selectedContinent === ci ? CONTINENT_COLORS[ci] : undefined,
                    textAlign: 'left', fontSize: 12,
                  }}
                  onClick={() => setSelectedContinent(ci)}
                >
                  <span style={{
                    display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                    background: CONTINENT_COLORS[ci], marginRight: 6,
                  }} />
                  Continent {ci + 1}
                </button>
              ))}
            </div>
          )}

          {tool === 'startPos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[0, 1, 2, 3].map(pi => (
                <button
                  key={pi}
                  className={styles.btn}
                  style={{
                    background: selectedStartPlayer === pi ? '#335' : undefined,
                    borderColor: selectedStartPlayer === pi ? '#88f' : undefined,
                    textAlign: 'left', fontSize: 12,
                  }}
                  onClick={() => setSelectedStartPlayer(pi)}
                >
                  📍 Player {pi + 1}
                  {map.startPositions[pi] &&
                    ` (${map.startPositions[pi].col},${map.startPositions[pi].row})`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CW} height={CH}
          style={{
            flex: 1, border: '2px solid #444', borderRadius: 6,
            cursor: 'crosshair', maxWidth: CW,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          aria-label="Danger Zone map editor canvas"
        />
      </div>

      <div style={{ color: '#666', fontSize: 11, marginTop: 4 }}>
        Click/drag to paint · {tool === 'terrain' ? `Painting: ${selectedTerrain}`
          : tool === 'continent' ? `Continent: ${selectedContinent + 1}`
          : `Start position: Player ${selectedStartPlayer + 1}`}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#1a1a2e', color: '#eee', border: '1px solid #444',
  borderRadius: 4, padding: '4px 8px', fontSize: 13, outline: 'none',
}

/**
 * NoteParticles — Full-page overlay that spawns tiny music-note particles
 * on every click, Enter press, or gamepad button press.
 * Particles burst outward with gravity, spin, and fade out.
 * The canvas sits on top of everything with pointer-events: none.
 */
import { useRef, useEffect, useCallback } from 'react'
import { readNotePalette, type NotePalette } from './noteThemeColors'

/* ── tunables ──────────────────────────────────────────── */
const PARTICLE_COUNT = 14        // notes per burst
const LIFETIME       = 0.9       // seconds
const GRAVITY        = 320       // px/s²
const BURST_SPEED    = 160       // initial outward speed (px/s)
const SPIN_SPEED     = 6         // rad/s max
const MIN_SIZE       = 8
const MAX_SIZE       = 14

const NOTE_CHARS = [
  '\u266A',    // ♪
  '\u266B',    // ♫
  '\u266C',    // ♬
  '\u{1D160}', // 𝅘𝅥
  '\u{1D161}', // 𝅘𝅥𝅮
]

/* ── particle type ─────────────────────────────────────── */
interface Particle {
  x: number; y: number
  vx: number; vy: number
  rot: number; vr: number
  size: number
  char: string
  life: number      // remaining (s)
  maxLife: number
  colorIdx: number   // -1 = base, 0..3 = accent
}

/* ── component ─────────────────────────────────────────── */
export default function NoteParticles() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const particles    = useRef<Particle[]>([])
  const rafRef       = useRef(0)
  const lastT        = useRef(0)
  const padPrev      = useRef<boolean[]>([])
  const paletteRef   = useRef<NotePalette | null>(null)
  const paletteTick  = useRef(0)

  /* spawn a burst at (px, py) in viewport coordinates */
  const spawnBurst = useCallback((px: number, py: number) => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = BURST_SPEED * (0.4 + Math.random() * 0.6)
      const life  = LIFETIME * (0.6 + Math.random() * 0.4)
      // ~15% of particles get the accent (yellow) color
      const colorIdx = Math.random() < 0.15
        ? 0
        : -1
      particles.current.push({
        x: px, y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,   // slight upward bias
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * SPIN_SPEED * 2,
        size: MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE),
        char: NOTE_CHARS[Math.floor(Math.random() * NOTE_CHARS.length)],
        life,
        maxLife: life,
        colorIdx,
      })
    }
  }, [])

  /* ── animation loop ──────────────────────────────────── */
  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current
    if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }
    const ctx = canvas.getContext('2d')
    if (!ctx) { rafRef.current = requestAnimationFrame(draw); return }

    const dpr  = window.devicePixelRatio || 1
    const w    = window.innerWidth
    const h    = window.innerHeight
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width  = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width  = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const dt = lastT.current ? Math.min((now - lastT.current) / 1000, 0.05) : 0
    lastT.current = now

    ctx.clearRect(0, 0, w, h)

    // Re-read palette periodically to track theme switches
    paletteTick.current++
    if (!paletteRef.current || paletteTick.current % 60 === 0) {
      paletteRef.current = readNotePalette()
    }
    const pal = paletteRef.current

    /* ── poll gamepad buttons ── */
    if (navigator.getGamepads) {
      const pads = navigator.getGamepads()
      for (let pi = 0; pi < pads.length; pi++) {
        const gp = pads[pi]
        if (!gp) continue
        for (let bi = 0; bi < gp.buttons.length; bi++) {
          const key = pi * 100 + bi
          const pressed = gp.buttons[bi].pressed
          if (pressed && !padPrev.current[key]) {
            // burst at screen center (no pointer position for gamepads)
            spawnBurst(w / 2, h / 2)
          }
          padPrev.current[key] = pressed
        }
      }
    }

    /* ── update & render particles ── */
    const alive: Particle[] = []
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'

    for (const p of particles.current) {
      p.life -= dt
      if (p.life <= 0) continue

      p.vy += GRAVITY * dt
      p.x  += p.vx * dt
      p.y  += p.vy * dt
      p.rot += p.vr * dt

      const alpha = Math.max(0, p.life / p.maxLife)
      const scale = 0.5 + 0.5 * alpha          // shrink as they die

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.font = `${p.size * scale}px serif`
      // thin outline
      ctx.lineWidth   = 1.4
      ctx.strokeStyle = pal.notesDark
        ? `rgba(255,255,255,${alpha * 0.8})`
        : `rgba(0,0,0,${alpha * 0.55})`
      ctx.strokeText(p.char, 0, 0)
      // fill — base or accent
      const baseColor = p.colorIdx < 0
        ? pal.base
        : pal.accents[p.colorIdx % pal.accents.length]
      // inject current alpha into the rgba string
      ctx.fillStyle = baseColor.replace(/[\d.]+\)$/, `${alpha})`)
      ctx.fillText(p.char, 0, 0)
      ctx.restore()

      alive.push(p)
    }
    particles.current = alive

    rafRef.current = requestAnimationFrame(draw)
  }, [spawnBurst])

  /* ── event listeners ─────────────────────────────────── */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      spawnBurst(e.clientX, e.clientY)
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      // Try to get position of the focused element
      const el = document.activeElement as HTMLElement | null
      if (el) {
        const rect = el.getBoundingClientRect()
        spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2)
      } else {
        spawnBurst(window.innerWidth / 2, window.innerHeight / 2)
      }
    }

    window.addEventListener('click', handleClick, true)
    window.addEventListener('keydown', handleKey, true)

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('click', handleClick, true)
      window.removeEventListener('keydown', handleKey, true)
      cancelAnimationFrame(rafRef.current)
    }
  }, [draw, spawnBurst])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      role="img"
      aria-label="Note particles animation canvas"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
    />
  )
}

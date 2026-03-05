/**
 * RadioContext — global radio playback + pitch detection.
 *
 * Pitch sources:
 *  'fft'  — Web Audio AnalyserNode on the proxied stream (frontend FFT, approximate)
 *  'ws'   — WebSocket receiving { midi, hz, clarity } from the backend pitch service
 *  'none' — no pitch detection (notes keep random positions)
 *
 * Backend API used:
 *  GET /api/radio-stream/default          → { stationId, name, streamUrl }
 *  GET /api/radio-stream?stationId={id}   → chunked audio/mpeg stream (CORS headers set)
 *  GET /api/radio-stream/stations         → paginated list of stations
 *  WS  /api/radio-pitch                   → { midi, hz, clarity } ~100ms (future)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

// ── API URLs ─────────────────────────────────────────────────────────────────
const RADIO_DEFAULT_URL  = '/api/radio-stream/default'
const RADIO_STREAM_URL   = '/api/radio-stream'          // ?stationId=N for specific station
/** Direct Classic FM URL — fallback when proxy returns error (no CORS = no FFT, only playback) */
const RADIO_DIRECT_URL   = 'https://media-ice.musicradio.com/ClassicFMMP3'
/** Backend WebSocket for server-side pitch detection (future) */
const RADIO_WS_PITCH_URL = '/api/radio-pitch'

// ── Station info type ────────────────────────────────────────────────────────
export interface RadioStationInfo {
  stationId: number
  name: string
  streamUrl: string   // relative proxy URL, e.g. /api/radio-stream?stationId=42
}

// ── FFT tunables ──────────────────────────────────────────────────────────────
const FFT_SIZE          = 2048
/** Minimum FFT magnitude (0-255) to consider a bin as signal vs noise */
const FFT_NOISE_FLOOR   = 40
/** Frequency search range for dominant pitch (Hz) — classical / orchestral fundamentals */
const FFT_MIN_HZ        = 180
const FFT_MAX_HZ        = 1400
/** Exponential smoothing factor for detected MIDI (0 = frozen, 1 = instant) */
const MIDI_SMOOTH       = 0.18
/** WebSocket clarity threshold below which we discard the reading */
const WS_CLARITY_MIN    = 0.38

// ── Types ─────────────────────────────────────────────────────────────────────
export type PitchSource = 'fft' | 'ws' | 'none'

export interface RadioContextValue {
  radioPlaying: boolean
  toggleRadio: () => void
  /**
   * Current detected MIDI note (64–77 matches NoteRiver staff range).
   * Written every animation frame — use as a ref, not state, to avoid re-renders.
   * null when no signal or radio is stopped.
   */
  detectedMidiRef: React.MutableRefObject<number | null>
  pitchSource: PitchSource
  setPitchSource: (src: PitchSource) => void
  /** Currently playing station, null when stopped or still loading. */
  currentStation: RadioStationInfo | null
  /** Switch to a different station by stationId. No-op if radio is stopped. */
  changeStation: (stationId: number) => void
}

const RadioContext = createContext<RadioContextValue | null>(null)

// ── Helper: dominant frequency via FFT ───────────────────────────────────────
function fftDominantMidi(
  analyser: AnalyserNode,
  freqData: Uint8Array,
  sampleRate: number,
): number | null {
  analyser.getByteFrequencyData(freqData)
  const binHz  = sampleRate / FFT_SIZE
  const minBin = Math.ceil(FFT_MIN_HZ / binHz)
  const maxBin = Math.min(Math.floor(FFT_MAX_HZ / binHz), freqData.length - 1)

  let maxVal = FFT_NOISE_FLOOR
  let maxBinIdx = -1
  for (let i = minBin; i <= maxBin; i++) {
    if (freqData[i] > maxVal) {
      maxVal   = freqData[i]
      maxBinIdx = i
    }
  }
  if (maxBinIdx < 0) return null

  const hz   = maxBinIdx * binHz
  const midi = 12 * Math.log2(hz / 440) + 69
  return midi
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function RadioProvider({ children }: { children: React.ReactNode }) {
  const [radioPlaying,   setRadioPlaying]   = useState(false)
  const [pitchSource,    setPitchSource]    = useState<PitchSource>('fft')
  const [currentStation, setCurrentStation] = useState<RadioStationInfo | null>(null)

  /** Current detected MIDI — written by the FFT/WS loop, read by NoteRiver's rAF */
  const detectedMidiRef = useRef<number | null>(null)

  // Internal playback handles
  const audioRef     = useRef<HTMLAudioElement | null>(null)
  const acRef        = useRef<AudioContext | null>(null)
  const analyserRef  = useRef<AnalyserNode | null>(null)
  const freqDataRef  = useRef<Uint8Array | null>(null)
  const rafRef       = useRef<number>(0)
  const wsRef        = useRef<WebSocket | null>(null)
  const smoothedRef  = useRef<number | null>(null)  // smoothed MIDI accumulator

  // ── FFT animation loop ──────────────────────────────────────────────────
  const fftLoop = useCallback(() => {
    const analyser = analyserRef.current
    const freqData = freqDataRef.current
    const ac       = acRef.current
    if (!analyser || !freqData || !ac) return

    const rawMidi = fftDominantMidi(analyser, freqData, ac.sampleRate)
    if (rawMidi !== null && isFinite(rawMidi)) {
      smoothedRef.current =
        smoothedRef.current === null
          ? rawMidi
          : smoothedRef.current * (1 - MIDI_SMOOTH) + rawMidi * MIDI_SMOOTH
      detectedMidiRef.current = Math.round(smoothedRef.current)
    } else {
      // Decay smoothed value slowly on silence (do not snap to null)
      if (smoothedRef.current !== null) {
        // after ~30 frames of silence assume no signal
        smoothedRef.current = null
        detectedMidiRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(fftLoop)
  }, [])

  // ── Start / Stop helpers ────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    wsRef.current?.close()
    wsRef.current = null
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.src = ''
    audioRef.current = null
    acRef.current?.close().catch(() => { /* ignore */ })
    acRef.current    = null
    analyserRef.current  = null
    freqDataRef.current  = null
    smoothedRef.current  = null
    detectedMidiRef.current = null
    setRadioPlaying(false)
    setCurrentStation(null)
  }, [])

  /**
   * Attach Web Audio FFT graph to an already-playing <audio> element.
   * Must be called after audio.play() to avoid AudioContext suspension.
   */
  const attachFFT = useCallback((audio: HTMLAudioElement) => {
    try {
      const ac       = new AudioContext()
      const source   = ac.createMediaElementSource(audio)
      const analyser = ac.createAnalyser()
      analyser.fftSize             = FFT_SIZE
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      analyser.connect(ac.destination)
      acRef.current       = ac
      analyserRef.current = analyser
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount)
      rafRef.current = requestAnimationFrame(fftLoop)
    } catch (e) {
      console.warn('[RadioContext] Web Audio setup failed', e)
    }
  }, [fftLoop])

  const startRadio = useCallback(async (src: PitchSource, stationId?: number) => {
    // 1. Resolve stream URL — prefer backend proxy (required for CORS/FFT)
    let streamUrl = RADIO_DIRECT_URL
    let stationInfo: RadioStationInfo | null = null
    try {
      const endpoint = stationId != null
        ? `${RADIO_STREAM_URL}/default`   // could be /default or ?stationId=N
        : RADIO_DEFAULT_URL
      const res  = await fetch(stationId != null
        ? `${RADIO_STREAM_URL}?stationId=${stationId}`  // check station exists
        : endpoint,
        { method: stationId != null ? 'HEAD' : 'GET' },
      )
      if (stationId != null && res.ok) {
        stationInfo = { stationId, name: `Station ${stationId}`, streamUrl: `${RADIO_STREAM_URL}?stationId=${stationId}` }
        streamUrl   = stationInfo.streamUrl
      } else if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      } else {
        const data: RadioStationInfo = await res.json()
        stationInfo = data
        streamUrl   = data.streamUrl
      }
    } catch (e) {
      console.warn('[RadioContext] Could not fetch station info, using fallback', e)
      // streamUrl stays as RADIO_DIRECT_URL — only playback, no FFT
    }

    const audio = new Audio(streamUrl)
    audio.volume = 0.5
    audio.crossOrigin = 'anonymous'   // required for Web Audio API
    audioRef.current = audio

    const playPromise = audio.play()
    playPromise?.catch(() => {
      // Proxy not ready — fall back to direct URL (Web Audio won't work, only playback)
      audio.src = RADIO_DIRECT_URL
      audio.crossOrigin = ''
      audio.play().catch(() => { /* autoplay blocked — ignore */ })
    })

    setCurrentStation(stationInfo)
    setRadioPlaying(true)  // mark playing immediately so UI reacts fast

    if (src === 'fft') {
      attachFFT(audio)
    } else if (src === 'ws') {
      // ── WebSocket pitch mode (backend provides { midi, hz, clarity }) ────
      try {
        const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:'
        const ws = new WebSocket(`${wsProto}//${location.host}${RADIO_WS_PITCH_URL}`)
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data as string) as { midi: number; hz?: number; clarity?: number }
            if (typeof data.midi === 'number' && (data.clarity === undefined || data.clarity >= WS_CLARITY_MIN)) {
              smoothedRef.current =
                smoothedRef.current === null
                  ? data.midi
                  : smoothedRef.current * (1 - MIDI_SMOOTH) + data.midi * MIDI_SMOOTH
              detectedMidiRef.current = Math.round(smoothedRef.current)
            }
          } catch { /* ignore parse errors */ }
        }
        ws.onerror   = () => console.warn('[RadioContext] pitch WS error')
        ws.onclose   = () => { smoothedRef.current = null; detectedMidiRef.current = null }
        wsRef.current = ws
      } catch (e) {
        console.warn('[RadioContext] WS pitch setup failed', e)
      }
    }
    // 'none' → just play, detectedMidiRef stays null
  }, [fftLoop, attachFFT])

  const toggleRadio = useCallback(() => {
    if (radioPlaying) {
      stopAll()
    } else {
      void startRadio(pitchSource)
    }
  }, [radioPlaying, pitchSource, stopAll, startRadio])

  /** Switch station while radio is playing. */
  const changeStation = useCallback((stationId: number) => {
    if (!radioPlaying) return
    stopAll()
    void startRadio(pitchSource, stationId)
  }, [radioPlaying, pitchSource, stopAll, startRadio])

  // Re-start when pitchSource changes while playing
  useEffect(() => {
    if (radioPlaying) {
      stopAll()
      void startRadio(pitchSource)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitchSource])

  // Cleanup on unmount
  useEffect(() => stopAll, [stopAll])

  return (
    <RadioContext.Provider
      value={{ radioPlaying, toggleRadio, detectedMidiRef, pitchSource, setPitchSource, currentStation, changeStation }}
    >
      {children}
    </RadioContext.Provider>
  )
}

export function useRadio(): RadioContextValue {
  const ctx = useContext(RadioContext)
  if (!ctx) throw new Error('useRadio must be used inside <RadioProvider>')
  return ctx
}

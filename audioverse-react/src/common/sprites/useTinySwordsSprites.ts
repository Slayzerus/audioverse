import { useEffect, useState } from 'react'
import { logger } from '../../utils/logger'
const log = logger.scoped('useTinySwordsSprites')

type ImageMap = Record<string, HTMLImageElement>

function basename(p: string) {
  const parts = p.split('/')
  return parts[parts.length - 1]
}

function keyFromPath(p: string) {
  return basename(p).toLowerCase()
}

export default function useTinySwordsSprites() {
  const [loaded, setLoaded] = useState(false)
  const [images, setImages] = useState<ImageMap>({})

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const manifestResp = await fetch('/assets/sprites/Tiny Swords/manifest.json')
        if (!manifestResp.ok) {
          setLoaded(true)
          return
        }
        const manifest = await manifestResp.json()
        const files: string[] = manifest.files || []
        const imgs: ImageMap = {}
        let remaining = files.length
        if (remaining === 0) { setImages(imgs); setLoaded(true); return }
        files.forEach(f => {
          if (!f.toLowerCase().endsWith('.png') && !f.toLowerCase().endsWith('.jpg')) {
            remaining--
            if (remaining === 0 && !cancelled) { setImages(imgs); setLoaded(true) }
            return
          }
          const url = '/' + f.replace(/^[\\/]+/, '')
          const img = new Image()
          img.src = url
          img.onload = () => {
            imgs[keyFromPath(f)] = img
            remaining--
            if (remaining === 0 && !cancelled) { setImages(imgs); setLoaded(true) }
          }
          img.onerror = () => {
            remaining--
            if (remaining === 0 && !cancelled) { setImages(imgs); setLoaded(true) }
          }
        })
      } catch (err) {
        log.warn('TinySwords manifest missing or failed to load', err)
        setLoaded(true)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { loaded, images }
}

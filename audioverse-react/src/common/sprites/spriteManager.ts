type ImageMap = Record<string, HTMLImageElement>

function basename(name: string) {
  const parts = name.split('/')
  return parts[parts.length - 1]
}

function normalKey(name: string) {
  return basename(name).replace(/\.[^.]+$/, '').toLowerCase()
}

// Find first image whose key includes any candidate substring
export function findImage(images: ImageMap, candidates: string[]) {
  for (const k of Object.keys(images)) {
    for (const c of candidates) if (k.includes(c)) return images[k]
  }
  return null
}

// Find frame sequence: collect images whose key contains prefix and optional numeric suffix
export function findFrames(images: ImageMap, prefixCandidates: string[]) {
  const frames: { key: string; img: HTMLImageElement }[] = []
  for (const k of Object.keys(images)) {
    const nk = normalKey(k)
    for (const p of prefixCandidates) {
      if (nk.includes(p)) frames.push({ key: nk, img: images[k] })
    }
  }
  if (frames.length === 0) return null
  // sort by key to get deterministic order (helps numeric suffixes)
  frames.sort((a, b) => a.key.localeCompare(b.key))
  return frames.map(f => f.img)
}

// Get an animated frame from candidates based on tick/time
export function getAnimated(images: ImageMap, prefixCandidates: string[], tick: number, speed = 6) {
  const frames = findFrames(images, prefixCandidates)
  if (!frames) return findImage(images, prefixCandidates)
  const idx = Math.floor((tick / speed) % frames.length)
  return frames[idx]
}

export default {
  findImage, findFrames, getAnimated
}

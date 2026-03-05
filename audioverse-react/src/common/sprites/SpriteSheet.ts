/**
 * SpriteSheet — loads a sprite sheet image and extracts frames.
 * Tiny Swords sprite sheets have frames arranged horizontally,
 * with frameHeight = image.height and frameWidth = image.height (square frames).
 *
 * Reusable across all games that use Tiny Swords assets.
 */

export interface SpriteSheetData {
  image: HTMLImageElement
  frameWidth: number
  frameHeight: number
  frameCount: number
}

/** Load an image and return a SpriteSheetData with auto-detected square frames */
export function loadSpriteSheet(src: string): Promise<SpriteSheetData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const frameHeight = img.height
      const frameWidth = frameHeight // square frames
      const frameCount = Math.max(1, Math.round(img.width / frameWidth))
      resolve({ image: img, frameWidth, frameHeight, frameCount })
    }
    img.onerror = () => reject(new Error(`Failed to load: ${src}`))
    img.src = src
  })
}

/** Load a single static image (buildings, decorations, etc.) */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load: ${src}`))
    img.src = src
  })
}

/** Draw a specific frame from a sprite sheet */
export function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheetData,
  frameIndex: number,
  dx: number, dy: number,
  dw: number, dh: number,
  flipX = false,
) {
  const fi = frameIndex % sheet.frameCount
  const sx = fi * sheet.frameWidth
  ctx.save()
  if (flipX) {
    ctx.translate(dx + dw, dy)
    ctx.scale(-1, 1)
    ctx.drawImage(sheet.image, sx, 0, sheet.frameWidth, sheet.frameHeight, 0, 0, dw, dh)
  } else {
    ctx.drawImage(sheet.image, sx, 0, sheet.frameWidth, sheet.frameHeight, dx, dy, dw, dh)
  }
  ctx.restore()
}

/** Get animated frame index from tick */
export function getFrameIndex(tick: number, frameCount: number, speed = 6): number {
  return Math.floor(tick / speed) % frameCount
}

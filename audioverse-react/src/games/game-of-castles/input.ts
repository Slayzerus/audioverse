/**
 * input.ts — Keyboard, mouse, and gamepad input handling.
 */
// import type { GameState, Hero } from './types'

// ═════════════════════════════════════════════════════════════
//  KEY BINDINGS
// ═════════════════════════════════════════════════════════════
export const KEYBINDS = {
  // Adventure map
  moveUp: ['ArrowUp', 'w', 'W'],
  moveDown: ['ArrowDown', 's', 'S'],
  moveLeft: ['ArrowLeft', 'a', 'A'],
  moveRight: ['ArrowRight', 'd', 'D'],
  endTurn: ['Enter', 'e', 'E'],
  nextHero: ['Tab'],
  prevHero: ['Shift+Tab'],
  openTown: ['t', 'T'],
  spellBook: ['b', 'B'],
  questLog: ['q', 'Q'],
  systemMenu: ['Escape'],
  quickSave: ['F5'],
  quickLoad: ['F9'],

  // Combat
  wait: ['w', 'W'],
  defend: ['d', 'D'],
  shoot: ['s', 'S'],
  castSpell: ['c', 'C'],
  autoResolve: ['a', 'A'],
  flee: ['f', 'F'],
  surrender: ['r', 'R'],

  // General
  confirm: ['Enter', ' '],
  cancel: ['Escape'],
  info: ['i', 'I'],
}

// ═════════════════════════════════════════════════════════════
//  INPUT STATE
// ═════════════════════════════════════════════════════════════
export interface InputState {
  keysDown: Set<string>
  keysJustPressed: Set<string>
  mouseX: number
  mouseY: number
  mouseDown: boolean
  mouseJustClicked: boolean
  rightClick: boolean
  scrollDelta: number
  gamepadConnected: boolean
}

export function createInputState(): InputState {
  return {
    keysDown: new Set(),
    keysJustPressed: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    mouseJustClicked: false,
    rightClick: false,
    scrollDelta: 0,
    gamepadConnected: false,
  }
}

// ═════════════════════════════════════════════════════════════
//  EVENT HANDLERS
// ═════════════════════════════════════════════════════════════
export function setupInputHandlers(
  canvas: HTMLCanvasElement,
  inputState: InputState,
  onKeyAction?: (action: string) => void,
) {
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.shiftKey && e.key !== 'Shift' ? `Shift+${e.key}` : e.key
    if (!inputState.keysDown.has(key)) {
      inputState.keysJustPressed.add(key)
    }
    inputState.keysDown.add(key)

    // Map to action
    if (onKeyAction) {
      for (const [action, keys] of Object.entries(KEYBINDS)) {
        if (keys.includes(key)) {
          onKeyAction(action)
          e.preventDefault()
          break
        }
      }
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.shiftKey && e.key !== 'Shift' ? `Shift+${e.key}` : e.key
    inputState.keysDown.delete(key)
    inputState.keysDown.delete(e.key)
  }

  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    inputState.mouseX = e.clientX - rect.left
    inputState.mouseY = e.clientY - rect.top
  }

  const handleMouseDown = (e: MouseEvent) => {
    inputState.mouseDown = true
    inputState.mouseJustClicked = true
    inputState.rightClick = e.button === 2
  }

  const handleMouseUp = () => {
    inputState.mouseDown = false
  }

  const handleContextMenu = (e: Event) => {
    e.preventDefault()
  }

  const handleWheel = (e: WheelEvent) => {
    inputState.scrollDelta = e.deltaY
    e.preventDefault()
  }

  // Attach
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  canvas.addEventListener('mousemove', handleMouseMove)
  canvas.addEventListener('mousedown', handleMouseDown)
  canvas.addEventListener('mouseup', handleMouseUp)
  canvas.addEventListener('contextmenu', handleContextMenu)
  canvas.addEventListener('wheel', handleWheel, { passive: false })

  // Return cleanup
  return () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('mousedown', handleMouseDown)
    canvas.removeEventListener('mouseup', handleMouseUp)
    canvas.removeEventListener('contextmenu', handleContextMenu)
    canvas.removeEventListener('wheel', handleWheel)
  }
}

/** Clear per-frame input state (call at end of each frame) */
export function clearFrameInput(inputState: InputState) {
  inputState.keysJustPressed.clear()
  inputState.mouseJustClicked = false
  inputState.rightClick = false
  inputState.scrollDelta = 0
}

// ═════════════════════════════════════════════════════════════
//  MOUSE → WORLD COORDINATE CONVERSION
// ═════════════════════════════════════════════════════════════
export function screenToTile(
  mx: number, my: number,
  cameraX: number, cameraY: number,
  tileSize: number,
): { col: number; row: number } {
  const col = Math.floor((mx + cameraX) / tileSize)
  const row = Math.floor((my + cameraY) / tileSize)
  return { col, row }
}

export function screenToCombatTile(
  mx: number, my: number,
  offsetX: number, offsetY: number,
  tileSize: number,
): { col: number; row: number } {
  const col = Math.floor((mx - offsetX) / tileSize)
  const row = Math.floor((my - offsetY) / tileSize)
  return { col, row }
}

// ═════════════════════════════════════════════════════════════
//  GAMEPAD SUPPORT
// ═════════════════════════════════════════════════════════════
export function pollGamepad(inputState: InputState): { dx: number; dy: number; confirm: boolean; cancel: boolean } {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : []
  const gp = gamepads[0]
  if (!gp) {
    inputState.gamepadConnected = false
    return { dx: 0, dy: 0, confirm: false, cancel: false }
  }
  inputState.gamepadConnected = true

  const deadzone = 0.3
  let dx = 0, dy = 0
  if (Math.abs(gp.axes[0]) > deadzone) dx = gp.axes[0] > 0 ? 1 : -1
  if (Math.abs(gp.axes[1]) > deadzone) dy = gp.axes[1] > 0 ? 1 : -1

  // D-pad
  if (gp.buttons[12]?.pressed) dy = -1
  if (gp.buttons[13]?.pressed) dy = 1
  if (gp.buttons[14]?.pressed) dx = -1
  if (gp.buttons[15]?.pressed) dx = 1

  return {
    dx, dy,
    confirm: !!gp.buttons[0]?.pressed,
    cancel: !!gp.buttons[1]?.pressed,
  }
}

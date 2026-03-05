/**
 * sceneSync.ts — Synchronize game state → Three.js scene each frame.
 *
 * Creates and updates 3D meshes for each bunny's ragdoll parts,
 * handles coin spinning, death flash effects, grab-line visualization,
 * bike riding visuals, physics balls, loose spikes, and traps.
 *
 * Coordinate mapping: meshY = WORLD_H - gameY (flip Y-axis).
 */
import * as THREE from 'three'
import type { GameState, Bunny } from './types'
import { WORLD_H, BODY_RADIUS, HEAD_RADIUS, LEG_LEN, ARM_LEN } from './constants'
import type { LevelMeshes } from './levelGenerator'

/** Linear interpolation helper: a when t=0, b when t=1 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Mesh references for one bunny */
export interface BunnyMeshes {
  group: THREE.Group
  head: THREE.Mesh
  torso: THREE.Mesh
  pelvis: THREE.Mesh
  earL: THREE.Mesh
  earR: THREE.Mesh
  eyeWhiteL: THREE.Mesh
  eyePupilL: THREE.Mesh
  eyeWhiteR: THREE.Mesh
  eyePupilR: THREE.Mesh
  nose: THREE.Mesh
  snout: THREE.Mesh
  whiskerL: THREE.Line
  whiskerR: THREE.Line
  tail: THREE.Mesh
  legL: THREE.Mesh
  legR: THREE.Mesh
  footL: THREE.Mesh
  footR: THREE.Mesh
  armL: THREE.Mesh
  armR: THREE.Mesh
  handL: THREE.Mesh
  handR: THREE.Mesh
  neck: THREE.Mesh
  body: THREE.Mesh
  belly: THREE.Mesh
  grabLine: THREE.Line | null
  nameSprite: THREE.Sprite
  livesSprite: THREE.Sprite
}

/** All bunny meshes indexed by player index */
export type BunnyMeshMap = Map<number, BunnyMeshes>

function flipY(screenY: number): number {
  return WORLD_H - screenY
}

function hexToThree(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

function makeLimb(length: number, thickness: number, color: THREE.Color): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(thickness * 0.8, thickness, length, 8)
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 })
  return new THREE.Mesh(geo, mat)
}

function makeTextSprite(text: string, color: string, fontSize: number): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillStyle = color
  ctx.fillText(text, 128, 40)
  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(80, 20, 1)
  return sprite
}

function updateTextSprite(sprite: THREE.Sprite, text: string, color: string, fontSize: number) {
  const mat = sprite.material as THREE.SpriteMaterial
  const tex = mat.map as THREE.CanvasTexture
  const canvas = tex.image as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillStyle = color
  ctx.fillText(text, 128, 40)
  tex.needsUpdate = true
}

function makeWhisker(length: number): THREE.Line {
  const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0)]
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.6 })
  return new THREE.Line(geo, mat)
}

// ── Create 3D meshes for all bunnies ──────────────────────
export function createBunnyMeshes(scene: THREE.Scene, bunnies: Bunny[]): BunnyMeshMap {
  const map: BunnyMeshMap = new Map()

  for (const b of bunnies) {
    const col = hexToThree(b.color)
    const lightCol = col.clone().lerp(new THREE.Color(0xffffff), 0.3)
    const group = new THREE.Group()

    // Head sphere — slightly squashed for cuter look
    const headGeo = new THREE.SphereGeometry(HEAD_RADIUS, 20, 16)
    headGeo.scale(1, 1.1, 0.95)
    const headMat = new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.45,
      metalness: 0.05,
    })
    const head = new THREE.Mesh(headGeo, headMat)
    head.castShadow = true
    group.add(head)

    // Ears — longer, tapered, with inner pink
    const earGeo = new THREE.CylinderGeometry(1.5, 3.5, 18, 8)
    const earMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 })
    const earL = new THREE.Mesh(earGeo, earMat)
    earL.castShadow = true
    group.add(earL)
    const earR = new THREE.Mesh(earGeo.clone(), earMat.clone())
    earR.castShadow = true
    group.add(earR)

    // Eyes — two eyes with white and pupil
    const eyeGeo = new THREE.SphereGeometry(2.8, 10, 10)
    const eyeWhiteL = new THREE.Mesh(eyeGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }))
    group.add(eyeWhiteL)
    const pupilGeo = new THREE.SphereGeometry(1.4, 8, 8)
    const eyePupilL = new THREE.Mesh(pupilGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }))
    group.add(eyePupilL)
    const eyeWhiteR = new THREE.Mesh(eyeGeo.clone(), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }))
    group.add(eyeWhiteR)
    const eyePupilR = new THREE.Mesh(pupilGeo.clone(), new THREE.MeshStandardMaterial({ color: 0x111111 }))
    group.add(eyePupilR)

    // Snout — small bump on face
    const snoutGeo = new THREE.SphereGeometry(4, 10, 8)
    snoutGeo.scale(1, 0.7, 0.8)
    const snoutMat = new THREE.MeshStandardMaterial({ color: lightCol, roughness: 0.5 })
    const snout = new THREE.Mesh(snoutGeo, snoutMat)
    group.add(snout)

    // Nose — pink triangle
    const noseGeo = new THREE.SphereGeometry(1.8, 6, 6)
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xff9999, roughness: 0.4 })
    const nose = new THREE.Mesh(noseGeo, noseMat)
    group.add(nose)

    // Whiskers
    const whiskerL = makeWhisker(12)
    group.add(whiskerL)
    const whiskerR = makeWhisker(-12)
    group.add(whiskerR)

    // Torso sphere — slightly oval
    const torsoGeo = new THREE.SphereGeometry(BODY_RADIUS, 20, 14)
    torsoGeo.scale(1, 1.05, 0.9)
    const torsoMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, metalness: 0.05 })
    const torso = new THREE.Mesh(torsoGeo, torsoMat)
    torso.castShadow = true
    group.add(torso)

    // Belly patch — lighter front
    const bellyGeo = new THREE.SphereGeometry(BODY_RADIUS * 0.7, 12, 10)
    bellyGeo.scale(0.8, 1, 0.5)
    const bellyMat = new THREE.MeshStandardMaterial({ color: lightCol, roughness: 0.5 })
    const belly = new THREE.Mesh(bellyGeo, bellyMat)
    group.add(belly)

    // Pelvis sphere
    const pelvisGeo = new THREE.SphereGeometry(BODY_RADIUS * 0.8, 14, 12)
    const pelvisMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 })
    const pelvis = new THREE.Mesh(pelvisGeo, pelvisMat)
    pelvis.castShadow = true
    group.add(pelvis)

    // Body connector (torso → pelvis)
    const body = makeLimb(BODY_RADIUS * 1.5, 6, col)
    group.add(body)

    // Neck connector (torso → head)
    const neck = makeLimb(BODY_RADIUS + HEAD_RADIUS, 3.5, col)
    group.add(neck)

    // Legs — thicker with slight taper
    const legL = makeLimb(LEG_LEN, 4.5, col)
    legL.castShadow = true
    group.add(legL)
    const legR = makeLimb(LEG_LEN, 4.5, col)
    legR.castShadow = true
    group.add(legR)

    // Feet — bigger paws
    const footGeo = new THREE.SphereGeometry(5, 10, 8)
    footGeo.scale(1.2, 0.7, 1)
    const footMat = new THREE.MeshStandardMaterial({ color: lightCol, roughness: 0.5 })
    const footL = new THREE.Mesh(footGeo, footMat)
    footL.castShadow = true
    group.add(footL)
    const footR = new THREE.Mesh(footGeo.clone(), footMat.clone())
    footR.castShadow = true
    group.add(footR)

    // Arms — slightly thinner
    const armL = makeLimb(ARM_LEN, 3.5, col)
    group.add(armL)
    const armR = makeLimb(ARM_LEN, 3.5, col)
    group.add(armR)

    // Hands — paws
    const handGeo = new THREE.SphereGeometry(4.5, 10, 8)
    handGeo.scale(1, 0.8, 1)
    const handMat = new THREE.MeshStandardMaterial({ color: lightCol, roughness: 0.5 })
    const handL = new THREE.Mesh(handGeo, handMat)
    group.add(handL)
    const handR = new THREE.Mesh(handGeo.clone(), handMat.clone())
    group.add(handR)

    // Tail (white cottontail puffball)
    const tailGeo = new THREE.SphereGeometry(5, 10, 10)
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      emissive: 0xeeeeee,
      emissiveIntensity: 0.1,
    })
    const tail = new THREE.Mesh(tailGeo, tailMat)
    group.add(tail)

    // Name sprite
    const nameSprite = makeTextSprite(b.name, '#ffffff', 28)
    group.add(nameSprite)

    // Lives sprite
    const livesSprite = makeTextSprite('♥'.repeat(b.lives), '#ff6666', 24)
    livesSprite.scale.set(60, 15, 1)
    group.add(livesSprite)

    scene.add(group)

    map.set(b.index, {
      group, head, torso, pelvis,
      earL, earR,
      eyeWhiteL, eyePupilL, eyeWhiteR, eyePupilR,
      nose, snout, whiskerL, whiskerR,
      belly,
      tail, legL, legR, footL, footR,
      armL, armR, handL, handR,
      neck, body, grabLine: null,
      nameSprite, livesSprite,
    })
  }

  return map
}

// ── Sync game state → mesh positions every frame ──────────
/**
 * Animation system — two key poses driven by b.pose (0→1):
 *
 * DOGGY (pose=0): bunny on all fours, body nearly horizontal
 * PLANK (pose=1): bunny standing fully upright
 * MOUNTED (~0.6): bunny sitting on bike, legs bent
 */
export function syncScene(
  st: GameState,
  bunnyMeshes: BunnyMeshMap,
  levelMeshes: LevelMeshes,
  scene: THREE.Scene,
) {
  // ── Bunnies ─────────────────────────────────────────────
  for (const b of st.bunnies) {
    const m = bunnyMeshes.get(b.index)
    if (!m) continue

    const visible = b.alive || b.deathFlash > 0
    m.group.visible = visible
    if (!visible) continue

    const alpha = b.alive ? 1 : (b.deathFlash / 30)
    const setAlpha = (mesh: THREE.Mesh, a: number) => {
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (a < 1) {
        mat.transparent = true
        mat.opacity = a
      } else {
        mat.transparent = false
        mat.opacity = 1
      }
    }
    setAlpha(m.head, alpha)
    setAlpha(m.torso, alpha)
    setAlpha(m.pelvis, alpha)

    // Physics-driven positions (screen-space, flipped to Three.js)
    const tx = b.torso.pos.x
    const ty = flipY(b.torso.pos.y)
    const t = b.pose // 0 = doggy, 1 = plank (standing)

    // Face direction based on velocity or bike direction
    const faceDir = b.mounted ? b.bikeDir : (b.torso.vel.x >= 0 ? 1 : -1)

    // ── Head ────────────────────────────────────────────
    const headOffX = lerp(-20 * faceDir, 0, t)
    const headOffY = lerp(2, BODY_RADIUS + HEAD_RADIUS + 4, t)
    const hx = tx + headOffX
    const hy = ty + headOffY
    m.head.position.set(hx, hy, 0)

    // ── Torso ───────────────────────────────────────────
    m.torso.position.set(tx, ty, 0)

    // ── Belly (front patch) ─────────────────────────────
    m.belly.position.set(tx - 2 * faceDir, ty, BODY_RADIUS * 0.3)

    // ── Pelvis ──────────────────────────────────────────
    const pelvisOffX = lerp(14 * faceDir * -1, 0, t)
    const pelvisOffY = lerp(-4, -(BODY_RADIUS * 1.8), t)
    const px = tx + pelvisOffX
    const py = ty + pelvisOffY
    m.pelvis.position.set(px, py, 0)

    // ── Ears ────────────────────────────────────────────
    const earDroop = lerp(0.4, 0.15, t)
    // Add subtle animation to ears
    const earBob = Math.sin(st.frame * 0.08 + b.index) * 1.5
    m.earL.position.set(hx - 4, hy + HEAD_RADIUS + 6 + earBob, 3)
    m.earR.position.set(hx + 4, hy + HEAD_RADIUS + 5.5 + earBob * 0.8, -3)
    m.earL.rotation.z = earDroop + Math.sin(st.frame * 0.06) * 0.05
    m.earR.rotation.z = -earDroop - Math.sin(st.frame * 0.07) * 0.05

    // ── Eyes — two eyes ─────────────────────────────────
    const eyeZ = HEAD_RADIUS - 1
    m.eyeWhiteL.position.set(hx - 3 * faceDir, hy + 3, eyeZ)
    m.eyePupilL.position.set(hx - 3 * faceDir - faceDir, hy + 3, eyeZ + 2)
    m.eyeWhiteR.position.set(hx + 3 * faceDir, hy + 3, eyeZ)
    m.eyePupilR.position.set(hx + 3 * faceDir - faceDir, hy + 3, eyeZ + 2)

    // Blink occasionally
    const blinkPhase = (st.frame + b.index * 37) % 180
    const isBlinking = blinkPhase < 5
    m.eyeWhiteL.visible = !isBlinking
    m.eyePupilL.visible = !isBlinking
    m.eyeWhiteR.visible = !isBlinking
    m.eyePupilR.visible = !isBlinking

    // ── Snout + Nose ────────────────────────────────────
    m.snout.position.set(hx - HEAD_RADIUS * 0.4 * faceDir, hy - 1, eyeZ + 1)
    m.nose.position.set(hx - HEAD_RADIUS * 0.7 * faceDir, hy, eyeZ + 3)

    // ── Whiskers ────────────────────────────────────────
    m.whiskerL.position.set(hx - HEAD_RADIUS * 0.5 * faceDir, hy - 2, eyeZ + 2)
    m.whiskerR.position.set(hx - HEAD_RADIUS * 0.5 * faceDir, hy - 1, eyeZ + 2)
    m.whiskerL.rotation.z = 0.15 * faceDir
    m.whiskerR.rotation.z = -0.15 * faceDir

    // ── Neck connector (head → torso) ───────────────────
    const nMidX = (hx + tx) / 2
    const nMidY = (hy + ty) / 2
    m.neck.position.set(nMidX, nMidY, 0)
    const neckAng = Math.atan2(ty - hy, tx - hx)
    m.neck.rotation.z = neckAng + Math.PI / 2

    // ── Body connector (torso → pelvis) ─────────────────
    const bMidX = (tx + px) / 2
    const bMidY = (ty + py) / 2
    m.body.position.set(bMidX, bMidY, 0)
    const bodyAng = Math.atan2(py - ty, px - tx)
    m.body.rotation.z = bodyAng + Math.PI / 2

    // ── Hind Legs (from pelvis) ─────────────────────────
    const hindLegAngle = lerp(0.5, 0, t)
    const legDx = LEG_LEN * Math.sin(hindLegAngle) * 0.6
    const legDy = -LEG_LEN * Math.cos(hindLegAngle)

    // Walking animation when grounded and moving
    const isMoving = Math.abs(b.torso.vel.x) > 20 && [b.head, b.torso, b.pelvis].some(p => p.grounded)
    const walkCycle = isMoving ? Math.sin(st.frame * 0.15 + b.index) * 6 : 0

    const legEndLX = px - 5 - legDx + walkCycle * faceDir
    const legEndLY = py + legDy
    const legEndRX = px + 5 + legDx - walkCycle * faceDir
    const legEndRY = py + legDy

    const legLcx = (px - 4 + legEndLX) / 2
    const legLcy = (py + legEndLY) / 2
    m.legL.position.set(legLcx, legLcy, 0)
    m.legL.rotation.z = Math.atan2(legEndLY - py, legEndLX - (px - 4)) + Math.PI / 2

    const legRcx = (px + 4 + legEndRX) / 2
    const legRcy = (py + legEndRY) / 2
    m.legR.position.set(legRcx, legRcy, 0)
    m.legR.rotation.z = Math.atan2(legEndRY - py, legEndRX - (px + 4)) + Math.PI / 2

    m.footL.position.set(legEndLX, legEndLY, 0)
    m.footR.position.set(legEndRX, legEndRY, 0)

    // ── Front legs / Arms (from torso) ──────────────────
    const armFwdX = lerp(-ARM_LEN * 1.1 * faceDir, 0, t)
    const armOutX = lerp(0, BODY_RADIUS + ARM_LEN * 0.7, t)
    const armDy = lerp(-LEG_LEN * 0.85, -ARM_LEN * 0.35, t)

    // Arm walking animation
    const armWalk = isMoving ? Math.sin(st.frame * 0.15 + b.index + Math.PI) * 5 : 0

    const armEndLX = tx + armFwdX - armOutX + armWalk * faceDir
    const armEndLY = ty + armDy
    const armEndRX = tx + armFwdX + armOutX - armWalk * faceDir
    const armEndRY = ty + armDy

    const armLcx = (tx - BODY_RADIUS + armEndLX) / 2
    const armLcy = (ty + armEndLY) / 2
    m.armL.position.set(armLcx, armLcy, 0)
    m.armL.rotation.z = Math.atan2(armEndLY - ty, armEndLX - (tx - BODY_RADIUS)) + Math.PI / 2

    const armRcx = (tx + BODY_RADIUS + armEndRX) / 2
    const armRcy = (ty + armEndRY) / 2
    m.armR.position.set(armRcx, armRcy, 0)
    m.armR.rotation.z = Math.atan2(armEndRY - ty, armEndRX - (tx + BODY_RADIUS)) + Math.PI / 2

    m.handL.position.set(armEndLX, armEndLY, 0)
    m.handR.position.set(armEndRX, armEndRY, 0)

    // Glow hands when grabbing
    const handMat = m.handL.material as THREE.MeshStandardMaterial
    if (b.grabbing) {
      handMat.emissive.set(0xffffff)
      handMat.emissiveIntensity = 0.8
      ;(m.handR.material as THREE.MeshStandardMaterial).emissive.set(0xffffff)
      ;(m.handR.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8
    } else {
      handMat.emissive.set(0x000000)
      handMat.emissiveIntensity = 0
      ;(m.handR.material as THREE.MeshStandardMaterial).emissive.set(0x000000)
      ;(m.handR.material as THREE.MeshStandardMaterial).emissiveIntensity = 0
    }

    // ── Tail ────────────────────────────────────────────
    const tailOffX = lerp(10 * (faceDir * -1), 4 * (faceDir * -1), t)
    const tailOffY = lerp(6, -2, t)
    // Tail wag when moving
    const tailWag = isMoving ? Math.sin(st.frame * 0.2 + b.index) * 3 : 0
    m.tail.position.set(px + tailOffX + tailWag, py + tailOffY, -6)

    // ── Name & lives sprites above head ─────────────────
    m.nameSprite.position.set(hx, hy + HEAD_RADIUS + 24, 0)
    m.livesSprite.position.set(hx, hy + HEAD_RADIUS + 14, 0)

    updateTextSprite(m.livesSprite, '♥'.repeat(Math.max(0, b.lives)), '#ff6666', 24)

    // ── Grab line ───────────────────────────────────────
    if (b.grabbing && b.grabPoint) {
      if (m.grabLine) { scene.remove(m.grabLine); m.grabLine = null }
      const points = [
        new THREE.Vector3(tx, ty, 2),
        new THREE.Vector3(b.grabPoint.x, flipY(b.grabPoint.y), 2),
      ]
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
      const line = new THREE.Line(lineGeo, lineMat)
      scene.add(line)
      m.grabLine = line
    } else if (m.grabLine) {
      scene.remove(m.grabLine)
      m.grabLine.geometry.dispose()
      ;(m.grabLine.material as THREE.LineBasicMaterial).dispose()
      m.grabLine = null
    }
  }

  // ── Coins (spin + bob + hide collected) ─────────────────
  for (let i = 0; i < st.coins.length; i++) {
    const mesh = levelMeshes.coinMeshes[i]
    if (!mesh) continue
    if (st.coins[i].collected) {
      mesh.visible = false
    } else {
      mesh.visible = true
      mesh.rotation.z = Math.PI / 2
      mesh.rotation.y = st.frame * 0.05
      // Gentle bob
      mesh.position.y = flipY(st.coins[i].y) + Math.sin(st.frame * 0.04 + i) * 2
    }
  }

  // ── Bikes — show/hide and position based on occupy state ─
  for (let i = 0; i < st.bikes.length; i++) {
    const meshGroup = levelMeshes.bikeMeshes[i]
    if (!meshGroup) continue
    const bike = st.bikes[i]

    // Always show bike, but update position
    meshGroup.visible = true
    meshGroup.position.set(
      bike.x + bike.w / 2,
      flipY(bike.y + bike.h / 2),
      0,
    )
    // Apply tilt
    meshGroup.rotation.z = bike.tilt

    // Rotate wheels based on rider's wheel angle
    if (bike.occupied) {
      const rider = st.bunnies.find(b => b.mounted && b.mountedBikeIndex === i)
      if (rider) {
        // Spin wheel children (indices 8,9 → torus wheels in the group)
        meshGroup.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            const geo = child.geometry
            if (geo instanceof THREE.TorusGeometry) {
              child.rotation.y = rider.bikeWheelAngle
            }
          }
        })
      }
    }
  }

  // ── Physics Balls — position + visual roll ─────────────
  for (let i = 0; i < st.balls.length; i++) {
    const mesh = levelMeshes.ballMeshes[i]
    if (!mesh) continue
    const ball = st.balls[i]
    mesh.position.set(ball.x, flipY(ball.y), 2)
    // Visual spin based on velocity
    mesh.rotation.z -= ball.vx * 0.001
    mesh.rotation.x += ball.vy * 0.001
  }

  // ── Loose Spikes — position + rotation ─────────────────
  for (let i = 0; i < st.looseSpikes.length; i++) {
    const mesh = levelMeshes.looseSpikeMeshes[i]
    if (!mesh) continue
    const ls = st.looseSpikes[i]
    mesh.position.set(ls.x + ls.w / 2, flipY(ls.y + ls.h / 2), 3)
    mesh.rotation.z = ls.angle
  }

  // ── Traps — animate based on phase ─────────────────────
  for (let i = 0; i < st.traps.length; i++) {
    const trapGroup = levelMeshes.trapMeshes[i]
    if (!trapGroup) continue
    const trap = st.traps[i]

    // Update position
    trapGroup.position.set(
      trap.x + trap.w / 2,
      flipY(trap.y + trap.h / 2),
      1,
    )

    if (trap.type === 'spring') {
      // Spring extension animation
      const springChild = trapGroup.children[1] // coil
      if (springChild) {
        const stretch = trap.phase * 1.5 + 1
        springChild.scale.y = stretch
        springChild.position.y = trap.h * 0.3 * stretch
      }
      // Arrow bounce
      const arrowChild = trapGroup.children[2]
      if (arrowChild) {
        arrowChild.position.y = trap.h * 0.7 + trap.phase * 15
      }
    } else if (trap.type === 'crusher') {
      // Crusher up/down movement
      const crushOffset = trap.phase * trap.h * 0.8
      trapGroup.position.y = flipY(trap.y + trap.h / 2) + crushOffset

      // Red glow when active
      const pillar = trapGroup.children[0]
      if (pillar instanceof THREE.Mesh) {
        const mat = pillar.material as THREE.MeshStandardMaterial
        if (trap.active) {
          mat.emissive.set(0xff0000)
          mat.emissiveIntensity = 0.5
        } else {
          mat.emissive.set(0x424242)
          mat.emissiveIntensity = 0.15
        }
      }
    } else {
      // Pit — pulse glow
      const pitMesh = trapGroup.children[0]
      if (pitMesh instanceof THREE.Mesh) {
        const mat = pitMesh.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.3 + trap.phase * 0.5
      }
    }
  }
}

import * as THREE from 'three'
import {
  createBrowserCanvasClient,
  type BrowserCanvasClientHandle,
  type BrowserCanvasClientOptions,
} from '@geometra/renderer-canvas'
import type { ThreeFrameContext, ThreeRuntimeContext } from './split-host.js'
import { createGeometraThreeSceneBasics, type GeometraThreeSceneBasicsOptions } from './three-scene-basics.js'

/** Corner anchor for the Geometra HUD overlay (CSS `position: absolute` on the host). */
export type GeometraHudPlacement = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

export interface ThreeGeometraStackedHostOptions
  extends Omit<BrowserCanvasClientOptions, 'canvas'>,
    GeometraThreeSceneBasicsOptions {
  /** Host element; a full-size stacking context is appended (existing children are left untouched). */
  container: HTMLElement
  /** HUD width in CSS pixels. Default: 420. */
  geometraHudWidth?: number
  /** HUD height in CSS pixels. Default: 320. */
  geometraHudHeight?: number
  /** HUD corner. Default: `bottom-right`. */
  geometraHudPlacement?: GeometraHudPlacement
  /** Inset from the chosen corner in CSS pixels. Default: 12. */
  geometraHudMargin?: number
  /**
   * CSS `pointer-events` on the HUD wrapper (e.g. `'none'` so input falls through to the WebGL canvas).
   * Default: `'auto'`.
   */
  geometraHudPointerEvents?: string
  /**
   * Called once after scene, camera, and renderer are created.
   * Call `ctx.destroy()` to tear down immediately; the render loop will not start if the host is already destroyed.
   */
  onThreeReady?: (ctx: ThreeRuntimeContext) => void
  /**
   * Called every frame before `renderer.render`.
   */
  onThreeFrame?: (ctx: ThreeFrameContext) => void
}

export interface ThreeGeometraStackedHostHandle {
  root: HTMLDivElement
  /** Absolutely positioned wrapper around the Geometra canvas (stacked HUD). */
  geometraHud: HTMLDivElement
  threeCanvas: HTMLCanvasElement
  geometraCanvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  clock: THREE.Clock
  geometra: BrowserCanvasClientHandle
  destroy(): void
}

function fullSizeCanvas(canvas: HTMLCanvasElement): void {
  canvas.style.display = 'block'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
}

function applyHudPlacement(
  wrap: HTMLDivElement,
  placement: GeometraHudPlacement,
  marginPx: number,
): void {
  const m = `${marginPx}px`
  wrap.style.left = ''
  wrap.style.right = ''
  wrap.style.top = ''
  wrap.style.bottom = ''
  switch (placement) {
    case 'bottom-right':
      wrap.style.right = m
      wrap.style.bottom = m
      break
    case 'bottom-left':
      wrap.style.left = m
      wrap.style.bottom = m
      break
    case 'top-right':
      wrap.style.right = m
      wrap.style.top = m
      break
    case 'top-left':
      wrap.style.left = m
      wrap.style.top = m
      break
  }
}

/**
 * Stacked host: full-viewport Three.js `WebGLRenderer` with a positioned Geometra canvas **HUD** on top.
 *
 * Pointer routing follows normal hit-testing: events hit the Geometra canvas where it overlaps the WebGL layer
 * (`z-index` above the Three canvas); elsewhere, the Three canvas receives input. Override with
 * {@link ThreeGeometraStackedHostOptions.geometraHudPointerEvents} (e.g. `'none'` for a click-through HUD).
 *
 * Geometra’s client still uses `resizeTarget: window` by default; when only the HUD box changes size,
 * a coalesced synthetic `resize` is dispatched on `window` (same pattern as {@link createThreeGeometraSplitHost}).
 * The Three.js layer listens to `window` `resize` for `devicePixelRatio` changes and uses the host `root` size
 * for the drawing buffer.
 */
export function createThreeGeometraStackedHost(
  options: ThreeGeometraStackedHostOptions,
): ThreeGeometraStackedHostHandle {
  const {
    container,
    geometraHudWidth = 420,
    geometraHudHeight = 320,
    geometraHudPlacement = 'bottom-right',
    geometraHudMargin = 12,
    geometraHudPointerEvents = 'auto',
    threeBackground = 0x000000,
    cameraFov = 50,
    cameraNear = 0.1,
    cameraFar = 2000,
    cameraPosition = [0, 0, 5],
    onThreeReady,
    onThreeFrame,
    window: providedWindow,
    ...browserOptions
  } = options

  const doc = container.ownerDocument
  const win = providedWindow ?? doc.defaultView
  if (!win) {
    throw new Error('createThreeGeometraStackedHost requires a browser window')
  }

  const root = doc.createElement('div')
  root.style.position = 'relative'
  root.style.width = '100%'
  root.style.height = '100%'
  root.style.minHeight = '0'
  root.style.minWidth = '0'
  root.style.overflow = 'hidden'
  container.appendChild(root)

  const threeCanvas = doc.createElement('canvas')
  fullSizeCanvas(threeCanvas)
  threeCanvas.style.position = 'absolute'
  threeCanvas.style.left = '0'
  threeCanvas.style.top = '0'
  threeCanvas.style.width = '100%'
  threeCanvas.style.height = '100%'
  threeCanvas.style.zIndex = '0'
  root.appendChild(threeCanvas)

  const geometraHud = doc.createElement('div')
  geometraHud.style.position = 'absolute'
  geometraHud.style.zIndex = '1'
  geometraHud.style.width = `${geometraHudWidth}px`
  geometraHud.style.height = `${geometraHudHeight}px`
  geometraHud.style.minWidth = '0'
  geometraHud.style.minHeight = '0'
  geometraHud.style.overflow = 'hidden'
  geometraHud.style.pointerEvents = geometraHudPointerEvents
  applyHudPlacement(geometraHud, geometraHudPlacement, geometraHudMargin)
  root.appendChild(geometraHud)

  const geometraCanvas = doc.createElement('canvas')
  fullSizeCanvas(geometraCanvas)
  geometraHud.appendChild(geometraCanvas)

  const glRenderer = new THREE.WebGLRenderer({
    canvas: threeCanvas,
    antialias: true,
    alpha: false,
  })
  const { scene, camera, clock } = createGeometraThreeSceneBasics({
    threeBackground,
    cameraFov,
    cameraNear,
    cameraFar,
    cameraPosition,
  })

  const resizeThree = () => {
    glRenderer.setPixelRatio(win.devicePixelRatio || 1)
    const w = Math.max(1, Math.floor(root.clientWidth))
    const h = Math.max(1, Math.floor(root.clientHeight))
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    glRenderer.setSize(w, h, false)
  }

  const onWindowResize = () => {
    resizeThree()
  }
  win.addEventListener('resize', onWindowResize, { passive: true })

  resizeThree()

  const geometraHandle = createBrowserCanvasClient({
    ...browserOptions,
    canvas: geometraCanvas,
    window: win,
  })

  let geometraResizeRafId: number | undefined
  const triggerGeometraResize = () => {
    if (geometraResizeRafId !== undefined) return
    geometraResizeRafId = win.requestAnimationFrame(() => {
      geometraResizeRafId = undefined
      win.dispatchEvent(new Event('resize'))
    })
  }

  const roRoot = new ResizeObserver(() => {
    resizeThree()
    triggerGeometraResize()
  })
  roRoot.observe(root)

  const roHud = new ResizeObserver(() => {
    triggerGeometraResize()
  })
  roHud.observe(geometraHud)

  let rafId: number | undefined
  let destroyed = false

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    if (rafId !== undefined) {
      win.cancelAnimationFrame(rafId)
      rafId = undefined
    }
    if (geometraResizeRafId !== undefined) {
      win.cancelAnimationFrame(geometraResizeRafId)
      geometraResizeRafId = undefined
    }
    win.removeEventListener('resize', onWindowResize)
    roRoot.disconnect()
    roHud.disconnect()
    geometraHandle.destroy()
    glRenderer.dispose()
    root.remove()
  }

  const ctxBase: ThreeRuntimeContext = {
    renderer: glRenderer,
    scene,
    camera,
    threeCanvas,
    destroy,
  }

  onThreeReady?.(ctxBase)

  const loop = () => {
    if (destroyed) return
    rafId = win.requestAnimationFrame(loop)
    const delta = clock.getDelta()
    const elapsed = clock.elapsedTime
    onThreeFrame?.({ ...ctxBase, clock, delta, elapsed })
    glRenderer.render(scene, camera)
  }

  if (!destroyed) {
    rafId = win.requestAnimationFrame(loop)
  }

  return {
    root,
    geometraHud,
    threeCanvas,
    geometraCanvas,
    renderer: glRenderer,
    scene,
    camera,
    clock,
    geometra: geometraHandle,
    destroy,
  }
}

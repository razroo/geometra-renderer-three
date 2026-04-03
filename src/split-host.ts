import * as THREE from 'three'
import {
  createBrowserCanvasClient,
  type BrowserCanvasClientHandle,
  type BrowserCanvasClientOptions,
} from '@geometra/renderer-canvas'
import { createGeometraThreeSceneBasics, type GeometraThreeSceneBasicsOptions } from './three-scene-basics.js'
import { resizeGeometraThreePerspectiveView } from './utils.js'

export interface ThreeGeometraSplitHostOptions
  extends Omit<BrowserCanvasClientOptions, 'canvas'>,
    GeometraThreeSceneBasicsOptions {
  /** Host element; a flex row is appended as a child (existing children are left untouched). */
  container: HTMLElement
  /** Geometra column width in CSS pixels. Default: 420. */
  geometraWidth?: number
  /** When true, Geometra panel is on the left. Default: false (Three.js left, Geometra right). */
  geometraOnLeft?: boolean
  /**
   * Called once after scene, camera, and renderer are created.
   * Add meshes, lights, controls, etc. Call `ctx.destroy()` to tear down immediately; the render loop
   * will not start if the host is already destroyed.
   */
  onThreeReady?: (ctx: ThreeRuntimeContext) => void
  /**
   * Called every frame before `renderer.render`.
   * Use for animations; return nothing.
   */
  onThreeFrame?: (ctx: ThreeFrameContext) => void
}

export interface ThreeRuntimeContext {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  threeCanvas: HTMLCanvasElement
  /** Same as `ThreeGeometraSplitHostHandle.destroy` — idempotent full teardown. */
  destroy(): void
}

export interface ThreeFrameContext extends ThreeRuntimeContext {
  clock: THREE.Clock
  delta: number
  elapsed: number
}

export interface ThreeGeometraSplitHostHandle {
  root: HTMLDivElement
  threePanel: HTMLDivElement
  geometraPanel: HTMLDivElement
  threeCanvas: HTMLCanvasElement
  geometraCanvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  clock: THREE.Clock
  geometra: BrowserCanvasClientHandle
  /** Stops the render loop, disconnects observers, disposes WebGL, and tears down the Geometra client. */
  destroy(): void
}

function panelStyle(el: HTMLElement, flex: string): void {
  el.style.flex = flex
  el.style.minWidth = '0'
  el.style.minHeight = '0'
  el.style.position = 'relative'
  el.style.overflow = 'hidden'
}

function fullSizeCanvas(canvas: HTMLCanvasElement): void {
  canvas.style.display = 'block'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
}

/**
 * Side-by-side host: Three.js `WebGLRenderer` on one flex pane and Geometra’s streamed canvas UI on the other.
 *
 * This is the recommended **hybrid** layout: 3D stays in Three; chrome and data panes stay in Geometra’s protocol.
 * Geometra’s client still uses `resizeTarget: window` by default; when only the Geometra column changes size,
 * a `ResizeObserver` dispatches a synthetic `resize` on `window` so layout width/height track the panel
 * (coalesced to at most once per animation frame when both panes notify in the same frame).
 *
 * The Three.js pane listens to `window` `resize` as well so `devicePixelRatio` updates (zoom / display changes)
 * refresh the WebGL drawing buffer without relying on panel `ResizeObserver` alone.
 *
 * Pass through {@link BrowserCanvasClientOptions} from `@geometra/renderer-canvas` / `@geometra/client`
 * (for example `binaryFraming`, `onError`, `onFrameMetrics`).
 */
export function createThreeGeometraSplitHost(
  options: ThreeGeometraSplitHostOptions,
): ThreeGeometraSplitHostHandle {
  const {
    container,
    geometraWidth = 420,
    geometraOnLeft = false,
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
    throw new Error('createThreeGeometraSplitHost requires a browser window')
  }

  const root = doc.createElement('div')
  root.style.display = 'flex'
  root.style.flexDirection = 'row'
  root.style.width = '100%'
  root.style.height = '100%'
  root.style.minHeight = '0'
  root.style.minWidth = '0'
  container.appendChild(root)

  const threePanel = doc.createElement('div')
  panelStyle(threePanel, '1 1 0%')

  const geometraPanel = doc.createElement('div')
  panelStyle(geometraPanel, '0 0 auto')
  geometraPanel.style.width = `${geometraWidth}px`
  geometraPanel.style.flexShrink = '0'

  if (geometraOnLeft) {
    root.append(geometraPanel, threePanel)
  } else {
    root.append(threePanel, geometraPanel)
  }

  const threeCanvas = doc.createElement('canvas')
  fullSizeCanvas(threeCanvas)
  threePanel.appendChild(threeCanvas)

  const geometraCanvas = doc.createElement('canvas')
  fullSizeCanvas(geometraCanvas)
  geometraPanel.appendChild(geometraCanvas)

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
    resizeGeometraThreePerspectiveView(
      glRenderer,
      camera,
      threePanel.clientWidth,
      threePanel.clientHeight,
      win.devicePixelRatio || 1,
    )
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

  const roContainer = new ResizeObserver(() => {
    resizeThree()
    triggerGeometraResize()
  })
  roContainer.observe(threePanel)
  roContainer.observe(geometraPanel)

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
    roContainer.disconnect()
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
    threePanel,
    geometraPanel,
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

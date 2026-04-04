import * as THREE from 'three'
import type { WebGLRendererParameters } from 'three'
import {
  resizeGeometraThreePerspectiveView,
  resolveHostDevicePixelRatio,
  toPlainGeometraThreeViewSizingState,
  type PlainGeometraThreeViewSizingState,
} from './utils.js'

/** Scene, camera, and clock bundle returned by {@link createGeometraThreeSceneBasics}. */
export interface GeometraThreeSceneBasics {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  clock: THREE.Clock
}

/** Options shared by split/stacked hosts and {@link createGeometraThreeSceneBasics}. */
export interface GeometraThreeSceneBasicsOptions {
  /** Clear color for the Three.js scene. Default: `0x000000`. */
  threeBackground?: THREE.ColorRepresentation
  /** Perspective camera FOV in degrees. Default: 50. */
  cameraFov?: number
  /** Near plane. Default: 0.1. */
  cameraNear?: number
  /** Far plane. Default: 2000. */
  cameraFar?: number
  /** Initial camera position. Default: `(0, 0, 5)`. */
  cameraPosition?: THREE.Vector3Tuple
}

/**
 * Scene and camera defaults shared by {@link createThreeGeometraSplitHost},
 * {@link createThreeGeometraStackedHost}, and {@link createGeometraThreeSceneBasics}.
 * Use in headless or custom renderer setups so numbers stay aligned with those hosts
 * without copying literals from the README.
 */
export const GEOMETRA_THREE_HOST_SCENE_DEFAULTS: Required<GeometraThreeSceneBasicsOptions> = {
  threeBackground: 0x000000,
  cameraFov: 50,
  cameraNear: 0.1,
  cameraFar: 2000,
  cameraPosition: [0, 0, 5],
}

function coerceGeometraThreeSceneBasicsCamera(
  merged: Required<GeometraThreeSceneBasicsOptions>,
): Required<Pick<GeometraThreeSceneBasicsOptions, 'cameraFov' | 'cameraNear' | 'cameraFar' | 'cameraPosition'>> {
  const d = GEOMETRA_THREE_HOST_SCENE_DEFAULTS

  const cameraFov =
    Number.isFinite(merged.cameraFov) && merged.cameraFov > 0 && merged.cameraFov < 180
      ? merged.cameraFov
      : d.cameraFov

  let cameraNear =
    Number.isFinite(merged.cameraNear) && merged.cameraNear > 0 ? merged.cameraNear : d.cameraNear

  let cameraFar = merged.cameraFar
  if (!Number.isFinite(cameraFar) || cameraFar <= cameraNear) {
    cameraFar = d.cameraFar > cameraNear ? d.cameraFar : cameraNear * 2
  }

  const [px, py, pz] = merged.cameraPosition
  const [dx, dy, dz] = d.cameraPosition
  const cameraPosition: THREE.Vector3Tuple = [
    Number.isFinite(px) ? px : dx!,
    Number.isFinite(py) ? py : dy!,
    Number.isFinite(pz) ? pz : dz!,
  ]

  return { cameraFov, cameraNear, cameraFar, cameraPosition }
}

/**
 * Fully merged and coerced {@link GeometraThreeSceneBasicsOptions} using the same rules as
 * {@link createGeometraThreeSceneBasics} (and split/stacked hosts).
 *
 * Use when you need host-aligned numbers for logging, tests, or agent-side protocol payloads without
 * constructing a {@link THREE.Scene} or {@link THREE.PerspectiveCamera}.
 */
export function resolveGeometraThreeSceneBasicsOptions(
  options: GeometraThreeSceneBasicsOptions = {},
): Required<GeometraThreeSceneBasicsOptions> {
  const merged = { ...GEOMETRA_THREE_HOST_SCENE_DEFAULTS, ...options }
  const { cameraFov, cameraNear, cameraFar, cameraPosition } = coerceGeometraThreeSceneBasicsCamera(merged)
  return {
    threeBackground: merged.threeBackground,
    cameraFov,
    cameraNear,
    cameraFar,
    cameraPosition,
  }
}

/**
 * Host-aligned scene/camera numbers in a JSON-friendly shape: clear color as a single **sRGB hex**
 * integer (`0xRRGGBB`), same as {@link THREE.Color#getHex}.
 *
 * Use for logs, tests, or agent-side payloads where {@link GeometraThreeSceneBasicsOptions.threeBackground}
 * may be a string or other {@link THREE.ColorRepresentation} but you need a stable numeric field for
 * `JSON.stringify`.
 */
export interface PlainGeometraThreeSceneBasicsOptions {
  threeBackgroundHex: number
  cameraFov: number
  cameraNear: number
  cameraFar: number
  cameraPosition: THREE.Vector3Tuple
}

/**
 * Same coercion as {@link resolveGeometraThreeSceneBasicsOptions}, plus a hex background for stable JSON.
 */
export function toPlainGeometraThreeSceneBasicsOptions(
  options: GeometraThreeSceneBasicsOptions = {},
): PlainGeometraThreeSceneBasicsOptions {
  const resolved = resolveGeometraThreeSceneBasicsOptions(options)
  const threeBackgroundHex = new THREE.Color(resolved.threeBackground).getHex()
  return {
    threeBackgroundHex,
    cameraFov: resolved.cameraFov,
    cameraNear: resolved.cameraNear,
    cameraFar: resolved.cameraFar,
    cameraPosition: [...resolved.cameraPosition] as THREE.Vector3Tuple,
  }
}

/**
 * Single JSON-friendly object combining {@link PlainGeometraThreeViewSizingState} and
 * {@link PlainGeometraThreeSceneBasicsOptions} with the same coercion rules as
 * {@link toPlainGeometraThreeViewSizingState} and {@link toPlainGeometraThreeSceneBasicsOptions}.
 *
 * Use for logs, tests, or agent-side payloads when you want viewport + scene numbers in one
 * `JSON.stringify` without calling both helpers separately.
 */
export type PlainGeometraThreeHostSnapshot = PlainGeometraThreeViewSizingState &
  PlainGeometraThreeSceneBasicsOptions

/**
 * Merge host-aligned viewport sizing and scene/camera plain fields for stable JSON.
 *
 * @see PlainGeometraThreeHostSnapshot
 */
export function toPlainGeometraThreeHostSnapshot(
  cssWidth: number,
  cssHeight: number,
  rawDevicePixelRatio: number,
  maxDevicePixelRatio?: number,
  sceneBasicsOptions: GeometraThreeSceneBasicsOptions = {},
): PlainGeometraThreeHostSnapshot {
  return {
    ...toPlainGeometraThreeViewSizingState(cssWidth, cssHeight, rawDevicePixelRatio, maxDevicePixelRatio),
    ...toPlainGeometraThreeSceneBasicsOptions(sceneBasicsOptions),
  }
}

/**
 * Same plain snapshot as {@link toPlainGeometraThreeHostSnapshot} with raw device pixel ratio **1** —
 * the baseline after `win.devicePixelRatio || 1` when the ratio is missing, and the same raw input as
 * {@link resolveHeadlessHostDevicePixelRatio} when you only apply an optional cap.
 *
 * For headless GL, Node, tests, or agent payloads without a browser `window`, call this instead of
 * passing a literal `1` as `rawDevicePixelRatio` everywhere.
 */
export function toPlainGeometraThreeHostSnapshotHeadless(
  cssWidth: number,
  cssHeight: number,
  maxDevicePixelRatio?: number,
  sceneBasicsOptions: GeometraThreeSceneBasicsOptions = {},
): PlainGeometraThreeHostSnapshot {
  return toPlainGeometraThreeHostSnapshot(cssWidth, cssHeight, 1, maxDevicePixelRatio, sceneBasicsOptions)
}

/**
 * `WebGLRenderer` constructor options (excluding `canvas`) used by
 * {@link createThreeGeometraSplitHost} and {@link createThreeGeometraStackedHost}.
 *
 * Typed as {@link WebGLRendererParameters} minus `canvas` so custom renderers stay compatible with
 * Three’s constructor surface when you extend or mirror these flags.
 *
 * Spread into your own `new WebGLRenderer({ canvas, ...GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS })` when
 * you manage the renderer (headless GL, offscreen canvas, tests) so flags stay aligned with those hosts.
 */
export const GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS = {
  antialias: true,
  alpha: false,
} as const satisfies Omit<WebGLRendererParameters, 'canvas'>

/**
 * Full {@link WebGLRendererParameters} for `new WebGLRenderer(...)`, with the same flags as
 * {@link createThreeGeometraSplitHost} and {@link createThreeGeometraStackedHost} plus your `canvas`.
 *
 * Use in headless GL, offscreen canvas, or custom hosts so constructor input stays aligned with
 * those packages without copying {@link GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS} at every call site.
 */
export function createGeometraHostWebGLRendererParams(
  canvas: NonNullable<WebGLRendererParameters['canvas']>,
): WebGLRendererParameters {
  return { canvas, ...GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS }
}

/**
 * `new WebGLRenderer(createGeometraHostWebGLRendererParams(canvas))` with the same flags as
 * {@link createThreeGeometraSplitHost} and {@link createThreeGeometraStackedHost}.
 *
 * Use in the browser or any environment where Three can create a GL context (offscreen canvas,
 * custom hosts). Prefer {@link createGeometraHostWebGLRendererParams} when you need to spread
 * into a larger parameter object.
 */
export function createGeometraThreeWebGLRenderer(
  canvas: NonNullable<WebGLRendererParameters['canvas']>,
): THREE.WebGLRenderer {
  return new THREE.WebGLRenderer(createGeometraHostWebGLRendererParams(canvas))
}

/**
 * Create a scene, perspective camera, and clock with the same defaults as
 * {@link createThreeGeometraSplitHost} and {@link createThreeGeometraStackedHost}.
 *
 * Use this when you want Three.js state aligned with those hosts but manage your own
 * `WebGLRenderer` (for example headless GL, offscreen canvas, or custom render targets).
 *
 * Non-finite or invalid perspective settings fall back to {@link GEOMETRA_THREE_HOST_SCENE_DEFAULTS}
 * (or `far = max(default far, near × 2)` when the default far is not past a coerced near plane).
 *
 * @returns A {@link GeometraThreeSceneBasics} value aligned with split/stacked host defaults.
 */
export function createGeometraThreeSceneBasics(
  options: GeometraThreeSceneBasicsOptions = {},
): GeometraThreeSceneBasics {
  const resolved = resolveGeometraThreeSceneBasicsOptions(options)
  const { threeBackground, cameraFov, cameraNear, cameraFar, cameraPosition } = resolved

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(threeBackground)

  const camera = new THREE.PerspectiveCamera(cameraFov, 1, cameraNear, cameraFar)
  camera.position.set(cameraPosition[0]!, cameraPosition[1]!, cameraPosition[2]!)

  const clock = new THREE.Clock()

  return { scene, camera, clock }
}

/** {@link createGeometraThreeSceneBasics} plus a host-aligned {@link THREE.WebGLRenderer} on the same canvas. */
export type GeometraThreeWebGLWithSceneBasics = GeometraThreeSceneBasics & {
  renderer: THREE.WebGLRenderer
}

/**
 * Create a {@link THREE.WebGLRenderer} and {@link GeometraThreeSceneBasics} in one call, using the same
 * constructor flags and scene defaults as {@link createThreeGeometraSplitHost} and
 * {@link createThreeGeometraStackedHost}.
 *
 * Equivalent to {@link createGeometraThreeWebGLRenderer} on `canvas` plus
 * {@link createGeometraThreeSceneBasics} with the same `options` — useful for offscreen canvas, custom hosts, or
 * agent-side bootstrap where you want parity without duplicating the two factories.
 *
 * Requires a WebGL-capable environment (same as `new WebGLRenderer(...)`).
 */
export function createGeometraThreeWebGLWithSceneBasics(
  canvas: NonNullable<WebGLRendererParameters['canvas']>,
  options: GeometraThreeSceneBasicsOptions = {},
): GeometraThreeWebGLWithSceneBasics {
  const renderer = createGeometraThreeWebGLRenderer(canvas)
  const { scene, camera, clock } = createGeometraThreeSceneBasics(options)
  return { renderer, scene, camera, clock }
}

/**
 * Tear down the {@link THREE.WebGLRenderer} from {@link createGeometraThreeWebGLWithSceneBasics}
 * (or any bundle that shares the same `renderer` reference).
 *
 * Calls {@link THREE.WebGLRenderer.dispose}; it does not traverse the scene or dispose meshes,
 * materials, or textures — keep that cleanup in app code or a future helper if you need it.
 */
export function disposeGeometraThreeWebGLWithSceneBasics(
  bundle: Pick<GeometraThreeWebGLWithSceneBasics, 'renderer'>,
): void {
  bundle.renderer.dispose()
}

/**
 * Resize renderer and camera from {@link createGeometraThreeWebGLWithSceneBasics} using the same CSS layout,
 * {@link resolveHostDevicePixelRatio} capping, and {@link resizeGeometraThreePerspectiveView} path as
 * {@link createThreeGeometraSplitHost} and {@link createThreeGeometraStackedHost}.
 *
 * Use in headless GL, offscreen canvas, or custom hosts when you already hold the bundle and a layout size
 * (e.g. from your own layout pass). Pass `rawDevicePixelRatio` from `window.devicePixelRatio` in the browser
 * or `1` when there is no window.
 *
 * Equivalent to calling {@link resizeGeometraThreePerspectiveView} on `bundle.renderer` and `bundle.camera` with
 * `resolveHostDevicePixelRatio(rawDevicePixelRatio, maxDevicePixelRatio)`.
 */
export function resizeGeometraThreeWebGLWithSceneBasicsView(
  bundle: Pick<GeometraThreeWebGLWithSceneBasics, 'renderer' | 'camera'>,
  cssWidth: number,
  cssHeight: number,
  rawDevicePixelRatio: number,
  maxDevicePixelRatio?: number,
): void {
  resizeGeometraThreePerspectiveView(
    bundle.renderer,
    bundle.camera,
    cssWidth,
    cssHeight,
    resolveHostDevicePixelRatio(rawDevicePixelRatio, maxDevicePixelRatio),
  )
}

/**
 * One `renderer.render(scene, camera)` pass for a {@link GeometraThreeWebGLWithSceneBasics} bundle.
 *
 * Use in headless GL, tests, or agent-style loops after
 * {@link resizeGeometraThreeWebGLWithSceneBasicsView} (or your own sizing) so a single frame matches
 * the same scene/camera/renderer wiring as {@link createThreeGeometraSplitHost} /
 * {@link createThreeGeometraStackedHost} without duplicating the render call.
 */
export function renderGeometraThreeWebGLWithSceneBasicsFrame(
  bundle: Pick<GeometraThreeWebGLWithSceneBasics, 'renderer' | 'scene' | 'camera'>,
): void {
  bundle.renderer.render(bundle.scene, bundle.camera)
}

/**
 * Same per-frame ordering as {@link createThreeGeometraSplitHost} and {@link createThreeGeometraStackedHost}:
 * `clock.getDelta()` / `elapsedTime`, optional callback, then `renderer.render`.
 *
 * Use in headless GL, tests, or agent loops when you want {@link THREE.Clock} timing parity with those hosts
 * without duplicating the loop body. Omit the callback to match a tick that only advances the clock and renders.
 */
export interface GeometraThreeWebGLWithSceneBasicsTickContext {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  clock: THREE.Clock
  delta: number
  elapsed: number
}

export function tickGeometraThreeWebGLWithSceneBasicsFrame(
  bundle: GeometraThreeWebGLWithSceneBasics,
  onFrame?: (ctx: GeometraThreeWebGLWithSceneBasicsTickContext) => void,
): void {
  const { renderer, scene, camera, clock } = bundle
  const delta = clock.getDelta()
  const elapsed = clock.elapsedTime
  onFrame?.({ renderer, scene, camera, clock, delta, elapsed })
  renderer.render(scene, camera)
}

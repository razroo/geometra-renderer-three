import * as THREE from 'three'
import type { WebGLRendererParameters } from 'three'

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
 * @returns A {@link GeometraThreeSceneBasics} value aligned with split/stacked host defaults.
 */
export function createGeometraThreeSceneBasics(
  options: GeometraThreeSceneBasicsOptions = {},
): GeometraThreeSceneBasics {
  const {
    threeBackground,
    cameraFov,
    cameraNear,
    cameraFar,
    cameraPosition,
  } = { ...GEOMETRA_THREE_HOST_SCENE_DEFAULTS, ...options }

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

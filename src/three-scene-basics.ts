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

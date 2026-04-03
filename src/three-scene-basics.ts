import * as THREE from 'three'

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
 * Create a scene, perspective camera, and clock with the same defaults as
 * {@link createThreeGeometraSplitHost} and {@link createThreeGeometraStackedHost}.
 *
 * Use this when you want Three.js state aligned with those hosts but manage your own
 * `WebGLRenderer` (for example headless GL, offscreen canvas, or custom render targets).
 */
export function createGeometraThreeSceneBasics(
  options: GeometraThreeSceneBasicsOptions = {},
): {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  clock: THREE.Clock
} {
  const {
    threeBackground = 0x000000,
    cameraFov = 50,
    cameraNear = 0.1,
    cameraFar = 2000,
    cameraPosition = [0, 0, 5],
  } = options

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(threeBackground)

  const camera = new THREE.PerspectiveCamera(cameraFov, 1, cameraNear, cameraFar)
  camera.position.set(cameraPosition[0]!, cameraPosition[1]!, cameraPosition[2]!)

  const clock = new THREE.Clock()

  return { scene, camera, clock }
}

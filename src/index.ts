export {
  createThreeGeometraSplitHost,
  type ThreeGeometraSplitHostHandle,
  type ThreeGeometraSplitHostOptions,
  type ThreeFrameContext,
  type ThreeRuntimeContext,
} from './split-host.js'
export {
  createThreeGeometraStackedHost,
  type GeometraHudPlacement,
  type ThreeGeometraStackedHostHandle,
  type ThreeGeometraStackedHostOptions,
} from './stacked-host.js'
export {
  normalizeGeometraLayoutPixels,
  resizeGeometraThreeDrawingBufferView,
  resizeGeometraThreePerspectiveView,
  resolveHostDevicePixelRatio,
  setWebGLDrawingBufferSize,
  syncGeometraThreePerspectiveFromBuffer,
} from './utils.js'
export {
  GEOMETRA_THREE_HOST_SCENE_DEFAULTS,
  createGeometraThreeSceneBasics,
  type GeometraThreeSceneBasics,
  type GeometraThreeSceneBasicsOptions,
} from './three-scene-basics.js'

/** Re-export for hybrid apps using {@link createThreeGeometraSplitHost} with `onData`. */
export { GEOM_DATA_CHANNEL_TRACKER_SNAPSHOT } from '@geometra/client'

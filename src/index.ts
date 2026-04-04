/**
 * `@geometra/renderer-three` — split/stacked Three.js + Geometra canvas hosts, WebGL sizing helpers
 * ({@link resizeGeometraThreePerspectiveView}, drawing-buffer paths, DPR capping, {@link resolveHeadlessHostDevicePixelRatio}), shared scene defaults
 * ({@link createGeometraThreeSceneBasics}, {@link resolveGeometraThreeSceneBasicsOptions},
 * {@link createGeometraThreeWebGLWithSceneBasics},
 * {@link resizeGeometraThreeWebGLWithSceneBasicsView}, {@link renderGeometraThreeWebGLWithSceneBasicsFrame},
 * {@link disposeGeometraThreeWebGLWithSceneBasics}), and
 * {@link createGeometraHostLayoutSyncRaf} for custom hybrid layouts, and {@link coerceHostStackingZIndexCss}
 * for stacked-overlay `z-index` rules.
 */

export {
  createThreeGeometraSplitHost,
  type GeometraHostBrowserCanvasClientOptions,
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
  createGeometraThreePerspectiveResizeHandler,
  geometraHostPerspectiveAspectFromCss,
  normalizeGeometraLayoutPixels,
  resizeGeometraThreeDrawingBufferView,
  resizeGeometraThreePerspectiveView,
  resolveHeadlessHostDevicePixelRatio,
  resolveHostDevicePixelRatio,
  setWebGLDrawingBufferSize,
  syncGeometraThreePerspectiveFromBuffer,
} from './utils.js'
export {
  GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS,
  GEOMETRA_THREE_HOST_SCENE_DEFAULTS,
  createGeometraHostWebGLRendererParams,
  createGeometraThreeSceneBasics,
  resolveGeometraThreeSceneBasicsOptions,
  createGeometraThreeWebGLRenderer,
  createGeometraThreeWebGLWithSceneBasics,
  disposeGeometraThreeWebGLWithSceneBasics,
  renderGeometraThreeWebGLWithSceneBasicsFrame,
  resizeGeometraThreeWebGLWithSceneBasicsView,
  type GeometraThreeSceneBasics,
  type GeometraThreeSceneBasicsOptions,
  type GeometraThreeWebGLWithSceneBasics,
} from './three-scene-basics.js'
export {
  createGeometraHostLayoutSyncRaf,
  type GeometraHostLayoutSyncRaf,
  type GeometraHostLayoutSyncRafOptions,
} from './layout-sync.js'
export { coerceHostNonNegativeCssPx, coerceHostStackingZIndexCss } from './host-css-coerce.js'

/** Re-export for hybrid apps using {@link createThreeGeometraSplitHost} with `onData`. */
export { GEOM_DATA_CHANNEL_TRACKER_SNAPSHOT } from '@geometra/client'

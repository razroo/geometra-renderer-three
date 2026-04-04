/**
 * `@geometra/renderer-three` — split/stacked Three.js + Geometra canvas hosts, WebGL sizing helpers
 * ({@link resizeGeometraThreePerspectiveView}, {@link toPlainGeometraThreeViewSizingState}, drawing-buffer paths, DPR capping, {@link resolveHeadlessHostDevicePixelRatio}, {@link createGeometraThreePerspectiveResizeHandlerHeadless}), shared scene defaults
 * ({@link createGeometraThreeSceneBasics}, {@link resolveGeometraThreeSceneBasicsOptions}, {@link toPlainGeometraThreeSceneBasicsOptions},
 * {@link createGeometraThreeWebGLWithSceneBasics},
 * {@link resizeGeometraThreeWebGLWithSceneBasicsView}, {@link resizeGeometraThreeWebGLWithSceneBasicsViewHeadless},
 * {@link renderGeometraThreeWebGLWithSceneBasicsFrame},
 * {@link tickGeometraThreeWebGLWithSceneBasicsFrame} (`onFrame` may return `false` to skip `render`), {@link disposeGeometraThreeWebGLWithSceneBasics},
 * {@link toPlainGeometraThreeHostSnapshot}, {@link toPlainGeometraThreeHostSnapshotHeadless},
 * {@link toPlainGeometraThreeHostSnapshotFromViewSizing}), and
 * {@link createGeometraHostLayoutSyncRaf} for custom hybrid layouts, {@link coerceHostStackingZIndexCss},
 * {@link coerceGeometraHudPointerEvents}, and {@link coerceGeometraHudPlacement} for stacked-overlay stacking and
 * HUD corner rules, and {@link GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS} /
 * {@link GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS} for host layout defaults (custom layouts, logs, agent payloads).
 */

export {
  createThreeGeometraSplitHost,
  GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS,
  type GeometraHostBrowserCanvasClientOptions,
  type ThreeGeometraSplitHostHandle,
  type ThreeGeometraSplitHostOptions,
  type ThreeFrameContext,
  type ThreeRuntimeContext,
} from './split-host.js'
export {
  createThreeGeometraStackedHost,
  GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS,
  type ThreeGeometraStackedHostHandle,
  type ThreeGeometraStackedHostOptions,
} from './stacked-host.js'
export {
  createGeometraThreePerspectiveResizeHandler,
  createGeometraThreePerspectiveResizeHandlerHeadless,
  geometraHostPerspectiveAspectFromCss,
  normalizeGeometraLayoutPixels,
  resizeGeometraThreeDrawingBufferView,
  resizeGeometraThreePerspectiveView,
  resolveHeadlessHostDevicePixelRatio,
  resolveHostDevicePixelRatio,
  setWebGLDrawingBufferSize,
  syncGeometraThreePerspectiveFromBuffer,
  toPlainGeometraThreeViewSizingState,
  type PlainGeometraThreeViewSizingState,
} from './utils.js'
export {
  GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS,
  GEOMETRA_THREE_HOST_SCENE_DEFAULTS,
  createGeometraHostWebGLRendererParams,
  createGeometraThreeSceneBasics,
  resolveGeometraThreeSceneBasicsOptions,
  toPlainGeometraThreeSceneBasicsOptions,
  toPlainGeometraThreeHostSnapshot,
  toPlainGeometraThreeHostSnapshotHeadless,
  toPlainGeometraThreeHostSnapshotFromViewSizing,
  createGeometraThreeWebGLRenderer,
  createGeometraThreeWebGLWithSceneBasics,
  disposeGeometraThreeWebGLWithSceneBasics,
  renderGeometraThreeWebGLWithSceneBasicsFrame,
  tickGeometraThreeWebGLWithSceneBasicsFrame,
  resizeGeometraThreeWebGLWithSceneBasicsView,
  resizeGeometraThreeWebGLWithSceneBasicsViewHeadless,
  type GeometraThreeSceneBasics,
  type GeometraThreeSceneBasicsOptions,
  type PlainGeometraThreeSceneBasicsOptions,
  type PlainGeometraThreeHostSnapshot,
  type GeometraThreeWebGLWithSceneBasics,
  type GeometraThreeWebGLWithSceneBasicsTickContext,
} from './three-scene-basics.js'
export {
  createGeometraHostLayoutSyncRaf,
  type GeometraHostLayoutSyncRaf,
  type GeometraHostLayoutSyncRafOptions,
} from './layout-sync.js'
export {
  coerceGeometraHudPlacement,
  coerceGeometraHudPointerEvents,
  coerceHostNonNegativeCssPx,
  coerceHostStackingZIndexCss,
} from './host-css-coerce.js'
export type { GeometraHudPlacement } from './host-css-coerce.js'

/** Re-export for hybrid apps using {@link createThreeGeometraSplitHost} with `onData`. */
export { GEOM_DATA_CHANNEL_TRACKER_SNAPSHOT } from '@geometra/client'

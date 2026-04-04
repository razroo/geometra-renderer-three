/**
 * `@geometra/renderer-three` — split/stacked Three.js + Geometra canvas hosts, WebGL sizing helpers
 * ({@link resizeGeometraThreePerspectiveView}, {@link toPlainGeometraThreeViewSizingState}, drawing-buffer paths, DPR capping, {@link resolveHeadlessHostDevicePixelRatio}, {@link createGeometraThreePerspectiveResizeHandlerHeadless}), shared scene defaults
 * ({@link createGeometraThreeSceneBasics}, {@link resolveGeometraThreeSceneBasicsOptions}, {@link toPlainGeometraThreeSceneBasicsOptions},
 * {@link createGeometraThreeSceneBasicsFromPlain},
 * {@link createGeometraThreeWebGLWithSceneBasics},
 * {@link resizeGeometraThreeWebGLWithSceneBasicsView}, {@link resizeGeometraThreeWebGLWithSceneBasicsViewHeadless},
 * {@link toPlainGeometraThreeViewSizingStateHeadless},
 * {@link renderGeometraThreeWebGLWithSceneBasicsFrame},
 * {@link tickGeometraThreeWebGLWithSceneBasicsFrame} (`onFrame` may return `false` to skip `render` and make the tick return `false`, or throw to skip), {@link disposeGeometraThreeWebGLWithSceneBasics} (optional `clock` stops timing after dispose),
 * {@link toPlainGeometraThreeHostSnapshot}, {@link toPlainGeometraThreeHostSnapshotHeadless},
 * {@link toPlainGeometraThreeHostSnapshotFromViewSizing},
 * {@link toPlainGeometraSplitHostLayoutOptions} / {@link toPlainGeometraStackedHostLayoutOptions},
 * {@link toPlainGeometraThreeSplitHostSnapshot} / {@link toPlainGeometraThreeStackedHostSnapshot} (and headless variants)
 * for JSON-stable split/stacked layout plus viewport/scene in one object ({@link isGeometraHybridHostKind}, {@link GEOMETRA_HYBRID_HOST_KINDS}), and
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
  toPlainGeometraThreeViewSizingStateHeadless,
  type PlainGeometraThreeViewSizingState,
} from './utils.js'
export {
  GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS,
  GEOMETRA_THREE_HOST_SCENE_DEFAULTS,
  createGeometraHostWebGLRendererParams,
  createGeometraThreeSceneBasics,
  createGeometraThreeSceneBasicsFromPlain,
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
export {
  GEOMETRA_HYBRID_HOST_KINDS,
  isGeometraHybridHostKind,
  toPlainGeometraSplitHostLayoutOptions,
  toPlainGeometraStackedHostLayoutOptions,
  toPlainGeometraThreeSplitHostSnapshot,
  toPlainGeometraThreeSplitHostSnapshotHeadless,
  toPlainGeometraThreeStackedHostSnapshot,
  toPlainGeometraThreeStackedHostSnapshotHeadless,
  type GeometraHybridHostKind,
  type PlainGeometraSplitHostLayoutOptions,
  type PlainGeometraStackedHostLayoutOptions,
  type PlainGeometraThreeSplitHostSnapshot,
  type PlainGeometraThreeStackedHostSnapshot,
  type ToPlainGeometraSplitHostLayoutOptionsInput,
  type ToPlainGeometraStackedHostLayoutOptionsInput,
} from './host-layout-plain.js'

/**
 * Data channel name for tracker snapshot JSON on the GEOM WebSocket (from `@geometra/client`).
 * Use in `onData` handlers passed through {@link createThreeGeometraSplitHost} /
 * {@link createThreeGeometraStackedHost} so channel comparisons stay aligned with the thin client.
 */
export { GEOM_DATA_CHANNEL_TRACKER_SNAPSHOT } from '@geometra/client'

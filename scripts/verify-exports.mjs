#!/usr/bin/env node
/**
 * Post-build smoke check: ensure the published ESM entry exports the expected public API.
 * Run after `npm run build` (see `release:gate`). Keeps tooling minimal vs a full test runner.
 */
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const indexHref = pathToFileURL(path.join(root, 'dist', 'index.js')).href
const mod = await import(indexHref)

const expectedFunctions = [
  'coerceGeometraHudPlacement',
  'coerceGeometraHudPointerEvents',
  'coerceGeometraHybridHostKind',
  'coerceHostNonNegativeCssPx',
  'coerceHostStackingZIndexCss',
  'createThreeGeometraSplitHost',
  'createThreeGeometraStackedHost',
  'createGeometraHostLayoutSyncRaf',
  'createGeometraHostWebGLRendererParams',
  'createGeometraThreePerspectiveResizeHandler',
  'createGeometraThreePerspectiveResizeHandlerHeadless',
  'createGeometraThreeSceneBasics',
  'createGeometraThreeSceneBasicsFromPlain',
  'resolveGeometraThreeSceneBasicsOptions',
  'createGeometraThreeWebGLRenderer',
  'createGeometraThreeWebGLWithSceneBasics',
  'createGeometraThreeWebGLWithSceneBasicsFromPlain',
  'disposeGeometraThreeWebGLWithSceneBasics',
  'renderGeometraThreeWebGLWithSceneBasicsFrame',
  'resizeGeometraThreeWebGLWithSceneBasicsView',
  'resizeGeometraThreeWebGLWithSceneBasicsViewHeadless',
  'resizeGeometraThreeWebGLWithSceneBasicsViewFromPlainViewSizing',
  'resizeTickGeometraThreeWebGLWithSceneBasics',
  'resizeTickGeometraThreeWebGLWithSceneBasicsDrawingBuffer',
  'resizeTickGeometraThreeWebGLWithSceneBasicsDrawingBufferHeadless',
  'resizeTickGeometraThreeWebGLWithSceneBasicsFromPlainViewSizing',
  'resizeTickGeometraThreeWebGLWithSceneBasicsFromPlainHostSnapshot',
  'resizeTickGeometraThreeWebGLWithSceneBasicsHeadless',
  'geometraHostPerspectiveAspectFromCss',
  'isGeometraHybridHostKind',
  'isPlainGeometraSplitHostLayoutOptions',
  'isPlainGeometraStackedHostLayoutOptions',
  'isPlainGeometraHybridHostKind',
  'isPlainGeometraThreeHostSnapshot',
  'isPlainGeometraThreeSceneBasicsOptions',
  'isPlainGeometraThreeSplitHostSnapshot',
  'isPlainGeometraThreeStackedHostSnapshot',
  'isPlainGeometraThreeViewSizingState',
  'mergePlainGeometraThreeHostSnapshot',
  'normalizeGeometraLayoutPixels',
  'resizeGeometraThreeDrawingBufferView',
  'resizeGeometraThreeDrawingBufferViewHeadless',
  'resizeGeometraThreePerspectiveView',
  'resolveHeadlessHostDevicePixelRatio',
  'resolveHostDevicePixelRatio',
  'resolveHostDevicePixelRatioFromWindow',
  'setWebGLDrawingBufferSize',
  'syncGeometraThreePerspectiveFromBuffer',
  'tickGeometraThreeWebGLWithSceneBasicsFrame',
  'toPlainGeometraThreeHostSnapshot',
  'toPlainGeometraThreeHostSnapshotHeadless',
  'toPlainGeometraThreeHostSnapshotFromViewSizing',
  'toPlainGeometraThreeSceneBasicsOptions',
  'toPlainGeometraThreeViewSizingState',
  'toPlainGeometraThreeViewSizingStateHeadless',
  'toPlainGeometraSplitHostLayoutOptions',
  'toPlainGeometraStackedHostLayoutOptions',
  'toPlainGeometraStackedHudRect',
  'toPlainGeometraThreeSplitHostSnapshot',
  'toPlainGeometraThreeSplitHostSnapshotHeadless',
  'toPlainGeometraThreeStackedHostSnapshot',
  'toPlainGeometraThreeStackedHostSnapshotHeadless',
]
const missingFns = expectedFunctions.filter((name) => typeof mod[name] !== 'function')
if (missingFns.length) {
  console.error('verify-exports: missing or non-function exports:', missingFns.join(', '))
  process.exit(1)
}

const expectedObjects = [
  'GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS',
  'GEOMETRA_HYBRID_HOST_KINDS',
  'GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS',
  'GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS',
  'GEOMETRA_THREE_HOST_SCENE_DEFAULTS',
]
const missingObjs = expectedObjects.filter(
  (name) => mod[name] === null || typeof mod[name] !== 'object',
)
if (missingObjs.length) {
  console.error('verify-exports: missing object exports:', missingObjs.join(', '))
  process.exit(1)
}

const expectedStrings = ['GEOM_DATA_CHANNEL_TRACKER_SNAPSHOT']
const missingStr = expectedStrings.filter((name) => typeof mod[name] !== 'string')
if (missingStr.length) {
  console.error('verify-exports: missing string exports:', missingStr.join(', '))
  process.exit(1)
}

const expectedNumbers = ['GEOMETRA_HEADLESS_RAW_DEVICE_PIXEL_RATIO']
const missingNum = expectedNumbers.filter((name) => typeof mod[name] !== 'number')
if (missingNum.length) {
  console.error('verify-exports: missing or non-number exports:', missingNum.join(', '))
  process.exit(1)
}
if (mod.GEOMETRA_HEADLESS_RAW_DEVICE_PIXEL_RATIO !== 1) {
  console.error('verify-exports: GEOMETRA_HEADLESS_RAW_DEVICE_PIXEL_RATIO must be 1')
  process.exit(1)
}

if (mod.GEOM_DATA_CHANNEL_TRACKER_SNAPSHOT !== 'geom.tracker.snapshot') {
  console.error(
    'verify-exports: GEOM_DATA_CHANNEL_TRACKER_SNAPSHOT must match @geometra/client (expected geom.tracker.snapshot)',
  )
  process.exit(1)
}

const expected = [...expectedFunctions, ...expectedObjects, ...expectedStrings, ...expectedNumbers]
const extra = Object.keys(mod).filter((k) => !expected.includes(k))
if (extra.length) {
  console.error('verify-exports: unexpected extra exports:', extra.join(', '))
  process.exit(1)
}

console.log('verify-exports: ok')

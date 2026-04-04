#!/usr/bin/env node
/**
 * Post-build checks for `resolveHostDevicePixelRatio`, `resolveHeadlessHostDevicePixelRatio`,
 * `resizeGeometraThreeDrawingBufferView`,
 * `resizeGeometraThreePerspectiveView` (including non-finite / non-positive `pixelRatio` and negative CSS sizes),
 * `setWebGLDrawingBufferSize` (including non-positive `pixelRatio`),
 * `syncGeometraThreePerspectiveFromBuffer`, `createGeometraThreePerspectiveResizeHandler`,
 * `createGeometraThreePerspectiveResizeHandlerHeadless`,
 * `geometraHostPerspectiveAspectFromCss`,
 * `normalizeGeometraLayoutPixels`,
 * `GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS`, `GEOMETRA_THREE_HOST_SCENE_DEFAULTS`, and
 * `createGeometraHostWebGLRendererParams`, `createGeometraThreeSceneBasics`, `createGeometraThreeSceneBasicsFromPlain`,
 * `resolveGeometraThreeSceneBasicsOptions`,
 * `toPlainGeometraThreeSceneBasicsOptions`, `toPlainGeometraThreeHostSnapshot`, `isPlainGeometraThreeHostSnapshot`,
 * `toPlainGeometraThreeHostSnapshotHeadless`,
 * `toPlainGeometraThreeHostSnapshotFromViewSizing`, `toPlainGeometraThreeViewSizingState`,
 * `toPlainGeometraThreeViewSizingStateHeadless`
 * (including invalid camera coercion and out-of-range FOV),
 * `disposeGeometraThreeWebGLWithSceneBasics` (optional `clock` → `Clock#stop` before `renderer.dispose`),
 * `renderGeometraThreeWebGLWithSceneBasicsFrame`,
 * `tickGeometraThreeWebGLWithSceneBasicsFrame` (including `onFrame` returning `false` to skip `render` and yield
 * `false`, successful ticks returning `true`, and `onFrame` throwing so `render` is skipped),
 * `resizeGeometraThreeWebGLWithSceneBasicsView`, `resizeGeometraThreeWebGLWithSceneBasicsViewHeadless`,
 * `resizeTickGeometraThreeWebGLWithSceneBasics` / `resizeTickGeometraThreeWebGLWithSceneBasicsHeadless` (resize then tick; headless delegates with raw DPR 1; return `false` when `onFrame` returns `false`),
 * `toPlainGeometraSplitHostLayoutOptions`, `toPlainGeometraStackedHostLayoutOptions`,
 * `toPlainGeometraThreeSplitHostSnapshot`, `toPlainGeometraThreeSplitHostSnapshotHeadless`,
 * `toPlainGeometraThreeStackedHostSnapshot`, `toPlainGeometraThreeStackedHostSnapshotHeadless`
 * (composite snapshots include `geometraHybridHostKind`: `'split'` | `'stacked'`; `isGeometraHybridHostKind`, `coerceGeometraHybridHostKind`, `GEOMETRA_HYBRID_HOST_KINDS`)
 * (`createGeometraThreeWebGLRenderer` / `createGeometraThreeWebGLWithSceneBasics` need a real GL context;
 * export shape is checked in verify-exports only)
 * using lightweight mocks /
 * Node `three` (no WebGL).
 * Run after `npm run build` (see `release:gate`).
 */
import assert from 'node:assert/strict'
import path from 'node:path'
import * as THREE from 'three'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const indexHref = pathToFileURL(path.join(root, 'dist', 'index.js')).href
const {
  GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS,
  GEOMETRA_THREE_HOST_SCENE_DEFAULTS,
  createGeometraHostWebGLRendererParams,
  createGeometraThreePerspectiveResizeHandler,
  createGeometraThreePerspectiveResizeHandlerHeadless,
  normalizeGeometraLayoutPixels,
  resizeGeometraThreeDrawingBufferView,
  resizeGeometraThreePerspectiveView,
  resolveHeadlessHostDevicePixelRatio,
  resolveHostDevicePixelRatio,
  setWebGLDrawingBufferSize,
  syncGeometraThreePerspectiveFromBuffer,
  createGeometraThreeSceneBasics,
  createGeometraThreeSceneBasicsFromPlain,
  resolveGeometraThreeSceneBasicsOptions,
  disposeGeometraThreeWebGLWithSceneBasics,
  geometraHostPerspectiveAspectFromCss,
  isPlainGeometraThreeHostSnapshot,
  renderGeometraThreeWebGLWithSceneBasicsFrame,
  tickGeometraThreeWebGLWithSceneBasicsFrame,
  resizeGeometraThreeWebGLWithSceneBasicsView,
  resizeGeometraThreeWebGLWithSceneBasicsViewHeadless,
  resizeTickGeometraThreeWebGLWithSceneBasics,
  resizeTickGeometraThreeWebGLWithSceneBasicsHeadless,
  toPlainGeometraThreeHostSnapshot,
  toPlainGeometraThreeHostSnapshotFromViewSizing,
  toPlainGeometraThreeHostSnapshotHeadless,
  toPlainGeometraThreeSceneBasicsOptions,
  toPlainGeometraThreeViewSizingState,
  toPlainGeometraThreeViewSizingStateHeadless,
  GEOMETRA_HYBRID_HOST_KINDS,
  GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS,
  GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS,
  toPlainGeometraSplitHostLayoutOptions,
  toPlainGeometraStackedHostLayoutOptions,
  toPlainGeometraThreeSplitHostSnapshot,
  toPlainGeometraThreeSplitHostSnapshotHeadless,
  toPlainGeometraThreeStackedHostSnapshot,
  toPlainGeometraThreeStackedHostSnapshotHeadless,
  isGeometraHybridHostKind,
  coerceGeometraHybridHostKind,
} = await import(indexHref)

function testNormalizeGeometraLayoutPixels() {
  assert.equal(normalizeGeometraLayoutPixels(100.9), 100)
  assert.equal(normalizeGeometraLayoutPixels(0.9), 1)
  assert.equal(normalizeGeometraLayoutPixels(0), 1)
  assert.equal(normalizeGeometraLayoutPixels(Number.NaN), 1)
}

function testGeometraHostPerspectiveAspectFromCss() {
  assert.equal(geometraHostPerspectiveAspectFromCss(800, 400), 2)
  assert.equal(geometraHostPerspectiveAspectFromCss(100.9, 50.1), 100 / 50)
  assert.equal(geometraHostPerspectiveAspectFromCss(0, 0), 1)
  assert.equal(geometraHostPerspectiveAspectFromCss(Number.NaN, Number.POSITIVE_INFINITY), 1)
}

function testToPlainGeometraThreeViewSizingStateMatchesHostPath() {
  const a = toPlainGeometraThreeViewSizingState(800, 400, 2)
  assert.equal(a.layoutWidth, 800)
  assert.equal(a.layoutHeight, 400)
  assert.equal(a.perspectiveAspect, 2)
  assert.equal(a.sanitizedRawDevicePixelRatio, 2)
  assert.equal(a.effectiveDevicePixelRatio, 2)
  assert.equal(a.drawingBufferWidth, 1600)
  assert.equal(a.drawingBufferHeight, 800)

  const floored = toPlainGeometraThreeViewSizingState(100.9, 50.1, 2)
  assert.equal(floored.layoutWidth, 100)
  assert.equal(floored.layoutHeight, 50)
  assert.equal(floored.perspectiveAspect, 2)
  assert.equal(floored.drawingBufferWidth, 200)
  assert.equal(floored.drawingBufferHeight, 100)

  const capped = toPlainGeometraThreeViewSizingState(640, 480, 3, 2)
  assert.equal(capped.sanitizedRawDevicePixelRatio, 3)
  assert.equal(capped.effectiveDevicePixelRatio, 2)
  assert.equal(capped.drawingBufferWidth, 1280)
  assert.equal(capped.drawingBufferHeight, 960)

  const badRaw = toPlainGeometraThreeViewSizingState(10, 10, Number.NaN)
  assert.equal(badRaw.sanitizedRawDevicePixelRatio, 1)
  assert.equal(badRaw.effectiveDevicePixelRatio, 1)

  const roundTrip = JSON.parse(JSON.stringify(toPlainGeometraThreeViewSizingState(320, 240, 1.5)))
  assert.equal(roundTrip.layoutWidth, 320)
  assert.equal(roundTrip.effectiveDevicePixelRatio, 1.5)
}

function testToPlainGeometraThreeViewSizingStateHeadlessMatchesRawOne() {
  const headless = toPlainGeometraThreeViewSizingStateHeadless(640, 360, 2)
  const explicit = toPlainGeometraThreeViewSizingState(640, 360, 1, 2)
  assert.deepEqual(headless, explicit)
}

function testResolveHostDevicePixelRatio() {
  assert.equal(resolveHostDevicePixelRatio(2, undefined), 2)
  assert.equal(resolveHostDevicePixelRatio(3, 2), 2)
  assert.equal(resolveHostDevicePixelRatio(1.5, 2), 1.5)
  assert.equal(resolveHostDevicePixelRatio(2, 0), 2)
  assert.equal(resolveHostDevicePixelRatio(2, Number.NaN), 2)
  assert.equal(resolveHostDevicePixelRatio(Number.NaN, 2), 1)
  // Invalid raw DPR falls back to 1 (matches split/stacked: win.devicePixelRatio || 1).
  assert.equal(resolveHostDevicePixelRatio(0, undefined), 1)
  assert.equal(resolveHostDevicePixelRatio(-1, undefined), 1)
  assert.equal(resolveHostDevicePixelRatio(Number.POSITIVE_INFINITY, undefined), 1)
  // Non-finite cap is ignored (same branch as undefined cap).
  assert.equal(resolveHostDevicePixelRatio(2, Number.POSITIVE_INFINITY), 2)
}

function testResolveHeadlessHostDevicePixelRatio() {
  assert.equal(resolveHeadlessHostDevicePixelRatio(undefined), 1)
  assert.equal(resolveHeadlessHostDevicePixelRatio(2), 1)
  assert.equal(resolveHeadlessHostDevicePixelRatio(), 1)
  assert.equal(resolveHeadlessHostDevicePixelRatio(Number.NaN), 1)
  assert.equal(resolveHeadlessHostDevicePixelRatio(0), 1)
  assert.equal(resolveHeadlessHostDevicePixelRatio(Number.POSITIVE_INFINITY), 1)
}

function testCreateGeometraThreePerspectiveResizeHandlerMatchesDirectResize() {
  const log = []
  const renderer = {
    setPixelRatio(pr) {
      log.push(['setPixelRatio', pr])
    },
    setSize(w, h, updateStyle) {
      log.push(['setSize', w, h, updateStyle])
    },
  }
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {
      log.push(['updateProjectionMatrix'])
    },
  }

  const handler = createGeometraThreePerspectiveResizeHandler(renderer, camera, () => 2, 2)
  handler(800, 400)

  assert.deepEqual(log, [
    ['setPixelRatio', 2],
    ['updateProjectionMatrix'],
    ['setSize', 800, 400, false],
  ])
  assert.equal(camera.aspect, 2)

  log.length = 0
  const capped = createGeometraThreePerspectiveResizeHandler(renderer, camera, () => 3, 2)
  capped(640, 480)
  assert.deepEqual(log[0], ['setPixelRatio', 2])
  assert.equal(camera.aspect, 640 / 480)
}

function testResizeGeometraThreePerspectiveView() {
  const log = []
  const renderer = {
    setPixelRatio(pr) {
      log.push(['setPixelRatio', pr])
    },
    setSize(w, h, updateStyle) {
      log.push(['setSize', w, h, updateStyle])
    },
  }
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {
      log.push(['updateProjectionMatrix'])
    },
  }

  resizeGeometraThreePerspectiveView(renderer, camera, 800, 400, 2)

  assert.deepEqual(log, [
    ['setPixelRatio', 2],
    ['updateProjectionMatrix'],
    ['setSize', 800, 400, false],
  ])
  assert.equal(camera.aspect, 2)
}

function testResizeGeometraThreePerspectiveViewFloorsCssAndGuardsMinSize() {
  const renderer = {
    setPixelRatio() {},
    setSize() {},
  }
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {},
  }

  resizeGeometraThreePerspectiveView(renderer, camera, 100.9, 50.1, 1)
  assert.equal(camera.aspect, 100 / 50)

  resizeGeometraThreePerspectiveView(renderer, camera, 0, 0, 1)
  assert.equal(camera.aspect, 1)
}

function testResizeGeometraThreePerspectiveViewSanitizesNonFiniteInputs() {
  const log = []
  const renderer = {
    setPixelRatio(pr) {
      log.push(['setPixelRatio', pr])
    },
    setSize(w, h, updateStyle) {
      log.push(['setSize', w, h, updateStyle])
    },
  }
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {
      log.push(['updateProjectionMatrix'])
    },
  }

  resizeGeometraThreePerspectiveView(renderer, camera, Number.NaN, Number.POSITIVE_INFINITY, 0)

  assert.deepEqual(log, [
    ['setPixelRatio', 1],
    ['updateProjectionMatrix'],
    ['setSize', 1, 1, false],
  ])
  assert.equal(camera.aspect, 1)
}

function testResizeGeometraThreePerspectiveViewNegativeCssClampsToMinLayoutPixels() {
  const renderer = {
    setPixelRatio() {},
    setSize(w, h) {
      assert.equal(w, 1)
      assert.equal(h, 1)
    },
  }
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {},
  }

  resizeGeometraThreePerspectiveView(renderer, camera, -100, -0.5, 1)
  assert.equal(camera.aspect, 1)
}

function testResizeGeometraThreePerspectiveViewSanitizesNonFinitePixelRatio() {
  const log = []
  const renderer = {
    setPixelRatio(pr) {
      log.push(['setPixelRatio', pr])
    },
    setSize(w, h, updateStyle) {
      log.push(['setSize', w, h, updateStyle])
    },
  }
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {
      log.push(['updateProjectionMatrix'])
    },
  }

  resizeGeometraThreePerspectiveView(renderer, camera, 640, 480, Number.NaN)

  assert.deepEqual(log, [
    ['setPixelRatio', 1],
    ['updateProjectionMatrix'],
    ['setSize', 640, 480, false],
  ])

  log.length = 0
  resizeGeometraThreePerspectiveView(renderer, camera, 320, 240, -1)

  assert.deepEqual(log, [
    ['setPixelRatio', 1],
    ['updateProjectionMatrix'],
    ['setSize', 320, 240, false],
  ])
}

function testSyncGeometraThreePerspectiveFromBuffer() {
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {},
  }

  syncGeometraThreePerspectiveFromBuffer(camera, 800, 400)
  assert.equal(camera.aspect, 2)

  syncGeometraThreePerspectiveFromBuffer(camera, 0, 0)
  assert.equal(camera.aspect, 1)

  syncGeometraThreePerspectiveFromBuffer(camera, Number.NaN, Number.POSITIVE_INFINITY)
  assert.equal(camera.aspect, 1)
}

function testSetWebGLDrawingBufferSize() {
  const log = []
  const dom = { width: 0, height: 0 }
  const renderer = {
    domElement: dom,
    setDrawingBufferSize(w, h, pr) {
      log.push(['setDrawingBufferSize', w, h, pr])
      dom.width = w
      dom.height = h
    },
  }

  setWebGLDrawingBufferSize(renderer, 100, 50, 3)
  assert.deepEqual(log, [['setDrawingBufferSize', 300, 150, 3]])

  log.length = 0
  setWebGLDrawingBufferSize(renderer, 0.2, 0.2, 2)
  assert.deepEqual(log, [['setDrawingBufferSize', 1, 1, 2]])

  log.length = 0
  setWebGLDrawingBufferSize(renderer, Number.NaN, 50, Number.NaN)
  assert.deepEqual(log, [['setDrawingBufferSize', 1, 50, 1]])

  log.length = 0
  setWebGLDrawingBufferSize(renderer, 10, 10, 0)
  assert.deepEqual(log, [['setDrawingBufferSize', 10, 10, 1]])

  log.length = 0
  setWebGLDrawingBufferSize(renderer, 10, 10, -2)
  assert.deepEqual(log, [['setDrawingBufferSize', 10, 10, 1]])
}

function testResizeGeometraThreeDrawingBufferView() {
  const dom = { width: 0, height: 0 }
  const log = []
  const renderer = {
    domElement: dom,
    setDrawingBufferSize(w, h, pr) {
      log.push(['setDrawingBufferSize', w, h, pr])
      dom.width = w
      dom.height = h
    },
  }
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {
      log.push(['updateProjectionMatrix'])
    },
  }

  resizeGeometraThreeDrawingBufferView(renderer, camera, 100, 50, 2)

  assert.deepEqual(log, [
    ['setDrawingBufferSize', 200, 100, 2],
    ['updateProjectionMatrix'],
  ])
  assert.equal(camera.aspect, 2)
}

function testGeometraHostWebglRendererOptions() {
  assert.equal(GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS.antialias, true)
  assert.equal(GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS.alpha, false)
}

function testCreateGeometraHostWebGLRendererParams() {
  const canvas = {}
  const params = createGeometraHostWebGLRendererParams(canvas)
  assert.equal(params.canvas, canvas)
  assert.equal(params.antialias, GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS.antialias)
  assert.equal(params.alpha, GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS.alpha)
}

function testGeometraThreeHostSceneDefaultsMatchBasics() {
  const { scene, camera } = createGeometraThreeSceneBasics()

  assert.equal(scene.background.getHex(), GEOMETRA_THREE_HOST_SCENE_DEFAULTS.threeBackground)
  assert.equal(camera.fov, GEOMETRA_THREE_HOST_SCENE_DEFAULTS.cameraFov)
  assert.equal(camera.near, GEOMETRA_THREE_HOST_SCENE_DEFAULTS.cameraNear)
  assert.equal(camera.far, GEOMETRA_THREE_HOST_SCENE_DEFAULTS.cameraFar)
  assert.deepEqual(
    [camera.position.x, camera.position.y, camera.position.z],
    [...GEOMETRA_THREE_HOST_SCENE_DEFAULTS.cameraPosition],
  )
}

function testResolveGeometraThreeSceneBasicsOptionsMatchesDefaultsAndCreate() {
  const resolvedEmpty = resolveGeometraThreeSceneBasicsOptions()
  assert.deepEqual(resolvedEmpty, GEOMETRA_THREE_HOST_SCENE_DEFAULTS)

  const opts = {
    threeBackground: 0x112233,
    cameraFov: 40,
    cameraNear: 0.2,
    cameraFar: 500,
    cameraPosition: /** @type {const} */ ([4, 5, 6]),
  }
  const resolved = resolveGeometraThreeSceneBasicsOptions(opts)
  const { camera } = createGeometraThreeSceneBasics(opts)
  assert.equal(resolved.threeBackground, opts.threeBackground)
  assert.equal(resolved.cameraFov, camera.fov)
  assert.equal(resolved.cameraNear, camera.near)
  assert.equal(resolved.cameraFar, camera.far)
  assert.deepEqual([...resolved.cameraPosition], [camera.position.x, camera.position.y, camera.position.z])
}

function testToPlainGeometraThreeHostSnapshotMatchesMergedPlainHelpers() {
  const w = 800
  const h = 400
  const dpr = 2
  const cap = 1.5
  const sceneOpts = { threeBackground: '#00ff88', cameraFov: 40 }
  const merged = toPlainGeometraThreeHostSnapshot(w, h, dpr, cap, sceneOpts)
  const view = toPlainGeometraThreeViewSizingState(w, h, dpr, cap)
  const scene = toPlainGeometraThreeSceneBasicsOptions(sceneOpts)
  assert.deepEqual(merged, { ...view, ...scene })
  const roundTrip = JSON.parse(JSON.stringify(merged))
  assert.equal(roundTrip.layoutWidth, view.layoutWidth)
  assert.equal(roundTrip.threeBackgroundHex, scene.threeBackgroundHex)
  assert.equal(roundTrip.cameraFov, scene.cameraFov)
  assert.equal(isPlainGeometraThreeHostSnapshot(roundTrip), true)
  assert.equal(isPlainGeometraThreeHostSnapshot(null), false)
  const badFov = { ...roundTrip, cameraFov: 200 }
  assert.equal(isPlainGeometraThreeHostSnapshot(badFov), false)
}

function testToPlainGeometraThreeHostSnapshotHeadlessMatchesRawOne() {
  const sceneOpts = { cameraFov: 35 }
  const headless = toPlainGeometraThreeHostSnapshotHeadless(640, 360, 2, sceneOpts)
  const explicit = toPlainGeometraThreeHostSnapshot(640, 360, 1, 2, sceneOpts)
  assert.deepEqual(headless, explicit)
}

function testToPlainGeometraThreeHostSnapshotFromViewSizingMatchesMergeAndFullSnapshot() {
  const w = 800
  const h = 400
  const dpr = 2
  const cap = 1.5
  const sceneOpts = { threeBackground: '#00ff88', cameraFov: 40 }
  const sizing = toPlainGeometraThreeViewSizingState(w, h, dpr, cap)
  const merged = toPlainGeometraThreeHostSnapshotFromViewSizing(sizing, sceneOpts)
  assert.deepEqual(merged, {
    ...sizing,
    ...toPlainGeometraThreeSceneBasicsOptions(sceneOpts),
  })
  assert.deepEqual(merged, toPlainGeometraThreeHostSnapshot(w, h, dpr, cap, sceneOpts))
  const roundTrip = JSON.parse(JSON.stringify(merged))
  assert.equal(roundTrip.layoutWidth, sizing.layoutWidth)
  assert.equal(roundTrip.threeBackgroundHex, merged.threeBackgroundHex)
}

function testCreateGeometraThreeSceneBasicsFromPlainMatchesDirectCreateAndCoercion() {
  const opts = {
    threeBackground: '#00ff88',
    cameraFov: 40,
    cameraNear: 0.2,
    cameraFar: 500,
    cameraPosition: /** @type {const} */ ([1, 2, 3]),
  }
  const plain = toPlainGeometraThreeSceneBasicsOptions(opts)
  const fromPlain = createGeometraThreeSceneBasicsFromPlain(plain)
  const direct = createGeometraThreeSceneBasics(opts)
  assert.equal(fromPlain.scene.background.getHex(), direct.scene.background.getHex())
  assert.equal(fromPlain.camera.fov, direct.camera.fov)
  assert.equal(fromPlain.camera.near, direct.camera.near)
  assert.equal(fromPlain.camera.far, direct.camera.far)
  assert.deepEqual(
    [fromPlain.camera.position.x, fromPlain.camera.position.y, fromPlain.camera.position.z],
    [direct.camera.position.x, direct.camera.position.y, direct.camera.position.z],
  )

  const parsed = JSON.parse(JSON.stringify(plain))
  const fromJson = createGeometraThreeSceneBasicsFromPlain(parsed)
  assert.equal(fromJson.scene.background.getHex(), direct.scene.background.getHex())

  const d = GEOMETRA_THREE_HOST_SCENE_DEFAULTS
  const badPlain = {
    threeBackgroundHex: 0xff0000,
    cameraFov: Number.NaN,
    cameraNear: -1,
    cameraFar: 100,
    cameraPosition: /** @type {const} */ ([Number.NaN, 2, Number.POSITIVE_INFINITY]),
  }
  const fromBadPlain = createGeometraThreeSceneBasicsFromPlain(badPlain)
  const fromBadOpts = createGeometraThreeSceneBasics({
    threeBackground: badPlain.threeBackgroundHex,
    cameraFov: badPlain.cameraFov,
    cameraNear: badPlain.cameraNear,
    cameraFar: badPlain.cameraFar,
    cameraPosition: badPlain.cameraPosition,
  })
  assert.equal(fromBadPlain.camera.fov, fromBadOpts.camera.fov)
  assert.equal(fromBadPlain.camera.near, fromBadOpts.camera.near)
  assert.equal(fromBadPlain.camera.far, fromBadOpts.camera.far)
  assert.deepEqual(
    [fromBadPlain.camera.position.x, fromBadPlain.camera.position.y, fromBadPlain.camera.position.z],
    [fromBadOpts.camera.position.x, fromBadOpts.camera.position.y, fromBadOpts.camera.position.z],
  )
  assert.equal(fromBadPlain.scene.background.getHex(), 0xff0000)
  assert.equal(fromBadPlain.camera.fov, d.cameraFov)
}

function testToPlainGeometraThreeSceneBasicsOptionsMatchesResolvedAndJsonStable() {
  const plainDefault = toPlainGeometraThreeSceneBasicsOptions()
  const resolvedDefault = resolveGeometraThreeSceneBasicsOptions()
  assert.equal(
    plainDefault.threeBackgroundHex,
    new THREE.Color(resolvedDefault.threeBackground).getHex(),
  )
  assert.equal(plainDefault.cameraFov, resolvedDefault.cameraFov)
  assert.equal(plainDefault.cameraNear, resolvedDefault.cameraNear)
  assert.equal(plainDefault.cameraFar, resolvedDefault.cameraFar)
  assert.deepEqual(plainDefault.cameraPosition, resolvedDefault.cameraPosition)

  const plainStringBg = toPlainGeometraThreeSceneBasicsOptions({ threeBackground: '#ff00ff' })
  assert.equal(plainStringBg.threeBackgroundHex, 0xff00ff)
  const roundTrip = JSON.parse(JSON.stringify(plainStringBg))
  assert.equal(roundTrip.threeBackgroundHex, 0xff00ff)
  assert.deepEqual(roundTrip.cameraPosition, plainStringBg.cameraPosition)
}

function testResolveGeometraThreeSceneBasicsOptionsMatchesCoercedCreate() {
  const d = GEOMETRA_THREE_HOST_SCENE_DEFAULTS
  const opts = {
    cameraFov: Number.NaN,
    cameraNear: -1,
    cameraFar: 100,
    cameraPosition: /** @type {const} */ ([Number.NaN, 2, Number.POSITIVE_INFINITY]),
  }
  const resolved = resolveGeometraThreeSceneBasicsOptions(opts)
  const { camera } = createGeometraThreeSceneBasics(opts)
  assert.equal(resolved.cameraFov, d.cameraFov)
  assert.equal(resolved.cameraNear, d.cameraNear)
  assert.equal(resolved.cameraFar, 100)
  assert.deepEqual(resolved.cameraPosition, [d.cameraPosition[0], 2, d.cameraPosition[2]])
  assert.equal(camera.fov, resolved.cameraFov)
  assert.equal(camera.near, resolved.cameraNear)
  assert.equal(camera.far, resolved.cameraFar)
}

function testCreateGeometraThreeSceneBasicsDefaults() {
  const { scene, camera, clock } = createGeometraThreeSceneBasics()

  assert.ok(scene instanceof THREE.Scene)
  assert.ok(scene.background instanceof THREE.Color)
  assert.equal(scene.background.getHex(), 0x000000)

  assert.ok(camera instanceof THREE.PerspectiveCamera)
  assert.equal(camera.fov, 50)
  assert.equal(camera.near, 0.1)
  assert.equal(camera.far, 2000)
  assert.equal(camera.position.x, 0)
  assert.equal(camera.position.y, 0)
  assert.equal(camera.position.z, 5)

  assert.ok(clock instanceof THREE.Clock)
}

function testCreateGeometraThreeSceneBasicsCustomOptions() {
  const { scene, camera } = createGeometraThreeSceneBasics({
    threeBackground: 0xff00ff,
    cameraFov: 45,
    cameraNear: 0.5,
    cameraFar: 1000,
    cameraPosition: [1, 2, 3],
  })

  assert.equal(scene.background.getHex(), 0xff00ff)
  assert.equal(camera.fov, 45)
  assert.equal(camera.near, 0.5)
  assert.equal(camera.far, 1000)
  assert.equal(camera.position.x, 1)
  assert.equal(camera.position.y, 2)
  assert.equal(camera.position.z, 3)
}

function testCreateGeometraThreeSceneBasicsCoercesInvalidCameraOptions() {
  const d = GEOMETRA_THREE_HOST_SCENE_DEFAULTS

  const nanFov = createGeometraThreeSceneBasics({ cameraFov: Number.NaN }).camera
  assert.equal(nanFov.fov, d.cameraFov)

  const badNear = createGeometraThreeSceneBasics({ cameraNear: -1, cameraFar: 100 }).camera
  assert.equal(badNear.near, d.cameraNear)
  assert.equal(badNear.far, 100)

  const invertedClip = createGeometraThreeSceneBasics({ cameraNear: 1, cameraFar: 0.5 }).camera
  assert.equal(invertedClip.near, 1)
  assert.equal(invertedClip.far, d.cameraFar)

  const hugeNear = createGeometraThreeSceneBasics({ cameraNear: 1e10, cameraFar: 1 }).camera
  assert.equal(hugeNear.near, 1e10)
  assert.equal(hugeNear.far, 2e10)

  const badPos = createGeometraThreeSceneBasics({
    cameraPosition: [Number.NaN, 2, Number.POSITIVE_INFINITY],
  }).camera
  assert.equal(badPos.position.x, d.cameraPosition[0])
  assert.equal(badPos.position.y, 2)
  assert.equal(badPos.position.z, d.cameraPosition[2])

  for (const fov of [0, -10, 180, 360]) {
    assert.equal(createGeometraThreeSceneBasics({ cameraFov: fov }).camera.fov, d.cameraFov)
  }
}

function testDisposeGeometraThreeWebGLWithSceneBasicsCallsRendererDispose() {
  let disposed = 0
  const renderer = {
    dispose() {
      disposed += 1
    },
  }
  disposeGeometraThreeWebGLWithSceneBasics({ renderer })
  assert.equal(disposed, 1)
}

function testDisposeGeometraThreeWebGLWithSceneBasicsStopsClockWhenProvided() {
  let disposed = 0
  const renderer = {
    dispose() {
      disposed += 1
    },
  }
  const clock = new THREE.Clock()
  clock.start()
  assert.equal(clock.running, true)
  disposeGeometraThreeWebGLWithSceneBasics({ renderer, clock })
  assert.equal(disposed, 1)
  assert.equal(clock.running, false)
}

function testRenderGeometraThreeWebGLWithSceneBasicsFrameCallsRender() {
  const log = []
  const scene = {}
  const camera = {}
  const renderer = {
    render(s, c) {
      log.push(['render', s, c])
    },
  }
  renderGeometraThreeWebGLWithSceneBasicsFrame({ renderer, scene, camera })
  assert.deepEqual(log, [['render', scene, camera]])
}

function testTickGeometraThreeWebGLWithSceneBasicsFrameAdvancesClockAndRenders() {
  const log = []
  const clock = new THREE.Clock()
  const scene = {}
  const camera = {}
  const renderer = {
    render(s, c) {
      log.push(['render', s, c])
    },
  }
  const bundle = { renderer, scene, camera, clock }

  assert.equal(tickGeometraThreeWebGLWithSceneBasicsFrame(bundle), true)
  assert.deepEqual(log, [['render', scene, camera]])

  log.length = 0
  assert.equal(
    tickGeometraThreeWebGLWithSceneBasicsFrame(bundle, (ctx) => {
    assert.equal(ctx.clock, clock)
    assert.equal(ctx.renderer, renderer)
    assert.equal(ctx.scene, scene)
    assert.equal(ctx.camera, camera)
    assert.ok(Number.isFinite(ctx.delta))
    assert.ok(Number.isFinite(ctx.elapsed))
    log.push('onFrame')
    }),
    true,
  )
  assert.deepEqual(log, ['onFrame', ['render', scene, camera]])

  log.length = 0
  assert.equal(
    tickGeometraThreeWebGLWithSceneBasicsFrame(bundle, () => {
      log.push('onFrame')
      return false
    }),
    false,
  )
  assert.deepEqual(log, ['onFrame'])
}

function testTickGeometraThreeWebGLWithSceneBasicsFrameOnFrameThrowSkipsRender() {
  const clock = new THREE.Clock()
  const scene = {}
  const camera = {}
  let renderCalls = 0
  const renderer = {
    render() {
      renderCalls += 1
    },
  }
  const bundle = { renderer, scene, camera, clock }

  assert.throws(
    () =>
      tickGeometraThreeWebGLWithSceneBasicsFrame(bundle, () => {
        throw new Error('boom')
      }),
    /boom/,
  )
  assert.equal(renderCalls, 0)
}

function testResizeGeometraThreeWebGLWithSceneBasicsViewMatchesPerspectiveResize() {
  const log = []
  const renderer = {
    setPixelRatio(pr) {
      log.push(['setPixelRatio', pr])
    },
    setSize(w, h, updateStyle) {
      log.push(['setSize', w, h, updateStyle])
    },
  }
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {
      log.push(['updateProjectionMatrix'])
    },
  }
  const bundle = { renderer, camera }

  resizeGeometraThreeWebGLWithSceneBasicsView(bundle, 800, 400, 3, 2)

  assert.deepEqual(log, [
    ['setPixelRatio', 2],
    ['updateProjectionMatrix'],
    ['setSize', 800, 400, false],
  ])
  assert.equal(camera.aspect, 2)
}

function testResizeGeometraThreeWebGLWithSceneBasicsViewHeadlessMatchesRawOne() {
  const log = []
  const renderer = {
    setPixelRatio(pr) {
      log.push(['setPixelRatio', pr])
    },
    setSize(w, h, updateStyle) {
      log.push(['setSize', w, h, updateStyle])
    },
  }
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {
      log.push(['updateProjectionMatrix'])
    },
  }
  const bundle = { renderer, camera }

  resizeGeometraThreeWebGLWithSceneBasicsViewHeadless(bundle, 640, 360, 2)
  const headlessLog = [...log]

  log.length = 0
  resizeGeometraThreeWebGLWithSceneBasicsView(bundle, 640, 360, 1, 2)

  assert.deepEqual(headlessLog, log)
}

function testResizeTickGeometraThreeWebGLWithSceneBasicsHeadlessRunsResizeThenTick() {
  const log = []
  const clock = new THREE.Clock()
  const scene = {}
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {
      log.push(['updateProjectionMatrix'])
    },
  }
  const renderer = {
    setPixelRatio(pr) {
      log.push(['setPixelRatio', pr])
    },
    setSize(w, h, updateStyle) {
      log.push(['setSize', w, h, updateStyle])
    },
    render(s, c) {
      log.push(['render', s, c])
    },
  }
  const bundle = { renderer, scene, camera, clock }

  assert.equal(
    resizeTickGeometraThreeWebGLWithSceneBasicsHeadless(bundle, 640, 360, 2, () => {
      log.push('onFrame')
    }),
    true,
  )

  assert.deepEqual(log, [
    ['setPixelRatio', 1],
    ['updateProjectionMatrix'],
    ['setSize', 640, 360, false],
    'onFrame',
    ['render', scene, camera],
  ])
  assert.equal(camera.aspect, 640 / 360)

  log.length = 0
  assert.equal(
    resizeTickGeometraThreeWebGLWithSceneBasicsHeadless(bundle, 320, 240, undefined, () => false),
    false,
  )
  assert.deepEqual(log, [
    ['setPixelRatio', 1],
    ['updateProjectionMatrix'],
    ['setSize', 320, 240, false],
  ])

  log.length = 0
  assert.equal(resizeTickGeometraThreeWebGLWithSceneBasicsHeadless(bundle, 100, 200, 2), true)
  const combinedLog = [...log]
  log.length = 0
  resizeGeometraThreeWebGLWithSceneBasicsViewHeadless(bundle, 100, 200, 2)
  const resizeLog = [...log]
  log.length = 0
  assert.equal(tickGeometraThreeWebGLWithSceneBasicsFrame(bundle), true)
  const tickLog = [...log]
  assert.deepEqual(combinedLog, [...resizeLog, ...tickLog])
}

function testResizeTickGeometraThreeWebGLWithSceneBasicsParity() {
  const log = []
  const clock = new THREE.Clock()
  const scene = {}
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {
      log.push(['updateProjectionMatrix'])
    },
  }
  const renderer = {
    setPixelRatio(pr) {
      log.push(['setPixelRatio', pr])
    },
    setSize(w, h, updateStyle) {
      log.push(['setSize', w, h, updateStyle])
    },
    render(s, c) {
      log.push(['render', s, c])
    },
  }
  const bundle = { renderer, scene, camera, clock }

  assert.equal(
    resizeTickGeometraThreeWebGLWithSceneBasics(bundle, 800, 400, 2, 2, () => {
      log.push('onFrame')
    }),
    true,
  )
  assert.deepEqual(log, [
    ['setPixelRatio', 2],
    ['updateProjectionMatrix'],
    ['setSize', 800, 400, false],
    'onFrame',
    ['render', scene, camera],
  ])

  log.length = 0
  assert.equal(resizeTickGeometraThreeWebGLWithSceneBasics(bundle, 320, 240, 1, undefined, () => false), false)
  const explicitRawOne = [...log]
  log.length = 0
  assert.equal(resizeTickGeometraThreeWebGLWithSceneBasicsHeadless(bundle, 320, 240, undefined, () => false), false)
  assert.deepEqual(explicitRawOne, log)

  log.length = 0
  assert.equal(resizeTickGeometraThreeWebGLWithSceneBasics(bundle, 100, 200, 2, undefined), true)
  const combinedLog = [...log]
  log.length = 0
  resizeGeometraThreeWebGLWithSceneBasicsView(bundle, 100, 200, 2, undefined)
  const resizeLog = [...log]
  log.length = 0
  assert.equal(tickGeometraThreeWebGLWithSceneBasicsFrame(bundle), true)
  const tickLog = [...log]
  assert.deepEqual(combinedLog, [...resizeLog, ...tickLog])
}

function testToPlainGeometraSplitHostLayoutOptionsMatchesHostCoercion() {
  const d = GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS
  assert.deepEqual(toPlainGeometraSplitHostLayoutOptions(), {
    geometraWidth: d.geometraWidth,
    geometraOnLeft: false,
  })
  assert.deepEqual(
    toPlainGeometraSplitHostLayoutOptions({ geometraWidth: -1, geometraOnLeft: true }),
    { geometraWidth: d.geometraWidth, geometraOnLeft: true },
  )
  const roundTrip = JSON.parse(JSON.stringify(toPlainGeometraSplitHostLayoutOptions()))
  assert.equal(roundTrip.geometraWidth, d.geometraWidth)
  assert.equal(roundTrip.geometraOnLeft, false)
}

function testToPlainGeometraStackedHostLayoutOptionsMatchesHostCoercion() {
  const d = GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS
  assert.deepEqual(toPlainGeometraStackedHostLayoutOptions(), {
    geometraHudWidth: d.geometraHudWidth,
    geometraHudHeight: d.geometraHudHeight,
    geometraHudPlacement: d.geometraHudPlacement,
    geometraHudMargin: d.geometraHudMargin,
    geometraHudPointerEvents: 'auto',
    geometraHudZIndex: '1',
  })
  assert.deepEqual(
    toPlainGeometraStackedHostLayoutOptions({
      geometraHudWidth: Number.NaN,
      geometraHudHeight: -10,
      geometraHudPlacement: '  TOP-LEFT ',
      geometraHudMargin: Number.POSITIVE_INFINITY,
      geometraHudPointerEvents: '   ',
      geometraHudZIndex: Number.NaN,
    }),
    {
      geometraHudWidth: d.geometraHudWidth,
      geometraHudHeight: d.geometraHudHeight,
      geometraHudPlacement: 'top-left',
      geometraHudMargin: d.geometraHudMargin,
      geometraHudPointerEvents: 'auto',
      geometraHudZIndex: '1',
    },
  )
  const roundTrip = JSON.parse(JSON.stringify(toPlainGeometraStackedHostLayoutOptions()))
  assert.equal(roundTrip.geometraHudPlacement, d.geometraHudPlacement)
  assert.equal(roundTrip.geometraHudZIndex, '1')
}

function testGeometraHybridHostKindHelpers() {
  assert.deepEqual([...GEOMETRA_HYBRID_HOST_KINDS], ['split', 'stacked'])
  assert.equal(isGeometraHybridHostKind('split'), true)
  assert.equal(isGeometraHybridHostKind('stacked'), true)
  assert.equal(isGeometraHybridHostKind('Split'), false)
  assert.equal(isGeometraHybridHostKind(null), false)
  assert.equal(isGeometraHybridHostKind(undefined), false)
  const snap = toPlainGeometraThreeSplitHostSnapshot({}, 100, 100, 1)
  assert.equal(isGeometraHybridHostKind(snap.geometraHybridHostKind), true)

  const fb = 'stacked'
  assert.equal(coerceGeometraHybridHostKind('split', fb), 'split')
  assert.equal(coerceGeometraHybridHostKind('  SPLIT  ', fb), 'split')
  assert.equal(coerceGeometraHybridHostKind('STACKED', fb), 'stacked')
  assert.equal(coerceGeometraHybridHostKind(snap.geometraHybridHostKind, fb), 'split')
  assert.equal(coerceGeometraHybridHostKind('overlay', fb), fb)
  assert.equal(coerceGeometraHybridHostKind('', fb), fb)
  assert.equal(coerceGeometraHybridHostKind(null, 'split'), 'split')
  assert.equal(coerceGeometraHybridHostKind(undefined, 'split'), 'split')
}

function testToPlainGeometraThreeCompositeHostSnapshotsMatchManualMerge() {
  const layoutSplit = { geometraWidth: 400, geometraOnLeft: true }
  const mergedSplit = {
    geometraHybridHostKind: 'split',
    ...toPlainGeometraSplitHostLayoutOptions(layoutSplit),
    ...toPlainGeometraThreeHostSnapshot(800, 600, 2, undefined, { cameraFov: 45 }),
  }
  assert.deepEqual(
    toPlainGeometraThreeSplitHostSnapshot(layoutSplit, 800, 600, 2, undefined, { cameraFov: 45 }),
    mergedSplit,
  )
  const mergedSplitHeadless = {
    geometraHybridHostKind: 'split',
    ...toPlainGeometraSplitHostLayoutOptions(),
    ...toPlainGeometraThreeHostSnapshotHeadless(640, 360, 2),
  }
  assert.deepEqual(
    toPlainGeometraThreeSplitHostSnapshotHeadless({}, 640, 360, 2),
    mergedSplitHeadless,
  )

  const mergedStacked = {
    geometraHybridHostKind: 'stacked',
    ...toPlainGeometraStackedHostLayoutOptions({ geometraHudPlacement: 'top-right' }),
    ...toPlainGeometraThreeHostSnapshot(1920, 1080, 1.25),
  }
  assert.deepEqual(
    toPlainGeometraThreeStackedHostSnapshot({ geometraHudPlacement: 'top-right' }, 1920, 1080, 1.25),
    mergedStacked,
  )
  const mergedStackedHeadless = {
    geometraHybridHostKind: 'stacked',
    ...toPlainGeometraStackedHostLayoutOptions(),
    ...toPlainGeometraThreeHostSnapshotHeadless(100, 100),
  }
  assert.deepEqual(
    toPlainGeometraThreeStackedHostSnapshotHeadless({}, 100, 100),
    mergedStackedHeadless,
  )
}

function testCreateGeometraThreePerspectiveResizeHandlerHeadlessMatchesRawOne() {
  const log = []
  const renderer = {
    setPixelRatio(pr) {
      log.push(['setPixelRatio', pr])
    },
    setSize(w, h, updateStyle) {
      log.push(['setSize', w, h, updateStyle])
    },
  }
  const camera = {
    aspect: 1,
    updateProjectionMatrix() {
      log.push(['updateProjectionMatrix'])
    },
  }

  const headless = createGeometraThreePerspectiveResizeHandlerHeadless(renderer, camera, 2)
  headless(640, 360)
  const headlessLog = [...log]

  log.length = 0
  const explicit = createGeometraThreePerspectiveResizeHandler(renderer, camera, () => 1, 2)
  explicit(640, 360)

  assert.deepEqual(headlessLog, log)
  assert.equal(camera.aspect, 640 / 360)
}

testNormalizeGeometraLayoutPixels()
testGeometraHostPerspectiveAspectFromCss()
testToPlainGeometraThreeViewSizingStateMatchesHostPath()
testToPlainGeometraThreeViewSizingStateHeadlessMatchesRawOne()
testResolveHostDevicePixelRatio()
testResolveHeadlessHostDevicePixelRatio()
testCreateGeometraThreePerspectiveResizeHandlerMatchesDirectResize()
testResizeGeometraThreePerspectiveView()
testResizeGeometraThreePerspectiveViewFloorsCssAndGuardsMinSize()
testResizeGeometraThreePerspectiveViewSanitizesNonFiniteInputs()
testResizeGeometraThreePerspectiveViewNegativeCssClampsToMinLayoutPixels()
testResizeGeometraThreePerspectiveViewSanitizesNonFinitePixelRatio()
testSyncGeometraThreePerspectiveFromBuffer()
testSetWebGLDrawingBufferSize()
testResizeGeometraThreeDrawingBufferView()
testGeometraHostWebglRendererOptions()
testCreateGeometraHostWebGLRendererParams()
testGeometraThreeHostSceneDefaultsMatchBasics()
testResolveGeometraThreeSceneBasicsOptionsMatchesDefaultsAndCreate()
testToPlainGeometraThreeHostSnapshotMatchesMergedPlainHelpers()
testToPlainGeometraThreeHostSnapshotHeadlessMatchesRawOne()
testToPlainGeometraThreeHostSnapshotFromViewSizingMatchesMergeAndFullSnapshot()
testToPlainGeometraThreeSceneBasicsOptionsMatchesResolvedAndJsonStable()
testCreateGeometraThreeSceneBasicsFromPlainMatchesDirectCreateAndCoercion()
testResolveGeometraThreeSceneBasicsOptionsMatchesCoercedCreate()
testCreateGeometraThreeSceneBasicsDefaults()
testCreateGeometraThreeSceneBasicsCustomOptions()
testCreateGeometraThreeSceneBasicsCoercesInvalidCameraOptions()
testDisposeGeometraThreeWebGLWithSceneBasicsCallsRendererDispose()
testDisposeGeometraThreeWebGLWithSceneBasicsStopsClockWhenProvided()
testRenderGeometraThreeWebGLWithSceneBasicsFrameCallsRender()
testTickGeometraThreeWebGLWithSceneBasicsFrameAdvancesClockAndRenders()
testTickGeometraThreeWebGLWithSceneBasicsFrameOnFrameThrowSkipsRender()
testResizeGeometraThreeWebGLWithSceneBasicsViewMatchesPerspectiveResize()
testResizeGeometraThreeWebGLWithSceneBasicsViewHeadlessMatchesRawOne()
testResizeTickGeometraThreeWebGLWithSceneBasicsHeadlessRunsResizeThenTick()
testResizeTickGeometraThreeWebGLWithSceneBasicsParity()
testCreateGeometraThreePerspectiveResizeHandlerHeadlessMatchesRawOne()
testToPlainGeometraSplitHostLayoutOptionsMatchesHostCoercion()
testToPlainGeometraStackedHostLayoutOptionsMatchesHostCoercion()
testGeometraHybridHostKindHelpers()
testToPlainGeometraThreeCompositeHostSnapshotsMatchManualMerge()

console.log('verify-utils: ok')

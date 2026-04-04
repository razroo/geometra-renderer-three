#!/usr/bin/env node
/**
 * Post-build checks for `resolveHostDevicePixelRatio`, `resolveHeadlessHostDevicePixelRatio`,
 * `resizeGeometraThreeDrawingBufferView`,
 * `resizeGeometraThreePerspectiveView` (including non-finite / non-positive `pixelRatio` and negative CSS sizes),
 * `setWebGLDrawingBufferSize` (including non-positive `pixelRatio`),
 * `syncGeometraThreePerspectiveFromBuffer`, `createGeometraThreePerspectiveResizeHandler`,
 * `geometraHostPerspectiveAspectFromCss`,
 * `normalizeGeometraLayoutPixels`,
 * `GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS`, `GEOMETRA_THREE_HOST_SCENE_DEFAULTS`, and
 * `createGeometraHostWebGLRendererParams`, `createGeometraThreeSceneBasics`, `resolveGeometraThreeSceneBasicsOptions`
 * (including invalid camera coercion and out-of-range FOV),
 * `disposeGeometraThreeWebGLWithSceneBasics`, `renderGeometraThreeWebGLWithSceneBasicsFrame`,
 * `resizeGeometraThreeWebGLWithSceneBasicsView`
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
  normalizeGeometraLayoutPixels,
  resizeGeometraThreeDrawingBufferView,
  resizeGeometraThreePerspectiveView,
  resolveHeadlessHostDevicePixelRatio,
  resolveHostDevicePixelRatio,
  setWebGLDrawingBufferSize,
  syncGeometraThreePerspectiveFromBuffer,
  createGeometraThreeSceneBasics,
  resolveGeometraThreeSceneBasicsOptions,
  disposeGeometraThreeWebGLWithSceneBasics,
  geometraHostPerspectiveAspectFromCss,
  renderGeometraThreeWebGLWithSceneBasicsFrame,
  resizeGeometraThreeWebGLWithSceneBasicsView,
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

testNormalizeGeometraLayoutPixels()
testGeometraHostPerspectiveAspectFromCss()
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
testResolveGeometraThreeSceneBasicsOptionsMatchesCoercedCreate()
testCreateGeometraThreeSceneBasicsDefaults()
testCreateGeometraThreeSceneBasicsCustomOptions()
testCreateGeometraThreeSceneBasicsCoercesInvalidCameraOptions()
testDisposeGeometraThreeWebGLWithSceneBasicsCallsRendererDispose()
testRenderGeometraThreeWebGLWithSceneBasicsFrameCallsRender()
testResizeGeometraThreeWebGLWithSceneBasicsViewMatchesPerspectiveResize()

console.log('verify-utils: ok')

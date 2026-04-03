#!/usr/bin/env node
/**
 * Post-build checks for `resolveHostDevicePixelRatio`, `resizeGeometraThreeDrawingBufferView`,
 * `resizeGeometraThreePerspectiveView`, `setWebGLDrawingBufferSize`,
 * `syncGeometraThreePerspectiveFromBuffer`, and `createGeometraThreeSceneBasics`
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
  resizeGeometraThreeDrawingBufferView,
  resizeGeometraThreePerspectiveView,
  resolveHostDevicePixelRatio,
  setWebGLDrawingBufferSize,
  syncGeometraThreePerspectiveFromBuffer,
  createGeometraThreeSceneBasics,
} = await import(indexHref)

function testResolveHostDevicePixelRatio() {
  assert.equal(resolveHostDevicePixelRatio(2, undefined), 2)
  assert.equal(resolveHostDevicePixelRatio(3, 2), 2)
  assert.equal(resolveHostDevicePixelRatio(1.5, 2), 1.5)
  assert.equal(resolveHostDevicePixelRatio(2, 0), 2)
  assert.equal(resolveHostDevicePixelRatio(2, Number.NaN), 2)
  assert.equal(resolveHostDevicePixelRatio(Number.NaN, 2), 1)
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

testResolveHostDevicePixelRatio()
testResizeGeometraThreePerspectiveView()
testResizeGeometraThreePerspectiveViewFloorsCssAndGuardsMinSize()
testResizeGeometraThreePerspectiveViewSanitizesNonFiniteInputs()
testSyncGeometraThreePerspectiveFromBuffer()
testSetWebGLDrawingBufferSize()
testResizeGeometraThreeDrawingBufferView()
testCreateGeometraThreeSceneBasicsDefaults()
testCreateGeometraThreeSceneBasicsCustomOptions()

console.log('verify-utils: ok')

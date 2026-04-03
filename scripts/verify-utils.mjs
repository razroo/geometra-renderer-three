#!/usr/bin/env node
/**
 * Post-build checks for `resizeGeometraThreePerspectiveView`, `setWebGLDrawingBufferSize`, and
 * `createGeometraThreeSceneBasics` using lightweight mocks / Node `three` (no WebGL).
 * Run after `npm run build` (see `release:gate`).
 */
import assert from 'node:assert/strict'
import path from 'node:path'
import * as THREE from 'three'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const indexHref = pathToFileURL(path.join(root, 'dist', 'index.js')).href
const {
  resizeGeometraThreePerspectiveView,
  setWebGLDrawingBufferSize,
  createGeometraThreeSceneBasics,
} = await import(indexHref)

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

function testSetWebGLDrawingBufferSize() {
  const log = []
  const renderer = {
    setDrawingBufferSize(w, h, pr) {
      log.push(['setDrawingBufferSize', w, h, pr])
    },
  }

  setWebGLDrawingBufferSize(renderer, 100, 50, 3)
  assert.deepEqual(log, [['setDrawingBufferSize', 300, 150, 3]])

  log.length = 0
  setWebGLDrawingBufferSize(renderer, 0.2, 0.2, 2)
  assert.deepEqual(log, [['setDrawingBufferSize', 1, 1, 2]])
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

testResizeGeometraThreePerspectiveView()
testResizeGeometraThreePerspectiveViewFloorsCssAndGuardsMinSize()
testSetWebGLDrawingBufferSize()
testCreateGeometraThreeSceneBasicsDefaults()
testCreateGeometraThreeSceneBasicsCustomOptions()

console.log('verify-utils: ok')

#!/usr/bin/env node
/**
 * Post-build checks for `resizeGeometraThreePerspectiveView` and `setWebGLDrawingBufferSize`
 * using lightweight mocks (no WebGL). Run after `npm run build` (see `release:gate`).
 */
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const indexHref = pathToFileURL(path.join(root, 'dist', 'index.js')).href
const { resizeGeometraThreePerspectiveView, setWebGLDrawingBufferSize } = await import(indexHref)

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

testResizeGeometraThreePerspectiveView()
testResizeGeometraThreePerspectiveViewFloorsCssAndGuardsMinSize()
testSetWebGLDrawingBufferSize()

console.log('verify-utils: ok')

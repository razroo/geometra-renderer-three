#!/usr/bin/env node
/**
 * Post-build checks for `createGeometraHostLayoutSyncRaf` (split/stacked resize coalescing).
 * Imports `dist/layout-sync.js` (not a public export). Run after `npm run build`.
 */
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const layoutHref = pathToFileURL(path.join(root, 'dist', 'layout-sync.js')).href
const { createGeometraHostLayoutSyncRaf } = await import(layoutHref)

function createMockWindow() {
  let rafCallback = null
  let nextId = 0
  return {
    requestAnimationFrame(fn) {
      rafCallback = fn
      return ++nextId
    },
    cancelAnimationFrame() {
      rafCallback = null
    },
    flushAnimationFrame() {
      const fn = rafCallback
      rafCallback = null
      if (fn) fn()
    },
  }
}

function testCoalescesRafAndNotify() {
  const win = createMockWindow()
  let syncCount = 0
  let dispatchCount = 0
  const layoutSync = createGeometraHostLayoutSyncRaf(win, {
    isDestroyed: () => false,
    syncLayout: () => {
      syncCount += 1
    },
    dispatchGeometraResize: () => {
      dispatchCount += 1
    },
  })

  layoutSync.schedule(true)
  layoutSync.schedule(true)
  assert.equal(syncCount, 0)
  win.flushAnimationFrame()
  assert.equal(syncCount, 1)
  assert.equal(dispatchCount, 1)
}

function testCancelClearsPendingGeometraNotify() {
  const win = createMockWindow()
  let syncCount = 0
  let dispatchCount = 0
  const layoutSync = createGeometraHostLayoutSyncRaf(win, {
    isDestroyed: () => false,
    syncLayout: () => {
      syncCount += 1
    },
    dispatchGeometraResize: () => {
      dispatchCount += 1
    },
  })

  layoutSync.schedule(true)
  layoutSync.cancel()
  layoutSync.schedule(false)
  win.flushAnimationFrame()
  assert.equal(syncCount, 1)
  assert.equal(dispatchCount, 0)
}

function testDestroyedSkipsWorkInRaf() {
  const win = createMockWindow()
  let syncCount = 0
  let destroyed = false
  const layoutSync = createGeometraHostLayoutSyncRaf(win, {
    isDestroyed: () => destroyed,
    syncLayout: () => {
      syncCount += 1
    },
    dispatchGeometraResize: () => {
      assert.fail('dispatch should not run')
    },
  })

  layoutSync.schedule(false)
  destroyed = true
  win.flushAnimationFrame()
  assert.equal(syncCount, 0)
}

testCoalescesRafAndNotify()
testCancelClearsPendingGeometraNotify()
testDestroyedSkipsWorkInRaf()

console.log('verify-layout-sync: ok')

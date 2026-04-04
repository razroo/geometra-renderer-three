#!/usr/bin/env node
/**
 * Post-build checks for `createGeometraHostLayoutSyncRaf` (split/stacked resize coalescing):
 * rAF coalescing, optional synthetic Geometra `resize`, cancel/destroy semantics
 * (including cancel before the scheduled frame runs — no `syncLayout` / dispatch),
 * skip dispatch when `isDestroyed()` becomes true after `syncLayout`, and retain pending notify
 * when `syncLayout` throws so a later coalesced frame can still dispatch (including recovery via
 * `schedule(true)` alone after the throw, with no `schedule(false)`). Same pending-notify retention
 * when `dispatchGeometraResize` throws (clear only after a successful dispatch), including recovery
 * via `schedule(true)` alone after a dispatch throw (parity with syncLayout-throw recovery).
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

/** Real window resize path: coalesce Three resize without synthetic Geometra `resize`. */
function testCoalescesRafWithoutNotify() {
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

  layoutSync.schedule(false)
  layoutSync.schedule(false)
  assert.equal(syncCount, 0)
  win.flushAnimationFrame()
  assert.equal(syncCount, 1)
  assert.equal(dispatchCount, 0)
}

/** Observer + window in one frame: any `true` in the burst still yields a single dispatch. */
function testMixedNotifyCoalescesToSingleDispatch() {
  const win = createMockWindow()
  let dispatchCount = 0
  const layoutSync = createGeometraHostLayoutSyncRaf(win, {
    isDestroyed: () => false,
    syncLayout: () => {},
    dispatchGeometraResize: () => {
      dispatchCount += 1
    },
  })

  layoutSync.schedule(false)
  layoutSync.schedule(true)
  win.flushAnimationFrame()
  assert.equal(dispatchCount, 1)
}

/** Host teardown can cancel a pending coalesced frame before it runs (no Three resize, no synthetic `resize`). */
function testCancelBeforeFlushSkipsSync() {
  const win = createMockWindow()
  let syncCount = 0
  const layoutSync = createGeometraHostLayoutSyncRaf(win, {
    isDestroyed: () => false,
    syncLayout: () => {
      syncCount += 1
    },
    dispatchGeometraResize: () => {
      assert.fail('dispatch should not run')
    },
  })

  layoutSync.schedule(false)
  layoutSync.cancel()
  win.flushAnimationFrame()
  assert.equal(syncCount, 0)
}

/** Same cancel-before-flush idea when a Geometra notify was requested — cancel clears pending notify too. */
function testCancelBeforeFlushSkipsSyncWithPendingNotify() {
  const win = createMockWindow()
  let syncCount = 0
  const layoutSync = createGeometraHostLayoutSyncRaf(win, {
    isDestroyed: () => false,
    syncLayout: () => {
      syncCount += 1
    },
    dispatchGeometraResize: () => {
      assert.fail('dispatch should not run')
    },
  })

  layoutSync.schedule(true)
  layoutSync.cancel()
  win.flushAnimationFrame()
  assert.equal(syncCount, 0)
}

/** After cancel, a new scheduled frame with notify can still dispatch (pending flag was cleared). */
function testNotifyAfterCancel() {
  const win = createMockWindow()
  let dispatchCount = 0
  const layoutSync = createGeometraHostLayoutSyncRaf(win, {
    isDestroyed: () => false,
    syncLayout: () => {},
    dispatchGeometraResize: () => {
      dispatchCount += 1
    },
  })

  layoutSync.schedule(true)
  layoutSync.cancel()
  layoutSync.schedule(true)
  win.flushAnimationFrame()
  assert.equal(dispatchCount, 1)
}

testCoalescesRafAndNotify()
testCancelClearsPendingGeometraNotify()
testDestroyedSkipsWorkInRaf()
testCoalescesRafWithoutNotify()
testMixedNotifyCoalescesToSingleDispatch()
testCancelBeforeFlushSkipsSync()
testCancelBeforeFlushSkipsSyncWithPendingNotify()
testNotifyAfterCancel()

/** If teardown happens during `syncLayout`, do not fire synthetic Geometra `resize`. */
function testDestroyedAfterSyncLayoutSkipsDispatch() {
  const win = createMockWindow()
  let dispatchCount = 0
  let destroyed = false
  const layoutSync = createGeometraHostLayoutSyncRaf(win, {
    isDestroyed: () => destroyed,
    syncLayout: () => {
      destroyed = true
    },
    dispatchGeometraResize: () => {
      dispatchCount += 1
    },
  })

  layoutSync.schedule(true)
  win.flushAnimationFrame()
  assert.equal(dispatchCount, 0)
}

/**
 * When `syncLayout` throws, pending notify is not cleared; a later coalesced frame can still
 * dispatch once sync succeeds.
 */
function testSyncLayoutThrowKeepsPendingNotifyForNextFrame() {
  const win = createMockWindow()
  let syncAttempts = 0
  let dispatchCount = 0
  const layoutSync = createGeometraHostLayoutSyncRaf(win, {
    isDestroyed: () => false,
    syncLayout: () => {
      syncAttempts += 1
      if (syncAttempts === 1) throw new Error('boom')
    },
    dispatchGeometraResize: () => {
      dispatchCount += 1
    },
  })

  layoutSync.schedule(true)
  assert.throws(() => win.flushAnimationFrame(), /boom/)
  layoutSync.schedule(false)
  win.flushAnimationFrame()
  assert.equal(syncAttempts, 2)
  assert.equal(dispatchCount, 1)
}

testDestroyedAfterSyncLayoutSkipsDispatch()
testSyncLayoutThrowKeepsPendingNotifyForNextFrame()

/**
 * After a throwing `syncLayout`, `pendingGeometraResizeNotify` stays set but no rAF is pending.
 * A follow-up `schedule(true)` alone must re-arm the coalescer so the next flush can sync and dispatch once.
 */
function testSyncLayoutThrowRecoverWithNotifyScheduleOnly() {
  const win = createMockWindow()
  let syncAttempts = 0
  let dispatchCount = 0
  const layoutSync = createGeometraHostLayoutSyncRaf(win, {
    isDestroyed: () => false,
    syncLayout: () => {
      syncAttempts += 1
      if (syncAttempts === 1) throw new Error('boom')
    },
    dispatchGeometraResize: () => {
      dispatchCount += 1
    },
  })

  layoutSync.schedule(true)
  assert.throws(() => win.flushAnimationFrame(), /boom/)
  layoutSync.schedule(true)
  win.flushAnimationFrame()
  assert.equal(syncAttempts, 2)
  assert.equal(dispatchCount, 1)
}

testSyncLayoutThrowRecoverWithNotifyScheduleOnly()

/**
 * When `dispatchGeometraResize` throws, pending notify must stay set (same idea as `syncLayout`
 * throw) so a later coalesced frame can dispatch again after layout sync runs.
 */
function testDispatchThrowKeepsPendingNotifyForNextFrame() {
  const win = createMockWindow()
  let dispatchAttempts = 0
  let dispatchCount = 0
  const layoutSync = createGeometraHostLayoutSyncRaf(win, {
    isDestroyed: () => false,
    syncLayout: () => {},
    dispatchGeometraResize: () => {
      dispatchAttempts += 1
      if (dispatchAttempts === 1) throw new Error('dispatch boom')
      dispatchCount += 1
    },
  })

  layoutSync.schedule(true)
  assert.throws(() => win.flushAnimationFrame(), /dispatch boom/)
  layoutSync.schedule(false)
  win.flushAnimationFrame()
  assert.equal(dispatchAttempts, 2)
  assert.equal(dispatchCount, 1)
}

testDispatchThrowKeepsPendingNotifyForNextFrame()

/**
 * After a throwing `dispatchGeometraResize`, pending notify stays set and no rAF is pending.
 * A follow-up `schedule(true)` alone must re-arm the coalescer (same recovery shape as
 * `testSyncLayoutThrowRecoverWithNotifyScheduleOnly`).
 */
function testDispatchThrowRecoverWithNotifyScheduleOnly() {
  const win = createMockWindow()
  let dispatchAttempts = 0
  let dispatchCount = 0
  const layoutSync = createGeometraHostLayoutSyncRaf(win, {
    isDestroyed: () => false,
    syncLayout: () => {},
    dispatchGeometraResize: () => {
      dispatchAttempts += 1
      if (dispatchAttempts === 1) throw new Error('dispatch boom')
      dispatchCount += 1
    },
  })

  layoutSync.schedule(true)
  assert.throws(() => win.flushAnimationFrame(), /dispatch boom/)
  layoutSync.schedule(true)
  win.flushAnimationFrame()
  assert.equal(dispatchAttempts, 2)
  assert.equal(dispatchCount, 1)
}

testDispatchThrowRecoverWithNotifyScheduleOnly()

console.log('verify-layout-sync: ok')

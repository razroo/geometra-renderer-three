#!/usr/bin/env node
/**
 * Post-build checks for `dist/host-layout-plain.js`: split/stacked plain layout helpers,
 * stacked HUD rect (`toPlainGeometraStackedHudRect`), composite snapshots (`geometraHybridHostKind`),
 * `GEOMETRA_HYBRID_HOST_KINDS`, `isGeometraHybridHostKind`, `isPlainGeometraHybridHostKind`, `coerceGeometraHybridHostKind`,
 * `isPlainGeometraSplitHostLayoutOptions`, `isPlainGeometraStackedHostLayoutOptions` (layout-only JSON;
 *   stacked placement exact literals like composite guard), `isPlainGeometraThreeSplitHostSnapshot`, `isPlainGeometraThreeStackedHostSnapshot` (split column and HUD
 *   width/height/margin finite and ≥ 0, matching `coerceHostNonNegativeCssPx`; `geometraHybridHostKind` trim +
 *   case-insensitive like `coerceGeometraHybridHostKind`), and
 * `isPlainGeometraThreeHostSnapshot` (from `dist/three-scene-basics.js`).
 * Imports the compiled module directly (not only via `dist/index.js`). Run after `npm run build`.
 */
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const layoutPlainHref = pathToFileURL(path.join(root, 'dist', 'host-layout-plain.js')).href
const threeSceneBasicsHref = pathToFileURL(path.join(root, 'dist', 'three-scene-basics.js')).href
const splitHostHref = pathToFileURL(path.join(root, 'dist', 'split-host.js')).href
const stackedHostHref = pathToFileURL(path.join(root, 'dist', 'stacked-host.js')).href

const {
  GEOMETRA_HYBRID_HOST_KINDS,
  coerceGeometraHybridHostKind,
  isGeometraHybridHostKind,
  isPlainGeometraHybridHostKind,
  isPlainGeometraSplitHostLayoutOptions,
  isPlainGeometraStackedHostLayoutOptions,
  isPlainGeometraThreeSplitHostSnapshot,
  isPlainGeometraThreeStackedHostSnapshot,
  toPlainGeometraSplitHostLayoutOptions,
  toPlainGeometraStackedHostLayoutOptions,
  toPlainGeometraThreeSplitHostSnapshot,
  toPlainGeometraThreeSplitHostSnapshotHeadless,
  toPlainGeometraThreeStackedHostSnapshot,
  toPlainGeometraThreeStackedHostSnapshotHeadless,
  toPlainGeometraStackedHudRect,
} = await import(layoutPlainHref)

const { isPlainGeometraThreeHostSnapshot, toPlainGeometraThreeHostSnapshot } = await import(
  threeSceneBasicsHref,
)

const { GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS } = await import(splitHostHref)
const { GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS } = await import(stackedHostHref)

function testHybridHostKindHelpers() {
  assert.deepEqual([...GEOMETRA_HYBRID_HOST_KINDS], ['split', 'stacked'])
  assert.equal(isGeometraHybridHostKind('split'), true)
  assert.equal(isGeometraHybridHostKind('stacked'), true)
  assert.equal(isGeometraHybridHostKind('SPLIT'), false)
  assert.equal(isGeometraHybridHostKind(null), false)
  assert.equal(isPlainGeometraHybridHostKind('split'), true)
  assert.equal(isPlainGeometraHybridHostKind('  StAcKeD  '), true)
  assert.equal(isPlainGeometraHybridHostKind('SPLIT'), true)
  assert.equal(isPlainGeometraHybridHostKind('unknown'), false)
  assert.equal(isPlainGeometraHybridHostKind(''), false)
  assert.equal(coerceGeometraHybridHostKind('  StAcKeD  ', 'split'), 'stacked')
  assert.equal(coerceGeometraHybridHostKind('unknown', 'split'), 'split')
  assert.equal(coerceGeometraHybridHostKind('', 'stacked'), 'stacked')
  assert.equal(coerceGeometraHybridHostKind('   ', 'split'), 'split')
  assert.equal(coerceGeometraHybridHostKind('split', 'stacked'), 'split')
}

function testSplitPlainLayoutMatchesDefaults() {
  const plain = toPlainGeometraSplitHostLayoutOptions()
  assert.deepEqual(plain, {
    geometraWidth: GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS.geometraWidth,
    geometraOnLeft: false,
  })
}

function testStackedPlainLayoutMatchesDefaults() {
  const d = GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS
  const plain = toPlainGeometraStackedHostLayoutOptions()
  assert.deepEqual(plain, {
    geometraHudWidth: d.geometraHudWidth,
    geometraHudHeight: d.geometraHudHeight,
    geometraHudPlacement: d.geometraHudPlacement,
    geometraHudMargin: d.geometraHudMargin,
    geometraHudPointerEvents: 'auto',
    geometraHudZIndex: '1',
  })
}

function testCompositeSnapshotsKindAndLayout() {
  const split = toPlainGeometraThreeSplitHostSnapshot({}, 100, 80, 2)
  assert.equal(split.geometraHybridHostKind, 'split')
  assert.equal(split.geometraWidth, GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS.geometraWidth)
  assert.equal(split.layoutWidth, 100)
  assert.equal(split.sanitizedRawDevicePixelRatio, 2)

  const splitH = toPlainGeometraThreeSplitHostSnapshotHeadless({}, 64, 48, 1.5)
  assert.equal(splitH.geometraHybridHostKind, 'split')
  assert.equal(splitH.sanitizedRawDevicePixelRatio, 1)

  const stacked = toPlainGeometraThreeStackedHostSnapshot({}, 200, 150, 1)
  assert.equal(stacked.geometraHybridHostKind, 'stacked')
  assert.equal(stacked.geometraHudWidth, GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS.geometraHudWidth)

  const stackedH = toPlainGeometraThreeStackedHostSnapshotHeadless({}, 320, 240)
  assert.equal(stackedH.geometraHybridHostKind, 'stacked')
  assert.equal(stackedH.sanitizedRawDevicePixelRatio, 1)
}

testHybridHostKindHelpers()
testSplitPlainLayoutMatchesDefaults()
testStackedPlainLayoutMatchesDefaults()
testCompositeSnapshotsKindAndLayout()

function testPlainLayoutOnlyGuards() {
  const splitPlain = toPlainGeometraSplitHostLayoutOptions()
  assert.equal(isPlainGeometraSplitHostLayoutOptions(splitPlain), true)
  assert.equal(isPlainGeometraSplitHostLayoutOptions(toPlainGeometraThreeSplitHostSnapshot({}, 10, 10, 1)), true)

  const stackedPlain = toPlainGeometraStackedHostLayoutOptions()
  assert.equal(isPlainGeometraStackedHostLayoutOptions(stackedPlain), true)
  assert.equal(
    isPlainGeometraStackedHostLayoutOptions(toPlainGeometraThreeStackedHostSnapshot({}, 10, 10, 1)),
    true,
  )

  assert.equal(isPlainGeometraSplitHostLayoutOptions(null), false)
  assert.equal(isPlainGeometraSplitHostLayoutOptions({ geometraWidth: 1 }), false)
  assert.equal(isPlainGeometraSplitHostLayoutOptions({ geometraWidth: -1, geometraOnLeft: false }), false)
  assert.equal(isPlainGeometraSplitHostLayoutOptions({ geometraWidth: 1, geometraOnLeft: 'no' }), false)

  assert.equal(isPlainGeometraStackedHostLayoutOptions(null), false)
  assert.equal(
    isPlainGeometraStackedHostLayoutOptions({
      ...stackedPlain,
      geometraHudPlacement: 'Bottom-Right',
    }),
    false,
  )
}

testPlainLayoutOnlyGuards()

function testStackedHudRectMatchesHostPlacement() {
  const layout = toPlainGeometraStackedHostLayoutOptions()
  assert.deepEqual(toPlainGeometraStackedHudRect(layout, 800, 600), {
    left: 800 - layout.geometraHudWidth - layout.geometraHudMargin,
    top: 600 - layout.geometraHudHeight - layout.geometraHudMargin,
    width: layout.geometraHudWidth,
    height: layout.geometraHudHeight,
  })
  const bl = toPlainGeometraStackedHostLayoutOptions({ geometraHudPlacement: 'bottom-left' })
  assert.deepEqual(toPlainGeometraStackedHudRect(bl, 800, 600), {
    left: bl.geometraHudMargin,
    top: 600 - bl.geometraHudHeight - bl.geometraHudMargin,
    width: bl.geometraHudWidth,
    height: bl.geometraHudHeight,
  })
  const tr = toPlainGeometraStackedHostLayoutOptions({ geometraHudPlacement: 'top-right' })
  assert.deepEqual(toPlainGeometraStackedHudRect(tr, 800, 600), {
    left: 800 - tr.geometraHudWidth - tr.geometraHudMargin,
    top: tr.geometraHudMargin,
    width: tr.geometraHudWidth,
    height: tr.geometraHudHeight,
  })
  const tl = toPlainGeometraStackedHostLayoutOptions({ geometraHudPlacement: 'top-left' })
  assert.deepEqual(toPlainGeometraStackedHudRect(tl, 800, 600), {
    left: tl.geometraHudMargin,
    top: tl.geometraHudMargin,
    width: tl.geometraHudWidth,
    height: tl.geometraHudHeight,
  })
  const fromSnapshot = toPlainGeometraThreeStackedHostSnapshot({}, 800, 600, 1)
  assert.deepEqual(
    toPlainGeometraStackedHudRect(fromSnapshot, 800, 600),
    toPlainGeometraStackedHudRect(layout, 800, 600),
  )
}

testStackedHudRectMatchesHostPlacement()

function testCompositeSnapshotTypeGuards() {
  const split = toPlainGeometraThreeSplitHostSnapshot({}, 100, 80, 2)
  assert.equal(isPlainGeometraThreeHostSnapshot(split), true)
  assert.equal(isPlainGeometraThreeSplitHostSnapshot(split), true)
  assert.equal(isPlainGeometraThreeStackedHostSnapshot(split), false)

  const splitH = toPlainGeometraThreeSplitHostSnapshotHeadless({}, 64, 48)
  assert.equal(isPlainGeometraThreeSplitHostSnapshot(splitH), true)

  const stacked = toPlainGeometraThreeStackedHostSnapshot({}, 200, 150, 1)
  assert.equal(isPlainGeometraThreeHostSnapshot(stacked), true)
  assert.equal(isPlainGeometraThreeStackedHostSnapshot(stacked), true)
  assert.equal(isPlainGeometraThreeSplitHostSnapshot(stacked), false)

  const stackedH = toPlainGeometraThreeStackedHostSnapshotHeadless({}, 320, 240)
  assert.equal(isPlainGeometraThreeStackedHostSnapshot(stackedH), true)

  const stackedFlush = toPlainGeometraThreeStackedHostSnapshot({ geometraHudMargin: 0 }, 200, 150, 1)
  assert.equal(stackedFlush.geometraHudMargin, 0)
  assert.equal(isPlainGeometraThreeStackedHostSnapshot(stackedFlush), true)

  const splitZeroCol = toPlainGeometraThreeSplitHostSnapshot({ geometraWidth: 0 }, 100, 80, 1)
  assert.equal(splitZeroCol.geometraWidth, 0)
  assert.equal(isPlainGeometraThreeSplitHostSnapshot(splitZeroCol), true)

  assert.equal(isPlainGeometraThreeStackedHostSnapshot({ ...stacked, geometraHudMargin: -1 }), false)
  assert.equal(isPlainGeometraThreeSplitHostSnapshot({ ...split, geometraWidth: -1 }), false)

  assert.equal(isPlainGeometraThreeSplitHostSnapshot(null), false)
  assert.equal(isPlainGeometraThreeStackedHostSnapshot(undefined), false)
  assert.equal(isPlainGeometraThreeSplitHostSnapshot({ geometraHybridHostKind: 'split' }), false)

  const baseOnly = toPlainGeometraThreeHostSnapshot(120, 90, 1)
  assert.equal(isPlainGeometraThreeHostSnapshot(baseOnly), true)
  assert.equal(isPlainGeometraThreeSplitHostSnapshot(baseOnly), false)

  const tampered = { ...split }
  delete tampered.layoutWidth
  assert.equal(isPlainGeometraThreeSplitHostSnapshot(tampered), false)

  const wrongKind = { ...split, geometraHybridHostKind: 'stacked' }
  assert.equal(isPlainGeometraThreeSplitHostSnapshot(wrongKind), false)

  const splitLooseKind = { ...split, geometraHybridHostKind: '  SpLiT  ' }
  assert.equal(isPlainGeometraThreeSplitHostSnapshot(splitLooseKind), true)

  const stackedLooseKind = { ...stacked, geometraHybridHostKind: 'STACKED' }
  assert.equal(isPlainGeometraThreeStackedHostSnapshot(stackedLooseKind), true)
}

testCompositeSnapshotTypeGuards()

console.log('verify-host-layout-plain: ok')

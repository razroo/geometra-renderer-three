#!/usr/bin/env node
/**
 * Post-build checks for `dist/host-layout-plain.js`: split/stacked plain layout helpers,
 * composite snapshots (`geometraHybridHostKind`), `GEOMETRA_HYBRID_HOST_KINDS`,
 * `isGeometraHybridHostKind`, and `coerceGeometraHybridHostKind`.
 * Imports the compiled module directly (not only via `dist/index.js`). Run after `npm run build`.
 */
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const layoutPlainHref = pathToFileURL(path.join(root, 'dist', 'host-layout-plain.js')).href
const splitHostHref = pathToFileURL(path.join(root, 'dist', 'split-host.js')).href
const stackedHostHref = pathToFileURL(path.join(root, 'dist', 'stacked-host.js')).href

const {
  GEOMETRA_HYBRID_HOST_KINDS,
  coerceGeometraHybridHostKind,
  isGeometraHybridHostKind,
  toPlainGeometraSplitHostLayoutOptions,
  toPlainGeometraStackedHostLayoutOptions,
  toPlainGeometraThreeSplitHostSnapshot,
  toPlainGeometraThreeSplitHostSnapshotHeadless,
  toPlainGeometraThreeStackedHostSnapshot,
  toPlainGeometraThreeStackedHostSnapshotHeadless,
} = await import(layoutPlainHref)

const { GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS } = await import(splitHostHref)
const { GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS } = await import(stackedHostHref)

function testHybridHostKindHelpers() {
  assert.deepEqual([...GEOMETRA_HYBRID_HOST_KINDS], ['split', 'stacked'])
  assert.equal(isGeometraHybridHostKind('split'), true)
  assert.equal(isGeometraHybridHostKind('stacked'), true)
  assert.equal(isGeometraHybridHostKind('SPLIT'), false)
  assert.equal(isGeometraHybridHostKind(null), false)
  assert.equal(coerceGeometraHybridHostKind('  StAcKeD  ', 'split'), 'stacked')
  assert.equal(coerceGeometraHybridHostKind('unknown', 'split'), 'split')
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

console.log('verify-host-layout-plain: ok')

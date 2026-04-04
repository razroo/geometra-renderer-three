#!/usr/bin/env node
/**
 * Post-build checks for `coerceHostNonNegativeCssPx` (split/stacked panel and HUD widths),
 * `coerceHostStackingZIndexCss` (stacked HUD `z-index`), `coerceGeometraHudPointerEvents` (HUD `pointer-events`),
 * and `coerceGeometraHudPlacement` (HUD corner).
 * Imports `dist/host-css-coerce.js` (not a public export). Run after `npm run build`.
 */
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const href = pathToFileURL(path.join(root, 'dist', 'host-css-coerce.js')).href
const {
  coerceGeometraHudPlacement,
  coerceGeometraHudPointerEvents,
  coerceHostNonNegativeCssPx,
  coerceHostStackingZIndexCss,
} = await import(href)

function testFiniteNonNegativePassesThrough() {
  assert.equal(coerceHostNonNegativeCssPx(420, 999), 420)
  assert.equal(coerceHostNonNegativeCssPx(0, 999), 0)
  assert.equal(coerceHostNonNegativeCssPx(12.5, 999), 12.5)
}

function testInvalidUsesFallback() {
  assert.equal(coerceHostNonNegativeCssPx(-1, 420), 420)
  assert.equal(coerceHostNonNegativeCssPx(Number.NaN, 420), 420)
  assert.equal(coerceHostNonNegativeCssPx(Number.POSITIVE_INFINITY, 420), 420)
  assert.equal(coerceHostNonNegativeCssPx(Number.NEGATIVE_INFINITY, 420), 420)
  // Non-number (defensive if called from untyped JS).
  assert.equal(coerceHostNonNegativeCssPx('wide', 420), 420)
}

function testCoerceGeometraHudPlacement() {
  const fb = 'top-left'
  assert.equal(coerceGeometraHudPlacement('bottom-right', fb), 'bottom-right')
  assert.equal(coerceGeometraHudPlacement(undefined, fb), fb)
  assert.equal(coerceGeometraHudPlacement('center', fb), fb)
  assert.equal(coerceGeometraHudPlacement('', fb), fb)
}

function testCoerceGeometraHudPointerEvents() {
  assert.equal(coerceGeometraHudPointerEvents('none', 'auto'), 'none')
  assert.equal(coerceGeometraHudPointerEvents('  none  ', 'auto'), 'none')
  assert.equal(coerceGeometraHudPointerEvents('', 'auto'), 'auto')
  assert.equal(coerceGeometraHudPointerEvents('   ', 'auto'), 'auto')
  assert.equal(coerceGeometraHudPointerEvents(undefined, 'auto'), 'auto')
  assert.equal(coerceGeometraHudPointerEvents(null, 'auto'), 'auto')
  assert.equal(coerceGeometraHudPointerEvents(undefined, 'none'), 'none')
}

function testStackingZIndexCss() {
  assert.equal(coerceHostStackingZIndexCss(1, 99), '1')
  assert.equal(coerceHostStackingZIndexCss(0, 99), '0')
  assert.equal(coerceHostStackingZIndexCss(-2, 99), '-2')
  assert.equal(coerceHostStackingZIndexCss(' 12 ', 99), '12')
  assert.equal(coerceHostStackingZIndexCss('auto', 99), 'auto')
  assert.equal(coerceHostStackingZIndexCss(Number.NaN, 7), '7')
  assert.equal(coerceHostStackingZIndexCss(Number.POSITIVE_INFINITY, 7), '7')
  assert.equal(coerceHostStackingZIndexCss('', 7), '7')
  assert.equal(coerceHostStackingZIndexCss('   ', 7), '7')
  assert.equal(coerceHostStackingZIndexCss(null, 7), '7')
}

testFiniteNonNegativePassesThrough()
testInvalidUsesFallback()
testCoerceGeometraHudPlacement()
testCoerceGeometraHudPointerEvents()
testStackingZIndexCss()

console.log('verify-host-css-coerce: ok')

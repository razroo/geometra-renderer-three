#!/usr/bin/env node
/**
 * Post-build checks for `coerceHostNonNegativeCssPx` (split/stacked panel and HUD widths).
 * Imports `dist/host-css-coerce.js` (not a public export). Run after `npm run build`.
 */
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const href = pathToFileURL(path.join(root, 'dist', 'host-css-coerce.js')).href
const { coerceHostNonNegativeCssPx } = await import(href)

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

testFiniteNonNegativePassesThrough()
testInvalidUsesFallback()

console.log('verify-host-css-coerce: ok')

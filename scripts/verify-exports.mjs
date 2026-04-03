#!/usr/bin/env node
/**
 * Post-build smoke check: ensure the published ESM entry exports the expected public API.
 * Run after `npm run build` (see `release:gate`). Keeps tooling minimal vs a full test runner.
 */
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const indexHref = pathToFileURL(path.join(root, 'dist', 'index.js')).href
const mod = await import(indexHref)

const expectedFunctions = [
  'createThreeGeometraSplitHost',
  'createThreeGeometraStackedHost',
  'createGeometraThreeSceneBasics',
  'resizeGeometraThreeDrawingBufferView',
  'resizeGeometraThreePerspectiveView',
  'resolveHostDevicePixelRatio',
  'setWebGLDrawingBufferSize',
  'syncGeometraThreePerspectiveFromBuffer',
]
const missingFns = expectedFunctions.filter((name) => typeof mod[name] !== 'function')
if (missingFns.length) {
  console.error('verify-exports: missing or non-function exports:', missingFns.join(', '))
  process.exit(1)
}

const expectedStrings = ['GEOM_DATA_CHANNEL_TRACKER_SNAPSHOT']
const missingStr = expectedStrings.filter((name) => typeof mod[name] !== 'string')
if (missingStr.length) {
  console.error('verify-exports: missing string exports:', missingStr.join(', '))
  process.exit(1)
}

const expected = [...expectedFunctions, ...expectedStrings]
const extra = Object.keys(mod).filter((k) => !expected.includes(k))
if (extra.length) {
  console.error('verify-exports: unexpected extra exports:', extra.join(', '))
  process.exit(1)
}

console.log('verify-exports: ok')

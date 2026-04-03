import type { PerspectiveCamera, WebGLRenderer } from 'three'

/**
 * Device pixel ratio for split/stacked hosts and custom renderers: full raw ratio, optionally capped.
 * Use with {@link resizeGeometraThreePerspectiveView} or {@link setWebGLDrawingBufferSize} so headless
 * or offscreen setups match the same `maxDevicePixelRatio` behavior as {@link createThreeGeometraSplitHost}
 * and {@link createThreeGeometraStackedHost}.
 */
export function resolveHostDevicePixelRatio(
  rawDevicePixelRatio: number,
  maxDevicePixelRatio?: number,
): number {
  const raw = rawDevicePixelRatio > 0 && Number.isFinite(rawDevicePixelRatio) ? rawDevicePixelRatio : 1
  if (
    maxDevicePixelRatio === undefined ||
    !Number.isFinite(maxDevicePixelRatio) ||
    maxDevicePixelRatio <= 0
  ) {
    return raw
  }
  return Math.min(raw, maxDevicePixelRatio)
}

/**
 * Resize drawing buffer to match CSS pixel size × device pixel ratio.
 * Use when you manage your own canvas layout (no `renderer.setSize`).
 */
export function setWebGLDrawingBufferSize(
  renderer: WebGLRenderer,
  cssWidth: number,
  cssHeight: number,
  pixelRatio?: number,
): void {
  const pr = pixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
  const w = Math.max(1, Math.floor(cssWidth * pr))
  const h = Math.max(1, Math.floor(cssHeight * pr))
  renderer.setDrawingBufferSize(w, h, pr)
}

/**
 * Apply the same CSS-size → aspect ratio → WebGL buffer sizing path as
 * {@link createThreeGeometraSplitHost} and {@link createThreeGeometraStackedHost}.
 *
 * Use with {@link createGeometraThreeSceneBasics} when you own the `WebGLRenderer` (headless GL,
 * offscreen canvas, tests) but want buffer dimensions and projection to stay aligned with those hosts.
 */
export function resizeGeometraThreePerspectiveView(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  cssWidth: number,
  cssHeight: number,
  pixelRatio: number,
): void {
  renderer.setPixelRatio(pixelRatio)
  const w = Math.max(1, Math.floor(cssWidth))
  const h = Math.max(1, Math.floor(cssHeight))
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h, false)
}

/**
 * Update perspective projection from **drawing-buffer** pixel dimensions (physical pixels), not CSS size.
 *
 * Use when you size WebGL with {@link setWebGLDrawingBufferSize} or `renderer.setDrawingBufferSize` directly
 * (headless GL, offscreen canvas, tests) and still want the same aspect handling as
 * {@link resizeGeometraThreePerspectiveView}. Does not touch the renderer — only the camera.
 */
export function syncGeometraThreePerspectiveFromBuffer(
  camera: PerspectiveCamera,
  drawingBufferWidth: number,
  drawingBufferHeight: number,
): void {
  const w = Math.max(1, Math.floor(drawingBufferWidth))
  const h = Math.max(1, Math.floor(drawingBufferHeight))
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

import type { PerspectiveCamera, WebGLRenderer } from 'three'

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

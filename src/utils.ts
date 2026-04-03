import type { WebGLRenderer } from 'three'

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

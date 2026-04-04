import type { PerspectiveCamera, WebGLRenderer } from 'three'

/** Floor to a positive integer; non-finite and values below 1 become 1 (avoids NaN in WebGL sizing). */
function normalizeLayoutPixels(n: number): number {
  if (!Number.isFinite(n)) return 1
  const floored = Math.floor(n)
  return floored >= 1 ? floored : 1
}

/**
 * Same integer flooring and minimum size as {@link createThreeGeometraSplitHost} and
 * {@link createThreeGeometraStackedHost} use for CSS layout sizes and drawing-buffer dimensions.
 *
 * Use in custom or headless `WebGLRenderer` setups so width/height math stays aligned with those hosts.
 *
 * @returns A positive integer width or height in layout pixels (at least 1).
 */
export function normalizeGeometraLayoutPixels(n: number): number {
  return normalizeLayoutPixels(n)
}

function normalizedCssLayoutDimensions(
  cssWidth: number,
  cssHeight: number,
): { w: number; h: number } {
  return {
    w: normalizeLayoutPixels(cssWidth),
    h: normalizeLayoutPixels(cssHeight),
  }
}

/**
 * Perspective `aspect` value for the same CSS layout → camera path as
 * {@link resizeGeometraThreePerspectiveView} and the built-in split/stacked hosts
 * (`setPixelRatio` + `setSize` with layout pixels, not raw drawing-buffer dimensions).
 *
 * Use in headless or custom renderers when you resize the drawing buffer yourself but want
 * projection to stay aligned with {@link createThreeGeometraSplitHost} /
 * {@link createThreeGeometraStackedHost}. For buffer-sized projection, use
 * {@link syncGeometraThreePerspectiveFromBuffer} instead — flooring differs when width and height
 * are scaled to physical pixels separately.
 */
export function geometraHostPerspectiveAspectFromCss(cssWidth: number, cssHeight: number): number {
  const { w, h } = normalizedCssLayoutDimensions(cssWidth, cssHeight)
  return w / h
}

/**
 * Device pixel ratio for split/stacked hosts and custom renderers: full raw ratio, optionally capped.
 * Use with {@link resizeGeometraThreePerspectiveView} or {@link setWebGLDrawingBufferSize} so headless
 * or offscreen setups match the same `maxDevicePixelRatio` behavior as {@link createThreeGeometraSplitHost}
 * and {@link createThreeGeometraStackedHost}.
 *
 * @returns A finite positive ratio, capped when `maxDevicePixelRatio` is a finite positive number.
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
 * Non-finite CSS sizes or products fall back to 1; non-finite or non-positive `pixelRatio` becomes 1.
 */
export function setWebGLDrawingBufferSize(
  renderer: WebGLRenderer,
  cssWidth: number,
  cssHeight: number,
  pixelRatio?: number,
): void {
  const rawPr =
    pixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
  const pr = rawPr > 0 && Number.isFinite(rawPr) ? rawPr : 1
  const w = normalizeLayoutPixels(cssWidth * pr)
  const h = normalizeLayoutPixels(cssHeight * pr)
  renderer.setDrawingBufferSize(w, h, pr)
}

/**
 * Size the WebGL drawing buffer from CSS layout × pixel ratio and update the perspective camera aspect
 * to match, in one step.
 *
 * Use this on the **drawing-buffer** path (with {@link setWebGLDrawingBufferSize}) instead of
 * {@link resizeGeometraThreePerspectiveView} when you do not use `setPixelRatio` + `setSize` on the
 * renderer — for example headless GL, offscreen canvas, or custom buffer management. Equivalent to calling
 * {@link setWebGLDrawingBufferSize} then {@link syncGeometraThreePerspectiveFromBuffer} with the
 * resulting buffer dimensions (read from {@link WebGLRenderer.domElement} after resize).
 */
export function resizeGeometraThreeDrawingBufferView(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  cssWidth: number,
  cssHeight: number,
  pixelRatio?: number,
): void {
  setWebGLDrawingBufferSize(renderer, cssWidth, cssHeight, pixelRatio)
  syncGeometraThreePerspectiveFromBuffer(camera, renderer.domElement.width, renderer.domElement.height)
}

/**
 * Apply the same CSS-size → aspect ratio → WebGL buffer sizing path as
 * {@link createThreeGeometraSplitHost} and {@link createThreeGeometraStackedHost}.
 *
 * Use with {@link createGeometraThreeSceneBasics} when you own the `WebGLRenderer` (headless GL,
 * offscreen canvas, tests) but want buffer dimensions and projection to stay aligned with those hosts.
 * Non-finite or non-positive CSS sizes (including negative values) normalize to at least 1 layout
 * pixel each, matching {@link normalizeGeometraLayoutPixels}; non-finite or non-positive `pixelRatio`
 * becomes 1.
 */
export function resizeGeometraThreePerspectiveView(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  cssWidth: number,
  cssHeight: number,
  pixelRatio: number,
): void {
  const pr = pixelRatio > 0 && Number.isFinite(pixelRatio) ? pixelRatio : 1
  renderer.setPixelRatio(pr)
  const { w, h } = normalizedCssLayoutDimensions(cssWidth, cssHeight)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h, false)
}

/**
 * Build a resize callback that applies the same CSS layout → DPR → `setPixelRatio` / `setSize` path as
 * {@link createThreeGeometraSplitHost} and {@link createThreeGeometraStackedHost}.
 *
 * Use in headless GL, offscreen canvas, tests, or custom hosts where you resize on a timer or explicit
 * layout pass instead of the built-in `ResizeObserver`, but want {@link resolveHostDevicePixelRatio}
 * capping and layout-pixel normalization without duplicating that wiring at every call site.
 *
 * @param getRawDevicePixelRatio - e.g. `() => win.devicePixelRatio || 1` or `() => 1` when no `window`.
 */
export function createGeometraThreePerspectiveResizeHandler(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  getRawDevicePixelRatio: () => number,
  maxDevicePixelRatio?: number,
): (cssWidth: number, cssHeight: number) => void {
  return (cssWidth: number, cssHeight: number) => {
    resizeGeometraThreePerspectiveView(
      renderer,
      camera,
      cssWidth,
      cssHeight,
      resolveHostDevicePixelRatio(getRawDevicePixelRatio(), maxDevicePixelRatio),
    )
  }
}

/**
 * Update perspective projection from **drawing-buffer** pixel dimensions (physical pixels), not CSS size.
 *
 * Use when you size WebGL with {@link setWebGLDrawingBufferSize} or `renderer.setDrawingBufferSize` directly
 * (headless GL, offscreen canvas, tests) and still want the same aspect handling as
 * {@link resizeGeometraThreePerspectiveView}. Does not touch the renderer — only the camera.
 * Non-finite buffer dimensions fall back to 1.
 */
export function syncGeometraThreePerspectiveFromBuffer(
  camera: PerspectiveCamera,
  drawingBufferWidth: number,
  drawingBufferHeight: number,
): void {
  const w = normalizeLayoutPixels(drawingBufferWidth)
  const h = normalizeLayoutPixels(drawingBufferHeight)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

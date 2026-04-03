/**
 * Internal: one `requestAnimationFrame` coalescer shared by split and stacked hosts so paired
 * `ResizeObserver` notifications do not run `renderer.setSize` twice, and optional synthetic
 * `window` `resize` for Geometra stays aligned with that same tick.
 */

export interface GeometraHostLayoutSyncRaf {
  /**
   * At most one drawing-buffer sync per animation frame. When `notifyGeometra` is true for any
   * call coalesced into that frame, `dispatchGeometraResize` runs after `syncLayout`.
   */
  schedule(notifyGeometra: boolean): void
  /** Cancel a pending frame (e.g. on host destroy). */
  cancel(): void
}

export interface GeometraHostLayoutSyncRafOptions {
  /** Return true after teardown so scheduled frames no-op. */
  isDestroyed: () => boolean
  /** Resize WebGL + camera (runs inside the rAF callback). */
  syncLayout: () => void
  /** e.g. `() => win.dispatchEvent(new Event('resize'))` for Geometra thin client. */
  dispatchGeometraResize: () => void
}

export function createGeometraHostLayoutSyncRaf(
  win: Window,
  options: GeometraHostLayoutSyncRafOptions,
): GeometraHostLayoutSyncRaf {
  const { isDestroyed, syncLayout, dispatchGeometraResize } = options

  let layoutSyncRafId: number | undefined
  let pendingGeometraResizeNotify = false

  const schedule = (notifyGeometra: boolean) => {
    if (notifyGeometra) pendingGeometraResizeNotify = true
    if (layoutSyncRafId !== undefined) return
    layoutSyncRafId = win.requestAnimationFrame(() => {
      layoutSyncRafId = undefined
      if (isDestroyed()) return
      syncLayout()
      if (pendingGeometraResizeNotify) {
        pendingGeometraResizeNotify = false
        dispatchGeometraResize()
      }
    })
  }

  const cancel = () => {
    if (layoutSyncRafId !== undefined) {
      win.cancelAnimationFrame(layoutSyncRafId)
      layoutSyncRafId = undefined
    }
  }

  return { schedule, cancel }
}

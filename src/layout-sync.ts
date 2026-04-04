/**
 * One `requestAnimationFrame` coalescer for hybrid Three + Geometra hosts: paired
 * `ResizeObserver` notifications run WebGL buffer sync at most once per frame, and an optional
 * synthetic `window` `resize` can fire on the same tick so the Geometra thin client picks up
 * layout size without double work on real window resizes.
 *
 * {@link createThreeGeometraSplitHost} and {@link createThreeGeometraStackedHost} use this
 * internally; export is for custom layouts that need the same behavior.
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
  /**
   * e.g. `() => win.dispatchEvent(new Event('resize'))` for Geometra thin client.
   * Runs only when {@link GeometraHostLayoutSyncRaf.schedule} requested a notify for this coalesced
   * frame, after the layout sync callback, and only if {@link isDestroyed} is still false (avoids
   * synthetic `resize` after teardown). If the layout sync callback throws, the pending notify stays
   * set so a later coalesced frame can still dispatch once sync succeeds.
   */
  dispatchGeometraResize: () => void
}

/**
 * Build a layout sync coalescer bound to `win` (typically the Geometra client’s `window` option).
 * Call {@link GeometraHostLayoutSyncRaf.schedule} from `ResizeObserver` callbacks with
 * `notifyGeometra: true` when Geometra’s canvas layout changed without a browser `resize`, and
 * from real `window` `resize` handlers with `notifyGeometra: false`.
 */
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
      if (isDestroyed()) return
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
    pendingGeometraResizeNotify = false
  }

  return { schedule, cancel }
}

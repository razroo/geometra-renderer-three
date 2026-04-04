/** Corner anchor for the Geometra HUD overlay (same literals as {@link createThreeGeometraStackedHost}). */
export type GeometraHudPlacement = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

/**
 * Normalize HUD corner placement from runtime strings (e.g. agent JSON or untyped config).
 * Unknown or `undefined` values use `fallback` so the overlay keeps a valid `position: absolute` inset.
 */
export function coerceGeometraHudPlacement(
  value: string | undefined,
  fallback: GeometraHudPlacement,
): GeometraHudPlacement {
  if (
    value === 'bottom-right' ||
    value === 'bottom-left' ||
    value === 'top-right' ||
    value === 'top-left'
  ) {
    return value
  }
  return fallback
}

/**
 * CSS `pointer-events` for stacked HUD / overlay wrappers: trimmed non-empty strings pass through;
 * otherwise `fallback` (avoids blank or invalid values from untyped config or agent JSON).
 *
 * {@link createThreeGeometraStackedHost} uses this for {@link ThreeGeometraStackedHostOptions.geometraHudPointerEvents}.
 * Use next to {@link coerceHostStackingZIndexCss} when you build a custom stacked layout.
 */
export function coerceGeometraHudPointerEvents(
  value: string | undefined | null,
  fallback = 'auto',
): string {
  if (typeof value === 'string') {
    const t = value.trim()
    if (t.length > 0) return t
  }
  return fallback
}

/**
 * Finite, non-negative CSS px for host panel/HUD sizing; invalid values use `fallback`
 * (avoids `NaNpx` / negative sizes in inline styles).
 *
 * Same helper {@link createThreeGeometraSplitHost} and {@link createThreeGeometraStackedHost} use for
 * `geometraWidth`, HUD width/height, and margin. Use when building a custom hybrid layout next to
 * {@link createGeometraHostLayoutSyncRaf} so numeric options stay consistent with those hosts.
 *
 * @param value - Requested size in CSS pixels; non-finite, negative, or non-number values are rejected.
 * @param fallback - Default used when `value` is invalid (match the host default you document, e.g. 420).
 * @returns Either `value` (when valid) or `fallback`.
 */
export function coerceHostNonNegativeCssPx(value: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
}

/**
 * CSS `z-index` string for stacked HUD / overlay wrappers: finite numbers and non-blank strings pass
 * through; otherwise `fallback` (avoids `NaN` / `Infinity` in inline styles).
 *
 * {@link createThreeGeometraStackedHost} uses this for {@link ThreeGeometraStackedHostOptions.geometraHudZIndex}.
 * Use in custom stacking layouts next to {@link coerceHostNonNegativeCssPx} for consistent behavior.
 */
export function coerceHostStackingZIndexCss(value: string | number, fallback: number): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  if (typeof value === 'string') {
    const t = value.trim()
    if (t.length > 0) return t
  }
  return String(fallback)
}

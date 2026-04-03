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

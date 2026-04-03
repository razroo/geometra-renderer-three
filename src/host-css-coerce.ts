/**
 * Finite, non-negative CSS px for host panel/HUD sizing; invalid values use `fallback`
 * (avoids `NaNpx` / negative sizes in inline styles).
 */
export function coerceHostNonNegativeCssPx(value: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
}

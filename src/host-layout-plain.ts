import { GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS } from './split-host.js'
import { GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS } from './stacked-host.js'
import {
  coerceGeometraHudPlacement,
  coerceGeometraHudPointerEvents,
  coerceHostNonNegativeCssPx,
  coerceHostStackingZIndexCss,
  type GeometraHudPlacement,
} from './host-css-coerce.js'
import {
  isPlainGeometraThreeHostSnapshot,
  toPlainGeometraThreeHostSnapshot,
  toPlainGeometraThreeHostSnapshotHeadless,
  type GeometraThreeSceneBasicsOptions,
  type PlainGeometraThreeHostSnapshot,
} from './three-scene-basics.js'

/** Resolved Geometra column layout for {@link createThreeGeometraSplitHost} after coercion (JSON-friendly). */
export interface PlainGeometraSplitHostLayoutOptions {
  geometraWidth: number
  geometraOnLeft: boolean
}

export interface ToPlainGeometraSplitHostLayoutOptionsInput {
  geometraWidth?: number
  geometraOnLeft?: boolean
}

/**
 * Resolved split-host layout fields for logs, tests, or agent-side JSON without constructing the DOM host.
 * Uses the same coercion as {@link createThreeGeometraSplitHost}.
 */
export function toPlainGeometraSplitHostLayoutOptions(
  options: ToPlainGeometraSplitHostLayoutOptionsInput = {},
): PlainGeometraSplitHostLayoutOptions {
  const d = GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS
  const geometraWidth = coerceHostNonNegativeCssPx(
    options.geometraWidth ?? d.geometraWidth,
    d.geometraWidth,
  )
  return {
    geometraWidth,
    geometraOnLeft: options.geometraOnLeft ?? false,
  }
}

/** Resolved stacked HUD layout for {@link createThreeGeometraStackedHost} after coercion (JSON-friendly). */
export interface PlainGeometraStackedHostLayoutOptions {
  geometraHudWidth: number
  geometraHudHeight: number
  geometraHudPlacement: GeometraHudPlacement
  geometraHudMargin: number
  geometraHudPointerEvents: string
  /** Coerced CSS `z-index` string (same value applied to the HUD wrapper in the stacked host). */
  geometraHudZIndex: string
}

export interface ToPlainGeometraStackedHostLayoutOptionsInput {
  geometraHudWidth?: number
  geometraHudHeight?: number
  /** Runtime strings (e.g. from JSON) are normalized like {@link createThreeGeometraStackedHost}. */
  geometraHudPlacement?: GeometraHudPlacement | string
  geometraHudMargin?: number
  geometraHudPointerEvents?: string
  geometraHudZIndex?: string | number
}

/**
 * Resolved stacked HUD layout fields for logs, tests, or agent-side JSON without constructing the DOM host.
 * Uses the same coercion as {@link createThreeGeometraStackedHost}.
 */
export function toPlainGeometraStackedHostLayoutOptions(
  options: ToPlainGeometraStackedHostLayoutOptionsInput = {},
): PlainGeometraStackedHostLayoutOptions {
  const d = GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS
  const geometraHudWidth = coerceHostNonNegativeCssPx(
    options.geometraHudWidth ?? d.geometraHudWidth,
    d.geometraHudWidth,
  )
  const geometraHudHeight = coerceHostNonNegativeCssPx(
    options.geometraHudHeight ?? d.geometraHudHeight,
    d.geometraHudHeight,
  )
  const geometraHudMargin = coerceHostNonNegativeCssPx(
    options.geometraHudMargin ?? d.geometraHudMargin,
    d.geometraHudMargin,
  )
  const geometraHudPlacementOpt = options.geometraHudPlacement ?? d.geometraHudPlacement
  const geometraHudPlacement = coerceGeometraHudPlacement(
    geometraHudPlacementOpt as string | undefined,
    d.geometraHudPlacement,
  )
  const geometraHudPointerEvents = coerceGeometraHudPointerEvents(options.geometraHudPointerEvents, 'auto')
  const geometraHudZIndex = coerceHostStackingZIndexCss(options.geometraHudZIndex ?? 1, 1)
  return {
    geometraHudWidth,
    geometraHudHeight,
    geometraHudPlacement,
    geometraHudMargin,
    geometraHudPointerEvents,
    geometraHudZIndex,
  }
}

/** Literal tag on composite plain snapshots so JSON consumers can tell hybrid layout without inferring fields. */
export type GeometraHybridHostKind = 'split' | 'stacked'

/** Every {@link GeometraHybridHostKind} value (stable iteration, prompts, or defensive checks). */
export const GEOMETRA_HYBRID_HOST_KINDS: readonly GeometraHybridHostKind[] = ['split', 'stacked']

/**
 * Narrow `unknown` to {@link GeometraHybridHostKind} when parsing composite snapshot JSON from logs or agents.
 */
export function isGeometraHybridHostKind(value: unknown): value is GeometraHybridHostKind {
  return value === 'split' || value === 'stacked'
}

/**
 * Normalize {@link GeometraHybridHostKind} from runtime values (e.g. agent JSON or untyped config).
 * Literal `'split'` and `'stacked'` pass through. Strings are trimmed and matched **case-insensitively**;
 * unknown or empty strings use `fallback` (same normalization idea as {@link coerceGeometraHudPlacement}).
 *
 * For narrowing without coercion, use {@link isGeometraHybridHostKind}.
 */
export function coerceGeometraHybridHostKind(
  value: unknown,
  fallback: GeometraHybridHostKind,
): GeometraHybridHostKind {
  if (value === 'split' || value === 'stacked') return value
  if (typeof value !== 'string') return fallback
  const key = value.trim().toLowerCase()
  if (key === 'split' || key === 'stacked') return key
  return fallback
}

const GEOMETRA_HUD_PLACEMENT_LITERALS = new Set<GeometraHudPlacement>([
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
])

/**
 * Narrow `unknown` (e.g. `JSON.parse`) to {@link PlainGeometraThreeSplitHostSnapshot} when the object
 * matches the shape produced by {@link toPlainGeometraThreeSplitHostSnapshot} /
 * {@link toPlainGeometraThreeSplitHostSnapshotHeadless}. Complements {@link isGeometraHybridHostKind} for
 * composite agent or log payloads.
 */
export function isPlainGeometraThreeSplitHostSnapshot(
  value: unknown,
): value is PlainGeometraThreeSplitHostSnapshot {
  if (value === null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (o.geometraHybridHostKind !== 'split') return false
  if (typeof o.geometraOnLeft !== 'boolean') return false
  if (typeof o.geometraWidth !== 'number' || !Number.isFinite(o.geometraWidth) || o.geometraWidth <= 0) {
    return false
  }
  return isPlainGeometraThreeHostSnapshot(value)
}

/**
 * Same idea as {@link isPlainGeometraThreeSplitHostSnapshot} for {@link PlainGeometraThreeStackedHostSnapshot}
 * / {@link toPlainGeometraThreeStackedHostSnapshot} / {@link toPlainGeometraThreeStackedHostSnapshotHeadless}.
 */
export function isPlainGeometraThreeStackedHostSnapshot(
  value: unknown,
): value is PlainGeometraThreeStackedHostSnapshot {
  if (value === null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (o.geometraHybridHostKind !== 'stacked') return false
  if (
    typeof o.geometraHudWidth !== 'number' ||
    !Number.isFinite(o.geometraHudWidth) ||
    o.geometraHudWidth <= 0 ||
    typeof o.geometraHudHeight !== 'number' ||
    !Number.isFinite(o.geometraHudHeight) ||
    o.geometraHudHeight <= 0 ||
    typeof o.geometraHudMargin !== 'number' ||
    !Number.isFinite(o.geometraHudMargin) ||
    o.geometraHudMargin <= 0
  ) {
    return false
  }
  if (typeof o.geometraHudPlacement !== 'string' || !GEOMETRA_HUD_PLACEMENT_LITERALS.has(o.geometraHudPlacement as GeometraHudPlacement)) {
    return false
  }
  if (typeof o.geometraHudPointerEvents !== 'string') return false
  if (typeof o.geometraHudZIndex !== 'string') return false
  return isPlainGeometraThreeHostSnapshot(value)
}

/**
 * Split-host layout fields plus {@link PlainGeometraThreeHostSnapshot} in one JSON-friendly object —
 * same coercion as {@link toPlainGeometraSplitHostLayoutOptions} and {@link toPlainGeometraThreeHostSnapshot}.
 *
 * Use for logs, tests, or agent payloads that describe column chrome and Three viewport/scene together.
 * The `geometraHybridHostKind` field is always `'split'` on values from {@link toPlainGeometraThreeSplitHostSnapshot} /
 * {@link toPlainGeometraThreeSplitHostSnapshotHeadless}.
 */
export type PlainGeometraThreeSplitHostSnapshot = PlainGeometraSplitHostLayoutOptions &
  PlainGeometraThreeHostSnapshot & {
    geometraHybridHostKind: 'split'
  }

/**
 * Stacked-host HUD layout plus {@link PlainGeometraThreeHostSnapshot} (full-viewport Three sizing, not HUD box size).
 *
 * Same coercion as {@link toPlainGeometraStackedHostLayoutOptions} and {@link toPlainGeometraThreeHostSnapshot}.
 * The `geometraHybridHostKind` field is always `'stacked'` on values from {@link toPlainGeometraThreeStackedHostSnapshot} /
 * {@link toPlainGeometraThreeStackedHostSnapshotHeadless}.
 */
export type PlainGeometraThreeStackedHostSnapshot = PlainGeometraStackedHostLayoutOptions &
  PlainGeometraThreeHostSnapshot & {
    geometraHybridHostKind: 'stacked'
  }

/**
 * Merge split layout and host viewport/scene plain fields for stable JSON.
 *
 * @see PlainGeometraThreeSplitHostSnapshot
 */
export function toPlainGeometraThreeSplitHostSnapshot(
  layoutOptions: ToPlainGeometraSplitHostLayoutOptionsInput = {},
  cssWidth: number,
  cssHeight: number,
  rawDevicePixelRatio: number,
  maxDevicePixelRatio?: number,
  sceneBasicsOptions: GeometraThreeSceneBasicsOptions = {},
): PlainGeometraThreeSplitHostSnapshot {
  return {
    geometraHybridHostKind: 'split',
    ...toPlainGeometraSplitHostLayoutOptions(layoutOptions),
    ...toPlainGeometraThreeHostSnapshot(
      cssWidth,
      cssHeight,
      rawDevicePixelRatio,
      maxDevicePixelRatio,
      sceneBasicsOptions,
    ),
  }
}

/**
 * Same as {@link toPlainGeometraThreeSplitHostSnapshot} with raw device pixel ratio **1** —
 * parity with {@link toPlainGeometraThreeHostSnapshotHeadless} for headless or agent payloads without a `window`.
 */
export function toPlainGeometraThreeSplitHostSnapshotHeadless(
  layoutOptions: ToPlainGeometraSplitHostLayoutOptionsInput = {},
  cssWidth: number,
  cssHeight: number,
  maxDevicePixelRatio?: number,
  sceneBasicsOptions: GeometraThreeSceneBasicsOptions = {},
): PlainGeometraThreeSplitHostSnapshot {
  return {
    geometraHybridHostKind: 'split',
    ...toPlainGeometraSplitHostLayoutOptions(layoutOptions),
    ...toPlainGeometraThreeHostSnapshotHeadless(cssWidth, cssHeight, maxDevicePixelRatio, sceneBasicsOptions),
  }
}

/**
 * Merge stacked HUD layout and host viewport/scene plain fields for stable JSON.
 *
 * @see PlainGeometraThreeStackedHostSnapshot
 */
export function toPlainGeometraThreeStackedHostSnapshot(
  layoutOptions: ToPlainGeometraStackedHostLayoutOptionsInput = {},
  cssWidth: number,
  cssHeight: number,
  rawDevicePixelRatio: number,
  maxDevicePixelRatio?: number,
  sceneBasicsOptions: GeometraThreeSceneBasicsOptions = {},
): PlainGeometraThreeStackedHostSnapshot {
  return {
    geometraHybridHostKind: 'stacked',
    ...toPlainGeometraStackedHostLayoutOptions(layoutOptions),
    ...toPlainGeometraThreeHostSnapshot(
      cssWidth,
      cssHeight,
      rawDevicePixelRatio,
      maxDevicePixelRatio,
      sceneBasicsOptions,
    ),
  }
}

/**
 * Same as {@link toPlainGeometraThreeStackedHostSnapshot} with raw device pixel ratio **1**.
 */
export function toPlainGeometraThreeStackedHostSnapshotHeadless(
  layoutOptions: ToPlainGeometraStackedHostLayoutOptionsInput = {},
  cssWidth: number,
  cssHeight: number,
  maxDevicePixelRatio?: number,
  sceneBasicsOptions: GeometraThreeSceneBasicsOptions = {},
): PlainGeometraThreeStackedHostSnapshot {
  return {
    geometraHybridHostKind: 'stacked',
    ...toPlainGeometraStackedHostLayoutOptions(layoutOptions),
    ...toPlainGeometraThreeHostSnapshotHeadless(cssWidth, cssHeight, maxDevicePixelRatio, sceneBasicsOptions),
  }
}

import { GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS } from './split-host.js'
import { GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS } from './stacked-host.js'
import {
  coerceGeometraHudPlacement,
  coerceGeometraHudPointerEvents,
  coerceHostNonNegativeCssPx,
  coerceHostStackingZIndexCss,
  type GeometraHudPlacement,
} from './host-css-coerce.js'

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

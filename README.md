# @geometra/renderer-three

**Three.js helpers alongside Geometra** — not a replacement for `@geometra/renderer-canvas`. Geometra’s WebSocket geometry protocol still drives the 2D canvas; Three.js owns WebGL for meshes, scenes, and cameras.

This package ships the **split-view host** pattern (Three.js pane + Geometra pane) and a **stacked HUD** host (full-viewport WebGL + corner Geometra overlay) as bootstrap helpers, plus small WebGL sizing utilities.

For the long-term goal — Three.js and Geometra in one **native**, protocol-first, DOM-free space — see [docs/GEOMETRA_NATIVE_SPACE.md](docs/GEOMETRA_NATIVE_SPACE.md). To drive the Cursor Agent CLI in a loop (like the main Geometra repo), use [`scripts/cursor-agent-loop.sh`](scripts/cursor-agent-loop.sh) after installing the [`agent` CLI](https://cursor.com/install); each iteration should pass `npm run release:gate`.

## Install

Peer dependencies (your app must install them):

```bash
npm install three @geometra/renderer-canvas @geometra/client @geometra/core
npm install @geometra/renderer-three
```

## Usage

```ts
import * as THREE from 'three'
import { createThreeGeometraSplitHost } from '@geometra/renderer-three'

const host = createThreeGeometraSplitHost({
  container: document.getElementById('app')!,
  geometraWidth: 420,
  url: 'ws://localhost:8080/geometra-ws',
  binaryFraming: true,
  autoFocus: true,
  threeBackground: 0x07131f,
  onThreeReady: ({ scene, camera }) => {
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    camera.position.set(0, 2, 8)
  },
  onThreeFrame: ({ scene, camera, delta }) => {
    // animate meshes, controls.update(), etc.; return false to skip a single frame’s render
  },
})

// later
host.destroy()
```

### Stacked HUD (WebGL + overlay)

```ts
import * as THREE from 'three'
import { createThreeGeometraStackedHost } from '@geometra/renderer-three'

const stacked = createThreeGeometraStackedHost({
  container: document.getElementById('app')!,
  geometraHudWidth: 400,
  geometraHudHeight: 280,
  geometraHudPlacement: 'bottom-right',
  geometraHudMargin: 16,
  url: 'ws://localhost:8080/geometra-ws',
  binaryFraming: true,
  onThreeReady: ({ scene, camera }) => {
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    camera.position.set(0, 1.5, 6)
  },
})
stacked.destroy()
```

If you omit sizing and placement options, the HUD uses **defaults** that match `createThreeGeometraStackedHost` in code: width **420** CSS px, height **320** CSS px, placement **`bottom-right`**, corner margin **12** CSS px. The same numbers are exported as `GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS` for custom stacked layouts, logs, or agent payloads. Split-host Geometra column width **420** is `GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS.geometraWidth`. For `geometraHudPlacement`, runtime strings (including from JSON or agents) are trimmed and the four corner literals are matched case-insensitively; anything else falls back to the default, same as the exported `coerceGeometraHudPlacement` helper.

Use `geometraHudPointerEvents` (CSS `pointer-events`, default `'auto'`) when you want the HUD to ignore input — for example `'none'` so pointer events reach the full-viewport Three.js canvas underneath. Blank or whitespace-only values fall back to `'auto'`; custom layouts can use the exported helper `coerceGeometraHudPointerEvents` for the same rules.

Use `geometraHudZIndex` (default `1`; the WebGL canvas stays at `0`) when you add other absolutely positioned siblings and need a predictable stacking order. Non-finite numbers and blank strings fall back to that default; custom layouts can use the exported helper `coerceHostStackingZIndexCss` for the same rules.

`createThreeGeometraSplitHost` and `createThreeGeometraStackedHost` each forward all [`createBrowserCanvasClient`](https://github.com/razroo/geometra/tree/main/packages/renderer-canvas) options except `canvas` (the host creates the Geometra canvas for you). For that option shape in TypeScript (e.g. building a custom host), use the exported type `GeometraHostBrowserCanvasClientOptions`.

This package also re-exports `GEOM_DATA_CHANNEL_TRACKER_SNAPSHOT` from [`@geometra/client`](https://github.com/razroo/geometra/tree/main/packages/client) so hybrid Three + Geometra code can match the tracker-snapshot data channel name when handling JSON `onData` side-channels on the same socket as layout, without importing `@geometra/client` only for that constant.

### WebGL device pixel ratio cap

Both `createThreeGeometraSplitHost` and `createThreeGeometraStackedHost` accept optional `maxDevicePixelRatio` (for example `2`) to limit the Three.js drawing buffer on high-DPR displays and reduce GPU memory use. When omitted, the full `window.devicePixelRatio` is used.

### Geometra resize

The Geometra thin client listens to `window` resize by default. When only the Geometra column or HUD changes size, this host dispatches a synthetic `window` `resize` after layout so server layout width/height stay in sync. That path shares one `requestAnimationFrame` coalescer with the Three.js buffer resize (so paired `ResizeObserver` notifications do not double-call `setSize`), and skips the synthetic event on real window resizes so the client is not notified twice.

For a **custom** hybrid layout (different panels or overlay geometry), use `createGeometraHostLayoutSyncRaf` with the same `schedule(true)` from observers that affect the Geometra canvas size and `schedule(false)` from `window` `resize`, mirroring the built-in hosts. Use `coerceHostNonNegativeCssPx` for panel/HUD dimensions so invalid numbers fall back the same way as in `createThreeGeometraSplitHost` / `createThreeGeometraStackedHost`. For the same `setPixelRatio` / `setSize` resize callback as the hosts but with raw DPR **1** and an optional cap (headless / no-`window`), use `createGeometraThreePerspectiveResizeHandlerHeadless` — parity with `createGeometraThreePerspectiveResizeHandler(..., () => 1, maxDevicePixelRatio)`.

### Shared scene / camera defaults (headless-friendly)

`createGeometraThreeSceneBasics` builds a `Scene`, `PerspectiveCamera`, and `Clock` with the same defaults as the split and stacked hosts. `resolveGeometraThreeSceneBasicsOptions` returns those same merged/coerced option values without constructing Three objects — useful for headless logging, tests, or agent payloads aligned with the hosts. `toPlainGeometraThreeSceneBasicsOptions` adds a single `threeBackgroundHex` field (`0xRRGGBB`, same as `THREE.Color#getHex`) so string/keyword backgrounds become JSON-stable numbers alongside the coerced camera fields. To turn that plain shape (e.g. from `JSON.parse`) back into a live scene, camera, and clock with the same coercion as the hosts, use `createGeometraThreeSceneBasicsFromPlain`. `toPlainGeometraThreeViewSizingState(cssWidth, cssHeight, rawDevicePixelRatio, maxDevicePixelRatio?)` returns floored layout size, aspect, sanitized raw DPR, capped effective DPR, and nominal drawing-buffer dimensions using the same rules as `resizeGeometraThreePerspectiveView` (pair with scene-basics “plain” helpers for full viewport + scene snapshots). `toPlainGeometraThreeViewSizingStateHeadless(cssWidth, cssHeight, maxDevicePixelRatio?)` is the same with raw DPR fixed at **1** when you only need the viewport plain object (headless / no-`window` parity with `resolveHeadlessHostDevicePixelRatio`). `toPlainGeometraThreeHostSnapshot(cssWidth, cssHeight, rawDevicePixelRatio, maxDevicePixelRatio?, sceneBasicsOptions?)` merges those two plain shapes in one call for logs, tests, or agent payloads. `toPlainGeometraThreeHostSnapshotHeadless(cssWidth, cssHeight, maxDevicePixelRatio?, sceneBasicsOptions?)` is the same with raw DPR fixed at **1** (headless / no-`window` parity with `resolveHeadlessHostDevicePixelRatio`). When you already have a `PlainGeometraThreeViewSizingState` from `toPlainGeometraThreeViewSizingState`, `toPlainGeometraThreeHostSnapshotFromViewSizing(sizing, sceneBasicsOptions?)` merges it with scene/camera plain fields without recomputing layout or DPR. For **host chrome** without viewport math, `toPlainGeometraSplitHostLayoutOptions` and `toPlainGeometraStackedHostLayoutOptions` return the same coerced split-column / HUD numbers and flags as `createThreeGeometraSplitHost` and `createThreeGeometraStackedHost` (logs, tests, or agent payloads next to the scene/sizing helpers). `toPlainGeometraThreeSplitHostSnapshot` / `toPlainGeometraThreeSplitHostSnapshotHeadless` and `toPlainGeometraThreeStackedHostSnapshot` / `toPlainGeometraThreeStackedHostSnapshotHeadless` merge that layout plain object with `toPlainGeometraThreeHostSnapshot` or `toPlainGeometraThreeHostSnapshotHeadless` in one step (same argument order: optional layout input, then `cssWidth`, `cssHeight`, raw DPR or omitted for headless, optional `maxDevicePixelRatio`, optional scene-basics options). Each composite snapshot includes **`geometraHybridHostKind`** (`'split'` or `'stacked'`) so JSON logs and agent payloads can identify the hybrid layout without inferring from HUD-only fields; the union is exported as `GeometraHybridHostKind`, with **`isGeometraHybridHostKind`** for narrowing parsed JSON, **`coerceGeometraHybridHostKind`** to normalize runtime strings (trim + case-insensitive literals, same idea as `coerceGeometraHudPlacement`), and **`GEOMETRA_HYBRID_HOST_KINDS`** listing the accepted literals. **`isPlainGeometraThreeHostSnapshot`** narrows unknown JSON to the base viewport + scene fields produced by `toPlainGeometraThreeHostSnapshot` (and related helpers); composite split/stacked snapshots satisfy it too, while **`isPlainGeometraThreeSplitHostSnapshot`** / **`isPlainGeometraThreeStackedHostSnapshot`** additionally require layout fields and the matching `geometraHybridHostKind`. For the renderer, use `createGeometraThreeWebGLRenderer(canvas)` or `new WebGLRenderer(createGeometraHostWebGLRendererParams(canvas))` (or spread `GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS` into `new WebGLRenderer({ canvas, ...GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS })`) so `antialias` / `alpha` match those hosts (browser, offscreen canvas, or other GL-capable environments). To create both in one call (typical for minimal bootstrap or headless-style entrypoints), use `createGeometraThreeWebGLWithSceneBasics(canvas, options?)` — same behavior as `createGeometraThreeWebGLRenderer` plus `createGeometraThreeSceneBasics` with the shared options object. After sizing, `renderGeometraThreeWebGLWithSceneBasicsFrame(bundle)` runs a single `renderer.render(scene, camera)` with that bundle (tests, headless ticks, or agent loops). For the same `clock.getDelta()` / `elapsedTime` ordering as the split and stacked hosts before `render`, use `tickGeometraThreeWebGLWithSceneBasicsFrame(bundle, onFrame?)`. Return `false` from `onFrame` to skip `render` (same idea as tearing down from `onThreeFrame` so the frame does not draw after dispose); the tick helper returns `false` in that case and `true` when a frame was drawn. When tearing down, call `disposeGeometraThreeWebGLWithSceneBasics({ renderer })` so the WebGL context and renderer internals are released; pass `clock` from the same bundle when you want `Clock#stop` after dispose so headless or agent loops do not keep advancing delta/elapsed time. Scene graph disposal for meshes/materials/textures remains your responsibility. Pair that with `resizeGeometraThreePerspectiveView` so buffer size and camera aspect match the hosts, or call `resizeGeometraThreeWebGLWithSceneBasicsView(bundle, cssWidth, cssHeight, devicePixelRatio, maxDevicePixelRatio?)` when you already hold the bundle and want the same `resolveHostDevicePixelRatio` + layout-pixel path in one step. For raw DPR **1** without repeating that literal (headless / no-`window` parity with `toPlainGeometraThreeHostSnapshotHeadless`), use `resizeGeometraThreeWebGLWithSceneBasicsViewHeadless(bundle, cssWidth, cssHeight, maxDevicePixelRatio?)`. When each step should resize then advance the clock and render (same ordering as `tickGeometraThreeWebGLWithSceneBasicsFrame`), use `resizeTickGeometraThreeWebGLWithSceneBasics(bundle, cssWidth, cssHeight, rawDevicePixelRatio, maxDevicePixelRatio?, onFrame?)` for an explicit raw DPR (for example `window.devicePixelRatio || 1`), or `resizeTickGeometraThreeWebGLWithSceneBasicsHeadless(bundle, cssWidth, cssHeight, maxDevicePixelRatio?, onFrame?)` for raw DPR **1** — each is equivalent to calling the matching resize helper and then the tick helper in sequence. Or use `setWebGLDrawingBufferSize` and `syncGeometraThreePerspectiveFromBuffer` when you size the drawing buffer directly (physical pixels) instead of CSS layout + `setPixelRatio`. For that drawing-buffer path, `resizeGeometraThreeDrawingBufferView` applies buffer sizing and camera aspect in one call. When you manage buffer sizing yourself but want the same **CSS-layout** aspect as the hosts, set `camera.aspect = geometraHostPerspectiveAspectFromCss(cssWidth, cssHeight)` (same flooring as `resizeGeometraThreePerspectiveView`). Pass the same optional cap as the hosts via `resolveHostDevicePixelRatio(devicePixelRatio, maxDevicePixelRatio)` so drawing-buffer scale stays aligned on high-DPR displays. In headless or test environments without `window`, use `resolveHeadlessHostDevicePixelRatio(maxDevicePixelRatio)` (raw ratio `1` with the same cap).

## Roadmap (not in v0)

- Optional **scene-graph extension** to the GEOM protocol (headless + WebGL from the same JSON).
- **Stacked** overlay: v0 ships a corner HUD layout; richer stacking (custom regions, explicit `pointer-events` policies) may follow.
- **Node / headless Three** helpers for parity with “AI talks the same protocol” stories (`createGeometraThreeSceneBasics` is a small shared baseline; richer helpers may follow).

## Releasing (GitHub + npm)

Same pattern as [`geometra-auth`](https://github.com/razroo/geometra-auth): publishing runs when a **GitHub Release is published**, not on every tag push.

1. **Repository secret:** add **`NPM_TOKEN`** (automation token with publish rights for `@geometra/renderer-three`) under **Settings → Secrets and variables → Actions**.

2. **Version:** set `"version"` in `package.json` to the release you want (e.g. `0.2.0`), commit, and push to `main`.

3. **Tag** must match that version with a `v` prefix:

   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```

4. **Create the GitHub release** (triggers [`.github/workflows/release.yml`](.github/workflows/release.yml)):

   ```bash
   gh release create v0.2.0 --repo razroo/geometra-renderer-three --title "v0.2.0" --generate-notes
   ```

   Or publish a **draft** release from the web UI, then **Publish release** when ready.

The workflow checks that `v$TAG` matches `package.json`, runs `npm ci` / `npm run build`, then **`npm publish --provenance --access public`**.

## License

MIT

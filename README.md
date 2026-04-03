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
    // animate meshes, controls.update(), etc.
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

If you omit sizing and placement options, the HUD uses **defaults** that match `createThreeGeometraStackedHost` in code: width **420** CSS px, height **320** CSS px, placement **`bottom-right`**, corner margin **12** CSS px.

Use `geometraHudPointerEvents` (CSS `pointer-events`, default `'auto'`) when you want the HUD to ignore input — for example `'none'` so pointer events reach the full-viewport Three.js canvas underneath.

Use `geometraHudZIndex` (default `1`; the WebGL canvas stays at `0`) when you add other absolutely positioned siblings and need a predictable stacking order.

`createThreeGeometraSplitHost` and `createThreeGeometraStackedHost` each forward all [`createBrowserCanvasClient`](https://github.com/razroo/geometra/tree/main/packages/renderer-canvas) options except `canvas` (the host creates the Geometra canvas for you).

### WebGL device pixel ratio cap

Both `createThreeGeometraSplitHost` and `createThreeGeometraStackedHost` accept optional `maxDevicePixelRatio` (for example `2`) to limit the Three.js drawing buffer on high-DPR displays and reduce GPU memory use. When omitted, the full `window.devicePixelRatio` is used.

### Geometra resize

The Geometra thin client listens to `window` resize by default. When only the Geometra column or HUD changes size, this host dispatches a synthetic `window` `resize` after layout so server layout width/height stay in sync. That path shares one `requestAnimationFrame` coalescer with the Three.js buffer resize (so paired `ResizeObserver` notifications do not double-call `setSize`), and skips the synthetic event on real window resizes so the client is not notified twice.

For a **custom** hybrid layout (different panels or overlay geometry), use `createGeometraHostLayoutSyncRaf` with the same `schedule(true)` from observers that affect the Geometra canvas size and `schedule(false)` from `window` `resize`, mirroring the built-in hosts.

### Shared scene / camera defaults (headless-friendly)

`createGeometraThreeSceneBasics` builds a `Scene`, `PerspectiveCamera`, and `Clock` with the same defaults as the split and stacked hosts. For the renderer, use `new WebGLRenderer(createGeometraHostWebGLRendererParams(canvas))` (or spread `GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS` into `new WebGLRenderer({ canvas, ...GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS })`) so `antialias` / `alpha` match those hosts (headless or offscreen). Pair that with `resizeGeometraThreePerspectiveView` so buffer size and camera aspect match the hosts, or use `setWebGLDrawingBufferSize` and `syncGeometraThreePerspectiveFromBuffer` when you size the drawing buffer directly (physical pixels) instead of CSS layout + `setPixelRatio`. For that drawing-buffer path, `resizeGeometraThreeDrawingBufferView` applies buffer sizing and camera aspect in one call. Pass the same optional cap as the hosts via `resolveHostDevicePixelRatio(devicePixelRatio, maxDevicePixelRatio)` so drawing-buffer scale stays aligned on high-DPR displays.

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

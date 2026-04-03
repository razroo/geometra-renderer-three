# @geometra/renderer-three

**Three.js helpers alongside Geometra** — not a replacement for `@geometra/renderer-canvas`. Geometra’s WebSocket geometry protocol still drives the 2D canvas; Three.js owns WebGL for meshes, scenes, and cameras.

This package ships the **split-view host** pattern (Three.js pane + Geometra pane) as one bootstrap, plus small WebGL sizing utilities.

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

`createThreeGeometraSplitHost` forwards all [`createBrowserCanvasClient`](https://github.com/razroo/geometra/tree/main/packages/renderer-canvas) options except `canvas` (it creates the Geometra canvas for you).

### Geometra resize

The Geometra thin client listens to `window` resize by default. When only the Geometra column changes size, this host dispatches a synthetic `window` `resize` after layout so server layout width/height stay in sync.

## Roadmap (not in v0)

- Optional **scene-graph extension** to the GEOM protocol (headless + WebGL from the same JSON).
- **Stacked** overlay (full-viewport WebGL + partial Geometra HUD) with explicit pointer routing.
- **Node / headless Three** helpers for parity with “AI talks the same protocol” stories.

## License

MIT

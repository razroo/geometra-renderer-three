# Geometra native space

This repository is part of a longer arc: **bring Three.js-style 3D rendering fully into [Geometra](https://github.com/razroo/geometra)’s native world**, not as a sidecar that only happens to sit next to a canvas.

## North star

**The client is the server. The server is the client.**

Geometra is a **DOM-free** frontend framework built on the **Textura** layout engine. The same **JSON geometry protocol** powers both sides: layout, paint, and interaction are described as data, not as a browser document tree. **Human and AI interaction are native on both sides** — no privileged “only humans get the real UI” path.

There is **no browser layout engine** and **no DOM** in that model: only **computed geometry** flowing straight to **render targets** (canvas, WebGL, or future targets).

## Why this matters for agents

AI agents interact with the system **directly via the same JSON protocol** the client uses. That means **no browser middleman**, **no scraping**, and **no fragile automation hacks**. Agents can move orders of magnitude faster because they skip the entire DOM/CSS/layout/render pipeline that exists only for human-facing browsers.

The same idea extends to **multiple client/server roles**: several logical instances can run **inside a single client** when the architecture treats peers symmetrically.

This package (`@geometra/renderer-three`) is a practical step along that path: **Three.js alongside** Geometra’s streamed canvas today, with room to grow toward **headless Three**, **protocol-level scene description**, and **full parity** between what runs in a tab and what runs in a headless agent session.

### Agent and headless parity (shipped today)

While a **scene-graph extension** to the GEOM protocol is still roadmap, the package already exposes **JSON-stable** layout and viewport helpers (`toPlainGeometraThreeHostSnapshot` / headless variants, composite split/stacked snapshots with `geometraHybridHostKind`, and layout-only `toPlainGeometraSplitHostLayoutOptions` / `toPlainGeometraStackedHostLayoutOptions`) so agents and tests can describe the same numbers the browser hosts use. **Frame and resize** helpers (`tickGeometraThreeWebGLWithSceneBasicsFrame`, headless DPR and resize entrypoints) mirror split/stacked host ordering and buffer rules without a DOM. For **WebSocket side channels** on the same socket as layout, the re-exported `GEOM_DATA_CHANNEL_TRACKER_SNAPSHOT` keeps tracker JSON channel names aligned with `@geometra/client`. The README lists the full public API and option shapes.

### What ships in `@geometra/renderer-three` today

Browser **split** and **stacked HUD** hosts wire Three.js and `createBrowserCanvasClient` with shared resize coalescing and Geometra `window` resize notifications. For the same **layout, DPR, camera, and scene numbers** without a DOM host — logs, tests, or agent-side payloads next to the GEOM stream — use the **plain snapshot** helpers (`toPlainGeometraThreeHostSnapshot` / `Headless`, composite split/stacked variants), **headless resize** (`resizeGeometraThreeWebGLWithSceneBasicsViewHeadless`, `createGeometraThreePerspectiveResizeHandlerHeadless`, `resolveHeadlessHostDevicePixelRatio`), and **frame parity** (`tickGeometraThreeWebGLWithSceneBasicsFrame`, matching host `clock` / `onThreeFrame` ordering; returns whether a frame was drawn). The package README lists the full public API.

---

*Geometra native space: one protocol, any render target, symmetric peers — layout and graphics as data, end to end.*

In one line: **this is singularity tech** — the same machine-readable geometry that humans see is what agents drive, at full speed, with no browser-shaped middle layer.

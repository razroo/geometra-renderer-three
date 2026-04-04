#!/usr/bin/env bash
# Re-exec under bash when invoked as `sh` (often dash on Linux). This script uses
# bash-only syntax ([[, arrays, PIPESTATUS, BASH_SOURCE).
if [ -z "${BASH_VERSION+x}" ]; then
  exec /usr/bin/env bash "$0" "$@"
fi

# Drive Cursor Agent CLI in a loop (non-interactive). Each iteration is one agent
# session that explores the codebase, picks the next best improvement, implements
# it, runs the release gate, commits, and pushes.
#
# Task selection (humans/agents):
#   - Read docs/GEOMETRA_NATIVE_SPACE.md for north-star intent (Geometra-native Three,
#     protocol parity, headless/AI paths).
#   - README.md "Roadmap (not in v0)" and body for shipped scope vs next steps.
#   - rg 'TODO|FIXME|HACK' src for concrete hooks.
#   - When changing public API or types, keep README examples and package.json
#     peer ranges coherent with https://github.com/razroo/geometra (renderer-canvas, client, core).
#   - When editing host options defaults or CSS pixel / z-index / pointer-events coercion (split-host.ts, stacked-host.ts,
#     host-css-coerce.ts: coerceHostNonNegativeCssPx, coerceHostStackingZIndexCss, coerceGeometraHudPointerEvents,
#     coerceGeometraHudPlacement), align README prose
#     and examples so readers are not misled (explicit example values vs documented defaults).
#   - npm run release:gate runs tsc --noEmit, build, verify-exports.mjs, verify-utils.mjs,
#     verify-layout-sync.mjs (post-sync isDestroyed skips synthetic Geometra resize; syncLayout throw retains pending notify),
#     verify-host-css-coerce.mjs (dist/host-css-coerce.js; coerceHostNonNegativeCssPx,
#     coerceGeometraHudPointerEvents, coerceGeometraHudPlacement; re-exported from dist/index.js for custom layouts).
#     Update those scripts if exports or
#     resize / drawing-buffer view / buffer-sync / DPR / layout-pixel normalization /
#     geometraHostPerspectiveAspectFromCss / toPlainGeometraThreeViewSizingState / toPlainGeometraThreeHostSnapshot /
#     toPlainGeometraThreeHostSnapshotHeadless / toPlainGeometraThreeHostSnapshotFromViewSizing /
#     createGeometraThreePerspectiveResizeHandler / createGeometraThreePerspectiveResizeHandlerHeadless / scene-basics /
#     GEOMETRA_SPLIT_HOST_LAYOUT_DEFAULTS / GEOMETRA_STACKED_HOST_LAYOUT_DEFAULTS /
#     GEOMETRA_THREE_HOST_SCENE_DEFAULTS / GEOMETRA_HOST_WEBGL_RENDERER_OPTIONS /
#     createGeometraHostWebGLRendererParams / createGeometraThreeWebGLRenderer /
#     createGeometraThreeWebGLWithSceneBasics / resolveGeometraThreeSceneBasicsOptions /
#     resizeGeometraThreeWebGLWithSceneBasicsView / resizeGeometraThreeWebGLWithSceneBasicsViewHeadless /
#     renderGeometraThreeWebGLWithSceneBasicsFrame / tickGeometraThreeWebGLWithSceneBasicsFrame
#     (onFrame false skips render and tick returns false; tick returns true when render runs; onFrame throw skips render;
#     parity with host onThreeFrame ordering) /
#     disposeGeometraThreeWebGLWithSceneBasics /
#     toPlainGeometraSplitHostLayoutOptions / toPlainGeometraStackedHostLayoutOptions /
#     toPlainGeometraThreeSplitHostSnapshot / Headless / toPlainGeometraThreeStackedHostSnapshot / Headless (host-layout-plain.ts; `geometraHybridHostKind`, `GEOMETRA_HYBRID_HOST_KINDS`, `isGeometraHybridHostKind`) /
#     host sizing helpers /
#     layout-sync behavior change (extend verify-layout-sync.mjs when semantics shift).
#
# Prerequisites:
#   - Cursor Agent CLI: https://cursor.com/install (`agent` on PATH)
#   - Auth: `agent login` or CURSOR_API_KEY
#   - For push: a configured remote; new branches may need `git push -u origin HEAD` once so `git push` succeeds
#
# Environment (optional):
#   CURSOR_AGENT_ITERATIONS   Max agent runs (default: 50). Lower for a short run, e.g. CURSOR_AGENT_ITERATIONS=1.
#   CURSOR_AGENT_FORCE_SHELL  If 1, pass --force so the agent can run shell without per-command approval (default: 1). Set to 0 for safer approval prompts. --force allows arbitrary commands: use a dedicated branch and review diffs.
#   CURSOR_AGENT_WORKSPACE    Repo root (default: git top-level from current directory).
#   CURSOR_AGENT_MODEL        Passed as --model to agent (default: composer-2 = Composer 2). Override e.g. composer-2-fast or auto.
#   CURSOR_AGENT_EXTRA        Extra instructions appended to the built-in prompt.
#   CURSOR_AGENT_VERBOSE      If 1, stream agent progress (tools, partial text) to the terminal via stream-json (default: 1). Set to 0 for final text only.
#
# After each successful iteration this script always runs git push (the agent must not push; it commits, then the host pushes).
#
# Usage:
#   ./scripts/cursor-agent-loop.sh
#   CURSOR_AGENT_ITERATIONS=3 ./scripts/cursor-agent-loop.sh
#   CURSOR_AGENT_FORCE_SHELL=0 ./scripts/cursor-agent-loop.sh   # prompt before each agent shell command
#   CURSOR_AGENT_VERBOSE=0 ./scripts/cursor-agent-loop.sh        # quiet: only final assistant text
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STREAM_FORMATTER="${SCRIPT_DIR}/cursor-agent-stream-format.py"

ITERATIONS="${CURSOR_AGENT_ITERATIONS:-50}"
FORCE_SHELL="${CURSOR_AGENT_FORCE_SHELL:-1}"
VERBOSE="${CURSOR_AGENT_VERBOSE:-1}"
WORKSPACE="${CURSOR_AGENT_WORKSPACE:-}"
MODEL="${CURSOR_AGENT_MODEL:-composer-2}"
EXTRA="${CURSOR_AGENT_EXTRA:-}"

if ! command -v agent >/dev/null 2>&1; then
  echo "error: 'agent' not found. Install Cursor Agent CLI: https://cursor.com/install" >&2
  exit 1
fi

if [[ "$VERBOSE" == "1" ]]; then
  if ! command -v python3 >/dev/null 2>&1; then
    echo "warning: python3 not found; install Python 3 or set CURSOR_AGENT_VERBOSE=0" >&2
    VERBOSE=0
  elif [[ ! -f "$STREAM_FORMATTER" ]]; then
    echo "warning: missing ${STREAM_FORMATTER}; set CURSOR_AGENT_VERBOSE=0" >&2
    VERBOSE=0
  fi
fi

if [[ -z "$WORKSPACE" ]]; then
  WORKSPACE="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    echo "error: not inside a git repository (set CURSOR_AGENT_WORKSPACE)" >&2
    exit 1
  }
fi

cd "$WORKSPACE"

current_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ "$current_branch" == "main" ]]; then
  echo "warning: will push to main after each iteration; use a feature branch if that is not intended." >&2
fi

case "$ITERATIONS" in
'' | *[!0-9]*)
  echo "error: CURSOR_AGENT_ITERATIONS must be a positive integer (got: ${ITERATIONS})" >&2
  exit 1
  ;;
esac
if [[ "$ITERATIONS" -lt 1 ]]; then
  echo "error: CURSOR_AGENT_ITERATIONS must be >= 1" >&2
  exit 1
fi

build_prompt() {
  cat <<EOF
You are working on @geometra/renderer-three, a small TypeScript package that composes Three.js with Geometra's geometry-streamed canvas client. Respect docs/GEOMETRA_NATIVE_SPACE.md, README.md, and .cursor/rules if present.

Single iteration — do exactly one cohesive, meaningful slice of work:

1. Explore the codebase. Read docs/GEOMETRA_NATIVE_SPACE.md and README.md. Browse src/ (split-host, utils, public exports). When protocol or renderer-canvas behavior is unclear, use the main Geometra monorepo (https://github.com/razroo/geometra) as reference — do not guess public APIs.

2. Decide what to work on. Use this priority order:
   a) Items aligned with docs/GEOMETRA_NATIVE_SPACE.md and README "Roadmap (not in v0)" (scene-graph protocol, stacked overlay, headless Three helpers, AI/protocol parity).
   b) If those are not the right bite for one iteration, improve the package on your own initiative. Examples:
      - Tests (add vitest or a minimal check if none exist yet — keep tooling minimal unless the task is explicitly testing)
      - Type safety, JSDoc on exported APIs
      - Bug fixes and edge cases in split-host resize, WebGL sizing, or lifecycle (destroy)
      - Performance or clarity refactors without behavior change
      - Fix TODO/FIXME/HACK in src/
      Prefer one primary concern per iteration (split-host, utils, or docs). Avoid wide drive-by refactors.

   c) Self-improve this loop: when scripts/cursor-agent-loop.sh or its header comments are stale or omit heuristics that would help later runs, prefer a minimal accurate edit to that script if that is higher leverage than the next feature.

3. Implement with minimal scope: only files and changes required for this one task. Match existing naming, imports (.js extensions in TS sources per this repo), and patterns.

4. Run the repo release gate from the repo root:
   npm run release:gate
   If that fails, fix issues and re-run until it passes (or stop with a clear explanation if blocked by environment).

5. If you made real changes: git add only what belongs to this task, then git commit with a conventional message (feat:/fix:/chore:/docs:/test:/perf:/refactor: as appropriate).
   After a successful commit, do not run git push; the host script always runs git push immediately after this agent exits.

6. Do not force-push. Do not rewrite published history.

7. End your response with a final line: DONE

${EXTRA}
EOF
}

agent_cmd=(agent -p --trust --workspace "$WORKSPACE")
if [[ "$VERBOSE" == "1" ]]; then
  agent_cmd+=(--output-format stream-json --stream-partial-output)
else
  agent_cmd+=(--output-format text)
fi
if [[ "$FORCE_SHELL" == "1" ]]; then
  agent_cmd+=(--force)
fi
agent_cmd+=(--model "$MODEL")

i=1
while true; do
  if [[ "$i" -gt "$ITERATIONS" ]]; then
    break
  fi

  echo "=== cursor-agent-loop: iteration $i of ${ITERATIONS} ===" >&2
  prompt="$(build_prompt)"
  agent_status=0
  if [[ "$VERBOSE" == "1" ]]; then
    set +e
    "${agent_cmd[@]}" "$prompt" | python3 "$STREAM_FORMATTER"
    pipe_statuses=("${PIPESTATUS[@]}")
    set -e
    agent_status=${pipe_statuses[0]}
    fmt_status=${pipe_statuses[1]:-0}
    if [[ "$fmt_status" -ne 0 ]]; then
      echo "error: stream formatter exited non-zero ($fmt_status) on iteration $i" >&2
      exit "$fmt_status"
    fi
  else
    set +e
    "${agent_cmd[@]}" "$prompt"
    agent_status=$?
    set -e
  fi
  if [[ "$agent_status" -ne 0 ]]; then
    echo "error: agent exited non-zero ($agent_status) on iteration $i" >&2
    exit "$agent_status"
  fi

  git push

  i=$((i + 1))
done

echo "=== cursor-agent-loop: finished ${ITERATIONS} iteration(s) ===" >&2

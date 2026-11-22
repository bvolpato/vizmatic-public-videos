# Authoring Guide for Agents and Contributors

This repository is a public, MIT-licensed factory for cinematic technical explainers built with [Vizmatic](https://bvolpato.github.io/vizmatic/). Keep every file, narration script, caption, and example 100% public and vendor-neutral.

## Design Philosophy: Cinema, Not PowerPoint

An explainer fails when it looks like a narrated slide deck. Follow these visual rules on every new video:

1. **Zero slide chrome:** Do not add top title banners, horizontal divider bars, chapter counters (`01 / 05`), or rectangular bullet-point cards. Let the living mechanism occupy the entire `1920 x 1080` canvas (`bleed: true`, `bloom: 0.22–0.24`, background `#070910`).
2. **Hook within 15 seconds:** Keep `timeline.intro` short (`0.6–0.8 s`) so autoplay thumbnails open directly on glowing motion. The first 15 seconds must show a striking visual payoff and state the core promise.
3. **Keep every second alive:** Use continuous motion (`dynamic`, `scene3d` camera orbits, flowing particle trails, morphing curves, vibrating waves, expanding shockwave rings). Avoid static 15-second holds.
4. **Use Vizmatic's strongest primitives:**
   - **3D math & systems:** `scene3d`, `surface`, `parametricSurface`, `curve3d`, `line3d`, `point3d`, `view.orbit(...)`.
   - **Glowing trails & light:** `new Node(polyPath(pts)).stroke(grad, width, opacity).glow(radius, color)`, `radialGradient` nebulae (`nebula()`), deterministic `starfield()`, and `dot().glow()`.
   - **Shared palette (`factory/style.ts`):** One color means one concept throughout a video. Keep all visible text `>= 26 px` for phone readability.
5. **Compute real models, assert invariants:** Never fake math or geometry. Precompute lookup tables (such as Borwein zeta grids or explicit-formula curves) at module scope so 30 fps renders stay fast, and verify key invariants with `assertEqual` from `vizmatic/stage`.
6. **End on a memorable finale:** Close with a clean, iconic visual and one crisp takeaway sentence paired with a subtle `bell` or `resolve` chime.

## Efficient Vizmatic Workflow

1. **Scaffold first:** Run `npm run new -- <slug> "<Title>"` (or place a multi-part series under `videos/<series>/<01-part>`).
2. **Finalize `script.json` before animating:** Keep narration tight, active, and conversational (2:30–3:30 is ideal for shareable explainers). Keep `pronounce` entries for Kokoro; ElevenLabs speaks `beat.say` directly.
3. **Synthesize voice and timing once:**
   - Default free local Kokoro: `uv run factory/build.py <slug> --voice-only`
   - Optional ElevenLabs studio voice: configure `.env` from `.env.example` (`VIZMATIC_VOICE_PROVIDER=elevenlabs`, `ELEVENLABS_VOICE=bella`) and run the same command.
   - Commit `timing.json` so typechecks, `vizmatic check`, and CI work without re-synthesizing voice.
4. **Prevent timing traps:**
   - Inside scenes, always use `c.at(...)` (scene-relative time), never `s.at(...)` (absolute film time).
   - Every `s.play(...)` inside a scene must finish before the scene's last beat + hold ends.
   - Guard hidden `dynamic(...)` nodes by returning `[]` when their visibility value is `< 0.02`.
   - Never share the exact same phrase cue for both `c.swap(..., target)` and `c.on(..., animate(target))` if the object is added once.
   - When using ElevenLabs takes (`-el-` WAVs), skip Kokoro's `retimeBeatCaptions` so native ElevenLabs word timings stay exact.
5. **Check & visually inspect before full 1080p renders:**
   ```sh
   uv run factory/build.py <slug> --check-only
   node node_modules/vizmatic/dist/cli.js film videos/<slug>/film.ts --frame 2,12,45,90 --width 1280 --out videos/<slug>/stills/preview
   ```
   Open rendered stills and inspect spacing, margins, and readability with your own eyes before running the full render.
6. **Full render, poster, and gallery:**
   ```sh
   uv run factory/build.py <slug>
   npm run site
   ```

## CI & GitHub Pages Behavior

- `.github/workflows/ci.yml` runs on every PR: installs Vizmatic, runs `uv run factory/build.py --all --check-only` (TypeScript + `vizmatic check`), verifies `npm run site`, and runs the Rust Cargo lab tests (`videos/rust-concurrency/lab`).
- `.github/workflows/pages.yml` runs on `main`: uses `factory/build.py --changed` with **Kokoro** (never ElevenLabs) to render only modified videos — or automatically rebuilds **all** videos when `factory/`, `package.json`, or `tsconfig.base.json` changes — then publishes the static watch gallery to GitHub Pages.

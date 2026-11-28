# Authoring Guide for Agents and Contributors

This repository is a public, MIT-licensed factory for cinematic technical explainers built with [Vizmatic](https://bvolpato.github.io/vizmatic/). Keep every file, narration script, caption, and example 100% public and vendor-neutral.

## Design Philosophy: Cinema, Not PowerPoint

An explainer fails when it looks like a narrated slide deck. Follow these rules on every new video:

1. **Zero slide chrome or clutter:** Do not add top title banners, horizontal divider bars, chapter counters (`01 / 05`), rectangular bullet-point cards, academic caveats, author-citation footnotes, or CLI disclaimers unless essential to the story. Let the living mechanism occupy the full `1920 x 1080` canvas (`bleed: true`, `bloom: 0.22-0.24`, background `#070910`) with generous dark breathing room.
2. **Scroll-stopper hook from frame 0 (no split-second intro flash):** Set `intro: false` and `firstSceneTransition: 'cut'` in `film.ts` so every MP4 opens directly onto glowing motion in Scene 1 (`hook`) with zero flashing title card. Keep dedicated thumbnail compositions in `scenes/poster.ts` (`export const poster: IntroFunction`); `factory/build.py` renders `poster.png` directly from `scenes/poster.ts` at 1920x1080 (or falls back to `meta.json`'s `posterAt` timestamp when no `scenes/poster.ts` exists). State the core stakes and visual payoff immediately (no textbook warmups), and aim for a tight **2:30-3:30** runtime for high retention on X and YouTube.
3. **Teach mechanisms, not dry timelines:** Show *how* algorithms and systems actually work using live crossing arrows with traveling photons, block decompositions, sweeping laser cutters, shrinking error waves, and 3D geometric morphs instead of lingering on static history charts.
4. **Make scale and hard math intuitive for non-specialists:**
   - Anchor astronomical numbers directly to intuitive physical scales (for example, `2^266 ≈ 10^80`, roughly every atom in the observable universe).
   - Explain abstract barriers and proofs through concrete everyday metaphors first (such as a black-box cheat-sheet or a hardness-detector paradox) before showing formal terms.
   - Ground frontier topics in primary sources (actual repository code, merged Lean proofs, exact formulas) and distinguish clearly between what is proved vs. still open.
5. **Keep every second alive:** Use continuous motion (`dynamic`, `scene3d` camera orbits, flowing particle trails, morphing curves, vibrating waves, radial flashes). Avoid static 15-second holds.
6. **Diversify poster compositions across the gallery:** Never repeat the exact same poster layout on adjacent videos in `site/`. Rotate across left-editorial, mirrored right-editorial, top-title full-bleed, bottom-anchored 3D centerpiece, and dual-world split layouts.
7. **Use Vizmatic's strongest primitives cleanly:**
   - **3D math & systems:** `scene3d`, `surface`, `parametricSurface`, `curve3d`, `line3d`, `point3d`, `view.orbit(...)`.
   - **Closed-pole spheres & exact rings:** On `parametricSurface` spheres, sample polar angle `v` across `[0, 1]` (`phi = v * Math.PI`) so poles never show black holes, and use `resolution: [56, 32]` or higher (`samples: 200+` on `curve3d` rings) so silhouettes stay silky smooth. Compute latitude rings with exact geometry (`r = Math.sqrt(R * R - z * z) + 0.03`) and tilted great circles with `[R * cos(a), R * sin(a) * cos(t), R * sin(a) * sin(t)]` (plus yaw rotation so orbits never pinch edge-on).
   - **Zero gradient banding:** `factory/style.ts`'s `nebula()` automatically builds a 9-stop C1 cosine-power radial gradient and expands stage-wide background nebulas (`radius >= 700`) past the 1920x1080 corners. Avoid 3-stop low-alpha radial gradients or sharp `[0.85 -> 1.0]` halo rings; use thin stroked glowing circles or multi-stop bell curves instead. Final renders in `factory/build.py` default to `libx264` with `--dither` so dark gradients never band under hardware H.264 encoders.
   - **3/4 side-angle 3D depth:** For sequential planes or barriers, angle the camera from the side (`theta ~ -1.3`) with subtle baseline rails so layers separate crisply left-to-right instead of stacking head-on.
   - **Dynamic growing 3D paths:** `curve3d` samples once at build time; use an array of `line3d(() => p0, () => p1)` segments when a 3D trajectory needs to draw itself progressively during playback.
   - **Shared palette (`factory/style.ts`):** One color means one concept throughout a video. Keep all visible text `>= 26 px` for phone readability.
8. **Compute real models, assert invariants:** Never fake math or geometry. Precompute lookup tables at module scope so 30 fps renders stay fast, and verify key invariants in `film.ts` with `assertEqual` from `vizmatic/stage` (such as Strassen's 7-product identity, exact rectangular exponents, or 3-SAT witness verification).
9. **End on a memorable finale:** Close with a clean, iconic visual and one crisp takeaway sentence paired with a subtle `bell` or `resolve` chime.

## Efficient Vizmatic Workflow

1. **Scaffold first:**
   ```sh
   npm run new -- <slug> "<Title>"
   ```
   Set `"featured": true` and `"published": "YYYY-MM-DD"` in `videos/<slug>/meta.json` when you want a new release featured in the homepage spotlight.
2. **Finalize `script.json` before animating:**
   - Keep narration tight, active, and conversational (`2:30-3:30`).
   - Write `beat.say` so ElevenLabs can speak it cleanly directly (for example `"omega"`, `"cat zero"`, `"Lean four"`, `"three-SAT"`), while keeping `pronounce` entries for Kokoro.
   - Verify every `film.json` `mix.effects` entry uses `{ scene, beat, word, sound, gain }` with valid sound names (`bell`, `latch`, `resolve`) matching an exact word in that beat.
3. **Synthesize voice and timing once:**
   - Default free local Kokoro: `uv run factory/build.py <slug> --voice-only`
   - Optional ElevenLabs studio voice: configure `.env` from `.env.example` (`VIZMATIC_VOICE_PROVIDER=elevenlabs`, `ELEVENLABS_VOICE=liam`, `ELEVENLABS_SPEED=1.08`) and run the same command.
   - Commit `timing.json` so typechecks, `vizmatic check`, and CI work without re-synthesizing voice.
4. **Prevent timing and motion traps:**
   - Inside scenes, always use `c.at(...)` (scene-relative time), never `s.at(...)` (absolute film time).
   - Every `s.play(...)` inside a scene must finish before the scene's last beat + hold ends.
   - Guard hidden `dynamic(...)` nodes by returning `[]` when their visibility value is `< 0.02`.
   - Sequence dynamic crossfades using `showA.to(0, { duration: 0.16 })` + `delay(showB.to(1, { duration: 0.28 }), 0.2)` so outgoing and incoming text never overlap.
   - Route arrows strictly through text-free corridors, and prefer crisp static 2D captions flanking orbiting `scene3d` models over orbiting `label3d` tags that can collide with wireframes.
   - Never share the exact same phrase cue for both `c.swap(..., target)` and `c.on(..., animate(target))` if the object is added once.
   - When using ElevenLabs takes (`-el-` WAVs), skip Kokoro's `retimeBeatCaptions` so native ElevenLabs word timings stay exact.
5. **Check at 30 fps and visually inspect stills before full 1080p renders:**
   ```sh
   uv run factory/build.py <slug> --check-only
   (cd videos/<slug> && node ../../node_modules/vizmatic/dist/cli.js check film.ts --motion --text-size 26)
   node node_modules/vizmatic/dist/cli.js film videos/<slug>/film.ts --frame 0.45,18,45,90,140 --width 1280 --out videos/<slug>/stills/preview
   ```
   Open every rendered preview still and inspect 3D alignment, margins, readability, and clutter with your own eyes, then delete temporary `stills/preview` directories before finishing. Target **0 errors, 0 warnings** on `--check-only` and **0 non-intro findings** on `--motion`.
6. **Full render, poster, and gallery (including `llms.txt`):**
   ```sh
   uv run factory/build.py <slug>
   npm run site
   ```
   Keep each video's `videos/<slug>/README.md` (with the video goal, embedded `![<Title>](poster.png)` intro/poster screenshot, and scene outline), plus root `llms.txt` and `README.md`, updated whenever you add a new video; `npm run site` copies `llms.txt` to `site/llms.txt` for GitHub Pages automatically.

## CI & GitHub Pages Behavior

- `.github/workflows/ci.yml` runs on every PR and push to `main`: restores or builds pinned Vizmatic (cached under `.cache`), runs `uv run factory/build.py --all --check-only` (TypeScript + `vizmatic check`), verifies `node factory/build-site.mjs`, and runs the Rust Cargo lab tests (`videos/rust-concurrency/lab`).
- `.github/workflows/pages.yml` runs on `main`: warms the pinned Vizmatic cache in `plan`, fans out one parallel matrix job per video using **Kokoro** (never ElevenLabs), caches `uv` packages, HuggingFace Kokoro weights, per-video audio (`audio/`, `narration.wav`, `timing.json`), and per-video renders (`dist/`, `poster.png`), and then builds and publishes `site/` (including `site/llms.txt`) to GitHub Pages. Unchanged stages are skipped locally and in CI.

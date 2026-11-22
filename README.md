# Vizmatic Public Videos

Open-source, code-first cinematic explainer videos covering mathematics, Rust concurrency, Linux virtualization, `io_uring`, and formal verification — authored in TypeScript and rendered reproducibly with **[Vizmatic](https://bvolpato.github.io/vizmatic/)**.

Every video in this repository is built as code: exact numerical math, live 3D surfaces, conformal grid warps, state-machine visualizations, synchronized word-level captions, subtle musical sound cues, and an automated GitHub Pages gallery.

## Video Catalog

| Video | Category | What it teaches | Source |
| --- | --- | --- | --- |
| **The Riemann Hypothesis: Music of the Primes** | Mathematics | 15-second `$1,000,000` shockwave hook, 1,681-star Ulam prime galaxy, prime staircase vs Gauss curve, orbiting 3D $\|\zeta(s)\|$ landscape, conformal complex warp, critical-line spiral, and explicit-formula prime wave synthesis. | [videos/riemann-hypothesis](videos/riemann-hypothesis/) |
| **Rust Concurrency: Ownership Across Time** | Systems | Data-race prevention at compile time, `Send`/`Sync` compiler gate (`E0277`), `Mutex<T>` owning its data, `std::thread::scope`, bounded channels, 48-byte `Future` state machines, Tokio work stealing, `JoinSet`/`Semaphore`, and zero-mutex actor pipelines. Includes a runnable Rust 2024 + Tokio Cargo lab. | [videos/rust-concurrency](videos/rust-concurrency/) |
| **MicroVMs & KVM: From One CPU Instruction to Sub-Second Sandboxes** | Linux & Virtualization | Consolidates Linux KVM hardware virtualization (VMX non-root/root, VM exits, EPT) with AWS Firecracker's minimal Rust VMM, `seccomp`/jailer walls, and copy-on-write snapshot clones. | [videos/linux-microvms](videos/linux-microvms/) |
| **io_uring: Inside Linux's Zero-Syscall I/O Engine** | Linux & Storage | Consolidates `io_uring`'s twin lock-free shared rings (`SQ`/`CQ`), batching and `SQPOLL` zero-syscall mode, below-the-rings page cache vs `O_DIRECT` + `blk-mq` to NVMe, and ring restriction policies. | [videos/io-uring](videos/io-uring/) |
| **Proofs for Real Systems (1/3): Why Tests Miss the Bug** | Formal Verification Series | 32-bit binary search overflow geometry (`50%` of valid pairs fail), the verification spectrum (Tests -> Z3 SMT -> TLA+ -> Lean 4), and why proofs matter even more when AI writes code. | [videos/formal-verification/01-why-prove](videos/formal-verification/01-why-prove/) |
| **Proofs for Real Systems (2/3): TLA+ & the Five-Step Bug** | Formal Verification Series | Distributed order-retry protocol, live TLC explicit-state BFS uncovering a 5-step duplicate-shipment counterexample, atomic receipt repair, and weak vs strong fairness. | [videos/formal-verification/02-tla-plus](videos/formal-verification/02-tla-plus/) |
| **Proofs for Real Systems (3/3): Lean 4 & the Shape of a Proof** | Formal Verification Series | Tail-recursive list reversal tiles, why naive induction gets stuck on an empty accumulator, generalizing the hypothesis, and Lean 4's tiny trusted kernel. | [videos/formal-verification/03-lean4](videos/formal-verification/03-lean4/) |

## Quickstart

### Prerequisites

- **Node.js 20+**
- **[uv](https://docs.astral.sh/uv/)** (manages local Python environments for Kokoro TTS, ElevenLabs, and audio mixing)
- **FFmpeg** with `libx264` and `aac`

### Install & Check

```sh
./factory/setup-vizmatic.sh
npm run check
```

### Build One Video or All Videos (Kokoro by default)

By default, the factory uses local **Kokoro** synthesis (free, runs offline on Apple Silicon Metal or CPU, spends zero API credits):

```sh
uv run factory/build.py riemann-hypothesis
uv run factory/build.py --all
```

Pass `--draft` for a fast 720p preview render, `--check-only` to run TypeScript and `vizmatic check` without rendering, or `--changed origin/main` to rebuild only modified videos (rebuilding all videos automatically whenever `factory/`, `package.json`, or `tsconfig.base.json` changes).

### Multi-Layer Caching & Parallel Pages Deploys

Both local runs and GitHub Actions cache every expensive stage independently:

- **Voice cache (`audio/*.wav`, `timing.json`, and `audio/.cache/voice.json`):** Changing scene code or animations skips voice synthesis completely. When you edit one line of `script.json`, both Kokoro and ElevenLabs still reuse unchanged per-beat `.wav` files under `audio/`.
- **Mix cache (`narration.wav` and `audio/.cache/mix.json`):** Changing visuals skips sound mixing. Changing only `film.json["mix"]` skips voice synthesis and remuxes `narration.wav` into the existing MP4 (`ffmpeg -c:v copy`) with zero frame re-rendering.
- **Parallel Pages fan-out (`.github/workflows/pages.yml`):** A `plan` job warms the built Vizmatic cache once, then every video runs in its own parallel matrix job with `actions/cache@v4` for Vizmatic, `uv` Python packages, HuggingFace Kokoro weights, per-video audio, and per-video MP4s. Unchanged videos restore in seconds while changed videos render concurrently.

### Optional: Studio Voices with ElevenLabs

Copy `.env.example` to `.env` (gitignored) and enable ElevenLabs locally:

```sh
cp .env.example .env
```

Edit `.env`:

```env
VIZMATIC_VOICE_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=sk_...          # or save to ~/.config/fido/elevenlabs_api_key (chmod 600)
ELEVENLABS_VOICE=bella             # presets: bella | sarah | alice | matilda | jessica | lily (or any voice_id)
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_SPEED=1.10
```

Then build any video as usual:

```sh
uv run factory/build.py riemann-hypothesis
```

`factory/voice_elevenlabs.py` calls ElevenLabs' `/with-timestamps` endpoint at 24 kHz PCM, converts native character alignments into Vizmatic word timings, and caches every take under `audio/` by content hash. GitHub Actions always defaults to Kokoro so CI never spends ElevenLabs credits.

### Build the Static Watch Gallery

```sh
npm run site
open site/index.html
```

## Create a New Video

Scaffold a new cinematic video in one command:

```sh
npm run new -- my-topic "My Topic Title"
uv run factory/build.py my-topic --draft
```

## How We Make Killer Videos with Vizmatic

See [AGENTS.md](AGENTS.md) for the complete authoring and verification guide used by both humans and coding agents:

1. **Full-bleed cinema, never PowerPoint:** No top slide header bars, no horizontal divider lines, no `01 / 05` slide counters, and no boxy bullet cards. Use the full `1920 x 1080` dark canvas (`bleed: true`, `bloom: 0.22`), deterministic pinpoint starfields, radial nebulae, glowing curves (`.glow()`), and real 3D cameras (`scene3d`, `surface`, `line3d`, `point3d`).
2. **Hook in the first 15 seconds:** Keep the silent intro under one second (`intro: 0.7`), open on live motion, and deliver an immediate visual payoff before diving into mechanics.
3. **Compute every curve and invariant:** Compute real mathematical models and assert key properties at build time with `assertEqual` from `vizmatic/stage` so the visuals cannot disagree with the narration.
4. **Sync sound and motion to spoken words:** Drive animations from spoken phrase cues (`c.on`, `c.show`, `c.swap`) and pair major reveals with subtle built-in sound effects (`bell`, `resolve`, `latch`) in `film.json`.
5. **Verify visually before shipping:** Run `vizmatic check --text-size 26`, inspect rendered preview stills and contact sheets, verify full FFmpeg decode, and listen to audio clips.

## License

MIT — see [LICENSE](LICENSE). Built with [Vizmatic](https://bvolpato.github.io/vizmatic/).

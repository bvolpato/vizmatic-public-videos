# Vizmatic Public Videos

Open-source, code-first cinematic explainer videos covering AI internals, mathematics, quantum interference, cryptography, Rust concurrency, distributed consensus, Linux virtualization, and storage -- authored in TypeScript and rendered reproducibly with **[Vizmatic](https://bvolpato.github.io/vizmatic/)**.

Every video in this repository is built as code: exact numerical math, live 3D surfaces, conformal grid warps, state-machine visualizations, synchronized word-level captions, subtle musical sound cues, and an automated GitHub Pages gallery (with an agent-ready [`llms.txt`](llms.txt) published alongside the site).

## Video Catalog (20 Explainers)

### AI & ML Internals

| Video | What it teaches | Source |
| --- | --- | --- |
| **FlashAttention: Why GPUs Spend 90% of Their Time Waiting** | H100 memory wall (`989 TFLOP/s` vs `3.35 TB/s` HBM3), Roofline climb, orbiting 3D tiled `Q K^T` SRAM vault (`O(N^2)` to `O(N^2 d / M)`), and exact online softmax rescaling (`< 1e-12`). | [videos/flash-attention](videos/flash-attention/) |
| **Diffusion & Flow Matching: How AI Sculpts Noise Into Reality** | 1,240-particle Gaussian transport, marginal velocity fields, 50-step curved Diffusion vs 4-step straight Rectified Flow ODE race, and live-morphing 3D probability density manifold `p_t(x)`. | [videos/flow-matching](videos/flow-matching/) |
| **RoPE: Why LLMs Spin Clocks to Remember Long Context** | Concentric harmonic frequency clocks (`theta_i = 10000^(-2i/d)`), complex relative-angle dot product, 3D multi-frequency helix + attention-decay surface `K(Delta)`, and NTK/YaRN context scaling. | [videos/rope-long-context](videos/rope-long-context/) |
| **KV Cache & Speculative Decoding: How LLMs Hit 1,000 Tokens/sec** | Autoregressive HBM bottleneck, orbiting 3D PagedAttention virtual-to-physical KV cubes (`< 4%` waste + shared prefixes), and exact lossless rejection sampling (`|P_spec(x) - p(x)| < 1e-12`). | [videos/speculative-decoding](videos/speculative-decoding/) |

### Mathematics & Quantum Physics

| Video | What it teaches | Source |
| --- | --- | --- |
| **P vs NP: The $1,000,000 Problem & the Live AI Proof Fleet** *(Millennium Prize #3)* | Exponential search (`2^300` vs universe atoms) vs linear 3-SAT verification, what breaks if `P = NP` vs `P != NP`, three proof walls explained intuitively in 3D, and the live `pequalnp.com` Lean 4 AI proof fleet (`42,500+` PRs). | [videos/p-vs-np](videos/p-vs-np/) |
| **Matrix Multiplication: Why ω = 9/4 Changes Computing** | Live crossing-wire Strassen (`8 -> 7`), Border Rank & Laser block packing, polynomial degenerations, CAT(0) tripod geometry (`6 / (8/3) = 9/4`), the exact `α = 1/2` rectangular law, and real AI/GPU implications. | [videos/matrix-exponent](videos/matrix-exponent/) |
| **The Riemann Hypothesis: Music of the Primes** | 15-second `$1,000,000` shockwave hook, 1,681-star Ulam prime galaxy, prime staircase vs Gauss curve, orbiting 3D `|zeta(s)|` landscape, conformal complex warp, critical-line spiral, and explicit-formula prime wave synthesis. | [videos/riemann-hypothesis](videos/riemann-hypothesis/) |
| **The Navier-Stokes $1,000,000 Problem: Why Turbulence Breaks Math** *(Millennium Prize #2)* | Kelvin-Helmholtz vortex shear, divergence-free Lamb-Oseen vortex advection, 3D vortex stretching, orbiting 3D enstrophy blow-up spire, and Kolmogorov `k^(-5/3)` energy cascade. | [videos/navier-stokes](videos/navier-stokes/) |
| **The Fourier Transform: Turning Chaos Into Epicycles & Music** | Spinning golden DFT epicycles, complex winding machine (`2, 5, 8 Hz` peaks), exact Parseval energy conservation, and orbiting 3D STFT spectrogram sparse-ridge compression (`MP3`, `JPEG`, `Wi-Fi`). | [videos/fourier-transform](videos/fourier-transform/) |
| **Gödel & the Halting Problem: Why No AI Can Prove Every Truth** | Prime-power Gödel numbering, self-reference mirror, Turing's `8x8` diagonal Halting paradox, and an orbiting 3D archipelago of formal proof showing why truth always outgrows axioms. | [videos/godel-halting](videos/godel-halting/) |
| **Quantum Computing Without the Hype: Shor's Algorithm & Interference** | Translucent orbiting 3D Bloch sphere (`H` and `Rz` phase gates), modular period finding (`7^x mod 15`, `r = 4`), and exact `M = 32` QFT phasor cancellation spiking only at the secret period. | [videos/shors-algorithm](videos/shors-algorithm/) |

### Cryptography, Distributed Systems & Linux

| Video | What it teaches | Source |
| --- | --- | --- |
| **Zero-Knowledge Proofs: Proving a Secret Without Showing a Bit** | 192-byte proof vault, R1CS arithmetization (`x^3 + x + 5 = 35`), orbiting 3D Schwartz-Zippel honest vs forged polynomial surfaces, and homomorphic elliptic-curve hiding. | [videos/zk-snarks](videos/zk-snarks/) |
| **Raft Consensus & Split-Brain: Why Distributed Systems Survive Partitions** | 5-node network partition, randomized election timers, minority `2/5` ghost entry vs majority `3/5` commit + term fencing, and orbiting 3D quorum-intersection planes (`2q - N >= 1`). | [videos/raft-consensus](videos/raft-consensus/) |
| **Inside an SSD: B-Trees vs LSM-Trees and the Write-Amplification Wall** | 4 KB writes vs 4 MB flash erase blocks (`10x-30x` write amp), B-Tree random leaf mutations, orbiting 3D leveled LSM pyramid (`L0 -> L3`), and `0.82%` FPR Bloom filter laser gates. | [videos/lsm-vs-btree](videos/lsm-vs-btree/) |
| **Rust Concurrency: Ownership Across Time** | Data-race prevention at compile time, `Send`/`Sync` compiler gate (`E0277`), `Mutex<T>` owning its data, `std::thread::scope`, bounded channels, 48-byte `Future` state machines, Tokio work stealing, and zero-mutex actors. Includes a runnable Rust 2024 + Tokio Cargo lab. | [videos/rust-concurrency](videos/rust-concurrency/) |
| **MicroVMs & KVM: From One CPU Instruction to Sub-Second Sandboxes** | Linux KVM hardware virtualization (VMX non-root/root, VM exits, EPT), Firecracker's minimal Rust VMM, `seccomp`/jailer walls, and copy-on-write snapshot clones. | [videos/linux-microvms](videos/linux-microvms/) |
| **io_uring: Inside Linux's Zero-Syscall I/O Engine** | Twin lock-free shared rings (`SQ`/`CQ`), batching and `SQPOLL` zero-syscall mode, page cache vs `O_DIRECT` + `blk-mq` to NVMe, and ring restriction policies. | [videos/io-uring](videos/io-uring/) |

### Formal Verification Series

| Video | What it teaches | Source |
| --- | --- | --- |
| **Proofs for Real Systems (1/3): Why Tests Miss the Bug** | 32-bit binary search overflow geometry (`50%` of valid pairs fail), the verification spectrum (Tests -> Z3 SMT -> TLA+ -> Lean 4), and why proofs matter even more when AI writes code. | [videos/formal-verification/01-why-prove](videos/formal-verification/01-why-prove/) |
| **Proofs for Real Systems (2/3): TLA+ & the Five-Step Bug** | Distributed order-retry protocol, live TLC explicit-state BFS uncovering a 5-step duplicate-shipment counterexample, atomic receipt repair, and weak vs strong fairness. | [videos/formal-verification/02-tla-plus](videos/formal-verification/02-tla-plus/) |
| **Proofs for Real Systems (3/3): Lean 4 & the Shape of a Proof** | Tail-recursive list reversal tiles, why naive induction gets stuck on an empty accumulator, generalizing the hypothesis, and Lean 4's tiny trusted kernel. | [videos/formal-verification/03-lean4](videos/formal-verification/03-lean4/) |

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
ELEVENLABS_VOICE=liam              # presets: liam | will | chris | eric | brian | bella | sarah | alice | matilda | jessica | lily (or any voice_id)
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

/**
 * Exact, self-contained mathematical computations for The Fourier Transform film.
 * Includes exact Discrete Fourier Transform (DFT) and inverse DFT, Parseval energy
 * conservation verification, complex winding machine W(f), epicycle harmonic chains,
 * and a computed 2D Short-Time Fourier Transform (STFT) spectrogram surface.
 */

export type Complex = readonly [number, number]

export interface EpicycleTerm {
    readonly freq: number
    readonly re: number
    readonly im: number
    readonly amp: number
    readonly phase: number
}

/** Exact Discrete Fourier Transform: X[k] = sum_{n=0}^{N-1} x[n] e^{-2 pi i k n / N}. */
export function dft(samples: readonly Complex[]): Complex[] {
    const N = samples.length
    const out: Complex[] = new Array(N)
    const factor = (-2 * Math.PI) / N
    for (let k = 0; k < N; k++) {
        let re = 0
        let im = 0
        for (let n = 0; n < N; n++) {
            const [xr, xi] = samples[n]!
            const ang = factor * k * n
            const c = Math.cos(ang)
            const s = Math.sin(ang)
            re += xr * c - xi * s
            im += xr * s + xi * c
        }
        out[k] = [re, im]
    }
    return out
}

/** Exact Inverse Discrete Fourier Transform: x[n] = (1/N) sum_{k=0}^{N-1} X[k] e^{2 pi i k n / N}. */
export function idft(coeffs: readonly Complex[]): Complex[] {
    const N = coeffs.length
    const out: Complex[] = new Array(N)
    const factor = (2 * Math.PI) / N
    for (let n = 0; n < N; n++) {
        let re = 0
        let im = 0
        for (let k = 0; k < N; k++) {
            const [Xr, Xi] = coeffs[k]!
            const ang = factor * k * n
            const c = Math.cos(ang)
            const s = Math.sin(ang)
            re += Xr * c - Xi * s
            im += Xr * s + Xi * c
        }
        out[n] = [re / N, im / N]
    }
    return out
}

/** Parseval time-domain energy: sum |x[n]|^2. */
export function parsevalTimeEnergy(samples: readonly Complex[]): number {
    let sum = 0
    for (const [re, im] of samples) sum += re * re + im * im
    return sum
}

/** Parseval frequency-domain energy: (1/N) sum |X[k]|^2. */
export function parsevalFreqEnergy(coeffs: readonly Complex[]): number {
    const N = coeffs.length
    let sum = 0
    for (const [re, im] of coeffs) sum += re * re + im * im
    return sum / N
}

/** Max Euclidean round-trip error between samples and idft(dft(samples)). */
export function maxRoundTripError(samples: readonly Complex[]): number {
    const reconstructed = idft(dft(samples))
    let err = 0
    for (let i = 0; i < samples.length; i++) {
        const [ar, ai] = samples[i]!
        const [br, bi] = reconstructed[i]!
        err = Math.max(err, Math.hypot(ar - br, ai - bi))
    }
    return err
}

/** Convert DFT coefficients into signed-frequency epicycle terms sorted by amplitude descending. */
export function toEpicycleTerms(coeffs: readonly Complex[]): EpicycleTerm[] {
    const N = coeffs.length
    const half = Math.floor(N / 2)
    const terms: EpicycleTerm[] = coeffs.map(([re, im], k) => {
        const freq = k <= half ? k : k - N
        const cr = re / N
        const ci = im / N
        return {
            freq,
            re: cr,
            im: ci,
            amp: Math.hypot(cr, ci),
            phase: Math.atan2(ci, cr),
        }
    })
    terms.sort((a, b) => b.amp - a.amp)
    return terms
}

/** Evaluate epicycle chain using the top `count` terms at normalized time u in [0, 1]. */
export function evalEpicycles(
    terms: readonly EpicycleTerm[],
    u: number,
    count: number,
): { centers: Complex[]; tip: Complex } {
    const n = Math.min(count, terms.length)
    let x = 0
    let y = 0
    const centers: Complex[] = [[0, 0]]
    for (let i = 0; i < n; i++) {
        const term = terms[i]!
        const ang = 2 * Math.PI * term.freq * u + term.phase
        x += term.amp * Math.cos(ang)
        y += term.amp * Math.sin(ang)
        centers.push([x, y])
    }
    return { centers, tip: [x, y] }
}

/** Cumulative energy fraction captured by the top `count` sorted epicycle terms. */
export function epicycleEnergyFraction(terms: readonly EpicycleTerm[], count: number): number {
    let total = 0
    let partial = 0
    const n = Math.min(count, terms.length)
    for (let i = 0; i < terms.length; i++) {
        const e = terms[i]!.amp * terms[i]!.amp
        total += e
        if (i < n) partial += e
    }
    return total > 0 ? partial / total : 0
}

// ── Hero Hook Contour: Luminous 5-lobed Star-Trefoil ──────────────────────────
export const HOOK_N = 128
export const HOOK_CONTOUR: Complex[] = Array.from({ length: HOOK_N }, (_, i) => {
    const u = (2 * Math.PI * i) / HOOK_N
    // Crisp closed star-trefoil contour built from harmonic circles
    const re =
        1.0 * Math.cos(u) +
        0.44 * Math.cos(-4 * u + 0.35) +
        0.22 * Math.cos(6 * u - 0.5) +
        0.13 * Math.cos(-9 * u + 0.8) +
        0.07 * Math.cos(11 * u)
    const im =
        1.0 * Math.sin(u) +
        0.44 * Math.sin(-4 * u + 0.35) +
        0.22 * Math.sin(6 * u - 0.5) +
        0.13 * Math.sin(-9 * u + 0.8) +
        0.07 * Math.sin(11 * u)
    return [re, im] as Complex
})
export const HOOK_DFT: Complex[] = dft(HOOK_CONTOUR)
export const HOOK_EPICYCLES: EpicycleTerm[] = toEpicycleTerms(HOOK_DFT)

// ── Scene 3 Contour: Stylized Heart-Star Harmonic Silhouette (128-point DFT) ──
export const SHAPE_N = 128
export const SHAPE_CONTOUR: Complex[] = Array.from({ length: SHAPE_N }, (_, i) => {
    const t = (2 * Math.PI * i) / SHAPE_N
    // Classic parametric heart modulated with subtle harmonic crystalline cusp flares
    const hx = 16 * Math.pow(Math.sin(t), 3)
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    const starMod = 1 + 0.14 * Math.cos(5 * t) + 0.06 * Math.sin(7 * t)
    return [(hx / 16.5) * starMod, (hy / 16.5) * starMod + 0.12] as Complex
})
export const SHAPE_DFT: Complex[] = dft(SHAPE_CONTOUR)
export const SHAPE_EPICYCLES: EpicycleTerm[] = toEpicycleTerms(SHAPE_DFT)

// ── Scene 2: Complex Winding Machine g(t) * e^{-2 pi i f t} ───────────────────
export const WINDING_FREQS = [2, 5, 8] as const
export const WINDING_AMPS = [0.46, 0.54, 0.42] as const
export const WINDING_DC = 1.48
export const WINDING_T = 2.0 // 2 seconds -> exact integer cycles at every 0.5 Hz!

/** Composite 3-note signal g(t) with hidden pure frequencies at 2 Hz, 5 Hz, and 8 Hz. */
export function windingSignal(t: number): number {
    return (
        WINDING_DC +
        WINDING_AMPS[0] * Math.cos(2 * Math.PI * WINDING_FREQS[0] * t) +
        WINDING_AMPS[1] * Math.cos(2 * Math.PI * WINDING_FREQS[1] * t) +
        WINDING_AMPS[2] * Math.cos(2 * Math.PI * WINDING_FREQS[2] * t)
    )
}

/** Exact complex winding center of mass with Hann windowing to suppress DC sidelobes cleanly. */
export function windingCenterOfMass(f: number, samples = 360): Complex {
    let re = 0
    let im = 0
    const dt = WINDING_T / samples
    for (let i = 0; i < samples; i++) {
        const t = (i + 0.5) * dt
        const hann = 1 - Math.cos((2 * Math.PI * t) / WINDING_T)
        const g = windingSignal(t) * hann
        const ang = -2 * Math.PI * f * t
        re += g * Math.cos(ang)
        im += g * Math.sin(ang)
    }
    return [re / samples, im / samples]
}

/** Precomputed high-resolution spectrum |W(f)| over f in [1.0, 9.6] Hz. */
export const SPEC_F_MIN = 1.0
export const SPEC_F_MAX = 9.6
export const SPEC_SAMPLES = 280
export const WINDING_SPECTRUM: readonly { f: number; re: number; im: number; mag: number }[] = Array.from(
    { length: SPEC_SAMPLES },
    (_, i) => {
        const f = SPEC_F_MIN + ((SPEC_F_MAX - SPEC_F_MIN) * i) / (SPEC_SAMPLES - 1)
        const [re, im] = windingCenterOfMass(f, 320)
        return { f, re, im, mag: Math.hypot(re, im) }
    },
)

// ── Scene 4: Computed 3D STFT Time-Frequency Spectrogram Surface ──────────────
// Signal: Warm musical major triad chord (f = 1.6, 2.0, 2.4) + rising chirp (0.8 -> 4.4)
// + subtle deterministic broadband floor noise.
export const STFT_NT = 56
export const STFT_NF = 52
export const STFT_FULL_TABLE = new Float32Array(STFT_NT * STFT_NF)
export const STFT_COMPRESSED_TABLE = new Float32Array(STFT_NT * STFT_NF)

function stftSignal(t: number): number {
    // Musical triad chord active across t in [0, 1] at 3 crisp, well-separated harmonic ridges
    const env1 = Math.exp(-Math.pow((t - 0.34) / 0.36, 2))
    const env2 = Math.exp(-Math.pow((t - 0.52) / 0.4, 2))
    const env3 = Math.exp(-Math.pow((t - 0.68) / 0.34, 2))
    const chord =
        1.15 * env1 * Math.cos(2 * Math.PI * 1.05 * 10 * t) +
        1.05 * env2 * Math.cos(2 * Math.PI * 2.05 * 10 * t) +
        0.98 * env3 * Math.cos(2 * Math.PI * 3.15 * 10 * t)
    // Rising chirp from normalized frequency 0.65 -> 4.35
    const f0 = 0.65 * 10
    const f1 = 4.35 * 10
    const chirpPhase = 2 * Math.PI * (f0 * t + 0.5 * (f1 - f0) * t * t)
    const chirpEnv = 0.95 * Math.sin(Math.PI * Math.max(0, Math.min(1, t)))
    const chirp = 1.22 * chirpEnv * Math.cos(chirpPhase)
    // Deterministic gentle noise floor (representing ambient room / quantization hiss)
    const noise =
        0.15 * Math.sin(2 * Math.PI * 47.3 * t + 0.7) +
        0.13 * Math.cos(2 * Math.PI * 63.9 * t + 1.9) +
        0.11 * Math.sin(2 * Math.PI * 81.1 * t + 2.6)
    return chord + chirp + noise
}

;(() => {
    const winN = 64
    const winHalf = 0.145
    for (let it = 0; it < STFT_NT; it++) {
        const tc = it / (STFT_NT - 1)
        for (let jf = 0; jf < STFT_NF; jf++) {
            const freq = (0.3 + (4.5 * jf) / (STFT_NF - 1)) * 10
            let re = 0
            let im = 0
            for (let m = 0; m < winN; m++) {
                const u = m / (winN - 1)
                const hann = 0.5 * (1 - Math.cos(2 * Math.PI * u))
                const tau = tc + (u - 0.5) * 2 * winHalf
                const val = stftSignal(tau) * hann
                const ang = -2 * Math.PI * freq * tau
                re += val * Math.cos(ang)
                im += val * Math.sin(ang)
            }
            const mag = (2 * Math.hypot(re, im)) / (winN * 0.5)
            // Subtle deterministic floor texture so the pre-compression noise floor is clearly visible
            const ripple =
                0.16 +
                0.11 * Math.abs(Math.sin(it * 1.7 + jf * 2.3) * Math.cos(it * 0.9 - jf * 1.4))
            const h = Math.min(2.35, Math.pow(mag, 1.15) * 1.52 + ripple)
            STFT_FULL_TABLE[it * STFT_NF + jf] = h
            // Top ~10% ridge threshold (compression keeps tall spectral ridges, zeros out flat floor!)
            const ridge = h > 0.62 ? (h - 0.44) * 1.28 : 0.015
            STFT_COMPRESSED_TABLE[it * STFT_NF + jf] = Math.min(2.4, ridge)
        }
    }
})()

/** Bilinearly interpolated 3D spectrogram height, blended by `compress` in [0, 1]. */
export function stftHeight(wx: number, wy: number, compress = 0, wxHalf = 3.8, wyHalf = 3.2): number {
    const ut = ((wx + wxHalf) / (2 * wxHalf)) * (STFT_NT - 1)
    const vf = ((wy + wyHalf) / (2 * wyHalf)) * (STFT_NF - 1)
    const i0 = Math.max(0, Math.min(STFT_NT - 2, Math.floor(ut)))
    const j0 = Math.max(0, Math.min(STFT_NF - 2, Math.floor(vf)))
    const fu = Math.max(0, Math.min(1, ut - i0))
    const fv = Math.max(0, Math.min(1, vf - j0))
    const sample = (tbl: Float32Array) => {
        const h00 = tbl[i0 * STFT_NF + j0]!
        const h10 = tbl[(i0 + 1) * STFT_NF + j0]!
        const h01 = tbl[i0 * STFT_NF + j0 + 1]!
        const h11 = tbl[(i0 + 1) * STFT_NF + j0 + 1]!
        return (h00 * (1 - fu) + h10 * fu) * (1 - fv) + (h01 * (1 - fu) + h11 * fu) * fv
    }
    const hFull = sample(STFT_FULL_TABLE)
    if (compress <= 0.001) return hFull
    const hComp = sample(STFT_COMPRESSED_TABLE)
    return hFull + (hComp - hFull) * compress
}

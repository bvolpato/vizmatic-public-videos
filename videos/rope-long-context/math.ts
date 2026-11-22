// Exact mathematical core for Rotary Positional Embeddings (RoPE),
// multi-frequency harmonic interference, and NTK / YaRN context scaling.

export const ROPE_DEFAULT_BASE = 10_000
export const ROPE_DEMO_DIM = 16

/**
 * Geometric frequency ladder: theta_i = base^(-2i / d) for i = 0 .. d/2 - 1.
 * Fast local clocks sit at i = 0; glacially slow long-range clocks sit near d/2 - 1.
 */
export function ropeFreqs(dim: number, base = ROPE_DEFAULT_BASE): number[] {
    const pairs = Math.floor(dim / 2)
    return Array.from({ length: pairs }, (_, i) => Math.pow(base, (-2 * i) / dim))
}

/**
 * NTK-aware base scaling (bloc97 / Code Llama / Llama-3):
 * base' = base * scale^(d / (d - 2)).
 * Stretches low frequencies while barely perturbing the fastest local clock.
 */
export function ntkScaledBase(base: number, scale: number, dim: number): number {
    return base * Math.pow(scale, dim / (dim - 2))
}

/**
 * YaRN frequency interpolation ramp (Peng et al., 2023):
 * High frequencies (short wavelengths) stay unscaled; low frequencies interpolate smoothly.
 */
export function yarnFreqs(dim: number, base: number, scale: number, origMaxCtx = 4096, alpha = 1, beta = 32): number[] {
    const baseFreqs = ropeFreqs(dim, base)
    return baseFreqs.map((theta) => {
        const wavelength = (2 * Math.PI) / theta
        const ratio = origMaxCtx / wavelength
        const ramp = Math.max(0, Math.min(1, (ratio - alpha) / (beta - alpha)))
        return theta * (ramp + (1 - ramp) / scale)
    })
}

/**
 * Exact 2x2 clockwise rotation matrix R(angle) matching complex multiplication by e^(-i * angle).
 * With clockwise rotation:
 *   q_m = R(m * theta) q  <=>  q_c * e^(-i * m * theta)
 *   q_m^T k_n = Re(q_c^H * e^(i * (m - n) * theta) * k_c)
 *   dot(R(m) q, R(n) k) === dot(R(m - n) q, k)
 */
export function rotatePair(x0: number, x1: number, angle: number): [number, number] {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return [x0 * c + x1 * s, -x0 * s + x1 * c]
}

/** Apply block-diagonal RoPE rotation R(pos) to an even-dimensional embedding vector. */
export function applyRoPE(vec: readonly number[], pos: number, freqs: readonly number[]): number[] {
    const out = new Array<number>(vec.length)
    for (let i = 0; i < freqs.length; i++) {
        const idx = 2 * i
        const [rx, ry] = rotatePair(vec[idx]!, vec[idx + 1]!, pos * freqs[i]!)
        out[idx] = rx
        out[idx + 1] = ry
    }
    return out
}

/** Standard Euclidean inner product. */
export function dot(a: readonly number[], b: readonly number[]): number {
    let acc = 0
    for (let i = 0; i < a.length; i++) acc += a[i]! * b[i]!
    return acc
}

/**
 * Complex Hermitian form Re(q^H * diag(e^(i * (m - n) * theta)) * k).
 * Identical to dot(applyRoPE(q, m, freqs), applyRoPE(k, n, freqs)).
 */
export function complexRelativeInnerProduct(
    q: readonly number[],
    k: readonly number[],
    delta: number,
    freqs: readonly number[],
): number {
    let acc = 0
    for (let i = 0; i < freqs.length; i++) {
        const qx = q[2 * i]!
        const qy = q[2 * i + 1]!
        const kx = k[2 * i]!
        const ky = k[2 * i + 1]!
        const ang = delta * freqs[i]!
        const c = Math.cos(ang)
        const s = Math.sin(ang)
        // conj(q) * e^(i*ang) * k = (qx - i*qy) * ((kx*c - ky*s) + i*(kx*s + ky*c))
        const ekx = kx * c - ky * s
        const eky = kx * s + ky * c
        acc += qx * ekx + qy * eky
    }
    return acc
}

/** Normalized multi-frequency cosine interference kernel: (1/P) * sum_i cos(delta * theta_i). */
export function ropeKernel(delta: number, freqs: readonly number[]): number {
    let acc = 0
    for (let i = 0; i < freqs.length; i++) acc += Math.cos(delta * freqs[i]!)
    return acc / freqs.length
}

/** Verify dot(R(m)q, R(n)k) === dot(R(m-n)q, k) and complex form to machine precision. */
export function relativePositionError(
    q: readonly number[],
    k: readonly number[],
    m: number,
    n: number,
    freqs: readonly number[],
): number {
    const lhs = dot(applyRoPE(q, m, freqs), applyRoPE(k, n, freqs))
    const rhs = dot(applyRoPE(q, m - n, freqs), k)
    const cpx = complexRelativeInnerProduct(q, k, m - n, freqs)
    return Math.max(Math.abs(lhs - rhs), Math.abs(lhs - cpx))
}

// Deterministic test vectors for build-time proof assertions
export const PROOF_FREQS = ropeFreqs(ROPE_DEMO_DIM, ROPE_DEFAULT_BASE)
export const PROOF_Q = [0.82, -0.45, 0.31, 0.94, -0.67, 0.28, 0.55, -0.71, 0.19, 0.88, -0.42, -0.36, 0.77, 0.15, -0.59, 0.63] as const
export const PROOF_K = [-0.34, 0.79, 0.65, -0.22, 0.48, 0.81, -0.91, 0.14, 0.73, -0.52, 0.29, 0.64, -0.18, 0.85, 0.44, -0.39] as const

// Precomputed 32-pair (d=64) frequencies for smooth kernel visualization
export const KERNEL_FREQS = ropeFreqs(64, 10_000)

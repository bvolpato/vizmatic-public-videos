/**
 * Exact mathematical models for Shor's Algorithm & Quantum Interference:
 * - Modular exponentiation modPow(base, exp, mod)
 * - Exact Euclidean gcd(a, b)
 * - Exact period finder for a^x mod N (a = 7, N = 15 -> r = 4)
 * - Exact complex Quantum Fourier Transform amplitudes on M = 32 states
 */

export function modPow(base: number, exp: number, mod: number): number {
    let result = 1
    let b = ((base % mod) + mod) % mod
    let e = exp
    while (e > 0) {
        if ((e & 1) === 1) result = (result * b) % mod
        b = (b * b) % mod
        e >>= 1
    }
    return result
}

export function gcd(a: number, b: number): number {
    let x = Math.abs(Math.trunc(a))
    let y = Math.abs(Math.trunc(b))
    while (y !== 0) {
        const t = x % y
        x = y
        y = t
    }
    return x
}

export function findPeriod(a: number, N: number): number {
    if (gcd(a, N) !== 1) {
        throw new Error(`a=${a} and N=${N} must be coprime`)
    }
    let val = a % N
    let r = 1
    while (val !== 1) {
        val = (val * a) % N
        r++
        if (r > N) throw new Error(`Period search exceeded N=${N}`)
    }
    return r
}

export const SHOR_N = 15
export const SHOR_A = 7
export const SHOR_PERIOD = findPeriod(SHOR_A, SHOR_N)
export const QFT_M = 32

/** Exact sequence 7^x mod 15 for x = 0..31. */
export const MOD_SEQUENCE: readonly number[] = Array.from({ length: QFT_M }, (_, x) =>
    modPow(SHOR_A, x, SHOR_N),
)

export interface Complex {
    readonly re: number
    readonly im: number
}

export interface QftBin {
    readonly k: number
    readonly re: number
    readonly im: number
    readonly prob: number
    readonly terms: readonly Complex[]
}

/**
 * Exact complex QFT amplitudes for the post-measurement periodic state
 * |psi> = (1 / sqrt(K)) sum_{m=0}^{K-1} |offset + m * period>
 * on an M-dimensional register (where period divides M).
 */
export function computeQftAmplitudes(M: number, period: number, offset = 0): QftBin[] {
    const xs: number[] = []
    for (let x = offset; x < M; x += period) xs.push(x)
    const norm = 1 / Math.sqrt(M * xs.length)

    return Array.from({ length: M }, (_, k) => {
        let re = 0
        let im = 0
        const terms: Complex[] = []
        for (const x of xs) {
            const angle = (2 * Math.PI * x * k) / M
            const tr = norm * Math.cos(angle)
            const ti = norm * Math.sin(angle)
            terms.push({ re: tr, im: ti })
            re += tr
            im += ti
        }
        return {
            k,
            re,
            im,
            prob: re * re + im * im,
            terms,
        }
    })
}

export const QFT_32: readonly QftBin[] = computeQftAmplitudes(QFT_M, SHOR_PERIOD, 0)
export const QFT_PROB_SUM: number = QFT_32.reduce((acc, bin) => acc + bin.prob, 0)

/** Convert Bloch sphere polar angles (theta from +Z, phi azimuth from +X) to 3D Cartesian point. */
export function blochPoint(theta: number, phi: number, radius = 1): [number, number, number] {
    return [
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta),
    ]
}

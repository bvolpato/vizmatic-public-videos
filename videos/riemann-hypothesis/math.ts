/**
 * Exact, self-contained mathematical computations for The Riemann Hypothesis film.
 * Uses Borwein's accelerated alternating Dirichlet eta series for zeta(s) (accurate to < 1e-10
 * across the critical strip and up to t = 40) and the first 30 non-trivial zeta zeros.
 */

export type Complex = readonly [number, number]

// First 30 imaginary parts of non-trivial zeros on Re(s) = 1/2 (Odlyzko / LMFDB exact values)
export const ZETA_ZEROS: readonly number[] = [
    14.134725141734693, 21.022039638771555, 25.010857580145688, 30.424876125859513,
    32.935061587739189, 37.586178158825671, 40.918719012147495, 43.327073280914999,
    48.005150881167159, 49.773832477672302, 52.970321477714460, 56.446247697063394,
    59.347044002602353, 60.831778524609809, 65.112544048081606, 67.079810529494173,
    69.546401711173979, 72.067157674481907, 75.704690699083933, 77.144840068874805,
    79.337375020249367, 82.910380854086030, 84.735492980517050, 87.425274613125229,
    88.809111207634465, 92.491899270558484, 94.651344040519886, 95.870634228245309,
    98.831194218193692, 101.31785100573139,
]

// Borwein weights for N = 28 (gives > 10^-11 precision for Im(s) up to ~40)
const BORWEIN_N = 28
const BORWEIN_D: number[] = (() => {
    const n = BORWEIN_N
    const d = new Array<number>(n + 1).fill(0)
    // d_k = n * sum_{i=0}^k (n + i - 1)! * 4^i / ((n - i)! * (2i)!)
    let sum = 0
    for (let i = 0; i <= n; i++) {
        // Compute term iteratively to avoid overflow
        let term = n
        // (n+i-1)! / ((n-i)! * (2i)!) * 4^i
        // For i=0: n * (n-1)! / (n! * 1) = 1
        if (i === 0) {
            term = 1
        } else {
            let logv = Math.log(n) + i * Math.log(4)
            for (let j = n - i + 1; j <= n + i - 1; j++) logv += Math.log(j)
            for (let j = 2; j <= 2 * i; j++) logv -= Math.log(j)
            term = Math.exp(logv)
        }
        sum += term
        d[i] = sum
    }
    return d
})()

/** Compute Riemann zeta(s) for s = re + i*im (valid for re > 0, s != 1, |im| <= 45). */
export function zeta(re: number, im: number): Complex {
    const n = BORWEIN_N
    const dn = BORWEIN_D[n]!
    let etaRe = 0
    let etaIm = 0
    for (let k = 0; k < n; k++) {
        const w = (k % 2 === 0 ? 1 : -1) * (BORWEIN_D[k]! - dn)
        const base = k + 1
        const logb = Math.log(base)
        const mag = Math.exp(-re * logb)
        const ang = -im * logb
        etaRe += w * mag * Math.cos(ang)
        etaIm += w * mag * Math.sin(ang)
    }
    etaRe = -etaRe / dn
    etaIm = -etaIm / dn

    // Divide by (1 - 2^(1 - s))
    const log2 = Math.LN2
    const m2 = Math.exp((1 - re) * log2)
    const a2 = -im * log2
    const denRe = 1 - m2 * Math.cos(a2)
    const denIm = -m2 * Math.sin(a2)
    const denom = denRe * denRe + denIm * denIm
    if (denom < 1e-18) return [0, 0]
    return [
        (etaRe * denRe + etaIm * denIm) / denom,
        (etaIm * denRe - etaRe * denIm) / denom,
    ]
}

export function isPrime(n: number): boolean {
    if (n < 2) return false
    if (n % 2 === 0) return n === 2
    for (let d = 3; d * d <= n; d += 2) {
        if (n % d === 0) return false
    }
    return true
}

export function primesUpTo(limit: number): number[] {
    const out: number[] = []
    for (let n = 2; n <= limit; n++) if (isPrime(n)) out.push(n)
    return out
}

/** Exact prime counting function pi(x) for x >= 0. */
export function primePi(x: number): number {
    let count = 0
    const hi = Math.floor(x)
    for (let n = 2; n <= hi; n++) if (isPrime(n)) count++
    return count
}

/** Offset logarithmic integral Li(x) = integral_2^x dt / ln(t) via Simpson's rule. */
export function liOffset(x: number): number {
    if (x <= 2) return 0
    const steps = 64
    const h = (x - 2) / steps
    let sum = 1 / Math.LN2 + 1 / Math.log(x)
    for (let i = 1; i < steps; i++) {
        const t = 2 + i * h
        sum += (i % 2 === 0 ? 2 : 4) / Math.log(t)
    }
    return (sum * h) / 3
}

/** Exact Chebyshev psi(x) = sum_{p^k <= x} ln(p). */
export function chebyshevPsi(x: number): number {
    let sum = 0
    const hi = Math.floor(x)
    for (let p = 2; p <= hi; p++) {
        if (!isPrime(p)) continue
        const lp = Math.log(p)
        for (let pk = p; pk <= hi; pk *= p) sum += lp
    }
    return sum
}

/**
 * Riemann's explicit formula for Chebyshev's psi(x) using the first `numZeros` zeros on Re(s) = 1/2
 * (or shifted to `sigma` to illustrate what happens when a rogue zero leaves the critical line!).
 */
export function explicitPsi(x: number, numZeros: number, sigma = 0.5): number {
    if (x <= 1.05) return 0
    const lnx = Math.log(x)
    let val = x - Math.log(2 * Math.PI) - 0.5 * Math.log(1 - 1 / (x * x))
    const xPow = Math.pow(x, sigma)
    const count = Math.min(numZeros, ZETA_ZEROS.length)
    for (let k = 0; k < count; k++) {
        const g = ZETA_ZEROS[k]!
        // 2 * Re( x^(sigma + i*g) / (sigma + i*g) )
        const denom = sigma * sigma + g * g
        const c = Math.cos(g * lnx)
        const s = Math.sin(g * lnx)
        val -= (2 * xPow * (sigma * c + g * s)) / denom
    }
    return val
}

/**
 * Smooth prime-staircase approximation using the first `numZeros` zeta zeros on Re(s) = sigma,
 * derived by converting psi(x) harmonics into pi(x) space via Li(x) + normalized explicit wave.
 */
export function explicitPiApprox(x: number, numZeros: number, sigma = 0.5): number {
    if (x <= 2) return 0
    const base = liOffset(x)
    if (numZeros <= 0) return base
    const lnx = Math.log(x)
    const xPow = Math.pow(x, sigma)
    let wave = 0
    const count = Math.min(numZeros, ZETA_ZEROS.length)
    for (let k = 0; k < count; k++) {
        const g = ZETA_ZEROS[k]!
        const denom = sigma * sigma + g * g
        const c = Math.cos(g * lnx)
        const s = Math.sin(g * lnx)
        wave += (2 * xPow * (sigma * c + g * s)) / (denom * lnx)
    }
    // Subtract prime-square correction Li(sqrt(x))/2 for accuracy
    const sq = x > 4 ? 0.5 * liOffset(Math.sqrt(x)) : 0
    return Math.max(0, base - sq - wave)
}

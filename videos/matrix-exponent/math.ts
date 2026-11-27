// Exact mathematical models for the Matrix Multiplication Exponent (omega = 9/4) explainer.
// Formulas match OpenAI Math Release Family 379 (Nov 24, 2026) and MatrixExponent.lean.

export interface HistoricalMilestone {
    readonly year: number
    readonly label: string
    readonly short: string
    readonly omega: number
    readonly kind: 'upper' | 'lower'
}

/** Real historical upper-bound milestones from naive n^3 to omega = 9/4. */
export const UPPER_MILESTONES: readonly HistoricalMilestone[] = [
    { year: 1968, label: 'Naive dot products', short: 'Naive (3.000)', omega: 3.0, kind: 'upper' },
    { year: 1969, label: 'Strassen (7 products)', short: 'Strassen 1969', omega: Math.log2(7), kind: 'upper' },
    { year: 1978, label: 'Pan (trilinear)', short: 'Pan 1978', omega: 2.796, kind: 'upper' },
    { year: 1979, label: 'Bini (border rank)', short: 'Bini 1979', omega: 2.780, kind: 'upper' },
    { year: 1981, label: 'Schönhage (asymptotic sum)', short: 'Schönhage 1981', omega: 2.522, kind: 'upper' },
    { year: 1987, label: 'Coppersmith–Winograd', short: 'CW 1987', omega: 2.3755, kind: 'upper' },
    { year: 2012, label: 'Vassilevska Williams', short: 'VW 2012', omega: 2.3729, kind: 'upper' },
    { year: 2014, label: 'Le Gall', short: 'Le Gall 2014', omega: 2.37286, kind: 'upper' },
    { year: 2024, label: 'Alman et al. (Laser)', short: 'Laser 2024', omega: 2.371339, kind: 'upper' },
    { year: 2026, label: 'Poly. Degenerations', short: '9/4 Exact (2026)', omega: 2.25, kind: 'upper' },
]

/** Exact Lean-formalized rectangular matrix multiplication exponent omega(F; a, b, c)
 *  from OAI.LinearAlgebra.SpectralBooks.rectangular_exponent (MatrixExponent.lean).
 *  Sort nonnegative parts as x >= y >= z >= 0:
 *    omega(a, b, c) = x + y + [max(0, (x + y)*z - x*y)]^2 / (4*x*y*z)  (with 0/0 = 0). */
export function rectangularOmega(a: number, b: number, c: number): number {
    const A = Math.max(a, 0)
    const B = Math.max(b, 0)
    const C = Math.max(c, 0)
    const sorted = [A, B, C].sort((u, v) => v - u)
    const x = sorted[0]!
    const y = sorted[1]!
    const z = sorted[2]!
    if (x === 0 || y === 0 || z === 0) return x + y
    const excess = Math.max(0, (x + y) * z - x * y)
    return x + y + (excess * excess) / (4 * x * y * z)
}

/** Exact dual curve t -> omega(1, 1, t) for multiplying n x n^t by n^t x n.
 *  Flat at 2.00 for 0 <= t <= 1/2 (alpha = 1/2), rising smoothly to 9/4 = 2.25 at t = 1. */
export function omegaOfT(t: number): number {
    return rectangularOmega(1, 1, t)
}

/** Nonscalar multiplication/division gate lower bound from Theorem 1 / Corollary 1:
 *  Every formal arithmetic circuit at side n >= 2 needs at least ceil(n^(9/4) / 2) nonlinear gates. */
export function minNonlinearGates(n: number): number {
    return Math.ceil(Math.pow(n, 2.25) / 2)
}

/** Geometric border rank lower bound for T_n: at least n^(9/4). */
export function minBorderRank(n: number): number {
    return Math.pow(n, 2.25)
}

/** Tripod spectral price ratio:
 *  Three unit arms meeting at a hub give pairwise distances (2, 2, 2) => perimeter = 6.
 *  Shared 3-way label rate D = 8/3 => perimeter / D = 6 / (8/3) = 9/4 = 2.25. */
export const TRIPOD_PERIMETER = 6
export const TRIPOD_SHARED_RATE = 8 / 3
export const SQUARE_EXPONENT = TRIPOD_PERIMETER / TRIPOD_SHARED_RATE // 2.25 exactly
export const DUAL_EXPONENT = 0.5 // alpha = 1/2 exactly

/** Exact 2x2 matrix multiplication using Strassen's 7-product identity (1969). */
export function strassen2x2(
    A: readonly [number, number, number, number],
    B: readonly [number, number, number, number],
): readonly [number, number, number, number] {
    const [a11, a12, a21, a22] = A
    const [b11, b12, b21, b22] = B
    const m1 = (a11 + a22) * (b11 + b22)
    const m2 = (a21 + a22) * b11
    const m3 = a11 * (b12 - b22)
    const m4 = a22 * (b21 - b11)
    const m5 = (a11 + a12) * b22
    const m6 = (a21 - a11) * (b11 + b12)
    const m7 = (a12 - a22) * (b21 + b22)
    return [m1 + m4 - m5 + m7, m3 + m5, m2 + m4, m1 - m2 + m3 + m6]
}

/** Naive 8-product 2x2 matrix multiplication for build-time verification. */
export function naive2x2(
    A: readonly [number, number, number, number],
    B: readonly [number, number, number, number],
): readonly [number, number, number, number] {
    const [a11, a12, a21, a22] = A
    const [b11, b12, b21, b22] = B
    return [
        a11 * b11 + a12 * b21,
        a11 * b12 + a12 * b22,
        a21 * b11 + a22 * b21,
        a21 * b12 + a22 * b22,
    ]
}

/** Precomputed samples of the exact rectangular curve t in [0, 1] -> omega(1, 1, t). */
export const OMEGA_T_CURVE: readonly { readonly t: number; readonly w: number }[] = Array.from(
    { length: 81 },
    (_, i) => {
        const t = i / 80
        return { t, w: omegaOfT(t) }
    },
)

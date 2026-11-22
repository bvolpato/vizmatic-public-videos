/**
 * Exact zk-SNARK arithmetization, Lagrange interpolation, QAP divisibility,
 * and Schwartz-Zippel collision geometry for x^3 + x + 5 = 35 (witness x = 3).
 */

export interface R1CSGate {
    readonly id: number
    readonly label: string
    readonly a: readonly number[]
    readonly b: readonly number[]
    readonly c: readonly number[]
}

// Witness layout: w = [1, out, x, v1, v2, v3]
// Gate 1: x * x = v1         -> 3 * 3 = 9
// Gate 2: v1 * x = v2        -> 9 * 3 = 27
// Gate 3: (v2 + x) * 1 = v3  -> 30 * 1 = 30
// Gate 4: (v3 + 5) * 1 = out -> 35 * 1 = 35
export const R1CS_GATES: readonly R1CSGate[] = [
    { id: 1, label: 'v₁ = x · x', a: [0, 0, 1, 0, 0, 0], b: [0, 0, 1, 0, 0, 0], c: [0, 0, 0, 1, 0, 0] },
    { id: 2, label: 'v₂ = v₁ · x', a: [0, 0, 0, 1, 0, 0], b: [0, 0, 1, 0, 0, 0], c: [0, 0, 0, 0, 1, 0] },
    { id: 3, label: 'v₃ = v₂ + x', a: [0, 0, 1, 0, 1, 0], b: [1, 0, 0, 0, 0, 0], c: [0, 0, 0, 0, 0, 1] },
    { id: 4, label: 'out = v₃ + 5', a: [5, 0, 0, 0, 0, 1], b: [1, 0, 0, 0, 0, 0], c: [0, 1, 0, 0, 0, 0] },
]

export function buildHonestWitness(x: number): number[] {
    const v1 = x * x
    const v2 = v1 * x
    const v3 = v2 + x
    const out = v3 + 5
    return [1, out, x, v1, v2, v3]
}

export const HONEST_WITNESS: readonly number[] = buildHonestWitness(3)
// A 1-bit forgery: claims out = 35 while corrupting v1 from 9 to 10
export const FORGED_WITNESS: readonly number[] = [1, 35, 3, 10, 27, 30]

function dotVec(u: readonly number[], v: readonly number[]): number {
    let sum = 0
    for (let i = 0; i < u.length; i++) sum += u[i]! * v[i]!
    return sum
}

export interface R1CSEvaluation {
    readonly left: number[]
    readonly right: number[]
    readonly out: number[]
    readonly residuals: number[]
    readonly unsatisfiedCount: number
}

export function evaluateR1CS(witness: readonly number[]): R1CSEvaluation {
    const left: number[] = []
    const right: number[] = []
    const out: number[] = []
    const residuals: number[] = []
    let unsatisfiedCount = 0
    for (const gate of R1CS_GATES) {
        const l = dotVec(gate.a, witness)
        const r = dotVec(gate.b, witness)
        const o = dotVec(gate.c, witness)
        const res = l * r - o
        left.push(l)
        right.push(r)
        out.push(o)
        residuals.push(res)
        if (Math.abs(res) > 1e-9) unsatisfiedCount++
    }
    return { left, right, out, residuals, unsatisfiedCount }
}

/** Polynomial arithmetic in ascending degree order: coeffs[k] is coefficient of t^k. */
export function polyAdd(a: readonly number[], b: readonly number[]): number[] {
    const n = Math.max(a.length, b.length)
    const out = new Array<number>(n).fill(0)
    for (let i = 0; i < n; i++) out[i] = (a[i] ?? 0) + (b[i] ?? 0)
    return out
}

export function polySub(a: readonly number[], b: readonly number[]): number[] {
    const n = Math.max(a.length, b.length)
    const out = new Array<number>(n).fill(0)
    for (let i = 0; i < n; i++) out[i] = (a[i] ?? 0) - (b[i] ?? 0)
    return out
}

export function polyMul(a: readonly number[], b: readonly number[]): number[] {
    const out = new Array<number>(a.length + b.length - 1).fill(0)
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
            out[i + j] = out[i + j]! + a[i]! * b[j]!
        }
    }
    return out
}

export function polyScale(a: readonly number[], s: number): number[] {
    return a.map((c) => c * s)
}

export function evalPoly(coeffs: readonly number[], t: number): number {
    let acc = 0
    for (let i = coeffs.length - 1; i >= 0; i--) acc = acc * t + coeffs[i]!
    return acc
}

/** Exact Lagrange interpolation through points (xs[i], ys[i]). */
export function lagrangeInterpolate(xs: readonly number[], ys: readonly number[]): number[] {
    let total: number[] = [0]
    for (let i = 0; i < xs.length; i++) {
        let basis: number[] = [1]
        let denom = 1
        for (let j = 0; j < xs.length; j++) {
            if (i === j) continue
            basis = polyMul(basis, [-xs[j]!, 1])
            denom *= xs[i]! - xs[j]!
        }
        total = polyAdd(total, polyScale(basis, ys[i]! / denom))
    }
    return total
}

/** Polynomial long division: returns { quotient, remainder } such that num = quotient * den + remainder. */
export function polyDiv(num: readonly number[], den: readonly number[]): { quotient: number[]; remainder: number[] } {
    const rem = [...num]
    let degDen = den.length - 1
    while (degDen > 0 && Math.abs(den[degDen]!) < 1e-12) degDen--
    const leadDen = den[degDen]!
    const qLen = Math.max(1, rem.length - degDen)
    const quotient = new Array<number>(qLen).fill(0)

    for (let i = rem.length - 1; i >= degDen; i--) {
        const factor = rem[i]! / leadDen
        quotient[i - degDen] = factor
        for (let j = 0; j <= degDen; j++) {
            rem[i - degDen + j] = rem[i - degDen + j]! - factor * den[j]!
        }
    }
    return { quotient, remainder: rem }
}

export const GATE_ROOTS = [1, 2, 3, 4] as const
// Vanishing polynomial Z(t) = (t - 1)(t - 2)(t - 3)(t - 4)
export const VANISHING_POLY: readonly number[] = GATE_ROOTS.reduce<number[]>(
    (acc, r) => polyMul(acc, [-r, 1]),
    [1],
)

export interface QAPCheck {
    readonly L: number[]
    readonly R: number[]
    readonly O: number[]
    readonly P: number[]
    readonly H: number[]
    readonly remainder: number[]
    readonly maxRemainder: number
}

export function buildQAP(witness: readonly number[]): QAPCheck {
    const ev = evaluateR1CS(witness)
    const L = lagrangeInterpolate(GATE_ROOTS, ev.left)
    const R = lagrangeInterpolate(GATE_ROOTS, ev.right)
    const O = lagrangeInterpolate(GATE_ROOTS, ev.out)
    const P = polySub(polyMul(L, R), O)
    const { quotient: H, remainder } = polyDiv(P, VANISHING_POLY)
    const maxRemainder = remainder.reduce((m, c) => Math.max(m, Math.abs(c)), 0)
    return { L, R, O, P, H, remainder, maxRemainder }
}

export const HONEST_QAP = buildQAP(HONEST_WITNESS)
export const FORGED_QAP = buildQAP(FORGED_WITNESS)

// Smooth wire trace polynomial interpolating gate outputs [9, 27, 30, 35] at t = 1..4
export const WIRE_TRACE_POLY = lagrangeInterpolate(GATE_ROOTS, [9, 27, 30, 35])

/** Schwartz-Zippel Lemma upper bound on accidental equality for degree d over field size F. */
export function schwartzZippelBound(degree: number, fieldOrder: number): number {
    return degree / fieldOrder
}

// BN254 scalar field order (~2.1888e77)
export const BN254_FIELD_ORDER = 2.1888242871839275e77

/**
 * Exact bivariate polynomial surfaces for the 3D Schwartz-Zippel visualization.
 * Honest P(x, y) is a smooth degree-4 polynomial surface.
 * Forged Q(x, y) differs by D(x, y) = 0.22 * (x^2 - y^2 - 0.65) * (1 + 0.08*x*y),
 * so P(x, y) === Q(x, y) ONLY along the razor-thin hyperbola x^2 - y^2 = 0.65!
 */
export function honestPoly3D(x: number, y: number): number {
    return (
        0.55
        + 0.16 * (x * x - 0.6 * y * y)
        - 0.022 * (x * x * x * x + y * y * y * y)
        + 0.14 * x * y
        + 0.18 * Math.cos(0.7 * x) * Math.cos(0.65 * y)
    )
}

export function forgedDelta3D(x: number, y: number): number {
    return 0.19 * (x * x - y * y - 0.55)
}

export function forgedPoly3D(x: number, y: number): number {
    return honestPoly3D(x, y) + forgedDelta3D(x, y)
}

// Random verifier challenge point (r_x, r_y) landing in open space far from the intersection hyperbola
export const CHALLENGE_RX = -0.35
export const CHALLENGE_RY = 1.65
export const CHALLENGE_HONEST_Z = honestPoly3D(CHALLENGE_RX, CHALLENGE_RY)
export const CHALLENGE_FORGED_Z = forgedPoly3D(CHALLENGE_RX, CHALLENGE_RY)
export const CHALLENGE_GAP = Math.abs(CHALLENGE_HONEST_Z - CHALLENGE_FORGED_Z)

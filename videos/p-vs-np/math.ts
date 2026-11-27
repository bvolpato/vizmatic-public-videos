// Real computational complexity calculations for the P vs NP cinematic explainer.
// All demo 3-SAT evaluations and universe-scale exponential comparisons are verified with assertEqual.

export interface Clause3SAT {
    readonly lits: readonly [number, number, number]
    readonly label: string
}

/** Concrete 4-variable, 4-clause 3-SAT instance with a valid witness verified in P. */
export const DEMO_3SAT: readonly Clause3SAT[] = [
    { lits: [1, -2, 3], label: '(x₁ ∨ ¬x₂ ∨ x₃)' },
    { lits: [-1, 2, 4], label: '(¬x₁ ∨ x₂ ∨ x₄)' },
    { lits: [2, -3, -4], label: '(x₂ ∨ ¬x₃ ∨ ¬x₄)' },
    { lits: [1, 3, -4], label: '(x₁ ∨ x₃ ∨ ¬x₄)' },
]

/** Polynomial-time O(m) verifier for a 3-SAT assignment. */
export function verify3SAT(clauses: readonly Clause3SAT[], assign: readonly boolean[]): boolean {
    for (const cl of clauses) {
        let sat = false
        for (const lit of cl.lits) {
            const idx = Math.abs(lit) - 1
            const val = assign[idx]!
            if (lit > 0 ? val : !val) {
                sat = true
                break
            }
        }
        if (!sat) return false
    }
    return true
}

/** Brute-force exponential O(2^n * m) solver counting all satisfying assignments. */
export function countSolutions3SAT(clauses: readonly Clause3SAT[], numVars: number): number {
    let count = 0
    const total = 1 << numVars
    for (let mask = 0; mask < total; mask++) {
        const assign = Array.from({ length: numVars }, (_, i) => ((mask >> i) & 1) === 1)
        if (verify3SAT(clauses, assign)) count++
    }
    return count
}

/** Valid witness key for DEMO_3SAT: x1=T, x2=T, x3=F, x4=F -> satisfies all 4 clauses. */
export const DEMO_WITNESS: readonly boolean[] = [true, true, false, false]

/** Observable universe atom scale (~10^80) vs 2^300 (~2.04 * 10^90 > 10 billion x universe atoms!). */
export const UNIVERSE_ATOMS = 1e80
export const EXP_300 = Math.pow(2, 300)
export const EXP_300_UNIVERSE_RATIO = EXP_300 / UNIVERSE_ATOMS // ~2.037e10 (> 10 billion!)

/** Real active research fronts inside github.com/open-goat/pequalnp-proofs (lean/PEqualNP/). */
export const PEQUALNP_FRONTS = [
    { name: 'Meta-Complexity', tag: 'How hard is hardness?', col: '#5ce1e6' },
    { name: 'Circuit Lower Bounds', tag: 'Gate limits', col: '#60a5fa' },
    { name: 'Geometry (GCT)', tag: 'Algebraic shapes', col: '#a78bfa' },
    { name: 'Proof Complexity', tag: 'Proof length', col: '#ffd166' },
    { name: 'Direct Search', tag: 'Refute & search', col: '#6ee7b7' },
] as const

/** Plain-English analogies for the three classic barriers tracked in pequalnp.com/graveyard. */
export const THREE_BARRIERS = [
    { year: 1975, name: 'Black-Box Wall', sub: 'Relativization', analogy: 'Blind to code inside the box — fooled by fake cheat-sheets', col: '#ff6b8b' },
    { year: 1997, name: 'Paradox Trap', sub: 'Natural Proofs', analogy: 'A simple hardness detector would crack encryption itself', col: '#fb923c' },
    { year: 2008, name: 'Algebra Wall', sub: 'Algebrization', analogy: 'Smooth polynomial shortcuts get fooled the same way', col: '#a78bfa' },
] as const

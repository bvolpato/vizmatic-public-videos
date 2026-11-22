/**
 * Exact mathematical models for Gödel Incompleteness and the Halting Problem:
 * - BigInt prime-power Gödel encoder and unique-factorization decoder
 * - 8x8 halting-oracle matrix and diagonal rebel machine contradiction verifier
 */

export const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37] as const

export interface GodelSymbol {
    readonly glyph: string
    readonly code: number
    readonly meaning: string
}

export const GODEL_ALPHABET: readonly GodelSymbol[] = [
    { glyph: '0', code: 1, meaning: 'zero' },
    { glyph: 's', code: 2, meaning: 'successor' },
    { glyph: '=', code: 3, meaning: 'equals' },
    { glyph: '¬', code: 4, meaning: 'not' },
    { glyph: '∃', code: 5, meaning: 'exists' },
    { glyph: '⊢', code: 6, meaning: 'proves' },
    { glyph: 'G', code: 7, meaning: 'sentence G' },
]

/** Encode a sequence of positive integer symbol codes as 2^c0 * 3^c1 * 5^c2 * ... */
export function encodeGodel(codes: readonly number[]): bigint {
    if (codes.length > PRIMES.length) {
        throw new Error(`Sequence length ${codes.length} exceeds prime table size ${PRIMES.length}`)
    }
    let acc = 1n
    for (let i = 0; i < codes.length; i++) {
        const exp = codes[i]!
        if (!Number.isInteger(exp) || exp < 1) {
            throw new Error(`Gödel symbol code must be a positive integer, got ${exp}`)
        }
        acc *= BigInt(PRIMES[i]!) ** BigInt(exp)
    }
    return acc
}

/** Decode a Gödel number back into its exact symbol-code sequence by prime factorization. */
export function decodeGodel(value: bigint): number[] {
    if (value <= 1n) {
        throw new Error(`Gödel number must be > 1, got ${value}`)
    }
    let remaining = value
    const codes: number[] = []
    for (let i = 0; i < PRIMES.length && remaining > 1n; i++) {
        const p = BigInt(PRIMES[i]!)
        let exp = 0
        while (remaining % p === 0n) {
            remaining /= p
            exp++
        }
        if (exp === 0) {
            throw new Error(`Invalid Gödel number: missing prime factor ${p}`)
        }
        codes.push(exp)
    }
    if (remaining !== 1n) {
        throw new Error(`Gödel number has factor beyond table: remainder ${remaining}`)
    }
    return codes
}

/** Sample formula encoded in Scene 2: "¬ ∃ p ⊢ G" represented as compact exponents [4, 5, 2, 6, 3]. */
export const SAMPLE_EXPONENTS = [4, 5, 2, 6, 3] as const
export const SAMPLE_SYMBOLS = ['¬', '∃', 's', '⊢', '='] as const
export const SAMPLE_GODEL_NUMBER = encodeGodel(SAMPLE_EXPONENTS)

/**
 * Illustrative 8x8 oracle prediction matrix H(P_i, j):
 * true  = oracle claims program P_i halts on input j
 * false = oracle claims program P_i loops forever on input j
 */
export const HALT_MATRIX: readonly (readonly boolean[])[] = [
    [true,  false, true,  true,  false, true,  false, true ],
    [false, false, true,  false, true,  true,  false, false],
    [true,  true,  true,  false, false, true,  true,  false],
    [false, true,  false, false, true,  false, true,  true ],
    [true,  false, false, true,  true,  false, true,  false],
    [false, true,  true,  false, false, false, true,  true ],
    [true,  false, true,  true,  false, true,  true,  false],
    [false, true,  false, true,  true,  false, false, false],
] as const

/** Diagonal rebel machine D: on input i, does the opposite of H(P_i, i). */
export function diagonalRebel(matrix: readonly (readonly boolean[])[]): boolean[] {
    return matrix.map((row, i) => !row[i]!)
}

export const REBEL_ROW: readonly boolean[] = diagonalRebel(HALT_MATRIX)

/** Verify that D disagrees with every row i of the oracle table at column i. */
export function verifyDiagonalContradiction(matrix: readonly (readonly boolean[])[]): boolean {
    const rebel = diagonalRebel(matrix)
    for (let i = 0; i < matrix.length; i++) {
        if (rebel[i] === matrix[i]![i]) return false
    }
    return rebel.length === matrix.length
}

// Exact mathematical models for KV-Cache memory & HBM bandwidth,
// PagedAttention block utilization, and Speculative Decoding exactness.

export interface ModelSpec {
    readonly paramsB: number
    readonly layers: number
    readonly kvHeads: number
    readonly headDim: number
    readonly bytesPerElem: number
    readonly hbmBandwidthGBs: number
    readonly peakTflops: number
}

/** Representative 70B GQA-8 FP16 model running on an H100-class GPU (3.35 TB/s, 989 TFLOP/s). */
export const LLAMA_70B_SPEC: ModelSpec = {
    paramsB: 70,
    layers: 80,
    kvHeads: 8,
    headDim: 128,
    bytesPerElem: 2,
    hbmBandwidthGBs: 3350,
    peakTflops: 989,
}

/** Exact bytes of KV cache stored per token (factor 2 for K and V). */
export function kvBytesPerToken(spec: ModelSpec = LLAMA_70B_SPEC): number {
    return 2 * spec.layers * spec.kvHeads * spec.headDim * spec.bytesPerElem
}

/** Total KV cache footprint in gigabytes (decimal GB) for a batch of sequences. */
export function kvCacheGB(seqLen: number, batchSize = 1, spec: ModelSpec = LLAMA_70B_SPEC): number {
    return (batchSize * seqLen * kvBytesPerToken(spec)) / 1e9
}

/**
 * Arithmetic intensity (FLOPs per byte moved from HBM) for decoding `tokensInStep` tokens
 * (e.g., batch=1 decode => 1 token; speculative verify of 5 draft tokens => 5+1=6 tokens).
 */
export function decodeArithmeticIntensity(tokensInStep: number, seqLen: number, spec: ModelSpec = LLAMA_70B_SPEC): number {
    const weightBytes = spec.paramsB * 1e9 * spec.bytesPerElem
    const kvBytes = seqLen * kvBytesPerToken(spec)
    const totalBytes = weightBytes + kvBytes
    const flops = 2 * spec.paramsB * 1e9 * tokensInStep
    return flops / totalBytes
}

/** Hardware roofline ridge point in FLOPs/byte. */
export function hardwareRidgePoint(spec: ModelSpec = LLAMA_70B_SPEC): number {
    return (spec.peakTflops * 1e12) / (spec.hbmBandwidthGBs * 1e9)
}

/** Compare contiguous pre-allocation waste vs PagedAttention fixed-block waste. */
export function pagedWasteComparison(seqLengths: readonly number[], maxSeqLen: number, blockSize: number) {
    const actualTokens = seqLengths.reduce((a, b) => a + b, 0)
    const contiguousAllocated = seqLengths.length * maxSeqLen
    const pagedAllocated = seqLengths.reduce((acc, len) => acc + Math.ceil(len / blockSize) * blockSize, 0)
    return {
        actualTokens,
        contiguousAllocated,
        pagedAllocated,
        contiguousWasteRatio: 1 - actualTokens / contiguousAllocated,
        pagedWasteRatio: 1 - actualTokens / pagedAllocated,
    }
}

/** Acceptance probability alpha(x) = min(1, p(x) / q(x)) for a candidate token x. */
export function acceptanceProb(pVal: number, qVal: number): number {
    if (qVal <= 0) return 0
    return Math.min(1, pVal / qVal)
}

/**
 * Compute the exact residual distribution r(x) = norm(max(0, p(x) - q(x)))
 * and the exact marginal output distribution P_spec(x) of speculative sampling.
 */
export function speculativeSamplingDistribution(p: readonly number[], q: readonly number[]) {
    const n = p.length
    const acceptedMass = new Array<number>(n)
    const rawResidual = new Array<number>(n)
    let beta = 0
    let residualSum = 0

    for (let i = 0; i < n; i++) {
        const a = acceptanceProb(p[i]!, q[i]!)
        const acc = q[i]! * a
        acceptedMass[i] = acc
        beta += acc
        const diff = Math.max(0, p[i]! - q[i]!)
        rawResidual[i] = diff
        residualSum += diff
    }

    const residualDist = rawResidual.map((d) => (residualSum > 0 ? d / residualSum : 0))
    const induced = new Array<number>(n)
    let maxErr = 0
    for (let i = 0; i < n; i++) {
        const pSpec = acceptedMass[i]! + (1 - beta) * residualDist[i]!
        induced[i] = pSpec
        maxErr = Math.max(maxErr, Math.abs(pSpec - p[i]!))
    }

    return { beta, residualDist, induced, maxErr }
}

/** Expected accepted+bonus tokens per verification pass with gamma draft tokens and mean acceptance alpha. */
export function expectedTokensPerVerify(gamma: number, alpha: number): number {
    if (Math.abs(1 - alpha) < 1e-9) return gamma + 1
    return (1 - Math.pow(alpha, gamma + 1)) / (1 - alpha)
}

// Concrete 8-token vocabulary distribution for visual wave + build-time exactness proof
export const DEMO_VOCAB = ['the', 'light', 'speed', 'clock', 'model', 'fast', 'wave', 'zero'] as const
export const DEMO_TARGET_P = [0.06, 0.14, 0.31, 0.19, 0.12, 0.08, 0.06, 0.04] as const
export const DEMO_DRAFT_Q = [0.11, 0.22, 0.18, 0.15, 0.16, 0.07, 0.05, 0.06] as const
export const DEMO_SPEC = speculativeSamplingDistribution(DEMO_TARGET_P, DEMO_DRAFT_Q)

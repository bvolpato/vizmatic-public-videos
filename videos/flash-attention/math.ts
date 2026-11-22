// Real numerical models for FlashAttention:
// 1. Exact naive softmax vs tiled online softmax (with full step-by-step history)
// 2. Exact naive 1D attention vs tiled FlashAttention output
// 3. Real NVIDIA H100 SXM5 Roofline model (FP16 989 TFLOP/s, HBM3 3.35 TB/s, SRAM ~19 TB/s)
// 4. Real HBM byte-traffic model: O(N^2) standard vs O(N^2 * d / M) FlashAttention
// 5. Realistic precomputed Q * K^T / sqrt(d) attention score landscape for 3D tiling

export const H100 = {
    peakTflops: 989,          // FP16 dense Tensor Core peak (TFLOP/s)
    hbmTbs: 3.35,             // HBM3 bandwidth (TB/s)
    hbmGb: 80,                // HBM3 capacity (GB)
    sramTbs: 19.0,            // Aggregated on-chip SRAM bandwidth (TB/s)
    sramMb: 50,               // L2/shared SRAM working pool (MB)
    smCount: 132,             // Streaming Multiprocessors
} as const

export const H100_RIDGE_AI = H100.peakTflops / H100.hbmTbs // ~295.22 FLOP/byte

/** Roofline attainable performance (TFLOP/s) for a given arithmetic intensity (FLOP/byte). */
export function rooflineTflops(ai: number, bandwidthTbs: number = H100.hbmTbs): number {
    return Math.min(H100.peakTflops, ai * bandwidthTbs)
}

/** Exact standard softmax on an arbitrary vector of logits. */
export function naiveSoftmax(logits: readonly number[]): number[] {
    let m = -Infinity
    for (const x of logits) if (x > m) m = x
    const exps = logits.map((x) => Math.exp(x - m))
    let sum = 0
    for (const e of exps) sum += e
    return exps.map((e) => e / sum)
}

export interface OnlineSoftmaxStep {
    tileIndex: number
    start: number
    end: number
    mPrev: number
    mTile: number
    mNew: number
    alphaOld: number
    alphaTile: number
    lPrev: number
    lTile: number
    lNew: number
    /** Exact normalized probabilities over all elements seen so far [0..end-1]. */
    runningProbs: number[]
    /** Unnormalized weights scaled to mNew over [0..end-1]. */
    runningUnnorm: number[]
}

/**
 * Real tiled online softmax (Milakov & Gimelshein 2018 / Dao et al. 2022).
 * Processes logits in tiles of `tileSize`, maintaining only running (m, l) and
 * rescaling previous contributions by exp(m_prev - m_new).
 */
export function onlineSoftmaxTiled(
    logits: readonly number[],
    tileSize: number,
): { probs: number[]; steps: OnlineSoftmaxStep[] } {
    const n = logits.length
    const unnorm: number[] = []
    const steps: OnlineSoftmaxStep[] = []
    let m = -Infinity
    let l = 0

    for (let start = 0, tileIndex = 0; start < n; start += tileSize, tileIndex++) {
        const end = Math.min(n, start + tileSize)
        let mTile = -Infinity
        for (let i = start; i < end; i++) {
            if (logits[i]! > mTile) mTile = logits[i]!
        }
        const mPrev = m
        const mNew = Math.max(mPrev, mTile)
        const alphaOld = mPrev === -Infinity ? 0 : Math.exp(mPrev - mNew)
        const alphaTile = Math.exp(mTile - mNew)

        // Rescale all previously accumulated numerators in place
        for (let i = 0; i < unnorm.length; i++) {
            unnorm[i] = unnorm[i]! * alphaOld
        }

        let lTile = 0
        for (let i = start; i < end; i++) {
            const wTile = Math.exp(logits[i]! - mTile)
            lTile += wTile
            unnorm.push(wTile * alphaTile)
        }

        const lPrev = l
        const lNew = lPrev * alphaOld + lTile * alphaTile
        m = mNew
        l = lNew

        steps.push({
            tileIndex,
            start,
            end,
            mPrev,
            mTile,
            mNew,
            alphaOld,
            alphaTile,
            lPrev,
            lTile,
            lNew,
            runningUnnorm: [...unnorm],
            runningProbs: unnorm.map((u) => u / lNew),
        })
    }

    const probs = unnorm.map((u) => u / l)
    return { probs, steps }
}

/** Exact naive single-query attention: softmax(q * K^T / sqrt(d)) * V */
export function naiveAttention1D(
    q: readonly number[],
    K: readonly (readonly number[])[],
    V: readonly (readonly number[])[],
): number[] {
    const d = q.length
    const invSqrtD = 1 / Math.sqrt(d)
    const logits = K.map((k) => {
        let dot = 0
        for (let j = 0; j < d; j++) dot += q[j]! * k[j]!
        return dot * invSqrtD
    })
    const weights = naiveSoftmax(logits)
    const out = new Array<number>(d).fill(0)
    for (let i = 0; i < weights.length; i++) {
        const w = weights[i]!
        const v = V[i]!
        for (let j = 0; j < d; j++) out[j]! += w * v[j]!
    }
    return out
}

/** Exact tiled FlashAttention single-query forward pass using online softmax rescaling. */
export function tiledAttention1D(
    q: readonly number[],
    K: readonly (readonly number[])[],
    V: readonly (readonly number[])[],
    tileSize: number,
): number[] {
    const d = q.length
    const invSqrtD = 1 / Math.sqrt(d)
    let m = -Infinity
    let l = 0
    const acc = new Array<number>(d).fill(0)

    for (let start = 0; start < K.length; start += tileSize) {
        const end = Math.min(K.length, start + tileSize)
        const scores: number[] = []
        let mTile = -Infinity
        for (let i = start; i < end; i++) {
            let dot = 0
            const k = K[i]!
            for (let j = 0; j < d; j++) dot += q[j]! * k[j]!
            const s = dot * invSqrtD
            scores.push(s)
            if (s > mTile) mTile = s
        }
        const mNew = Math.max(m, mTile)
        const alphaOld = m === -Infinity ? 0 : Math.exp(m - mNew)
        const alphaTile = Math.exp(mTile - mNew)

        for (let j = 0; j < d; j++) acc[j]! *= alphaOld

        let lTile = 0
        for (let idx = 0; idx < scores.length; idx++) {
            const pTile = Math.exp(scores[idx]! - mTile)
            lTile += pTile
            const w = pTile * alphaTile
            const v = V[start + idx]!
            for (let j = 0; j < d; j++) acc[j]! += w * v[j]!
        }

        l = l * alphaOld + lTile * alphaTile
        m = mNew
    }

    return acc.map((x) => x / l)
}

/**
 * HBM byte-transfer model (per attention head, FP16 = 2 bytes):
 * - Standard attention: reads Q,K (2Nd), writes S (N^2), reads S + writes P (2N^2),
 *   reads P,V + writes O (N^2 + 2Nd) => ~4*N^2 + 4*N*d elements in HBM!
 * - FlashAttention: fused in SRAM of capacity M_elems (e.g., 100 KB per SM = 51,200 FP16 elems):
 *   HBM accesses = O(N^2 * d / M) + O(N * d).
 */
export function naiveHbmBytes(N: number, d: number, bytesPerElem = 2): number {
    // Forward pass with causal mask + softmax: read Q,K; write S; read S, write masked S'; read S', write P; read P,V, write O
    return (6 * N * N + 4 * N * d) * bytesPerElem
}

export function flashHbmBytes(N: number, d: number, sramBytesPerSm = 233472, bytesPerElem = 2): number {
    // H100 has 228 KiB (233,472 B) shared SRAM per SM -> Br = floor(M / (2*d)) capped at 256 for FlashAttention-2
    const M = sramBytesPerSm / bytesPerElem
    const br = Math.min(256, Math.max(32, Math.floor(M / (4 * d))))
    const tr = Math.ceil(N / br)
    // Read Q and write O once (2*N*d), stream K,V across Tr outer query blocks (2*N*d*Tr)
    return (2 * N * d + 2 * N * d * tr) * bytesPerElem
}

/** Demo 12-token logit row (3 tiles of 4) engineered so Tile 2 overtakes Tile 1's max! */
export const DEMO_LOGITS = [
    1.1, 2.3, 0.7, 1.5,    // Tile 0: max = 2.3
    0.9, 3.6, 1.8, 2.1,    // Tile 1: max = 3.6 (triggers visible exponential rescale!)
    1.4, 2.5, 4.1, 1.2,    // Tile 2: max = 4.1 (second crisp rescale!)
] as const

export const DEMO_ONLINE = onlineSoftmaxTiled(DEMO_LOGITS, 4)
export const DEMO_EXACT = naiveSoftmax(DEMO_LOGITS)

/** Realistic 3D attention score surface Q * K^T / sqrt(d) over u,v in [0, 1] (causal + semantic ridges). */
export function attentionScoreHeight(u: number, v: number): number {
    // Diagonal locality peak (tokens attend strongly to nearby tokens)
    const diag = Math.exp(-Math.pow((u - v) / 0.11, 2)) * 1.45
    // Attention sink column near v = 0.08 (classic transformer BOS attention sink!)
    const sink = Math.exp(-Math.pow((v - 0.08) / 0.07, 2)) * 0.95
    // Semantic long-range cross-attention peaks
    const p1 = Math.exp(-(Math.pow((u - 0.72) / 0.1, 2) + Math.pow((v - 0.28) / 0.1, 2))) * 1.35
    const p2 = Math.exp(-(Math.pow((u - 0.36) / 0.09, 2) + Math.pow((v - 0.68) / 0.09, 2))) * 1.15
    const p3 = Math.exp(-(Math.pow((u - 0.84) / 0.08, 2) + Math.pow((v - 0.56) / 0.08, 2))) * 1.05
    // Subtle harmonic texture
    const ripple = 0.09 * Math.sin(u * 22) * Math.cos(v * 19)
    return Math.max(0.06, 0.14 + diag + sink + p1 + p2 + p3 + ripple)
}

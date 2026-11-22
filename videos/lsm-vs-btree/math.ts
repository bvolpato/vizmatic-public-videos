/**
 * Real Bloom filter false-positive math and B-Tree vs LSM-Tree SSD write-amplification model.
 */

export const FLASH_PAGE_KB = 4
export const ERASE_BLOCK_KB = 4096 // 4 MB = 1024 x 4 KB pages
export const PAGES_PER_ERASE_BLOCK = ERASE_BLOCK_KB / FLASH_PAGE_KB // 1024
export const BTREE_LEAF_BYTES = 16384 // 16 KB
export const RECORD_UPDATE_BYTES = 100

/** Optimal number of independent Bloom filter hash functions for m/n bits per key. */
export function optimalBloomHashes(bitsPerKey: number): number {
    return Math.max(1, Math.round(bitsPerKey * Math.LN2))
}

/** Exact Bloom filter false-positive probability: (1 - e^{-k * n / m})^k = (1 - e^{-k / b})^k. */
export function bloomFalsePositiveRate(bitsPerKey: number, k: number): number {
    return Math.pow(1 - Math.exp(-k / bitsPerKey), k)
}

export const BLOOM_BITS_PER_KEY = 10
export const BLOOM_OPTIMAL_K = optimalBloomHashes(BLOOM_BITS_PER_KEY) // 7
export const BLOOM_FPR_10BIT = bloomFalsePositiveRate(BLOOM_BITS_PER_KEY, BLOOM_OPTIMAL_K) // ~0.00819 (< 1%)
export const BLOOM_MISS_BYPASS_PCT = (1 - BLOOM_FPR_10BIT) * 100 // ~99.18%

/**
 * SSD Garbage Collection (FTL) write amplification under random overwrites
 * with utilization u (e.g. u = 0.8 -> FTL copies u / (1 - u) = 4x live pages on average,
 * or 1 / (1 - u) = 5x total internal writes; sequential streams achieve ~1.05x).
 */
export function ssdFtlWriteAmp(utilization: number): number {
    return 1 / (1 - utilization)
}

/**
 * Total B-Tree write amplification on flash:
 *   logicalPageAmp (pageBytes / effectiveDirtyBytesPerFlush) * ftlRandomAmp
 * Example: 1 KB average dirty bytes per 16 KB leaf flush (16x) * FTL random GC (1.8x) = 28.8x.
 */
export function btreeTotalWriteAmp(
    pageBytes: number,
    effectiveDirtyBytes: number,
    ftlRandomAmp: number,
): number {
    return (pageBytes / effectiveDirtyBytes) * ftlRandomAmp
}

/**
 * Leveled LSM-Tree write amplification model (e.g., RocksDB / LevelDB):
 *   WAL (1x) + L0 flush (1x) + per-level merge factor across leveled tiers * sequential FTL (~1.05x).
 * Even at 4 levels with T = 10 fanout, sequential FTL stays near 1.05x (no random 4 KB GC fragmentation),
 * and partial-overlap compaction keeps effective steady-state write amp near 6x-10x with 100% sequential I/O.
 */
export function lsmLeveledSequentialFtlAmp(): number {
    return 1.05
}

export const BTREE_PAGE_AMP_100B = BTREE_LEAF_BYTES / RECORD_UPDATE_BYTES // 163.84x single-record worst case
export const BTREE_REAL_WA = btreeTotalWriteAmp(16384, 1024, 1.8) // 28.8x
export const RANDOM_SSD_FTL_WA = ssdFtlWriteAmp(0.6) // 2.5x
export const SEQ_SSD_FTL_WA = lsmLeveledSequentialFtlAmp() // 1.05x

export interface LsmLevelSpec {
    readonly name: string
    readonly capacityLabel: string
    readonly width: number
    readonly depth: number
    readonly z: number
    readonly color: string
    readonly tables: number
}

export const LSM_LEVELS: readonly LsmLevelSpec[] = [
    { name: 'L0', capacityLabel: '64 MB · Unsorted flush', width: 2.0, depth: 1.5, z: 1.7, color: '#ffd166', tables: 3 },
    { name: 'L1', capacityLabel: '640 MB · Sorted runs', width: 3.1, depth: 2.2, z: 0.75, color: '#5ce1e6', tables: 4 },
    { name: 'L2', capacityLabel: '6.4 GB · Sorted runs', width: 4.3, depth: 3.0, z: -0.25, color: '#60a5fa', tables: 5 },
    { name: 'L3', capacityLabel: '64 GB · Cold tier', width: 5.5, depth: 3.8, z: -1.25, color: '#a78bfa', tables: 6 },
]

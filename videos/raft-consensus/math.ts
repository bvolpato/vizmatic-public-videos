/**
 * Exact Raft quorum intersection proof checker and deterministic split-brain
 * log-matching / term-fencing state machine for a 5-node cluster.
 */

export type RaftRole = 'leader' | 'candidate' | 'follower'

export interface LogEntry {
    readonly index: number
    readonly term: number
    readonly command: string
    readonly committed: boolean
}

export interface NodeState {
    readonly id: number
    readonly name: string
    term: number
    role: RaftRole
    log: LogEntry[]
}

/** Generate all subsets of {0, 1, ..., n-1} with size >= minSize. */
export function subsetsAtLeast(n: number, minSize: number): number[][] {
    const result: number[][] = []
    const total = 1 << n
    for (let mask = 0; mask < total; mask++) {
        const subset: number[] = []
        for (let i = 0; i < n; i++) {
            if ((mask & (1 << i)) !== 0) subset.push(i)
        }
        if (subset.length >= minSize) result.push(subset)
    }
    return result
}

/** Generate all subsets of {0, 1, ..., n-1} with exact size k. */
export function subsetsOfSize(n: number, k: number): number[][] {
    return subsetsAtLeast(n, k).filter((s) => s.length === k)
}

export function intersectionSize(a: readonly number[], b: readonly number[]): number {
    const setB = new Set(b)
    let count = 0
    for (const x of a) if (setB.has(x)) count++
    return count
}

/** Verify across EVERY pair of majority subsets (size >= q) the minimum intersection size. */
export function minQuorumIntersection(n: number, q: number): number {
    const quorums = subsetsAtLeast(n, q)
    let minOverlap = n
    for (let i = 0; i < quorums.length; i++) {
        for (let j = i; j < quorums.length; j++) {
            const ov = intersectionSize(quorums[i]!, quorums[j]!)
            if (ov < minOverlap) minOverlap = ov
        }
    }
    return minOverlap
}

export const CLUSTER_SIZE = 5
export const MAJORITY_QUORUM = Math.floor(CLUSTER_SIZE / 2) + 1 // 3
export const ALL_3_OF_5_QUORUMS = subsetsOfSize(CLUSTER_SIZE, MAJORITY_QUORUM)
export const MIN_OVERLAP_5 = minQuorumIntersection(CLUSTER_SIZE, MAJORITY_QUORUM)

export interface PartitionSimulation {
    readonly duringPartitionMinorityCommitted: boolean
    readonly duringPartitionMajorityCommitted: boolean
    readonly healedNodes: NodeState[]
    readonly allAgreeOnTerm2: boolean
    readonly allCommittedX42: boolean
    readonly ghostEntriesRemaining: number
}

/** Deterministic Raft split-brain simulation: {S1,S2} vs {S3,S4,S5} -> heal. */
export function simulateSplitBrain(): PartitionSimulation {
    const nodes: NodeState[] = Array.from({ length: CLUSTER_SIZE }, (_, i) => ({
        id: i + 1,
        name: `S${i + 1}`,
        term: 1,
        role: i === 0 ? 'leader' : 'follower',
        log: [{ index: 1, term: 1, command: 'x = 1', committed: true }],
    }))

    // Partition splits into minority [S1, S2] and majority [S3, S4, S5]
    const minority = [nodes[0]!, nodes[1]!]
    const majority = [nodes[2]!, nodes[3]!, nodes[4]!]

    // Minority stale Term 1 leader S1 appends x = 9 to 2 nodes (< 3 -> CANNOT commit!)
    const minorityCanCommit = minority.length >= MAJORITY_QUORUM
    for (const n of minority) {
        n.log.push({ index: 2, term: 1, command: 'x = 9', committed: minorityCanCommit })
    }

    // Majority elects S3 in Term 2 (3/5 votes) and commits x = 42 across 3 nodes (>= 3 -> COMMITS!)
    const majorityCanCommit = majority.length >= MAJORITY_QUORUM
    for (const n of majority) {
        n.term = 2
        n.role = n.id === 3 ? 'leader' : 'follower'
        n.log.push({ index: 2, term: 2, command: 'x = 42', committed: majorityCanCommit })
    }

    const duringPartitionMinorityCommitted = minority[0]!.log[1]!.committed
    const duringPartitionMajorityCommitted = majority[0]!.log[1]!.committed

    // Partition heals: S3 sends AppendEntries(Term 2, prevIndex=1, prevTerm=1, entry=[T2: x=42])
    const leader = nodes[2]!
    for (const peer of nodes) {
        if (peer.id === leader.id) continue
        if (leader.term > peer.term) {
            peer.term = leader.term
            peer.role = 'follower'
        }
        // Log matching property: overwrite conflicting uncommitted entries at index 2
        const existing = peer.log[1]
        if (!existing || existing.term !== leader.log[1]!.term) {
            peer.log = [peer.log[0]!, { ...leader.log[1]! }]
        }
    }

    const allAgreeOnTerm2 = nodes.every((n) => n.term === 2)
    const allCommittedX42 = nodes.every(
        (n) => n.log.length === 2 && n.log[1]!.command === 'x = 42' && n.log[1]!.committed && n.log[1]!.term === 2,
    )
    const ghostEntriesRemaining = nodes.reduce(
        (cnt, n) => cnt + n.log.filter((e) => e.command === 'x = 9').length,
        0,
    )

    return {
        duringPartitionMinorityCommitted,
        duringPartitionMajorityCommitted,
        healedNodes: nodes,
        allAgreeOnTerm2,
        allCommittedX42,
        ghostEntriesRemaining,
    }
}

export const SPLIT_BRAIN_SIM = simulateSplitBrain()

// 3D positions of the 5 cluster servers in quorum geometry space:
// S3 is the central witness node at the intersection of Quorum Plane A {S1,S2,S3} and Quorum Plane B {S3,S4,S5}!
export const QUORUM_NODES_3D: readonly { readonly name: string; readonly pos: readonly [number, number, number] }[] = [
    { name: 'S1', pos: [-2.4, -1.6, 0.9] },
    { name: 'S2', pos: [-2.1, 1.8, -0.4] },
    { name: 'S3', pos: [0.0, 0.0, 0.35] },
    { name: 'S4', pos: [2.2, -1.7, -0.45] },
    { name: 'S5', pos: [2.4, 1.65, 0.95] },
]

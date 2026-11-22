import {
    Node, circle, curve3d, dot, dynamic, fadeIn, group, line, line3d, linear,
    parametricSurface, points3d, polyPath, rect, scene3d,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

// Dense 36-node branching tactic search tree (depths 0..3: 1 + 4 + 11 + 20 = 36 nodes!)
interface TacticNode {
    readonly id: number
    readonly depth: number
    readonly x: number
    readonly y: number
    readonly parent: number
    readonly winning: boolean
    readonly label?: string
}

const TREE_NODES: TacticNode[] = []
{
    // Depth 0 (1 node): root theorem goal
    TREE_NODES.push({ id: 0, depth: 0, x: -460, y: -270, parent: -1, winning: true, label: '⊢ ∀ xs acc' })

    // Depth 1 (4 tactic nodes): induction (winning!), simp, rw, omega
    const d1Labels = ['induction', 'simp', 'rw', 'omega'] as const
    const d1Xs = [-720, -545, -370, -195] as const
    for (let i = 0; i < 4; i++) {
        TREE_NODES.push({
            id: TREE_NODES.length,
            depth: 1,
            x: d1Xs[i]!,
            y: -145,
            parent: 0,
            winning: i === 0,
            label: d1Labels[i],
        })
    }

    // Depth 2 (11 subgoal nodes across the 4 depth-1 tactics)
    const d2PerParent = [3, 3, 3, 2] as const // sum = 11
    let idx2 = 0
    for (let p = 0; p < 4; p++) {
        const cnt = d2PerParent[p]!
        const pId = 1 + p
        for (let k = 0; k < cnt; k++) {
            const x = -800 + (idx2 / 10) * 680
            const y = -18 + (idx2 % 2) * 20
            TREE_NODES.push({
                id: TREE_NODES.length,
                depth: 2,
                x,
                y,
                parent: pId,
                winning: p === 0 && (k === 0 || k === 2), // base + step subgoals win!
            })
            idx2++
        }
    }

    // Depth 3 (20 leaf search attempts across depth-2 nodes)
    const d2Start = 5
    for (let i = 0; i < 20; i++) {
        const parent = d2Start + (i % 11)
        const pNode = TREE_NODES[parent]!
        const x = -818 + (i / 19) * 716
        const y = 118 + (i % 3) * 22
        const winning = pNode.winning && (i === 0 || i === 2)
        TREE_NODES.push({
            id: TREE_NODES.length,
            depth: 3,
            x,
            y,
            parent,
            winning,
        })
    }
}

// Proof-term compiler streams flowing from winning leaves -> orbiting 3D Lean Kernel crystal
const KERNEL_X = 485
const KERNEL_Y = -58

function bezierStream(p0: Vec, p1: Vec, p2: Vec, p3: Vec, steps = 28): Vec[] {
    const out: Vec[] = []
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const u = 1 - t
        out.push([
            u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
            u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
        ])
    }
    return out
}

const STREAM_PATHS: readonly Vec[][] = [
    bezierStream([-818, 118], [-420, 210], [80, 70], [KERNEL_X - 135, KERNEL_Y + 35], 32),
    bezierStream([-742, 162], [-340, 225], [100, 15], [KERNEL_X - 140, KERNEL_Y], 32),
    bezierStream([-664, -18], [-240, 85], [110, -45], [KERNEL_X - 135, KERNEL_Y - 35], 32),
]

function buildLeanKernelCrystal() {
    const view = scene3d({
        theta: 0.35,
        phi: 1.04,
        distance: 11.4,
        unit: 132,
        perspective: true,
        ambient: 0.45,
        shine: 0.6,
        brightness: 1.18,
        fog: 0.04,
        focus: [0, 0, 0],
    }).at(KERNEL_X, KERNEL_Y)

    const R = 1.38
    const H = 1.85
    const verts: Vec3[] = [
        [0, 0, H],
        [R, 0, 0.25],
        [0, R, 0.25],
        [-R, 0, 0.25],
        [0, -R, 0.25],
        [R * 0.72, R * 0.72, -0.35],
        [-R * 0.72, R * 0.72, -0.35],
        [-R * 0.72, -R * 0.72, -0.35],
        [R * 0.72, -R * 0.72, -0.35],
        [0, 0, -H],
    ]

    // Faceted translucent crystal shell via parametricSurface
    const topFacet = parametricSurface(
        (u, v): Vec3 => {
            const ang = u * Math.PI * 2
            const c = Math.cos(ang)
            const s = Math.sin(ang)
            const sc = 1 / (Math.abs(c) + Math.abs(s))
            return [R * v * c * sc, R * v * s * sc, H * (1 - v) + 0.2 * v]
        },
        [0, 1],
        [0, 1],
        {
            resolution: [16, 6],
            colors: ['#16143b', '#4d329e', '#8b5cf6', '#5ce1e6'],
            mesh: '#a78bfa',
            meshOpacity: 0.38,
            meshWidth: 0.9,
            opacity: 0.64,
        },
    )

    const botFacet = parametricSurface(
        (u, v): Vec3 => {
            const ang = u * Math.PI * 2 + Math.PI / 4
            const c = Math.cos(ang)
            const s = Math.sin(ang)
            const sc = 1 / (Math.abs(c) + Math.abs(s))
            return [R * 0.98 * v * c * sc, R * 0.98 * v * s * sc, -H * (1 - v) - 0.1 * v]
        },
        [0, 1],
        [0, 1],
        {
            resolution: [16, 6],
            colors: ['#0c2f2d', '#1c6b63', '#5ce1e6', '#6ee7b7'],
            mesh: '#6ee7b7',
            meshOpacity: 0.34,
            meshWidth: 0.9,
            opacity: 0.6,
        },
    )

    const edges: [number, number][] = [
        [0, 1], [0, 2], [0, 3], [0, 4],
        [1, 2], [2, 3], [3, 4], [4, 1],
        [1, 5], [2, 5], [2, 6], [3, 6],
        [3, 7], [4, 7], [4, 8], [1, 8],
        [5, 6], [6, 7], [7, 8], [8, 5],
        [9, 5], [9, 6], [9, 7], [9, 8],
    ]
    const edgeObjs = edges.map(([a, b], idx) =>
        line3d(verts[a]!, verts[b]!, {
            color: idx < 8 ? COSMOS.violet : idx < 16 ? COSMOS.cyan : COSMOS.emerald,
            width: 3.2,
            glow: 10,
            blend: 'screen',
            opacity: 0.95,
        }),
    )

    const vertPts = points3d(verts, {
        color: '#ffffff',
        radius: 5.5,
        glow: 14,
        blend: 'screen',
        onTop: true,
    })

    const ringA = curve3d(
        (u, time): Vec3 => {
            const a = u * Math.PI * 2 + time * 0.65
            return [1.85 * Math.cos(a), 1.85 * Math.sin(a), 0.42 * Math.cos(a * 2)]
        },
        0,
        1,
        { color: COSMOS.emerald, width: 2.8, glow: 10, blend: 'screen', animate: true, samples: 48, opacity: 0.85 },
    )
    const ringB = curve3d(
        (u, time): Vec3 => {
            const a = u * Math.PI * 2 - time * 0.5
            return [1.72 * Math.cos(a), 0.5 * Math.sin(a), 1.65 * Math.sin(a)]
        },
        0,
        1,
        { color: COSMOS.cyan, width: 2.4, glow: 8, blend: 'screen', animate: true, samples: 48, opacity: 0.8 },
    )

    view.add(topFacet, botFacet, ...edgeObjs, vertPts, ringA, ringB)
    return view
}

export const kernel: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const prune = s.value(0)   // 0 -> 1 prunes dead tactic branches in rose & highlights winning proof term
    const verified = s.value(0) // 0 -> 1 ignites emerald kernel verification & QED seal

    const header = group(
        txt('Untrusted Search  →  Tiny Trusted Kernel', 0, -424, 52, COSMOS.ink, 'serif').glow(6, COSMOS.violet),
    )

    const crystal = buildLeanKernelCrystal()

    const liveTreeAndStream = dynamic(() => {
        const ph = phase.value
        const pr = prune.value
        const ver = verified.value

        const nodes: Node[] = [
            nebula(-460, -60, 420, '#a78bfa18'),
            nebula(KERNEL_X, KERNEL_Y, 360, ver > 0.35 ? '#6ee7b72c' : '#5ce1e620', '#a78bfa18'),
            // Left search panel backdrop
            rect(794, 558, { fill: '#0b1020', stroke: '#29375a', width: 2.0, radius: 18 }).at(-458, -68),
            txt('36-NODE TACTIC SEARCH TREE  (UNTRUSTED)', -824, -314, 26, COSMOS.muted, 'mono', 'left'),
        ]

        // Draw all 35 edges of the 36-node branching tactic tree (terminate neatly outside pill labels)
        for (const nd of TREE_NODES) {
            if (nd.parent < 0) continue
            const par = TREE_NODES[nd.parent]!
            const isWin = nd.winning
            const edgeCol = isWin ? COSMOS.gold : pr > 0.25 ? COSMOS.rose : '#3d517d'
            const edgeOp = isWin ? 0.96 : pr > 0.25 ? Math.max(0.16, 0.55 - pr * 0.36) : 0.62
            const yStart = par.label ? par.y + 22 : par.y
            const yEnd = nd.label ? nd.y - 22 : nd.y
            nodes.push(
                line([par.x, yStart], [nd.x, yEnd], {
                    stroke: edgeCol,
                    width: isWin ? 3.4 : 1.5,
                })
                    .opacity(edgeOp)
                    .glow(isWin ? 9 : 0, edgeCol)
                    .set('blend', 'screen'),
            )
        }

        // Draw all 36 nodes with search pulse & rose dead-branch pruning
        const searchWave = (ph * 1.4) % 4.5
        for (const nd of TREE_NODES) {
            const isWin = nd.winning
            const nearWave = Math.abs(searchWave - nd.depth) < 0.75
            const col = isWin ? (ver > 0.4 ? COSMOS.emerald : COSMOS.gold) : pr > 0.25 ? COSMOS.rose : nearWave ? COSMOS.cyan : '#566d9e'
            const op = isWin ? 1 : pr > 0.25 ? Math.max(0.24, 0.85 - pr * 0.58) : 0.9
            if (nd.label) {
                const pw = nd.depth === 0 ? 204 : 162
                nodes.push(
                    rect(pw, 42, {
                        fill: '#10172b',
                        stroke: col,
                        width: isWin ? 2.6 : 1.8,
                        radius: 21,
                    })
                        .at(nd.x, nd.y)
                        .glow(isWin ? 10 : 0, col)
                        .opacity(op),
                    txt(nd.label, nd.x, nd.y, 26, isWin ? COSMOS.gold : pr > 0.25 ? COSMOS.rose : COSMOS.muted, 'mono').opacity(op),
                )
            } else {
                const r = isWin ? 7.5 : nearWave ? 6 : 4.5
                nodes.push(
                    dot(r, col)
                        .at(nd.x, nd.y)
                        .glow(isWin ? 12 : nearWave ? 8 : 3, col)
                        .opacity(op)
                        .set('blend', 'screen'),
                )
            }
        }

        // Live Proof-Term Stream pouring from winning tree spine -> 3D Lean Kernel crystal!
        const streamCol = ver > 0.4 ? COSMOS.emerald : COSMOS.cyan
        for (let si = 0; si < STREAM_PATHS.length; si++) {
            const pts = STREAM_PATHS[si]!
            nodes.push(
                new Node(polyPath(pts))
                    .stroke(streamCol, 3.0 + ver * 1.4, 0.55 + 0.35 * ver)
                    .glow(10, streamCol)
                    .set('blend', 'screen'),
            )
            for (let k = 0; k < 3; k++) {
                const t = ((ph * 0.55 + si * 0.21 + k * 0.33) % 1)
                const idx = Math.min(pts.length - 1, Math.floor(t * (pts.length - 1)))
                const bp = pts[idx]!
                nodes.push(dot(5.8, '#ffffff').at(bp[0], bp[1]).glow(14, streamCol).set('blend', 'screen'))
            }
        }

        // Proof-term stream badge between tree and crystal
        nodes.push(
            rect(318, 52, { fill: '#0d182b', stroke: streamCol, width: 2.2, radius: 14 })
                .at(125, -245)
                .glow(8, streamCol),
            txt('Proof Term Stream', 125, -245, 26, streamCol, 'mono'),
            txt('List.rec · Eq.trans', 125, 160, 26, COSMOS.gold, 'mono'),
        )

        // Radiant Emerald QED Seal & Kernel verification aura
        if (ver > 0.05) {
            const waveR = 175 + ((ph * 0.7) % 1) * 95
            nodes.push(
                circle(waveR, { fill: null, stroke: COSMOS.emerald, width: 3.0 })
                    .at(KERNEL_X, KERNEL_Y)
                    .opacity((1 - ((ph * 0.7) % 1)) * 0.75 * ver)
                    .glow(12, COSMOS.emerald)
                    .set('blend', 'screen'),
            )
        }

        nodes.push(
            txt('LEAN 4 TRUSTED KERNEL', KERNEL_X, -314, 28, ver > 0.4 ? COSMOS.emerald : COSMOS.violet, 'mono').glow(8, ver > 0.4 ? COSMOS.emerald : COSMOS.violet),
            rect(396, 62, {
                fill: ver > 0.4 ? '#0a2d24' : '#12182d',
                stroke: ver > 0.4 ? COSMOS.emerald : COSMOS.violet,
                width: 3.0,
                radius: 31,
            })
                .at(KERNEL_X, 198)
                .glow(ver > 0.4 ? 16 : 8, ver > 0.4 ? COSMOS.emerald : COSMOS.violet),
            txt(ver > 0.4 ? 'QED ✓  TYPE-CHECKED' : 'Checking β · ι · defEq', KERNEL_X, 198, 26, ver > 0.4 ? COSMOS.emerald : COSMOS.cyan, 'mono'),
        )

        return group(...nodes)
    })

    const punchline = group(
        txt('One small kernel. Infinite certainty.', 0, 344, 54, COSMOS.ink, 'serif').glow(7, COSMOS.violet),
    )

    s.add(liveTreeAndStream, crystal, header, punchline)

    c.at(0.05, () => {
        s.play(phase.to(14.0, { duration: 19.0, ease: linear }))
    })
    c.at(0.05, () => {
        s.play(crystal.orbit({ theta: 3.5, phi: 0.94 }, { duration: 19.0, ease: linear }))
    })
    c.on('formal proof term', () => {
        s.play(prune.to(1.0, { duration: 1.5 }))
    })
    c.on('tiny trusted kernel', () => {
        s.play(verified.to(1.0, { duration: 1.4 }))
    })
    c.on('Infinite certainty', () => {
        s.play(fadeIn(punchline, { duration: 0.6 }))
    })
}

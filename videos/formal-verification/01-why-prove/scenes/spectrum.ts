import {
    Node, circle, dot, dynamic, fadeIn, group, line, linear, polyPath, rect,
    scalarField, tex, type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

// 4 dense side-by-side live mini-visualizations comparing state-space coverage
const PANEL_W = 404
const PANEL_H = 548
const PANEL_Y = 26
const XS = [-655, -218, 218, 655] as const

// Precomputed Unit-Test sparse pinpoint coordinates (clustered in tiny bottom-left safe corner)
const UNIT_PTS: readonly [number, number][] = Array.from({ length: 18 }, (_, i) => {
    const r1 = Math.sin(i * 91.7 + 1.3) * 43758.5453
    const r2 = Math.sin(i * 157.3 + 4.9) * 19642.349
    const u = (r1 - Math.floor(r1)) * 0.28
    const v = (r2 - Math.floor(r2)) * 0.28
    const l = Math.min(u, v)
    const h = Math.max(u, v) + 0.03
    return [l, h]
})

// Precomputed 19-node TLA+ BFS constellation inside Panel 3 local coordinates [-150..150] x [-110..110]
interface BfsNode {
    readonly x: number
    readonly y: number
    readonly depth: number
    readonly onBug: boolean
}
const BFS_NODES: readonly BfsNode[] = [
    { x: -135, y: 0, depth: 0, onBug: true }, // 0: S0
    { x: -72, y: -58, depth: 1, onBug: true }, // 1: Send
    { x: -72, y: 54, depth: 1, onBug: false }, // 2: DropReq
    { x: -6, y: -88, depth: 2, onBug: false }, // 3
    { x: -6, y: -22, depth: 2, onBug: true }, // 4: Dispatch (d=1)
    { x: -6, y: 38, depth: 2, onBug: false }, // 5
    { x: -6, y: 88, depth: 2, onBug: false }, // 6
    { x: 60, y: -96, depth: 3, onBug: false }, // 7
    { x: 60, y: -50, depth: 3, onBug: false }, // 8: AckOk
    { x: 60, y: 4, depth: 3, onBug: true }, // 9: DropAck
    { x: 60, y: 54, depth: 3, onBug: false }, // 10
    { x: 60, y: 94, depth: 3, onBug: false }, // 11
    { x: 118, y: -82, depth: 4, onBug: false }, // 12
    { x: 118, y: -38, depth: 4, onBug: false }, // 13
    { x: 118, y: 4, depth: 4, onBug: true }, // 14: Retry
    { x: 118, y: 48, depth: 4, onBug: false }, // 15
    { x: 118, y: 86, depth: 4, onBug: false }, // 16
    { x: 152, y: -24, depth: 5, onBug: false }, // 17
    { x: 152, y: 32, depth: 5, onBug: true }, // 18: BUG d=2!
]
const BFS_EDGES: readonly [number, number][] = [
    [0, 1], [0, 2],
    [1, 3], [1, 4], [2, 5], [2, 6],
    [3, 7], [3, 8], [4, 8], [4, 9], [5, 10], [6, 11],
    [7, 12], [8, 13], [9, 14], [10, 15], [11, 16],
    [13, 17], [14, 18], [14, 17],
]

export const spectrum: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const showSmt = s.value(0)
    const showTla = s.value(0)
    const showLean = s.value(0)

    const header = group(
        txt('From Sampling to Mathematical Proof', 0, -424, 58, COSMOS.ink, 'serif').glow(6, COSMOS.cyan),
        txt('Each tool expands how much of the state space you verify', 0, -356, 28, COSMOS.muted, 'sans'),
    )

    // ── Panel 1: Unit Tests (sparse pinpoint dots on dark grid) ──────────────
    const p1 = dynamic(() => {
        const ph = phase.value
        const cx = XS[0]
        const gx0 = cx - 146
        const gx1 = cx + 146
        const gy0 = 96
        const gy1 = -132
        const gw = gx1 - gx0
        const gh = gy0 - gy1
        const nodes: Node[] = [
            nebula(cx, 0, 250, '#6ee7b714'),
            rect(PANEL_W, PANEL_H, { fill: '#0c1120', stroke: '#334263', width: 2.5, radius: 18 }).at(cx, PANEL_Y),
            txt('1. UNIT TESTS', cx, -206, 28, COSMOS.emerald, 'mono'),
        ]
        // Dark coordinate grid
        for (let k = 0; k <= 6; k++) {
            const tx = gx0 + (k / 6) * gw
            const ty = gy0 - (k / 6) * gh
            nodes.push(
                line([tx, gy0], [tx, gy1], { stroke: '#1b243c', width: 1.2 }),
                line([gx0, ty], [gx1, ty], { stroke: '#1b243c', width: 1.2 }),
            )
        }
        // Subtle diagonal valid-domain boundary & vast untested void
        nodes.push(
            line([gx0, gy0], [gx1, gy1], { stroke: '#2c3d60', width: 1.8, dash: [6, 5] }),
            line([gx0, gy1], [gx1, gy1], { stroke: '#2c3d60', width: 1.8 }),
            line([gx0, gy0], [gx0, gy1], { stroke: '#2c3d60', width: 1.8 }),
        )
        // Sparse emerald dots clustered in tiny corner
        UNIT_PTS.forEach(([l, h], i) => {
            const px = gx0 + l * gw
            const py = gy0 - h * gh
            const pulse = 3.2 + Math.sin(ph * 3 + i) * 0.9
            nodes.push(dot(pulse, COSMOS.emerald).at(px, py).glow(7, COSMOS.emerald).set('blend', 'screen'))
        })
        nodes.push(
            txt('99.99% untested void', cx, 134, 26, COSMOS.dim, 'mono'),
            txt('Sampled corner only', cx, 180, 26, COSMOS.emerald, 'mono'),
            txt('Points you thought to write', cx, 236, 26, COSMOS.muted, 'sans'),
        )
        return group(...nodes)
    })

    // ── Panel 2: SMT / Z3 (glowing scalarField symbolic region + tex) ────────
    const smtField = scalarField(
        (x, y) => {
            if (x > y) return -1.8 // outside valid low <= high
            return x + y - 1.0 // < 0 safe (teal/emerald), >= 0 overflow (rose/gold)
        },
        {
            x: [0, 1],
            y: [0, 1],
            domain: [-1.2, 1.0],
            colors: ['#070b16', '#0d363a', '#1eb8a6', '#ffd166', '#ff4d79', '#ff6b8b'],
            width: 292,
            height: 220,
            resolution: [56, 44],
        },
    ).at(XS[1], -20)

    const smtTex = tex(String.raw`\exists\, l, h:\; l + h \ge 2^{31}`, { size: 28, color: COSMOS.cyan }).at(XS[1], 162)

    const smtCard = group(
        nebula(XS[1], 0, 270, '#5ce1e61e'),
        rect(PANEL_W, PANEL_H, { fill: '#0c1120', stroke: COSMOS.cyan, width: 2.8, radius: 18 }).at(XS[1], PANEL_Y).glow(8, COSMOS.cyan),
        txt('2. SMT / Z3', XS[1], -206, 28, COSMOS.cyan, 'mono'),
        smtField,
        // Crisp symbolic fault boundary overlay & golden SAT witness star
        line([XS[1] - 146, -130], [XS[1], -20], { stroke: '#ffffff', width: 2.5, dash: [6, 5] }).glow(8, COSMOS.gold),
        dot(7.5, COSMOS.gold).at(XS[1] + 58, -64).glow(14, COSMOS.gold).set('blend', 'screen'),
        smtTex,
        txt('All 32-bit pairs in 0.4 ms', XS[1], 232, 26, COSMOS.muted, 'sans'),
    )

    const smtLiveOverlay = dynamic(() => {
        if (showSmt.value < 0.02) return []
        const a = showSmt.value
        const ph = phase.value
        const r = 14 + ((ph * 0.8) % 1) * 28
        return group(
            circle(r, { fill: null, stroke: COSMOS.gold, width: 2.2 })
                .at(XS[1] + 58, -64)
                .opacity((1 - ((ph * 0.8) % 1)) * 0.85 * a)
                .set('blend', 'screen'),
        )
    })

    // ── Panel 3: TLA+ / TLC (branching glowing BFS constellation + rose bug) ─
    const p3 = dynamic(() => {
        if (showTla.value < 0.02) return []
        const a = showTla.value
        const ph = phase.value
        const cx = XS[2]
        const cy = -18
        const wave = (ph * 1.4) % 6.2
        const nodes: Node[] = [
            nebula(cx, 0, 270, '#ffd1661c').opacity(a),
            rect(PANEL_W, PANEL_H, { fill: '#0c1120', stroke: COSMOS.gold, width: 2.8, radius: 18 })
                .at(cx, PANEL_Y)
                .glow(8, COSMOS.gold)
                .opacity(a),
            txt('3. TLA+ / TLC', cx, -206, 28, COSMOS.gold, 'mono').opacity(a),
        ]
        for (const [u, v] of BFS_EDGES) {
            const nu = BFS_NODES[u]!
            const nv = BFS_NODES[v]!
            const isBugEdge = nu.onBug && nv.onBug
            const lit = wave >= nv.depth ? 1 : 0.35
            const col = isBugEdge ? COSMOS.rose : COSMOS.gold
            nodes.push(
                line([cx + nu.x, cy + nu.y], [cx + nv.x, cy + nv.y], {
                    stroke: col,
                    width: isBugEdge ? 3.2 : 1.6,
                })
                    .opacity((isBugEdge ? 0.95 : 0.45 * lit) * a)
                    .glow(isBugEdge ? 8 : 3, col)
                    .set('blend', 'screen'),
            )
        }
        for (const nd of BFS_NODES) {
            const isActive = Math.abs(wave - nd.depth) < 0.9
            const col = nd.onBug ? COSMOS.rose : isActive ? COSMOS.cyan : COSMOS.gold
            nodes.push(
                dot(nd.onBug ? 6.5 : isActive ? 5.2 : 3.8, col)
                    .at(cx + nd.x, cy + nd.y)
                    .glow(nd.onBug ? 12 : 6, col)
                    .set('blend', 'screen')
                    .opacity(a),
            )
        }
        nodes.push(
            txt('5-step bug trace', cx, 162, 26, COSMOS.rose, 'mono').opacity(a),
            txt('Every protocol interleaving', cx, 232, 26, COSMOS.muted, 'sans').opacity(a),
        )
        return group(...nodes)
    })

    // ── Panel 4: Lean 4 (infinite inductive golden lattice + QED seal) ───────
    const leanTex = tex(String.raw`\forall n \in \mathbb{N},\; P(n)`, { size: 30, color: COSMOS.gold }).at(XS[3], 162)

    const p4 = dynamic(() => {
        if (showLean.value < 0.02) return []
        const a = showLean.value
        const ph = phase.value
        const cx = XS[3]
        const baseY = 98
        const nodes: Node[] = [
            nebula(cx, 0, 280, '#a78bfa24').opacity(a),
            rect(PANEL_W, PANEL_H, { fill: '#0c1120', stroke: COSMOS.violet, width: 2.8, radius: 18 })
                .at(cx, PANEL_Y)
                .glow(10, COSMOS.violet)
                .opacity(a),
            txt('4. LEAN 4', cx, -206, 28, COSMOS.violet, 'mono').opacity(a),
        ]
        // Infinite inductive perspective lattice stretching upward toward vanishing point
        const rows = 7
        const cols = 6
        const pt = (r: number, colIdx: number): Vec => {
            const t = r / rows // 0 at bottom, 1 at top horizon
            const spread = 152 * (1 - 0.56 * t)
            const x = cx - spread + (colIdx / (cols - 1)) * 2 * spread
            const y = baseY - t * 224
            return [x, y]
        }
        for (let r = 0; r < rows; r++) {
            const rowPts: Vec[] = Array.from({ length: cols }, (_, ci) => pt(r, ci))
            const waveRow = ((ph * 1.6) % (rows + 1))
            const boost = Math.max(0, 1 - Math.abs(waveRow - r) * 0.7)
            nodes.push(
                new Node(polyPath(rowPts))
                    .stroke(boost > 0.3 ? COSMOS.gold : COSMOS.violet, 1.5 + boost * 1.8, (0.42 + 0.52 * boost) * a)
                    .glow(boost > 0.3 ? 8 : 3, COSMOS.gold)
                    .set('blend', 'screen'),
            )
            for (let ci = 0; ci < cols; ci++) {
                const p0 = pt(r, ci)
                if (r + 1 < rows) {
                    const p1 = pt(r + 1, ci)
                    nodes.push(
                        line(p0, p1, { stroke: COSMOS.violet, width: 1.4 })
                            .opacity(0.45 * a)
                            .set('blend', 'screen'),
                    )
                }
                if (r + 1 < rows && ci + 1 < cols) {
                    const pd = pt(r + 1, ci + 1)
                    nodes.push(
                        line(p0, pd, { stroke: COSMOS.gold, width: 1.3 })
                            .opacity((0.25 + 0.45 * boost) * a)
                            .set('blend', 'screen'),
                    )
                }
                nodes.push(
                    dot(2.8 + boost * 2.4, boost > 0.35 ? COSMOS.gold : COSMOS.cyan)
                        .at(p0[0], p0[1])
                        .glow(boost > 0.35 ? 10 : 4, COSMOS.gold)
                        .set('blend', 'screen')
                        .opacity(a),
                )
            }
        }
        // Radiant QED emerald seal at top of infinite lattice
        nodes.push(
            rect(136, 46, { fill: '#0b2b22', stroke: COSMOS.emerald, width: 2.8, radius: 23 })
                .at(cx, -124)
                .glow(12, COSMOS.emerald)
                .opacity(a),
            txt('QED ✓', cx, -124, 28, COSMOS.emerald, 'mono').opacity(a),
            txt('Infinitely many inputs', cx, 232, 26, COSMOS.muted, 'sans').opacity(a),
        )
        return group(...nodes)
    })

    // Glowing progression connectors between cards
    const conn1 = line([XS[0] + PANEL_W / 2 + 2, PANEL_Y], [XS[1] - PANEL_W / 2 - 2, PANEL_Y], { stroke: COSMOS.cyan, width: 3.5 }).glow(8, COSMOS.cyan)
    const conn2 = line([XS[1] + PANEL_W / 2 + 2, PANEL_Y], [XS[2] - PANEL_W / 2 - 2, PANEL_Y], { stroke: COSMOS.gold, width: 3.5 }).glow(8, COSMOS.gold)
    const conn3 = line([XS[2] + PANEL_W / 2 + 2, PANEL_Y], [XS[3] - PANEL_W / 2 - 2, PANEL_Y], { stroke: COSMOS.violet, width: 3.5 }).glow(8, COSMOS.violet)

    const footer = txt('Sampling checks known points  →  Proofs cover the entire space', 0, 366, 28, COSMOS.gold, 'serif')

    s.add(header, p1, smtLiveOverlay, p3, p4, footer)

    c.at(0.05, () => s.play(phase.to(14.0, { duration: 22.0, ease: linear })))
    c.show('proves the overflow', [conn1, smtCard])
    c.on('proves the overflow', () => s.play(showSmt.to(1, { duration: 0.7 })))
    c.show('exhaustively explores', conn2)
    c.on('exhaustively explores', () => s.play(showTla.to(1, { duration: 0.8 })))
    c.show('Proof assistants', [conn3, leanTex])
    c.on('Proof assistants', () => s.play(showLean.to(1, { duration: 0.8 })))
}

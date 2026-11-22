import {
    Node, circle, curve3d, dynamic, gridPlane3d, group, line, line3d, linear,
    point3d, points3d, rect, scene3d, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

// Genuine 35-node 3D branching BFS state-space constellation across depths 0..5
interface StateNode3D {
    readonly id: number
    readonly depth: number
    readonly pos: Vec3
    readonly onBug: boolean
    readonly repairedKeep: boolean
}

const LAYER_COUNTS = [1, 3, 6, 8, 9, 8] as const // 1 + 3 + 6 + 8 + 9 + 8 = 35 states!
const LAYER_X = [-2.55, -1.55, -0.55, 0.45, 1.45, 2.45] as const

// Exact 5-step counterexample node indices (one per depth 0..5):
// 0: S0 (Idle) -> 1: Send -> 4: Dispatch(d=1) -> 10: DropAck -> 18: Retry -> 27: Dispatch!(d=2)
const CE_PATH = [0, 1, 4, 10, 18, 27] as const
const CE_SET = new Set<number>(CE_PATH)
// Repaired 6-state closure keeps S0(0), Send(1), Dispatch(4), AckOk(5), DropAck(10), Retry(18) -> Dedup!
const REPAIRED_SET = new Set<number>([0, 1, 4, 5, 10, 18])

const STATES_3D: StateNode3D[] = []
const LAYER_STARTS: number[] = []
{
    let idx = 0
    for (let d = 0; d < LAYER_COUNTS.length; d++) {
        LAYER_STARTS.push(idx)
        const count = LAYER_COUNTS[d]!
        const x = LAYER_X[d]!
        for (let k = 0; k < count; k++) {
            const onBug = CE_SET.has(idx)
            let pos: Vec3
            if (d === 0) {
                pos = [x, 0, 0.2]
            } else if (onBug) {
                // Place counterexample spine cleanly along the prominent front-upper ridge!
                const arcZ = 0.45 + Math.sin((d / 5) * Math.PI) * 0.72 + (d === 5 ? 0.25 : 0)
                const arcY = -0.35 + Math.sin(d * 0.9) * 0.45
                pos = [x, arcY, arcZ]
            } else {
                const ang = ((k + 0.5) / count) * Math.PI * 2 + d * 0.55
                const rad = 0.78 + d * 0.24
                const py = Math.cos(ang) * rad
                const pz = Math.sin(ang) * rad * 0.85 - 0.15
                pos = [x, py, pz]
            }
            STATES_3D.push({
                id: idx,
                depth: d,
                pos,
                onBug,
                repairedKeep: REPAIRED_SET.has(idx),
            })
            idx++
        }
    }
}

// Atomic-receipt idempotent sink node: Retry(18) -> Dedup(d=1) instead of Dispatch!(d=2)
const DEDUP_POS: Vec3 = [2.35, -1.25, -0.35]

// Deterministic branching BFS edges between consecutive layers
interface Edge3D {
    readonly from: number
    readonly to: number
    readonly depth: number
    readonly onBug: boolean
    readonly onRepaired: boolean
}

const EDGES_3D: Edge3D[] = []
{
    // First add the exact 5-step counterexample chain
    for (let i = 0; i < CE_PATH.length - 1; i++) {
        const u = CE_PATH[i]!
        const v = CE_PATH[i + 1]!
        EDGES_3D.push({ from: u, to: v, depth: i + 1, onBug: true, onRepaired: i < 4 })
    }
    // Add the safe AckOk branch in the repaired 6-state closure (Dispatch(4) -> AckOk(5))
    EDGES_3D.push({ from: 4, to: 5, depth: 3, onBug: false, onRepaired: true })

    // Connect all other 35 BFS nodes to parents in previous layer
    for (let d = 1; d < LAYER_COUNTS.length; d++) {
        const pStart = LAYER_STARTS[d - 1]!
        const pCount = LAYER_COUNTS[d - 1]!
        const cStart = LAYER_STARTS[d]!
        const cCount = LAYER_COUNTS[d]!
        for (let k = 0; k < cCount; k++) {
            const child = cStart + k
            if (CE_SET.has(child)) continue
            const p1 = pStart + (k % pCount)
            EDGES_3D.push({ from: p1, to: child, depth: d, onBug: false, onRepaired: false })
            if (pCount > 2 && k % 2 === 1) {
                const p2 = pStart + ((k + 1) % pCount)
                if (p2 !== p1) {
                    EDGES_3D.push({ from: p2, to: child, depth: d, onBug: false, onRepaired: false })
                }
            }
        }
    }
}

const CE_LABELS = [
    '1. Send (order#1)',
    '2. Dispatch (d = 1)',
    '3. DropAck (lost)',
    '4. Retry (order#1)',
    '5. Dispatch! (d = 2)',
] as const

export const graph: SceneFunction = (s, c) => {
    const orbitT = s.value(0)
    const bfsDepth = s.value(0.2) // 0 -> 5.2
    const ceFocus = s.value(0)    // 0 -> 1 dims safe branches & ignites 5-step rose counterexample
    const fixAmt = s.value(0)     // 0 -> 1 atomic receipt guard diverts Retry -> emerald Dedup (d=1)

    const invTex = tex(String.raw`\square(\text{dispatches} \le 1)`, { size: 34, color: COSMOS.gold }).at(-590, -278)

    const header = group(
        txt('TLC State-Space Explorer', -852, -402, 50, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.cyan),
        txt('Safety Invariant', -852, -338, 26, COSMOS.muted, 'mono', 'left'),
        rect(524, 72, { fill: '#111626', stroke: COSMOS.gold, width: 2.2, radius: 14 }).at(-590, -278),
        invTex,
    )

    const liveScene = dynamic(() => {
        const orb = orbitT.value
        const depthNow = bfsDepth.value
        const ce = ceFocus.value
        const fix = fixAmt.value

        // Count explored states across BFS depth layers
        const exploredCount =
            fix > 0.5
                ? 6
                : STATES_3D.reduce((acc, st) => acc + (depthNow >= st.depth ? 1 : 0), 0)

        // ── Orbiting 3D BFS State-Space Constellation (scene3d) ──────────────
        // Sweep camera gently around theta = -pi/2 (-1.82 -> -1.28) so depth 0..5 spreads WIDE left-to-right!
        const view = scene3d({
            theta: -1.82 + orb * 0.14,
            phi: 1.06 + Math.sin(orb * 1.1) * 0.06,
            distance: 13.8,
            unit: 138,
            perspective: true,
            ambient: 0.4,
            fog: 0.1,
            focus: [0.05, -0.05, 0.1],
        }).at(285, 18)

        view.add(
            gridPlane3d({
                x: [-3.0, 3.0],
                y: [-2.2, 2.2],
                z: -1.6,
                step: 0.6,
                color: '#233252',
                width: 1.0,
                opacity: 0.36,
            }),
        )

        // Render all BFS edges
        for (const e of EDGES_3D) {
            if (depthNow < e.depth - 0.15) continue
            const pA = STATES_3D[e.from]!.pos
            const pB = STATES_3D[e.to]!.pos
            const edgeReveal = Math.min(1, (depthNow - (e.depth - 0.15)) / 0.45)

            if (fix > 0.45) {
                // In repaired mode, illuminate the 6-state emerald closure and dim old exploration branches
                if (e.onRepaired) {
                    view.add(
                        line3d(pA, pB, {
                            color: COSMOS.emerald,
                            width: 4.4,
                            glow: 11,
                            blend: 'screen',
                            opacity: 0.95,
                        }),
                    )
                } else {
                    view.add(
                        line3d(pA, pB, {
                            color: '#2b3d63',
                            width: 1.2,
                            opacity: 0.14,
                        }),
                    )
                }
            } else if (e.onBug && ce > 0.15) {
                view.add(
                    line3d(pA, pB, {
                        color: COSMOS.rose,
                        width: 2.2 + 3.4 * ce,
                        glow: 12 * ce,
                        blend: 'screen',
                        onTop: true,
                        opacity: 0.98 * edgeReveal,
                    }),
                )
            } else {
                const dimFactor = 1 - 0.78 * ce
                view.add(
                    line3d(pA, pB, {
                        color: COSMOS.cyan,
                        width: 1.8,
                        glow: ce < 0.3 ? 5 : 0,
                        blend: 'screen',
                        opacity: 0.58 * dimFactor * edgeReveal,
                    }),
                )
            }
        }

        // Render safe vs counterexample vs repaired nodes
        const safePts: Vec3[] = []
        const cePts: Vec3[] = []
        const repPts: Vec3[] = []
        for (const st of STATES_3D) {
            if (depthNow < st.depth - 0.05) continue
            if (fix > 0.45) {
                if (st.repairedKeep) repPts.push(st.pos)
                else safePts.push(st.pos)
            } else if (st.onBug && ce > 0.15) {
                cePts.push(st.pos)
            } else {
                safePts.push(st.pos)
            }
        }

        if (safePts.length > 0) {
            view.add(
                points3d(safePts, {
                    color: fix > 0.45 ? '#354970' : COSMOS.cyan,
                    radius: fix > 0.45 ? 3.5 : 5.0 - ce * 1.4,
                    glow: fix > 0.45 ? 0 : (1 - ce) * 8,
                    blend: 'screen',
                    opacity: fix > 0.45 ? 0.25 : 0.92 - 0.65 * ce,
                }),
            )
        }

        if (cePts.length > 0 && fix <= 0.45) {
            view.add(
                points3d(cePts, {
                    color: COSMOS.rose,
                    radius: 7.5,
                    glow: 14,
                    blend: 'screen',
                    onTop: true,
                    opacity: 1,
                }),
            )
            // Pulsing rose alarm rings around final d=2 violation node!
            const bugPos = STATES_3D[27]!.pos
            const ringR = 0.34 + 0.12 * Math.sin(orb * 9)
            view.add(
                curve3d(
                    (u): Vec3 => [bugPos[0] + ringR * Math.cos(u * Math.PI * 2), bugPos[1] + ringR * Math.sin(u * Math.PI * 2), bugPos[2]],
                    0,
                    1,
                    { color: COSMOS.rose, width: 3.4, glow: 12, blend: 'screen', samples: 36, onTop: true, opacity: ce },
                ),
                point3d(bugPos, { color: '#ffffff', radius: 9.0, glow: 16, blend: 'screen', onTop: true, opacity: ce }),
            )
        }

        if (fix > 0.45) {
            // Atomic receipt_id guard diverts Retry(18) -> Dedup(d=1) sink!
            const retryPos = STATES_3D[18]!.pos
            view.add(
                line3d(retryPos, DEDUP_POS, {
                    color: COSMOS.emerald,
                    width: 5.2,
                    glow: 14,
                    blend: 'screen',
                    onTop: true,
                    opacity: fix,
                }),
                points3d([...repPts, DEDUP_POS], {
                    color: COSMOS.emerald,
                    radius: 7.4,
                    glow: 14,
                    blend: 'screen',
                    onTop: true,
                }),
                curve3d(
                    (u): Vec3 => {
                        const r = 0.36 + 0.08 * Math.sin(orb * 8)
                        return [DEDUP_POS[0] + r * Math.cos(u * Math.PI * 2), DEDUP_POS[1] + r * Math.sin(u * Math.PI * 2), DEDUP_POS[2]]
                    },
                    0,
                    1,
                    { color: COSMOS.emerald, width: 3.2, glow: 12, blend: 'screen', samples: 36, onTop: true },
                ),
                point3d(DEDUP_POS, { color: '#ffffff', radius: 8.5, glow: 16, blend: 'screen', onTop: true }),
            )
        }

        // ── Left Live Counter & Trace Panel ──────────────────────────────────
        const panelCol = fix > 0.45 ? COSMOS.emerald : ce > 0.35 ? COSMOS.rose : COSMOS.cyan
        const nodes: Node[] = [
            nebula(285, 18, 490, fix > 0.45 ? '#6ee7b722' : ce > 0.35 ? '#ff6b8b24' : '#5ce1e61a'),
            view,
            rect(524, 498, { fill: '#0c1222', stroke: panelCol, width: 2.4, radius: 18 })
                .at(-590, 46)
                .glow(8, panelCol),
            txt('States explored', -826, -158, 26, COSMOS.muted, 'mono', 'left'),
            txt(`${exploredCount}`, -358, -158, 42, panelCol, 'mono', 'right').glow(8, panelCol),
            line([-830, -118], [-354, -118], { stroke: COSMOS.rule, width: 1.6 }),
        ]

        if (fix > 0.45) {
            nodes.push(
                txt('ATOMIC RECEIPT GUARD', -826, -78, 26, COSMOS.emerald, 'mono', 'left'),
                txt('if receipt_id ∉ seen:', -826, -26, 26, COSMOS.ink, 'mono', 'left'),
                txt('  ship(); seen ∪= {id}', -826, 22, 26, COSMOS.cyan, 'mono', 'left'),
                txt('else: Dedup (d = 1)', -826, 70, 26, COSMOS.emerald, 'mono', 'left').glow(6, COSMOS.emerald),
                line([-830, 118], [-354, 118], { stroke: COSMOS.rule, width: 1.6 }),
                txt('6 distinct states checked', -826, 166, 26, COSMOS.emerald, 'sans', 'left'),
                txt('0 violations · PROVED ✓', -826, 214, 28, COSMOS.emerald, 'mono', 'left').glow(8, COSMOS.emerald),
            )
        } else {
            nodes.push(
                txt(ce > 0.35 ? '5-STEP COUNTEREXAMPLE' : 'BFS DEPTH-BY-DEPTH', -826, -78, 26, ce > 0.35 ? COSMOS.rose : COSMOS.gold, 'mono', 'left'),
            )
            CE_LABELS.forEach((lbl, idx) => {
                const active = depthNow >= idx + 1
                const isFinal = idx === 4
                const col = isFinal && ce > 0.35 ? COSMOS.rose : active ? (ce > 0.35 ? COSMOS.rose : COSMOS.cyan) : COSMOS.dim
                nodes.push(
                    txt(lbl, -826, -24 + idx * 54, 26, col, 'mono', 'left').opacity(active ? 1 : 0.45),
                )
            })
        }

        // Clean 3D graph perimeter tags
        nodes.push(
            txt('depth 0  (S0)', -110, -350, 26, COSMOS.muted, 'mono', 'left'),
            txt(
                fix > 0.45 ? 'Dedup sink  (d = 1 ✓)' : ce > 0.35 ? 'VIOLATION  (d = 2!)' : 'depth 5  (35 states)',
                848,
                -350,
                26,
                fix > 0.45 ? COSMOS.emerald : ce > 0.35 ? COSMOS.rose : COSMOS.cyan,
                'mono',
                'right',
            ).glow(8, fix > 0.45 ? COSMOS.emerald : ce > 0.35 ? COSMOS.rose : COSMOS.cyan),
            txt(
                fix > 0.45
                    ? 'Atomic receipt_id diverts Retry into idempotent Dedup (d = 1)'
                    : ce > 0.35
                        ? 'TLC shortest trace: Send -> Dispatch -> DropAck -> Retry -> Dispatch! (d = 2)'
                        : 'TLC explores every reachable interleaving layer by layer',
                285,
                368,
                26,
                fix > 0.45 ? COSMOS.emerald : ce > 0.35 ? COSMOS.rose : COSMOS.muted,
                'mono',
            ),
        )

        return group(...nodes)
    })

    s.add(header, liveScene)

    c.at(0.05, () => {
        s.play(orbitT.to(3.8, { duration: 32.0, ease: linear }))
    })
    c.on('explores every interleaving', () => {
        s.play(bfsDepth.to(5.2, { duration: 3.1 }))
    })
    c.on('five-step counterexample', () => {
        s.play(ceFocus.to(1, { duration: 1.2 }))
    })
    c.on('atomic receipt', () => {
        s.play(fixAmt.to(1, { duration: 1.3 }))
    })
}

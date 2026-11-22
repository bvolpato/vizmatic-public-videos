import {
    Node, curve3d, dynamic, fadeIn, gridPlane3d, group, line3d, linear,
    point3d, points3d, rect, scene3d, surface, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

// 6 x 6 3D (xs, acc) Inductive Lattice:
// axis X = |xs| in 0..5, axis Y = |acc| in 0..5, height Z rises with |xs|!
const N = 6
const latticePos = (xs: number, acc: number): Vec3 => [
    (xs - 2.5) * 0.92,
    (acc - 2.5) * 0.92,
    xs * 0.42 - 0.95,
]

export const induction: SceneFunction = (s, c) => {
    const orbitT = s.value(0)
    const stuckPulse = s.value(0)
    const genWave = s.value(0) // 0 -> 1 generalizes forall acc across the entire 3D lattice!

    // ── Left column: Title + Stuck vs Generalized TeX cards ──────────────────
    const header = group(
        txt('Generalizing the', -852, -402, 50, COSMOS.ink, 'serif', 'left'),
        txt('Induction Hypothesis', -852, -338, 48, COSMOS.gold, 'serif', 'left').glow(6, COSMOS.gold),
    )

    const stuckCard = group(
        rect(612, 224, { fill: '#1a0c18', stroke: COSMOS.rose, width: 2.5, radius: 16 })
            .at(-546, -158)
            .glow(9, COSMOS.rose),
        txt('NARROW HYPOTHESIS  (acc = [])', -828, -234, 26, COSMOS.rose, 'mono', 'left'),
        tex(String.raw`\operatorname{revAux}(x::xs,\; []) = \operatorname{revAux}(xs,\; [x])`, {
            size: 27,
            color: COSMOS.rose,
        }).at(-546, -156),
        txt('STUCK:  []  ≠  [x]  (cannot unify!)', -828, -82, 26, COSMOS.ink, 'mono', 'left').glow(6, COSMOS.rose),
    )

    const genCard = group(
        rect(612, 250, { fill: '#0b211c', stroke: COSMOS.emerald, width: 2.6, radius: 16 })
            .at(-546, 148)
            .glow(10, COSMOS.emerald),
        txt('GENERALIZED FOR ALL acc  (PROVED ✓)', -828, 62, 26, COSMOS.emerald, 'mono', 'left'),
        tex(String.raw`\forall\, acc,\; \operatorname{revAux}(xs,\; acc) = \operatorname{rev}(xs) \mathbin{++} acc`, {
            size: 26,
            color: COSMOS.emerald,
        }).at(-546, 142),
        txt('Set acc = [] ⇒ revAux xs [] = rev xs', -828, 226, 26, COSMOS.gold, 'mono', 'left').glow(6, COSMOS.gold),
    )

    // ── Right Hero: Orbiting 3D (xs, acc) Inductive Lattice (scene3d) ────────
    const liveLattice = dynamic(() => {
        const orb = orbitT.value
        const sp = stuckPulse.value
        const gw = genWave.value

        const view = scene3d({
            theta: -0.58 + orb * 0.16,
            phi: 0.84 + Math.sin(orb * 0.9) * 0.05,
            distance: 14.2,
            unit: 152,
            perspective: true,
            ambient: 0.44,
            shine: 0.34,
            fog: 0.06,
            focus: [0, 0, -0.05],
        }).at(315, 18)

        // Subtle base grid plane + inclined translucent lattice sheet
        view.add(
            gridPlane3d({
                x: [-2.6, 2.6],
                y: [-2.6, 2.6],
                z: -1.15,
                step: 0.65,
                color: '#223152',
                width: 1.0,
                opacity: 0.35,
            }),
            surface((wx, wy) => ((wx / 0.92) + 2.5) * 0.42 - 1.02, {
                x: [-2.3, 2.3],
                y: [-2.3, 2.3],
                resolution: [15, 15],
                colors: gw > 0.35 ? ['#092622', '#0f4c45', '#1d8a7a', '#6ee7b7'] : ['#0d1326', '#182142', '#26335e'],
                mesh: gw > 0.35 ? '#6ee7b7' : '#3a4e7a',
                meshOpacity: 0.24,
                meshWidth: 0.75,
                opacity: 0.48,
            }),
        )

        // Grid frame edges across the 6 x 6 (xs, acc) lattice
        for (let i = 0; i < N; i++) {
            view.add(
                line3d(latticePos(i, 0), latticePos(i, N - 1), {
                    color: i === 0 && gw > 0.2 ? COSMOS.emerald : '#2d4066',
                    width: i === 0 && gw > 0.2 ? 4.2 : 1.4,
                    glow: i === 0 && gw > 0.2 ? 12 : 0,
                    blend: 'screen',
                    opacity: i === 0 && gw > 0.2 ? 0.98 : 0.45,
                }),
                line3d(latticePos(0, i), latticePos(N - 1, i), {
                    color: i === 0 ? COSMOS.gold : '#2d4066',
                    width: i === 0 ? (gw > 0.7 ? 5.0 : 3.2) : 1.4,
                    glow: i === 0 ? (gw > 0.7 ? 14 : 8) : 0,
                    blend: 'screen',
                    opacity: i === 0 ? 0.96 : 0.42,
                }),
            )
        }

        // Phase 1: Stuck along acc = [] edge -> hits blazing ROSE unification-mismatch laser wall!
        if (gw < 0.55) {
            const wallOp = 1 - Math.max(0, (gw - 0.15) / 0.4)
            const yWall = (0.5 - 2.5) * 0.92
            // Blazing rose unification-mismatch laser barrier along acc = 0.5
            view.add(
                line3d([-2.4, yWall, -0.95], [2.4, yWall, 1.15], {
                    color: COSMOS.rose,
                    width: 5.2,
                    glow: 14,
                    blend: 'screen',
                    onTop: true,
                    opacity: wallOp,
                }),
                line3d([-2.4, yWall, -0.35], [2.4, yWall, 1.75], {
                    color: COSMOS.rose,
                    width: 2.8,
                    glow: 10,
                    blend: 'screen',
                    opacity: 0.75 * wallOp,
                }),
            )
            // Vertical laser fence posts
            for (let xs = 0; xs < N; xs++) {
                const bx = (xs - 2.5) * 0.92
                const bz = xs * 0.42 - 0.95
                view.add(
                    line3d([bx, yWall, bz], [bx, yWall, bz + 0.65], {
                        color: COSMOS.rose,
                        width: 2.0,
                        glow: 8,
                        blend: 'screen',
                        opacity: 0.65 * wallOp,
                    }),
                )
            }
            // Attempted step from (xs=3, acc=0) toward (xs=2, acc=1) slamming into the rose laser!
            const pStart = latticePos(3, 0)
            const pTarget = latticePos(2, 1)
            const pHit: Vec3 = [
                (pStart[0] + pTarget[0]) * 0.5,
                (pStart[1] + pTarget[1]) * 0.5,
                (pStart[2] + pTarget[2]) * 0.5,
            ]
            const sparkR = 0.22 + 0.12 * Math.sin(sp * 8)
            view.add(
                line3d(pStart, pHit, { color: COSMOS.gold, width: 4.5, glow: 10, blend: 'screen', onTop: true, opacity: wallOp }),
                line3d(pHit, pTarget, { color: COSMOS.rose, width: 2.4, opacity: 0.45 * wallOp }),
                curve3d(
                    (u): Vec3 => [pHit[0] + sparkR * Math.cos(u * Math.PI * 2), pHit[1], pHit[2] + sparkR * Math.sin(u * Math.PI * 2)],
                    0,
                    1,
                    { color: COSMOS.rose, width: 3.4, glow: 12, blend: 'screen', samples: 32, onTop: true, opacity: wallOp },
                ),
                point3d(pHit, { color: '#ffffff', radius: 9.0, glow: 16, blend: 'screen', onTop: true, opacity: wallOp }),
            )
        }

        // Phase 2: Generalized forall acc -> cascading diagonal emerald wave down to ([], acc) base cases!
        if (gw > 0.05) {
            const waveFront = gw * 6.8 // Sweeps from xs=0 base cases outward through xs=5!
            const basePts: Vec3[] = []
            const activePts: Vec3[] = []
            const goldEdgePts: Vec3[] = []

            for (let xs = 0; xs < N; xs++) {
                for (let acc = 0; acc < N; acc++) {
                    const p = latticePos(xs, acc)
                    if (xs === 0) basePts.push(p)
                    else if (waveFront >= xs) activePts.push(p)
                    if (acc === 0 && gw > 0.65) goldEdgePts.push(p)

                    // Diagonal inductive step edge: (xs, acc) -> (xs - 1, acc + 1)
                    if (xs > 0 && acc + 1 < N && waveFront >= xs - 0.35) {
                        const lit = Math.min(1, (waveFront - (xs - 0.35)) / 0.7)
                        const pNext = latticePos(xs - 1, acc + 1)
                        view.add(
                            line3d(p, pNext, {
                                color: acc === 0 && gw > 0.75 ? COSMOS.gold : COSMOS.emerald,
                                width: acc === 0 && gw > 0.75 ? 4.2 : 3.0,
                                glow: 10,
                                blend: 'screen',
                                opacity: 0.92 * lit,
                            }),
                        )
                    }
                }
            }

            view.add(
                points3d(basePts, { color: '#ffffff', radius: 6.8, glow: 14, blend: 'screen', onTop: true }),
            )
            if (activePts.length > 0) {
                view.add(
                    points3d(activePts, { color: COSMOS.emerald, radius: 5.5, glow: 11, blend: 'screen' }),
                )
            }
            if (goldEdgePts.length > 0) {
                view.add(
                    points3d(goldEdgePts, { color: COSMOS.gold, radius: 7.4, glow: 16, blend: 'screen', onTop: true }),
                )
            }
        } else {
            // Initial vertices: dim lattice + bright gold acc = [] edge
            const allPts: Vec3[] = []
            const edgePts: Vec3[] = []
            for (let xs = 0; xs < N; xs++) {
                for (let acc = 0; acc < N; acc++) {
                    if (acc === 0) edgePts.push(latticePos(xs, acc))
                    else allPts.push(latticePos(xs, acc))
                }
            }
            view.add(
                points3d(allPts, { color: '#4d6596', radius: 3.8, opacity: 0.65 }),
                points3d(edgePts, { color: COSMOS.gold, radius: 6.4, glow: 12, blend: 'screen', onTop: true }),
            )
        }

        const nodes: Node[] = [
            nebula(315, 16, 480, gw > 0.35 ? '#6ee7b722' : '#ff6b8b22'),
            view,
            // Clean perimeter labels around the 3D inductive lattice
            txt('3D (xs, acc) INDUCTIVE LATTICE', 315, -398, 28, gw > 0.35 ? COSMOS.emerald : COSMOS.cyan, 'mono').glow(6, gw > 0.35 ? COSMOS.emerald : COSMOS.cyan),
            txt(
                gw > 0.35 ? 'Base cases: ([], acc)  ✓' : 'Unification barrier: [] ≠ [x]',
                315,
                -354,
                26,
                gw > 0.35 ? COSMOS.emerald : COSMOS.rose,
                'mono',
            ),
            txt('Axis X: |xs|', -155, 368, 26, COSMOS.muted, 'mono', 'left'),
            txt('Axis Y: |acc|', 225, 368, 26, COSMOS.muted, 'mono', 'center'),
            txt(
                gw > 0.65 ? 'acc = [] lit in GOLD!' : '(x::xs, acc) -> (xs, x::acc)',
                856,
                368,
                26,
                gw > 0.65 ? COSMOS.gold : COSMOS.cyan,
                'mono',
                'right',
            ),
        ]
        return group(...nodes)
    })

    s.add(liveLattice, header, stuckCard)

    c.at(0.05, () => {
        s.play(orbitT.to(2.8, { duration: 19.8, ease: linear }))
    })
    c.at(0.05, () => {
        s.play(stuckPulse.to(8.0, { duration: 11.5, ease: linear }))
    })
    c.show('Generalize the theorem', genCard)
    c.on('Generalize the theorem', () => {
        s.play(genWave.to(1.0, { duration: 3.4 }))
    })
}

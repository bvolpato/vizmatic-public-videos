import {
    Node, circle, curve3d, delay, dot, dynamic, group, line, linear, par, parametricSurface, point3d, polyPath, rect,
    scene3d,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

// Precomputed optimal Traveling Salesman / Chip-Routing network pins on the right panel (x in 390..770, y in 28..258)
const ROUTE_PINS: readonly Vec[] = [
    [430, 82],
    [520, 48],
    [640, 62],
    [738, 108],
    [716, 204],
    [604, 242],
    [474, 224],
    [418, 152],
]
// Extra non-optimal tangled candidate chords to contrast exponential search vs instant optimal tour
const ROUTE_CHORDS: readonly [number, number][] = [
    [0, 3], [0, 5], [1, 4], [1, 6], [2, 5], [2, 7], [3, 6], [4, 7],
]

// Semicircular padlock shackle points around (cx, cy) with pop-open vertical lift
function shacklePoints(cx: number, cy: number, r: number, lift: number): Vec[] {
    const pts: Vec[] = []
    pts.push([cx - r, cy + 16 - lift])
    for (let i = 0; i <= 24; i++) {
        const a = Math.PI + (i / 24) * Math.PI
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r - lift])
    }
    // Right leg stops higher when cracked open!
    pts.push([cx + r, cy + 16 - lift * 2.1])
    return pts
}

export const worlds: SceneFunction = (s, c) => {
    const showEq = s.value(1)
    const eqProg = s.value(0)
    const caveatVis = s.value(0)
    const showNeq = s.value(0)
    const photonT = s.value(0)

    // ── Shot 1: IF P = NP — Live RSA Padlock Shatter + Silicon P=NP Solver Chip + Automated Proofs & Chip Routing ──
    const eqHeader = group(
        txt('IF  P = NP', 0, -422, 28, COSMOS.rose, 'mono'),
        txt('Encryption shatters, discovery becomes fast computation', 0, -354, 50, COSMOS.ink, 'serif'),
    )

    const liveEq = dynamic(() => {
        const a = showEq.value
        if (a < 0.02) return []
        const p = eqProg.value
        const ph = photonT.value
        const nodes: Node[] = []

        // ── CENTER: Silicon P = NP Universal Polynomial Solver Chip Die (x = 0, y = 20) ──
        const chipX = 0
        const chipY = 20
        const chipW = 246
        const chipH = 216
        // Silicon IC pins on all 4 edges
        for (let i = -3; i <= 3; i++) {
            const off = i * 28
            const activePin = ((Math.floor(ph * 10) + i + 10) % 3) === 0
            const pinCol = activePin ? COSMOS.gold : '#475982'
            nodes.push(
                line([chipX + off, chipY - chipH / 2 - 22], [chipX + off, chipY - chipH / 2], { stroke: pinCol, width: 2.8 }).opacity(a),
                line([chipX + off, chipY + chipH / 2], [chipX + off, chipY + chipH / 2 + 22], { stroke: pinCol, width: 2.8 }).opacity(a),
                line([chipX - chipW / 2 - 22, chipY + off * 0.85], [chipX - chipW / 2, chipY + off * 0.85], { stroke: pinCol, width: 2.8 }).opacity(a),
                line([chipX + chipW / 2, chipY + off * 0.85], [chipX + chipW / 2 + 22, chipY + off * 0.85], { stroke: pinCol, width: 2.8 }).opacity(a),
            )
        }
        nodes.push(
            rect(chipW, chipH, { fill: '#161426', stroke: COSMOS.gold, width: 3.4, radius: 18 })
                .at(chipX, chipY).glow(14, COSMOS.gold).opacity(a),
            rect(chipW - 28, chipH - 28, { fill: '#0e0f1d', stroke: '#4d4128', width: 1.4, radius: 12 })
                .at(chipX, chipY).opacity(a),
            txt('P = NP', chipX, chipY - 34, 48, COSMOS.gold, 'serif').opacity(a),
            txt('UNIVERSAL', chipX, chipY + 18, 26, COSMOS.ink, 'mono').opacity(a),
            txt('O(nᵏ) SOLVER', chipX, chipY + 56, 26, COSMOS.cyan, 'mono').opacity(a),
        )

        // ── LEFT PANEL (x = -580): LIVE DIGITAL RSA PADLOCK SHATTERING & KEY EXTRACTION ──
        const lockVis = Math.max(0.25, Math.min(1, p * 3.4))
        const crackProg = Math.max(0, Math.min(1, (p - 0.08) * 3.0))
        const lockX = -580
        const lockY = 12
        const shackleLift = crackProg * 28
        const lockCol = crackProg > 0.45 ? COSMOS.rose : COSMOS.cyan

        // Horizontal data bus from P=NP chip left edge (-145) to padlock right edge (-360)
        const busLeftT = (ph * 1.4) % 1
        nodes.push(
            line([-148, chipY], [-355, chipY], { stroke: COSMOS.rose, width: 3.6 })
                .glow(10, COSMOS.rose).opacity(lockVis * a).set('blend', 'screen'),
            dot(6.8, '#ffffff').at(-148 - busLeftT * 207, chipY).glow(14, COSMOS.rose).opacity(lockVis * a).set('blend', 'screen'),
            txt('CRYPTO SHATTERS', lockX, -222, 28, COSMOS.rose, 'mono').opacity(lockVis * a),
            // Animated padlock shackle popping open
            new Node(polyPath(shacklePoints(lockX, lockY - 68, 56, shackleLift)))
                .stroke(lockCol, 7.5, lockVis * a)
                .glow(10, lockCol),
            // Padlock body (splits with glowing crack line when broken!)
            rect(172, 134, { fill: '#1b1122', stroke: lockCol, width: 3.4, radius: 16 })
                .at(lockX, lockY + 18).glow(12, lockCol).opacity(lockVis * a),
            // Keyhole dot + slot inside padlock
            circle(13, { fill: lockCol, stroke: null }).at(lockX, lockY + 6).opacity(lockVis * a),
            line([lockX, lockY + 14], [lockX, lockY + 46], { stroke: lockCol, width: 6.5 }).opacity(lockVis * a),
        )

        // Glowing diagonal lightning fracture cutting across the padlock when cracked!
        if (crackProg > 0.25) {
            const fOp = Math.min(1, (crackProg - 0.25) * 2.2) * a
            const crackPts: Vec[] = [
                [lockX - 72, lockY - 40],
                [lockX - 18, lockY - 2],
                [lockX + 14, lockY + 20],
                [lockX + 68, lockY + 72],
            ]
            nodes.push(
                new Node(polyPath(crackPts)).stroke('#ffffff', 3.4, fOp).glow(14, COSMOS.rose).set('blend', 'screen'),
                // Exploding shard sparks around cracked padlock
                dot(5.2, COSMOS.rose).at(lockX - 102 - crackProg * 18, lockY - 64 - crackProg * 12).glow(10, COSMOS.rose).opacity(fOp),
                dot(4.8, COSMOS.gold).at(lockX + 106 + crackProg * 20, lockY - 48 - crackProg * 16).glow(10, COSMOS.gold).opacity(fOp),
                dot(4.6, COSMOS.rose).at(lockX + 98 + crackProg * 16, lockY + 86 + crackProg * 10).glow(10, COSMOS.rose).opacity(fOp),
            )
        }

        // Clean cipher status flipping once from encrypted hash -> KEY RECOVERED (zero text_brief warnings)
        nodes.push(
            txt(
                crackProg > 0.55 ? 'KEY RECOVERED  ✓' : 'LOCKED: 0x9F4A·7C1E',
                lockX, 152, 27, crackProg > 0.55 ? COSMOS.gold : COSMOS.cyan, 'mono',
            ).opacity(lockVis * a),
            txt('RSA · AES · Signatures broken', lockX, 204, 26, COSMOS.ink, 'sans').opacity(lockVis * a),
            txt('One-way functions collapse', lockX, 248, 26, COSMOS.rose, 'mono').opacity(lockVis * a),
        )

        // ── RIGHT PANEL (x = +580): AUTOMATED PROOF TREE (TOP) + LIVE OPTIMAL CHIP/TSP ROUTING (BOTTOM) ──
        const sciVis = Math.max(0, Math.min(1, (p - 0.28) * 3.0))
        if (sciVis > 0.02) {
            const sOp = sciVis * a
            const busRightT = (ph * 1.4 + 0.5) % 1
            // Two clean orthogonal circuit buses from chip right edge (+148) to top/bottom right labs (+360)
            nodes.push(
                new Node(polyPath([[148, -18], [268, -18], [268, -148], [362, -148]]))
                    .stroke(COSMOS.gold, 3.2, sOp).glow(8, COSMOS.gold).set('blend', 'screen'),
                new Node(polyPath([[148, 56], [268, 56], [268, 148], [362, 148]]))
                    .stroke(COSMOS.emerald, 3.2, sOp).glow(8, COSMOS.emerald).set('blend', 'screen'),
                dot(6.0, '#ffffff').at(148 + busRightT * 120, -18).glow(12, COSMOS.gold).opacity(sOp).set('blend', 'screen'),
                dot(6.0, '#ffffff').at(148 + busRightT * 120, 56).glow(12, COSMOS.emerald).opacity(sOp).set('blend', 'screen'),
            )

            // TOP-RIGHT: Live Automated Theorem Proof Tree (y in -245..-52)
            nodes.push(
                txt('PROOFS AUTOMATED', 580, -242, 26, COSMOS.gold, 'mono').opacity(sOp),
            )
            const treeNodes: readonly Vec[] = [
                [580, -192],
                [488, -138], [672, -138],
                [438, -82], [536, -82], [624, -82], [722, -82],
            ]
            const treeEdges: readonly [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]
            for (let e = 0; e < treeEdges.length; e++) {
                const [u, v] = treeEdges[e]!
                const lit = sciVis > e * 0.14
                nodes.push(
                    line(treeNodes[u]!, treeNodes[v]!, {
                        stroke: lit ? COSMOS.gold : '#3c4866',
                        width: lit ? 3.0 : 1.6,
                    }).glow(lit ? 8 : 0, COSMOS.gold).opacity(sOp),
                )
            }
            for (let n = 0; n < treeNodes.length; n++) {
                const pt = treeNodes[n]!
                nodes.push(
                    dot(n === 0 ? 8.0 : 5.6, n === 0 ? '#ffffff' : COSMOS.gold)
                        .at(pt[0], pt[1]).glow(12, COSMOS.gold).opacity(sOp),
                )
            }
            nodes.push(txt('Q.E.D.  found in polynomial time', 580, -34, 26, COSMOS.muted, 'sans').opacity(sOp))

            // BOTTOM-RIGHT: Live Optimal Hamiltonian / Chip-Routing Solver (y in +24..+298)
            nodes.push(
                txt('PROTEINS · CHIPS · ROUTING', 580, 16, 26, COSMOS.emerald, 'mono').opacity(sOp),
            )
            // Faint tangled exponential candidate edges
            for (const [u, v] of ROUTE_CHORDS) {
                nodes.push(
                    line(ROUTE_PINS[u]!, ROUTE_PINS[v]!, { stroke: '#2c3d59', width: 1.3, opacity: 0.48 * sOp }),
                )
            }
            // Progressive blazing emerald optimal shortest cycle snapping through all 8 pins!
            const edgesLit = Math.min(ROUTE_PINS.length, Math.floor(sciVis * ROUTE_PINS.length) + 1)
            for (let i = 0; i < edgesLit; i++) {
                const p0 = ROUTE_PINS[i]!
                const p1 = ROUTE_PINS[(i + 1) % ROUTE_PINS.length]!
                nodes.push(
                    line(p0, p1, { stroke: COSMOS.emerald, width: 3.4 })
                        .glow(10, COSMOS.emerald).opacity(sOp).set('blend', 'screen'),
                )
            }
            // Traveling optimizer photon zipping smoothly around the optimal tour
            const tourF = (ph * 2.1) % ROUTE_PINS.length
            const segIdx = Math.floor(tourF)
            const segT = tourF - segIdx
            const tp0 = ROUTE_PINS[segIdx]!
            const tp1 = ROUTE_PINS[(segIdx + 1) % ROUTE_PINS.length]!
            nodes.push(
                dot(6.2, '#ffffff')
                    .at(tp0[0] + (tp1[0] - tp0[0]) * segT, tp0[1] + (tp1[1] - tp0[1]) * segT)
                    .glow(14, COSMOS.emerald).opacity(sOp).set('blend', 'screen'),
            )
            for (const pin of ROUTE_PINS) {
                nodes.push(
                    circle(7.5, { fill: '#0d2624', stroke: COSMOS.emerald, width: 2.2 }).at(pin[0], pin[1]).opacity(sOp),
                )
            }
            nodes.push(txt('Optimal tour solved instantly', 580, 294, 26, COSMOS.muted, 'sans').opacity(sOp))
        }

        // Crisp bottom caveat appearing when narration mentions n^100 (open corridor at y = 382)
        const cv = caveatVis.value * a
        if (cv > 0.02) {
            nodes.push(
                rect(1260, 58, { fill: '#121628', stroke: COSMOS.amber, width: 2.0, radius: 12 })
                    .at(0, 382).glow(6, COSMOS.amber).opacity(cv),
                txt('O(n¹⁰⁰) is still impractical  ·  yet low-degree polynomial solvers make hard problems tractable', 0, 382, 26, COSMOS.ink, 'sans')
                    .opacity(cv),
            )
        }

        return group(...nodes)
    })

    // ── Shot 2: IF P != NP (Orbiting 3D Nested Complexity Shells with exact surface-hugging rings!) ──
    const R_NP = 3.10
    const R_P = 1.32
    const Z_P = -0.55
    const Z_CROWN = 2.02
    const R_CROWN = Math.sqrt(R_NP * R_NP - Z_CROWN * Z_CROWN) + 0.03

    const neqView = scene3d({
        theta: -0.72,
        phi: 1.04,
        distance: 15.8,
        unit: 112,
        perspective: true,
        ambient: 0.42,
        shine: 0.38,
        brightness: 1.14,
        fog: 0.1,
        focus: [0, 0, 0.15],
    }).at(320, 8)

    neqView.add(
        parametricSurface(
            (u, v): Vec3 => {
                const th = u * Math.PI * 2
                const ph = v * Math.PI
                return [R_NP * Math.sin(ph) * Math.cos(th), R_NP * Math.sin(ph) * Math.sin(th), R_NP * Math.cos(ph)]
            },
            [0, 1],
            [0, 1],
            { resolution: [56, 32], color: '#4c2f8a', opacity: 0.22, mesh: '#a78bfa', meshOpacity: 0.14, meshWidth: 0.45 },
        ),
        parametricSurface(
            (u, v): Vec3 => {
                const th = u * Math.PI * 2
                const ph = v * Math.PI
                return [R_P * Math.sin(ph) * Math.cos(th), R_P * Math.sin(ph) * Math.sin(th), R_P * Math.cos(ph) + Z_P]
            },
            [0, 1],
            [0, 1],
            { resolution: [48, 28], color: COSMOS.cyan, opacity: 0.46, mesh: '#7ce8ff', meshOpacity: 0.18, meshWidth: 0.45 },
        ),
        curve3d(
            (t): Vec3 => [Math.cos(t * Math.PI * 2) * (R_NP + 0.03), Math.sin(t * Math.PI * 2) * (R_NP + 0.03), 0],
            0,
            1,
            { color: COSMOS.violet, width: 2.4, opacity: 0.76, glow: 10, blend: 'screen', samples: 220 },
        ),
        curve3d(
            (t): Vec3 => [Math.cos(t * Math.PI * 2) * (R_P + 0.03), Math.sin(t * Math.PI * 2) * (R_P + 0.03), Z_P],
            0,
            1,
            { color: COSMOS.cyan, width: 3.6, glow: 12, blend: 'screen', samples: 200 },
        ),
        curve3d(
            (t): Vec3 => [Math.cos(t * Math.PI * 2) * R_CROWN, Math.sin(t * Math.PI * 2) * R_CROWN, Z_CROWN],
            0,
            1,
            { color: COSMOS.gold, width: 5.2, glow: 16, blend: 'screen', samples: 220 },
        ),
        point3d((): Vec3 => {
            const ang = photonT.value * Math.PI * 2
            return [Math.cos(ang) * R_CROWN, Math.sin(ang) * R_CROWN, Z_CROWN]
        }, { color: '#ffffff', radius: 9.5, glow: 20, blend: 'screen' }),
        point3d((): Vec3 => {
            const ang = -photonT.value * Math.PI * 2.4
            return [Math.cos(ang) * (R_P + 0.03), Math.sin(ang) * (R_P + 0.03), Z_P]
        }, { color: COSMOS.cyan, radius: 7.5, glow: 14, blend: 'screen' }),
    )

    const neqCopy = group(
        txt('IF  P ≠ NP', -855, -395, 28, COSMOS.cyan, 'mono', 'left'),
        txt('Creativity', -860, -310, 68, COSMOS.ink, 'serif', 'left'),
        txt('≠ Checking', -860, -230, 68, COSMOS.violet, 'serif', 'left'),
        dot(7, COSMOS.gold).at(-842, -82).glow(10, COSMOS.gold),
        txt('Finding stays harder than verifying', -814, -82, 30, COSMOS.ink, 'sans', 'left'),
        dot(7, COSMOS.emerald).at(-842, 6).glow(10, COSMOS.emerald),
        txt('Modern encryption can survive', -814, 6, 30, COSMOS.ink, 'sans', 'left'),
        dot(7, COSMOS.cyan).at(-842, 94).glow(10, COSMOS.cyan),
        txt('AI & heuristics stay essential', -814, 94, 30, COSMOS.ink, 'sans', 'left'),
        txt('↑  NP-COMPLETE CROWN', 320, -405, 26, COSMOS.gold, 'mono'),
        txt('↓  CYAN CORE = P   ·   REAL GAP INSIDE NP', 320, 428, 26, COSMOS.cyan, 'mono'),
    )

    s.add(eqHeader, liveEq)
    const sceneDur = Math.max(8, c.end - c.start - 0.5)
    const caveatRel = Math.max(2.0, c.cue('one hundred').start - c.start - 0.25)
    const neqRel = c.cue('If P does not equal').start - c.start
    const neqDur = Math.max(4.0, c.end - c.cue('If P does not equal').start - 0.5)

    c.at(0.1, () => {
        s.play(par(
            photonT.to(4.2, { duration: sceneDur, ease: linear }),
            eqProg.to(1, { duration: Math.max(4.0, neqRel - 0.4), ease: linear }),
        ))
    })
    c.at(caveatRel, () => s.play(caveatVis.to(1, { duration: 0.35 })))

    c.swap('If P does not equal', eqHeader, [neqView, neqCopy])
    c.at(neqRel, () => {
        s.play(par(
            showEq.to(0, { duration: 0.16 }),
            delay(showNeq.to(1, { duration: 0.25 }), 0.2),
            delay(neqView.orbit({ theta: 0.22, phi: 0.88 }, { duration: neqDur }), 0.15),
        ))
    })
}

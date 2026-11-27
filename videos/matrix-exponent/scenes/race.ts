import {
    Node, circle, delay, dot, dynamic, group, line, linear, linearGradient, par, polyPath, radialGradient, rect, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { UPPER_MILESTONES, minBorderRank, minNonlinearGates } from '../math'

/** Helper: draw a smooth quadratic Bezier wire with a sleek arrowhead & optional animated photon dot. */
function wireArrow(
    from: Vec,
    to: Vec,
    ctrl: Vec,
    color: string,
    width: number,
    opacity: number,
    photonU?: number,
): Node[] {
    const pts: Vec[] = []
    const steps = 20
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const u = 1 - t
        pts.push([
            u * u * from[0] + 2 * u * t * ctrl[0] + t * t * to[0],
            u * u * from[1] + 2 * u * t * ctrl[1] + t * t * to[1],
        ])
    }
    // Arrowhead tangent at t = 1: direction from ctrl to to
    const dx = to[0] - ctrl[0]
    const dy = to[1] - ctrl[1]
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const ah = 11
    const aw = 5.5
    const tip = to
    const left: Vec = [tip[0] - ux * ah - uy * aw, tip[1] - uy * ah + ux * aw]
    const right: Vec = [tip[0] - ux * ah + uy * aw, tip[1] - uy * ah - ux * aw]
    const out: Node[] = [
        new Node(polyPath(pts)).stroke(color, width, opacity).glow(width > 2.6 ? 9 : 4, color).set('blend', 'screen'),
        new Node(polyPath([left, tip, right])).stroke(color, Math.max(1.8, width * 0.85), opacity).set('blend', 'screen'),
    ]
    if (photonU !== undefined) {
        const t = photonU % 1
        const u = 1 - t
        const px = u * u * from[0] + 2 * u * t * ctrl[0] + t * t * to[0]
        const py = u * u * from[1] + 2 * u * t * ctrl[1] + t * t * to[1]
        out.push(dot(5.2, '#ffffff').at(px, py).glow(12, color).opacity(opacity).set('blend', 'screen'))
    }
    return out
}

// ── Exact Strassen 2x2 wiring topology: 7 hubs M1..M7 ──
// A cells: 0=a11, 1=a12, 2=a21, 3=a22; B cells: 0=b11, 1=b12, 2=b21, 3=b22; C cells: 0=c11, 1=c12, 2=c21, 3=c22
const STRASSEN_HUBS: readonly {
    readonly name: string
    readonly aIn: readonly number[]
    readonly bIn: readonly number[]
    readonly cOut: readonly number[]
    readonly formula: string
}[] = [
    { name: 'M₁', aIn: [0, 3], bIn: [0, 3], cOut: [0, 3], formula: '(a₁₁+a₂₂)(b₁₁+b₂₂)' },
    { name: 'M₂', aIn: [2, 3], bIn: [0], cOut: [2, 3], formula: '(a₂₁+a₂₂) b₁₁' },
    { name: 'M₃', aIn: [0], bIn: [1, 3], cOut: [1, 3], formula: 'a₁₁ (b₁₂−b₂₂)' },
    { name: 'M₄', aIn: [3], bIn: [2, 0], cOut: [0, 2], formula: 'a₂₂ (b₂₁−b₁₁)' },
    { name: 'M₅', aIn: [0, 1], bIn: [3], cOut: [0, 1], formula: '(a₁₁+a₁₂) b₂₂' },
    { name: 'M₆', aIn: [2, 0], bIn: [0, 1], cOut: [3], formula: '(a₂₁−a₁₁)(b₁₁+b₁₂)' },
    { name: 'M₇', aIn: [1, 3], bIn: [2, 3], cOut: [0], formula: '(a₁₂−a₂₂)(b₂₁+b₂₂)' },
]

// Disjoint surviving blocks in the 6x6 Laser Method tensor grid (zero row/col collisions!)
const LASER_SURVIVORS = new Set(['0,0', '1,3', '2,1', '3,4', '4,2', '5,5'])

// Timeline chart coordinates (Beat 3: The Pinch)
const X_L = -740
const X_R = 760
const Y_TOP = -245
const Y_BOT = 280
function mapX(year: number): number {
    return X_L + ((year - 1968) / (2026 - 1968)) * (X_R - X_L)
}
function mapY(w: number): number {
    return Y_BOT - ((w - 1.95) / (3.08 - 1.95)) * (Y_BOT - Y_TOP)
}

export const race: SceneFunction = (s, c) => {
    const showStrassen = s.value(1)
    const strassenProg = s.value(0)
    const showLaser = s.value(0)
    const laserProg = s.value(0)
    const showPoly = s.value(0)
    const polyProg = s.value(0)
    const showPinch = s.value(0)
    const lowerRise = s.value(0)
    const showFinite = s.value(0)
    const barProg = s.value(0)

    // ── Stage 0: Strassen 1969 — Live Crossing Arrows & 7 Shared Products (8 -> 7) ──
    const strassenHeader = group(
        txt('METHOD 1  ·  STRASSEN (1969)   ·   ω = log₂ 7 ≈ 2.81', -855, -428, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Cross-wire sums into 7 shared products instead of 8', -855, -360, 50, COSMOS.ink, 'serif', 'left')
            .glow(5, '#38bdf8'),
    )

    const liveStrassen = dynamic(() => {
        const a = showStrassen.value
        if (a < 0.02) return []
        const p = strassenProg.value
        const nodes: Node[] = []

        // Left 2x2 Matrix A (cyan) and Matrix B (violet)
        const aCells: readonly { x: number; y: number; lbl: string }[] = [
            { x: -790, y: -195, lbl: 'a₁₁' },
            { x: -668, y: -195, lbl: 'a₁₂' },
            { x: -790, y: -88, lbl: 'a₂₁' },
            { x: -668, y: -88, lbl: 'a₂₂' },
        ]
        const bCells: readonly { x: number; y: number; lbl: string }[] = [
            { x: -790, y: 88, lbl: 'b₁₁' },
            { x: -668, y: 88, lbl: 'b₁₂' },
            { x: -790, y: 195, lbl: 'b₂₁' },
            { x: -668, y: 195, lbl: 'b₂₂' },
        ]
        // Right 2x2 Output Matrix C = A * B (emerald/gold)
        const cCells: readonly { x: number; y: number; lbl: string }[] = [
            { x: 645, y: -85, lbl: 'c₁₁' },
            { x: 775, y: -85, lbl: 'c₁₂' },
            { x: 645, y: 55, lbl: 'c₂₁' },
            { x: 775, y: 55, lbl: 'c₂₂' },
        ]

        // Active cycling hub index (highlights each of M1..M7 sequentially so crossing arrows pop!)
        const activeHub = Math.min(6, Math.floor(p * 7))

        // Matrix A & B group titles (cleanly above/below cells, outside arrow corridor!)
        nodes.push(
            txt('MATRIX  A', -729, -268, 26, COSMOS.cyan, 'mono').opacity(a),
            txt('MATRIX  B', -729, 272, 26, COSMOS.violet, 'mono').opacity(a),
            txt('PRODUCT  C = A·B', 710, -168, 26, COSMOS.emerald, 'mono').opacity(a),
            txt('7× RECURSIVE', 710, 152, 26, COSMOS.gold, 'mono').opacity(a),
            txt('8 → 7  ⇒  n²·⁸¹', 710, 198, 28, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(a),
        )

        // Draw A & B cells
        for (let i = 0; i < 4; i++) {
            const ac = aCells[i]!
            const bc = bCells[i]!
            const aHot = STRASSEN_HUBS[activeHub]!.aIn.includes(i)
            const bHot = STRASSEN_HUBS[activeHub]!.bIn.includes(i)
            nodes.push(
                rect(108, 86, { fill: aHot ? '#143347' : '#0f192c', stroke: COSMOS.cyan, width: aHot ? 3.2 : 1.8, radius: 12 })
                    .at(ac.x, ac.y).glow(aHot ? 10 : 3, COSMOS.cyan).opacity(a),
                txt(ac.lbl, ac.x, ac.y, 28, aHot ? '#ffffff' : COSMOS.cyan, 'mono').opacity(a),
                rect(108, 86, { fill: bHot ? '#291b47' : '#151228', stroke: COSMOS.violet, width: bHot ? 3.2 : 1.8, radius: 12 })
                    .at(bc.x, bc.y).glow(bHot ? 10 : 3, COSMOS.violet).opacity(a),
                txt(bc.lbl, bc.x, bc.y, 28, bHot ? '#ffffff' : COSMOS.violet, 'mono').opacity(a),
            )
        }

        // Draw C output cells
        for (let i = 0; i < 4; i++) {
            const cc = cCells[i]!
            const cHot = STRASSEN_HUBS[activeHub]!.cOut.includes(i)
            nodes.push(
                rect(114, 108, { fill: cHot ? '#13302c' : '#0f1b22', stroke: cHot ? COSMOS.gold : COSMOS.emerald, width: cHot ? 3.4 : 2.0, radius: 14 })
                    .at(cc.x, cc.y).glow(cHot ? 12 : 4, cHot ? COSMOS.gold : COSMOS.emerald).opacity(a),
                txt(cc.lbl, cc.x, cc.y, 30, cHot ? COSMOS.gold : COSMOS.emerald, 'mono').opacity(a),
            )
        }

        // Hub coordinates in center column (x = -40, 7 golden hubs + 1 eliminated M8 slot)
        const hubX = -40
        const hubYs = Array.from({ length: 7 }, (_, k) => -234 + k * 74)

        // Crossing wires strictly inside left corridor (-610..-90) and right corridor (+12..+582) — ZERO text inside!
        const aPortY = [-212, -176, -104, -68]
        const bPortY = [68, 104, 176, 212]
        const cPortY = [-112, -56, 28, 84]

        for (let h = 0; h < 7; h++) {
            const hub = STRASSEN_HUBS[h]!
            const hy = hubYs[h]!
            const isHot = h === activeHub
            const wOp = (isHot ? 0.96 : 0.24) * a
            const wW = isHot ? 3.2 : 1.5

            // A -> Hub crossing wires (cyan)
            for (const ai of hub.aIn) {
                const sy = aPortY[ai]!
                nodes.push(
                    ...wireArrow([-610, sy], [hubX - 44, hy - 6], [-345, (sy + hy) * 0.5 - 24], COSMOS.cyan, wW, wOp, isHot ? (p * 5 + ai * 0.2) % 1 : undefined),
                )
            }
            // B -> Hub crossing wires (violet)
            for (const bi of hub.bIn) {
                const sy = bPortY[bi]!
                nodes.push(
                    ...wireArrow([-610, sy], [hubX - 44, hy + 6], [-345, (sy + hy) * 0.5 + 24], COSMOS.violet, wW, wOp, isHot ? (p * 5 + bi * 0.25 + 0.4) % 1 : undefined),
                )
            }
            // Hub -> C output recombination wires (gold/emerald)
            for (const ci of hub.cOut) {
                const ty = cPortY[ci]!
                nodes.push(
                    ...wireArrow([hubX + 44, hy], [582, ty], [275, (hy + ty) * 0.5 + (ci % 2 === 0 ? -28 : 28)], isHot ? COSMOS.gold : COSMOS.emerald, wW, wOp, isHot ? (p * 5 + ci * 0.3 + 0.2) % 1 : undefined),
                )
            }

            // Hub node M1..M7
            nodes.push(
                circle(32, {
                    fill: isHot ? '#2d2316' : '#131829',
                    stroke: isHot ? COSMOS.gold : '#5d6f9e',
                    width: isHot ? 3.4 : 2.0,
                }).at(hubX, hy).glow(isHot ? 14 : 4, COSMOS.gold).opacity(a),
                txt(hub.name, hubX, hy, 26, isHot ? COSMOS.gold : COSMOS.ink, 'mono').opacity(a),
            )
        }

        // Eliminated 8th product M8 cleanly below M7 (crossed out in rose!)
        const m8y = 286
        nodes.push(
            circle(28, { fill: '#190f18', stroke: COSMOS.rose, width: 2.0, dash: [5, 5] }).at(hubX, m8y).opacity(0.65 * a),
            txt('M₈', hubX, m8y, 26, COSMOS.rose, 'mono').opacity(0.55 * a),
            txt('8th product ELIMINATED  (cheap adds replace 1 mult!)', hubX + 48, m8y, 26, COSMOS.rose, 'mono', 'left').opacity(a),
            // Active hub formula cleanly centered above M1
            txt(`ACTIVE:  ${STRASSEN_HUBS[activeHub]!.name} = ${STRASSEN_HUBS[activeHub]!.formula}`, 285, -288, 27, COSMOS.gold, 'mono')
                .glow(6, COSMOS.gold).opacity(a),
            // Bottom live evolution strip
            txt('3.00 Naive   →   [ 2.81 Strassen ]   →   2.371 Laser   →   2.25 Exact 9/4', 0, 412, 26, COSMOS.cyan, 'mono').opacity(a),
        )

        return group(...nodes)
    })

    // ── Stage 1: Border Rank (eps -> 0) + Coppersmith–Winograd Laser Method ──
    const laserHeader = group(
        txt('METHOD 2  ·  BORDER RANK & THE LASER METHOD (1979–2024)   ·   ω → 2.371', -855, -428, 26, COSMOS.violet, 'mono', 'left'),
        txt('Cancel ε-errors, then laser away colliding tensor blocks', -855, -360, 50, COSMOS.ink, 'serif', 'left')
            .glow(5, COSMOS.violet),
    )

    const liveLaser = dynamic(() => {
        const a = showLaser.value
        if (a < 0.02) return []
        const p = laserProg.value
        const nodes: Node[] = []

        // Left Half: Border Rank (epsilon -> 0 canceling error waves)
        const eps = Math.max(0.001, Math.pow(1 - Math.min(1, p * 1.45), 2.4))
        const wavePts: Vec[] = []
        for (let i = 0; i <= 48; i++) {
            const u = i / 48
            const x = -815 + u * 660
            const y = 38 + Math.sin(u * Math.PI * 6 + p * 8) * (76 * eps)
            wavePts.push([x, y])
        }
        nodes.push(
            txt('1. BORDER RANK  (Bini 1979)', -835, -245, 27, COSMOS.cyan, 'mono', 'left').opacity(a),
            tex(String.raw`T_n + \varepsilon E_1 + \varepsilon^2 E_2 \;\xrightarrow{\;\varepsilon \to 0\;}\; T_n`, {
                size: 32,
                color: COSMOS.ink,
            }).at(-490, -162).opacity(a),
            // Exact target baseline (gold) vs shrinking rose epsilon error wave
            line([-815, 38], [-155, 38], { stroke: COSMOS.gold, width: 3.4 }).glow(10, COSMOS.gold).opacity(a).set('blend', 'screen'),
            new Node(polyPath(wavePts)).stroke(COSMOS.rose, 3.6, (0.3 + 0.7 * eps) * a).glow(8, COSMOS.rose).set('blend', 'screen'),
            txt(`ε = ${eps < 0.01 ? '0.000 (EXACT LIMIT)' : eps.toFixed(2)}`, -485, 165, 28, eps < 0.02 ? COSMOS.emerald : COSMOS.rose, 'mono').opacity(a),
            txt('Allow tiny ε cross-terms to use fewer products,', -835, 240, 27, COSMOS.muted, 'sans', 'left').opacity(a),
            txt('then interpolate ε → 0 for exact multiplication.', -835, 286, 27, COSMOS.muted, 'sans', 'left').opacity(a),
            // Vertical center divider filament
            line([-40, -255], [-40, 315], { stroke: '#29385d', width: 2.0 }).opacity(a),
        )

        // Right Half: Coppersmith–Winograd Laser Method (6x6 tensor power grid with sweeping lasers!)
        const gridLeft = 185
        const gridTop = -165
        const cellSz = 66
        const cellGap = 76
        const cutProg = Math.max(0, Math.min(1, (p - 0.08) / 0.48))

        nodes.push(
            txt('2. LASER METHOD  (CW 1987 – 2024)', 65, -245, 27, COSMOS.violet, 'mono', 'left').opacity(a),
        )

        // Draw 6x6 tensor blocks: colliding blocks get sliced dark; 6 disjoint survivors glow bright gold with 2x2 sub-blocks!
        for (let r = 0; r < 6; r++) {
            for (let colIdx = 0; colIdx < 6; colIdx++) {
                const bx = gridLeft + colIdx * cellGap
                const by = gridTop + r * cellGap
                const isSurv = LASER_SURVIVORS.has(`${r},${colIdx}`)
                const dim = isSurv ? 1 : Math.max(0.15, 1 - cutProg * 0.85)
                const lit = isSurv && cutProg > 0.32
                const fill = lit ? '#3a2d14' : '#121a30'
                const stroke = lit ? COSMOS.gold : cutProg > 0.32 ? '#3a2238' : COSMOS.violet
                nodes.push(
                    rect(cellSz, cellSz, { fill, stroke, width: lit ? 3.2 : 1.6, radius: 10 })
                        .at(bx, by).glow(lit ? 12 : 2, stroke).opacity(dim * a),
                )
                if (lit && cutProg > 0.42) {
                    const subOp = Math.min(1, (cutProg - 0.42) / 0.35) * a
                    // Tiny glowing 2x2 independent matrix product packed inside each surviving block!
                    for (const dx of [-12, 12]) {
                        for (const dy of [-12, 12]) {
                            nodes.push(
                                rect(18, 18, { fill: '#ffd16688', stroke: '#ffffff', width: 1.2, radius: 3 })
                                    .at(bx + dx, by + dy).opacity(subOp).set('blend', 'screen'),
                            )
                        }
                    }
                }
            }
        }

        // Sweeping cyan/rose laser beams zeroing out colliding cells!
        if (cutProg > 0.02 && cutProg < 0.96) {
            const sweepY = gridTop - 38 + cutProg * (6 * cellGap)
            const sweepX = gridLeft - 38 + cutProg * (6 * cellGap)
            const lOp = Math.sin(cutProg * Math.PI) * a
            nodes.push(
                line([gridLeft - 44, sweepY], [gridLeft + 5 * cellGap + 44, sweepY], { stroke: COSMOS.rose, width: 4.5 })
                    .glow(16, COSMOS.rose).opacity(lOp).set('blend', 'screen'),
                line([sweepX, gridTop - 40], [sweepX, gridTop + 5 * cellGap + 38], { stroke: COSMOS.cyan, width: 4.5 })
                    .glow(16, COSMOS.cyan).opacity(lOp).set('blend', 'screen'),
            )
        }

        nodes.push(
            txt('Zero colliding blocks → pack disjoint products (2.371)', 440, 304, 26, COSMOS.gold, 'sans').opacity(a),
            txt('3.00 Naive   →   2.81 Strassen   →   [ 2.371 Laser ]   →   2.25 Exact 9/4', 0, 412, 26, COSMOS.violet, 'mono').opacity(a),
        )

        return group(...nodes)
    })

    // ── Stage 2: Polynomial Degenerations (Oct 2026: Breaking the Laser Barrier to 9/4!) ──
    const polyHeader = group(
        txt('METHOD 3  ·  POLYNOMIAL DEGENERATIONS (OCT 2026)   ·   ω ≤ 9/4', -855, -428, 26, COSMOS.gold, 'mono', 'left'),
        txt('Split independent matrix legs out of polynomial multiplication', -855, -360, 48, COSMOS.ink, 'serif', 'left')
            .glow(6, COSMOS.gold),
    )

    const livePoly = dynamic(() => {
        const a = showPoly.value
        if (a < 0.02) return []
        const p = polyProg.value
        const nodes: Node[] = []

        // Left: Two polynomial degree waves P(x) (cyan) and Q(x) (violet)
        const pWave: Vec[] = []
        const qWave: Vec[] = []
        for (let i = 0; i <= 40; i++) {
            const u = i / 40
            const x = -835 + u * 315
            pWave.push([x, -118 + Math.sin(u * Math.PI * 5 - p * 6) * 26])
            qWave.push([x, 118 + Math.cos(u * Math.PI * 4 - p * 5) * 26])
        }
        nodes.push(
            txt('P(x) = Σ aᵢ xⁱ', -678, -195, 28, COSMOS.cyan, 'mono').opacity(a),
            new Node(polyPath(pWave)).stroke(COSMOS.cyan, 4.2, a).glow(10, COSMOS.cyan).set('blend', 'screen'),
            txt('Q(x) = Σ bⱼ xʲ', -678, 195, 28, COSMOS.violet, 'mono').opacity(a),
            new Node(polyPath(qWave)).stroke(COSMOS.violet, 4.2, a).glow(10, COSMOS.violet).set('blend', 'screen'),
        )

        // Arrows from P(x) and Q(x) into central Polynomial Multiplication / Degeneration Core (-125, 0)
        const coreX = -105
        nodes.push(
            ...wireArrow([-510, -118], [coreX - 135, -34], [-365, -105], COSMOS.cyan, 3.6, a, (p * 3) % 1),
            ...wireArrow([-510, 118], [coreX - 135, 34], [-365, 105], COSMOS.violet, 3.6, a, (p * 3 + 0.5) % 1),
            // Central blazing Polynomial Degeneration Prism
            circle(132, {
                fill: radialGradient([0, 0], 132, [
                    [0, '#ffd16640'],
                    [0.65, '#4c2f8a22'],
                    [1, '#07091000'],
                ]),
                stroke: COSMOS.gold,
                width: 3.4,
            }).at(coreX, 0).glow(16, COSMOS.gold).opacity(a),
            txt('P(x)·Q(x)', coreX, -22, 32, COSMOS.ink, 'mono').opacity(a),
            txt('DEGENERATION', coreX, 26, 26, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(a),
        )

        // Diverging golden extraction arrows splitting into 3 tensor legs on the right:
        // Independent A leg (top), Independent B leg (middle), Shared C leg (bottom)!
        const legs = [
            { y: -158, title: 'Independent Leg A', sub: 'Decoupled input blocks', col: COSMOS.cyan },
            { y: 0, title: 'Independent Leg B', sub: 'Decoupled input blocks', col: COSMOS.violet },
            { y: 158, title: 'Shared Output Leg C', sub: 'Spectral profile ⇒ ω ≤ 9/4', col: COSMOS.gold },
        ] as const

        for (let k = 0; k < legs.length; k++) {
            const leg = legs[k]!
            const vis = Math.max(0, Math.min(1, p * 3.8 - k * 0.22))
            if (vis < 0.02) continue
            const op = vis * a
            nodes.push(
                ...wireArrow([coreX + 135, (k - 1) * 32], [295, leg.y], [160, leg.y * 0.72], leg.col, 3.8, op, (p * 3.5 + k * 0.3) % 1),
                rect(510, 104, { fill: '#111728', stroke: leg.col, width: 2.6, radius: 14 })
                    .at(560, leg.y).glow(10, leg.col).opacity(op),
                txt(leg.title, 560, leg.y - 18, 28, leg.col, 'mono').opacity(op),
                txt(leg.sub, 560, leg.y + 22, 26, COSMOS.muted, 'sans').opacity(op),
            )
        }

        nodes.push(
            txt('Bypasses Coppersmith–Winograd laser barriers over every field F', 0, 310, 30, COSMOS.emerald, 'sans').opacity(a),
            txt('3.00 Naive   →   2.81 Strassen   →   2.371 Laser   →   [ 2.25 Exact 9/4 ]', 0, 412, 26, COSMOS.gold, 'mono')
                .glow(6, COSMOS.gold).opacity(a),
        )

        return group(...nodes)
    })

    // ── Stage 3: The 57-Year Pinch (Lower Bound Rockets 2.00 -> 2.25!) ──
    const pinchHeader = group(
        txt('NOVEMBER 24, 2026  ·  THE LOWER BOUND FINALLY MOVES', -855, -425, 26, COSMOS.rose, 'mono', 'left'),
        txt('Upper bounds fell — now the lower bound slams shut at 9/4', -855, -356, 48, COSMOS.ink, 'serif', 'left')
            .glow(5, COSMOS.gold),
    )

    const upperGrad = linearGradient([X_L, Y_TOP], [X_R, mapY(2.25)], [COSMOS.cyan, COSMOS.blue, COSMOS.violet, COSMOS.gold])

    const livePinch = dynamic(() => {
        const a = showPinch.value
        if (a < 0.02) return []
        const lr = lowerRise.value
        const nodes: Node[] = []

        for (const tick of [2.0, 2.25, 2.5, 2.75, 3.0]) {
            const gy = mapY(tick)
            const isExact = tick === 2.25
            nodes.push(
                line([X_L, gy], [X_R, gy], {
                    stroke: isExact ? COSMOS.gold : '#1f2b48',
                    width: isExact ? 2.2 : 1.4,
                    dash: isExact ? [10, 6] : [5, 7],
                }).opacity((isExact ? 0.45 + 0.55 * lr : 0.7) * a),
                txt(tick.toFixed(2), X_L - 22, gy, 26, isExact ? COSMOS.gold : COSMOS.dim, 'mono', 'right').opacity(a),
            )
        }
        for (const yr of [1969, 1980, 1990, 2000, 2012, 2026]) {
            const gx = mapX(yr)
            nodes.push(
                line([gx, Y_BOT - 6], [gx, Y_BOT + 8], { stroke: '#445784', width: 2.0 }).opacity(a),
                txt(String(yr), gx, Y_BOT + 36, 26, yr === 2026 ? COSMOS.gold : COSMOS.dim, 'mono').opacity(a),
            )
        }
        nodes.push(
            line([X_L, Y_TOP], [X_L, Y_BOT], { stroke: '#4a5f8f', width: 2.4 }).opacity(a),
            line([X_L, Y_BOT], [X_R, Y_BOT], { stroke: '#4a5f8f', width: 2.4 }).opacity(a),
        )

        // Full upper-bound descent curve (all methods we just watched!)
        const upperPts: Vec[] = UPPER_MILESTONES.map((m) => [mapX(m.year), mapY(m.omega)])
        nodes.push(
            new Node(polyPath(upperPts)).stroke(upperGrad, 5.2, a).glow(10, COSMOS.cyan).set('blend', 'screen'),
        )
        const callouts: readonly { idx: number; dx: number; dy: number; text: string; col: string }[] = [
            { idx: 1, dx: 18, dy: -46, text: 'Strassen (2.81)', col: COSMOS.cyan },
            { idx: 5, dx: 24, dy: -52, text: 'Laser Method (2.376)', col: COSMOS.violet },
            { idx: 8, dx: -175, dy: -94, text: 'Laser 2024 (2.3713)', col: COSMOS.violet },
        ]
        for (const cOut of callouts) {
            const m = UPPER_MILESTONES[cOut.idx]!
            const px = mapX(m.year)
            const py = mapY(m.omega)
            nodes.push(
                dot(6.5, cOut.col).at(px, py).glow(10, cOut.col).opacity(a),
                txt(cOut.text, px + cOut.dx, py + cOut.dy, 26, cOut.col, 'mono', 'left').opacity(a),
            )
        }

        // Lower bound trapped at 2.00, then rocketing vertically to 2.25!
        const lbY = mapY(2.0)
        const targetY = mapY(2.25)
        const x2026 = mapX(2026)
        const lbPts: Vec[] = [[X_L, lbY], [x2026 - 16, lbY]]
        if (lr > 0.02) {
            lbPts.push([x2026, lbY + (targetY - lbY) * lr])
        }
        nodes.push(
            new Node(polyPath(lbPts)).stroke(COSMOS.rose, 4.8, 0.92 * a).glow(10, COSMOS.rose).set('blend', 'screen'),
            txt('LOWER BOUNDS TRAPPED AT ω ≥ 2.00  (Bläser 2.5n² · Landsberg 3n²)', -150, lbY - 30, 26, COSMOS.rose, 'mono')
                .opacity(a),
        )

        if (lr > 0.45) {
            const pOp = Math.min(1, (lr - 0.45) / 0.55) * a
            nodes.push(
                circle(44 + (1 - pOp) * 65, { fill: null, stroke: COSMOS.gold, width: 3.6 })
                    .at(x2026, targetY).glow(14, COSMOS.gold).opacity(pOp * 0.9).set('blend', 'screen'),
                dot(11, '#ffffff').at(x2026, targetY).glow(22, COSMOS.gold).opacity(pOp).set('blend', 'screen'),
                txt('NOV 2026:  ω = 9/4 LOCKED', x2026 - 122, targetY + 42, 28, COSMOS.gold, 'mono', 'right')
                    .glow(8, COSMOS.gold).opacity(pOp),
                txt('Refutes Strassen 1994 tight-tensor conjecture', 0, 392, 30, COSMOS.gold, 'sans').opacity(pOp),
            )
        }

        return group(...nodes)
    })

    // ── Stage 4: Exact Finite-Size Law (Corollary 1) at n = 256 = 2^8 ──
    const finiteHeader = group(
        txt('EXACT FINITE-SIZE FLOOR  (EVERY n ≥ 2, EVERY FIELD F)', 0, -415, 26, COSMOS.gold, 'mono'),
        txt('Not just asymptotic — a hard wall at every matrix size', 0, -342, 54, COSMOS.ink, 'serif')
            .glow(6, COSMOS.gold),
        tex(String.raw`\underline{R}(T_n) \;\ge\; n^{9/4} \qquad\text{and}\qquad \text{nonlinear gates} \;\ge\; \left\lceil \frac{n^{9/4}}{2} \right\rceil`, {
            size: 46,
            color: COSMOS.gold,
        }).at(0, -210).glow(7, COSMOS.gold),
    )

    const liveFinite = dynamic(() => {
        const a = showFinite.value
        if (a < 0.02) return []
        const bp = barProg.value
        const n = 256
        const rankExact = minBorderRank(n)
        const gatesExact = minNonlinearGates(n)
        const barLeft = -640
        const fullW = 1220
        const w17 = fullW * 0.5 * bp
        const w18 = fullW * bp

        return group(
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, '#ffd1661c'],
                    [0.5, '#5ce1e610'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, 120).opacity(a).set('blend', 'screen'),
            txt('CONCRETE TEST AT  n = 256 = 2⁸', barLeft, -74, 28, COSMOS.cyan, 'mono', 'left').opacity(a),
            txt('Earlier proposed border rank  (2¹⁷ = 131,072)  —  RULED OUT', barLeft, 2, 27, COSMOS.rose, 'mono', 'left').opacity(a),
            rect(fullW, 44, { fill: '#190f1d', stroke: '#3a223d', width: 1.8, radius: 10 }).at(barLeft + fullW * 0.5, 52).opacity(a),
            rect(Math.max(8, w17), 34, { fill: '#ff6b8b55', stroke: COSMOS.rose, width: 2.4, radius: 8 })
                .at(barLeft + Math.max(8, w17) * 0.5 + 4, 52).opacity(a),
            txt(`Proven geometric border rank  (2¹⁸ = ${rankExact.toLocaleString('en-US')})  —  EXACT FLOOR`, barLeft, 138, 27, COSMOS.gold, 'mono', 'left')
                .glow(6, COSMOS.gold).opacity(a),
            rect(fullW, 48, { fill: '#141928', stroke: COSMOS.gold, width: 2.4, radius: 10 }).at(barLeft + fullW * 0.5, 192).opacity(a),
            rect(Math.max(8, w18 - 8), 38, { fill: '#ffd16668', stroke: COSMOS.gold, width: 2.6, radius: 8 })
                .at(barLeft + Math.max(8, w18 - 8) * 0.5 + 4, 192).glow(12, COSMOS.gold).opacity(a).set('blend', 'screen'),
            txt(
                `At n = 256, every formal circuit needs ≥ ${gatesExact.toLocaleString('en-US')} multiplication or division gates.`,
                0,
                325,
                32,
                COSMOS.emerald,
                'sans',
            ).opacity(a),
            txt('Holds over ℝ, ℂ, and every finite field — even if additions are free.', 0, 385, 28, COSMOS.muted, 'sans').opacity(a),
        )
    })

    // Register dynamic stages + initial header
    s.add(strassenHeader, liveStrassen, liveLaser, livePoly, livePinch, liveFinite)

    // Beat 0: Strassen 7-product crossing arrows
    const tLaser = c.cue('Next came border rank').start - c.start
    c.at(0.1, () => s.play(strassenProg.to(1, { duration: Math.max(3.0, tLaser - 0.35), ease: linear })))

    // Beat 1: Border rank (eps -> 0) + Laser Method
    const tPoly = c.cue('polynomial degenerations').start - c.start
    c.swap('Next came border rank', strassenHeader, laserHeader)
    c.at(tLaser, () => {
        s.play(par(
            showStrassen.to(0, { duration: 0.16 }),
            delay(showLaser.to(1, { duration: 0.26 }), 0.2),
            delay(laserProg.to(1, { duration: Math.max(3.0, tPoly - tLaser - 0.5), ease: linear }), 0.24),
        ))
    })

    // Beat 2: Polynomial Degenerations (9/4)
    const tPinch = c.cue('Yet for half a century').start - c.start
    c.swap('polynomial degenerations', laserHeader, polyHeader)
    c.at(tPoly, () => {
        s.play(par(
            showLaser.to(0, { duration: 0.16 }),
            delay(showPoly.to(1, { duration: 0.26 }), 0.2),
            delay(polyProg.to(1, { duration: Math.max(3.0, tPinch - tPoly - 0.5), ease: linear }), 0.24),
        ))
    })

    // Beat 3: The 57-Year Pinch (lower bound rockets up on "lower bound rockets")
    const tFinite = c.cue('Even at finite sizes').start - c.start
    c.swap('Yet for half a century', polyHeader, pinchHeader)
    c.at(tPinch, () => {
        s.play(par(
            showPoly.to(0, { duration: 0.16 }),
            delay(showPinch.to(1, { duration: 0.26 }), 0.2),
        ))
    })
    c.on('lower bound rockets', () => s.play(lowerRise.to(1, { duration: 1.1 })))

    // Beat 4: Finite-Size Floor (n = 256)
    const finiteDur = Math.max(2.0, c.end - c.cue('Even at finite sizes').start - 0.6)
    c.swap('Even at finite sizes', pinchHeader, finiteHeader)
    c.at(tFinite, () => {
        s.play(par(
            showPinch.to(0, { duration: 0.16 }),
            delay(showFinite.to(1, { duration: 0.28 }), 0.2),
            delay(barProg.to(1, { duration: Math.min(2.2, finiteDur * 0.55) }), 0.28),
        ))
    })
}

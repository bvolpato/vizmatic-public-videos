import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, rect, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { GATE_ROOTS, HONEST_QAP, VANISHING_POLY, WIRE_TRACE_POLY, evalPoly } from '../math'
import { txt } from '../../../factory/style'

const GATE_Y = -28
const GATE_SPECS = [
    { x: -610, y: GATE_Y, op: '×', title: 'Gate 1', expr: 'x · x = 9', val: 'v₁ = 9' },
    { x: -205, y: GATE_Y, op: '×', title: 'Gate 2', expr: 'v₁ · x = 27', val: 'v₂ = 27' },
    { x: 205, y: GATE_Y, op: '+', title: 'Gate 3', expr: 'v₂ + x = 30', val: 'v₃ = 30' },
    { x: 610, y: GATE_Y, op: '+', title: 'Gate 4', expr: 'v₃ + 5 = 35', val: 'out = 35' },
] as const

const WITNESS_SRC: Vec = [285, -295]
const CONST5_SRC: Vec = [645, -295]

function cubicBezier(p0: Vec, p1: Vec, p2: Vec, p3: Vec, t: number): Vec {
    const u = 1 - t
    const tt = t * t
    const uu = u * u
    const uuu = uu * u
    const ttt = tt * t
    return [
        uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0],
        uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1],
    ]
}

function sampleBezier(p0: Vec, p1: Vec, p2: Vec, p3: Vec, steps = 36): Vec[] {
    return Array.from({ length: steps }, (_, i) => cubicBezier(p0, p1, p2, p3, i / (steps - 1)))
}

// Curved glowing fan-out wires from x = 3 into Gates 1, 2, 3 and constant 5 into Gate 4
const WITNESS_WIRES: readonly {
    readonly p0: Vec
    readonly p1: Vec
    readonly p2: Vec
    readonly p3: Vec
    readonly pts: Vec[]
    readonly col: string
    readonly phase: number
}[] = [
    {
        p0: [WITNESS_SRC[0] - 45, WITNESS_SRC[1] + 30],
        p1: [40, -185],
        p2: [-560, -225],
        p3: [GATE_SPECS[0].x - 14, GATE_Y - 66],
        pts: sampleBezier([WITNESS_SRC[0] - 45, WITNESS_SRC[1] + 30], [40, -185], [-560, -225], [GATE_SPECS[0].x - 14, GATE_Y - 66]),
        col: '#a78bfa',
        phase: 0.0,
    },
    {
        p0: [WITNESS_SRC[0] - 32, WITNESS_SRC[1] + 42],
        p1: [-20, -160],
        p2: [-520, -195],
        p3: [GATE_SPECS[0].x + 18, GATE_Y - 64],
        pts: sampleBezier([WITNESS_SRC[0] - 32, WITNESS_SRC[1] + 42], [-20, -160], [-520, -195], [GATE_SPECS[0].x + 18, GATE_Y - 64]),
        col: '#c4b5fd',
        phase: 0.35,
    },
    {
        p0: [WITNESS_SRC[0] - 12, WITNESS_SRC[1] + 50],
        p1: [110, -155],
        p2: [-155, -185],
        p3: [GATE_SPECS[1].x, GATE_Y - 66],
        pts: sampleBezier([WITNESS_SRC[0] - 12, WITNESS_SRC[1] + 50], [110, -155], [-155, -185], [GATE_SPECS[1].x, GATE_Y - 66]),
        col: '#a78bfa',
        phase: 0.58,
    },
    {
        p0: [WITNESS_SRC[0] + 10, WITNESS_SRC[1] + 52],
        p1: [275, -165],
        p2: [220, -155],
        p3: [GATE_SPECS[2].x, GATE_Y - 66],
        pts: sampleBezier([WITNESS_SRC[0] + 10, WITNESS_SRC[1] + 52], [275, -165], [220, -155], [GATE_SPECS[2].x, GATE_Y - 66]),
        col: '#ffd166',
        phase: 0.78,
    },
    {
        p0: [CONST5_SRC[0], CONST5_SRC[1] + 50],
        p1: [CONST5_SRC[0] + 10, -175],
        p2: [GATE_SPECS[3].x + 15, -160],
        p3: [GATE_SPECS[3].x, GATE_Y - 66],
        pts: sampleBezier([CONST5_SRC[0], CONST5_SRC[1] + 50], [CONST5_SRC[0] + 10, -175], [GATE_SPECS[3].x + 15, -160], [GATE_SPECS[3].x, GATE_Y - 66]),
        col: '#6ee7b7',
        phase: 0.22,
    },
]

const WITNESS_CELLS = [
    { sym: '1', val: '1', col: '#9eb0d0', gateIdx: -1 },
    { sym: 'x', val: '3', col: '#ffd166', gateIdx: -1 },
    { sym: 'v₁', val: '9', col: '#5ce1e6', gateIdx: 0 },
    { sym: 'v₂', val: '27', col: '#5ce1e6', gateIdx: 1 },
    { sym: 'v₃', val: '30', col: '#a78bfa', gateIdx: 2 },
    { sym: 'out', val: '35', col: '#6ee7b7', gateIdx: 3 },
] as const

// Mini polynomial trace preview inside bottom-right card of Shot 1
const MINI_X0 = 330
const MINI_X1 = 765
const MINI_Y0 = 385
const MINI_H = 115
const mapMiniT = (t: number) => MINI_X0 + ((t - 0.75) / 3.5) * (MINI_X1 - MINI_X0)
const mapMiniY = (v: number) => MINI_Y0 - (v / 40) * MINI_H
const MINI_CURVE_PTS: Vec[] = Array.from({ length: 80 }, (_, i) => {
    const t = 0.8 + (3.4 * i) / 79
    const y = evalPoly(WIRE_TRACE_POLY, t)
    return [mapMiniT(t), Math.max(MINI_Y0 - MINI_H - 12, Math.min(MINI_Y0 + 10, mapMiniY(y)))] as Vec
})

// Precompute smooth Lagrange wire trace curve mapped onto stage coordinates (Shot 2)
const PLOT_X0 = -740
const PLOT_X1 = 740
const PLOT_Y_ZERO = 195
const PLOT_SCALE_Y = 7.8

const mapT = (t: number) => PLOT_X0 + ((t - 0.65) / 3.7) * (PLOT_X1 - PLOT_X0)
const mapWireY = (v: number) => PLOT_Y_ZERO - v * PLOT_SCALE_Y

const TRACE_SAMPLES = 220
const WIRE_CURVE_PTS: Vec[] = Array.from({ length: TRACE_SAMPLES }, (_, i) => {
    const t = 0.72 + (3.56 * i) / (TRACE_SAMPLES - 1)
    const y = evalPoly(WIRE_TRACE_POLY, t)
    return [mapT(t), Math.max(-240, Math.min(310, mapWireY(y)))] as Vec
})

// Precompute normalized QAP P(t) = H(t) * Z(t) wave vanishing cleanly at t = 1, 2, 3, 4
const QAP_CURVE_PTS: Vec[] = Array.from({ length: TRACE_SAMPLES }, (_, i) => {
    const t = 0.82 + (3.36 * i) / (TRACE_SAMPLES - 1)
    const zVal = evalPoly(VANISHING_POLY, t)
    const pVal = evalPoly(HONEST_QAP.P, t)
    const combined = zVal * 26 + pVal * 0.008
    return [mapT(t), PLOT_Y_ZERO - Math.max(-135, Math.min(135, combined))] as Vec
})

export const circuit: SceneFunction = (s, c) => {
    const showCircuit = s.value(1)
    const pulseProg = s.value(0)
    const wireLoop = s.value(0)
    const showPoly = s.value(0)
    const curveDraw = s.value(0)
    const showRoots = s.value(0)

    const puzzleEq = group(
        txt('R1CS ARITHMETIZATION', 0, -425, 26, '#5ce1e6', 'mono'),
        tex(String.raw`x^3 + x + 5 = 35`, { size: 68, color: '#f8f4ec' }).at(-310, -295).glow(6, '#7c8cff'),
        // Secret Witness x = 3 badge
        circle(54, { fill: '#1a1438', stroke: '#a78bfa', width: 3.4 }).at(WITNESS_SRC[0], WITNESS_SRC[1]).glow(12, '#a78bfa'),
        txt('x = 3', WITNESS_SRC[0], WITNESS_SRC[1] + 2, 30, '#ffd166', 'mono').glow(6, '#ffd166'),
        txt('SECRET WITNESS', WITNESS_SRC[0], WITNESS_SRC[1] - 74, 26, '#d4c2ff', 'mono'),
        // Constant 5 source badge feeding Gate 4
        circle(48, { fill: '#102825', stroke: '#6ee7b7', width: 3.2 }).at(CONST5_SRC[0], CONST5_SRC[1]).glow(10, '#6ee7b7'),
        txt('5', CONST5_SRC[0], CONST5_SRC[1] + 2, 34, '#6ee7b7', 'mono').glow(6, '#6ee7b7'),
        txt('CONST', CONST5_SRC[0], CONST5_SRC[1] - 74, 26, '#6ee7b7', 'mono'),
    )

    const liveCircuit = dynamic(() => {
        if (showCircuit.value < 0.02) return []
        const a = showCircuit.value
        const p = pulseProg.value
        const loop = wireLoop.value
        const nodes: Node[] = []

        // Crisp glowing curved fan-out wires from x = 3 into Gates 1, 2, 3 & constant 5 into Gate 4
        for (const w of WITNESS_WIRES) {
            nodes.push(
                new Node(polyPath(w.pts)).stroke(w.col, 3.0, 0.58 * a).glow(8, w.col).set('blend', 'screen'),
                new Node(polyPath(w.pts)).stroke('#ffffff', 1.0, 0.28 * a).set('blend', 'screen'),
            )
            // Two racing signal pulses per wire
            for (let k = 0; k < 2; k++) {
                const u = (loop * 0.48 + w.phase + k * 0.5) % 1
                const [px, py] = cubicBezier(w.p0, w.p1, w.p2, w.p3, u)
                nodes.push(
                    dot(6.5, w.col).at(px, py).opacity(0.95 * a).glow(12, w.col).set('blend', 'screen'),
                    dot(3.2, '#ffffff').at(px, py).opacity(a).set('blend', 'screen'),
                )
            }
        }

        // Connecting wires between gates with continuous moving cyan photons
        for (let i = 0; i < GATE_SPECS.length - 1; i++) {
            const g1 = GATE_SPECS[i]!
            const g2 = GATE_SPECS[i + 1]!
            const xA = g1.x + 68
            const xB = g2.x - 68
            const wireActive = Math.max(0, Math.min(1, p * 4 - i))
            nodes.push(
                line([xA, g1.y], [xB, g2.y], { stroke: '#2c3d66', width: 4.2, opacity: 0.75 * a }),
                line([xA, g1.y], [xA + (xB - xA) * wireActive, g2.y], { stroke: '#5ce1e6', width: 4.5, opacity: 0.95 * a })
                    .glow(10, '#5ce1e6')
                    .set('blend', 'screen'),
            )
            if (wireActive > 0.15) {
                const pulseU = (loop * 0.65 + i * 0.31) % 1
                const px = xA + (xB - xA) * Math.min(wireActive, pulseU)
                nodes.push(
                    dot(7.5, '#5ce1e6').at(px, g1.y).opacity(a).glow(14, '#5ce1e6').set('blend', 'screen'),
                    dot(3.8, '#ffffff').at(px, g1.y).opacity(a).set('blend', 'screen'),
                )
            }
        }

        // Four arithmetic gates
        for (let i = 0; i < GATE_SPECS.length; i++) {
            const g = GATE_SPECS[i]!
            const lit = Math.max(0, Math.min(1, p * 4.4 - i * 0.85))
            const ringCol = lit > 0.75 ? '#6ee7b7' : '#5ce1e6'
            nodes.push(
                circle(92, {
                    fill: radialGradient([0, 0], 92, [
                        [0, lit > 0.75 ? '#6ee7b728' : '#5ce1e618'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                }).at(g.x, g.y).opacity(a),
                circle(64, { fill: '#101629', stroke: ringCol, width: 3.6 + lit * 1.4 }).at(g.x, g.y).opacity(a).glow(10, ringCol),
                txt(g.op, g.x, g.y - 2, 52, '#ffd166', 'mono').opacity(a).glow(8, '#ffd166'),
                txt(g.title, g.x - 102, g.y - 54, 26, '#a9bad9', 'mono', 'right').opacity(i === 0 ? 0 : a),
                txt(g.expr, g.x, g.y + 98, 28, '#f8f4ec', 'mono').opacity(a),
                txt(g.val, g.x, g.y + 138, 26, '#6ee7b7', 'mono').opacity((0.4 + lit * 0.6) * a).glow(6, '#6ee7b7'),
            )
            if (i === 0) {
                nodes.push(txt(g.title, g.x - 115, g.y - 44, 26, '#a9bad9', 'mono').opacity(a))
            }
        }

        // Bottom 25% panel: Live R1CS Witness Vector w = [1, 3, 9, 27, 30, 35] + Polynomial Trace Preview
        nodes.push(
            line([-810, 175], [810, 175], { stroke: '#263558', width: 2, opacity: 0.75 * a }),
            // Left card: R1CS Witness Vector
            rect(1030, 212, { fill: '#0c1222d8', stroke: '#2c3e68', width: 2.2, radius: 16 }).at(-295, 305).opacity(a),
            txt('R1CS WITNESS VECTOR', -785, 228, 26, '#5ce1e6', 'mono', 'left').opacity(a),
            txt('w = [1, 3, 9, 27, 30, 35]', 195, 228, 26, '#ffd166', 'mono', 'right').opacity(a).glow(6, '#ffd166'),
        )

        for (let idx = 0; idx < WITNESS_CELLS.length; idx++) {
            const cell = WITNESS_CELLS[idx]!
            const cx = -710 + idx * 164
            const cy = 320
            const active = cell.gateIdx < 0 ? 1 : Math.max(0, Math.min(1, p * 4.4 - cell.gateIdx * 0.85))
            nodes.push(
                rect(140, 74, {
                    fill: active > 0.5 ? '#122238' : '#0e1629',
                    stroke: active > 0.5 ? cell.col : '#2a385c',
                    width: active > 0.5 ? 2.8 : 1.6,
                    radius: 10,
                })
                    .at(cx, cy)
                    .opacity(a)
                    .glow(active > 0.5 ? 8 : 0, cell.col),
                txt(cell.val, cx, cy + 2, 32, active > 0.5 ? cell.col : '#6e7c9e', 'mono').opacity(a),
                txt(cell.sym, cx, cy + 60, 26, '#b5c1d8', 'mono').opacity(a),
            )
        }

        // Right card: Polynomial Trace Preview interpolating gate outputs [9, 27, 30, 35]
        nodes.push(
            rect(550, 212, { fill: '#0c1222d8', stroke: '#324878', width: 2.2, radius: 16 }).at(545, 305).opacity(a),
            txt('POLYNOMIAL TRACE  O(t)', 545, 228, 26, '#a78bfa', 'mono').opacity(a),
            line([MINI_X0 - 10, MINI_Y0], [MINI_X1 + 10, MINI_Y0], { stroke: '#33466f', width: 1.8, opacity: 0.85 * a }),
            new Node(polyPath(MINI_CURVE_PTS)).stroke('#5ce1e6', 3.6, 0.92 * a).glow(10, '#5ce1e6').set('blend', 'screen'),
            new Node(polyPath(MINI_CURVE_PTS)).stroke('#ffffff', 1.2, 0.5 * a).set('blend', 'screen'),
        )
        const miniVals = [9, 27, 30, 35]
        for (let i = 0; i < 4; i++) {
            const mx = mapMiniT(i + 1)
            const my = mapMiniY(miniVals[i]!)
            const lit = Math.max(0, Math.min(1, p * 4.4 - i * 0.85))
            nodes.push(
                line([mx, MINI_Y0], [mx, my], { stroke: '#5ce1e6', width: 1.4, dash: [4, 5], opacity: 0.45 * a }),
                dot(6.5, lit > 0.5 ? '#ffd166' : '#5ce1e6').at(mx, my).opacity(a).glow(10, lit > 0.5 ? '#ffd166' : '#5ce1e6').set('blend', 'screen'),
            )
        }
        return group(...nodes)
    })

    // Shot 2: Lagrange interpolation + QAP vanishing polynomial P(t) = H(t) * Z(t)
    const polyGrad = linearGradient([PLOT_X0, 0], [PLOT_X1, 0], ['#5ce1e6', '#60a5fa', '#a78bfa', '#ffd166'])
    const polyHeader = group(
        txt('LAGRANGE INTERPOLATION  ·  QAP DIVISIBILITY', 0, -395, 26, '#ffd166', 'mono'),
        tex(String.raw`P(t) \;=\; L(t)\cdot R(t) - O(t) \;=\; H(t)\cdot Z(t)`, { size: 54, color: '#f8f4ec' }).at(0, -310).glow(6, '#5ce1e6'),
    )

    const livePoly = dynamic(() => {
        if (showPoly.value < 0.02) return []
        const a = showPoly.value
        const count = Math.max(2, Math.floor(curveDraw.value * TRACE_SAMPLES))
        const wirePts = WIRE_CURVE_PTS.slice(0, count)
        const qapPts = QAP_CURVE_PTS.slice(0, count)
        const rVis = showRoots.value
        const nodes: Node[] = [
            line([PLOT_X0 - 30, PLOT_Y_ZERO], [PLOT_X1 + 30, PLOT_Y_ZERO], { stroke: '#314066', width: 2.2, opacity: 0.85 * a }),
            txt('0', PLOT_X0 - 52, PLOT_Y_ZERO, 28, '#9eb0d0', 'mono').opacity(a),
            new Node(polyPath(wirePts)).stroke(polyGrad, 4.8, 0.94 * a).glow(10, '#5ce1e6').set('blend', 'screen'),
            new Node(polyPath(wirePts)).stroke('#ffffff', 1.4, 0.45 * a).set('blend', 'screen'),
            txt('Wire polynomial  O(t)', 490, -140, 28, '#5ce1e6', 'mono').opacity(a),
        ]

        const wireVals = [9, 27, 30, 35]
        for (let i = 0; i < GATE_ROOTS.length; i++) {
            const t = GATE_ROOTS[i]!
            const x = mapT(t)
            const y = mapWireY(wireVals[i]!)
            nodes.push(
                line([x, PLOT_Y_ZERO], [x, y], { stroke: '#5ce1e6', width: 1.6, dash: [6, 8], opacity: 0.45 * a }),
                circle(13, { fill: '#070910', stroke: '#5ce1e6', width: 3 }).at(x, y).opacity(a).glow(8, '#5ce1e6'),
                dot(5.5, '#ffffff').at(x, y).opacity(a),
                txt(`t = ${t}`, x, PLOT_Y_ZERO + 50, 28, '#cbd5e8', 'mono').opacity(a),
                txt(`${wireVals[i]}`, x, y - 36, 28, '#5ce1e6', 'mono').opacity(a),
            )
        }

        if (rVis > 0.02) {
            nodes.push(
                new Node(polyPath(qapPts)).stroke('#ffd166', 4.4, 0.96 * rVis * a).glow(10, '#ffd166').set('blend', 'screen'),
                txt('P(t) = H(t)·Z(t) = 0 at every gate root', 0, 340, 32, '#ffd166', 'sans').opacity(rVis * a).glow(6, '#ffd166'),
            )
            for (const t of GATE_ROOTS) {
                const x = mapT(t)
                nodes.push(
                    circle(18, { fill: '#ffd16628', stroke: '#ffd166', width: 3 }).at(x, PLOT_Y_ZERO).opacity(rVis * a).glow(10, '#ffd166'),
                    dot(6, '#ffffff').at(x, PLOT_Y_ZERO).opacity(rVis * a).glow(10, '#ffd166').set('blend', 'screen'),
                )
            }
        }
        return group(...nodes)
    })

    s.add(liveCircuit, puzzleEq, livePoly)
    const beat0Rem = Math.max(8.0, c.cue('Now thread a single').start - c.start - 0.15)
    c.at(0.15, () => {
        s.play(
            pulseProg.to(1.15, { duration: 8.5, ease: linear }),
            wireLoop.to(9.5, { duration: beat0Rem, ease: linear }),
        )
    })

    c.on('Now thread a single', () => {
        s.play(
            showCircuit.to(0, { duration: 0.3 }),
            showPoly.to(1, { duration: 0.35 }),
            curveDraw.to(1, { duration: 3.4 }),
        )
    })
    c.swap('Now thread a single', puzzleEq, polyHeader)
    c.on('hits zero at every', () => {
        s.play(showRoots.to(1, { duration: 0.8 }))
    })
}

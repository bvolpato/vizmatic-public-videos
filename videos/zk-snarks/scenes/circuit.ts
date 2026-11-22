import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { GATE_ROOTS, HONEST_QAP, VANISHING_POLY, WIRE_TRACE_POLY, evalPoly } from '../math'
import { txt } from '../../../factory/style'

const GATE_SPECS = [
    { x: -610, y: 75, op: '×', title: 'Gate 1', expr: 'x · x = 9', val: 'v₁ = 9' },
    { x: -205, y: 75, op: '×', title: 'Gate 2', expr: 'v₁ · x = 27', val: 'v₂ = 27' },
    { x: 205, y: 75, op: '+', title: 'Gate 3', expr: 'v₂ + x = 30', val: 'v₃ = 30' },
    { x: 610, y: 75, op: '+', title: 'Gate 4', expr: 'v₃ + 5 = 35', val: 'out = 35' },
] as const

// Precompute smooth Lagrange wire trace curve mapped onto stage coordinates
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
    // Scale smoothly so its roots at t = 1, 2, 3, 4 pop visually along the zero axis
    const combined = (zVal * 26 + pVal * 0.008)
    return [mapT(t), PLOT_Y_ZERO - Math.max(-135, Math.min(135, combined))] as Vec
})

export const circuit: SceneFunction = (s, c) => {
    const showCircuit = s.value(1)
    const pulseProg = s.value(0)
    const showPoly = s.value(0)
    const curveDraw = s.value(0)
    const showRoots = s.value(0)

    const puzzleEq = group(
        txt('R1CS ARITHMETIZATION', 0, -375, 26, '#5ce1e6', 'mono'),
        tex(String.raw`x^3 + x + 5 = 35`, { size: 70, color: '#f8f4ec' }).at(-120, -255).glow(6, '#7c8cff'),
        circle(58, { fill: '#1a1438', stroke: '#a78bfa', width: 3 }).at(415, -255).glow(10, '#a78bfa'),
        txt('x = 3', 415, -255, 32, '#ffd166', 'mono').glow(6, '#ffd166'),
        txt('SECRET WITNESS', 415, -172, 26, '#a78bfa', 'mono'),
    )

    const liveCircuit = dynamic(() => {
        if (showCircuit.value < 0.02) return []
        const a = showCircuit.value
        const p = pulseProg.value
        const nodes: Node[] = []

        // Connecting wires between gates with moving cyan photons
        for (let i = 0; i < GATE_SPECS.length - 1; i++) {
            const g1 = GATE_SPECS[i]!
            const g2 = GATE_SPECS[i + 1]!
            const xA = g1.x + 76
            const xB = g2.x - 76
            const wireActive = Math.max(0, Math.min(1, p * 4 - i))
            nodes.push(
                line([xA, g1.y], [xB, g2.y], { stroke: '#263455', width: 4, opacity: 0.7 * a }),
                line([xA, g1.y], [xA + (xB - xA) * wireActive, g2.y], { stroke: '#5ce1e6', width: 4.5, opacity: 0.95 * a }).glow(8, '#5ce1e6'),
            )
            if (wireActive > 0.05 && wireActive < 0.98) {
                const px = xA + (xB - xA) * wireActive
                nodes.push(dot(8, '#ffffff').at(px, g1.y).opacity(a).glow(14, '#5ce1e6'))
            }
        }

        // Four arithmetic gates
        for (let i = 0; i < GATE_SPECS.length; i++) {
            const g = GATE_SPECS[i]!
            const lit = Math.max(0, Math.min(1, p * 4.4 - i * 0.85))
            const ringCol = lit > 0.75 ? '#6ee7b7' : '#5ce1e6'
            nodes.push(
                circle(95, {
                    fill: radialGradient([0, 0], 95, [
                        [0, lit > 0.75 ? '#6ee7b726' : '#5ce1e618'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                }).at(g.x, g.y).opacity(a),
                circle(68, { fill: '#101629', stroke: ringCol, width: 3.5 + lit * 1.5 }).at(g.x, g.y).opacity(a).glow(10, ringCol),
                txt(g.op, g.x, g.y - 2, 54, '#ffd166', 'mono').opacity(a).glow(8, '#ffd166'),
                txt(g.title, g.x, g.y - 115, 28, '#9eb0d0', 'mono').opacity(a),
                txt(g.expr, g.x, g.y + 122, 30, '#f8f4ec', 'mono').opacity(a),
                txt(g.val, g.x, g.y + 168, 28, '#6ee7b7', 'mono').opacity((0.35 + lit * 0.65) * a).glow(6, '#6ee7b7'),
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
            // Zero baseline axis
            line([PLOT_X0 - 30, PLOT_Y_ZERO], [PLOT_X1 + 30, PLOT_Y_ZERO], { stroke: '#314066', width: 2.2, opacity: 0.85 * a }),
            txt('0', PLOT_X0 - 52, PLOT_Y_ZERO, 28, '#9eb0d0', 'mono').opacity(a),
            // Wire trace smooth polynomial
            new Node(polyPath(wirePts)).stroke(polyGrad, 4.8, 0.92 * a).glow(10, '#5ce1e6'),
            new Node(polyPath(wirePts)).stroke('#ffffff', 1.3, 0.38 * a),
            txt('Wire polynomial  O(t)', 490, -140, 28, '#5ce1e6', 'mono').opacity(a),
        ]

        // Wire values at t = 1..4
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

        // QAP vanishing wave P(t) = H(t) * Z(t) hitting ZERO at every gate root!
        if (rVis > 0.02) {
            nodes.push(
                new Node(polyPath(qapPts)).stroke('#ffd166', 4.2, 0.95 * rVis * a).glow(10, '#ffd166'),
                txt('P(t) = H(t)·Z(t) = 0 at every gate root', 0, 340, 32, '#ffd166', 'sans').opacity(rVis * a).glow(6, '#ffd166'),
            )
            for (const t of GATE_ROOTS) {
                const x = mapT(t)
                nodes.push(
                    circle(18, { fill: '#ffd16624', stroke: '#ffd166', width: 3 }).at(x, PLOT_Y_ZERO).opacity(rVis * a).glow(10, '#ffd166'),
                    dot(6, '#ffffff').at(x, PLOT_Y_ZERO).opacity(rVis * a).glow(10, '#ffd166'),
                )
            }
        }
        return group(...nodes)
    })

    s.add(liveCircuit, puzzleEq, livePoly)
    c.at(0.15, () => s.play(pulseProg.to(1.15, { duration: 8.2, ease: linear })))

    c.on('Now thread a single', () => {
        s.play(showCircuit.to(0, { duration: 0.3 }))
        s.play(showPoly.to(1, { duration: 0.35 }))
        s.play(curveDraw.to(1, { duration: 3.4 }))
    })
    c.swap('Now thread a single', puzzleEq, polyHeader)
    c.on('hits zero at every', () => {
        s.play(showRoots.to(1, { duration: 0.8 }))
    })
}

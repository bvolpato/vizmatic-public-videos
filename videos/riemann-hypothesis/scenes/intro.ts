import {
    Node, circle, contourPaths, dot, dynamic, group, line, linearGradient, polyPath, radialGradient,
    scalarField,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { zeta } from '../math'
import { txt } from '../../../factory/style'

const SPIRAL_SAMPLES = 480
const CX = 330
const CY = 10
const SCALE = 158

const SPIRAL_PTS: Vec[] = Array.from({ length: SPIRAL_SAMPLES }, (_, i) => {
    const t = 0.6 + (32.8 * i) / (SPIRAL_SAMPLES - 1)
    const [re, im] = zeta(0.5, t)
    return [CX + re * SCALE, CY - im * SCALE] as Vec
})

// Precompute log(1 + |zeta(s)|) on a smooth complex-strip grid behind the spiral
const FW = 980
const FH = 820
const FN = 56
const ZETA_FIELD_GRID = new Float32Array(FN * FN)
for (let j = 0; j < FN; j++) {
    const im = 2.0 + (30.0 * j) / (FN - 1)
    for (let i = 0; i < FN; i++) {
        const sig = 0.08 + (1.32 * i) / (FN - 1)
        const [zr, zi] = zeta(sig, im)
        ZETA_FIELD_GRID[j * FN + i] = Math.log1p(Math.hypot(zr, zi))
    }
}

function sampleZetaLogField(nx: number, ny: number): number {
    // nx, ny in [-1, 1] -> bilinear lookup with radial feathering so edges melt into space
    const r2 = nx * nx + ny * ny
    if (r2 >= 0.98) return 0
    const fade = Math.pow(Math.max(0, 1 - r2 / 0.98), 1.45)
    const u = ((nx + 1) * 0.5) * (FN - 1)
    const v = ((ny + 1) * 0.5) * (FN - 1)
    const i0 = Math.max(0, Math.min(FN - 2, Math.floor(u)))
    const j0 = Math.max(0, Math.min(FN - 2, Math.floor(v)))
    const fu = u - i0
    const fv = v - j0
    const h00 = ZETA_FIELD_GRID[j0 * FN + i0]!
    const h10 = ZETA_FIELD_GRID[j0 * FN + i0 + 1]!
    const h01 = ZETA_FIELD_GRID[(j0 + 1) * FN + i0]!
    const h11 = ZETA_FIELD_GRID[(j0 + 1) * FN + i0 + 1]!
    const val = (h00 * (1 - fu) + h10 * fu) * (1 - fv) + (h01 * (1 - fu) + h11 * fu) * fv
    return Math.min(1.85, val) * fade
}

const ZETA_CONTOURS = contourPaths(sampleZetaLogField, {
    x: [-1, 1],
    y: [-1, 1],
    levels: [0.32, 0.62, 0.96, 1.32],
    resolution: [52, 46],
})

const CONTOUR_COLORS = ['#38bdf8', '#7c8cff', '#c084fc', '#ffd166'] as const

export const intro: IntroFunction = (stage, clock) => {
    const grad = linearGradient([CX - 260, CY + 300], [CX + 380, CY - 300], ['#5ce1e6', '#7c8cff', '#c084fc', '#ff6b8b', '#ffd166'])
    const prog = stage.value(0.68)

    const fieldNode = scalarField((x, y) => sampleZetaLogField(x, y), {
        x: [-1, 1],
        y: [-1, 1],
        domain: [0, 1.55],
        colors: ['#07091000', '#161b4855', '#3b247880', '#1d6fa590', '#5ce1e688', '#ffd16695'],
        width: FW,
        height: FH,
        resolution: [84, 72],
    }).at(CX, CY).set('blend', 'screen').opacity(0.58)

    const contourNodes: Node[] = []
    ZETA_CONTOURS.forEach((lvl, li) => {
        const col = CONTOUR_COLORS[li % CONTOUR_COLORS.length]!
        for (const poly of lvl.paths) {
            if (poly.length < 2) continue
            const pts: Vec[] = poly.map(([nx, ny]) => [CX + nx * (FW * 0.5), CY - ny * (FH * 0.5)] as Vec)
            contourNodes.push(
                new Node(polyPath(pts)).stroke(col, 1.35, 0.28 + li * 0.06).set('blend', 'screen'),
            )
        }
    })

    stage.add(
        fieldNode,
        ...contourNodes,
        circle(560, {
            fill: radialGradient([0, 0], 560, [
                [0, '#ffd1662c'],
                [0.45, '#4c2f8a1a'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY).set('blend', 'screen'),
        line([CX - 340, CY], [CX + 420, CY], { stroke: '#222d48', width: 1.3 }),
        line([CX, CY - 340], [CX, CY + 340], { stroke: '#222d48', width: 1.3 }),
        txt('$1,000,000  MILLENNIUM PRIZE', -840, -195, 26, '#ffd166', 'mono', 'left'),
        txt('The Riemann', -848, -72, 126, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Hypothesis', -848, 56, 126, '#6be8f2', 'serif', 'left').glow(8, '#38bdf8'),
        txt('The hidden music of the prime numbers', -840, 178, 34, '#b8c5df', 'sans', 'left'),
        dynamic(() => {
            const count = Math.max(2, Math.floor(prog.value * SPIRAL_SAMPLES))
            const pts = SPIRAL_PTS.slice(0, count)
            const tip = pts[pts.length - 1]!
            const pulseR = 34 + ((prog.value * 4) % 1) * 130
            const pulseOp = (1 - ((prog.value * 4) % 1)) * 0.55
            return group(
                circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.2 }).at(CX, CY).opacity(pulseOp).glow(10, '#ffd166').set('blend', 'screen'),
                circle(16, { fill: null, stroke: '#ffd166', width: 2.2 }).at(CX, CY).opacity(0.8).set('blend', 'screen'),
                dot(5.5, '#ffffff').at(CX, CY).glow(14, '#ffd166').set('blend', 'screen'),
                new Node(polyPath(pts)).stroke(grad, 5.2, 0.96).glow(12, '#7c8cff').set('blend', 'screen'),
                new Node(polyPath(pts)).stroke('#ffffff', 1.4, 0.45),
                dot(7.5, '#ffffff').at(tip[0], tip[1]).glow(16, '#ffd166').set('blend', 'screen'),
            )
        }),
    )
    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

import {
    Node, circle, contourPaths, dot, dynamic, group, line, linearGradient, polyPath, radialGradient,
    scalarField,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { zeta } from '../math'
import { txt } from '../../../factory/style'

// A24 Theatrical Composition: Towering cosmic zeta spiral upper-right/center + bold Lower-Left editorial title
const SPIRAL_SAMPLES = 480
const CX = 285
const CY = -72
const SCALE = 186

const SPIRAL_PTS: Vec[] = Array.from({ length: SPIRAL_SAMPLES }, (_, i) => {
    const t = 0.6 + (32.8 * i) / (SPIRAL_SAMPLES - 1)
    const [re, im] = zeta(0.5, t)
    return [CX + re * SCALE, CY - im * SCALE] as Vec
})

const FW = 1180
const FH = 920
const FN = 60
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
    const r2 = nx * nx + ny * ny
    if (r2 >= 0.98) return 0
    const fade = Math.pow(Math.max(0, 1 - r2 / 0.98), 1.35)
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
    levels: [0.28, 0.56, 0.88, 1.24],
    resolution: [56, 48],
})

const CONTOUR_COLORS = ['#38bdf8', '#7c8cff', '#c084fc', '#ffd166'] as const

export const intro: IntroFunction = (stage, clock) => {
    const grad = linearGradient([CX - 320, CY + 340], [CX + 440, CY - 340], ['#5ce1e6', '#7c8cff', '#c084fc', '#ff6b8b', '#ffd166'])
    const prog = stage.value(0.68)

    const fieldNode = scalarField((x, y) => sampleZetaLogField(x, y), {
        x: [-1, 1],
        y: [-1, 1],
        domain: [0, 1.45],
        colors: ['#07091000', '#19225c6e', '#4c269499', '#1e7ab8aa', '#5ce1e6a2', '#ffd166aa'],
        width: FW,
        height: FH,
        resolution: [92, 76],
    }).at(CX, CY).set('blend', 'screen').opacity(0.76)

    const contourNodes: Node[] = []
    ZETA_CONTOURS.forEach((lvl, li) => {
        const col = CONTOUR_COLORS[li % CONTOUR_COLORS.length]!
        for (const poly of lvl.paths) {
            if (poly.length < 2) continue
            const pts: Vec[] = poly.map(([nx, ny]) => [CX + nx * (FW * 0.5), CY - ny * (FH * 0.5)] as Vec)
            contourNodes.push(
                new Node(polyPath(pts)).stroke(col, 1.65, 0.36 + li * 0.08).set('blend', 'screen'),
            )
        }
    })

    stage.add(
        fieldNode,
        ...contourNodes,
        circle(640, {
            fill: radialGradient([0, 0], 640, [
                [0, '#ffd16634'],
                [0.45, '#4c2f8a22'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY).set('blend', 'screen'),
        line([CX - 420, CY], [CX + 500, CY], { stroke: '#222d48', width: 1.4 }),
        line([CX, CY - 400], [CX, CY + 400], { stroke: '#222d48', width: 1.4 }),
        dynamic(() => {
            const count = Math.max(2, Math.floor(prog.value * SPIRAL_SAMPLES))
            const pts = SPIRAL_PTS.slice(0, count)
            const tip = pts[pts.length - 1]!
            const pulseR = 34 + ((prog.value * 4) % 1) * 150
            const pulseOp = (1 - ((prog.value * 4) % 1)) * 0.62
            return group(
                circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.4 }).at(CX, CY).opacity(pulseOp).glow(10, '#ffd166').set('blend', 'screen'),
                circle(18, { fill: null, stroke: '#ffd166', width: 2.4 }).at(CX, CY).opacity(0.85).set('blend', 'screen'),
                dot(6, '#ffffff').at(CX, CY).glow(16, '#ffd166').set('blend', 'screen'),
                new Node(polyPath(pts)).stroke(grad, 6.2, 0.96).glow(14, '#7c8cff').set('blend', 'screen'),
                new Node(polyPath(pts)).stroke('#ffffff', 1.6, 0.48),
                dot(8, '#ffffff').at(tip[0], tip[1]).glow(18, '#ffd166').set('blend', 'screen'),
            )
        }),
        // Lower-left theatrical title block with subtle dark cosmic cradle
        circle(560, {
            fill: radialGradient([0, 0], 560, [
                [0, '#070910e6'],
                [0.58, '#07091096'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(-540, 240),
        txt('$1,000,000  MILLENNIUM PRIZE', -852, 68, 26, '#ffd166', 'mono', 'left').glow(6, '#ffd166'),
        txt('The Riemann', -858, 178, 112, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Hypothesis', -858, 290, 112, '#6be8f2', 'serif', 'left').glow(9, '#38bdf8'),
        txt('The hidden music of the prime numbers', -852, 392, 32, '#cbd5e8', 'sans', 'left'),
    )
    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

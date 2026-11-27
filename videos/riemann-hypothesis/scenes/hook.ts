import {
    Node, circle, contourPaths, dot, dynamic, group, line, linear, linearGradient, polyPath,
    radialGradient, scalarField,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { ZETA_ZEROS, zeta } from '../math'
import { txt } from '../../../factory/style'

// A24 Theatrical Composition: Towering cosmic zeta spiral upper-right/center + Lower-Left monumental "$1,000,000" title
const N_SPIRAL = 720
const CX = 285
const CY = -72
const SCALE = 186
const HOOK_SPIRAL: Vec[] = Array.from({ length: N_SPIRAL }, (_, i) => {
    const t = 0.5 + (33.5 * i) / (N_SPIRAL - 1)
    const [re, im] = zeta(0.5, t)
    return [CX + re * SCALE, CY - im * SCALE] as Vec
})

const FW = 1180
const FH = 920
const FN = 60
const ZETA_FIELD_GRID = new Float32Array(FN * FN)
for (let j = 0; j < FN; j++) {
    const im = 2.0 + (31.5 * j) / (FN - 1)
    for (let i = 0; i < FN; i++) {
        const sig = 0.06 + (1.38 * i) / (FN - 1)
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
    return Math.min(1.9, val) * fade
}

const ZETA_CONTOURS = contourPaths(sampleZetaLogField, {
    x: [-1, 1],
    y: [-1, 1],
    levels: [0.24, 0.5, 0.82, 1.18, 1.5],
    resolution: [60, 50],
})
const CONTOUR_COLS = ['#38bdf8', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'] as const

const HARMONIC_COLS = ['#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'] as const
const WAVE_XS = Array.from({ length: 180 }, (_, i) => -860 + (1720 * i) / 179)

export const hook: SceneFunction = (s, c) => {
    const spiralProg = s.value(0.55)
    const showSpiralShot = s.value(1)
    const showWaveShot = s.value(0)
    const wavePhase = s.value(0)

    const spiralGrad = linearGradient([CX - 340, CY + 360], [CX + 460, CY - 360], ['#5ce1e6', '#7c8cff', '#c084fc', '#ff6b8b', '#ffd166'])

    const fieldBackdrop = scalarField((x, y) => sampleZetaLogField(x, y), {
        x: [-1, 1],
        y: [-1, 1],
        domain: [0, 1.45],
        colors: ['#07091000', '#19225c72', '#4c26949c', '#1e7ab8ad', '#5ce1e6a6', '#ffd166ae'],
        width: FW,
        height: FH,
        resolution: [96, 80],
    }).at(CX, CY).set('blend', 'screen').opacity(0.78)

    const contourBackdrop = group(
        ...ZETA_CONTOURS.flatMap((lvl, li) => {
            const col = CONTOUR_COLS[li % CONTOUR_COLS.length]!
            return lvl.paths
                .filter((poly) => poly.length >= 2)
                .map((poly) => {
                    const pts: Vec[] = poly.map(([nx, ny]) => [CX + nx * (FW * 0.5), CY - ny * (FH * 0.5)] as Vec)
                    return new Node(polyPath(pts)).stroke(col, 1.65, 0.34 + li * 0.08).set('blend', 'screen')
                })
        }),
    )

    // Lower-left theatrical title block (cleanly separated from towering upper-right spiral)
    const shot1Title = group(
        circle(560, {
            fill: radialGradient([0, 0], 560, [
                [0, '#070910e8'],
                [0.58, '#07091096'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(-540, 225),
        txt('$1,000,000', -852, 58, 86, '#ffd166', 'mono', 'left').glow(12, '#ffd166'),
        txt('The Riemann', -858, 178, 108, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Hypothesis', -858, 286, 108, '#6be8f2', 'serif', 'left').glow(9, '#38bdf8'),
        txt('Explained in under 3 minutes', -852, 392, 32, '#cbd5e8', 'sans', 'left'),
    )

    const liveSpiralShot = dynamic(() => {
        if (showSpiralShot.value < 0.02) return []
        const a = showSpiralShot.value
        const count = Math.max(2, Math.floor(spiralProg.value * N_SPIRAL))
        const pts = HOOK_SPIRAL.slice(0, count)
        const tip = pts[pts.length - 1]!
        const cyc1 = (spiralProg.value * 7.5) % 1
        const cyc2 = (spiralProg.value * 7.5 + 0.5) % 1
        const pulseR1 = 24 + cyc1 * 175
        const pulseOp1 = (1 - cyc1) * 0.85 * a
        const pulseR2 = 24 + cyc2 * 235
        const pulseOp2 = (1 - cyc2) * 0.55 * a
        return group(
            circle(640, {
                fill: radialGradient([0, 0], 640, [
                    [0, '#ffd16638'],
                    [0.42, '#4c2f8a26'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).set('blend', 'screen').opacity(a),
            line([CX - 430, CY], [CX + 520, CY], { stroke: '#222d48', width: 1.4 }).opacity(0.85 * a),
            line([CX, CY - 400], [CX, CY + 400], { stroke: '#222d48', width: 1.4 }).opacity(0.85 * a),
            circle(SCALE, { fill: null, stroke: '#2a3758', width: 1.3, dash: [5, 9] }).at(CX, CY).opacity(0.68 * a),
            circle(pulseR1, { fill: null, stroke: '#ffd166', width: 3.2 }).at(CX, CY).opacity(pulseOp1).glow(12, '#ffd166').set('blend', 'screen'),
            circle(pulseR2, { fill: null, stroke: '#5ce1e6', width: 2.2 }).at(CX, CY).opacity(pulseOp2).glow(10, '#5ce1e6').set('blend', 'screen'),
            circle(58, {
                fill: radialGradient([0, 0], 58, [
                    [0, '#ffd16692'],
                    [0.45, '#ff6b8b30'],
                    [1, '#ffd16600'],
                ]),
                stroke: null,
            }).at(CX, CY).set('blend', 'screen').opacity(a),
            circle(16, { fill: null, stroke: '#ffd166', width: 2.6 }).at(CX, CY).opacity(0.94 * a).set('blend', 'screen'),
            dot(7, '#ffffff').at(CX, CY).glow(16, '#ffd166').set('blend', 'screen').opacity(a),
            new Node(polyPath(pts)).stroke(spiralGrad, 6.8, 0.98 * a).glow(16, '#a78bfa').set('blend', 'screen'),
            new Node(polyPath(pts)).stroke('#ffffff', 1.8, 0.56 * a),
            circle(32, {
                fill: radialGradient([0, 0], 32, [
                    [0, '#ffd166bb'],
                    [0.5, '#5ce1e638'],
                    [1, '#ffd16600'],
                ]),
                stroke: null,
            }).at(tip[0], tip[1]).set('blend', 'screen').opacity(a),
            dot(9.5, '#ffffff').at(tip[0], tip[1]).glow(18, '#ffd166').set('blend', 'screen').opacity(a),
        )
    })

    const shot2Caption = group(
        txt('One razor-thin line', 0, -345, 72, '#ffd166', 'serif').glow(8, '#ffd166'),
        txt('conducting the hidden music of every prime number', 0, 365, 36, '#cbd5e8', 'sans'),
    )

    const liveWaveShot = dynamic(() => {
        if (showWaveShot.value < 0.02) return []
        const a = showWaveShot.value
        const ph = wavePhase.value
        const nodes: Node[] = [
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, '#ffd16630'],
                    [0.5, '#5ce1e618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, 0).set('blend', 'screen').opacity(a),
        ]
        for (let k = 0; k < 5; k++) {
            const g = ZETA_ZEROS[k]! * 0.0014
            const yc = -150 + k * 75
            const col = HARMONIC_COLS[k]!
            const pts: Vec[] = WAVE_XS.map((x) => {
                const env = Math.exp(-(x * x) / (2 * 560 * 560))
                return [x, yc + Math.sin(x * g + ph * (1.2 + k * 0.25)) * 34 * env] as Vec
            })
            nodes.push(
                new Node(polyPath(pts)).stroke(col, 4.2, 0.9 * a).glow(10, col).set('blend', 'screen'),
                new Node(polyPath(pts)).stroke('#ffffff', 1.1, 0.38 * a),
            )
        }
        nodes.push(
            line([0, -255], [0, 265], { stroke: '#ffd166', width: 5.0 }).glow(14, '#ffd166').set('blend', 'screen').opacity(a),
            ...[-150, -75, 0, 75, 150].map((y, i) =>
                group(
                    circle(13 + Math.sin(ph + i) * 3.5, { fill: null, stroke: '#ffd166', width: 2.4 }).at(0, y).opacity(0.92 * a).set('blend', 'screen'),
                    dot(6, '#ffffff').at(0, y).glow(12, '#ffd166').set('blend', 'screen').opacity(a),
                ),
            ),
        )
        return group(...nodes)
    })

    s.add(fieldBackdrop, contourBackdrop, liveSpiralShot, shot1Title)
    c.at(0.05, () => s.play(spiralProg.to(1, { duration: 4.8 })))

    c.on('one razor-thin line', () => {
        s.play(showSpiralShot.to(0, { duration: 0.25 }))
        s.play(showWaveShot.to(1, { duration: 0.3 }))
        s.play(wavePhase.to(6.0, { duration: 3.6, ease: linear }))
    })
    c.swap('one razor-thin line', [shot1Title, fieldBackdrop, contourBackdrop], shot2Caption)
    s.add(liveWaveShot)
}

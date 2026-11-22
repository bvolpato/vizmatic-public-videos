import {
    Node, circle, contourPaths, dot, dynamic, group, line, linear, linearGradient, polyPath,
    radialGradient, scalarField,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { ZETA_ZEROS, zeta } from '../math'
import { txt } from '../../../factory/style'

// High-energy 14-second viral hook montage:
// 0..6s: Blazing critical-line spiral piercing zero over log(1+|zeta(s)|) field + "$1,000,000" headline
// 6..14s: Razor-thin golden line + radiant harmonic waves pulsing outward across the cosmos
const N_SPIRAL = 720
const CX = 310
const CY = 10
const SCALE = 160
const HOOK_SPIRAL: Vec[] = Array.from({ length: N_SPIRAL }, (_, i) => {
    const t = 0.5 + (33.5 * i) / (N_SPIRAL - 1)
    const [re, im] = zeta(0.5, t)
    return [CX + re * SCALE, CY - im * SCALE] as Vec
})

// Precompute log(1 + |zeta(s)|) backdrop field & isolines behind the spiral
const FW = 1040
const FH = 880
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
    const fade = Math.pow(Math.max(0, 1 - r2 / 0.98), 1.4)
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
    levels: [0.28, 0.56, 0.88, 1.24, 1.56],
    resolution: [56, 48],
})
const CONTOUR_COLS = ['#38bdf8', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'] as const

const HARMONIC_COLS = ['#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'] as const
const WAVE_XS = Array.from({ length: 180 }, (_, i) => -860 + (1720 * i) / 179)

export const hook: SceneFunction = (s, c) => {
    const spiralProg = s.value(0.55)
    const showSpiralShot = s.value(1)
    const showWaveShot = s.value(0)
    const wavePhase = s.value(0)

    const spiralGrad = linearGradient([CX - 280, CY + 300], [CX + 420, CY - 300], ['#5ce1e6', '#7c8cff', '#c084fc', '#ff6b8b', '#ffd166'])

    const fieldBackdrop = scalarField((x, y) => sampleZetaLogField(x, y), {
        x: [-1, 1],
        y: [-1, 1],
        domain: [0, 1.55],
        colors: ['#07091000', '#161b4860', '#3d227a88', '#1d6fa598', '#5ce1e690', '#ffd1669a'],
        width: FW,
        height: FH,
        resolution: [88, 76],
    }).at(CX, CY).set('blend', 'screen').opacity(0.62)

    const contourBackdrop = group(
        ...ZETA_CONTOURS.flatMap((lvl, li) => {
            const col = CONTOUR_COLS[li % CONTOUR_COLS.length]!
            return lvl.paths
                .filter((poly) => poly.length >= 2)
                .map((poly) => {
                    const pts: Vec[] = poly.map(([nx, ny]) => [CX + nx * (FW * 0.5), CY - ny * (FH * 0.5)] as Vec)
                    return new Node(polyPath(pts)).stroke(col, 1.4, 0.26 + li * 0.06).set('blend', 'screen')
                })
        }),
    )

    const shot1Title = group(
        txt('$1,000,000', -840, -165, 92, '#ffd166', 'mono', 'left').glow(10, '#ffd166'),
        txt('The Riemann', -848, -22, 110, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Hypothesis', -848, 92, 110, '#6be8f2', 'serif', 'left').glow(8, '#38bdf8'),
        txt('Explained in under 3 minutes', -840, 212, 34, '#cbd5e8', 'sans', 'left'),
    )

    const liveSpiralShot = dynamic(() => {
        if (showSpiralShot.value < 0.02) return []
        const a = showSpiralShot.value
        const count = Math.max(2, Math.floor(spiralProg.value * N_SPIRAL))
        const pts = HOOK_SPIRAL.slice(0, count)
        const tip = pts[pts.length - 1]!
        const cyc1 = (spiralProg.value * 7.5) % 1
        const cyc2 = (spiralProg.value * 7.5 + 0.5) % 1
        const pulseR1 = 22 + cyc1 * 155
        const pulseOp1 = (1 - cyc1) * 0.82 * a
        const pulseR2 = 22 + cyc2 * 210
        const pulseOp2 = (1 - cyc2) * 0.52 * a
        return group(
            circle(540, {
                fill: radialGradient([0, 0], 540, [
                    [0, '#ffd16634'],
                    [0.42, '#4c2f8a22'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).set('blend', 'screen').opacity(a),
            line([CX - 390, CY], [CX + 460, CY], { stroke: '#222d48', width: 1.3 }).opacity(0.85 * a),
            line([CX, CY - 370], [CX, CY + 370], { stroke: '#222d48', width: 1.3 }).opacity(0.85 * a),
            circle(SCALE, { fill: null, stroke: '#2a3758', width: 1.2, dash: [5, 9] }).at(CX, CY).opacity(0.65 * a),
            // Additive screen-blend zero-crossing shockwaves!
            circle(pulseR1, { fill: null, stroke: '#ffd166', width: 3.0 }).at(CX, CY).opacity(pulseOp1).glow(12, '#ffd166').set('blend', 'screen'),
            circle(pulseR2, { fill: null, stroke: '#5ce1e6', width: 2.0 }).at(CX, CY).opacity(pulseOp2).glow(10, '#5ce1e6').set('blend', 'screen'),
            circle(52, {
                fill: radialGradient([0, 0], 52, [
                    [0, '#ffd16688'],
                    [0.45, '#ff6b8b28'],
                    [1, '#ffd16600'],
                ]),
                stroke: null,
            }).at(CX, CY).set('blend', 'screen').opacity(a),
            circle(15, { fill: null, stroke: '#ffd166', width: 2.4 }).at(CX, CY).opacity(0.92 * a).set('blend', 'screen'),
            dot(6.5, '#ffffff').at(CX, CY).glow(14, '#ffd166').set('blend', 'screen').opacity(a),
            // Radiant multi-loop critical-line spiral
            new Node(polyPath(pts)).stroke(spiralGrad, 6.2, 0.96 * a).glow(14, '#a78bfa').set('blend', 'screen'),
            new Node(polyPath(pts)).stroke('#ffffff', 1.6, 0.52 * a),
            circle(28, {
                fill: radialGradient([0, 0], 28, [
                    [0, '#ffd166aa'],
                    [0.5, '#5ce1e633'],
                    [1, '#ffd16600'],
                ]),
                stroke: null,
            }).at(tip[0], tip[1]).set('blend', 'screen').opacity(a),
            dot(8.5, '#ffffff').at(tip[0], tip[1]).glow(18, '#ffd166').set('blend', 'screen').opacity(a),
        )
    })

    // Shot 2: One razor-thin golden line conducting glowing musical prime waves across space!
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

import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import {
    SHAPE_CONTOUR,
    SHAPE_EPICYCLES,
    epicycleEnergyFraction,
    evalEpicycles,
} from '../math'
import { txt } from '../../../factory/style'

const EX = 290
const EY = 10
const E_SCALE = 275
const APPROX_SAMPLES = 220

// Precompute exact closed contours for K = 1, 3, 7, 19 circles for buttery-smooth 30 fps renders!
const K_LEVELS = [1, 3, 7, 19] as const
const PRECOMPUTED_CURVES = new Map<number, Vec[]>()
for (const K of K_LEVELS) {
    const pts: Vec[] = Array.from({ length: APPROX_SAMPLES }, (_, i) => {
        const u = i / (APPROX_SAMPLES - 1)
        const { tip } = evalEpicycles(SHAPE_EPICYCLES, u, K)
        return [EX + tip[0] * E_SCALE, EY - tip[1] * E_SCALE] as Vec
    })
    PRECOMPUTED_CURVES.set(K, pts)
}

const TARGET_GHOST: Vec[] = [...SHAPE_CONTOUR, SHAPE_CONTOUR[0]!].map(([re, im]) => [
    EX + re * E_SCALE,
    EY - im * E_SCALE,
])

// Top 19 sorted Fourier harmonic amplitudes for the live bar spectrum in bottom-left quadrant!
const TOP_19 = SHAPE_EPICYCLES.slice(0, 19)
const MAX_AMP = TOP_19[0]!.amp
const SPEC_X0 = -840
const SPEC_X1 = -320
const SPEC_BASE_Y = 218
const SPEC_MAX_H = 122
const BAR_COLS = ['#ffd166', '#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b'] as const

function nearestLevel(raw: number): number {
    if (raw < 2) return 1
    if (raw < 5) return 3
    if (raw < 13) return 7
    return 19
}

export const epicycles: SceneFunction = (s, c) => {
    const sceneLen = Math.max(10, c.beats[c.beats.length - 1]!.until - c.beats[0]!.start)
    const phase = s.value(0)
    const circleLevel = s.value(19)

    const trailGrad = linearGradient([EX - 320, EY + 320], [EX + 320, EY - 320], ['#5ce1e6', '#60a5fa', '#c084fc', '#ff6b8b', '#ffd166'])

    const staticLeft = group(
        txt('Exact DFT Epicycles', -840, -405, 56, '#f8f4ec', 'serif', 'left'),
        tex(String.raw`z(t) = \sum_{k} c_k\,e^{2\pi i k t}`, { size: 46, color: '#ffd166' }).at(-605, -308).glow(6, '#ffd166'),
        // Sorted harmonic spectrum label below the live bar chart
        txt('Sorted harmonics', SPEC_X0, SPEC_BASE_Y + 36, 26, '#9eb0d0', 'mono', 'left'),
        tex(String.raw`|c_k|`, { size: 30, color: '#ffd166' }).at(-525, SPEC_BASE_Y + 34).glow(5, '#ffd166'),
        line([SPEC_X0, SPEC_BASE_Y], [SPEC_X1, SPEC_BASE_Y], { stroke: '#2d3b5e', width: 2 }),
        // Subtle target ghost contour on right
        circle(490, {
            fill: radialGradient([0, 0], 490, [
                [0, '#4c2f8a2a'],
                [0.55, '#5ce1e616'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(EX, EY).set('blend', 'screen'),
        line([EX - 390, EY], [EX + 390, EY], { stroke: '#222d4a', width: 1.3 }),
        line([EX, EY - 380], [EX, EY + 380], { stroke: '#222d4a', width: 1.3 }),
        new Node(polyPath(TARGET_GHOST)).stroke('#a78bfa', 2.2, 0.36),
    )

    const parsevalNote = group(
        txt("Parseval's Theorem", -840, 316, 30, '#ffd166', 'serif', 'left').glow(6, '#ffd166'),
        tex(String.raw`\sum |x_n|^2 = \frac{1}{N}\sum |X_k|^2`, { size: 36, color: '#5ce1e6' }).at(-615, 392).glow(5, '#38bdf8'),
    )

    const liveEpicycles = dynamic(() => {
        const K = nearestLevel(circleLevel.value)
        const u = phase.value % 1
        const { centers, tip } = evalEpicycles(SHAPE_EPICYCLES, u, K)
        const fullCurve = PRECOMPUTED_CURVES.get(K)!
        const energyPct = epicycleEnergyFraction(SHAPE_EPICYCLES, K) * 100
        const tipX = EX + tip[0] * E_SCALE
        const tipY = EY - tip[1] * E_SCALE

        // Highlight active trailing tail behind the rotating tip
        const tipIdx = Math.floor(u * (APPROX_SAMPLES - 1))
        const tailLen = Math.floor(APPROX_SAMPLES * 0.72)
        const tailPts: Vec[] = []
        for (let i = 0; i <= tailLen; i++) {
            const idx = (tipIdx - tailLen + i + APPROX_SAMPLES) % APPROX_SAMPLES
            tailPts.push(fullCurve[idx]!)
        }

        const nodes: Node[] = [
            // Left dynamic readout: number of spinning circles + Parseval energy bar
            txt(`${K} ${K === 1 ? 'circle' : 'circles'}`, -840, -162, 64, '#5ce1e6', 'mono', 'left').glow(8, '#38bdf8'),
            txt(`Energy captured: ${energyPct.toFixed(1)}%`, -840, -82, 28, '#f8f4ec', 'mono', 'left'),
            line([-840, -32], [-320, -32], { stroke: '#222d4a', width: 12 }),
            line([-840, -32], [-840 + 520 * (energyPct / 100), -32], { stroke: '#ffd166', width: 12 }).glow(10, '#ffd166').set('blend', 'screen'),
            txt('0%', -840, 8, 26, '#6e7c9e', 'mono', 'left'),
            txt('100%', -320, 8, 26, '#ffd166', 'mono', 'right'),
            txt(`Active: ${K} / 19`, -320, 62, 26, '#5ce1e6', 'mono', 'right'),
        ]

        // Live sorted harmonic spectrum (|c_k| glowing bar chart) synchronized with K = 1 -> 3 -> 7 -> 19!
        const barStep = (SPEC_X1 - SPEC_X0 - 16) / 18
        for (let i = 0; i < TOP_19.length; i++) {
            const term = TOP_19[i]!
            const bx = SPEC_X0 + 8 + i * barStep
            const norm = Math.pow(term.amp / MAX_AMP, 0.52)
            const h = Math.max(10, norm * SPEC_MAX_H)
            const active = i < K
            const col = BAR_COLS[i % BAR_COLS.length]!
            if (active) {
                const pulse = 1 + 0.04 * Math.sin(u * 2 * Math.PI * (term.freq || 1) + term.phase)
                const hh = Math.min(SPEC_MAX_H, h * pulse)
                nodes.push(
                    line([bx, SPEC_BASE_Y - 2], [bx, SPEC_BASE_Y - hh], { stroke: col, width: 13 })
                        .glow(9, col)
                        .set('blend', 'screen')
                        .opacity(0.92),
                    dot(4.2, '#ffffff').at(bx, SPEC_BASE_Y - hh).glow(8, col).set('blend', 'screen'),
                )
            } else {
                nodes.push(
                    line([bx, SPEC_BASE_Y - 2], [bx, SPEC_BASE_Y - h], { stroke: '#273452', width: 11 }).opacity(0.45),
                )
            }
        }

        // Full subtle orbit of the K-term curve + bright active luminous trail
        nodes.push(
            new Node(polyPath(fullCurve)).stroke('#5ce1e6', 2.4, 0.36),
            new Node(polyPath(tailPts)).stroke(trailGrad, 5.6, 0.98).glow(13, '#ff6b8b').set('blend', 'screen'),
            new Node(polyPath(tailPts)).stroke('#ffffff', 1.5, 0.48),
        )

        // Draw nested spinning golden epicycle rings & rotating radius arms with additive glow
        for (let i = 0; i < K; i++) {
            const c0 = centers[i]!
            const c1 = centers[i + 1]!
            const r = SHAPE_EPICYCLES[i]!.amp * E_SCALE
            if (r < 2.2) continue
            const x0 = EX + c0[0] * E_SCALE
            const y0 = EY - c0[1] * E_SCALE
            const x1 = EX + c1[0] * E_SCALE
            const y1 = EY - c1[1] * E_SCALE
            const isMajor = i < 4
            const rCol = isMajor ? '#ffd166' : '#5ce1e6'
            nodes.push(
                circle(r, { fill: null, stroke: rCol, width: isMajor ? 2.2 : 1.5 })
                    .at(x0, y0)
                    .opacity(isMajor ? 0.64 : 0.46)
                    .glow(isMajor ? 6 : 4, rCol)
                    .set('blend', 'screen'),
                line([x0, y0], [x1, y1], { stroke: '#ffd166', width: isMajor ? 2.8 : 1.9 })
                    .glow(isMajor ? 8 : 5, '#ffd166')
                    .set('blend', 'screen')
                    .opacity(0.94),
            )
            if (isMajor || i < 8) {
                nodes.push(
                    dot(isMajor ? 4.4 : 3.2, '#ffffff')
                        .at(x0, y0)
                        .glow(isMajor ? 10 : 7, rCol)
                        .set('blend', 'screen')
                        .opacity(0.92),
                )
            }
        }

        nodes.push(
            circle(30, {
                fill: radialGradient([0, 0], 30, [
                    [0, '#ffd166bb'],
                    [0.5, '#ff6b8b38'],
                    [1, '#ffd16600'],
                ]),
                stroke: null,
            }).at(tipX, tipY).set('blend', 'screen'),
            dot(8.5, '#ffffff').at(tipX, tipY).glow(18, '#ffd166').set('blend', 'screen'),
        )
        return group(...nodes)
    })

    s.add(staticLeft, liveEpicycles)
    c.at(0.05, () => {
        s.play(phase.to(4.6, { duration: Math.max(8, sceneLen - 0.4), ease: linear }))
    })
    c.on('Start with one circle', () => s.play(circleLevel.to(1, { duration: 0.25 })))
    c.on('Add three', () => s.play(circleLevel.to(3, { duration: 0.25 })))
    c.on('Seven circles', () => s.play(circleLevel.to(7, { duration: 0.25 })))
    c.on('nineteen circles', () => s.play(circleLevel.to(19, { duration: 0.25 })))
    c.show('total energy stays', parsevalNote)
}

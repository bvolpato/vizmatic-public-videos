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

function nearestLevel(raw: number): number {
    if (raw < 2) return 1
    if (raw < 5) return 3
    if (raw < 13) return 7
    return 19
}

export const epicycles: SceneFunction = (s, c) => {
    const sceneLen = Math.max(10, c.beats[c.beats.length - 1]!.until - c.beats[0]!.start)
    const phase = s.value(0)
    const circleLevel = s.value(19) // Start showing the live full mechanism during intro beat, then snap to 1 -> 3 -> 7 -> 19 on Beat 1!

    const trailGrad = linearGradient([EX - 320, EY + 320], [EX + 320, EY - 320], ['#5ce1e6', '#60a5fa', '#c084fc', '#ff6b8b', '#ffd166'])

    const staticLeft = group(
        txt('Exact DFT Epicycles', -840, -395, 56, '#f8f4ec', 'serif', 'left'),
        tex(String.raw`z(t) = \sum_{k} c_k\,e^{2\pi i k t}`, { size: 46, color: '#ffd166' }).at(-605, -290).glow(6, '#ffd166'),
        // Subtle target ghost contour on right
        circle(480, {
            fill: radialGradient([0, 0], 480, [
                [0, '#4c2f8a22'],
                [0.55, '#5ce1e610'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(EX, EY),
        line([EX - 390, EY], [EX + 390, EY], { stroke: '#192136', width: 1.2 }),
        line([EX, EY - 380], [EX, EY + 380], { stroke: '#192136', width: 1.2 }),
        new Node(polyPath(TARGET_GHOST)).stroke('#a78bfa', 2.2, 0.32),
    )

    const parsevalNote = group(
        txt("Parseval's Theorem", -840, 250, 32, '#ffd166', 'serif', 'left').glow(6, '#ffd166'),
        tex(String.raw`\sum |x_n|^2 = \frac{1}{N}\sum |X_k|^2`, { size: 36, color: '#5ce1e6' }).at(-625, 328).glow(5, '#38bdf8'),
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
            txt(`${K} ${K === 1 ? 'circle' : 'circles'}`, -840, -110, 68, '#5ce1e6', 'mono', 'left').glow(8, '#38bdf8'),
            txt(`Energy captured: ${energyPct.toFixed(1)}%`, -840, -20, 30, '#f8f4ec', 'mono', 'left'),
            line([-840, 36], [-320, 36], { stroke: '#222d4a', width: 12 }),
            line([-840, 36], [-840 + 520 * (energyPct / 100), 36], { stroke: '#ffd166', width: 12 }).glow(8, '#ffd166'),
            txt('0%', -840, 80, 26, '#6e7c9e', 'mono', 'left'),
            txt('100%', -320, 80, 26, '#ffd166', 'mono', 'right'),

            // Full subtle orbit of the K-term curve + bright active luminous trail
            new Node(polyPath(fullCurve)).stroke('#5ce1e6', 2.2, 0.32),
            new Node(polyPath(tailPts)).stroke(trailGrad, 5.2, 0.96).glow(10, '#ff6b8b'),
            new Node(polyPath(tailPts)).stroke('#ffffff', 1.4, 0.42),
        ]

        // Draw nested spinning golden epicycle rings & rotating radius arms
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
            nodes.push(
                circle(r, { fill: null, stroke: isMajor ? '#ffd166' : '#60a5fa', width: isMajor ? 1.8 : 1.2 })
                    .at(x0, y0)
                    .opacity(isMajor ? 0.48 : 0.34),
                line([x0, y0], [x1, y1], { stroke: '#ffd166', width: isMajor ? 2.4 : 1.6 }).opacity(0.88),
            )
            if (isMajor) nodes.push(dot(3.5, '#ffd166').at(x0, y0).opacity(0.85))
        }

        nodes.push(
            circle(26, {
                fill: radialGradient([0, 0], 26, [
                    [0, '#ffd16699'],
                    [1, '#ffd16600'],
                ]),
                stroke: null,
            }).at(tipX, tipY),
            dot(8, '#ffffff').at(tipX, tipY).glow(16, '#ffd166'),
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

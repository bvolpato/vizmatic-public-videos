import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { HOOK_EPICYCLES, evalEpicycles } from '../math'
import { txt } from '../../../factory/style'

const WAVE_XS = Array.from({ length: 190 }, (_, i) => -960 + (1920 * i) / 189)
const WAVE_COLS = ['#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166', '#6ee7b7'] as const
const EQ_RING_RADII = [520, 645, 780, 920] as const
const CLOSING_RING_RADII = [245, 360, 495, 645, 810, 960] as const

/** Split a closed circle into clean polyline arcs outside a rectangular text-safe exclusion box. */
function maskedCircleArcs(
    cx: number,
    cy: number,
    r: number,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    steps = 128,
): Vec[][] {
    const segs: Vec[][] = []
    let cur: Vec[] = []
    for (let i = 0; i <= steps; i++) {
        const ang = (2 * Math.PI * i) / steps
        const x = cx + r * Math.cos(ang)
        const y = cy + r * Math.sin(ang)
        const blocked = x >= xMin && x <= xMax && y >= yMin && y <= yMax
        if (blocked) {
            if (cur.length >= 2) segs.push(cur)
            cur = []
        } else {
            cur.push([x, y])
        }
    }
    if (cur.length >= 2) segs.push(cur)
    return segs
}

const FINALE_CX = 0
const FINALE_CY = -165
const FINALE_SCALE = 136
const FINALE_TRACE: Vec[] = Array.from({ length: 240 }, (_, i) => {
    const u = i / 239
    const { tip } = evalEpicycles(HOOK_EPICYCLES, u, 5)
    return [FINALE_CX + tip[0] * FINALE_SCALE, FINALE_CY - tip[1] * FINALE_SCALE] as Vec
})

export const finale: SceneFunction = (s, c) => {
    const sceneLen = Math.max(8, c.beats[c.beats.length - 1]!.until - c.beats[0]!.start)
    const wavePhase = s.value(0)
    const showEqShot = s.value(1)
    const showClosing = s.value(0)
    const epiProg = s.value(0.15)

    // Full-width translucent harmonic sine ribbons + concentric radiating frequency rings across the entire 16:9 canvas!
    const liveWaves = dynamic(() => {
        if (showEqShot.value < 0.02) return []
        const a = showEqShot.value
        const ph = wavePhase.value
        const nodes: Node[] = [
            circle(640, {
                fill: radialGradient([0, 0], 640, [
                    [0, '#ffd1662c'],
                    [0.48, '#4c2f8a22'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, -35).set('blend', 'screen').opacity(a),
        ]
        // Subtle concentric frequency rings radiating cleanly outside the central equation
        for (let ri = 0; ri < EQ_RING_RADII.length; ri++) {
            const baseR = EQ_RING_RADII[ri]!
            const pulseR = baseR + ((ph * 22 + ri * 28) % 65)
            const col = WAVE_COLS[ri % WAVE_COLS.length]!
            nodes.push(
                circle(pulseR, { fill: null, stroke: col, width: 1.6, dash: ri % 2 === 0 ? undefined : [8, 12] })
                    .at(0, -35)
                    .opacity((0.26 - ri * 0.025) * a)
                    .glow(5, col)
                    .set('blend', 'screen'),
            )
        }
        // Full-width translucent harmonic sine ribbons sweeping edge-to-edge in upper and lower bands (clear of central text!)
        const ribbonYs = [-435, -365, -305, 265, 338, 412] as const
        for (let k = 0; k < ribbonYs.length; k++) {
            const freq = 0.0042 + k * 0.0022
            const yc = ribbonYs[k]!
            const col = WAVE_COLS[k]!
            const pts: Vec[] = WAVE_XS.map((x) => {
                const env = 0.45 + 0.55 * Math.exp(-(x * x) / (2 * 760 * 760))
                return [x, yc + Math.sin(x * freq + ph * (1.05 + k * 0.3)) * 22 * env] as Vec
            })
            nodes.push(
                new Node(polyPath(pts))
                    .stroke(col, 3.0, 0.52 * a)
                    .glow(8, col)
                    .set('blend', 'screen'),
            )
        }
        return group(...nodes)
    })

    const eqHero = group(
        txt('THE FOURIER TRANSFORM', 0, -230, 26, '#5ce1e6', 'mono'),
        tex(String.raw`\hat{f}(\xi) = \int_{-\infty}^{\infty} f(t)\,e^{-2\pi i \xi t}\,dt`, {
            size: 72,
            color: '#ffd166',
        }).at(0, -35).glow(9, '#ffd166'),
        txt('Acoustics   ·   Optics   ·   MRI   ·   Quantum Mechanics', 0, 175, 30, '#cbd5e8', 'sans'),
    )

    const finaleGrad = linearGradient([-220, FINALE_CY + 200], [220, FINALE_CY - 200], ['#5ce1e6', '#7c8cff', '#c084fc', '#ff6b8b', '#ffd166'])

    const liveClosing = dynamic(() => {
        if (showClosing.value < 0.02) return []
        const a = showClosing.value
        const ph = wavePhase.value
        const u = epiProg.value % 1
        const count = Math.max(2, Math.floor(Math.min(1, epiProg.value * 1.15) * FINALE_TRACE.length))
        const pts = FINALE_TRACE.slice(0, count)
        const { centers, tip } = evalEpicycles(HOOK_EPICYCLES, u, 5)
        const tipX = FINALE_CX + tip[0] * FINALE_SCALE
        const tipY = FINALE_CY - tip[1] * FINALE_SCALE
        const nodes: Node[] = [
            circle(580, {
                fill: radialGradient([0, 0], 580, [
                    [0, '#ffd16634'],
                    [0.48, '#5ce1e61c'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(FINALE_CX, FINALE_CY).set('blend', 'screen').opacity(a),
        ]

        // Concentric harmonic rings radiating outward from the closing epicycle choir across the whole frame (framing cleanly around the closing text!)
        for (let ri = 0; ri < CLOSING_RING_RADII.length; ri++) {
            const pulseR = CLOSING_RING_RADII[ri]! + ((ph * 24 + ri * 32) % 75)
            const col = WAVE_COLS[ri % WAVE_COLS.length]!
            const arcs = maskedCircleArcs(FINALE_CX, FINALE_CY, pulseR, -520, 520, 55, 345)
            for (const arc of arcs) {
                nodes.push(
                    new Node(polyPath(arc))
                        .stroke(col, 1.6, (0.28 - ri * 0.028) * a)
                        .glow(5, col)
                        .set('blend', 'screen'),
                )
            }
        }

        // Full-width translucent harmonic sine ribbons radiating smoothly across the entire 16:9 canvas
        const closingRibbons = [-365, -245, -85, 365, 435] as const
        for (let k = 0; k < closingRibbons.length; k++) {
            const yc = closingRibbons[k]!
            const col = WAVE_COLS[k]!
            const freq = 0.0046 + k * 0.0024
            const rPts: Vec[] = WAVE_XS.map((x) => {
                const env = 0.42 + 0.58 * Math.exp(-(x * x) / (2 * 780 * 780))
                return [x, yc + Math.sin(x * freq + ph * (1.2 + k * 0.32)) * 22 * env] as Vec
            })
            nodes.push(
                new Node(polyPath(rPts)).stroke(col, 2.6, 0.34 * a).glow(8, col).set('blend', 'screen'),
            )
        }

        nodes.push(
            new Node(polyPath(pts)).stroke(finaleGrad, 4.8, 0.96 * a).glow(12, '#a78bfa').set('blend', 'screen'),
            new Node(polyPath(pts)).stroke('#ffffff', 1.3, 0.42 * a),
        )
        for (let k = 0; k < 5; k++) {
            const c0 = centers[k]!
            const c1 = centers[k + 1]!
            const r = HOOK_EPICYCLES[k]!.amp * FINALE_SCALE
            const x0 = FINALE_CX + c0[0] * FINALE_SCALE
            const y0 = FINALE_CY - c0[1] * FINALE_SCALE
            const x1 = FINALE_CX + c1[0] * FINALE_SCALE
            const y1 = FINALE_CY - c1[1] * FINALE_SCALE
            nodes.push(
                circle(r, { fill: null, stroke: '#ffd166', width: 2.0 }).at(x0, y0).opacity(0.62 * a).glow(5, '#ffd166').set('blend', 'screen'),
                line([x0, y0], [x1, y1], { stroke: '#ffd166', width: 2.4 }).glow(7, '#ffd166').set('blend', 'screen').opacity(0.92 * a),
                dot(3.8, '#ffffff').at(x0, y0).glow(8, '#ffd166').set('blend', 'screen').opacity(0.88 * a),
            )
        }
        nodes.push(dot(7.5, '#ffffff').at(tipX, tipY).glow(16, '#ffd166').set('blend', 'screen').opacity(a))
        return group(...nodes)
    })

    const closingWords = group(
        txt('Every signal in the universe', 0, 118, 68, '#f8f4ec', 'serif').glow(6, '#90b4ff'),
        txt('is a choir of spinning circles.', 0, 208, 52, '#ffd166', 'serif').glow(8, '#ffd166'),
        txt('Joseph Fourier  ·  1822', 0, 304, 28, '#a8b8d8', 'mono'),
    )

    s.add(liveWaves, eqHero)
    c.at(0.1, () => s.play(wavePhase.to(7.5, { duration: Math.max(4, sceneLen - 1.5), ease: linear })))

    c.on('every signal in the universe', () => {
        s.play(showEqShot.to(0, { duration: 0.25 }), showClosing.to(1, { duration: 0.3 }))
    })
    c.on('every signal in the universe', () => {
        s.play(epiProg.to(1.25, { duration: 3.2, ease: linear }))
    })
    c.swap('every signal in the universe', eqHero, closingWords)
    s.add(liveClosing)
}

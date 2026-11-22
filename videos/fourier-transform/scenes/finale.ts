import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { HOOK_EPICYCLES, evalEpicycles } from '../math'
import { txt } from '../../../factory/style'

const WAVE_XS = Array.from({ length: 170 }, (_, i) => -860 + (1720 * i) / 169)
const WAVE_COLS = ['#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'] as const

const FINALE_CX = 0
const FINALE_CY = -165
const FINALE_SCALE = 132
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

    const liveWaves = dynamic(() => {
        if (showEqShot.value < 0.02) return []
        const a = showEqShot.value
        const ph = wavePhase.value
        const nodes: Node[] = [
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, '#ffd16622'],
                    [0.5, '#4c2f8a18'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, -35).opacity(a),
        ]
        for (let k = 0; k < 5; k++) {
            const freq = 0.005 + k * 0.0028
            const yc = k < 2 ? -390 + k * 42 : 285 + (k - 2) * 44
            const col = WAVE_COLS[k]!
            const pts: Vec[] = WAVE_XS.map((x) => {
                const env = Math.exp(-(x * x) / (2 * 560 * 560))
                return [x, yc + Math.sin(x * freq + ph * (1.1 + k * 0.35)) * 22 * env] as Vec
            })
            nodes.push(new Node(polyPath(pts)).stroke(col, 3.0, 0.52 * a).glow(7, col))
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
        const u = epiProg.value % 1
        const count = Math.max(2, Math.floor(Math.min(1, epiProg.value * 1.15) * FINALE_TRACE.length))
        const pts = FINALE_TRACE.slice(0, count)
        const { centers, tip } = evalEpicycles(HOOK_EPICYCLES, u, 5)
        const tipX = FINALE_CX + tip[0] * FINALE_SCALE
        const tipY = FINALE_CY - tip[1] * FINALE_SCALE
        const nodes: Node[] = [
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#ffd16628'],
                    [0.5, '#5ce1e614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(FINALE_CX, FINALE_CY).opacity(a),
            new Node(polyPath(pts)).stroke(finaleGrad, 4.4, 0.92 * a).glow(9, '#a78bfa'),
            new Node(polyPath(pts)).stroke('#ffffff', 1.2, 0.36 * a),
        ]
        for (let k = 0; k < 5; k++) {
            const c0 = centers[k]!
            const c1 = centers[k + 1]!
            const r = HOOK_EPICYCLES[k]!.amp * FINALE_SCALE
            const x0 = FINALE_CX + c0[0] * FINALE_SCALE
            const y0 = FINALE_CY - c0[1] * FINALE_SCALE
            const x1 = FINALE_CX + c1[0] * FINALE_SCALE
            const y1 = FINALE_CY - c1[1] * FINALE_SCALE
            nodes.push(
                circle(r, { fill: null, stroke: '#ffd166', width: 1.6 }).at(x0, y0).opacity(0.45 * a),
                line([x0, y0], [x1, y1], { stroke: '#ffd166', width: 2.0 }).opacity(0.85 * a),
            )
        }
        nodes.push(dot(7, '#ffffff').at(tipX, tipY).glow(14, '#ffd166').opacity(a))
        return group(...nodes)
    })

    const closingWords = group(
        txt('Every signal in the universe', 0, 118, 68, '#f8f4ec', 'serif').glow(6, '#90b4ff'),
        txt('is a choir of spinning circles.', 0, 208, 52, '#ffd166', 'serif').glow(8, '#ffd166'),
        txt('Joseph Fourier  ·  1822', 0, 304, 28, '#8b99b8', 'mono'),
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

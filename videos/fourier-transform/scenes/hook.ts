import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { HOOK_EPICYCLES, evalEpicycles } from '../math'
import { txt } from '../../../factory/style'

// Mirrored cinema layout: giant spinning golden epicycles on LEFT, right-aligned editorial + live spectrum on RIGHT
const CX = -375
const CY = 0
const SCALE = 212
const TRACE_N = 320

const STAR_TRACE: Vec[] = Array.from({ length: TRACE_N }, (_, i) => {
    const u = i / (TRACE_N - 1)
    const { tip } = evalEpicycles(HOOK_EPICYCLES, u, 5)
    return [CX + tip[0] * SCALE, CY - tip[1] * SCALE] as Vec
})

const PEAK_FREQS = [1, 4, 6, 9, 11] as const
const PEAK_AMPS = [1.0, 0.44, 0.22, 0.13, 0.07] as const
const PEAK_COLS = ['#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'] as const
const RING_COLS = ['#ffd166', '#5ce1e6', '#a78bfa', '#ff6b8b', '#ffd166'] as const
const WAVE_SAMPLES = 150

export const hook: SceneFunction = (s, c) => {
    const sceneLen = Math.max(6, c.beats[c.beats.length - 1]!.until - c.beats[0]!.start)
    const spin = s.value(0.84)
    const peaksIgnite = s.value(0.82)
    const wavePhase = s.value(0)

    const traceGrad = linearGradient([CX - 320, CY + 320], [CX + 340, CY - 320], ['#5ce1e6', '#60a5fa', '#c084fc', '#ff6b8b', '#ffd166'])
    const waveGrad = linearGradient([160, 25], [848, 25], ['#5ce1e6', '#a78bfa', '#ffd166'])

    const titleGroup = group(
        txt('The Fourier', 855, -335, 98, '#f8f4ec', 'serif', 'right').glow(6, '#90b4ff'),
        txt('Transform', 855, -228, 98, '#5ce1e6', 'serif', 'right').glow(8, '#38bdf8'),
        txt('Turning chaos into epicycles & music', 852, -138, 30, '#ffd166', 'sans', 'right'),
        txt('Spectral peaks', 726, 388, 26, '#ffd166', 'mono', 'right'),
        tex(String.raw`|\hat{f}(\xi)|`, { size: 32, color: '#ffd166' }).at(804, 386).glow(6, '#ffd166'),
    )

    const liveVisual = dynamic(() => {
        const u = spin.value % 1
        const totalTraced = Math.min(TRACE_N, Math.max(4, Math.floor((spin.value < 1 ? spin.value : 1) * TRACE_N)))
        const pts = STAR_TRACE.slice(0, totalTraced)
        const { centers, tip } = evalEpicycles(HOOK_EPICYCLES, u, 5)
        const tipX = CX + tip[0] * SCALE
        const tipY = CY - tip[1] * SCALE
        const ph = wavePhase.value
        const pk = peaksIgnite.value

        const nodes: Node[] = [
            circle(560, {
                fill: radialGradient([0, 0], 560, [
                    [0, '#ffd16638'],
                    [0.45, '#4c2f8a24'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).set('blend', 'screen'),
            circle(SCALE, { fill: null, stroke: '#243152', width: 1.3, dash: [6, 9] }).at(CX, CY),
            circle(SCALE * 1.75, { fill: null, stroke: '#1c2640', width: 1.2, dash: [6, 9] }).at(CX, CY),
            line([CX - 405, CY], [CX + 405, CY], { stroke: '#222d4a', width: 1.4 }),
            line([CX, CY - 395], [CX, CY + 395], { stroke: '#222d4a', width: 1.4 }),
        ]

        // Right middle: Vibrating composite multi-harmonic waveform
        const wavePts: Vec[] = []
        for (let i = 0; i < WAVE_SAMPLES; i++) {
            const frac = i / (WAVE_SAMPLES - 1)
            const x = 165 + frac * 685
            const env = Math.sin(Math.PI * frac)
            const t = frac * 2 * Math.PI + ph
            const y =
                32 -
                env *
                    (46 * Math.sin(t) +
                        26 * Math.cos(4 * t - 0.35) +
                        15 * Math.sin(6 * t + 0.5) +
                        10 * Math.cos(9 * t))
            wavePts.push([x, y])
        }
        nodes.push(
            line([165, 32], [850, 32], { stroke: '#243050', width: 1.5 }),
            new Node(polyPath(wavePts)).stroke(waveGrad, 4.2, 0.94).glow(10, '#5ce1e6').set('blend', 'screen'),
            new Node(polyPath(wavePts)).stroke('#ffffff', 1.2, 0.42),
            txt('Composite signal f(t)', 850, -56, 26, '#9eb0d0', 'mono', 'right'),
        )

        // Right bottom: Glowing spectral resonance peaks
        const baseY = 340
        nodes.push(line([165, baseY], [850, baseY], { stroke: '#2e3c60', width: 2.2 }))
        for (let k = 0; k < PEAK_FREQS.length; k++) {
            const bx = 245 + k * 134
            const pulse = 1 + 0.08 * Math.sin(ph * 2.2 + k * 1.1)
            const h = Math.max(8, PEAK_AMPS[k]! * 158 * pk * pulse)
            const col = PEAK_COLS[k]!
            const lobe: Vec[] = []
            for (let j = -14; j <= 14; j++) {
                const dx = j * 3.2
                const ly = baseY - h * Math.exp(-(dx * dx) / (2 * 13 * 13))
                lobe.push([bx + dx, ly])
            }
            nodes.push(
                new Node(polyPath(lobe)).stroke(col, 4.2, 0.96).glow(11, col).set('blend', 'screen'),
                line([bx, baseY], [bx, baseY - h], { stroke: col, width: 2.4 }).opacity(0.75).set('blend', 'screen'),
                dot(5.8, '#ffffff').at(bx, baseY - h).glow(12, col).set('blend', 'screen'),
            )
        }

        // Left hero: Glowing star-trefoil contour + spinning golden epicycles
        nodes.push(
            new Node(polyPath(pts)).stroke(traceGrad, 6.0, 0.98).glow(14, '#a78bfa').set('blend', 'screen'),
            new Node(polyPath(pts)).stroke('#ffffff', 1.5, 0.48),
        )
        for (let k = 0; k < 5; k++) {
            const c0 = centers[k]!
            const c1 = centers[k + 1]!
            const r = HOOK_EPICYCLES[k]!.amp * SCALE
            const x0 = CX + c0[0] * SCALE
            const y0 = CY - c0[1] * SCALE
            const x1 = CX + c1[0] * SCALE
            const y1 = CY - c1[1] * SCALE
            const rCol = RING_COLS[k]!
            nodes.push(
                circle(r, { fill: null, stroke: rCol, width: k === 0 ? 2.6 : 1.9 })
                    .at(x0, y0)
                    .opacity(k === 0 ? 0.75 : 0.6)
                    .glow(6, rCol)
                    .set('blend', 'screen'),
                line([x0, y0], [x1, y1], { stroke: '#ffd166', width: k === 0 ? 3.2 : 2.4 })
                    .glow(8, '#ffd166')
                    .set('blend', 'screen')
                    .opacity(0.96),
                dot(4.5, '#ffffff').at(x0, y0).glow(10, rCol).set('blend', 'screen').opacity(0.92),
            )
        }
        const ringR = 16 + ((spin.value * 4) % 1) * 60
        const ringOp = (1 - ((spin.value * 4) % 1)) * 0.78
        nodes.push(
            circle(ringR, { fill: null, stroke: '#ffd166', width: 2.4 }).at(tipX, tipY).opacity(ringOp).glow(10, '#ffd166').set('blend', 'screen'),
            circle(32, {
                fill: radialGradient([0, 0], 32, [
                    [0, '#ffd166bb'],
                    [0.5, '#5ce1e638'],
                    [1, '#ffd16600'],
                ]),
                stroke: null,
            }).at(tipX, tipY).set('blend', 'screen'),
            dot(9, '#ffffff').at(tipX, tipY).glow(18, '#ffd166').set('blend', 'screen'),
        )
        return group(...nodes)
    })

    s.add(liveVisual, titleGroup)
    c.at(0.05, () => s.play(spin.to(2.85, { duration: Math.max(4, sceneLen - 0.35), ease: linear })))
    c.at(0.05, () => s.play(wavePhase.to(12, { duration: Math.max(4, sceneLen - 0.35), ease: linear })))
    c.on('spinning circles', () => {
        s.play(peaksIgnite.to(1.08, { duration: 1.4 }))
    })
}

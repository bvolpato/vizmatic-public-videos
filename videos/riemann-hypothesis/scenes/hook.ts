import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { ZETA_ZEROS, zeta } from '../math'
import { txt } from '../../../factory/style'

// High-energy 14-second viral hook montage:
// 0..4.5s: Blazing critical-line spiral piercing zero + "$1,000,000" headline
// 4.5..9.5s: Razor-thin golden line + radiant harmonic waves pulsing outward across the cosmos
const N_SPIRAL = 720
const CX = 310
const CY = 10
const SCALE = 160
const HOOK_SPIRAL: Vec[] = Array.from({ length: N_SPIRAL }, (_, i) => {
    const t = 0.5 + (33.5 * i) / (N_SPIRAL - 1)
    const [re, im] = zeta(0.5, t)
    return [CX + re * SCALE, CY - im * SCALE] as Vec
})

const HARMONIC_COLS = ['#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'] as const
const WAVE_XS = Array.from({ length: 180 }, (_, i) => -860 + (1720 * i) / 179)

export const hook: SceneFunction = (s, c) => {
    const spiralProg = s.value(0.18)
    const showSpiralShot = s.value(1)
    const showWaveShot = s.value(0)
    const wavePhase = s.value(0)

    const spiralGrad = linearGradient([CX - 280, CY + 300], [CX + 420, CY - 300], ['#5ce1e6', '#7c8cff', '#c084fc', '#ff6b8b', '#ffd166'])

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
        const pulseR = 24 + ((spiralProg.value * 9) % 1) * 110
        const pulseOp = (1 - ((spiralProg.value * 9) % 1)) * 0.7 * a
        return group(
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, '#ffd16626'],
                    [0.45, '#4c2f8a18'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).opacity(a),
            circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.5 }).at(CX, CY).opacity(pulseOp).glow(8, '#ffd166'),
            dot(6, '#ffffff').at(CX, CY).glow(12, '#ffd166').opacity(a),
            new Node(polyPath(pts)).stroke(spiralGrad, 5.2, 0.96 * a).glow(10, '#a78bfa'),
            new Node(polyPath(pts)).stroke('#ffffff', 1.4, 0.42 * a),
            dot(8, '#ffffff').at(tip[0], tip[1]).glow(16, '#ffd166').opacity(a),
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
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ffd16624'],
                    [0.5, '#5ce1e610'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, 0).opacity(a),
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
                new Node(polyPath(pts)).stroke(col, 3.6, 0.88 * a).glow(8, col),
                new Node(polyPath(pts)).stroke('#ffffff', 1.0, 0.35 * a),
            )
        }
        nodes.push(
            line([0, -255], [0, 265], { stroke: '#ffd166', width: 4.5 }).glow(12, '#ffd166').opacity(a),
            ...[-150, -75, 0, 75, 150].map((y, i) =>
                group(
                    circle(12 + Math.sin(ph + i) * 3, { fill: null, stroke: '#ffd166', width: 2.2 }).at(0, y).opacity(0.9 * a),
                    dot(5.5, '#ffffff').at(0, y).glow(10, '#ffd166').opacity(a),
                ),
            ),
        )
        return group(...nodes)
    })

    s.add(liveSpiralShot, shot1Title)
    c.at(0.05, () => s.play(spiralProg.to(1, { duration: 6.2 })))

    c.on('one razor-thin line', () => {
        s.play(showSpiralShot.to(0, { duration: 0.25 }))
        s.play(showWaveShot.to(1, { duration: 0.3 }))
        s.play(wavePhase.to(6.0, { duration: 3.6, ease: linear }))
    })
    c.swap('one razor-thin line', shot1Title, shot2Caption)
    s.add(liveWaveShot)
}

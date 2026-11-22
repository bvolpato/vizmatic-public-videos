import {
    Node, circle, dot, dynamic, group, linear, linearGradient, polyPath, radialGradient,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const WAVE_XS = Array.from({ length: 140 }, (_, i) => -760 + (1520 * i) / 139)

export const finale: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const goldGrad = linearGradient([-760, -160], [760, -160], ['#5ce1e6', '#ffd166', '#5ce1e6'])

    const liveLock = dynamic(() => {
        const ph = phase.value
        const cy = -165
        const nodes: Node[] = [
            circle(470, {
                fill: radialGradient([0, 0], 470, [
                    [0, '#ffd1662c'],
                    [0.45, '#5ce1e614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, cy),
        ]

        // Background cancelling rose wave + constructive golden interference wave
        for (let k = 0; k < 3; k++) {
            const pts: Vec[] = WAVE_XS.map((x) => {
                const env = Math.exp(-(x * x) / (2 * 480 * 480))
                const y = cy + Math.sin(x * (0.014 + k * 0.004) + ph * (1.5 + k * 0.35)) * (36 - k * 8) * env
                return [x, y] as Vec
            })
            const isGold = k === 0
            nodes.push(
                new Node(polyPath(pts))
                    .stroke(isGold ? goldGrad : '#ff6b8b', isGold ? 4 : 2, isGold ? 0.9 : 0.25)
                    .glow(isGold ? 10 : 0, '#ffd166'),
            )
        }

        // Interlocked prime rings p and q forming the RSA lock
        const pCx = -76
        const qCx = 76
        const pulseR = 112 + ((ph * 0.5) % 1) * 110
        const pulseOp = (1 - ((ph * 0.5) % 1)) * 0.48
        nodes.push(
            circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.2 }).at(0, cy).opacity(pulseOp).glow(8, '#ffd166'),
            circle(114, { fill: null, stroke: '#5ce1e6', width: 4 }).at(pCx, cy).glow(10, '#38bdf8'),
            circle(114, { fill: null, stroke: '#ffd166', width: 4 }).at(qCx, cy).glow(10, '#ffd166'),
            txt('prime p', pCx - 168, cy - 122, 30, '#5ce1e6', 'mono').glow(6, '#38bdf8'),
            txt('prime q', qCx + 168, cy - 122, 30, '#ffd166', 'mono').glow(6, '#ffd166'),
            dot(8, '#ffffff').at(0, cy).glow(16, '#ffd166'),
        )
        return group(...nodes)
    })

    const headline = group(
        txt("Quantum computers don't try everything faster.", 0, 108, 52, '#cbd5e8', 'serif'),
        txt('They cancel the wrong answers.', 0, 198, 74, '#ffd166', 'serif').glow(8, '#ffd166'),
        txt('Peter Shor (1994)  ·  Quantum Fourier Transform', 0, 304, 28, '#8b99b8', 'mono'),
    )

    s.add(liveLock, headline)
    c.at(0.05, () => s.play(phase.to(7.5, { duration: 14.5, ease: linear })))
}

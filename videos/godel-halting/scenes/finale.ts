import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, radialGradient,
    type SceneFunction,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

export const finale: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const beamGrad = linearGradient([-260, -320], [260, 40], ['#5ce1e6', '#a78bfa', '#ff6b8b', '#ffd166'])

    const liveHorizon = dynamic(() => {
        const ph = phase.value
        const cy = -190
        const nodes: Node[] = [
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#ffd1662c'],
                    [0.45, '#5ce1e614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, cy),
        ]

        const radii = [62, 112, 162, 212]
        const cols = ['#5ce1e6', '#60a5fa', '#a78bfa', '#ffd166']
        for (let i = 0; i < radii.length; i++) {
            const r = radii[i]! + Math.sin(ph * 1.4 - i * 0.7) * 4
            const col = cols[i]!
            nodes.push(
                circle(r, { fill: null, stroke: col, width: i === 3 ? 2.6 : 1.8 })
                    .at(0, cy)
                    .opacity(0.32 + i * 0.16)
                    .glow(6, col),
            )
            const ang = ph * (0.45 - i * 0.08) + i * 1.6
            const bx = Math.cos(ang) * (r + 12)
            const by = cy + Math.sin(ang) * (r + 12) * 0.56
            nodes.push(dot(5.5, i === 3 ? '#ff6b8b' : '#ffd166').at(bx, by).glow(10, '#ffd166'))
        }

        const pulseR = 38 + ((ph * 0.55) % 1) * 185
        const pulseOp = (1 - ((ph * 0.55) % 1)) * 0.52
        nodes.push(
            circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.2 }).at(0, cy).opacity(pulseOp).glow(8, '#ffd166'),
            line([-190, cy - 135], [190, cy + 135], { stroke: beamGrad, width: 3.6, opacity: 0.82 }).glow(10, '#ff6b8b'),
            dot(8, '#ffffff').at(0, cy).glow(16, '#ffd166'),
        )
        return group(...nodes)
    })

    const headline = group(
        txt('Truth is always larger than proof.', 0, 128, 70, '#f8f4ec', 'serif').glow(8, '#ffd166'),
        txt('Every consistent formal system and AI inherits the horizon.', 0, 214, 34, '#5ce1e6', 'sans'),
        txt('Kurt Gödel (1931)  ·  Alan Turing (1936)', 0, 304, 28, '#8b99b8', 'mono'),
    )

    s.add(liveHorizon, headline)
    c.at(0.05, () => s.play(phase.to(7.5, { duration: 15.0, ease: linear })))
}

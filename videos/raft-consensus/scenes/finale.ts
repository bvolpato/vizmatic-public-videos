import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, radialGradient, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const NODES_X = [-640, -320, 0, 320, 640] as const
const WAVE_XS = Array.from({ length: 160 }, (_, i) => -780 + (1560 * i) / 159)

export const finale: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const reveal = s.value(0)

    const liveFinale = dynamic(() => {
        const ph = phase.value
        const rv = reveal.value
        const wavePts: Vec[] = WAVE_XS.map((x) => [
            x,
            -210 + Math.sin(x * 0.008 - ph * 2.4) * 26 * Math.exp(-(x * x) / (2 * 640 * 640)),
        ])
        const pulseR = 45 + ((ph * 0.55) % 1) * 140
        const pulseOp = (1 - ((ph * 0.55) % 1)) * 0.6

        const nodes: Node[] = [
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, '#ffd16628'],
                    [0.45, '#6ee7b716'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, -170),
            new Node(polyPath(wavePts)).stroke('#ffd166', 3.2, 0.55).glow(8, '#ffd166'),
            line([-640, -210], [640, -210], { stroke: '#6ee7b7', width: 2.2, opacity: 0.45 }),
            circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.4 }).at(0, -210).opacity(pulseOp).glow(8, '#ffd166'),
        ]

        // 5 synchronized servers glowing in harmonic lockstep with identical replicated logs
        for (let i = 0; i < NODES_X.length; i++) {
            const x = NODES_X[i]!
            const isLeader = i === 2
            const col = isLeader ? '#ffd166' : '#6ee7b7'
            const bob = Math.sin(ph * 2.4 - i * 0.45) * 6
            nodes.push(
                circle(isLeader ? 46 : 38, { fill: '#0e1828', stroke: col, width: isLeader ? 4.4 : 3.2 })
                    .at(x, -210 + bob)
                    .glow(isLeader ? 14 : 8, col),
                txt(`S${i + 1}`, x, -208 + bob, 28, col, 'mono'),
                rect(266, 54, { fill: '#102427', stroke: col, width: 2.2, radius: 10 }).at(x, -95),
                txt('T2 · x = 42  ✓', x, -93, 26, col, 'mono'),
            )
            if (i < NODES_X.length - 1) {
                const t = (ph * 0.7 + i * 0.2) % 1
                const px = x + (NODES_X[i + 1]! - x) * t
                nodes.push(dot(5, '#ffd166').at(px, -210).glow(8, '#ffd166'))
            }
        }

        nodes.push(
            txt('Two majorities always', 0, 118, 70, '#f8f4ec', 'serif').opacity(0.35 + rv * 0.65).glow(6, '#90b4ff'),
            txt('share a witness.', 0, 208, 74, '#ffd166', 'serif').opacity(0.35 + rv * 0.65).glow(10, '#ffd166'),
            txt('Raft Consensus  ·  2q > N  ·  Zero split-brain commits', 0, 310, 28, '#8b99b8', 'mono').opacity(0.4 + rv * 0.6),
        )
        return group(...nodes)
    })

    s.add(liveFinale)
    c.at(0.1, () => s.play(phase.to(7.2, { duration: 15.5, ease: linear })))
    c.on('Two majorities', () => s.play(reveal.to(1, { duration: 0.8 })))
}

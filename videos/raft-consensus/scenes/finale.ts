import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, radialGradient, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const NODES_X = [-640, -320, 0, 320, 640] as const
const WAVE_XS = Array.from({ length: 160 }, (_, i) => -780 + (1560 * i) / 159)
const ROW_Y = -200

export const finale: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const reveal = s.value(0)

    const liveFinale = dynamic(() => {
        const ph = phase.value
        const rv = reveal.value
        const wavePts: Vec[] = WAVE_XS.map((x) => [
            x,
            ROW_Y + Math.sin(x * 0.008 - ph * 2.4) * 26 * Math.exp(-(x * x) / (2 * 640 * 640)),
        ])
        const pulsePhase = (ph * 0.55) % 1
        const pulseR = 54 + pulsePhase * 165
        const pulseOp = (1 - pulsePhase) * 0.72

        const nodes: Node[] = [
            // Radiant golden-emerald witness aura behind S3
            circle(540, {
                fill: radialGradient([0, 0], 540, [
                    [0, '#ffd1663c'],
                    [0.32, '#ffd16620'],
                    [0.6, '#6ee7b716'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, ROW_Y),
            circle(155, {
                fill: radialGradient([0, 0], 155, [
                    [0, '#ffd16648'],
                    [0.6, '#ffd16618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, ROW_Y).set('blend', 'screen'),
            // Witness pulsing halo rings behind S3
            circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.8 })
                .at(0, ROW_Y)
                .opacity(pulseOp)
                .glow(12, '#ffd166')
                .set('blend', 'screen'),
            circle(82, { fill: null, stroke: '#ffd166', width: 2.0, dash: [8, 10] })
                .at(0, ROW_Y)
                .opacity(0.65)
                .glow(8, '#ffd166'),
            // Harmonic wave & consensus rail rendered BEHIND all 5 opaque server disks!
            new Node(polyPath(wavePts)).stroke('#ffd166', 3.6, 0.65).glow(10, '#ffd166').set('blend', 'screen'),
            line([-640, ROW_Y], [640, ROW_Y], { stroke: '#6ee7b7', width: 2.6, opacity: 0.55 }).set('blend', 'screen'),
        ]

        // Traveling golden heartbeat pulses rendered STRICTLY BEHIND the server disks so they NEVER cover S1..S5!
        for (let i = 0; i < NODES_X.length - 1; i++) {
            const x0 = NODES_X[i]!
            const x1 = NODES_X[i + 1]!
            const t = (ph * 0.68 + i * 0.23) % 1
            const px = x0 + (x1 - x0) * t
            nodes.push(
                dot(6.5, '#ffd166').at(px, ROW_Y).glow(12, '#ffd166').set('blend', 'screen'),
                dot(3.0, '#ffffff').at(px, ROW_Y).set('blend', 'screen'),
            )
        }

        // 5 synchronized servers with OPAQUE #0c1222 circular fills rendered ABOVE the wave & traveling pulses!
        for (let i = 0; i < NODES_X.length; i++) {
            const x = NODES_X[i]!
            const isLeader = i === 2
            const col = isLeader ? '#ffd166' : '#6ee7b7'
            const bob = Math.sin(ph * 2.4 - i * 0.45) * 5
            nodes.push(
                circle(isLeader ? 50 : 40, { fill: '#0c1222', stroke: col, width: isLeader ? 4.6 : 3.4 })
                    .at(x, ROW_Y + bob)
                    .glow(isLeader ? 16 : 9, col),
                txt(`S${i + 1}`, x, ROW_Y + 2 + bob, 28, col, 'mono'),
                rect(266, 54, { fill: '#102427', stroke: col, width: 2.4, radius: 10 }).at(x, ROW_Y + 115),
                txt('T2 · x = 42  ✓', x, ROW_Y + 117, 26, col, 'mono'),
            )
        }

        // Crisp witness crown badge above S3
        nodes.push(
            rect(352, 46, { fill: '#111626ee', stroke: '#ffd166', width: 2.2, radius: 23 }).at(0, ROW_Y - 122).glow(8, '#ffd166'),
            txt('SHARED WITNESS · S3', 0, ROW_Y - 120, 26, '#ffd166', 'mono'),
            txt('Two majorities always', 0, 122, 70, '#f8f4ec', 'serif').opacity(0.4 + rv * 0.6).glow(6, '#90b4ff'),
            txt('share a witness.', 0, 212, 74, '#ffd166', 'serif').opacity(0.4 + rv * 0.6).glow(10, '#ffd166'),
            txt('Raft Consensus  ·  2q > N  ·  Zero split-brain commits', 0, 314, 28, '#a8b8d8', 'mono').opacity(0.65 + rv * 0.35),
        )
        return group(...nodes)
    })

    s.add(liveFinale)
    c.at(0.1, () => s.play(phase.to(7.2, { duration: 15.5, ease: linear })))
    c.on('Two majorities', () => s.play(reveal.to(1, { duration: 0.8 })))
}

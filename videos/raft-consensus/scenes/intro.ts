import {
    Node, circle, dot, dynamic, group, line, radialGradient, rect,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const CX = 390
const CY = 0
const R = 218

const NODES: readonly { readonly name: string; readonly pos: Vec }[] = Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5
    return { name: `S${i + 1}`, pos: [CX + Math.cos(a) * R, CY + Math.sin(a) * R] as Vec }
})

export const intro: IntroFunction = (stage, clock) => {
    const prog = stage.value(0.2)

    stage.add(
        circle(530, {
            fill: radialGradient([0, 0], 530, [
                [0, '#ffd1662c'],
                [0.45, '#5ce1e618'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY),
        txt('DISTRIBUTED CONSENSUS · N = 5', -840, -195, 26, '#5ce1e6', 'mono', 'left'),
        txt('Raft Consensus', -848, -72, 108, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('& Split-Brain', -848, 56, 112, '#ffd166', 'serif', 'left').glow(9, '#ffd166'),
        txt('Why distributed systems survive partitions', -840, 178, 34, '#c8d4ec', 'sans', 'left'),
        dynamic(() => {
            const p = prog.value
            const leader = NODES[0]!
            const nodes: Node[] = [
                circle(R + 36, { fill: null, stroke: '#3a4f7d', width: 1.6, dash: [8, 12] }).at(CX, CY).opacity(0.45),
            ]

            // Mesh edges between all 5 servers
            for (let i = 0; i < NODES.length; i++) {
                for (let j = i + 1; j < NODES.length; j++) {
                    const a = NODES[i]!.pos
                    const b = NODES[j]!.pos
                    const isLeaderEdge = i === 0
                    nodes.push(
                        line(a, b, {
                            stroke: isLeaderEdge ? '#ffd166' : '#435888',
                            width: isLeaderEdge ? 2.6 : 1.6,
                            opacity: isLeaderEdge ? 0.65 : 0.42,
                        }).set('blend', isLeaderEdge ? 'screen' : 'normal'),
                    )
                }
            }

            // Golden leader heartbeat shockwave + traveling photons
            const pulseR = 46 + p * 235
            nodes.push(
                circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.8 })
                    .at(leader.pos[0], leader.pos[1])
                    .opacity((1 - p) * 0.88)
                    .glow(12, '#ffd166')
                    .set('blend', 'screen'),
            )
            for (let i = 1; i < NODES.length; i++) {
                const target = NODES[i]!.pos
                const px = leader.pos[0] + (target[0] - leader.pos[0]) * p
                const py = leader.pos[1] + (target[1] - leader.pos[1]) * p
                nodes.push(dot(6.5, '#ffd166').at(px, py).glow(14, '#ffd166').set('blend', 'screen'))
            }

            // Five glowing server nodes
            for (let i = 0; i < NODES.length; i++) {
                const n = NODES[i]!
                const isL = i === 0
                const col = isL ? '#ffd166' : '#5ce1e6'
                nodes.push(
                    circle(isL ? 46 : 38, { fill: '#0c1222', stroke: col, width: isL ? 4.4 : 3.2 })
                        .at(n.pos[0], n.pos[1])
                        .glow(isL ? 14 : 8, col),
                    txt(n.name, n.pos[0], n.pos[1] + 2, 26, col, 'mono'),
                )
            }
            nodes.push(
                rect(240, 44, { fill: '#111626e6', stroke: '#ffd166', width: 2.2, radius: 22 }).at(CX, CY + 315),
                txt('HEALTHY · TERM 1', CX, CY + 317, 26, '#ffd166', 'mono'),
            )
            return group(...nodes)
        }),
    )

    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

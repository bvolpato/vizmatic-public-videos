import {
    Node, circle, dot, dynamic, group, line, radialGradient,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const CX = 390
const CY = 0
const R = 215

const NODES: readonly { readonly name: string; readonly pos: Vec }[] = Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5
    return { name: `S${i + 1}`, pos: [CX + Math.cos(a) * R, CY + Math.sin(a) * R] as Vec }
})

export const intro: IntroFunction = (stage, clock) => {
    const prog = stage.value(0.2)

    stage.add(
        circle(520, {
            fill: radialGradient([0, 0], 520, [
                [0, '#ffd16628'],
                [0.45, '#5ce1e616'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY),
        txt('DISTRIBUTED CONSENSUS · N = 5', -840, -195, 26, '#5ce1e6', 'mono', 'left'),
        txt('Raft Consensus', -848, -72, 108, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('& Split-Brain', -848, 56, 112, '#ffd166', 'serif', 'left').glow(9, '#ffd166'),
        txt('Why distributed systems survive partitions', -840, 178, 34, '#b8c5df', 'sans', 'left'),
        dynamic(() => {
            const p = prog.value
            const leader = NODES[0]!
            const nodes: Node[] = []

            // Mesh edges between all 5 servers
            for (let i = 0; i < NODES.length; i++) {
                for (let j = i + 1; j < NODES.length; j++) {
                    const a = NODES[i]!.pos
                    const b = NODES[j]!.pos
                    const isLeaderEdge = i === 0
                    nodes.push(
                        line(a, b, {
                            stroke: isLeaderEdge ? '#ffd166' : '#3a4a72',
                            width: isLeaderEdge ? 2.4 : 1.5,
                            opacity: isLeaderEdge ? 0.55 : 0.35,
                        }),
                    )
                }
            }

            // Golden leader heartbeat shockwave + traveling photons
            const pulseR = 45 + p * 230
            nodes.push(
                circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.6 }).at(leader.pos[0], leader.pos[1]).opacity((1 - p) * 0.85).glow(10, '#ffd166'),
            )
            for (let i = 1; i < NODES.length; i++) {
                const target = NODES[i]!.pos
                const px = leader.pos[0] + (target[0] - leader.pos[0]) * p
                const py = leader.pos[1] + (target[1] - leader.pos[1]) * p
                nodes.push(dot(6, '#ffd166').at(px, py).glow(12, '#ffd166'))
            }

            // Five glowing server nodes
            for (let i = 0; i < NODES.length; i++) {
                const n = NODES[i]!
                const isL = i === 0
                const col = isL ? '#ffd166' : '#5ce1e6'
                nodes.push(
                    circle(isL ? 44 : 36, { fill: '#0f162a', stroke: col, width: isL ? 4.2 : 3 }).at(n.pos[0], n.pos[1]).glow(isL ? 14 : 8, col),
                    txt(n.name, n.pos[0], n.pos[1] + 2, 26, col, 'mono'),
                )
            }
            return group(...nodes)
        }),
    )

    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

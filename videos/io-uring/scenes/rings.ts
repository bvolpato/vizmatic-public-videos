import { Node, circle, dot, dynamic, group, line, linear, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const rings: SceneFunction = (s, c) => {
    const spin = s.value(0)

    const header = group(
        txt('Two Lock-Free Shared Memory Rings', 0, -410, 58, COSMOS.ink, 'serif').glow(5, COSMOS.gold),
        line([-840, 0], [840, 0], { stroke: '#2c3856', width: 2.5, dash: [12, 10] }),
        txt('USER SPACE  (writes SQ, reads CQ)', -820, -310, 26, COSMOS.cyan, 'mono', 'left'),
        txt('LINUX KERNEL  (reads SQ, writes CQ)', -820, 345, 26, COSMOS.amber, 'mono', 'left'),
    )

    const SLOTS = 12
    const liveRings = dynamic(() => {
        const ph = spin.value
        const R = 195
        const sqCx = -360
        const cqCx = 360
        const nodes: Node[] = [
            nebula(sqCx, 0, 340, '#ffd16620'),
            nebula(cqCx, 0, 340, '#6ee7b720'),
            circle(R, { fill: '#0d1322', stroke: COSMOS.gold, width: 4 }).at(sqCx, 0).glow(10, COSMOS.gold),
            circle(R - 58, { fill: '#070910', stroke: '#29334d', width: 2 }).at(sqCx, 0),
            txt('Submission', sqCx, -18, 34, COSMOS.gold, 'serif'),
            txt('64 B SQEs', sqCx, 26, 26, COSMOS.muted, 'mono'),

            circle(R, { fill: '#0d1322', stroke: COSMOS.emerald, width: 4 }).at(cqCx, 0).glow(10, COSMOS.emerald),
            circle(R - 58, { fill: '#070910', stroke: '#29334d', width: 2 }).at(cqCx, 0),
            txt('Completion', cqCx, -18, 34, COSMOS.emerald, 'serif'),
            txt('16 B CQEs', cqCx, 26, 26, COSMOS.muted, 'mono'),
        ]

        // Orbiting active SQE & CQE tokens around each ring
        for (let i = 0; i < SLOTS; i++) {
            const a = (i * Math.PI * 2) / SLOTS - Math.PI / 2
            const activeSQ = ((i - Math.floor(ph * 4)) % SLOTS + SLOTS) % SLOTS < 4
            const activeCQ = ((i - Math.floor(ph * 4 - 2)) % SLOTS + SLOTS) % SLOTS < 4
            const rMid = R - 29
            nodes.push(
                dot(activeSQ ? 10 : 4.5, activeSQ ? COSMOS.gold : '#2b3652').at(sqCx + Math.cos(a) * rMid, Math.sin(a) * rMid).glow(activeSQ ? 12 : 0, COSMOS.gold),
                dot(activeCQ ? 10 : 4.5, activeCQ ? COSMOS.emerald : '#2b3652').at(cqCx + Math.cos(a) * rMid, Math.sin(a) * rMid).glow(activeCQ ? 12 : 0, COSMOS.emerald),
            )
        }
        return group(...nodes)
    })

    s.add(header, liveRings)
    c.at(0.1, () => s.play(spin.to(6.0, { duration: 22, ease: linear })))
}

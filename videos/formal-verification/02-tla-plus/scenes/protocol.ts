import { Node, circle, dot, dynamic, group, line, polyPath, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

export const protocol: SceneFunction = (s, c) => {
    const req1 = s.value(0)
    const ackLost = s.value(0)
    const retry = s.value(0)

    const header = group(
        txt('PROOFS FOR REAL SYSTEMS  ·  EP 2 / 3', -840, -400, 26, COSMOS.gold, 'mono', 'left'),
        txt('The Missing Acknowledgment', -848, -328, 66, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.gold),
    )

    const liveExchange = dynamic(() => {
        const r1 = req1.value
        const al = ackLost.value
        const r2 = retry.value
        const nodes: Node[] = [
            nebula(-540, 20, 260, '#60a5fa1e'),
            nebula(540, 20, 260, '#ffd1661e'),
            line([-430, 20], [430, 20], { stroke: '#293554', width: 2.5, dash: [10, 8] }),
            circle(105, { fill: '#111626', stroke: COSMOS.blue, width: 4 }).at(-540, 20).glow(10, COSMOS.blue),
            txt('Sender', -540, 20, 34, COSMOS.blue, 'serif'),
            circle(105, { fill: '#111626', stroke: COSMOS.gold, width: 4 }).at(540, 20).glow(10, COSMOS.gold),
            txt('Warehouse', 540, 8, 32, COSMOS.gold, 'serif'),
            txt(`shipped = ${r2 > 0.85 ? 2 : r1 > 0.85 ? 1 : 0}`, 540, 56, 26, r2 > 0.85 ? COSMOS.rose : COSMOS.emerald, 'mono'),
        ]
        if (r1 > 0.02 && r1 < 0.99) {
            const x = -430 + r1 * 860
            nodes.push(dot(11, COSMOS.gold).at(x, -25).glow(14, COSMOS.gold), txt('order #1', x, -62, 26, COSMOS.gold, 'mono'))
        }
        if (al > 0.02) {
            const x = 430 - Math.min(0.55, al * 0.55) * 860
            const op = al > 0.85 ? Math.max(0, 1 - (al - 0.85) * 6) : 1
            nodes.push(
                dot(11, COSMOS.cyan).at(x, 65).glow(14, COSMOS.cyan).opacity(op),
                txt(al > 0.7 ? 'ACK LOST!' : 'ack', x, 108, 26, al > 0.7 ? COSMOS.rose : COSMOS.cyan, 'mono'),
            )
        }
        if (r2 > 0.02) {
            const x = -430 + r2 * 860
            nodes.push(
                dot(11, COSMOS.rose).at(x, -25).glow(14, COSMOS.rose),
                txt('retry -> duplicate!', Math.min(200, x), -125, 26, COSMOS.rose, 'mono'),
            )
        }
        return group(...nodes)
    })

    s.add(header, liveExchange)
    c.at(0.1, () => s.play(req1.to(1, { duration: 2.6 })))
    c.on('acknowledgment', () => s.play(ackLost.to(1, { duration: 2.8 })))
    c.on('sender retries', () => s.play(retry.to(1, { duration: 2.8 })))
}

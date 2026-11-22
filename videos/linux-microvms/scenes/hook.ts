import { Node, circle, dot, dynamic, group, regularPolygon, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

// 180 tiny luminous microVM hexagonal pods igniting across a bare-metal host
const PODS = Array.from({ length: 140 }, (_, i) => {
    const col = i % 14
    const row = Math.floor(i / 14)
    return { x: 40 + (col - 6.5) * 62, y: -10 + (row - 4.5) * 62, idx: i }
})

export const hook: SceneFunction = (s, c) => {
    const ignite = s.value(0.15)
    const headline = group(
        txt('KVM  /  FIRECRACKER MICROVMS', -840, -230, 26, COSMOS.gold, 'mono', 'left'),
        txt('Sub-Second', -848, -108, 108, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.cyan),
        txt('Sandboxes', -848, 8, 108, COSMOS.cyan, 'serif', 'left').glow(8, COSMOS.cyan),
        txt('A dedicated Linux kernel for every untrusted task', -840, 128, 32, COSMOS.muted, 'sans', 'left'),
        txt('~125 ms boot   ·   < 5 MiB overhead', -840, 206, 28, COSMOS.emerald, 'mono', 'left'),
    )

    const liveFleet = dynamic(() => {
        const count = Math.floor(ignite.value * PODS.length)
        const nodes: Node[] = [nebula(390, 0, 480, '#5ce1e622', '#ffd16610')]
        for (let i = 0; i < PODS.length; i++) {
            const p = PODS[i]!
            const lit = i < count
            const px = p.x + 350
            const py = p.y
            if (lit) {
                const col = i % 7 === 0 ? COSMOS.gold : COSMOS.cyan
                nodes.push(
                    regularPolygon(6, 17, { fill: '#102030', stroke: col, width: 2 }).at(px, py).glow(5, col),
                    dot(3, '#ffffff').at(px, py),
                )
            } else {
                nodes.push(regularPolygon(6, 15, { fill: null, stroke: '#1d263d', width: 1.2 }).at(px, py))
            }
        }
        return group(...nodes)
    })

    s.add(liveFleet, headline)
    c.at(0.08, () => s.play(ignite.to(1, { duration: 4.5 })))
}

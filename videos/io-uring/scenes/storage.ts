import { Node, circle, dot, dynamic, group, line, polyPath, type SceneFunction, type Vec } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const storage: SceneFunction = (s, c) => {
    const bufProg = s.value(0)
    const dirProg = s.value(0)

    const header = group(
        txt('Below the Rings: Page Cache vs O_DIRECT', 0, -405, 56, COSMOS.ink, 'serif').glow(5, COSMOS.cyan),
        txt('Same 4 KiB read through io_uring — two completely different storage paths', 0, -335, 28, COSMOS.muted, 'sans'),
    )

    const livePaths = dynamic(() => {
        const bp = bufProg.value
        const dp = dirProg.value
        const nodes: Node[] = [
            nebula(-380, 40, 340, '#60a5fa1e'),
            nebula(380, 40, 340, '#6ee7b722'),
            // Top source node: io_uring SQ
            circle(86, { fill: '#111626', stroke: COSMOS.gold, width: 3.5 }).at(0, -210).glow(10, COSMOS.gold),
            txt('io_uring', 0, -210, 26, COSMOS.gold, 'mono'),

            // Left path: Buffered I/O -> Page Cache
            txt('Buffered I/O', -420, -145, 34, COSMOS.blue, 'serif'),
            circle(102, { fill: '#121c33', stroke: COSMOS.blue, width: 3.5 }).at(-420, 45).glow(10, COSMOS.blue),
            txt('Page Cache', -420, 45, 26, COSMOS.blue, 'mono'),
            txt('RAM hit / worker', -420, 185, 26, COSMOS.muted, 'sans'),

            // Right path: O_DIRECT -> blk-mq -> NVMe
            txt('O_DIRECT + Registered Buffers', 420, -145, 32, COSMOS.emerald, 'serif'),
            circle(78, { fill: '#102420', stroke: COSMOS.cyan, width: 3 }).at(420, 15).glow(8, COSMOS.cyan),
            txt('blk-mq', 420, 15, 26, COSMOS.cyan, 'mono'),
            circle(78, { fill: '#102420', stroke: COSMOS.emerald, width: 4 }).at(420, 240).glow(12, COSMOS.emerald),
            txt('NVMe', 420, 240, 30, COSMOS.emerald, 'mono'),
            txt('Zero extra copy · deterministic latency', 420, 360, 26, COSMOS.emerald, 'sans'),
        ]

        if (bp > 0.02) {
            const x = -78 + (-332 - -78) * bp
            const y = -168 + (-14 - -168) * bp
            const pts: Vec[] = [[-78, -168], [x, y]]
            nodes.push(
                new Node(polyPath(pts)).stroke(COSMOS.blue, 4.5, 0.9).glow(8, COSMOS.blue),
                dot(9, '#ffffff').at(x, y).glow(12, COSMOS.blue),
            )
        }
        if (dp > 0.02) {
            const pts: Vec[] = dp < 0.5
                ? [[78, -168], [78 + (350 - 78) * (dp * 2), -168 + (-22 - -168) * (dp * 2)]]
                : [[78, -168], [350, -22]]
            const tip = pts[pts.length - 1]!
            nodes.push(
                new Node(polyPath(pts)).stroke(COSMOS.emerald, 5, 0.95).glow(10, COSMOS.emerald),
                dot(10, '#ffffff').at(tip[0], tip[1]).glow(14, COSMOS.emerald),
            )
            if (dp >= 0.5) {
                const sub = (dp - 0.5) * 2
                const y2 = 95 + (160 - 95) * sub
                nodes.push(
                    new Node(polyPath([[420, 95], [420, y2]])).stroke(COSMOS.emerald, 5, 0.95).glow(10, COSMOS.emerald),
                    dot(10, '#ffffff').at(420, y2).glow(14, COSMOS.emerald),
                )
            }
        }
        return group(...nodes)
    })

    s.add(header, livePaths)
    c.on('buffered', () => s.play(bufProg.to(1, { duration: 2.2 })))
    c.on('skips the page cache', () => s.play(dirProg.to(1, { duration: 2.8 })))
}

import { Node, circle, dynamic, group, line, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

const NODES = [
    { id: 'S0', x: -680, y: 20, label: 'Idle\nd=0' },
    { id: 'S1', x: -340, y: -110, label: 'Sent\nd=0' },
    { id: 'S2', x: 0, y: -110, label: 'Ack\nd=1' },
    { id: 'S3', x: 0, y: 150, label: 'Lost\nd=1' },
    { id: 'S4', x: 340, y: 150, label: 'Retry\nd=1' },
    { id: 'S5', x: 680, y: 20, label: 'BUG!\nd=2' },
]

export const graph: SceneFunction = (s, c) => {
    const bfs = s.value(0)
    const repaired = s.value(0)

    const header = group(
        txt('TLC Explicit-State Model Checking', -830, -400, 58, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.cyan),
        txt('Invariant:  dispatches <= 1', -830, -328, 28, COSMOS.gold, 'mono', 'left'),
    )

    const liveGraph = dynamic(() => {
        const k = bfs.value
        const fix = repaired.value
        const count = Math.max(1, Math.round(1 + k * 5))
        const edges: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]
        const nodes: Node[] = [
            nebula(fix > 0.5 ? 0 : 680, 20, 380, fix > 0.5 ? '#6ee7b722' : '#ff6b8b22'),
        ]
        for (const [a, b] of edges) {
            if (b >= count) continue
            const na = NODES[a]!
            const nb = NODES[b]!
            const col = fix > 0.5 ? COSMOS.emerald : b === 5 ? COSMOS.rose : COSMOS.gold
            nodes.push(line([na.x, na.y], [nb.x, nb.y], { stroke: col, width: 3.5 }).glow(8, col))
        }
        for (let i = 0; i < count; i++) {
            const n = NODES[i]!
            const isBug = i === 5 && fix < 0.5
            const col = fix > 0.5 ? COSMOS.emerald : isBug ? COSMOS.rose : COSMOS.cyan
            const lbl = i === 5 && fix > 0.5 ? 'Safe\nd=1' : n.label
            nodes.push(
                circle(64, { fill: '#111626', stroke: col, width: isBug ? 5 : 3.5 }).at(n.x, n.y).glow(isBug ? 14 : 8, col),
                txt(lbl, n.x, n.y, 26, col, 'mono'),
            )
        }
        const status = fix > 0.5
            ? 'ATOMIC RECEIPT ADDED: 6 distinct states verified · 0 violations'
            : count === 6
                ? '5-STEP COUNTEREXAMPLE FOUND: Send -> Dispatch -> Lose -> Send -> Dispatch'
                : 'Exploring reachable protocol states...'
        nodes.push(txt(status, 0, 345, 28, fix > 0.5 ? COSMOS.emerald : count === 6 ? COSMOS.rose : COSMOS.muted, 'mono'))
        return group(...nodes)
    })

    s.add(header, liveGraph)
    c.on('explores every interleaving', () => s.play(bfs.to(1, { duration: 3.2 })))
    c.on('atomic receipt', () => s.play(repaired.to(1, { duration: 1.2 })))
}

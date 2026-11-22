import { Node, circle, dot, dynamic, group, line, polyPath, rect, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const snapshots: SceneFunction = (s, c) => {
    const cow = s.value(0)
    const warn = s.value(0)

    const headline = group(
        txt('Snapshots & Copy-on-Write Clones', -830, -405, 58, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.cyan),
        txt('Resume in milliseconds via lazy page faults · reseed entropy on clone', -830, -335, 28, COSMOS.muted, 'sans', 'left'),
    )

    const liveMem = dynamic(() => {
        const u = cow.value
        const w = warn.value
        const nodes: Node[] = [
            nebula(0, 10, 460, '#5ce1e61c', '#ffd16610'),
            // Shared read-only base snapshot pages in the center
            txt('Shared Snapshot Memory (read-only pages)', 0, -185, 28, COSMOS.cyan, 'mono'),
        ]
        for (let i = 0; i < 8; i++) {
            const x = -350 + i * 100
            const isDirtyA = u > 0.4 && (i === 1 || i === 5)
            const isDirtyB = u > 0.7 && (i === 2 || i === 6)
            nodes.push(
                rect(76, 76, { fill: '#122233', stroke: COSMOS.cyan, width: 2.5, radius: 10 }).at(x, -95).glow(6, COSMOS.cyan),
                txt(`P${i}`, x, -95, 26, COSMOS.ink, 'mono'),
            )
            if (isDirtyA) {
                nodes.push(
                    line([x, -55], [x - 160, 115], { stroke: COSMOS.gold, width: 3 }).glow(7, COSMOS.gold),
                    rect(76, 76, { fill: '#282012', stroke: COSMOS.gold, width: 3, radius: 10 }).at(x - 160, 155).glow(8, COSMOS.gold),
                    txt(`A${i}`, x - 160, 155, 26, COSMOS.gold, 'mono'),
                )
            }
            if (isDirtyB) {
                nodes.push(
                    line([x, -55], [x + 160, 115], { stroke: COSMOS.emerald, width: 3 }).glow(7, COSMOS.emerald),
                    rect(76, 76, { fill: '#122820', stroke: COSMOS.emerald, width: 3, radius: 10 }).at(x + 160, 155).glow(8, COSMOS.emerald),
                    txt(`B${i}`, x + 160, 155, 26, COSMOS.emerald, 'mono'),
                )
            }
        }
        nodes.push(
            txt('Clone A (private CoW pages)', -430, 250, 28, COSMOS.gold, 'mono').opacity(Math.min(1, u * 2)),
            txt('Clone B (private CoW pages)', 430, 250, 28, COSMOS.emerald, 'mono').opacity(Math.min(1, u * 2)),
        )
        if (w > 0.05) {
            nodes.push(
                txt('Clone hygiene: VMGenID  ·  reseed RNG  ·  sync clock  ·  unique MAC/IP', 0, 385, 30, COSMOS.rose, 'mono').opacity(w).glow(6, COSMOS.rose),
            )
        }
        return group(...nodes)
    })

    s.add(headline, liveMem)
    c.on('copy-on-write', () => s.play(cow.to(1, { duration: 2.5 })))
    c.on('subtle clone trap', () => s.play(warn.to(1, { duration: 1.0 })))
}

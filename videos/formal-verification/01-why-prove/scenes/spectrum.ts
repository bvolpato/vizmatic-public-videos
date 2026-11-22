import { circle, dot, group, line, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

export const spectrum: SceneFunction = (s, c) => {
    const header = group(
        txt('From Sampling to Mathematical Proof', 0, -405, 60, COSMOS.ink, 'serif').glow(5, COSMOS.cyan),
        txt('Each tool expands how much of the state space you cover', 0, -330, 30, COSMOS.muted, 'sans'),
    )

    const items = [
        { x: -640, name: 'Unit Tests', scope: 'Sample points', col: COSMOS.dim, r: 96 },
        { x: -215, name: 'SMT (Z3)', scope: 'All 32-bit pairs', col: COSMOS.cyan, r: 108 },
        { x: 215, name: 'TLA+ / TLC', scope: 'All protocol states', col: COSMOS.gold, r: 124 },
        { x: 640, name: 'Lean 4', scope: 'Infinite inputs', col: COSMOS.violet, r: 140 },
    ]

    const nodes = items.map((it) =>
        group(
            nebula(it.x, 30, it.r * 2.0, `${it.col}22`),
            circle(it.r, { fill: '#111626', stroke: it.col, width: 3.5 }).at(it.x, 30).glow(10, it.col),
            txt(it.name, it.x, 26, 28, it.col, 'mono'),
            txt(it.scope, it.x, 235, 26, COSMOS.muted, 'sans'),
        ),
    )

    s.add(header, nodes[0]!)
    c.show('proves the overflow', [line([-540, 30], [-327, 30], { stroke: '#26304a', width: 2.5 }), nodes[1]!])
    c.show('exhaustively explores', [line([-103, 30], [87, 30], { stroke: '#26304a', width: 2.5 }), nodes[2]!])
    c.show('Proof assistants', [line([343, 30], [496, 30], { stroke: '#26304a', width: 2.5 }), nodes[3]!])
}

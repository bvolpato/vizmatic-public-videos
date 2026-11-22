import { Node, dynamic, group, rect, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

export const tiles: SceneFunction = (s, c) => {
    const step = s.value(0) // 0 -> 3: moves tiles 1, 2, 3 from input list into reversed accumulator

    const header = group(
        txt('PROOFS FOR REAL SYSTEMS  ·  EP 3 / 3', -840, -400, 26, COSMOS.violet, 'mono', 'left'),
        txt('Lean 4: The Shape of a Proof', -848, -328, 66, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.violet),
    )

    const ITEMS = [
        { val: '1', col: COSMOS.gold },
        { val: '2', col: COSMOS.cyan },
        { val: '3', col: COSMOS.violet },
    ]

    const liveTiles = dynamic(() => {
        const st = step.value
        const nodes: Node[] = [
            nebula(-380, 20, 300, '#ffd16618'),
            nebula(380, 20, 300, '#a78bfa1e'),
            txt('Input list', -420, -145, 32, COSMOS.muted, 'serif'),
            txt('Accumulator', 420, -145, 32, COSMOS.gold, 'serif'),
        ]
        ITEMS.forEach((item, i) => {
            const p = Math.max(0, Math.min(1, st - i))
            const startX = -560 + i * 140
            const endX = 560 - i * 140
            const x = startX + (endX - startX) * p
            const y = 20 - Math.sin(p * Math.PI) * 140
            nodes.push(
                rect(108, 108, { fill: '#12182b', stroke: item.col, width: 4, radius: 16 }).at(x, y).glow(10, item.col),
                txt(item.val, x, y, 48, item.col, 'mono'),
            )
        })
        nodes.push(
            txt('theorem revAux_eq : ∀ xs, revAux xs [] = xs.reverse', 0, 320, 30, COSMOS.cyan, 'mono'),
        )
        return group(...nodes)
    })

    s.add(header, liveTiles)
    c.on('moving each head', () => s.play(step.to(3, { duration: 4.2 })))
}

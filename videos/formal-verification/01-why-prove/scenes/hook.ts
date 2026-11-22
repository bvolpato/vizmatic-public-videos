import { Node, dot, dynamic, group, line, polygon, type SceneFunction, type Vec } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

// Exact geometric plane of valid 32-bit pairs 0 <= low <= high < 2^31.
// Safe triangle: low + high < 2^31 (half of valid area!). Overflow triangle: low + high >= 2^31 (the other half!).
const OX = 80
const OY = 270
const S = 540
const SAFE_POLY: Vec[] = [[OX, OY], [OX + S / 2, OY - S / 2], [OX, OY - S]]
const OVERFLOW_POLY: Vec[] = [[OX, OY - S], [OX + S / 2, OY - S / 2], [OX + S, OY - S]]

export const hook: SceneFunction = (s, c) => {
    const revealBug = s.value(0)

    const leftCopy = group(
        txt('PROOFS FOR REAL SYSTEMS  ·  EP 1 / 3', -840, -250, 26, COSMOS.violet, 'mono', 'left'),
        txt('Why Tests', -848, -125, 108, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.violet),
        txt('Miss the Bug', -848, -8, 108, COSMOS.rose, 'serif', 'left').glow(8, COSMOS.rose),
        txt('mid = (low + high) / 2', -840, 118, 34, COSMOS.gold, 'mono', 'left'),
        txt('50% of valid 32-bit pairs overflow', -840, 186, 30, COSMOS.muted, 'sans', 'left'),
    )

    const livePlane = dynamic(() => {
        const b = revealBug.value
        const nodes: Node[] = [
            nebula(OX + S * 0.5, OY - S * 0.5, 420, b > 0.3 ? '#ff6b8b24' : '#6ee7b71a'),
            polygon(SAFE_POLY, { fill: '#122826', stroke: COSMOS.emerald, width: 2 }).opacity(0.85),
            line([OX, OY], [OX + S + 30, OY], { stroke: COSMOS.rule, width: 2 }),
            line([OX, OY], [OX, OY - S - 30], { stroke: COSMOS.rule, width: 2 }),
            txt('low', OX + S + 45, OY, 26, COSMOS.muted, 'mono', 'left'),
            txt('high', OX, OY - S - 52, 26, COSMOS.muted, 'mono'),
            // Tiny green unit-test dots clustered in the bottom-left corner
            ...[0.02, 0.04, 0.07, 0.03, 0.09, 0.05].map((u, i) =>
                dot(5.5, COSMOS.emerald).at(OX + u * S * 0.7, OY - (u + 0.03 + i * 0.015) * S).glow(8, COSMOS.emerald),
            ),
            txt('unit tests', OX + 95, OY - 26, 26, COSMOS.emerald, 'mono', 'left'),
        ]
        if (b > 0.02) {
            nodes.push(
                polygon(OVERFLOW_POLY, { fill: '#ff6b8b', stroke: COSMOS.rose, width: 3 }).opacity(0.32 * b).glow(10, COSMOS.rose),
                txt('OVERFLOW (50%)', OX + S * 0.55, OY - S * 0.82, 30, COSMOS.rose, 'mono').opacity(b),
            )
        }
        return group(...nodes)
    })

    s.add(leftCopy, livePlane)
    c.on('half of all valid', () => s.play(revealBug.to(1, { duration: 1.4 })))
}

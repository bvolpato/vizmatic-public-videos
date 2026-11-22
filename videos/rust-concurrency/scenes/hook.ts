import { Node, circle, dot, dynamic, group, line, polyPath, regularPolygon, type SceneFunction, type Vec } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const hook: SceneFunction = (s, c) => {
    const collide = s.value(0)
    const shield = s.value(0)

    const liveAnim = dynamic(() => {
        const u = Math.min(1, collide.value)
        const sh = shield.value
        const leftX = -760 + u * 660
        const rightX = 760 - u * 660
        const trailL: Vec[] = [[-760, 0], [leftX, 0]]
        const trailR: Vec[] = [[760, 0], [rightX, 0]]
        const nodes: Node[] = [
            nebula(0, 0, 420, sh > 0.2 ? '#6ee7b726' : '#ff6b8b26'),
            new Node(polyPath(trailL)).stroke(COSMOS.blue, 5, 0.9).glow(9, COSMOS.blue),
            new Node(polyPath(trailR)).stroke(COSMOS.rose, 5, 0.9).glow(9, COSMOS.rose),
            dot(11, COSMOS.blue).at(leftX, 0).glow(14, COSMOS.blue),
            dot(11, COSMOS.rose).at(rightX, 0).glow(14, COSMOS.rose),
            circle(82, { fill: '#121624', stroke: sh > 0.2 ? COSMOS.emerald : COSMOS.rose, width: 4 }).at(0, 0).glow(12, sh > 0.2 ? COSMOS.emerald : COSMOS.rose),
            txt('0x7ff8', 0, 0, 28, COSMOS.ink, 'mono'),
        ]
        if (sh > 0.05) {
            nodes.push(
                regularPolygon(6, 155, { fill: null, stroke: COSMOS.gold, width: 4 }).at(0, 0).opacity(sh).glow(12, COSMOS.gold),
                circle(200 + (1 - sh) * 60, { fill: null, stroke: COSMOS.emerald, width: 2.5 }).at(0, 0).opacity(sh * 0.7),
            )
        }
        return group(...nodes)
    })

    const topHeadline = group(
        txt('ZERO DATA RACES AT COMPILE TIME', 0, -370, 28, COSMOS.gold, 'mono'),
        txt('One rule prevents the entire bug class', 0, -295, 64, COSMOS.ink, 'serif').glow(5, COSMOS.blue),
    )

    const ruleWhisper = group(
        txt('&T   &T   &T', -440, 290, 48, COSMOS.cyan, 'mono').glow(7, COSMOS.cyan),
        txt('Many shared readers', -440, 355, 28, COSMOS.muted, 'sans'),
        txt('OR', 0, 295, 42, COSMOS.gold, 'mono'),
        txt('&mut T', 440, 290, 48, COSMOS.amber, 'mono').glow(7, COSMOS.amber),
        txt('One exclusive writer', 440, 355, 28, COSMOS.muted, 'sans'),
    )

    s.add(liveAnim, topHeadline)
    c.at(0.1, () => s.play(collide.to(0.86, { duration: 2.8 })))
    c.on('eliminates the entire class', () => s.play(shield.to(1, { duration: 0.7 })))
    c.show('many shared readers', ruleWhisper)
}

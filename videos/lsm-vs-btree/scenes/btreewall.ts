import {
    Node, circle, dot, dynamic, group, line, linear, radialGradient, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const ROOT_POS: Vec = [0, -255]
const INTERNAL_POS: readonly Vec[] = [
    [-440, -65],
    [0, -65],
    [440, -65],
]
const LEAF_POS: readonly Vec[] = [
    [-725, 145],
    [-435, 145],
    [-145, 145],
    [145, 145],
    [435, 145],
    [725, 145],
]

// Parent index for each of the 6 leaves
const LEAF_PARENT = [0, 0, 1, 1, 2, 2] as const
const CHURN_ORDER = [3, 0, 5, 2, 4, 1, 3, 5, 0, 4, 2, 1] as const

export const btreewall: SceneFunction = (s, c) => {
    const walkProg = s.value(0)
    const dirtyLeaf = s.value(0)
    const churnProg = s.value(0)

    const liveBTree = dynamic(() => {
        const wp = walkProg.value
        const dl = dirtyLeaf.value
        const cp = churnProg.value

        const activeChurnStep = Math.floor(cp * CHURN_ORDER.length)
        const waVal = cp > 0.05 ? (16 + cp * 12.8).toFixed(1) : dl > 0.2 ? '16.0' : '1.0'

        const nodes: Node[] = [
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, cp > 0.1 ? '#ff6b8b26' : '#5ce1e618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, 20),
            txt('B-TREE IN-PLACE LEAF MUTATIONS', 0, -395, 26, '#5ce1e6', 'mono'),
        ]

        // Tree edges: Root -> Internal -> Leaves
        for (let i = 0; i < INTERNAL_POS.length; i++) {
            const p = INTERNAL_POS[i]!
            const isHeroPath = i === 1 && wp > 0.05
            nodes.push(
                line(ROOT_POS, p, {
                    stroke: isHeroPath ? '#ffd166' : '#35466d',
                    width: isHeroPath ? 4.2 : 2.2,
                    opacity: isHeroPath ? 0.95 : 0.65,
                }).glow(isHeroPath ? 8 : 0, '#ffd166'),
            )
        }
        for (let i = 0; i < LEAF_POS.length; i++) {
            const leaf = LEAF_POS[i]!
            const parent = INTERNAL_POS[LEAF_PARENT[i]!]!
            const isHeroLeaf = i === 3 && wp > 0.45
            const isChurnHot = cp > 0.05 && CHURN_ORDER[activeChurnStep % CHURN_ORDER.length] === i
            const col = isChurnHot ? '#ff6b8b' : isHeroLeaf ? '#ffd166' : '#35466d'
            nodes.push(
                line(parent, leaf, {
                    stroke: col,
                    width: isChurnHot || isHeroLeaf ? 4 : 2,
                    opacity: isChurnHot || isHeroLeaf ? 0.95 : 0.58,
                }).glow(isChurnHot || isHeroLeaf ? 8 : 0, col),
            )
        }

        // Single descending update photon on Beat 0 (Root -> Internal #1 -> Leaf #3)
        if (wp > 0.02 && wp < 0.99 && cp < 0.05) {
            let px = ROOT_POS[0]
            let py = ROOT_POS[1]
            if (wp < 0.5) {
                const u = wp * 2
                px = ROOT_POS[0] + (INTERNAL_POS[1]![0] - ROOT_POS[0]) * u
                py = ROOT_POS[1] + (INTERNAL_POS[1]![1] - ROOT_POS[1]) * u
            } else {
                const u = (wp - 0.5) * 2
                px = INTERNAL_POS[1]![0] + (LEAF_POS[3]![0] - INTERNAL_POS[1]![0]) * u
                py = INTERNAL_POS[1]![1] + (LEAF_POS[3]![1] - INTERNAL_POS[1]![1]) * u
            }
            nodes.push(dot(9, '#ffd166').at(px, py).glow(16, '#ffd166'))
        }

        // Root node
        nodes.push(
            rect(340, 68, { fill: '#101a33', stroke: '#5ce1e6', width: 3.4, radius: 12 }).at(ROOT_POS[0], ROOT_POS[1]).glow(10, '#5ce1e6'),
            txt('ROOT [ 30 | 70 ]', ROOT_POS[0], ROOT_POS[1] + 2, 28, '#f8f4ec', 'mono'),
        )

        // Internal nodes
        const internalLabels = ['[ 10 | 20 ]', '[ 45 | 60 ]', '[ 80 | 95 ]']
        for (let i = 0; i < INTERNAL_POS.length; i++) {
            const p = INTERNAL_POS[i]!
            const lit = i === 1 && wp > 0.45
            nodes.push(
                rect(240, 62, { fill: '#101a33', stroke: lit ? '#ffd166' : '#5ce1e6', width: lit ? 3.5 : 2.5, radius: 10 }).at(p[0], p[1]).glow(lit ? 10 : 6, lit ? '#ffd166' : '#5ce1e6'),
                txt(internalLabels[i]!, p[0], p[1] + 2, 26, lit ? '#ffd166' : '#cbd5e8', 'mono'),
            )
        }

        // 6 scattered 16 KB Leaf Pages
        for (let i = 0; i < LEAF_POS.length; i++) {
            const p = LEAF_POS[i]!
            const isHeroDirty = i === 3 && dl > 0.1
            const churnDirty = cp > 0.05 && CHURN_ORDER.slice(0, activeChurnStep + 1).includes(i as (typeof CHURN_ORDER)[number])
            const dirty = isHeroDirty || churnDirty
            const col = dirty ? '#ff6b8b' : '#5ce1e6'
            nodes.push(
                rect(252, 88, { fill: dirty ? '#3b1123' : '#0f1c32', stroke: col, width: dirty ? 3.8 : 2.4, radius: 10 })
                    .at(p[0], p[1])
                    .glow(dirty ? 12 : 5, col),
                txt('16 KB LEAF', p[0], p[1] - 15, 26, col, 'mono'),
                txt(dirty ? 'DIRTY PAGE' : 'CLEAN PAGE', p[0], p[1] + 20, 26, dirty ? '#ffd166' : '#8b99b8', 'mono'),
            )
            // Tiny 100 B mutated bar along the top edge of Leaf #3!
            if (isHeroDirty) {
                nodes.push(
                    rect(34, 10, { fill: '#ffd166', stroke: '#ffffff', width: 1.5, radius: 3 }).at(p[0] - 86, p[1] - 44).glow(10, '#ffd166'),
                )
            }
        }

        // Bottom flash erase-block wall meter
        nodes.push(
            line([-780, 255], [780, 255], { stroke: '#2c3a5e', width: 2.2 }),
            txt('100 B record update  →  16,384 B leaf rewrite  →  scattered 4 MB erase blocks', 0, 308, 28, '#cbd5e8', 'sans'),
            txt(`Effective SSD Write Amplification:  ${waVal}×`, 0, 368, 34, cp > 0.1 || dl > 0.2 ? '#ff6b8b' : '#5ce1e6', 'mono').glow(8, cp > 0.1 || dl > 0.2 ? '#ff6b8b' : '#5ce1e6'),
        )
        return group(...nodes)
    })

    s.add(liveBTree)
    c.at(0.15, () => s.play(walkProg.to(1, { duration: 4.5, ease: linear })))
    c.on('marks the whole page', () => s.play(dirtyLeaf.to(1, { duration: 0.6 })))
    c.on('millions of random keys', () => s.play(churnProg.to(1, { duration: 8.2, ease: linear })))
}

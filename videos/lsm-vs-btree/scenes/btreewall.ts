import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, radialGradient, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// Raised slightly so a dedicated miniature "4 MB SSD Erase Blocks" physical strip fits cleanly below the 6 leaves!
const ROOT_POS: Vec = [0, -305]
const INTERNAL_POS: readonly Vec[] = [
    [-440, -142],
    [0, -142],
    [440, -142],
]
const LEAF_POS: readonly Vec[] = [
    [-725, 36],
    [-435, 36],
    [-145, 36],
    [145, 36],
    [435, 36],
    [725, 36],
]

// Parent index for each of the 6 leaves
const LEAF_PARENT = [0, 0, 1, 1, 2, 2] as const
const CHURN_ORDER = [3, 0, 5, 2, 4, 1, 3, 5, 0, 4, 2, 1] as const

// Map each logical B-Tree leaf to one of 3 scattered physical 4 MB SSD Erase Blocks!
const LEAF_TO_PHYS_BLOCK = [0, 2, 1, 1, 0, 2] as const
const PHYS_BLOCKS = [
    { name: '4 MB ERASE BLOCK #0', x: -530, y: 245 },
    { name: '4 MB ERASE BLOCK #1', x: 0, y: 245 },
    { name: '4 MB ERASE BLOCK #2', x: 530, y: 245 },
] as const

function quadPt(p0: Vec, p1: Vec, p2: Vec, t: number): Vec {
    const u = 1 - t
    return [
        u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
        u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]
}

export const btreewall: SceneFunction = (s, c) => {
    const walkProg = s.value(0)
    const dirtyLeaf = s.value(0)
    const churnProg = s.value(0)
    const sparkLoop = s.value(0)

    const liveBTree = dynamic(() => {
        const wp = walkProg.value
        const dl = dirtyLeaf.value
        const cp = churnProg.value
        const sl = sparkLoop.value

        const activeChurnStep = Math.floor(cp * CHURN_ORDER.length)
        // Ensure at least 3 distinct dirty leaves are active quickly once churn begins so all 3 erase blocks light up!
        const dirtySet = new Set<number>()
        if (dl > 0.1) dirtySet.add(3)
        if (cp > 0.02) {
            const count = Math.min(CHURN_ORDER.length, activeChurnStep + 3)
            for (let k = 0; k < count; k++) dirtySet.add(CHURN_ORDER[k]!)
        }

        const waVal = cp > 0.05 ? (16 + cp * 12.8).toFixed(1) : dl > 0.2 ? '16.0' : '1.0'

        const nodes: Node[] = [
            circle(540, {
                fill: radialGradient([0, 0], 540, [
                    [0, cp > 0.08 ? '#ff6b8b28' : '#5ce1e61a'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, 10),
            txt('B-TREE IN-PLACE LEAF MUTATIONS', 0, -405, 26, '#5ce1e6', 'mono'),
        ]

        // Brightened inactive tree edges + glowing active paths
        for (let i = 0; i < INTERNAL_POS.length; i++) {
            const p = INTERNAL_POS[i]!
            const isHeroPath = i === 1 && wp > 0.05
            const isChurnActive = cp > 0.02 && LEAF_PARENT[CHURN_ORDER[activeChurnStep % CHURN_ORDER.length]!] === i
            const col = isChurnActive ? '#ff6b8b' : isHeroPath ? '#ffd166' : '#5670a6'
            const lit = isHeroPath || isChurnActive
            nodes.push(
                line(ROOT_POS, p, {
                    stroke: col,
                    width: lit ? 4.4 : 2.5,
                    opacity: lit ? 0.96 : 0.78,
                })
                    .glow(lit ? 10 : 0, col)
                    .set('blend', lit ? 'screen' : 'normal'),
            )
        }
        for (let i = 0; i < LEAF_POS.length; i++) {
            const leaf = LEAF_POS[i]!
            const parent = INTERNAL_POS[LEAF_PARENT[i]!]!
            const isHeroLeaf = i === 3 && wp > 0.45
            const isChurnHot = cp > 0.02 && CHURN_ORDER[activeChurnStep % CHURN_ORDER.length] === i
            const col = isChurnHot ? '#ff6b8b' : isHeroLeaf ? '#ffd166' : '#5670a6'
            const lit = isChurnHot || isHeroLeaf
            nodes.push(
                line(parent, leaf, {
                    stroke: col,
                    width: lit ? 4.2 : 2.4,
                    opacity: lit ? 0.96 : 0.74,
                })
                    .glow(lit ? 10 : 0, col)
                    .set('blend', lit ? 'screen' : 'normal'),
            )
        }

        // Crisp circular glowing write-packet beads with trailing sparks drawn BEFORE node boxes so they never cross box text!
        const drawTravelingBead = (a: Vec, b: Vec, u: number, col: string) => {
            const px = a[0] + (b[0] - a[0]) * u
            const py = a[1] + (b[1] - a[1]) * u
            for (let sIdx = 1; sIdx <= 4; sIdx++) {
                const su = Math.max(0, u - sIdx * 0.055)
                const sx = a[0] + (b[0] - a[0]) * su
                const sy = a[1] + (b[1] - a[1]) * su
                nodes.push(
                    dot(6.5 - sIdx * 1.1, col).at(sx, sy).opacity(0.75 - sIdx * 0.14).glow(10, col).set('blend', 'screen'),
                )
            }
            nodes.push(
                circle(13, { fill: `${col}55`, stroke: col, width: 2.2 }).at(px, py).glow(14, col).set('blend', 'screen'),
                dot(6, '#ffffff').at(px, py).glow(12, '#ffffff').set('blend', 'screen'),
            )
        }

        if (wp > 0.02 && wp < 0.99 && cp < 0.02) {
            if (wp < 0.5) drawTravelingBead(ROOT_POS, INTERNAL_POS[1]!, wp * 2, '#ffd166')
            else drawTravelingBead(INTERNAL_POS[1]!, LEAF_POS[3]!, (wp - 0.5) * 2, '#ffd166')
        } else if (cp >= 0.02) {
            for (let k = 0; k < 2; k++) {
                const targetLeafIdx = CHURN_ORDER[(activeChurnStep + k) % CHURN_ORDER.length]!
                const parentIdx = LEAF_PARENT[targetLeafIdx]!
                const u = (sl * 1.25 + k * 0.48) % 1
                if (u < 0.45) drawTravelingBead(ROOT_POS, INTERNAL_POS[parentIdx]!, u / 0.45, k === 0 ? '#ffd166' : '#ff6b8b')
                else drawTravelingBead(INTERNAL_POS[parentIdx]!, LEAF_POS[targetLeafIdx]!, (u - 0.45) / 0.55, k === 0 ? '#ffd166' : '#ff6b8b')
            }
        }

        // Root node
        nodes.push(
            rect(340, 64, { fill: '#101a33', stroke: '#5ce1e6', width: 3.4, radius: 12 }).at(ROOT_POS[0], ROOT_POS[1]).glow(10, '#5ce1e6'),
            txt('ROOT [ 30 | 70 ]', ROOT_POS[0], ROOT_POS[1] + 2, 28, '#f8f4ec', 'mono'),
        )

        // Internal nodes
        const internalLabels = ['[ 10 | 20 ]', '[ 45 | 60 ]', '[ 80 | 95 ]']
        for (let i = 0; i < INTERNAL_POS.length; i++) {
            const p = INTERNAL_POS[i]!
            const lit = (i === 1 && wp > 0.45) || (cp > 0.02 && LEAF_PARENT[CHURN_ORDER[activeChurnStep % CHURN_ORDER.length]!] === i)
            const col = cp > 0.02 && lit ? '#ff6b8b' : lit ? '#ffd166' : '#5ce1e6'
            nodes.push(
                rect(240, 58, { fill: '#101a33', stroke: col, width: lit ? 3.5 : 2.6, radius: 10 }).at(p[0], p[1]).glow(lit ? 10 : 6, col),
                txt(internalLabels[i]!, p[0], p[1] + 2, 26, lit ? col : '#d2dcf0', 'mono'),
            )
        }

        // 6 scattered 16 KB Leaf Pages (radial impact burst halo drawn BEHIND the opaque leaf box so text is razor-clean!)
        for (let i = 0; i < LEAF_POS.length; i++) {
            const p = LEAF_POS[i]!
            const dirty = dirtySet.has(i)
            const isHeroTarget = i === 3 && dl > 0.1
            const isChurnTarget = cp > 0.02 && CHURN_ORDER[activeChurnStep % CHURN_ORDER.length] === i
            const col = dirty ? '#ff6b8b' : '#5ce1e6'
            if (isChurnTarget || (isHeroTarget && cp < 0.05)) {
                const bp = (sl * 1.6) % 1
                const burstR = 46 + bp * 42
                nodes.push(
                    circle(burstR, { fill: '#ffd16622', stroke: '#ffd166', width: 2.8 })
                        .at(p[0], p[1])
                        .opacity((1 - bp) * 0.9)
                        .glow(12, '#ffd166')
                        .set('blend', 'screen'),
                )
            }
            nodes.push(
                rect(252, 86, { fill: dirty ? '#3b1123' : '#10203a', stroke: col, width: dirty ? 3.8 : 2.5, radius: 10 })
                    .at(p[0], p[1])
                    .glow(dirty ? 12 : 6, col),
                txt('16 KB LEAF', p[0], p[1] - 15, 26, col, 'mono'),
                txt(dirty ? 'DIRTY PAGE' : 'CLEAN PAGE', p[0], p[1] + 19, 26, dirty ? '#ffd166' : '#9fb1d4', 'mono'),
            )
        }

        // Miniature "4 MB SSD Erase Blocks" physical strip beneath the 6 leaves showing scattered physical writes!
        nodes.push(
            line([-820, 128], [820, 128], { stroke: '#2c3d66', width: 1.8, dash: [8, 10], opacity: 0.7 }),
        )

        // Count dirty leaves landing in each physical erase block + draw glowing curved scatter lines FIRST
        const blockDirtyPages: [number[], number[], number[]] = [[], [], []]
        for (const leafIdx of dirtySet) {
            const bIdx = LEAF_TO_PHYS_BLOCK[leafIdx]!
            blockDirtyPages[bIdx]!.push(leafIdx)
            const lp = LEAF_POS[leafIdx]!
            const pb = PHYS_BLOCKS[bIdx]!
            const p0: Vec = [lp[0], lp[1] + 45]
            const p2: Vec = [pb.x + (leafIdx % 2 === 0 ? -42 : 42), pb.y - 42]
            const p1: Vec = [(p0[0] + p2[0]) * 0.5, 148]
            const curvePts = Array.from({ length: 18 }, (_, k) => quadPt(p0, p1, p2, k / 17))
            const beadT = (sl * 0.95 + leafIdx * 0.19) % 1
            const [bx, by] = quadPt(p0, p1, p2, beadT)
            nodes.push(
                new Node(polyPath(curvePts)).stroke('#ff6b8b', 2.4, 0.72).glow(8, '#ff6b8b').set('blend', 'screen'),
                dot(5.2, '#ffd166').at(bx, by).glow(10, '#ffd166').set('blend', 'screen'),
            )
        }

        // Opaque dark pill banner drawn AFTER scatter curves so curves pass cleanly behind the caption!
        nodes.push(
            rect(1340, 40, { fill: '#0b1020', stroke: '#fb923c', width: 1.8, radius: 20 }).at(0, 158),
            txt('PHYSICAL NVME FLASH  ·  3 DIRTY LEAVES SCATTER ACROSS 3 SEPARATE 4 MB ERASE BLOCKS', 0, 160, 26, '#fb923c', 'mono'),
        )

        // Render the 3 miniature physical 4 MB SSD Erase Blocks
        for (let bIdx = 0; bIdx < PHYS_BLOCKS.length; bIdx++) {
            const pb = PHYS_BLOCKS[bIdx]!
            const hits = blockDirtyPages[bIdx]!.length
            const hot = hits > 0
            nodes.push(
                rect(468, 86, {
                    fill: hot ? '#1f1022' : '#0e172c',
                    stroke: hot ? '#ff6b8b' : '#3a4f7c',
                    width: hot ? 3.0 : 2.0,
                    radius: 12,
                })
                    .at(pb.x, pb.y)
                    .glow(hot ? 10 : 0, '#ff6b8b'),
                txt(pb.name, pb.x, pb.y - 22, 26, hot ? '#ff9bb3' : '#8ea2c8', 'mono'),
            )
            // 10 mini page slots inside each 4 MB erase block showing scattered crimson dirty pages
            for (let slot = 0; slot < 10; slot++) {
                const sx = pb.x - 198 + slot * 44
                const sy = pb.y + 18
                const isSlotDirty = hot && ((slot === 2 && hits >= 1) || (slot === 7 && hits >= 1) || (slot === 5 && hits >= 2))
                nodes.push(
                    rect(34, 22, {
                        fill: isSlotDirty ? '#ff6b8b' : '#182b4a',
                        stroke: isSlotDirty ? '#ffd166' : '#3b5682',
                        width: isSlotDirty ? 2.0 : 1.2,
                        radius: 4,
                    })
                        .at(sx, sy)
                        .glow(isSlotDirty ? 8 : 0, '#ff6b8b'),
                )
            }
        }

        // Bottom Write Amplification readout
        nodes.push(
            txt(`Effective SSD Write Amplification:  ${waVal}×`, 0, 355, 34, cp > 0.05 || dl > 0.2 ? '#ff6b8b' : '#5ce1e6', 'mono')
                .glow(10, cp > 0.05 || dl > 0.2 ? '#ff6b8b' : '#5ce1e6'),
        )
        return group(...nodes)
    })

    s.add(liveBTree)
    const sceneRem = Math.max(8.0, c.end - c.start - 0.25)
    c.at(0.15, () => {
        s.play(
            walkProg.to(1, { duration: 4.5, ease: linear }),
            sparkLoop.to(12.0, { duration: Math.min(22.5, sceneRem), ease: linear }),
        )
    })
    c.on('marks the whole page', () => s.play(dirtyLeaf.to(1, { duration: 0.6 })))
    const churnRem = Math.max(3.0, c.end - c.cue('millions of random keys').start - 0.15)
    c.on('millions of random keys', () => s.play(churnProg.to(1, { duration: Math.min(8.2, churnRem), ease: linear })))
}

import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, radialGradient,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// 5-node constellation centered on right half so viral headline shines on the left
const CX = 340
const CY = 5
const CLUSTER: readonly { readonly name: string; readonly pos: Vec; readonly side: 'L' | 'R' }[] = [
    { name: 'S1', pos: [CX - 255, CY - 135], side: 'L' },
    { name: 'S2', pos: [CX - 235, CY + 145], side: 'L' },
    { name: 'S3', pos: [CX + 140, CY - 175], side: 'R' },
    { name: 'S4', pos: [CX + 305, CY + 10], side: 'R' },
    { name: 'S5', pos: [CX + 135, CY + 185], side: 'R' },
]

// Jagged crimson lightning partition wall slicing between {S1, S2} and {S3, S4, S5}
const WALL_X = CX - 65
const BOLT_PTS: Vec[] = [
    [WALL_X + 6, -345],
    [WALL_X - 18, -245],
    [WALL_X + 16, -150],
    [WALL_X - 22, -55],
    [WALL_X + 20, 45],
    [WALL_X - 16, 145],
    [WALL_X + 14, 245],
    [WALL_X - 8, 345],
]

export const hook: SceneFunction = (s, c) => {
    const pulse = s.value(0)
    const wallVis = s.value(0)
    const dualLeader = s.value(0)
    const extinguish = s.value(0)

    const leftCopy = group(
        txt('5 NODES  ·  1 QUORUM', -840, -185, 28, '#ffd166', 'mono', 'left').glow(6, '#ffd166'),
        txt('Raft Consensus', -848, -55, 98, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('& Split-Brain', -848, 60, 102, '#5ce1e6', 'serif', 'left').glow(8, '#38bdf8'),
        txt('Two leaders claim the crown —', -840, 185, 32, '#cbd5e8', 'sans', 'left'),
        txt('only strict majority math survives', -840, 232, 32, '#ffd166', 'sans', 'left'),
    )

    const liveCluster = dynamic(() => {
        const t = pulse.value
        const w = wallVis.value
        const dual = dualLeader.value
        const ext = extinguish.value

        const nodes: Node[] = [
            circle(490, {
                fill: radialGradient([0, 0], 490, [
                    [0, w > 0.3 && ext < 0.5 ? '#ff6b8b24' : '#ffd16624'],
                    [0.5, '#5ce1e612'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY),
        ]

        // Edges: cross-partition links fade & snap when the wall drops
        for (let i = 0; i < CLUSTER.length; i++) {
            for (let j = i + 1; j < CLUSTER.length; j++) {
                const a = CLUSTER[i]!
                const b = CLUSTER[j]!
                const crosses = a.side !== b.side
                const op = crosses ? Math.max(0.04, (1 - w) * 0.45) : 0.48
                const col = !crosses && a.side === 'R' && dual > 0.3 ? '#ffd166' : '#4a5c8a'
                nodes.push(
                    line(a.pos, b.pos, {
                        stroke: col,
                        width: !crosses && a.side === 'R' && dual > 0.3 ? 2.6 : 1.6,
                        dash: crosses && w > 0.2 ? [6, 10] : undefined,
                        opacity: op,
                    }),
                )
            }
        }

        // Leader S1 pulse (healthy before split -> stale rose during split -> extinguished!)
        const s1 = CLUSTER[0]!
        const s1Alive = 1 - ext
        if (s1Alive > 0.05) {
            const p1 = (t * 0.85) % 1
            const s1Col = w > 0.3 ? '#ff6b8b' : '#ffd166'
            nodes.push(
                circle(44 + p1 * 160, { fill: null, stroke: s1Col, width: 2.5 })
                    .at(s1.pos[0], s1.pos[1])
                    .opacity((1 - p1) * 0.75 * s1Alive)
                    .glow(8, s1Col),
            )
        }

        // Majority Leader S3 pulse (ignites when split-brain hits!)
        const s3 = CLUSTER[2]!
        if (dual > 0.05) {
            const p3 = (t * 0.95 + 0.4) % 1
            nodes.push(
                circle(44 + p3 * 78, { fill: null, stroke: '#ffd166', width: 3 })
                    .at(s3.pos[0], s3.pos[1])
                    .opacity((1 - p3) * 0.85 * dual)
                    .glow(12, '#ffd166'),
            )
        }

        // Partition crimson lightning wall
        if (w > 0.02) {
            const jitter = Math.sin(t * 28) * 5
            const bolt: Vec[] = BOLT_PTS.map(([bx, by], idx) => [
                bx + (idx % 2 === 0 ? jitter : -jitter),
                by,
            ])
            nodes.push(
                new Node(polyPath(bolt)).stroke('#ff6b8b', 7, 0.92 * w).glow(16, '#ff6b8b'),
                new Node(polyPath(bolt)).stroke('#ffffff', 2.2, 0.85 * w),
                txt('PARTITION', WALL_X, -385, 28, '#ff6b8b', 'mono').opacity(w).glow(8, '#ff6b8b'),
            )
        }

        // Five cluster nodes
        for (const n of CLUSTER) {
            let strokeCol = '#5ce1e6'
            let rad = 40
            let glowCol = '#5ce1e6'
            if (n.name === 'S1') {
                if (ext > 0.5) {
                    strokeCol = '#6e7c9e'
                    glowCol = '#6e7c9e'
                    rad = 38
                } else if (w > 0.3) {
                    strokeCol = '#ff6b8b'
                    glowCol = '#ff6b8b'
                    rad = 46
                } else {
                    strokeCol = '#ffd166'
                    glowCol = '#ffd166'
                    rad = 48
                }
            } else if (n.name === 'S3' && dual > 0.3) {
                strokeCol = '#ffd166'
                glowCol = '#ffd166'
                rad = 50
            }
            nodes.push(
                circle(rad, { fill: '#0e1529', stroke: strokeCol, width: rad > 44 ? 4.5 : 3.2 }).at(n.pos[0], n.pos[1]).glow(rad > 44 ? 14 : 8, glowCol),
                txt(n.name, n.pos[0], n.pos[1] + 2, 28, strokeCol, 'mono'),
            )
        }

        // Minority / Majority status badges
        if (dual > 0.05) {
            nodes.push(
                txt(ext > 0.5 ? 'STALE · 2/5 BLOCKED' : 'MINORITY · 2/5', CX - 245, 285, 28, '#ff6b8b', 'mono').opacity(dual),
                txt('MAJORITY · 3/5', CX + 195, 285, 28, '#ffd166', 'mono').opacity(dual).glow(8, '#ffd166'),
            )
        }

        // Extinguishing ring over stale S1 (keeps "S1" text crisp and uncrossed!)
        if (ext > 0.05) {
            nodes.push(
                circle(58, { fill: null, stroke: '#ff6b8b', width: 3.5, dash: [10, 10] }).at(s1.pos[0], s1.pos[1]).opacity(ext).glow(10, '#ff6b8b'),
                txt('STEPPED DOWN', s1.pos[0], s1.pos[1] - 92, 26, '#ff6b8b', 'mono').opacity(ext).glow(6, '#ff6b8b'),
                dot(10, '#ffd166').at(s3.pos[0], s3.pos[1] - 102).opacity(ext).glow(14, '#ffd166'),
                txt('QUORUM LEADER', s3.pos[0], s3.pos[1] - 148, 26, '#ffd166', 'mono').opacity(ext).glow(8, '#ffd166'),
            )
        }
        return group(...nodes)
    })

    s.add(liveCluster, leftCopy)
    c.at(0.05, () => s.play(pulse.to(9.5, { duration: 15.8, ease: linear })))
    c.on('network cable snaps', () => s.play(wallVis.to(1, { duration: 0.45 })))
    c.on('Two servers suddenly', () => s.play(dualLeader.to(1, { duration: 0.5 })))
    c.on('extinguishes the stale', () => s.play(extinguish.to(1, { duration: 0.6 })))
}

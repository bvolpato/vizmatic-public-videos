import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const WALL_X = -115
const WALL_BOLT: Vec[] = [
    [WALL_X + 5, -340],
    [WALL_X - 16, -230],
    [WALL_X + 14, -120],
    [WALL_X - 18, -10],
    [WALL_X + 16, 100],
    [WALL_X - 14, 210],
    [WALL_X + 8, 325],
]

const MINORITY_ROWS = [
    { name: 'S1', y: -95 },
    { name: 'S2', y: 120 },
] as const

// Raised slightly so S5's FOLLOWER · T2 label (y = 262) has generous 100px clearance above the bottom status pill (y = 368)!
const MAJORITY_ROWS = [
    { name: 'S3', y: -195 },
    { name: 'S4', y: 0 },
    { name: 'S5', y: 195 },
] as const

const STATUS_Y = 368

export const partition: SceneFunction = (s, c) => {
    const jitter = s.value(0)
    const wallOpen = s.value(1) // 1 = partitioned, 0 = healed
    const ghostWrite = s.value(0)
    const majCommit = s.value(0)
    const healSync = s.value(0)

    const livePartition = dynamic(() => {
        const j = jitter.value
        const wall = wallOpen.value
        const ghost = ghostWrite.value
        const maj = majCommit.value
        const heal = healSync.value
        const nodes: Node[] = []

        // Top editorial status
        const topLabel =
            heal > 0.3
                ? 'PARTITION HEALED  ·  TERM 2 > TERM 1  ·  GHOST ROLLED BACK'
                : maj > 0.3
                    ? 'SPLIT-BRAIN  ·  MINORITY STALLS, MAJORITY COMMITS'
                    : 'NETWORK PARTITION  ·  CLUSTER SLICED 2 vs 3'
        const topCol = heal > 0.3 ? '#6ee7b7' : '#ffd166'
        nodes.push(txt(topLabel, 0, -405, 28, topCol, 'mono').glow(6, topCol))

        // Left side: Minority {S1, S2}
        nodes.push(
            txt(heal > 0.4 ? 'REJOINED · TERM 2' : 'MINORITY (2 / 5)', -510, -322, 28, heal > 0.4 ? '#6ee7b7' : '#ff6b8b', 'mono'),
        )

        // Incoming client write beam: SET x=9 stalled on S1!
        if (ghost > 0.05 && heal < 0.5) {
            const gVis = Math.max(0, ghost * (1 - heal * 2))
            const beamP = (j * 0.6) % 1
            const cx0 = -785
            const cy0 = -248
            const cy1 = MINORITY_ROWS[0].y - 44
            const py = cy0 + (cy1 - cy0) * beamP
            nodes.push(
                rect(318, 46, { fill: '#2c1020ee', stroke: '#ff6b8b', width: 2.4, radius: 23 }).at(cx0 + 95, cy0).opacity(gVis).glow(8, '#ff6b8b'),
                txt('SET x=9 · STALLED', cx0 + 95, cy0 + 2, 26, '#ff9bb3', 'mono').opacity(gVis),
                line([cx0, cy0 + 23], [cx0, cy1], { stroke: '#ff6b8b', width: 3.4, dash: [8, 6], opacity: 0.9 * gVis })
                    .glow(10, '#ff6b8b')
                    .set('blend', 'screen'),
                dot(7.5, '#ff6b8b').at(cx0, py).opacity(gVis).glow(14, '#ff6b8b').set('blend', 'screen'),
            )
        }

        for (let i = 0; i < MINORITY_ROWS.length; i++) {
            const row = MINORITY_ROWS[i]!
            const isStaleLeader = i === 0 && heal < 0.4
            // Brightened S2 ring & FOLLOWER · T1 label (#8ec5ff) so it reads crisply!
            const nodeCol = heal > 0.4 ? '#5ce1e6' : isStaleLeader ? '#ff6b8b' : '#8ec5ff'
            const nx = -785
            nodes.push(
                circle(40, { fill: '#0c1222', stroke: nodeCol, width: isStaleLeader ? 4.4 : 3.6 })
                    .at(nx, row.y)
                    .glow(isStaleLeader ? 14 : 10, nodeCol),
                txt(row.name, nx, row.y + 2, 28, nodeCol, 'mono'),
                txt(isStaleLeader ? 'T1 LEADER?' : heal > 0.4 ? 'FOLLOWER · T2' : 'FOLLOWER · T1', nx + 18, row.y + 68, 26, nodeCol, 'mono'),
                // Committed entry #1: [T1: x=1]
                rect(195, 62, { fill: '#112529', stroke: '#6ee7b7', width: 2.5, radius: 10 }).at(-595, row.y),
                txt('T1 · x = 1', -595, row.y + 2, 28, '#6ee7b7', 'mono'),
            )
            // Entry #2: Ghost write x=9 before heal -> overwritten by T2: x=42 after heal!
            if (ghost > 0.05 && heal < 0.55) {
                const gOp = ghost * (1 - heal * 1.7)
                nodes.push(
                    rect(244, 62, { fill: '#2c0f1d', stroke: '#ff6b8b', width: 2.8, dash: [8, 8], radius: 10 })
                        .at(-348, row.y)
                        .opacity(Math.max(0, gOp))
                        .glow(8, '#ff6b8b'),
                    txt('T1 · x = 9 ?', -348, row.y + 2, 28, '#ff6b8b', 'mono').opacity(Math.max(0, gOp)),
                )
            }
            if (heal > 0.45) {
                const hOp = Math.min(1, (heal - 0.45) / 0.4)
                nodes.push(
                    rect(244, 62, { fill: '#112925', stroke: '#6ee7b7', width: 3, radius: 10 })
                        .at(-348, row.y)
                        .opacity(hOp)
                        .glow(10, '#6ee7b7'),
                    txt('T2 · x = 42', -348, row.y + 2, 28, '#6ee7b7', 'mono').opacity(hOp),
                )
            }
        }

        // Left status badge aligned identically on STATUS_Y = 368!
        if (ghost > 0.2 && heal < 0.4) {
            const gOp = ghost * (1 - heal * 2)
            nodes.push(
                rect(460, 50, { fill: '#230d18e8', stroke: '#ff6b8b', width: 2.4, radius: 25 })
                    .at(-515, STATUS_Y)
                    .opacity(gOp)
                    .glow(8, '#ff6b8b'),
                txt('2 / 5 < 3  ·  CANNOT COMMIT', -515, STATUS_Y + 2, 26, '#ff6b8b', 'mono').opacity(gOp),
            )
        }

        // Right side: Majority {S3, S4, S5}
        nodes.push(
            txt('MAJORITY (3 / 5)  ·  TERM 2', 395, -322, 28, '#ffd166', 'mono').glow(6, '#ffd166'),
        )

        // Incoming client write beam: SET x=42 committed on S3!
        if (maj > 0.05) {
            const beamP = (j * 0.72 + 0.3) % 1
            const bx0 = 760
            const by0 = -282
            const bx1 = 112
            const by1 = MAJORITY_ROWS[0].y - 24
            const mx = bx0 + (bx1 - bx0) * beamP
            const my = by0 + (by1 - by0) * beamP
            nodes.push(
                line([bx0 - 110, by0 + 22], [bx1, by1], { stroke: '#6ee7b7', width: 3.6, opacity: 0.85 * maj })
                    .glow(10, '#6ee7b7')
                    .set('blend', 'screen'),
                dot(8, '#ffd166').at(mx, my).opacity(maj).glow(14, '#ffd166').set('blend', 'screen'),
                dot(3.8, '#ffffff').at(mx, my).opacity(maj).set('blend', 'screen'),
                rect(290, 46, { fill: '#102822ee', stroke: '#6ee7b7', width: 2.4, radius: 23 })
                    .at(705, by0)
                    .opacity(maj)
                    .glow(10, '#6ee7b7'),
                txt('SET x=42 · OK ✓', 705, by0 + 2, 26, '#6ee7b7', 'mono').opacity(maj),
            )
        }

        for (let i = 0; i < MAJORITY_ROWS.length; i++) {
            const row = MAJORITY_ROWS[i]!
            const isLeader = i === 0
            const nodeCol = isLeader ? '#ffd166' : '#5ce1e6'
            const nx = 65
            nodes.push(
                circle(isLeader ? 44 : 38, { fill: '#0c1222', stroke: nodeCol, width: isLeader ? 4.5 : 3.2 })
                    .at(nx, row.y)
                    .glow(isLeader ? 14 : 8, nodeCol),
                txt(row.name, nx, row.y + 2, 28, nodeCol, 'mono'),
                txt(isLeader ? 'LEADER · T2' : 'FOLLOWER · T2', nx + 18, row.y + 66, 26, nodeCol, 'mono'),
                // Committed entry #1: [T1: x=1]
                rect(195, 62, { fill: '#112529', stroke: '#6ee7b7', width: 2.5, radius: 10 }).at(285, row.y),
                txt('T1 · x = 1', 285, row.y + 2, 28, '#6ee7b7', 'mono'),
            )
            // Entry #2: Committed [T2: x=42]
            if (maj > 0.05) {
                nodes.push(
                    rect(215, 62, { fill: '#162b26', stroke: '#ffd166', width: 3.2, radius: 10 })
                        .at(525, row.y)
                        .opacity(maj)
                        .glow(10, '#ffd166'),
                    txt('T2 · x = 42', 525, row.y + 2, 28, '#ffd166', 'mono').opacity(maj),
                    txt('✓', 665, row.y + 2, 34, '#6ee7b7', 'mono').opacity(maj).glow(8, '#6ee7b7'),
                )
            }
        }

        // Right status badge aligned cleanly with left status line on STATUS_Y = 368 — ZERO crowding under S5!
        if (maj > 0.2) {
            nodes.push(
                rect(440, 50, { fill: '#0e2820ee', stroke: '#6ee7b7', width: 2.6, radius: 25 })
                    .at(415, STATUS_Y)
                    .opacity(maj)
                    .glow(10, '#6ee7b7'),
                txt('3 / 5 ≥ 3  ·  COMMITTED!', 415, STATUS_Y + 2, 26, '#6ee7b7', 'mono').opacity(maj),
            )
        }

        // Partition lightning wall (dissolves when heal begins!)
        if (wall > 0.04) {
            const dx = Math.sin(j * 32) * 5
            const bolt: Vec[] = WALL_BOLT.map(([bx, by], idx) => [bx + (idx % 2 === 0 ? dx : -dx), by])
            nodes.push(
                new Node(polyPath(bolt)).stroke('#ff6b8b', 7.0, 0.94 * wall).glow(16, '#ff6b8b').set('blend', 'screen'),
                new Node(polyPath(bolt)).stroke('#ffffff', 2.2, 0.88 * wall).set('blend', 'screen'),
            )
        }

        // Golden AppendEntries(Term 2) healing beams crossing from S3 -> S1 and S2!
        if (heal > 0.05) {
            const p = Math.min(1, heal * 1.4)
            for (const row of MINORITY_ROWS) {
                const ex = 20 + (-740 - 20) * p
                const ey = -195 + (row.y - -195) * p
                nodes.push(
                    line([20, -195], [ex, ey], { stroke: '#ffd166', width: 3.8, opacity: 0.85 * (1 - Math.max(0, heal - 0.85) * 3) })
                        .glow(12, '#ffd166')
                        .set('blend', 'screen'),
                    dot(8.5, '#ffffff').at(ex, ey).opacity(p < 0.98 ? 1 : 0).glow(16, '#ffd166').set('blend', 'screen'),
                )
            }
            nodes.push(
                rect(380, 48, { fill: '#1b160be8', stroke: '#ffd166', width: 2.4, radius: 24 })
                    .at(-115, STATUS_Y)
                    .opacity(Math.min(1, heal * 2))
                    .glow(8, '#ffd166'),
                txt('AppendEntries(Term 2)', -115, STATUS_Y + 2, 26, '#ffd166', 'mono').opacity(Math.min(1, heal * 2)),
            )
        }

        return group(...nodes)
    })

    s.add(livePartition)
    c.at(0.05, () => s.play(jitter.to(12, { duration: 28, ease: linear })))
    c.on('x equals nine', () => s.play(ghostWrite.to(1, { duration: 0.9 })))
    c.on('three-node majority', () => s.play(majCommit.to(1, { duration: 1.1 })))
    c.on('wall heals', () => {
        s.play(wallOpen.to(0, { duration: 0.55 }))
        s.play(healSync.to(1, { duration: 2.2 }))
    })
}

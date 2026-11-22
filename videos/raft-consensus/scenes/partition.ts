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
    [WALL_X + 8, 330],
]

const MINORITY_ROWS = [
    { name: 'S1', y: -110 },
    { name: 'S2', y: 120 },
] as const

const MAJORITY_ROWS = [
    { name: 'S3', y: -200 },
    { name: 'S4', y: 20 },
    { name: 'S5', y: 240 },
] as const

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
        nodes.push(txt(topLabel, 0, -395, 28, topCol, 'mono').glow(6, topCol))

        // Left side: Minority {S1, S2}
        nodes.push(
            txt(heal > 0.4 ? 'REJOINED · TERM 2' : 'MINORITY (2 / 5)', -520, -310, 28, heal > 0.4 ? '#6ee7b7' : '#ff6b8b', 'mono'),
        )
        for (let i = 0; i < MINORITY_ROWS.length; i++) {
            const row = MINORITY_ROWS[i]!
            const isStaleLeader = i === 0 && heal < 0.4
            const nodeCol = heal > 0.4 ? '#5ce1e6' : isStaleLeader ? '#ff6b8b' : '#9aa8c4'
            const nx = -785
            nodes.push(
                circle(40, { fill: '#0e162b', stroke: nodeCol, width: isStaleLeader ? 4.2 : 3 }).at(nx, row.y).glow(isStaleLeader ? 12 : 6, nodeCol),
                txt(row.name, nx, row.y + 2, 28, nodeCol, 'mono'),
                txt(isStaleLeader ? 'T1 LEADER?' : heal > 0.4 ? 'FOLLOWER · T2' : 'FOLLOWER · T1', nx, row.y + 68, 26, nodeCol, 'mono'),
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

        if (ghost > 0.2 && heal < 0.4) {
            nodes.push(
                txt('2 / 5 < 3  ·  CANNOT COMMIT', -520, 295, 28, '#ff6b8b', 'mono').opacity(ghost * (1 - heal * 2)).glow(6, '#ff6b8b'),
            )
        }

        // Right side: Majority {S3, S4, S5}
        nodes.push(
            txt('MAJORITY (3 / 5)  ·  TERM 2', 415, -310, 28, '#ffd166', 'mono').glow(6, '#ffd166'),
        )
        for (let i = 0; i < MAJORITY_ROWS.length; i++) {
            const row = MAJORITY_ROWS[i]!
            const isLeader = i === 0
            const nodeCol = isLeader ? '#ffd166' : '#5ce1e6'
            const nx = 65
            nodes.push(
                circle(isLeader ? 44 : 38, { fill: '#0e162b', stroke: nodeCol, width: isLeader ? 4.5 : 3 }).at(nx, row.y).glow(isLeader ? 14 : 8, nodeCol),
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

        if (maj > 0.2) {
            nodes.push(
                txt('3 / 5 ≥ 3  ·  COMMITTED!', 415, 345, 28, '#6ee7b7', 'mono').opacity(maj).glow(8, '#6ee7b7'),
            )
        }

        // Partition lightning wall (dissolves when heal begins!)
        if (wall > 0.04) {
            const dx = Math.sin(j * 32) * 5
            const bolt: Vec[] = WALL_BOLT.map(([bx, by], idx) => [bx + (idx % 2 === 0 ? dx : -dx), by])
            nodes.push(
                new Node(polyPath(bolt)).stroke('#ff6b8b', 6.5, 0.92 * wall).glow(16, '#ff6b8b'),
                new Node(polyPath(bolt)).stroke('#ffffff', 2, 0.85 * wall),
            )
        }

        // Golden AppendEntries(Term 2) healing beams crossing from S3 -> S1 and S2!
        if (heal > 0.05) {
            const p = Math.min(1, heal * 1.4)
            for (const row of MINORITY_ROWS) {
                const ex = 20 + (-740 - 20) * p
                const ey = -200 + (row.y - -200) * p
                nodes.push(
                    line([20, -200], [ex, ey], { stroke: '#ffd166', width: 3.5, opacity: 0.78 * (1 - Math.max(0, heal - 0.85) * 3) }).glow(10, '#ffd166'),
                    dot(8, '#ffffff').at(ex, ey).opacity(p < 0.98 ? 1 : 0).glow(14, '#ffd166'),
                )
            }
            nodes.push(
                txt('AppendEntries(Term 2)', -115, 345, 28, '#ffd166', 'mono').opacity(Math.min(1, heal * 2)).glow(8, '#ffd166'),
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

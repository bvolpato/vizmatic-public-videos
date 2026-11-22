import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, radialGradient, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// 5-node constellation centered on right half so viral headline shines on the left
const CX = 345
const CY = 5
const CLUSTER: readonly { readonly name: string; readonly pos: Vec; readonly side: 'L' | 'R' }[] = [
    { name: 'S1', pos: [CX - 255, CY - 135], side: 'L' },
    { name: 'S2', pos: [CX - 235, CY + 145], side: 'L' },
    { name: 'S3', pos: [CX + 145, CY - 165], side: 'R' },
    { name: 'S4', pos: [CX + 305, CY + 12], side: 'R' },
    { name: 'S5', pos: [CX + 140, CY + 180], side: 'R' },
]

// Jagged crimson lightning partition wall slicing between {S1, S2} and {S3, S4, S5}
const WALL_X = CX - 62
const BOLT_PTS: Vec[] = [
    [WALL_X + 6, -335],
    [WALL_X - 18, -238],
    [WALL_X + 16, -142],
    [WALL_X - 22, -48],
    [WALL_X + 20, 48],
    [WALL_X - 16, 145],
    [WALL_X + 14, 240],
    [WALL_X - 8, 335],
]

// Deterministic spark rays deflecting backward when S1's heartbeat slams into the lightning wall
const DEFLECT_RAYS: readonly { readonly angle: number; readonly len: number; readonly dy: number; readonly phase: number }[] = [
    { angle: Math.PI - 0.82, len: 68, dy: -42, phase: 0.0 },
    { angle: Math.PI - 0.42, len: 86, dy: -16, phase: 0.14 },
    { angle: Math.PI - 0.12, len: 74, dy: 4, phase: 0.28 },
    { angle: Math.PI + 0.22, len: 92, dy: 24, phase: 0.42 },
    { angle: Math.PI + 0.58, len: 78, dy: 48, phase: 0.56 },
    { angle: Math.PI + 0.92, len: 64, dy: 72, phase: 0.72 },
    { angle: Math.PI - 1.1, len: 56, dy: -66, phase: 0.86 },
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
        txt('Two leaders claim the crown,', -840, 185, 32, '#cbd5e8', 'sans', 'left'),
        txt('only strict majority math survives', -840, 232, 32, '#ffd166', 'sans', 'left'),
    )

    const liveCluster = dynamic(() => {
        const t = pulse.value
        const w = wallVis.value
        const dual = dualLeader.value
        const ext = extinguish.value
        const s1 = CLUSTER[0]!
        const s3 = CLUSTER[2]!

        const nodes: Node[] = [
            circle(510, {
                fill: radialGradient([0, 0], 510, [
                    [0, w > 0.3 && ext < 0.5 ? '#ff6b8b28' : '#ffd16626'],
                    [0.5, '#5ce1e614'],
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
                const op = crosses ? Math.max(0.05, (1 - w) * 0.48) : 0.58
                const isRightActive = !crosses && a.side === 'R' && dual > 0.3
                const col = isRightActive ? '#ffd166' : !crosses && a.side === 'L' && w > 0.3 ? '#ff6b8b' : '#4d6496'
                nodes.push(
                    line(a.pos, b.pos, {
                        stroke: col,
                        width: isRightActive ? 2.8 : 1.8,
                        dash: crosses && w > 0.2 ? [6, 10] : undefined,
                        opacity: op,
                    }),
                )
            }
        }

        // Leader S1 live dual heartbeat rings (golden before partition -> crimson slamming into wall during split!)
        const s1Alive = 1 - ext
        if (s1Alive > 0.05) {
            const s1Col = w > 0.25 ? '#ff6b8b' : '#ffd166'
            for (let ringIdx = 0; ringIdx < 2; ringIdx++) {
                const p1 = (t * 0.72 + ringIdx * 0.5) % 1
                const rRing = 48 + p1 * 165
                nodes.push(
                    circle(rRing, { fill: null, stroke: s1Col, width: 2.8 })
                        .at(s1.pos[0], s1.pos[1])
                        .opacity((1 - p1) * 0.82 * s1Alive)
                        .glow(10, s1Col)
                        .set('blend', 'screen'),
                )
            }
            // Active heartbeat packet sent from S1 -> S2
            const hb12 = (t * 0.85) % 1
            const s2 = CLUSTER[1]!
            nodes.push(
                dot(6.5, s1Col)
                    .at(s1.pos[0] + (s2.pos[0] - s1.pos[0]) * hb12, s1.pos[1] + (s2.pos[1] - s1.pos[1]) * hb12)
                    .opacity(0.9 * s1Alive)
                    .glow(12, s1Col)
                    .set('blend', 'screen'),
            )
            // Blocked red heartbeat packet + glowing blend('screen') spark deflections slamming into the partition wall!
            if (w > 0.25) {
                const impactY = s1.pos[1] + 18
                const slamT = (t * 1.15) % 1
                const pktX = s1.pos[0] + 46 + Math.min(1, slamT * 1.4) * (WALL_X - (s1.pos[0] + 54))
                nodes.push(
                    line([s1.pos[0] + 46, s1.pos[1] + 6], [WALL_X - 6, impactY], {
                        stroke: '#ff6b8b',
                        width: 3.0,
                        dash: [8, 8],
                        opacity: 0.65 * w * s1Alive,
                    })
                        .glow(8, '#ff6b8b')
                        .set('blend', 'screen'),
                    dot(7.5, '#ff6b8b').at(pktX, s1.pos[1] + 6 + (impactY - (s1.pos[1] + 6)) * Math.min(1, slamT * 1.4))
                        .opacity(w * s1Alive)
                        .glow(14, '#ff6b8b')
                        .set('blend', 'screen'),
                    // Blazing impact flare directly on the lightning wall
                    circle(30 + Math.sin(t * 14) * 6, {
                        fill: radialGradient([0, 0], 36, [
                            [0, '#ffffffcc'],
                            [0.4, '#ffd16688'],
                            [0.75, '#ff6b8b44'],
                            [1, '#07091000'],
                        ]),
                        stroke: null,
                    })
                        .at(WALL_X - 4, impactY)
                        .opacity(0.95 * w * s1Alive)
                        .set('blend', 'screen'),
                )
                // Glowing additive spark deflections ricocheting off the partition wall
                for (const ray of DEFLECT_RAYS) {
                    const rp = (t * 1.4 + ray.phase) % 1
                    const sx = WALL_X - 6
                    const sy = impactY + ray.dy * 0.55
                    const r0 = rp * ray.len * 0.45
                    const r1 = rp * ray.len + 18
                    const x0 = sx + Math.cos(ray.angle) * r0
                    const y0 = sy + Math.sin(ray.angle) * r0
                    const x1 = sx + Math.cos(ray.angle) * r1
                    const y1 = sy + Math.sin(ray.angle) * r1
                    const sparkOp = (1 - rp * 0.75) * w * s1Alive
                    const sparkCol = ray.phase > 0.4 ? '#ffd166' : '#ff6b8b'
                    nodes.push(
                        line([x0, y0], [x1, y1], { stroke: sparkCol, width: 3.2, opacity: sparkOp })
                            .glow(10, sparkCol)
                            .set('blend', 'screen'),
                        dot(4.2, '#ffffff').at(x1, y1).opacity(sparkOp).glow(10, sparkCol).set('blend', 'screen'),
                    )
                }
            }
        }

        // Majority Leader S3 live dual heartbeat rings + golden replication packets to S4 & S5!
        if (dual > 0.05) {
            for (let ringIdx = 0; ringIdx < 2; ringIdx++) {
                const p3 = (t * 0.85 + ringIdx * 0.5 + 0.2) % 1
                nodes.push(
                    circle(48 + p3 * 135, { fill: null, stroke: '#ffd166', width: 3.0 })
                        .at(s3.pos[0], s3.pos[1])
                        .opacity((1 - p3) * 0.85 * dual)
                        .glow(12, '#ffd166')
                        .set('blend', 'screen'),
                )
            }
            for (const follower of [CLUSTER[3]!, CLUSTER[4]!]) {
                const fp = (t * 0.95 + (follower.name === 'S4' ? 0.15 : 0.65)) % 1
                const fx = s3.pos[0] + (follower.pos[0] - s3.pos[0]) * fp
                const fy = s3.pos[1] + (follower.pos[1] - s3.pos[1]) * fp
                nodes.push(
                    dot(7, '#ffd166').at(fx, fy).opacity(dual).glow(14, '#ffd166').set('blend', 'screen'),
                    dot(3.2, '#ffffff').at(fx, fy).opacity(dual).set('blend', 'screen'),
                )
            }
        }

        // Partition crimson lightning wall
        if (w > 0.02) {
            const jitter = Math.sin(t * 28) * 5
            const bolt: Vec[] = BOLT_PTS.map(([bx, by], idx) => [
                bx + (idx % 2 === 0 ? jitter : -jitter),
                by,
            ])
            nodes.push(
                new Node(polyPath(bolt)).stroke('#ff6b8b', 8, 0.94 * w).glow(18, '#ff6b8b').set('blend', 'screen'),
                new Node(polyPath(bolt)).stroke('#ffffff', 2.4, 0.9 * w).set('blend', 'screen'),
                rect(210, 46, { fill: '#280d1be8', stroke: '#ff6b8b', width: 2.4, radius: 23 }).at(WALL_X, -385).opacity(w).glow(8, '#ff6b8b'),
                txt('PARTITION', WALL_X, -383, 26, '#ff6b8b', 'mono').opacity(w),
            )
        }

        // Extinguishing ring over stale S1 (drawn BEHIND nodes & term pills so it never crosses T1!)
        if (ext > 0.05) {
            nodes.push(
                circle(56, { fill: null, stroke: '#ff6b8b', width: 3.4, dash: [10, 10] }).at(s1.pos[0], s1.pos[1]).opacity(ext).glow(10, '#ff6b8b'),
                txt('STEPPED DOWN', s1.pos[0], s1.pos[1] - 96, 26, '#ff6b8b', 'mono').opacity(ext).glow(6, '#ff6b8b'),
                dot(10, '#ffd166').at(s3.pos[0], s3.pos[1] - 96).opacity(ext).glow(14, '#ffd166').set('blend', 'screen'),
                txt('QUORUM LEADER', s3.pos[0], s3.pos[1] - 138, 26, '#ffd166', 'mono').opacity(ext).glow(8, '#ffd166'),
            )
        }

        // Five cluster nodes + crisp Term Badges (T1 / T2)
        for (const n of CLUSTER) {
            let strokeCol = '#5ce1e6'
            let rad = 40
            let glowCol = '#5ce1e6'
            const isT2 = n.side === 'R' && dual > 0.3
            const termTxt = isT2 ? 'T2' : 'T1'
            const termCol = isT2 ? '#ffd166' : n.side === 'L' && w > 0.3 ? '#ff6b8b' : '#5ce1e6'
            if (n.name === 'S1') {
                if (ext > 0.5) {
                    strokeCol = '#8a99bb'
                    glowCol = '#8a99bb'
                    rad = 38
                } else if (w > 0.25) {
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
            const badgeDx = n.side === 'L' ? -72 : 66
            const badgeDy = n.pos[1] < CY ? -46 : 46
            nodes.push(
                circle(rad, { fill: '#0c1222', stroke: strokeCol, width: rad > 44 ? 4.5 : 3.2 })
                    .at(n.pos[0], n.pos[1])
                    .glow(rad > 44 ? 14 : 8, glowCol),
                txt(n.name, n.pos[0], n.pos[1] + 2, 28, strokeCol, 'mono'),
                rect(66, 36, { fill: '#0c1222', stroke: termCol, width: 2.0, radius: 18 })
                    .at(n.pos[0] + badgeDx, n.pos[1] + badgeDy),
                txt(termTxt, n.pos[0] + badgeDx, n.pos[1] + badgeDy + 2, 26, termCol, 'mono'),
            )
        }

        // Minority / Majority status badges (pill-framed for razor clarity)
        if (w > 0.25) {
            const leftStatus = ext > 0.5 ? 'STALE · 2/5 BLOCKED' : 'MINORITY · 2/5 · T1'
            const rightStatus = dual > 0.3 ? 'MAJORITY · 3/5 · T2' : 'MAJORITY · 3/5'
            nodes.push(
                rect(330, 48, { fill: '#1f0c18', stroke: '#ff6b8b', width: 2.2, radius: 24 }).at(CX - 250, 295).opacity(w),
                txt(leftStatus, CX - 250, 297, 26, '#ff6b8b', 'mono').opacity(w),
                rect(330, 48, { fill: '#1d190c', stroke: '#ffd166', width: 2.4, radius: 24 }).at(CX + 215, 295).opacity(w).glow(8, '#ffd166'),
                txt(rightStatus, CX + 215, 297, 26, '#ffd166', 'mono').opacity(w),
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

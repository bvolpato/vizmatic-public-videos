import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, radialGradient, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// Top-center monumental title + FULL-WIDTH split-brain arena with blazing crimson lightning down DEAD CENTER (x = 0)!
const CY = 82
const CLUSTER: readonly { readonly name: string; readonly pos: Vec; readonly side: 'L' | 'R' }[] = [
    { name: 'S1', pos: [-395, CY - 102], side: 'L' },
    { name: 'S2', pos: [-510, CY + 132], side: 'L' },
    { name: 'S3', pos: [350, CY - 122], side: 'R' },
    { name: 'S4', pos: [625, CY + 12], side: 'R' },
    { name: 'S5', pos: [365, CY + 148], side: 'R' },
]

// Jagged crimson lightning partition wall slicing dead center x = 0!
const WALL_X = 0
const BOLT_PTS: Vec[] = [
    [WALL_X + 6, -162],
    [WALL_X - 20, -86],
    [WALL_X + 18, -8],
    [WALL_X - 24, 72],
    [WALL_X + 22, 152],
    [WALL_X - 18, 232],
    [WALL_X + 14, 312],
    [WALL_X - 8, 392],
]

const DEFLECT_RAYS: readonly { readonly angle: number; readonly len: number; readonly dy: number; readonly phase: number }[] = [
    { angle: Math.PI - 0.82, len: 82, dy: -46, phase: 0.0 },
    { angle: Math.PI - 0.42, len: 102, dy: -18, phase: 0.14 },
    { angle: Math.PI - 0.12, len: 88, dy: 4, phase: 0.28 },
    { angle: Math.PI + 0.22, len: 108, dy: 26, phase: 0.42 },
    { angle: Math.PI + 0.58, len: 92, dy: 52, phase: 0.56 },
    { angle: Math.PI + 0.92, len: 76, dy: 76, phase: 0.72 },
    { angle: Math.PI - 1.1, len: 68, dy: -70, phase: 0.86 },
]

export const hook: SceneFunction = (s, c) => {
    const pulse = s.value(0)
    const wallVis = s.value(0)
    const dualLeader = s.value(0)
    const extinguish = s.value(0)

    // Monumental Top-Center Headline
    const topCopy = group(
        txt('5 NODES   ·   1 QUORUM   ·   ONLY STRICT MAJORITY MATH SURVIVES', 0, -430, 26, '#ffd166', 'mono', 'center').glow(6, '#ffd166'),
        txt('Raft Consensus & Split-Brain', 0, -338, 92, '#f8f4ec', 'serif', 'center').glow(9, '#5ce1e6'),
    )

    const liveCluster = dynamic(() => {
        const t = pulse.value
        const w = wallVis.value
        const dual = dualLeader.value
        const ext = extinguish.value
        const s1 = CLUSTER[0]!
        const s3 = CLUSTER[2]!

        const nodes: Node[] = [
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, w > 0.3 && ext < 0.5 ? '#ff6b8b28' : '#5ce1e618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(-420, CY),
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, '#ffd16628'],
                    [0.55, '#5ce1e614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(440, CY),
        ]

        // Edges
        for (let i = 0; i < CLUSTER.length; i++) {
            for (let j = i + 1; j < CLUSTER.length; j++) {
                const a = CLUSTER[i]!
                const b = CLUSTER[j]!
                const crosses = a.side !== b.side
                const op = crosses ? Math.max(0.05, (1 - w) * 0.48) : 0.62
                const isRightActive = !crosses && a.side === 'R' && dual > 0.3
                const col = isRightActive ? '#ffd166' : !crosses && a.side === 'L' && w > 0.3 ? '#ff6b8b' : '#4d6496'
                nodes.push(
                    line(a.pos, b.pos, {
                        stroke: col,
                        width: isRightActive ? 3.0 : 1.9,
                        dash: crosses && w > 0.2 ? [6, 10] : undefined,
                        opacity: op,
                    }),
                )
            }
        }

        // Leader S1 live dual heartbeat rings + blocked red heartbeat slamming into the center lightning wall
        const s1Alive = 1 - ext
        if (s1Alive > 0.05) {
            const s1Col = w > 0.25 ? '#ff6b8b' : '#ffd166'
            for (let ringIdx = 0; ringIdx < 2; ringIdx++) {
                const p1 = (t * 0.72 + ringIdx * 0.5) % 1
                const rRing = 52 + p1 * 185
                nodes.push(
                    circle(rRing, { fill: null, stroke: s1Col, width: 3.0 })
                        .at(s1.pos[0], s1.pos[1])
                        .opacity((1 - p1) * 0.82 * s1Alive)
                        .glow(10, s1Col)
                        .set('blend', 'screen'),
                )
            }
            const hb12 = (t * 0.85) % 1
            const s2 = CLUSTER[1]!
            nodes.push(
                dot(7, s1Col)
                    .at(s1.pos[0] + (s2.pos[0] - s1.pos[0]) * hb12, s1.pos[1] + (s2.pos[1] - s1.pos[1]) * hb12)
                    .opacity(0.9 * s1Alive)
                    .glow(12, s1Col)
                    .set('blend', 'screen'),
            )
            if (w > 0.25) {
                const impactY = s1.pos[1] + 22
                const slamT = (t * 1.15) % 1
                const pktX = s1.pos[0] + 52 + Math.min(1, slamT * 1.4) * (WALL_X - (s1.pos[0] + 62))
                nodes.push(
                    line([s1.pos[0] + 52, s1.pos[1] + 6], [WALL_X - 8, impactY], {
                        stroke: '#ff6b8b',
                        width: 3.4,
                        dash: [10, 8],
                        opacity: 0.72 * w * s1Alive,
                    })
                        .glow(8, '#ff6b8b')
                        .set('blend', 'screen'),
                    dot(8, '#ff6b8b')
                        .at(pktX, s1.pos[1] + 6 + (impactY - (s1.pos[1] + 6)) * Math.min(1, slamT * 1.4))
                        .opacity(w * s1Alive)
                        .glow(14, '#ff6b8b')
                        .set('blend', 'screen'),
                    circle(36 + Math.sin(t * 14) * 6, {
                        fill: radialGradient([0, 0], 42, [
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
                for (const ray of DEFLECT_RAYS) {
                    const rp = (t * 1.4 + ray.phase) % 1
                    const sx = WALL_X - 6
                    const sy = impactY + ray.dy * 0.55
                    const r0 = rp * ray.len * 0.45
                    const r1 = rp * ray.len + 20
                    const x0 = sx + Math.cos(ray.angle) * r0
                    const y0 = sy + Math.sin(ray.angle) * r0
                    const x1 = sx + Math.cos(ray.angle) * r1
                    const y1 = sy + Math.sin(ray.angle) * r1
                    const sparkOp = (1 - rp * 0.75) * w * s1Alive
                    const sparkCol = ray.phase > 0.4 ? '#ffd166' : '#ff6b8b'
                    nodes.push(
                        line([x0, y0], [x1, y1], { stroke: sparkCol, width: 3.4, opacity: sparkOp })
                            .glow(10, sparkCol)
                            .set('blend', 'screen'),
                        dot(4.4, '#ffffff').at(x1, y1).opacity(sparkOp).glow(10, sparkCol).set('blend', 'screen'),
                    )
                }
            }
        }

        // Majority Leader S3 live heartbeat rings + golden replication packets to S4 & S5
        if (dual > 0.05) {
            for (let ringIdx = 0; ringIdx < 2; ringIdx++) {
                const p3 = (t * 0.85 + ringIdx * 0.5 + 0.2) % 1
                nodes.push(
                    circle(54 + p3 * 165, { fill: null, stroke: '#ffd166', width: 3.2 })
                        .at(s3.pos[0], s3.pos[1])
                        .opacity((1 - p3) * 0.88 * dual)
                        .glow(12, '#ffd166')
                        .set('blend', 'screen'),
                )
            }
            for (const follower of [CLUSTER[3]!, CLUSTER[4]!]) {
                const fp = (t * 0.95 + (follower.name === 'S4' ? 0.15 : 0.65)) % 1
                const fx = s3.pos[0] + (follower.pos[0] - s3.pos[0]) * fp
                const fy = s3.pos[1] + (follower.pos[1] - s3.pos[1]) * fp
                nodes.push(
                    dot(7.5, '#ffd166').at(fx, fy).opacity(dual).glow(14, '#ffd166').set('blend', 'screen'),
                    dot(3.5, '#ffffff').at(fx, fy).opacity(dual).set('blend', 'screen'),
                )
            }
        }

        // Central Crimson Lightning Partition Wall
        if (w > 0.02) {
            const jitter = Math.sin(t * 28) * 5.5
            const bolt: Vec[] = BOLT_PTS.map(([bx, by], idx) => [
                bx + (idx % 2 === 0 ? jitter : -jitter),
                by,
            ])
            nodes.push(
                new Node(polyPath(bolt)).stroke('#ff6b8b', 9.5, 0.96 * w).glow(20, '#ff6b8b').set('blend', 'screen'),
                new Node(polyPath(bolt)).stroke('#ffffff', 2.8, 0.92 * w).set('blend', 'screen'),
                rect(220, 48, { fill: '#280d1be8', stroke: '#ff6b8b', width: 2.6, radius: 24 }).at(WALL_X, -214).opacity(w).glow(10, '#ff6b8b'),
                txt('PARTITION', WALL_X, -212, 26, '#ff6b8b', 'mono').opacity(w),
            )
        }

        // Extinguishing ring over stale S1
        if (ext > 0.05) {
            nodes.push(
                circle(62, { fill: null, stroke: '#ff6b8b', width: 3.4, dash: [10, 10] }).at(s1.pos[0], s1.pos[1]).opacity(ext).glow(10, '#ff6b8b'),
                txt('STEPPED DOWN', s1.pos[0], s1.pos[1] - 102, 26, '#ff6b8b', 'mono').opacity(ext).glow(6, '#ff6b8b'),
                dot(10, '#ffd166').at(s3.pos[0], s3.pos[1] - 100).opacity(ext).glow(14, '#ffd166').set('blend', 'screen'),
                txt('QUORUM LEADER', s3.pos[0], s3.pos[1] - 142, 26, '#ffd166', 'mono').opacity(ext).glow(8, '#ffd166'),
            )
        }

        // Five cluster nodes + crisp Term Badges
        for (const n of CLUSTER) {
            let strokeCol = '#5ce1e6'
            let rad = 46
            let glowCol = '#5ce1e6'
            const isT2 = n.side === 'R' && dual > 0.3
            const termTxt = isT2 ? 'T2' : 'T1'
            const termCol = isT2 ? '#ffd166' : n.side === 'L' && w > 0.3 ? '#ff6b8b' : '#5ce1e6'
            if (n.name === 'S1') {
                if (ext > 0.5) {
                    strokeCol = '#8a99bb'
                    glowCol = '#8a99bb'
                    rad = 42
                } else if (w > 0.25) {
                    strokeCol = '#ff6b8b'
                    glowCol = '#ff6b8b'
                    rad = 52
                } else {
                    strokeCol = '#ffd166'
                    glowCol = '#ffd166'
                    rad = 54
                }
            } else if (n.name === 'S3' && dual > 0.3) {
                strokeCol = '#ffd166'
                glowCol = '#ffd166'
                rad = 56
            }
            const badgeDx = n.side === 'L' ? -82 : 80
            const badgeDy = n.pos[1] < CY ? -52 : 52
            nodes.push(
                circle(rad, { fill: '#0c1222', stroke: strokeCol, width: rad > 48 ? 4.8 : 3.4 })
                    .at(n.pos[0], n.pos[1])
                    .glow(rad > 48 ? 16 : 9, glowCol),
                txt(n.name, n.pos[0], n.pos[1] + 2, 30, strokeCol, 'mono'),
                rect(68, 36, { fill: '#0c1222', stroke: termCol, width: 2.0, radius: 18 })
                    .at(n.pos[0] + badgeDx, n.pos[1] + badgeDy),
                txt(termTxt, n.pos[0] + badgeDx, n.pos[1] + badgeDy + 2, 26, termCol, 'mono'),
            )
        }

        // Minority / Majority arena footer badges
        if (w > 0.25) {
            const leftStatus = ext > 0.5 ? 'STALE · 2/5 BLOCKED' : 'MINORITY · 2/5 · T1'
            const rightStatus = dual > 0.3 ? 'MAJORITY · 3/5 · T2' : 'MAJORITY · 3/5'
            nodes.push(
                rect(348, 50, { fill: '#1f0c18', stroke: '#ff6b8b', width: 2.4, radius: 25 }).at(-450, 385).opacity(w),
                txt(leftStatus, -450, 387, 26, '#ff6b8b', 'mono').opacity(w),
                rect(348, 50, { fill: '#1d190c', stroke: '#ffd166', width: 2.6, radius: 25 }).at(450, 385).opacity(w).glow(10, '#ffd166'),
                txt(rightStatus, 450, 387, 26, '#ffd166', 'mono').opacity(w),
            )
        }
        return group(...nodes)
    })

    s.add(liveCluster, topCopy)
    c.at(0.05, () => s.play(pulse.to(9.5, { duration: 15.8, ease: linear })))
    c.on('network cable snaps', () => s.play(wallVis.to(1, { duration: 0.45 })))
    c.on('Two servers suddenly', () => s.play(dualLeader.to(1, { duration: 0.5 })))
    c.on('extinguishes the stale', () => s.play(extinguish.to(1, { duration: 0.6 })))
}

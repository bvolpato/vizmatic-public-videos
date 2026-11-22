import {
    Node, arc, circle, dot, dynamic, group, line, linear, radialGradient, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// Enlarged 5-node pentagon cluster shifted slightly left to balance the right-side live Vote Quorum Meter
const CX = -225
const CY = 36
const RADIUS = 242

// 5 servers with distinct randomized election timeouts (ms); S3 wins first!
const SERVERS: readonly {
    readonly name: string
    readonly timeoutMs: number
    readonly rate: number
    readonly pos: Vec
    readonly labelDir: Vec
}[] = Array.from({ length: 5 }, (_, i) => {
    const specs = [
        { name: 'S1', timeoutMs: 285, rate: 0.56 },
        { name: 'S2', timeoutMs: 245, rate: 0.68 },
        { name: 'S3', timeoutMs: 162, rate: 1.0 },
        { name: 'S4', timeoutMs: 220, rate: 0.74 },
        { name: 'S5', timeoutMs: 270, rate: 0.61 },
    ] as const
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5
    const x = CX + Math.cos(a) * RADIUS
    const y = CY + Math.sin(a) * RADIUS
    // Push labels cleanly outside each node's outer ring (radius 68) with zero collisions!
    const dirs: readonly Vec[] = [
        [0, -96],    // S1 (top): above ring
        [136, -28],  // S2 (upper-right): cleanly outside right of ring
        [0, 102],    // S3 (lower-right): cleanly BELOW outer ring inside pill badge!
        [0, 102],    // S4 (lower-left): cleanly below outer ring
        [-152, -28], // S5 (upper-left): cleanly outside left of ring (wide enough for VOTED S3 ✓!)
    ]
    return { ...specs[i]!, pos: [x, y] as Vec, labelDir: dirs[i]! }
})

export const election: SceneFunction = (s, c) => {
    const timerProg = s.value(0.1)
    const candidateLit = s.value(0)
    const voteWave = s.value(0)
    const voteReturn = s.value(0)
    const leaderWin = s.value(0)
    const hbPulse = s.value(0)

    const liveElection = dynamic(() => {
        const tp = timerProg.value
        const cand = candidateLit.value
        const vw = voteWave.value
        const vr = voteReturn.value
        const win = leaderWin.value
        const hb = hbPulse.value
        const s3 = SERVERS[2]!

        const termStr = cand > 0.3 ? 'TERM 2' : 'TERM 1'
        const termCol = win > 0.5 ? '#ffd166' : cand > 0.3 ? '#a78bfa' : '#5ce1e6'

        const votesCount = win > 0.5 ? 3 : vr > 0.62 ? 3 : vr > 0.25 ? 2 : cand > 0.3 ? 1 : 0
        const statusStr =
            win > 0.5
                ? 'S3 ELECTED LEADER  ·  3 / 5 MAJORITY'
                : cand > 0.3
                    ? `CANDIDATE S3  ·  VOTES ${votesCount} / 5`
                    : 'RANDOMIZED ELECTION TIMERS RACING'

        const nodes: Node[] = [
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, win > 0.5 ? '#ffd1662a' : cand > 0.3 ? '#a78bfa26' : '#5ce1e618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY),
            txt(termStr, 0, -430, 30, termCol, 'mono').glow(8, termCol),
            txt(statusStr, 0, -372, 36, '#f8f4ec', 'serif'),
        ]

        // Brightened pentagon mesh connections
        for (let i = 0; i < SERVERS.length; i++) {
            for (let j = i + 1; j < SERVERS.length; j++) {
                const isS3Edge = i === 2 || j === 2
                const activeCol =
                    isS3Edge && win > 0.5
                        ? '#ffd166'
                        : isS3Edge && vr > 0.1 && (i === 3 || j === 3 || i === 4 || j === 4)
                            ? '#6ee7b7'
                            : isS3Edge && vw > 0.05
                                ? '#a78bfa'
                                : '#4d6596'
                const active = isS3Edge && (vw > 0.05 || win > 0.5)
                nodes.push(
                    line(SERVERS[i]!.pos, SERVERS[j]!.pos, {
                        stroke: activeCol,
                        width: active ? 3.2 : 2.1,
                        opacity: active ? 0.85 : 0.55,
                    })
                        .glow(active ? 8 : 0, activeCol)
                        .set('blend', active ? 'screen' : 'normal'),
                )
            }
        }

        // Animated glowing RequestVote outgoing packets flying along edges from S3 -> all peers
        if (vw > 0.02 && win < 0.6) {
            const waveCycle = vw < 0.99 ? vw : 0.55
            const ringR = 56 + (waveCycle % 1) * 165
            nodes.push(
                circle(ringR, { fill: null, stroke: '#a78bfa', width: 3.0 })
                    .at(s3.pos[0], s3.pos[1])
                    .opacity((1 - (waveCycle % 1)) * 0.85 * (1 - win))
                    .glow(12, '#a78bfa')
                    .set('blend', 'screen'),
            )
            for (const peer of SERVERS) {
                if (peer.name === 'S3') continue
                const p = Math.min(0.96, vw * 1.15)
                const px = s3.pos[0] + (peer.pos[0] - s3.pos[0]) * p
                const py = s3.pos[1] + (peer.pos[1] - s3.pos[1]) * p
                const tx = s3.pos[0] + (peer.pos[0] - s3.pos[0]) * Math.max(0, p - 0.18)
                const ty = s3.pos[1] + (peer.pos[1] - s3.pos[1]) * Math.max(0, p - 0.18)
                nodes.push(
                    line([tx, ty], [px, py], { stroke: '#a78bfa', width: 5.0, opacity: 0.92 * (1 - win) })
                        .glow(12, '#a78bfa')
                        .set('blend', 'screen'),
                    dot(8.5, '#c4b5fd').at(px, py).opacity(1 - win).glow(14, '#a78bfa').set('blend', 'screen'),
                    dot(4, '#ffffff').at(px, py).opacity(1 - win).set('blend', 'screen'),
                )
            }
        }

        // Animated glowing VoteGranted return packets from S4 and S5 back to S3 (strict majority 3/5!)
        if (vr > 0.02 && win < 0.85) {
            const voters = [SERVERS[3]!, SERVERS[4]!]
            for (let k = 0; k < voters.length; k++) {
                const voter = voters[k]!
                const p = Math.max(0, Math.min(1, vr * 1.4 - k * 0.25))
                if (p > 0.02) {
                    const px = voter.pos[0] + (s3.pos[0] - voter.pos[0]) * p
                    const py = voter.pos[1] + (s3.pos[1] - voter.pos[1]) * p
                    nodes.push(
                        line(voter.pos, [px, py], { stroke: '#6ee7b7', width: 4.5, opacity: 0.94 })
                            .glow(12, '#6ee7b7')
                            .set('blend', 'screen'),
                        dot(9, '#ffffff').at(px, py).glow(16, '#6ee7b7').set('blend', 'screen'),
                    )
                }
            }
        }

        // Golden steady heartbeats once S3 becomes Term 2 Leader (bounded so it never crosses bottom caption!)
        if (win > 0.05) {
            const hp = hb % 1
            nodes.push(
                circle(54 + hp * 165, { fill: null, stroke: '#ffd166', width: 3.4 })
                    .at(s3.pos[0], s3.pos[1])
                    .opacity((1 - hp) * 0.88 * win)
                    .glow(14, '#ffd166')
                    .set('blend', 'screen'),
            )
        }

        // Draw 5 server nodes + orbital countdown arcs (drawn above edges, clean pill labels below/beside!)
        for (const srv of SERVERS) {
            const isS3 = srv.name === 'S3'
            const isVoter = srv.name === 'S4' || srv.name === 'S5'
            const remaining = Math.max(0, 1 - tp * srv.rate)
            const col =
                isS3 && win > 0.5
                    ? '#ffd166'
                    : isS3 && cand > 0.3
                        ? '#a78bfa'
                        : isVoter && vr > 0.22
                            ? '#6ee7b7'
                            : '#5ce1e6'

            // Orbital election timer ring (radius 66, fades out once leader heartbeats reset timers)
            if (win < 0.8 && remaining > 0.02) {
                const sweep = remaining * Math.PI * 2
                nodes.push(
                    arc(66, -Math.PI / 2, -Math.PI / 2 + sweep, { stroke: isS3 ? '#ffd166' : '#5ce1e6', width: 4.8 })
                        .at(srv.pos[0], srv.pos[1])
                        .opacity((1 - win) * 0.9)
                        .glow(10, isS3 ? '#ffd166' : '#5ce1e6')
                        .set('blend', 'screen'),
                )
            }

            const lx = srv.pos[0] + srv.labelDir[0]
            const ly = srv.pos[1] + srv.labelDir[1]
            const subLabel =
                isS3 && win > 0.5
                    ? 'LEADER · T2'
                    : isS3 && cand > 0.3
                        ? 'CANDIDATE'
                        : isVoter && vr > 0.32
                            ? 'VOTED S3 ✓'
                            : `${srv.timeoutMs} ms`

            nodes.push(
                circle(isS3 && (cand > 0.3 || win > 0.5) ? 50 : 44, {
                    fill: '#0c1222',
                    stroke: col,
                    width: isS3 ? 4.5 : 3.4,
                })
                    .at(srv.pos[0], srv.pos[1])
                    .glow(isS3 ? 14 : 8, col),
                txt(srv.name, srv.pos[0], srv.pos[1] + 2, 28, col, 'mono'),
            )

            // Crisp pill badge cleanly separated below S3's outer ring (ZERO ring collision!)
            if (isS3 && (cand > 0.3 || win > 0.5)) {
                nodes.push(
                    rect(218, 44, { fill: '#111626ee', stroke: col, width: 2.6, radius: 22 })
                        .at(lx, ly)
                        .glow(10, col),
                    txt(subLabel, lx, ly + 2, 26, col, 'mono'),
                )
            } else {
                nodes.push(txt(subLabel, lx, ly, 26, col, 'mono'))
            }
        }

        // Right-side live Vote Quorum Meter (1/5 -> 2/5 -> 3/5 QUORUM!) balancing the 16:9 frame
        const MX = 535
        const MY = 30
        const barW = 430
        const fillFrac = votesCount / 5
        const meterCol = votesCount >= 3 ? '#ffd166' : votesCount >= 1 ? '#a78bfa' : '#5ce1e6'
        const quorumStatus =
            votesCount >= 3
                ? '3 / 5  QUORUM!'
                : votesCount === 2
                    ? '2 / 5  COLLECTING...'
                    : votesCount === 1
                        ? '1 / 5  SELF-VOTE'
                        : '0 / 5  TIMERS ACTIVE'

        nodes.push(
            rect(520, 490, { fill: '#0c1222e4', stroke: '#334878', width: 2.4, radius: 18 }).at(MX, MY).glow(8, '#263966'),
            txt('VOTE QUORUM METER', MX, MY - 202, 26, '#5ce1e6', 'mono'),
            // Big live fraction readout
            txt(quorumStatus, MX, MY - 142, 32, meterCol, 'mono').glow(10, meterCol),
            // Progress track + 3/5 threshold marker
            rect(barW, 34, { fill: '#141e36', stroke: '#364b7a', width: 2, radius: 17 }).at(MX, MY - 82),
        )
        if (fillFrac > 0) {
            const fw = Math.max(34, barW * fillFrac)
            nodes.push(
                rect(fw, 30, { fill: meterCol, stroke: '#ffffff', width: 1.5, radius: 15 })
                    .at(MX - barW / 2 + fw / 2, MY - 82)
                    .opacity(0.92)
                    .glow(12, meterCol),
            )
        }
        // Dashed 3/5 threshold line across progress bar
        const threshX = MX - barW / 2 + barW * 0.6
        nodes.push(
            line([threshX, MY - 108], [threshX, MY - 56], { stroke: '#6ee7b7', width: 2.8, dash: [6, 5] }).glow(6, '#6ee7b7'),
            txt('3/5', threshX, MY - 36, 26, '#6ee7b7', 'mono'),
        )

        // Per-node vote ledger rows inside the Quorum Meter
        const voteRows: readonly { readonly id: string; readonly state: string; readonly col: string }[] = [
            {
                id: 'S3',
                state: win > 0.5 ? 'LEADER · SELF ✓' : cand > 0.3 ? 'SELF VOTE ✓' : 'RACING...',
                col: win > 0.5 ? '#ffd166' : cand > 0.3 ? '#a78bfa' : '#8da2c9',
            },
            {
                id: 'S4',
                state: vr > 0.25 ? 'VOTE GRANTED ✓' : vw > 0.1 ? 'REQUEST SENT →' : 'FOLLOWER',
                col: vr > 0.25 ? '#6ee7b7' : vw > 0.1 ? '#c4b5fd' : '#8da2c9',
            },
            {
                id: 'S5',
                state: vr > 0.62 ? 'VOTE GRANTED ✓' : vw > 0.1 ? 'REQUEST SENT →' : 'FOLLOWER',
                col: vr > 0.62 ? '#6ee7b7' : vw > 0.1 ? '#c4b5fd' : '#8da2c9',
            },
            {
                id: 'S1',
                state: win > 0.5 ? 'HEARTBEAT ACK' : vw > 0.1 ? 'REQUEST SENT →' : 'FOLLOWER',
                col: win > 0.5 ? '#5ce1e6' : '#8da2c9',
            },
            {
                id: 'S2',
                state: win > 0.5 ? 'HEARTBEAT ACK' : vw > 0.1 ? 'REQUEST SENT →' : 'FOLLOWER',
                col: win > 0.5 ? '#5ce1e6' : '#8da2c9',
            },
        ]
        for (let r = 0; r < voteRows.length; r++) {
            const row = voteRows[r]!
            const ry = MY + 16 + r * 48
            nodes.push(
                rect(456, 38, { fill: '#111a30', stroke: row.col, width: 1.6, radius: 8 }).at(MX, ry).opacity(0.9),
                txt(row.id, MX - 196, ry + 2, 26, row.col, 'mono', 'left'),
                txt(row.state, MX + 206, ry + 2, 26, row.col, 'mono', 'right'),
            )
        }

        // Bottom caption badge for quorum rule
        nodes.push(
            txt('Strict Majority Rule:  votes ≥ ⌊N / 2⌋ + 1  =  3 of 5', 0, 420, 28, '#cbd5e8', 'mono'),
        )
        return group(...nodes)
    })

    s.add(liveElection)
    const raceDur = Math.max(4.0, c.cue('times out first').start - c.start - 0.15)
    c.at(0.1, () => s.play(timerProg.to(1.0, { duration: raceDur, ease: linear })))
    c.on('times out first', () => s.play(candidateLit.to(1, { duration: 0.45 })))
    // Trigger RequestVote right on "broadcasts" so packets are flying along edges at t=36s!
    c.on('broadcasts', () => s.play(voteWave.to(1, { duration: 3.1, ease: linear })))
    c.on('one vote per term', () => s.play(voteReturn.to(1, { duration: 2.5, ease: linear })))
    c.on('strict majority', () => {
        s.play(leaderWin.to(1, { duration: 0.5 }))
        s.play(hbPulse.to(3.2, { duration: 4.4, ease: linear }))
    })
}

import {
    Node, arc, circle, dot, dynamic, group, line, linear, radialGradient,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const CX = 0
const CY = 68
const RADIUS = 212

// 5 servers with distinct randomized election timeouts (ms); S3 wins first!
const SERVERS: readonly { readonly name: string; readonly timeoutMs: number; readonly rate: number; readonly pos: Vec }[] = [
    { name: 'S1', timeoutMs: 285, rate: 0.56, pos: [CX + Math.cos(-Math.PI / 2) * RADIUS, CY + Math.sin(-Math.PI / 2) * RADIUS] },
    { name: 'S2', timeoutMs: 245, rate: 0.68, pos: [CX + Math.cos(-Math.PI / 2 + (2 * Math.PI) / 5) * RADIUS, CY + Math.sin(-Math.PI / 2 + (2 * Math.PI) / 5) * RADIUS] },
    { name: 'S3', timeoutMs: 162, rate: 1.0, pos: [CX + Math.cos(-Math.PI / 2 + (4 * Math.PI) / 5) * RADIUS, CY + Math.sin(-Math.PI / 2 + (4 * Math.PI) / 5) * RADIUS] },
    { name: 'S4', timeoutMs: 220, rate: 0.74, pos: [CX + Math.cos(-Math.PI / 2 + (6 * Math.PI) / 5) * RADIUS, CY + Math.sin(-Math.PI / 2 + (6 * Math.PI) / 5) * RADIUS] },
    { name: 'S5', timeoutMs: 270, rate: 0.61, pos: [CX + Math.cos(-Math.PI / 2 + (8 * Math.PI) / 5) * RADIUS, CY + Math.sin(-Math.PI / 2 + (8 * Math.PI) / 5) * RADIUS] },
]

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

        const votesCount = win > 0.5 ? 3 : vr > 0.65 ? 3 : vr > 0.3 ? 2 : cand > 0.3 ? 1 : 0
        const statusStr =
            win > 0.5
                ? 'S3 ELECTED LEADER  ·  3 / 5 MAJORITY'
                : cand > 0.3
                    ? `CANDIDATE S3  ·  VOTES ${votesCount} / 5`
                    : 'RANDOMIZED ELECTION TIMERS RACING'

        const nodes: Node[] = [
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, win > 0.5 ? '#ffd16626' : cand > 0.3 ? '#a78bfa22' : '#5ce1e614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY),
            txt(termStr, 0, -425, 32, termCol, 'mono').glow(8, termCol),
            txt(statusStr, 0, -360, 36, '#f8f4ec', 'serif'),
        ]

        // Mesh connections
        for (let i = 0; i < SERVERS.length; i++) {
            for (let j = i + 1; j < SERVERS.length; j++) {
                const isS3Edge = i === 2 || j === 2
                nodes.push(
                    line(SERVERS[i]!.pos, SERVERS[j]!.pos, {
                        stroke: isS3Edge && win > 0.5 ? '#ffd166' : isS3Edge && vw > 0.1 ? '#a78bfa' : '#2d3b5c',
                        width: isS3Edge && (vw > 0.1 || win > 0.5) ? 2.6 : 1.5,
                        opacity: isS3Edge ? 0.58 : 0.3,
                    }),
                )
            }
        }

        // RequestVote outgoing pulses from S3 -> all peers
        if (vw > 0.02 && vw < 0.99 && win < 0.5) {
            nodes.push(
                circle(55 + vw * 430, { fill: null, stroke: '#a78bfa', width: 2.8 })
                    .at(s3.pos[0], s3.pos[1])
                    .opacity((1 - vw) * 0.8)
                    .glow(10, '#a78bfa'),
            )
            for (const peer of SERVERS) {
                if (peer.name === 'S3') continue
                const px = s3.pos[0] + (peer.pos[0] - s3.pos[0]) * vw
                const py = s3.pos[1] + (peer.pos[1] - s3.pos[1]) * vw
                nodes.push(dot(7, '#a78bfa').at(px, py).glow(12, '#a78bfa'))
            }
        }

        // VoteGranted return beams from S4 and S5 back to S3 (strict majority 3/5!)
        if (vr > 0.02 && win < 0.8) {
            const voters = [SERVERS[3]!, SERVERS[4]!]
            for (let k = 0; k < voters.length; k++) {
                const voter = voters[k]!
                const p = Math.max(0, Math.min(1, vr * 1.4 - k * 0.28))
                if (p > 0.02) {
                    const px = voter.pos[0] + (s3.pos[0] - voter.pos[0]) * p
                    const py = voter.pos[1] + (s3.pos[1] - voter.pos[1]) * p
                    nodes.push(
                        line(voter.pos, [px, py], { stroke: '#6ee7b7', width: 4, opacity: 0.9 }).glow(10, '#6ee7b7'),
                        dot(8, '#ffffff').at(px, py).glow(14, '#6ee7b7'),
                    )
                }
            }
        }

        // Golden steady heartbeats once S3 becomes Term 2 Leader
        if (win > 0.05) {
            const hp = hb % 1
            nodes.push(
                circle(52 + hp * 420, { fill: null, stroke: '#ffd166', width: 3.2 })
                    .at(s3.pos[0], s3.pos[1])
                    .opacity((1 - hp) * 0.85 * win)
                    .glow(12, '#ffd166'),
            )
        }

        // Draw 5 server nodes + orbital countdown arcs
        for (const srv of SERVERS) {
            const isS3 = srv.name === 'S3'
            const isVoter = srv.name === 'S4' || srv.name === 'S5'
            const remaining = Math.max(0, 1 - tp * srv.rate)
            const col =
                isS3 && win > 0.5
                    ? '#ffd166'
                    : isS3 && cand > 0.3
                        ? '#a78bfa'
                        : isVoter && vr > 0.25
                            ? '#6ee7b7'
                            : '#5ce1e6'

            // Orbital election timer ring (fades out once leader heartbeats reset timers)
            if (win < 0.8 && remaining > 0.02) {
                const sweep = remaining * Math.PI * 2
                nodes.push(
                    arc(64, -Math.PI / 2, -Math.PI / 2 + sweep, { stroke: isS3 ? '#ffd166' : '#5ce1e6', width: 4.5 })
                        .at(srv.pos[0], srv.pos[1])
                        .opacity((1 - win) * 0.85)
                        .glow(8, isS3 ? '#ffd166' : '#5ce1e6'),
                )
            }

            const labelYOffset = srv.pos[1] < CY ? -82 : 84
            const subLabel =
                isS3 && win > 0.5
                    ? 'LEADER · T2'
                    : isS3 && cand > 0.3
                        ? 'CANDIDATE'
                        : isVoter && vr > 0.35
                            ? 'VOTED S3 ✓'
                            : `${srv.timeoutMs} ms`

            nodes.push(
                circle(isS3 && (cand > 0.3 || win > 0.5) ? 50 : 42, { fill: '#0e162b', stroke: col, width: isS3 ? 4.5 : 3.2 })
                    .at(srv.pos[0], srv.pos[1])
                    .glow(isS3 ? 14 : 8, col),
                txt(srv.name, srv.pos[0], srv.pos[1] + 2, 28, col, 'mono'),
                txt(subLabel, srv.pos[0], srv.pos[1] + labelYOffset, 26, col, 'mono'),
            )
        }

        // Bottom caption badge for quorum rule
        nodes.push(
            txt('Strict Majority Rule:  votes ≥ ⌊N / 2⌋ + 1  =  3 of 5', 0, 408, 28, '#cbd5e8', 'mono'),
        )
        return group(...nodes)
    })

    s.add(liveElection)
    const raceDur = Math.max(4.0, c.cue('times out first').start - c.start - 0.15)
    c.at(0.1, () => s.play(timerProg.to(1.0, { duration: raceDur, ease: linear })))
    c.on('times out first', () => s.play(candidateLit.to(1, { duration: 0.45 })))
    c.on('pulses across', () => s.play(voteWave.to(1, { duration: 2.2, ease: linear })))
    c.on('one vote per term', () => s.play(voteReturn.to(1, { duration: 2.4, ease: linear })))
    c.on('strict majority', () => {
        s.play(leaderWin.to(1, { duration: 0.5 }))
        s.play(hbPulse.to(3.0, { duration: 4.2, ease: linear }))
    })
}

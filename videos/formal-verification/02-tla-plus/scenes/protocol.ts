import {
    Node, circle, dot, dynamic, group, line, linear, polyPath,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

function arcPts(p0: Vec, ctrl: Vec, p1: Vec, steps = 36): Vec[] {
    const out: Vec[] = []
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const u = 1 - t
        out.push([
            u * u * p0[0] + 2 * u * t * ctrl[0] + t * t * p1[0],
            u * u * p0[1] + 2 * u * t * ctrl[1] + t * t * p1[1],
        ])
    }
    return out
}

// Wide panoramic IMAX protocol choreography spanning x = -680 .. +680
const SENDER_X = -660
const NET_X = 0
const WH_X = 660
const ACTOR_Y = -20

const REQ_ARC = arcPts([SENDER_X + 114, ACTOR_Y - 26], [NET_X, ACTOR_Y - 260], [WH_X - 118, ACTOR_Y - 26], 44)
const ACK_ARC = arcPts([WH_X - 118, ACTOR_Y + 30], [NET_X + 35, ACTOR_Y + 195], [SENDER_X + 114, ACTOR_Y + 30], 44)
const RETRY_ARC = arcPts([SENDER_X + 114, ACTOR_Y - 42], [NET_X, ACTOR_Y - 310], [WH_X - 118, ACTOR_Y - 42], 44)

const TRACE_STEPS = [
    { x: -680, num: '1', code: 'Send', sub: 'order#1', col: COSMOS.gold },
    { x: -340, num: '2', code: 'Ship', sub: 'd = 1', col: COSMOS.emerald },
    { x: 0, num: '3', code: 'DropAck', sub: 'lost!', col: COSMOS.cyan },
    { x: 340, num: '4', code: 'Retry', sub: 'timeout', col: COSMOS.amber },
    { x: 680, num: '5', code: 'Ship!', sub: 'd = 2 BUG', col: COSMOS.rose },
] as const

export const protocol: SceneFunction = (s, c) => {
    const storm = s.value(0)
    const req1 = s.value(0)
    const ackLost = s.value(0)
    const retry = s.value(0)

    // Clean top editorial title (zero card chrome!)
    const topTitle = group(
        txt('PROOFS FOR REAL SYSTEMS  ·  EP 2 / 3', -855, -424, 26, COSMOS.gold, 'mono', 'left'),
        txt('TLA+ & the Five-Step Bug', -860, -346, 76, COSMOS.ink, 'serif', 'left').glow(7, COSMOS.rose),
    )

    const liveStage = dynamic(() => {
        const st = storm.value
        const r1 = req1.value
        const al = ackLost.value
        const r2 = retry.value

        const shipped = r2 > 0.88 ? 2 : r1 > 0.88 ? 1 : 0
        const statusStr = r2 > 0.05 ? '"retrying"' : r1 > 0.05 ? '"waiting"' : '"idle"'
        const stepCount = r2 > 0.88 ? 5 : r2 > 0.08 ? 4 : al > 0.55 ? 3 : r1 > 0.88 ? 2 : r1 > 0.08 ? 1 : 0

        const nodes: Node[] = [
            nebula(SENDER_X, ACTOR_Y, 270, '#60a5fa22'),
            nebula(NET_X, ACTOR_Y, 340, al > 0.4 ? '#ff6b8b28' : '#5ce1e618'),
            nebula(WH_X, ACTOR_Y, 280, shipped >= 2 ? '#ff6b8b2e' : '#ffd16622'),
            // Floating minimal TLA+ state readout top-right (zero dark rectangle box!)
            txt(`status: ${statusStr}   ·   receipts: {}`, 855, -418, 26, COSMOS.muted, 'mono', 'right'),
            txt(
                shipped >= 2 ? 'shipped = 2   (INVARIANT VIOLATION!)' : `shipped = ${shipped}   (<= 1 invariant)`,
                855,
                -366,
                28,
                shipped >= 2 ? COSMOS.rose : COSMOS.emerald,
                'mono',
                'right',
            ).glow(shipped >= 2 ? 10 : 6, shipped >= 2 ? COSMOS.rose : COSMOS.emerald),
        ]

        // Center atmospheric Unreliable Network storm zone (open cosmic turbulence, no heavy box!)
        nodes.push(
            circle(154, { fill: null, stroke: al > 0.45 ? COSMOS.rose : '#3a4a72', width: 2.0, dash: [10, 10] })
                .at(NET_X, ACTOR_Y + 20)
                .opacity(0.65)
                .glow(al > 0.45 ? 10 : 4, al > 0.45 ? COSMOS.rose : COSMOS.violet),
            txt('UNRELIABLE NET', NET_X, ACTOR_Y - 56, 26, al > 0.45 ? COSMOS.rose : COSMOS.muted, 'mono'),
        )
        for (let k = 0; k < 5; k++) {
            const wy = ACTOR_Y - 10 + k * 21
            const wavePts: Vec[] = Array.from({ length: 24 }, (_, i) => {
                const frac = i / 23
                const wx = NET_X - 118 + frac * 236
                const amp = (al > 0.35 && al < 0.95 ? 11 : 5) * Math.sin(frac * Math.PI)
                return [wx, wy + Math.sin(frac * 11 - st * 4.5 + k * 1.4) * amp] as Vec
            })
            nodes.push(
                new Node(polyPath(wavePts))
                    .stroke(al > 0.45 ? COSMOS.rose : COSMOS.violet, 2.0, 0.5)
                    .set('blend', 'screen'),
            )
        }
        for (let i = 0; i < 12; i++) {
            const ang = st * 1.6 + i * 0.52
            const rad = 36 + (i % 3) * 34
            const sx = NET_X + Math.cos(ang) * rad * 1.35
            const sy = ACTOR_Y + 8 + Math.sin(ang * 1.3) * rad * 0.72
            nodes.push(dot(3.0, i % 2 === 0 ? COSMOS.rose : COSMOS.cyan).at(sx, sy).opacity(0.65).set('blend', 'screen'))
        }

        // Subtle trajectory guide rails
        nodes.push(
            new Node(polyPath(REQ_ARC)).stroke('#25314d', 1.8, 0.5),
            new Node(polyPath(ACK_ARC)).stroke('#25314d', 1.8, 0.5),
        )

        // Hero Sender & Warehouse Nodes
        nodes.push(
            circle(110, { fill: '#0d1528', stroke: COSMOS.blue, width: 4.2 }).at(SENDER_X, ACTOR_Y).glow(12, COSMOS.blue),
            txt('Sender', SENDER_X, ACTOR_Y - 14, 34, COSMOS.blue, 'serif'),
            txt(r2 > 0.05 ? 'retry!' : 'client', SENDER_X, ACTOR_Y + 32, 26, r2 > 0.05 ? COSMOS.amber : COSMOS.muted, 'mono'),
            circle(114, { fill: '#0d1528', stroke: shipped >= 2 ? COSMOS.rose : COSMOS.gold, width: 4.4 })
                .at(WH_X, ACTOR_Y)
                .glow(14, shipped >= 2 ? COSMOS.rose : COSMOS.gold),
            txt('Warehouse', WH_X, ACTOR_Y - 16, 32, shipped >= 2 ? COSMOS.rose : COSMOS.gold, 'serif'),
            txt(`d = ${shipped}`, WH_X, ACTOR_Y + 32, 30, shipped >= 2 ? COSMOS.rose : COSMOS.emerald, 'mono'),
        )

        // Packet 1: order #1
        if (r1 > 0.02) {
            const idx = Math.min(REQ_ARC.length - 1, Math.floor(r1 * (REQ_ARC.length - 1)))
            const trail = REQ_ARC.slice(0, Math.max(2, idx + 1))
            const head = REQ_ARC[idx]!
            const fade = r1 > 0.94 ? Math.max(0.25, 1 - (r1 - 0.94) * 12) : 1
            nodes.push(
                new Node(polyPath(trail)).stroke(COSMOS.gold, 4.4, 0.88 * fade).glow(10, COSMOS.gold).set('blend', 'screen'),
                dot(10, '#ffffff').at(head[0], head[1]).glow(16, COSMOS.gold).opacity(fade).set('blend', 'screen'),
            )
            if (r1 < 0.92) {
                nodes.push(txt('order #1', NET_X, ACTOR_Y - 190, 26, COSMOS.gold, 'mono').glow(6, COSMOS.gold))
            }
        }

        // Packet 2: teal ACK vanishes inside network storm
        if (al > 0.02) {
            const maxIdx = Math.floor(ACK_ARC.length * 0.52)
            const prog = Math.min(1, al / 0.62)
            const idx = Math.min(maxIdx, Math.floor(prog * maxIdx))
            const trail = ACK_ARC.slice(0, Math.max(2, idx + 1))
            const head = ACK_ARC[idx]!
            const aliveOp = al < 0.62 ? 1 : Math.max(0, 1 - (al - 0.62) * 3.5)
            nodes.push(
                new Node(polyPath(trail)).stroke(COSMOS.cyan, 4.0, 0.84 * Math.max(0.22, aliveOp)).glow(10, COSMOS.cyan).set('blend', 'screen'),
                dot(9.5, COSMOS.cyan).at(head[0], head[1]).glow(14, COSMOS.cyan).opacity(aliveOp).set('blend', 'screen'),
            )
            if (al >= 0.56) {
                const burst = Math.min(1, (al - 0.56) / 0.44)
                const fadeBurst = Math.max(0, 1 - burst * 0.85)
                nodes.push(
                    circle(22 + burst * 62, { fill: null, stroke: COSMOS.rose, width: 3.2 })
                        .at(head[0], head[1])
                        .opacity(fadeBurst)
                        .glow(10, COSMOS.rose)
                        .set('blend', 'screen'),
                )
                for (let k = 0; k < 8; k++) {
                    const ang = (k / 8) * Math.PI * 2 + 0.3
                    const d = 16 + burst * 72
                    nodes.push(
                        dot(4.5 * fadeBurst + 1, COSMOS.rose)
                            .at(head[0] + Math.cos(ang) * d, head[1] + Math.sin(ang) * d)
                            .glow(8, COSMOS.rose)
                            .opacity(fadeBurst)
                            .set('blend', 'screen'),
                    )
                }
                nodes.push(txt('ACK DROPPED!', NET_X, ACTOR_Y + 216, 28, COSMOS.rose, 'mono').glow(8, COSMOS.rose))
            } else {
                nodes.push(txt('ack #1', NET_X + 160, ACTOR_Y + 182, 26, COSMOS.cyan, 'mono'))
            }
        }

        // Packet 3: rose Retry -> Duplicate Shipment!
        if (r2 > 0.02) {
            const idx = Math.min(RETRY_ARC.length - 1, Math.floor(r2 * (RETRY_ARC.length - 1)))
            const trail = RETRY_ARC.slice(0, Math.max(2, idx + 1))
            const head = RETRY_ARC[idx]!
            nodes.push(
                new Node(polyPath(trail)).stroke(COSMOS.rose, 5.2, 0.96).glow(14, COSMOS.rose).set('blend', 'screen'),
                new Node(polyPath(trail)).stroke('#ffffff', 1.4, 0.55).set('blend', 'screen'),
                dot(11, '#ffffff').at(head[0], head[1]).glow(18, COSMOS.rose).set('blend', 'screen'),
                txt(
                    r2 > 0.86 ? 'DUPLICATE BOX SHIPPED!' : 'retry #1  ->  duplicate!',
                    NET_X,
                    ACTOR_Y - 228,
                    30,
                    COSMOS.rose,
                    'mono',
                ).glow(12, COSMOS.rose),
            )
        }

        // ── Bottom Unboxed 5-Step Glowing Constellation Timeline Rail ────────
        const railY = 315
        for (let i = 0; i < TRACE_STEPS.length; i++) {
            const step = TRACE_STEPS[i]!
            const active = i < stepCount
            if (i > 0) {
                const prev = TRACE_STEPS[i - 1]!
                nodes.push(
                    line([prev.x + 32, railY], [step.x - 32, railY], {
                        stroke: active ? step.col : '#25314d',
                        width: active ? 3.8 : 1.8,
                    })
                        .glow(active ? 10 : 0, step.col)
                        .opacity(active ? 0.95 : 0.45)
                        .set('blend', active ? 'screen' : 'normal'),
                )
            }
            nodes.push(
                circle(26, {
                    fill: active ? '#151c33' : '#0a0f1c',
                    stroke: active ? step.col : '#2a385c',
                    width: active ? 3.4 : 1.8,
                })
                    .at(step.x, railY)
                    .glow(active ? 12 : 0, step.col),
                txt(step.num, step.x, railY + 1, 26, active ? step.col : COSMOS.dim, 'mono'),
                txt(step.code, step.x, railY + 58, 28, active ? step.col : COSMOS.dim, 'mono').glow(active ? 6 : 0, step.col),
                txt(step.sub, step.x, railY + 96, 26, active ? COSMOS.ink : COSMOS.dim, 'sans'),
            )
        }

        return group(...nodes)
    })

    s.add(topTitle, liveStage)

    c.at(0.05, () => {
        s.play(storm.to(12.0, { duration: 12.2, ease: linear }))
    })
    c.at(0.05, () => {
        s.play(req1.to(1, { duration: 2.5 }))
    })
    c.on('acknowledgment', () => s.play(ackLost.to(1, { duration: 2.8 })))
    c.on('sender retries', () => s.play(retry.to(1, { duration: 2.5 })))
}

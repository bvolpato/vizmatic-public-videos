import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

// Cubic Bezier helper for packet arcs
function arcPts(p0: Vec, ctrl: Vec, p1: Vec, steps = 28): Vec[] {
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

const SENDER_X = -125
const NET_X = 295
const WH_X = 720
const ACTOR_Y = -125

const REQ_ARC = arcPts([SENDER_X + 98, ACTOR_Y - 26], [NET_X, ACTOR_Y - 190], [WH_X - 102, ACTOR_Y - 26], 36)
const ACK_ARC = arcPts([WH_X - 102, ACTOR_Y + 28], [NET_X + 35, ACTOR_Y + 135], [SENDER_X + 98, ACTOR_Y + 28], 36)
const RETRY_ARC = arcPts([SENDER_X + 98, ACTOR_Y - 40], [NET_X, ACTOR_Y - 228], [WH_X - 102, ACTOR_Y - 40], 36)

const TRACE_STEPS = [
    { x: -165, code: '1. Send', sub: 'order#1', col: COSMOS.gold },
    { x: 65, code: '2. Ship', sub: 'd = 1', col: COSMOS.emerald },
    { x: 295, code: '3. DropAck', sub: 'lost!', col: COSMOS.cyan },
    { x: 525, code: '4. Retry', sub: 'timeout', col: COSMOS.amber },
    { x: 755, code: '5. Ship!', sub: 'd = 2 BUG', col: COSMOS.rose },
] as const

export const protocol: SceneFunction = (s, c) => {
    const storm = s.value(0)
    const req1 = s.value(0)
    const ackLost = s.value(0)
    const retry = s.value(0)

    // ── Gold-standard left title block ───────────────────────────────────────
    const leftTitle = group(
        txt('PROOFS FOR REAL SYSTEMS  ·  EP 2 / 3', -855, -395, 26, COSMOS.gold, 'mono', 'left'),
        txt('TLA+ & the', -860, -296, 86, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.gold),
        txt('Five-Step Bug', -860, -196, 86, COSMOS.rose, 'serif', 'left').glow(9, COSMOS.rose),
        txt('Duplicate shipment under packet loss', -855, -104, 28, COSMOS.muted, 'sans', 'left'),
    )

    // ── Live Choreography + State-Tuple Panel + Message Trace ────────────────
    const liveStage = dynamic(() => {
        const st = storm.value
        const r1 = req1.value
        const al = ackLost.value
        const r2 = retry.value

        const shipped = r2 > 0.88 ? 2 : r1 > 0.88 ? 1 : 0
        const statusStr = r2 > 0.05 ? '"retrying"' : r1 > 0.05 ? '"waiting"' : '"idle"'
        const inFlightStr =
            r2 > 0.05 && r2 < 0.92
                ? '{"retry#1"}'
                : al > 0.05 && al < 0.62
                    ? '{"ack#1"}'
                    : r1 > 0.05 && r1 < 0.92
                        ? '{"order#1"}'
                        : '{}'
        const stepCount = r2 > 0.88 ? 5 : r2 > 0.08 ? 4 : al > 0.55 ? 3 : r1 > 0.88 ? 2 : r1 > 0.08 ? 1 : 0

        const nodes: Node[] = [
            // Atmospheric glows
            nebula(SENDER_X, ACTOR_Y, 220, '#60a5fa1c'),
            nebula(NET_X, ACTOR_Y, 240, al > 0.4 ? '#ff6b8b24' : '#5ce1e616'),
            nebula(WH_X, ACTOR_Y, 230, shipped >= 2 ? '#ff6b8b26' : '#ffd1661c'),
        ]

        // ── Left Live State-Tuple Panel (TLA+ variables) ─────────────────────
        const tupleBorder = shipped >= 2 ? COSMOS.rose : COSMOS.gold
        nodes.push(
            rect(520, 326, { fill: '#0c1222', stroke: tupleBorder, width: 2.5, radius: 18 })
                .at(-595, 168)
                .glow(shipped >= 2 ? 10 : 6, tupleBorder),
            txt('LIVE TLA+ STATE TUPLE', -828, 42, 26, COSMOS.gold, 'mono', 'left'),
            line([-832, 72], [-358, 72], { stroke: COSMOS.rule, width: 1.5 }),
            txt('status', -828, 114, 26, COSMOS.muted, 'mono', 'left'),
            txt(statusStr, -365, 114, 26, r2 > 0.05 ? COSMOS.amber : COSMOS.cyan, 'mono', 'right'),
            txt('inFlight', -828, 168, 26, COSMOS.muted, 'mono', 'left'),
            txt(inFlightStr, -365, 168, 26, al > 0.55 && r2 < 0.05 ? COSMOS.rose : COSMOS.gold, 'mono', 'right'),
            txt('shipped', -828, 222, 26, COSMOS.muted, 'mono', 'left'),
            txt(
                shipped >= 2 ? '2  (VIOLATION!)' : `${shipped}`,
                -365,
                222,
                26,
                shipped >= 2 ? COSMOS.rose : COSMOS.emerald,
                'mono',
                'right',
            ).glow(shipped >= 2 ? 8 : 4, shipped >= 2 ? COSMOS.rose : COSMOS.emerald),
            txt('receipts', -828, 276, 26, COSMOS.muted, 'mono', 'left'),
            txt('{}  (none)', -365, 276, 26, COSMOS.dim, 'mono', 'right'),
        )

        // ── Center Turbulent Unreliable Network Storm Zone ───────────────────
        nodes.push(
            rect(244, 218, { fill: '#120e1e', stroke: al > 0.45 ? COSMOS.rose : '#3a4a72', width: 2.2, radius: 22, dash: [10, 7] })
                .at(NET_X, ACTOR_Y + 16)
                .opacity(0.9),
            txt('UNRELIABLE NET', NET_X, ACTOR_Y - 66, 26, al > 0.45 ? COSMOS.rose : COSMOS.muted, 'mono'),
        )
        // Animated interference waves & packet-drop vortex rings inside network zone
        for (let k = 0; k < 5; k++) {
            const wy = ACTOR_Y - 26 + k * 27
            const wavePts: Vec[] = Array.from({ length: 18 }, (_, i) => {
                const frac = i / 17
                const wx = NET_X - 96 + frac * 192
                const amp = (al > 0.35 && al < 0.95 ? 11 : 5) * Math.sin(frac * Math.PI)
                return [wx, wy + Math.sin(frac * 10 - st * 4.5 + k * 1.4) * amp] as Vec
            })
            nodes.push(
                new Node(polyPath(wavePts))
                    .stroke(al > 0.45 ? COSMOS.rose : COSMOS.violet, 1.8, 0.45)
                    .set('blend', 'screen'),
            )
        }
        // Drifting storm sparks inside network
        for (let i = 0; i < 10; i++) {
            const ang = st * 1.6 + i * 0.628
            const rad = 28 + (i % 3) * 26
            const sx = NET_X + Math.cos(ang) * rad * 1.35
            const sy = ACTOR_Y + 12 + Math.sin(ang * 1.3) * rad * 0.7
            nodes.push(dot(2.8, i % 2 === 0 ? COSMOS.rose : COSMOS.cyan).at(sx, sy).opacity(0.6).set('blend', 'screen'))
        }

        // Faint guide rails for upper/lower arcs
        nodes.push(
            new Node(polyPath(REQ_ARC)).stroke('#25314d', 1.8, 0.55),
            new Node(polyPath(ACK_ARC)).stroke('#25314d', 1.8, 0.55),
        )

        // ── Sender & Warehouse Actor Nodes ───────────────────────────────────
        nodes.push(
            circle(94, { fill: '#10172b', stroke: COSMOS.blue, width: 3.8 }).at(SENDER_X, ACTOR_Y).glow(10, COSMOS.blue),
            txt('Sender', SENDER_X, ACTOR_Y - 12, 30, COSMOS.blue, 'serif'),
            txt(r2 > 0.05 ? 'retry!' : 'client', SENDER_X, ACTOR_Y + 28, 26, r2 > 0.05 ? COSMOS.amber : COSMOS.muted, 'mono'),
            circle(98, { fill: '#10172b', stroke: shipped >= 2 ? COSMOS.rose : COSMOS.gold, width: 4.0 })
                .at(WH_X, ACTOR_Y)
                .glow(12, shipped >= 2 ? COSMOS.rose : COSMOS.gold),
            txt('Warehouse', WH_X, ACTOR_Y - 16, 28, shipped >= 2 ? COSMOS.rose : COSMOS.gold, 'serif'),
            txt(`d = ${shipped}`, WH_X, ACTOR_Y + 28, 28, shipped >= 2 ? COSMOS.rose : COSMOS.emerald, 'mono'),
        )

        // ── Packet 1: order #1 (gold comet trail) ────────────────────────────
        if (r1 > 0.02) {
            const idx = Math.min(REQ_ARC.length - 1, Math.floor(r1 * (REQ_ARC.length - 1)))
            const trail = REQ_ARC.slice(0, Math.max(2, idx + 1))
            const head = REQ_ARC[idx]!
            const fade = r1 > 0.94 ? Math.max(0.25, 1 - (r1 - 0.94) * 12) : 1
            nodes.push(
                new Node(polyPath(trail)).stroke(COSMOS.gold, 4.0, 0.85 * fade).glow(10, COSMOS.gold).set('blend', 'screen'),
                dot(9.5, '#ffffff').at(head[0], head[1]).glow(16, COSMOS.gold).opacity(fade).set('blend', 'screen'),
            )
            if (r1 < 0.92) {
                nodes.push(txt('order #1', NET_X, ACTOR_Y - 210, 26, COSMOS.gold, 'mono').glow(6, COSMOS.gold))
            }
        }

        // ── Packet 2: teal ACK vanishes inside network storm! ────────────────
        if (al > 0.02) {
            const maxIdx = Math.floor(ACK_ARC.length * 0.52)
            const prog = Math.min(1, al / 0.62)
            const idx = Math.min(maxIdx, Math.floor(prog * maxIdx))
            const trail = ACK_ARC.slice(0, Math.max(2, idx + 1))
            const head = ACK_ARC[idx]!
            const aliveOp = al < 0.62 ? 1 : Math.max(0, 1 - (al - 0.62) * 3.5)
            nodes.push(
                new Node(polyPath(trail)).stroke(COSMOS.cyan, 3.8, 0.82 * Math.max(0.2, aliveOp)).glow(10, COSMOS.cyan).set('blend', 'screen'),
                dot(9, COSMOS.cyan).at(head[0], head[1]).glow(14, COSMOS.cyan).opacity(aliveOp).set('blend', 'screen'),
            )
            if (al >= 0.56) {
                const burst = Math.min(1, (al - 0.56) / 0.44)
                const fadeBurst = Math.max(0, 1 - burst * 0.85)
                nodes.push(
                    circle(18 + burst * 54, { fill: null, stroke: COSMOS.rose, width: 3.0 })
                        .at(head[0], head[1])
                        .opacity(fadeBurst)
                        .glow(10, COSMOS.rose)
                        .set('blend', 'screen'),
                )
                for (let k = 0; k < 8; k++) {
                    const ang = (k / 8) * Math.PI * 2 + 0.3
                    const d = 14 + burst * 64
                    nodes.push(
                        dot(4.2 * fadeBurst + 1, COSMOS.rose)
                            .at(head[0] + Math.cos(ang) * d, head[1] + Math.sin(ang) * d)
                            .glow(8, COSMOS.rose)
                            .opacity(fadeBurst)
                            .set('blend', 'screen'),
                    )
                }
                nodes.push(txt('ACK DROPPED!', NET_X, ACTOR_Y + 150, 26, COSMOS.rose, 'mono').glow(8, COSMOS.rose))
            } else {
                nodes.push(txt('ack #1', NET_X + 120, ACTOR_Y + 150, 26, COSMOS.cyan, 'mono'))
            }
        }

        // ── Packet 3: rose Retry -> Duplicate Shipment! ──────────────────────
        if (r2 > 0.02) {
            const idx = Math.min(RETRY_ARC.length - 1, Math.floor(r2 * (RETRY_ARC.length - 1)))
            const trail = RETRY_ARC.slice(0, Math.max(2, idx + 1))
            const head = RETRY_ARC[idx]!
            nodes.push(
                new Node(polyPath(trail)).stroke(COSMOS.rose, 4.6, 0.95).glow(12, COSMOS.rose).set('blend', 'screen'),
                dot(10, '#ffffff').at(head[0], head[1]).glow(16, COSMOS.rose).set('blend', 'screen'),
                txt(r2 > 0.86 ? 'DUPLICATE BOX SHIPPED!' : 'retry #1  ->  duplicate!', NET_X, ACTOR_Y - 246, 28, COSMOS.rose, 'mono').glow(10, COSMOS.rose),
            )
        }

        // ── Bottom-Right Live 5-Step Message Trace Panel ─────────────────────
        nodes.push(
            rect(1120, 212, { fill: '#0c1222', stroke: '#283554', width: 2.0, radius: 18 }).at(295, 224),
            txt('MESSAGE TRACE  (5-STEP INTERLEAVING)', -235, 152, 26, COSMOS.muted, 'mono', 'left'),
        )
        for (let i = 0; i < TRACE_STEPS.length; i++) {
            const step = TRACE_STEPS[i]!
            const active = i < stepCount
            if (i > 0) {
                const prev = TRACE_STEPS[i - 1]!
                nodes.push(
                    line([prev.x + 88, 240], [step.x - 88, 240], {
                        stroke: active ? step.col : '#25314d',
                        width: active ? 3.2 : 1.8,
                    })
                        .glow(active ? 8 : 0, step.col)
                        .opacity(active ? 0.95 : 0.45),
                )
            }
            nodes.push(
                rect(172, 92, {
                    fill: active ? '#151c33' : '#0a0f1c',
                    stroke: active ? step.col : '#25314d',
                    width: active ? 2.8 : 1.6,
                    radius: 12,
                })
                    .at(step.x, 240)
                    .glow(active ? 9 : 0, step.col)
                    .opacity(active ? 1 : 0.48),
                txt(step.code, step.x, 222, 26, active ? step.col : COSMOS.dim, 'mono'),
                txt(step.sub, step.x, 258, 26, active ? COSMOS.ink : COSMOS.dim, 'mono'),
            )
        }

        return group(...nodes)
    })

    s.add(leftTitle, liveStage)

    c.at(0.05, () => {
        s.play(storm.to(12.0, { duration: 12.2, ease: linear }))
    })
    c.at(0.05, () => {
        s.play(req1.to(1, { duration: 2.5 }))
    })
    c.on('acknowledgment', () => s.play(ackLost.to(1, { duration: 2.8 })))
    c.on('sender retries', () => s.play(retry.to(1, { duration: 2.5 })))
}

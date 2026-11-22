import {
    Node, circle, dot, dynamic, fadeIn, group, line, linear, polyPath, rect, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

// Split Safety (\square) vs Liveness (\lozenge) temporal loop diagram
const ORBIT_CX = -360
const ORBIT_CY = -52
const ORBIT_R = 166
const DONE_X = 580
const DONE_Y = -52

const ORBIT_STATES = [
    { ang: -Math.PI / 2, label: 'Send', col: COSMOS.gold },
    { ang: Math.PI / 6, label: 'DropAck', col: COSMOS.rose },
    { ang: (5 * Math.PI) / 6, label: 'Retry', col: COSMOS.amber },
] as const

const TRACE_Y = 236
const TRACE_XS = [-730, -520, -310, -100, 110, 320, 530, 740] as const

export const fairness: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const strong = s.value(0)

    const header = group(
        txt('Safety vs. Liveness & Fairness', 0, -422, 54, COSMOS.ink, 'serif').glow(6, COSMOS.gold),
        rect(540, 62, { fill: '#0b221e', stroke: COSMOS.emerald, width: 2, radius: 14 }).at(-360, -342),
        tex(String.raw`\text{Safety: }\; \square(\text{dispatches} \le 1)`, { size: 28, color: COSMOS.emerald }).at(-360, -342),
        rect(540, 62, { fill: '#221b0d', stroke: COSMOS.gold, width: 2, radius: 14 }).at(360, -342),
        tex(String.raw`\text{Liveness: }\; \lozenge(\text{status} = \text{Done})`, { size: 28, color: COSMOS.gold }).at(360, -342),
    )

    const sfRuleTex = tex(String.raw`\square\lozenge\text{En} \Rightarrow \square\lozenge\text{Taken}`, {
        size: 28,
        color: COSMOS.emerald,
    }).at(125, -186)

    const liveDiagram = dynamic(() => {
        const ph = phase.value
        const st = strong.value
        const orbitCol = st > 0.5 ? COSMOS.emerald : COSMOS.amber

        const nodes: Node[] = [
            nebula(ORBIT_CX, ORBIT_CY, 330, st > 0.5 ? '#6ee7b71a' : '#fb923c24'),
            nebula(DONE_X, DONE_Y, 280, st > 0.5 ? '#6ee7b728' : '#26304a1c'),
        ]

        // ── Left: Weak Fairness WF(Deliver) Trapped Amber Orbit ──────────────
        nodes.push(
            circle(ORBIT_R + 18, { fill: null, stroke: orbitCol, width: 1.8, dash: [12, 10] })
                .at(ORBIT_CX, ORBIT_CY)
                .opacity(0.45)
                .set('blend', 'screen'),
            circle(ORBIT_R, { fill: '#0c1120', stroke: orbitCol, width: 4.0 })
                .at(ORBIT_CX, ORBIT_CY)
                .glow(12, orbitCol),
            txt(st > 0.5 ? 'SF(Deliver)' : 'WF(Deliver)', ORBIT_CX, ORBIT_CY - 22, 32, orbitCol, 'mono').glow(6, orbitCol),
            txt(st > 0.5 ? 'Escapes loop!' : 'Trapped orbit', ORBIT_CX, ORBIT_CY + 24, 26, COSMOS.muted, 'sans'),
        )

        // Orbiting comet with fading tail around Send -> DropAck -> Retry
        const cometAng = ph * 1.45 - Math.PI / 2
        const tailPts: Vec[] = Array.from({ length: 16 }, (_, i) => {
            const a = cometAng - i * 0.085
            return [ORBIT_CX + Math.cos(a) * ORBIT_R, ORBIT_CY + Math.sin(a) * ORBIT_R] as Vec
        })
        nodes.push(
            new Node(polyPath(tailPts))
                .stroke(orbitCol, 6.0, st > 0.5 ? 0.35 : 0.9)
                .glow(12, orbitCol)
                .set('blend', 'screen'),
            dot(9, '#ffffff')
                .at(tailPts[0]![0], tailPts[0]![1])
                .glow(14, orbitCol)
                .opacity(st > 0.5 ? 0.45 : 1)
                .set('blend', 'screen'),
        )

        // 3 state pills pinned on the orbit ring
        for (const os of ORBIT_STATES) {
            const nx = ORBIT_CX + Math.cos(os.ang) * ORBIT_R
            const ny = ORBIT_CY + Math.sin(os.ang) * ORBIT_R
            nodes.push(
                rect(144, 48, { fill: '#10172b', stroke: os.col, width: 2.6, radius: 24 })
                    .at(nx, ny)
                    .glow(8, os.col),
                txt(os.label, nx, ny, 26, os.col, 'mono'),
            )
        }

        // ── Center Bridge: SF(Deliver) Emerald Escape Beam ───────────────────
        const bridgeX0 = ORBIT_CX + ORBIT_R + 12
        const bridgeX1 = DONE_X - 134
        if (st > 0.05) {
            nodes.push(
                line([bridgeX0, ORBIT_CY], [bridgeX1, DONE_Y], { stroke: COSMOS.emerald, width: 7.0 })
                    .opacity(0.95 * st)
                    .glow(16, COSMOS.emerald)
                    .set('blend', 'screen'),
                line([bridgeX0, ORBIT_CY], [bridgeX1, DONE_Y], { stroke: '#ffffff', width: 2.0 })
                    .opacity(0.85 * st),
                // Arrow head into Delivered
                line([bridgeX1 - 22, DONE_Y - 16], [bridgeX1, DONE_Y], { stroke: COSMOS.emerald, width: 4.5 }).opacity(st).glow(10, COSMOS.emerald),
                line([bridgeX1 - 22, DONE_Y + 16], [bridgeX1, DONE_Y], { stroke: COSMOS.emerald, width: 4.5 }).opacity(st).glow(10, COSMOS.emerald),
            )
            // 3 traveling emerald escape pulses shooting across the beam (drawn BEFORE the center pill!)
            for (let k = 0; k < 3; k++) {
                const u = ((ph * 0.85 + k * 0.33) % 1)
                const px = bridgeX0 + u * (bridgeX1 - bridgeX0)
                nodes.push(dot(8, '#ffffff').at(px, DONE_Y).glow(14, COSMOS.emerald).opacity(st).set('blend', 'screen'))
            }
            nodes.push(
                rect(224, 52, { fill: '#0b2b22', stroke: COSMOS.emerald, width: 2.6, radius: 14 })
                    .at(125, ORBIT_CY)
                    .glow(12, COSMOS.emerald)
                    .opacity(st),
                txt('SF(Deliver)', 125, ORBIT_CY, 28, COSMOS.emerald, 'mono').opacity(st),
            )
        } else {
            nodes.push(
                line([bridgeX0, ORBIT_CY], [bridgeX1, DONE_Y], { stroke: '#323f60', width: 2.6, dash: [10, 10] }),
                rect(246, 52, { fill: '#1b141a', stroke: COSMOS.rose, width: 2.2, radius: 14 }).at(125, ORBIT_CY),
                txt('Deliver starved', 125, ORBIT_CY, 26, COSMOS.rose, 'mono'),
            )
        }

        // ── Right: Absorbing Delivered / Done State ──────────────────────────
        const doneCol = st > 0.5 ? COSMOS.emerald : '#39486b'
        nodes.push(
            circle(124 + (st > 0.5 ? Math.sin(ph * 3.5) * 6 : 0), { fill: null, stroke: doneCol, width: 2.5 })
                .at(DONE_X, DONE_Y)
                .opacity(st > 0.5 ? 0.85 : 0.35)
                .glow(st > 0.5 ? 12 : 0, COSMOS.emerald),
            circle(104, { fill: st > 0.5 ? '#0b2822' : '#0d1322', stroke: doneCol, width: 4.2 })
                .at(DONE_X, DONE_Y)
                .glow(st > 0.5 ? 16 : 0, COSMOS.emerald),
            txt('Delivered', DONE_X, DONE_Y - 18, 32, st > 0.5 ? COSMOS.emerald : COSMOS.dim, 'serif'),
            txt(st > 0.5 ? 'Done ✓' : 'unreachable', DONE_X, DONE_Y + 26, 26, st > 0.5 ? '#ffffff' : COSMOS.dim, 'mono'),
        )

        // ── Bottom: Infinite Horizontal Temporal Trace ───────────────────────
        nodes.push(
            rect(1680, 134, { fill: '#0b1020', stroke: st > 0.5 ? COSMOS.emerald : COSMOS.amber, width: 2.2, radius: 16 })
                .at(0, TRACE_Y),
            txt(
                st > 0.5 ? 'STRONG FAIRNESS TRACE:  EVENTUALLY REACHES DONE ✓' : 'WEAK FAIRNESS TRACE:  INFINITE RETRY LOOP  (NEVER HITS DONE)',
                -806,
                TRACE_Y - 38,
                26,
                st > 0.5 ? COSMOS.emerald : COSMOS.amber,
                'mono',
                'left',
            ),
        )

        const wfSeq = ['Send', 'Drop', 'Retry', 'Drop', 'Retry', 'Drop', 'Retry', '... ∞'] as const
        const sfSeq = ['Send', 'Drop', 'Retry', 'Drop', 'Retry', 'Deliver!', 'DONE ✓', 'DONE ✓'] as const
        const seq = st > 0.5 ? sfSeq : wfSeq
        const activeHead = Math.floor(ph * 2.2) % TRACE_XS.length

        for (let i = 0; i < TRACE_XS.length; i++) {
            const x = TRACE_XS[i]!
            const label = seq[i]!
            const isDone = st > 0.5 && i >= 5
            const isPulse = i === activeHead
            const col = isDone ? COSMOS.emerald : label === 'Drop' ? COSMOS.rose : COSMOS.amber
            if (i > 0) {
                nodes.push(
                    line([TRACE_XS[i - 1]! + 72, TRACE_Y + 20], [x - 72, TRACE_Y + 20], {
                        stroke: isDone ? COSMOS.emerald : '#344263',
                        width: isDone ? 3.0 : 2.0,
                    }),
                )
            }
            nodes.push(
                rect(142, 46, {
                    fill: isDone ? '#0b2b22' : '#12192e',
                    stroke: col,
                    width: isPulse || isDone ? 2.8 : 1.6,
                    radius: 10,
                })
                    .at(x, TRACE_Y + 20)
                    .glow(isPulse || isDone ? 9 : 0, col),
                txt(label, x, TRACE_Y + 20, 26, col, 'mono'),
            )
        }

        return group(...nodes)
    })

    const nextTeaser = txt('Next: Episode 3 — Lean 4: Inside a Machine-Checked Proof', 0, 366, 28, COSMOS.cyan, 'mono')
        .glow(6, COSMOS.cyan)

    s.add(header, liveDiagram)

    c.at(0.05, () => s.play(phase.to(15.0, { duration: 20.5, ease: linear })))
    c.show('strong fairness', sfRuleTex)
    c.on('strong fairness', () => s.play(strong.to(1, { duration: 1.0 })))
    c.show('Episode 3', nextTeaser)
}

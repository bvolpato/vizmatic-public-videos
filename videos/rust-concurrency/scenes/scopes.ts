import { Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, type SceneFunction, type Vec } from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

export const scopes: SceneFunction = (s, c) => {
    const showScope = s.value(1)
    const beamProg = s.value(0)
    const showChan = s.value(0)
    const fillLevel = s.value(0)
    const flowPhase = s.value(0)

    const scopeCopy = group(
        txt('std::thread::scope', 0, -395, 64, COSMOS.cyan, 'serif').glow(6, COSMOS.cyan),
        txt('Structured join barrier — 4 threads mutate disjoint stack slices in place', 0, -320, 30, COSMOS.muted, 'sans'),
        txt('Zero Arc · Zero copies · Zero locks', 0, 395, 32, COSMOS.emerald, 'mono'),
    )

    const SLICE_COLS = [COSMOS.cyan, COSMOS.blue, COSMOS.violet, COSMOS.gold] as const
    const liveScope = dynamic(() => {
        if (showScope.value < 0.02) return []
        const a = showScope.value
        const p = beamProg.value
        const xEnd = -660 + p * 1320
        const nodes: Node[] = [
            // Start & join barrier glowing vertical rails
            line([-660, -220], [-660, 260], { stroke: COSMOS.gold, width: 3.5 }).glow(8, COSMOS.gold).opacity(a),
            line([660, -220], [660, 260], { stroke: COSMOS.emerald, width: 3.5 }).glow(8, COSMOS.emerald).opacity(a),
            txt('scope start', -660, 305, 26, COSMOS.gold, 'mono').opacity(a),
            txt('guaranteed join', 660, 305, 26, COSMOS.emerald, 'mono').opacity(a),
        ]
        for (let i = 0; i < 4; i++) {
            const y = -150 + i * 110
            const col = SLICE_COLS[i]!
            const end = Math.min(660, xEnd - i * 35)
            if (end > -655) {
                const pts: Vec[] = [[-660, y], [end, y]]
                nodes.push(
                    new Node(polyPath(pts)).stroke(col, 6, 0.9 * a).glow(10, col),
                    dot(9, '#ffffff').at(end, y).glow(12, col).opacity(a),
                )
            }
            nodes.push(txt(`&mut [w${i + 1}]`, -700, y, 26, col, 'mono', 'right').opacity(a))
        }
        return group(...nodes)
    })

    // Stage 2: Flowing ownership stream through a glowing 4-slot backpressure ring
    const chanCopy = group(
        txt('Pass Ownership, Not Locks', 0, -395, 64, COSMOS.ink, 'serif').glow(6, COSMOS.amber),
        txt('Bounded channel backpressure + clean drain when senders drop', 0, -320, 30, COSMOS.muted, 'sans'),
        txt('Producer', -680, -110, 34, COSMOS.amber, 'serif'),
        txt('tx.send(event)', -680, 125, 26, COSMOS.amber, 'mono'),
        txt('Consumer', 680, -110, 34, COSMOS.emerald, 'serif'),
        txt('for ev in rx', 680, 125, 26, COSMOS.emerald, 'mono'),
    )

    const liveChan = dynamic(() => {
        if (showChan.value < 0.02) return []
        const a = showChan.value
        const filled = Math.round(fillLevel.value)
        const ph = flowPhase.value
        const grad = linearGradient([-580, 0], [580, 0], [COSMOS.amber, COSMOS.cyan, COSMOS.emerald])
        const nodes: Node[] = [
            new Node(polyPath([[-580, 0], [580, 0]])).stroke(grad, 3, 0.55 * a),
            circle(54, { fill: '#12182b', stroke: COSMOS.amber, width: 3.5 }).at(-680, 0).glow(10, COSMOS.amber).opacity(a),
            circle(54, { fill: '#12182b', stroke: COSMOS.emerald, width: 3.5 }).at(680, 0).glow(10, COSMOS.emerald).opacity(a),
        ]
        for (let i = 0; i < 4; i++) {
            const x = -225 + i * 150
            const active = i < filled
            const col = filled === 4 ? COSMOS.gold : COSMOS.cyan
            nodes.push(
                circle(44, { fill: active ? '#1b2638' : '#0f1422', stroke: active ? col : '#2a3550', width: active ? 4 : 2 }).at(x, 0).opacity(a).glow(active ? 10 : 0, col),
                txt(active ? `e${i + 1}` : '·', x, 0, 28, active ? col : '#475575', 'mono').opacity(a),
            )
        }
        if (filled > 0 && filled < 4) {
            const px = -560 + ((ph * 260) % 280)
            nodes.push(dot(8, COSMOS.gold).at(px, 0).glow(12, COSMOS.gold).opacity(a))
        }
        const status = filled === 4 ? 'BUFFER FULL (4/4) — NATURAL BACKPRESSURE' : filled === 0 ? 'ALL SENDERS DROPPED — CLEAN DRAIN' : `OWNED EVENTS IN FLIGHT (${filled}/4)`
        nodes.push(txt(status, 0, 240, 28, filled === 4 ? COSMOS.gold : COSMOS.emerald, 'mono').opacity(a))
        return group(...nodes)
    })

    s.add(scopeCopy, liveScope)
    c.on('Switch to thread scope', () => s.play(beamProg.to(1.12, { duration: 4.0 })))

    c.on('When threads coordinate', () => {
        s.play(showScope.to(0, { duration: 0.35 }))
        s.play(showChan.to(1, { duration: 0.35 }))
        s.play(fillLevel.to(2, { duration: 1.4 }))
    })
    c.at(12, () => s.play(flowPhase.to(8, { duration: 10, ease: linear })))
    c.swap('When threads coordinate', scopeCopy, chanCopy)
    s.add(liveChan)
    c.on('Once full', () => s.play(fillLevel.to(4, { duration: 1.2 })))
    c.on('drains and exits', () => s.play(fillLevel.to(0, { duration: 1.6 })))
}

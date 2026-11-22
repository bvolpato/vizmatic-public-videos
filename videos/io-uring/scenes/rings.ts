import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const rings: SceneFunction = (s, c) => {
    const spin = s.value(0)
    const releasePulse = s.value(0)
    const cqPulse = s.value(0)

    const header = group(
        txt('LOCK-FREE SHARED MEMORY ENGINE', 0, -425, 26, COSMOS.gold, 'mono'),
        txt('Twin Ring Buffers: SQ & CQ', 0, -360, 56, COSMOS.ink, 'serif').glow(5, COSMOS.gold),
        line([-840, -15], [840, -15], { stroke: '#2c3d62', width: 2.5, dash: [12, 10] }),
        txt('USER SPACE  (produces SQ tail · consumes CQ head)', -835, -280, 26, COSMOS.cyan, 'mono', 'left'),
        txt('LINUX KERNEL  (consumes SQ head · produces CQ tail)', -835, 232, 26, COSMOS.amber, 'mono', 'left'),
    )

    const SLOTS = 16
    const liveRings = dynamic(() => {
        const ph = spin.value
        const rel = releasePulse.value
        const cqp = cqPulse.value
        const R = 188
        const cy = -15
        const sqCx = -385
        const cqCx = 385

        // Head / tail angles advancing smoothly around both 16-slot rings
        const sqHeadIdx = (ph * 2.2) % SLOTS
        const sqTailIdx = (sqHeadIdx + 5.2) % SLOTS
        const cqHeadIdx = (ph * 2.2 + 12.0) % SLOTS
        const cqTailIdx = (cqHeadIdx + 4.8) % SLOTS

        const idxAngle = (idx: number) => (idx * Math.PI * 2) / SLOTS - Math.PI / 2
        const sqHeadA = idxAngle(sqHeadIdx)
        const sqTailA = idxAngle(sqTailIdx)
        const cqHeadA = idxAngle(cqHeadIdx)
        const cqTailA = idxAngle(cqTailIdx)

        const nodes: Node[] = [
            nebula(sqCx, cy, 340, '#ffd16622'),
            nebula(cqCx, cy, 340, '#6ee7b722'),
            // SQ ring housing
            circle(R, { fill: '#0c1322', stroke: COSMOS.gold, width: 4 }).at(sqCx, cy).glow(10, COSMOS.gold),
            circle(R - 56, { fill: '#070910', stroke: '#293554', width: 2 }).at(sqCx, cy),
            txt('SQ', sqCx, cy - 16, 40, COSMOS.gold, 'mono'),
            txt('64 B SQE', sqCx, cy + 26, 26, COSMOS.muted, 'mono'),

            // CQ ring housing
            circle(R, { fill: '#0c1322', stroke: COSMOS.emerald, width: 4 }).at(cqCx, cy).glow(10, COSMOS.emerald),
            circle(R - 56, { fill: '#070910', stroke: '#293554', width: 2 }).at(cqCx, cy),
            txt('CQ', cqCx, cy - 16, 40, COSMOS.emerald, 'mono'),
            txt('16 B CQE', cqCx, cy + 26, 26, COSMOS.muted, 'mono'),
        ]

        // 16 discrete ring slots around both SQ and CQ
        for (let i = 0; i < SLOTS; i++) {
            const a = idxAngle(i)
            const rMid = R - 28
            const sqDist = ((i - sqHeadIdx) % SLOTS + SLOTS) % SLOTS
            const cqDist = ((i - cqHeadIdx) % SLOTS + SLOTS) % SLOTS
            const activeSQ = sqDist < 5.2
            const activeCQ = cqDist < 4.8

            nodes.push(
                dot(activeSQ ? 9.5 : 4.2, activeSQ ? COSMOS.gold : '#2b3857')
                    .at(sqCx + Math.cos(a) * rMid, cy + Math.sin(a) * rMid)
                    .glow(activeSQ ? 12 : 0, COSMOS.gold),
                dot(activeCQ ? 9.5 : 4.2, activeCQ ? COSMOS.emerald : '#2b3857')
                    .at(cqCx + Math.cos(a) * rMid, cy + Math.sin(a) * rMid)
                    .glow(activeCQ ? 12 : 0, COSMOS.emerald),
            )
        }

        // Rotating mechanical head/tail needles on SQ and CQ (color-coded to fixed perimeter badges so strokes never cross text!)
        const addNeedle = (cx: number, ang: number, col: string) => {
            const innerR = R - 54
            const tipR = R + 16
            nodes.push(
                line([cx + Math.cos(ang) * innerR, cy + Math.sin(ang) * innerR], [cx + Math.cos(ang) * tipR, cy + Math.sin(ang) * tipR], {
                    stroke: col,
                    width: 5,
                }).glow(10, col),
                dot(8, '#ffffff').at(cx + Math.cos(ang) * tipR, cy + Math.sin(ang) * tipR).glow(12, col),
            )
        }

        addNeedle(sqCx, sqTailA, COSMOS.cyan)
        addNeedle(sqCx, sqHeadA, COSMOS.amber)
        addNeedle(cqCx, cqTailA, COSMOS.amber)
        addNeedle(cqCx, cqHeadA, COSMOS.emerald)

        // Clean fixed needle legend callouts clear of rings, midline, and flow arcs
        nodes.push(
            txt(`SQ tail = ${Math.floor(sqTailIdx)}`, sqCx - 295, cy - 210, 26, COSMOS.cyan, 'mono', 'left'),
            txt(`SQ head = ${Math.floor(sqHeadIdx)}`, sqCx - 295, cy + 205, 26, COSMOS.amber, 'mono', 'left'),
            txt(`CQ head = ${Math.floor(cqHeadIdx)}`, cqCx + 295, cy - 210, 26, COSMOS.emerald, 'mono', 'right'),
            txt(`CQ tail = ${Math.floor(cqTailIdx)}`, cqCx + 295, cy + 205, 26, COSMOS.amber, 'mono', 'right'),
        )

        // Continuous luminous kernel-execution flow arc: SQ bottom -> Kernel Engine -> CQ bottom
        const kArc: Vec[] = Array.from({ length: 28 }, (_, i) => {
            const t = i / 27
            const x = sqCx + 155 + t * (cqCx - sqCx - 310)
            const y = cy + 95 + Math.sin(t * Math.PI) * 72
            return [x, y] as Vec
        })
        const kU = (ph * 0.65) % 1
        const kx = sqCx + 155 + kU * (cqCx - sqCx - 310)
        const ky = cy + 95 + Math.sin(kU * Math.PI) * 72
        nodes.push(
            new Node(polyPath(kArc)).stroke(COSMOS.amber, 4, 0.85).glow(10, COSMOS.amber),
            dot(9, '#ffffff').at(kx, ky).glow(14, COSMOS.amber),
            txt('Kernel executes I/O', 0, cy + 205, 26, COSMOS.amber, 'mono'),
        )

        // User-space completion readback arc across top: CQ top -> App -> SQ top
        const uArc: Vec[] = Array.from({ length: 28 }, (_, i) => {
            const t = i / 27
            const x = cqCx - 155 - t * (cqCx - sqCx - 310)
            const y = cy - 95 - Math.sin(t * Math.PI) * 85
            return [x, y] as Vec
        })
        const uU = (ph * 0.65 + 0.5) % 1
        const ux = cqCx - 155 - uU * (cqCx - sqCx - 310)
        const uy = cy - 95 - Math.sin(uU * Math.PI) * 85
        nodes.push(
            new Node(polyPath(uArc)).stroke(COSMOS.cyan, 3.5, 0.8).glow(9, COSMOS.cyan),
            dot(8.5, '#ffffff').at(ux, uy).glow(14, COSMOS.cyan),
            txt('smp_store_release / load_acquire', 0, cy - 212, 26, rel > 0.2 ? COSMOS.gold : COSMOS.cyan, 'mono')
                .glow(rel > 0.2 ? 10 : 4, COSMOS.gold),
        )

        // Explicit 64B SQE & 16B CQE byte-field layout strips along bottom (y = 330)
        const stripY = 335
        const sqeSegs = [
            { txt: 'op', w: 82, col: COSMOS.gold },
            { txt: 'fd', w: 82, col: COSMOS.amber },
            { txt: 'off', w: 120, col: COSMOS.cyan },
            { txt: 'addr', w: 145, col: COSMOS.blue },
            { txt: 'len', w: 100, col: COSMOS.violet },
            { txt: 'user_data', w: 195, col: COSMOS.emerald },
        ] as const
        let curX = -835
        nodes.push(txt('64 B SQE Layout', -835, stripY - 52, 26, COSMOS.gold, 'mono', 'left'))
        for (const sg of sqeSegs) {
            nodes.push(
                rect(sg.w - 6, 56, { fill: '#10182b', stroke: sg.col, width: 2.2, radius: 7 }).at(curX + sg.w / 2, stripY),
                txt(sg.txt, curX + sg.w / 2, stripY, 26, sg.col, 'mono'),
            )
            curX += sg.w
        }

        const cqeSegs = [
            { txt: 'user_data (8B)', w: 265, col: COSMOS.emerald },
            { txt: 'res (4B)', w: 155, col: COSMOS.cyan },
            { txt: 'flags (4B)', w: 175, col: COSMOS.gold },
        ] as const
        let cX = 240
        nodes.push(txt('16 B CQE Layout', 240, stripY - 52, 26, COSMOS.emerald, 'mono', 'left'))
        for (const sg of cqeSegs) {
            nodes.push(
                rect(sg.w - 6, 56, { fill: '#0f2022', stroke: sg.col, width: 2.2 + cqp * 0.8, radius: 7 })
                    .at(cX + sg.w / 2, stripY)
                    .glow(cqp * 6, sg.col),
                txt(sg.txt, cX + sg.w / 2, stripY, 26, sg.col, 'mono'),
            )
            cX += sg.w
        }

        return group(...nodes)
    })

    s.add(header, liveRings)
    const fullDur = Math.max(10, c.end - c.start - 0.1)
    c.at(0.05, () => s.play(spin.to(fullDur * 0.34, { duration: fullDur, ease: linear })))
    c.on('release store', () => s.play(releasePulse.to(1, { duration: 0.7 })))
    c.on('completion entry', () => s.play(cqPulse.to(1, { duration: 0.8 })))
}

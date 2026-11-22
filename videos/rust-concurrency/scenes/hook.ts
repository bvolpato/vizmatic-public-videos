import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, rect, regularPolygon,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

const BASE_BYTES = ['4A', '1F', '00', '8C', 'E2', '7B', '11', '90', 'C4', '3D', 'A5', '08', 'FF', '62', '19', 'D0'] as const
const TEAR_BYTES = ['??', 'E9', 'XX', '1B', '??', '0F', 'FA', '??', '7E', 'XX', '00', 'B3', '??', '4D', 'XX', '88'] as const

export const hook: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const collide = s.value(0)
    const shield = s.value(0)
    const ruleMode = s.value(0)

    const topHeadline = group(
        txt('ZERO DATA RACES AT COMPILE TIME', 0, -425, 26, COSMOS.gold, 'mono'),
        txt('One rule prevents the entire bug class', 0, -358, 60, COSMOS.ink, 'serif').glow(5, COSMOS.blue),
    )

    const liveStrip = dynamic(() => {
        const ph = phase.value
        const colU = collide.value
        const sh = shield.value
        const rm = ruleMode.value
        const tearing = colU > 0.35 && sh < 0.65
        const tearAmp = tearing ? Math.min(1, (colU - 0.35) / 0.35) * (1 - sh) : 0

        const stripY = -75
        const cellW = 86
        const totalW = cellW * 16
        const startX = -totalW / 2 + cellW / 2
        const nodes: Node[] = [
            nebula(0, stripY, 460, sh > 0.35 ? '#5ce1e622' : '#ff6b8b28', '#ffd16610'),
            // Outer 64-byte cache line chassis
            rect(totalW + 44, 140, {
                fill: '#0d1324',
                stroke: sh > 0.4 ? COSMOS.emerald : tearAmp > 0.2 ? COSMOS.rose : COSMOS.rule,
                width: sh > 0.4 ? 3.5 : 2.5,
                radius: 14,
            }).at(0, stripY).glow(sh > 0.4 ? 10 : tearAmp * 12, sh > 0.4 ? COSMOS.emerald : COSMOS.rose),
            txt('CACHE LINE  0x7ff8  (64 BYTES)', -totalW / 2 - 8, stripY - 94, 26, sh > 0.4 ? COSMOS.emerald : COSMOS.muted, 'mono', 'left'),
            txt(
                sh > 0.4 ? 'BORROW CHECKER VERIFIED' : tearAmp > 0.2 ? 'UNSYNCHRONIZED WRITE TORN!' : 'CONTENDED MEMORY',
                totalW / 2 + 8,
                stripY - 94,
                26,
                sh > 0.4 ? COSMOS.emerald : COSMOS.rose,
                'mono',
                'right',
            ),
        ]

        // 16 live byte chunks (4 bytes per slot = 64B cache line)
        for (let i = 0; i < 16; i++) {
            const bx = startX + i * cellW
            const corrupt = tearAmp > 0.1 && ((i + Math.floor(ph * 14)) % 3 === 0 || (i >= 5 && i <= 10))
            const jitterY = corrupt ? Math.sin(ph * 48 + i * 2.1) * 5.5 * tearAmp : 0
            const borderCol = sh > 0.4
                ? (i % 2 === 0 ? COSMOS.cyan : COSMOS.emerald)
                : corrupt ? COSMOS.rose : '#293757'
            const fillCol = corrupt ? '#2b1020' : sh > 0.4 ? '#0f2030' : '#12192e'
            const valText = corrupt && Math.sin(ph * 36 + i * 3.7) > 0 ? TEAR_BYTES[i]! : BASE_BYTES[i]!

            nodes.push(
                rect(cellW - 8, 86, { fill: fillCol, stroke: borderCol, width: corrupt ? 2.5 : 1.8, radius: 7 })
                    .at(bx, stripY + jitterY),
                txt(valText, bx, stripY + jitterY, 26, corrupt ? COSMOS.rose : sh > 0.4 ? COSMOS.ink : COSMOS.muted, 'mono'),
            )
        }

        // Competing Thread 1 & Thread 2 instruction streams slamming into the cache line
        if (sh < 0.92) {
            const op = 1 - sh
            const t1X = -780 + Math.min(1, colU) * 695
            const t2X = 780 - Math.min(1, colU) * 695
            const t1Y = stripY - 175
            const t2Y = stripY - 175
            const hit1: Vec = [t1X, stripY - 68]
            const hit2: Vec = [t2X, stripY - 68]

            nodes.push(
                new Node(polyPath([[-780, t1Y], [t1X, t1Y], hit1])).stroke(COSMOS.blue, 4.5, 0.92 * op).glow(10, COSMOS.blue),
                new Node(polyPath([[780, t2Y], [t2X, t2Y], hit2])).stroke(COSMOS.rose, 4.5, 0.92 * op).glow(10, COSMOS.rose),
                dot(10, '#ffffff').at(hit1[0], hit1[1]).glow(14, COSMOS.blue).opacity(op),
                dot(10, '#ffffff').at(hit2[0], hit2[1]).glow(14, COSMOS.rose).opacity(op),
                txt('Thread 1: WRITE [0x7ff8]', -770, t1Y - 34, 26, COSMOS.blue, 'mono', 'left').opacity(op),
                txt('Thread 2: WRITE [0x7ff8]', 770, t2Y - 34, 26, COSMOS.rose, 'mono', 'right').opacity(op),
            )

            // Rose glitch sparks flying out of the torn cache line
            if (tearAmp > 0.1) {
                for (let k = 0; k < 14; k++) {
                    const ang = (k / 14) * Math.PI * 2 + ph * 5.2
                    const dist = 42 + ((ph * 180 + k * 29) % 135)
                    const sx = Math.cos(ang) * dist * 1.4
                    const sy = stripY + Math.sin(ang) * dist * 0.55
                    const ex = sx + Math.cos(ang) * 26
                    const ey = sy + Math.sin(ang) * 18
                    nodes.push(
                        line([sx, sy], [ex, ey], { stroke: k % 2 === 0 ? COSMOS.rose : COSMOS.amber, width: 3 })
                            .opacity(tearAmp * 0.85)
                            .glow(8, COSMOS.rose)
                            ,
                    )
                }
            }
        }

        // Borrow checker golden shield sweep wave when Rust eliminates the class
        if (sh > 0.04) {
            const sweepX = -760 + Math.min(1, sh) * 1520
            if (sh < 0.98) {
                nodes.push(
                    line([sweepX, stripY - 110], [sweepX, stripY + 110], { stroke: COSMOS.gold, width: 5 })
                        .glow(16, COSMOS.gold)
                        .opacity(Math.sin(sh * Math.PI))
                        ,
                )
            }
            // Crisp cyan fan-out rays on left vs exclusive gold lock on right
            const panelOp = Math.max(0.22 * sh, rm)
            // Left: &T shared reader fan-out rays from memory strip downward
            const rSrc: Vec = [-380, stripY + 72]
            const readerXs = [-680, -530, -380, -230, -80]
            for (let i = 0; i < readerXs.length; i++) {
                const rx = readerXs[i]!
                const pulse = (ph * 0.9 + i * 0.19) % 1
                const px = rSrc[0] + (rx - rSrc[0]) * pulse
                const py = rSrc[1] + (215 - rSrc[1]) * pulse
                nodes.push(
                    line(rSrc, [rx, 215], { stroke: COSMOS.cyan, width: 2.8 }).opacity(0.75 * panelOp).glow(8, COSMOS.cyan),
                    dot(6.5, '#ffffff').at(px, py).opacity(panelOp).glow(10, COSMOS.cyan),
                    circle(14, { fill: '#0e1d2c', stroke: COSMOS.cyan, width: 2.4 }).at(rx, 215).opacity(panelOp).glow(6, COSMOS.cyan),
                )
            }
            nodes.push(
                txt('&T  ·  &T  ·  &T', -380, 278, 42, COSMOS.cyan, 'mono').glow(7, COSMOS.cyan).opacity(panelOp),
                txt('Many shared readers simultaneously', -380, 336, 26, COSMOS.muted, 'sans').opacity(panelOp),
            )

            // Center XOR divider
            nodes.push(
                regularPolygon(6, 46, { fill: '#14192a', stroke: COSMOS.gold, width: 3 }).at(0, 255).glow(10, COSMOS.gold).opacity(panelOp),
                txt('XOR', 0, 255, 28, COSMOS.gold, 'mono').opacity(panelOp),
            )

            // Right: exclusive &mut T lock beam
            const wSrc: Vec = [380, stripY + 72]
            const pulseW = (ph * 0.75) % 1
            nodes.push(
                line(wSrc, [380, 195], { stroke: COSMOS.gold, width: 6 }).opacity(0.95 * panelOp).glow(14, COSMOS.gold),
                dot(9, '#ffffff').at(380, wSrc[1] + (195 - wSrc[1]) * pulseW).opacity(panelOp).glow(14, COSMOS.gold),
                regularPolygon(6, 40, { fill: '#221a10', stroke: COSMOS.amber, width: 3.5 }).at(380, 195).opacity(panelOp).glow(10, COSMOS.amber),
                txt('&mut T', 380, 278, 44, COSMOS.amber, 'mono').glow(8, COSMOS.amber).opacity(panelOp),
                txt('One exclusive writer · never both', 380, 336, 26, COSMOS.muted, 'sans').opacity(panelOp),
            )
        }

        return group(...nodes)
    })

    s.add(liveStrip, topHeadline)
    const totalDur = Math.max(8, c.end - c.start - 0.15)
    c.at(0.05, () => {
        s.play(
            phase.to(totalDur * 0.65, { duration: totalDur, ease: linear }),
            collide.to(1, { duration: 2.6 }),
        )
    })
    c.on('eliminates the entire class', () => s.play(shield.to(1, { duration: 0.9 })))
    c.on('many shared readers', () => s.play(ruleMode.to(1, { duration: 0.7 })))
}

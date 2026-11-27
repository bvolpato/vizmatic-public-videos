import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// 6 x 4 grid of glowing 4 KB pages inside Block A (left) and Block B (right, fresh block during FTL/GC)
const STALE_CELLS = new Set([1, 4, 6, 9, 11, 13, 15, 18, 20, 22])
const LIVE_CELLS = [0, 2, 3, 5, 7, 8, 10, 12, 14, 16, 17, 19, 21, 23] as const

function quadPt(p0: Vec, p1: Vec, p2: Vec, t: number): Vec {
    const u = 1 - t
    return [
        u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
        u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]
}

function sampleQuad(p0: Vec, p1: Vec, p2: Vec, steps = 28): Vec[] {
    return Array.from({ length: steps }, (_, i) => quadPt(p0, p1, p2, i / (steps - 1)))
}

export const flashphysics: SceneFunction = (s, c) => {
    const pageFill = s.value(0.15)
    const blockPulse = s.value(0)
    const ftlRemap = s.value(0)
    const liveCopy = s.value(0)
    const gcStorm = s.value(0)
    const loopPhase = s.value(0)

    const eraseGrad = linearGradient([-700, 275], [-60, 275], ['#7f1d3a', '#be123c', '#e11d48'])

    const liveFlash = dynamic(() => {
        const pf = pageFill.value
        const bp = blockPulse.value
        const ftl = ftlRemap.value
        const lc = liveCopy.value
        const gc = gcStorm.value
        const lp = loopPhase.value

        const blockAX = -395 * ftl
        const blockBX = 395
        const blockY = 12

        const topText =
            gc > 0.2
                ? 'GARBAGE COLLECTION STORM  ·  COPYING LIVE PAGES TO WIPE BLOCK'
                : ftl > 0.2
                    ? 'FTL COPY-ON-WRITE  ·  LIVE 4 KB PAGES STREAM TO FRESH BLOCK B'
                    : 'FLASH ASYMMETRY  ·  WRITE 4 KB PAGE  vs  ERASE 4 MB BLOCK'
        const topCol = gc > 0.2 ? '#ff6b8b' : ftl > 0.2 ? '#a78bfa' : '#5ce1e6'

        const nodes: Node[] = [
            txt(topText, 0, -405, 28, topCol, 'mono').glow(6, topCol),
            // Erase Block A outer frame
            rect(612, 396, {
                fill: '#0d1426',
                stroke: bp > 0.2 || gc > 0.2 ? '#ff6b8b' : '#5ce1e6',
                width: bp > 0.2 || gc > 0.2 ? 4.5 : 3.2,
                radius: 18,
            })
                .at(blockAX, blockY)
                .glow(bp > 0.2 || gc > 0.2 ? 14 : 8, bp > 0.2 || gc > 0.2 ? '#ff6b8b' : '#5ce1e6'),
        ]

        // 24 representative 4 KB pages inside Block A
        const writtenCount = Math.floor(pf * 24)
        for (let idx = 0; idx < 24; idx++) {
            const r = Math.floor(idx / 6)
            const colIdx = idx % 6
            const px = blockAX - 225 + colIdx * 90
            const py = blockY - 122 + r * 82
            const isWritten = idx < writtenCount
            const isStale = ftl > 0.15 && STALE_CELLS.has(idx)
            const isEvicted = gc > 0.72 && !isStale

            let strokeCol = '#3b4f7a'
            let fillCol = '#142038'
            if (isStale) {
                strokeCol = '#ff6b8b'
                fillCol = '#3b1122'
            } else if (isWritten && !isEvicted) {
                strokeCol = '#5ce1e6'
                fillCol = '#113040'
            }
            nodes.push(
                rect(74, 60, { fill: fillCol, stroke: strokeCol, width: isStale || isWritten ? 2.4 : 1.5, radius: 8 }).at(px, py),
                txt(isStale ? '✕' : isWritten && !isEvicted ? '4K' : '·', px, py + 2, 26, isStale ? '#ff6b8b' : '#5ce1e6', 'mono'),
            )
        }

        // Glowing crimson ERASE 4 MB voltage pulse bar directly under Block A!
        if (bp > 0.1 || ftl > 0.1) {
            const barOp = Math.max(bp, ftl)
            const barW = 590
            const barY = blockY + 236
            const chargeFrac = gc > 0.05 ? Math.min(1, 0.55 + gc * 0.45) : 0.32 + 0.25 * (0.5 + 0.5 * Math.sin(lp * 2.4))
            const fillW = Math.max(46, barW * chargeFrac)
            nodes.push(
                rect(barW, 38, { fill: '#1e0c16', stroke: '#ff6b8b', width: 2.4, radius: 19 }).at(blockAX, barY).opacity(barOp),
                rect(fillW, 32, { fill: eraseGrad, stroke: null, radius: 16 })
                    .at(blockAX - barW / 2 + fillW / 2, barY)
                    .opacity(0.95 * barOp)
                    .glow(12, '#ff6b8b'),
                txt('⚡ ERASE 4 MB VOLTAGE PULSE (20V)', blockAX, barY + 2, 26, '#ffffff', 'mono').opacity(barOp).glow(6, '#991b3a'),
            )
        }

        // FTL Remap Hub + Permanent Glowing Data-Conduit Arcs (Block A -> FTL -> Block B) + Filling Block B!
        if (ftl > 0.05) {
            const ftlPos: Vec = [0, -255]
            const arcA0: Vec = [blockAX + 120, blockY - 198]
            const arcA1: Vec = [blockAX + 225, -270]
            const arcA2: Vec = [-58, -255]
            const arcB0: Vec = [58, -255]
            const arcB1: Vec = [blockBX - 225, -270]
            const arcB2: Vec = [blockBX - 120, blockY - 198]
            const leftArcPts = sampleQuad(arcA0, arcA1, arcA2)
            const rightArcPts = sampleQuad(arcB0, arcB1, arcB2)

            // Permanent glowing Block A -> FTL -> Block B conduit arcs + direct middle transfer conduits
            nodes.push(
                new Node(polyPath(leftArcPts)).stroke('#5ce1e6', 4.0, 0.85 * ftl).glow(10, '#5ce1e6').set('blend', 'screen'),
                new Node(polyPath(rightArcPts)).stroke('#6ee7b7', 4.0, 0.85 * ftl).glow(10, '#6ee7b7').set('blend', 'screen'),
                // Permanent glowing horizontal inter-block conduit pipes
                line([blockAX + 306, blockY - 70], [blockBX - 306, blockY - 70], { stroke: '#a78bfa', width: 3.0, opacity: 0.65 * ftl })
                    .glow(8, '#a78bfa')
                    .set('blend', 'screen'),
                line([blockAX + 306, blockY], [blockBX - 306, blockY], { stroke: '#5ce1e6', width: 3.4, opacity: 0.78 * ftl })
                    .glow(10, '#5ce1e6')
                    .set('blend', 'screen'),
                line([blockAX + 306, blockY + 70], [blockBX - 306, blockY + 70], { stroke: '#6ee7b7', width: 3.0, opacity: 0.65 * ftl })
                    .glow(8, '#6ee7b7')
                    .set('blend', 'screen'),
                // FTL Controller core node
                circle(56, { fill: '#1a1236', stroke: '#a78bfa', width: 3.6 }).at(ftlPos[0], ftlPos[1]).opacity(ftl).glow(12, '#a78bfa'),
                txt('FTL', ftlPos[0], ftlPos[1] + 2, 30, '#d4c2ff', 'mono').opacity(ftl),
                // Fresh Block B frame + opaque header pill so conduit arcs never cross text
                rect(612, 396, { fill: '#0d1426', stroke: '#6ee7b7', width: 3.6, radius: 18 })
                    .at(blockBX, blockY)
                    .opacity(ftl)
                    .glow(12, '#6ee7b7'),
                rect(468, 42, { fill: '#0b1020', stroke: '#6ee7b7', width: 2.0, radius: 21 })
                    .at(blockBX, blockY - 224)
                    .opacity(ftl),
                txt('FRESH BLOCK B  (COMPACTED)', blockBX, blockY - 222, 26, '#6ee7b7', 'mono').opacity(ftl),
            )

            // Live cyan/emerald 4K valid blocks visibly streaming into Block B EARLY (never 24 dead empty dots!)
            const copiedCount = Math.min(LIVE_CELLS.length, Math.max(0, Math.floor(lc * 9 + gc * (LIVE_CELLS.length - 9))))
            for (let idx = 0; idx < 24; idx++) {
                const r = Math.floor(idx / 6)
                const colIdx = idx % 6
                const px = blockBX - 225 + colIdx * 90
                const py = blockY - 122 + r * 82
                const filled = idx < copiedCount
                const isNewest = idx === copiedCount - 1 && copiedCount > 0
                nodes.push(
                    rect(74, 60, {
                        fill: isNewest ? '#1d4d42' : filled ? '#123632' : '#121d33',
                        stroke: isNewest ? '#ffd166' : filled ? '#5ce1e6' : '#32446a',
                        width: filled ? 2.6 : 1.5,
                        radius: 8,
                    })
                        .at(px, py)
                        .opacity(ftl)
                        .glow(isNewest ? 10 : filled ? 4 : 0, isNewest ? '#ffd166' : '#5ce1e6'),
                    txt(filled ? '4K' : '·', px, py + 2, 26, isNewest ? '#ffd166' : filled ? '#6ee7b7' : '#586c96', 'mono').opacity(ftl),
                )
            }

            // Live animated cyan 4K packets traveling along Block A -> FTL -> Block B conduits!
            if (lc > 0.02 || gc > 0.02) {
                const streamOp = Math.min(1, lc * 2 + gc * 2) * ftl
                for (let k = 0; k < 2; k++) {
                    const tA = (lp * 0.65 + k * 0.5) % 1
                    const [ax, ay] = quadPt(arcA0, arcA1, arcA2, tA)
                    const [bx, by] = quadPt(arcB0, arcB1, arcB2, (tA + 0.25) % 1)
                    nodes.push(
                        dot(8, '#5ce1e6').at(ax, ay).opacity(streamOp).glow(14, '#5ce1e6').set('blend', 'screen'),
                        dot(3.5, '#ffffff').at(ax, ay).opacity(streamOp).set('blend', 'screen'),
                        dot(8, '#6ee7b7').at(bx, by).opacity(streamOp).glow(14, '#6ee7b7').set('blend', 'screen'),
                        dot(3.5, '#ffffff').at(bx, by).opacity(streamOp).set('blend', 'screen'),
                    )
                }
                const laneYs = [blockY - 70, blockY, blockY + 70]
                for (let k = 0; k < laneYs.length; k++) {
                    const p = (lp * 0.85 + k * 0.33) % 1
                    const sx = blockAX + 306
                    const ex = blockBX - 306
                    const cx = sx + (ex - sx) * p
                    const ly = laneYs[k]!
                    nodes.push(
                        rect(42, 26, { fill: '#123842ee', stroke: '#5ce1e6', width: 2.0, radius: 6 })
                            .at(cx, ly)
                            .opacity(streamOp)
                            .glow(10, '#5ce1e6'),
                        dot(5, '#ffd166').at(cx, ly).opacity(streamOp).glow(12, '#ffd166').set('blend', 'screen'),
                    )
                }
                nodes.push(
                    txt(`LIVE COPIED: ${copiedCount} / ${LIVE_CELLS.length} PAGES`, blockBX, blockY + 238, 26, '#6ee7b7', 'mono').opacity(ftl),
                )
            }
        }

        // Opaque Block A header pill drawn AFTER conduit arcs so left arc passes cleanly behind!
        nodes.push(
            rect(565, 42, { fill: '#0b1020', stroke: bp > 0.2 || gc > 0.2 ? '#ff6b8b' : '#5ce1e6', width: 2.0, radius: 21 }).at(blockAX, blockY - 224),
            txt('ERASE BLOCK A  (4 MB = 1,024 × 4 KB)', blockAX, blockY - 222, 26, '#e2ebfc', 'mono'),
        )

        // Bottom takeaway telemetry
        const bottomStr =
            gc > 0.2
                ? 'GC copies live pages again & again  →  SSD latency spikes & flash wear'
                : ftl > 0.2
                    ? 'FTL remaps live 4 KB pages to Block B before Block A can be wiped'
                    : bp > 0.2
                        ? 'Cannot overwrite 1 byte in place  ·  Must erase entire 4 MB block'
                        : 'Read / Write granularity: 4 KB  ·  Erase granularity: 4,096 KB (1,024× larger)'
        nodes.push(
            txt(bottomStr, 0, 348, 30, gc > 0.2 ? '#ff6b8b' : '#ffd166', 'sans'),
        )
        return group(...nodes)
    })

    s.add(liveFlash)
    const sceneRem = Math.max(8.0, c.end - c.start - 0.25)
    c.at(0.1, () => {
        s.play(
            pageFill.to(1, { duration: 7.5, ease: linear }),
            loopPhase.to(14.0, { duration: Math.min(28.5, sceneRem), ease: linear }),
        )
    })
    c.on('never overwrite a single', () => s.play(blockPulse.to(1, { duration: 0.9 })))
    c.on('Flash Translation Layer', () => s.play(ftlRemap.to(1, { duration: 0.9 })))
    // Start streaming live 4K pages into Block B immediately on "remaps every update" so Block B is actively filling at t=46s!
    c.on('remaps every update', () => s.play(liveCopy.to(1, { duration: 6.5, ease: linear })))
    const gcRem = Math.max(1.5, c.end - c.cue('garbage collection storms').start - 0.15)
    c.on('garbage collection storms', () => s.play(gcStorm.to(1, { duration: Math.min(3.5, gcRem), ease: linear })))
}

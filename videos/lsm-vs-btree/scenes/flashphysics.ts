import {
    Node, circle, dot, dynamic, group, line, linear, rect,
    type SceneFunction,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// 6 x 4 grid of glowing 4 KB pages inside Block A (left) and Block B (right, fresh block during GC)
const STALE_CELLS = new Set([1, 4, 6, 9, 11, 13, 15, 18, 20, 22])
const LIVE_CELLS = [0, 2, 3, 5, 7, 8, 10, 12, 14, 16, 17, 19, 21, 23] as const

export const flashphysics: SceneFunction = (s, c) => {
    const pageFill = s.value(0.15)
    const blockPulse = s.value(0)
    const ftlRemap = s.value(0)
    const gcStorm = s.value(0)

    const liveFlash = dynamic(() => {
        const pf = pageFill.value
        const bp = blockPulse.value
        const ftl = ftlRemap.value
        const gc = gcStorm.value

        const blockAX = ftl > 0.05 ? -365 : 0
        const blockBX = 385
        const blockY = 20

        const topText =
            gc > 0.2
                ? 'GARBAGE COLLECTION STORM  ·  COPYING LIVE PAGES TO WIPE BLOCK'
                : ftl > 0.2
                    ? 'FTL COPY-ON-WRITE  ·  STALE TOMBSTONES SCATTER EVERYWHERE'
                    : 'FLASH ASYMMETRY  ·  WRITE 4 KB PAGE  vs  ERASE 4 MB BLOCK'
        const topCol = gc > 0.2 ? '#ff6b8b' : ftl > 0.2 ? '#a78bfa' : '#5ce1e6'

        const nodes: Node[] = [
            txt(topText, 0, -395, 28, topCol, 'mono').glow(6, topCol),
            // Erase Block A outer frame
            rect(620, 405, {
                fill: '#0d1426',
                stroke: bp > 0.2 || gc > 0.2 ? '#ff6b8b' : '#5ce1e6',
                width: bp > 0.2 || gc > 0.2 ? 4.5 : 3.2,
                radius: 18,
            })
                .at(blockAX, blockY)
                .glow(bp > 0.2 || gc > 0.2 ? 14 : 8, bp > 0.2 || gc > 0.2 ? '#ff6b8b' : '#5ce1e6'),
            txt('ERASE BLOCK A  (4 MB = 1,024 × 4 KB)', blockAX, blockY - 235, 26, '#cbd5e8', 'mono'),
        ]

        // 24 representative 4 KB pages inside Block A
        const writtenCount = Math.floor(pf * 24)
        for (let idx = 0; idx < 24; idx++) {
            const r = Math.floor(idx / 6)
            const colIdx = idx % 6
            const px = blockAX - 230 + colIdx * 92
            const py = blockY - 126 + r * 84
            const isWritten = idx < writtenCount
            const isStale = ftl > 0.15 && STALE_CELLS.has(idx)
            const isEvicted = gc > 0.7 && !isStale

            let strokeCol = '#2a395c'
            let fillCol = '#10182b'
            if (isStale) {
                strokeCol = '#ff6b8b'
                fillCol = '#3b1122'
            } else if (isWritten && !isEvicted) {
                strokeCol = '#5ce1e6'
                fillCol = '#113040'
            }
            nodes.push(
                rect(76, 62, { fill: fillCol, stroke: strokeCol, width: isStale || isWritten ? 2.4 : 1.4, radius: 8 }).at(px, py),
                txt(isStale ? '✕' : isWritten && !isEvicted ? '4K' : '·', px, py + 2, 26, isStale ? '#ff6b8b' : '#5ce1e6', 'mono'),
            )
        }

        // FTL Remap badge + Block B (fresh erase block) appearing on Beat 1
        if (ftl > 0.05) {
            nodes.push(
                circle(56, { fill: '#1a1236', stroke: '#a78bfa', width: 3.4 }).at(10, -245).opacity(ftl).glow(10, '#a78bfa'),
                txt('FTL', 10, -243, 30, '#a78bfa', 'mono').opacity(ftl),
                rect(620, 405, { fill: '#0d1426', stroke: '#6ee7b7', width: 3.4, radius: 18 })
                    .at(blockBX, blockY)
                    .opacity(ftl)
                    .glow(10, '#6ee7b7'),
                txt('FRESH BLOCK B  (COMPACTED)', blockBX, blockY - 235, 26, '#6ee7b7', 'mono').opacity(ftl),
            )

            // Pages in Block B fill sequentially as GC copies live pages over from Block A!
            const copiedCount = Math.floor(gc * LIVE_CELLS.length)
            for (let idx = 0; idx < 24; idx++) {
                const r = Math.floor(idx / 6)
                const colIdx = idx % 6
                const px = blockBX - 230 + colIdx * 92
                const py = blockY - 126 + r * 84
                const filled = idx < copiedCount
                nodes.push(
                    rect(76, 62, {
                        fill: filled ? '#12332a' : '#10182b',
                        stroke: filled ? '#6ee7b7' : '#2a395c',
                        width: filled ? 2.4 : 1.4,
                        radius: 8,
                    })
                        .at(px, py)
                        .opacity(ftl),
                    txt(filled ? '4K' : '·', px, py + 2, 26, filled ? '#6ee7b7' : '#4a5a7e', 'mono').opacity(ftl),
                )
            }
        }

        // Animated GC live-page copy arcs racing from Block A -> Block B!
        if (gc > 0.05 && gc < 0.98) {
            for (let k = 0; k < 4; k++) {
                const p = (gc * 2.2 + k * 0.25) % 1
                const sx = blockAX + 260
                const ex = blockBX - 260
                const y = blockY - 90 + k * 60
                const cx = sx + (ex - sx) * p
                nodes.push(
                    line([sx, y], [ex, y], { stroke: '#a78bfa', width: 2.5, dash: [8, 8], opacity: 0.6 }),
                    dot(8, '#ffd166').at(cx, y).glow(12, '#ffd166'),
                )
            }
        }

        // Bottom takeaway telemetry
        const bottomStr =
            gc > 0.2
                ? 'GC copies live pages again & again  →  SSD latency spikes & flash wear'
                : bp > 0.2
                    ? 'Cannot overwrite 1 byte in place  ·  Must erase entire 4 MB block'
                    : 'Read / Write granularity: 4 KB  ·  Erase granularity: 4,096 KB (1,024× larger)'
        nodes.push(
            txt(bottomStr, 0, 325, 30, gc > 0.2 ? '#ff6b8b' : '#ffd166', 'sans'),
        )
        return group(...nodes)
    })

    s.add(liveFlash)
    c.at(0.1, () => s.play(pageFill.to(1, { duration: 7.5, ease: linear })))
    c.on('never overwrite a single', () => s.play(blockPulse.to(1, { duration: 0.9 })))
    c.on('Flash Translation Layer', () => s.play(ftlRemap.to(1, { duration: 1.0 })))
    c.on('garbage collection storms', () => s.play(gcStorm.to(1, { duration: 3.6, ease: linear })))
}

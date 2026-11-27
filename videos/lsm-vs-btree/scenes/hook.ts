import {
    Node, circle, delay, dot, dynamic, group, line, linear, linearGradient, polyPath, polygon,
    radialGradient, rect, scalarField, type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// Mirrored layout: Blazing 4 MB Flash Die on LEFT (open top sky for rays, ZERO label crossings!), Right-Aligned Editorial on RIGHT
const CX = -385
const CY = -24

const HIT_ORDER = [2, 19, 7, 31, 14, 26, 4, 22, 11, 34, 9, 28, 16, 1, 24, 33] as const
const STREAM_XS = Array.from({ length: 120 }, (_, i) => -760 + (1520 * i) / 119)

function cellPos(idx: number): Vec {
    const r = Math.floor(idx / 6)
    const colIdx = idx % 6
    return [CX - 205 + colIdx * 82, CY - 155 + r * 62]
}

export const hook: SceneFunction = (s, c) => {
    const showDie = s.value(1)
    const chaosProg = s.value(0)
    const showContrast = s.value(0)
    const riverFlow = s.value(0)

    const shot1Copy = group(
        txt('10× – 30× WA', 852, -182, 86, '#ff6b8b', 'mono', 'right').glow(10, '#ff6b8b'),
        txt('Inside an SSD', 858, -36, 104, '#f8f4ec', 'serif', 'right').glow(6, '#90b4ff'),
        txt('B-Tree vs LSM', 858, 82, 102, '#ffd166', 'serif', 'right').glow(9, '#ffd166'),
        txt('4 KB writes smashing 4 MB erase blocks', 852, 202, 32, '#d2dcf0', 'sans', 'right'),
    )

    const heatGrad = linearGradient([CX - 265, CY + 318], [CX + 265, CY + 318], ['#5ce1e6', '#ffd166', '#fb923c', '#ff6b8b'])

    const liveDie = dynamic(() => {
        if (showDie.value < 0.02) return []
        const a = showDie.value
        const cp = chaosProg.value
        const activeHits = Math.min(HIT_ORDER.length - 1, Math.max(2, Math.floor(cp * HIT_ORDER.length) + 2))
        const waNum = (4.2 + cp * 24.6).toFixed(1)
        const heatFrac = Math.min(1, 0.22 + cp * 0.78)

        const nodes: Node[] = [
            circle(540, {
                fill: radialGradient([0, 0], 540, [
                    [0, '#ff6b8b2e'],
                    [0.5, '#5ce1e616'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).opacity(a),
            // Huge 4 MB Erase Block silicon frame (top edge 100% clear for incoming write lasers!)
            rect(556, 444, { fill: '#0d1428', stroke: '#ff6b8b', width: 3.8, radius: 18 }).at(CX, CY).opacity(a).glow(14, '#ff6b8b'),
        ]

        // 6x6 packed grid of 4 KB pages
        for (let idx = 0; idx < 36; idx++) {
            const [x, y] = cellPos(idx)
            const hitOrderIdx = HIT_ORDER.indexOf(idx as (typeof HIT_ORDER)[number])
            const isHit = hitOrderIdx !== -1 && hitOrderIdx <= activeHits
            const isLatest = hitOrderIdx === activeHits
            const isRecent = hitOrderIdx !== -1 && hitOrderIdx >= activeHits - 2 && hitOrderIdx <= activeHits
            const strokeCol = isLatest ? '#ffd166' : isHit ? '#ff6b8b' : '#4e70a0'
            const fillCol = isLatest ? '#ff6b8baa' : isHit ? '#ff6b8b42' : '#182b4a'
            nodes.push(
                rect(68, 46, { fill: fillCol, stroke: strokeCol, width: isHit ? 2.8 : 1.7, radius: 6 }).at(x, y).opacity(a),
            )
            if (isRecent) {
                const age = activeHits - hitOrderIdx
                const flashR = 34 + (age === 0 ? ((cp * 18) % 1) * 44 : 14)
                const flashOp = (age === 0 ? 0.92 : 0.45) * a
                nodes.push(
                    circle(flashR, {
                        fill: radialGradient([0, 0], flashR, [
                            [0, '#ffffffcc'],
                            [0.35, '#ffd16699'],
                            [0.7, '#ff6b8b55'],
                            [1, '#07091000'],
                        ]),
                        stroke: null,
                    })
                        .at(x, y)
                        .opacity(flashOp)
                        .set('blend', 'screen'),
                )
            }
        }

        // Incoming 4 KB write lasers from open sky above (ZERO rays cross any text label!)
        for (let k = 0; k < 3; k++) {
            const hIdx = Math.max(0, activeHits - k)
            const cellIdx = HIT_ORDER[hIdx]!
            const [tx, ty] = cellPos(cellIdx)
            const srcX = CX - 210 + k * 210
            const srcY = CY - 325
            const rayOp = (k === 0 ? 0.96 : 0.54) * a
            const rayCol = k === 0 ? '#ffd166' : '#ff6b8b'
            const pktT = (cp * 7.5 + k * 0.34) % 1
            const px = srcX + (tx - srcX) * pktT
            const py = srcY + (ty - srcY) * pktT
            nodes.push(
                line([srcX, srcY], [tx, ty], { stroke: rayCol, width: k === 0 ? 4.4 : 2.6, opacity: rayOp })
                    .glow(12, rayCol)
                    .set('blend', 'screen'),
                line([srcX, srcY], [tx, ty], { stroke: '#ffffff', width: k === 0 ? 1.5 : 0.9, opacity: rayOp * 0.85 })
                    .set('blend', 'screen'),
                dot(k === 0 ? 8 : 5.5, '#ffffff').at(px, py).opacity(rayOp).glow(14, rayCol).set('blend', 'screen'),
                line([tx - 24, ty - 14], [tx + 24, ty + 14], { stroke: '#ffd166', width: 2.2, opacity: rayOp * 0.85 })
                    .glow(8, '#ffd166')
                    .set('blend', 'screen'),
                line([tx - 24, ty + 14], [tx + 24, ty - 14], { stroke: '#ff6b8b', width: 2.2, opacity: rayOp * 0.85 })
                    .glow(8, '#ff6b8b')
                    .set('blend', 'screen'),
            )
            if (k === 0) {
                nodes.push(
                    rect(210, 42, { fill: '#1a0c18', stroke: '#ffd166', width: 2.2, radius: 21 })
                        .at(srcX, srcY - 26)
                        .opacity(a)
                        .glow(8, '#ffd166'),
                    txt('4 KB WRITE', srcX, srcY - 24, 26, '#ffd166', 'mono').opacity(a),
                )
            }
        }

        // Clean label BELOW the die frame (100% free of any laser crossing!) + rising heatglow wear bar
        const barW = 544
        const fillW = Math.max(40, barW * heatFrac)
        nodes.push(
            txt('4 MB FLASH ERASE BLOCK', CX, CY + 264, 26, '#ff85a2', 'mono').opacity(a).glow(6, '#ff6b8b'),
            rect(barW, 24, { fill: '#121a30', stroke: '#3c4f7d', width: 2, radius: 12 }).at(CX, CY + 312).opacity(a),
            rect(fillW, 20, { fill: heatGrad, stroke: '#ffffff', width: 1.2, radius: 10 })
                .at(CX - barW / 2 + fillW / 2, CY + 312)
                .opacity(0.95 * a)
                .glow(14, '#ff6b8b')
                .set('blend', 'screen'),
            txt(`Write Amp: ${waNum}×`, CX - 268, CY + 364, 30, '#ff6b8b', 'mono', 'left').opacity(a).glow(8, '#ff6b8b'),
            txt('FLASH WEAR ↑', CX + 268, CY + 364, 26, '#fb923c', 'mono', 'right').opacity(a).glow(6, '#fb923c'),
        )
        return group(...nodes)
    })

    // Shot 2: Rich split comparison (unchanged, already cinema!)
    const goldGrad = linearGradient([-760, 145], [760, 145], ['#ffd16640', '#ffd166', '#ffffff', '#ffd166', '#ffd16640'])
    const roseGrad = linearGradient([-760, -145], [760, -145], ['#ff6b8b55', '#ff6b8b', '#fb923c', '#ff6b8b'])
    const roseAreaGrad = linearGradient([0, -210], [0, -15], ['#ff6b8b55', '#fb923c28', '#ff6b8b06'])
    const goldAreaGrad = linearGradient([0, 115], [0, 275], ['#ffd16655', '#6ee7b724', '#ffd16606'])

    const chaosHeatmap = scalarField(
        (x, y, time) => {
            const ridge = -0.1 + 0.45 * Math.sin(x * 3.1 + time * 2.2) * Math.cos(x * 1.7 - time * 1.4)
            const dist = Math.abs(y - ridge)
            const spike = Math.exp(-dist * dist * 5.2)
            const hotspot = 0.45 * Math.exp(-((x + 0.5) * (x + 0.5) * 2.4 + y * y * 4.0))
                + 0.45 * Math.exp(-((x - 1.1) * (x - 1.1) * 2.2 + y * y * 4.0))
            return Math.min(1, spike * 0.72 + hotspot)
        },
        {
            x: [-3, 3],
            y: [-1, 1],
            domain: [0, 1],
            colors: ['#07091000', '#3b0b2055', '#991b3a77', '#fb923c88', '#ff6b8baa'],
            width: 1520,
            height: 220,
            resolution: [96, 28],
        },
    ).at(0, -135).opacity(0.75).zIndex(-1)

    const lsmHeatmap = scalarField(
        (x, y, time) => {
            const stream = 0.25 * Math.sin(x * 1.15 - time * 3.2)
            const dy = y - stream
            const band = Math.exp(-dy * dy * 4.8)
            const shimmer = 0.85 + 0.15 * Math.sin(x * 4.5 - time * 5.0)
            return Math.min(1, band * shimmer)
        },
        {
            x: [-3, 3],
            y: [-1, 1],
            domain: [0, 1],
            colors: ['#07091000', '#16352e55', '#6b531477', '#ffd16688', '#fff5cc99'],
            width: 1520,
            height: 200,
            resolution: [96, 26],
        },
    ).at(0, 155).opacity(0.82).zIndex(-1)

    const liveContrast = dynamic(() => {
        if (showContrast.value < 0.02) return []
        const a = showContrast.value
        const f = riverFlow.value

        const chaosPts: Vec[] = STREAM_XS.map((x, idx) => [
            x,
            -135 + Math.sin(idx * 1.9 + f * 6) * 46 + Math.cos(idx * 3.7 - f * 4) * 24,
        ])
        const goldPts: Vec[] = STREAM_XS.map((x) => [
            x,
            155 + Math.sin(x * 0.008 - f * 4.5) * 16,
        ])

        const chaosAreaPts: Vec[] = [...chaosPts, [760, -20], [-760, -20]]
        const goldAreaPts: Vec[] = [...goldPts, [760, 265], [-760, 265]]

        const iopsVal = Math.round(14200 + Math.sin(f * 3.8) * 1850)
        const seqMbVal = Math.round(6720 + Math.sin(f * 1.9) * 140)

        const nodes: Node[] = [
            txt('B-TREE RANDOM 4 KB WRITES  ·  28.8× WRITE AMP', -760, -325, 28, '#ff6b8b', 'mono', 'left').opacity(a).glow(8, '#ff6b8b'),
            rect(385, 56, { fill: '#230d19e8', stroke: '#ff6b8b', width: 2.4, radius: 14 }).at(568, -325).opacity(a).glow(8, '#ff6b8b'),
            txt(`${iopsVal.toLocaleString()} Random IOPS`, 568, -323, 26, '#ff8fab', 'mono').opacity(a),
            polygon(chaosAreaPts, { fill: roseAreaGrad, stroke: null }).opacity(0.85 * a),
            new Node(polyPath(chaosPts)).stroke(roseGrad, 4.6, 0.94 * a).glow(12, '#ff6b8b').set('blend', 'screen'),
            line([-760, 12], [760, 12], { stroke: '#32446e', width: 2.0, dash: [10, 12], opacity: 0.72 * a }),
            txt('LSM-TREE SEQUENTIAL STREAM  ·  1.05× FTL AMP', -760, 325, 28, '#ffd166', 'mono', 'left').opacity(a).glow(8, '#ffd166'),
            rect(385, 56, { fill: '#1b170be8', stroke: '#ffd166', width: 2.4, radius: 14 }).at(568, 325).opacity(a).glow(10, '#ffd166'),
            txt(`${seqMbVal.toLocaleString()} MB/s Sequential`, 568, 327, 26, '#ffd166', 'mono').opacity(a),
            polygon(goldAreaPts, { fill: goldAreaGrad, stroke: null }).opacity(0.85 * a),
            new Node(polyPath(goldPts)).stroke(goldGrad, 16, 0.35 * a).glow(18, '#ffd166').set('blend', 'screen'),
            new Node(polyPath(goldPts)).stroke(goldGrad, 7.5, 0.98 * a).glow(14, '#ffd166').set('blend', 'screen'),
            new Node(polyPath(goldPts)).stroke('#ffffff', 2.4, 0.8 * a).set('blend', 'screen'),
        ]

        for (let k = 0; k < 10; k++) {
            const idx = Math.floor(((k * 13 + f * 9) % 108) + 6)
            const pt = chaosPts[idx]!
            nodes.push(
                dot(5.2, '#ff6b8b').at(pt[0], pt[1]).opacity(0.9 * a).glow(12, '#ff6b8b').set('blend', 'screen'),
            )
        }

        for (let k = 0; k < 28; k++) {
            const t = (f * 0.55 + k / 28) % 1
            const px = -745 + t * 1490
            const lane = ((k % 3) - 1) * 14
            const py = 155 + Math.sin(px * 0.008 - f * 4.5) * 16 + lane
            const col = k % 4 === 0 ? '#6ee7b7' : k % 2 === 0 ? '#ffd166' : '#ffffff'
            nodes.push(
                dot(k % 3 === 0 ? 4.8 : 3.2, col).at(px, py).opacity(0.92 * a).glow(10, col).set('blend', 'screen'),
            )
        }
        for (let k = 0; k < 6; k++) {
            const t = (f * 0.36 + k / 6) % 1
            const bx = -720 + t * 1440
            const by = 155 + Math.sin(bx * 0.008 - f * 4.5) * 16
            nodes.push(
                rect(64, 32, { fill: '#ffd16655', stroke: '#ffd166', width: 2.6, radius: 7 }).at(bx, by).opacity(a).glow(12, '#ffd166'),
                dot(6.5, '#ffffff').at(bx + 32, by).opacity(a).glow(12, '#ffd166').set('blend', 'screen'),
            )
        }
        return group(...nodes)
    })

    s.add(liveDie, shot1Copy, liveContrast)
    const watchCue = c.cue('Watch how')
    const shot2Rem = Math.max(2.0, c.end - watchCue.start - 0.15)
    c.at(0.1, () => s.play(chaosProg.to(1, { duration: Math.min(15.0, c.end - c.start - 0.25), ease: linear })))
    c.show('Watch how', chaosHeatmap)
    c.show('Watch how', lsmHeatmap)
    c.on('Watch how', () => {
        s.play(
            showDie.to(0, { duration: 0.16 }),
            delay(showContrast.to(1, { duration: 0.28 }), 0.2),
            riverFlow.to(4.6, { duration: shot2Rem, ease: linear }),
        )
    })
    c.hide('Watch how', shot1Copy)
}

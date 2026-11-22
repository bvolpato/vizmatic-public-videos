import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const CX = 350
const CY = -5

// Deterministic random 4 KB page hits inside the 4 MB flash erase block die
const HIT_ORDER = [2, 19, 7, 31, 14, 26, 4, 22, 11, 34, 9, 28, 16, 1, 24, 33] as const
const STREAM_XS = Array.from({ length: 120 }, (_, i) => -760 + (1520 * i) / 119)

export const hook: SceneFunction = (s, c) => {
    const showDie = s.value(1)
    const chaosProg = s.value(0)
    const showContrast = s.value(0)
    const riverFlow = s.value(0)

    const shot1Copy = group(
        txt('10× – 30× WA', -840, -175, 84, '#ff6b8b', 'mono', 'left').glow(10, '#ff6b8b'),
        txt('Inside an SSD', -848, -32, 102, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('B-Tree vs LSM', -848, 84, 100, '#ffd166', 'serif', 'left').glow(8, '#ffd166'),
        txt('4 KB writes smashing 4 MB erase blocks', -840, 204, 32, '#cbd5e8', 'sans', 'left'),
    )

    const liveDie = dynamic(() => {
        if (showDie.value < 0.02) return []
        const a = showDie.value
        const cp = chaosProg.value
        const activeHits = Math.floor(cp * HIT_ORDER.length)
        const waNum = (1 + cp * 27.8).toFixed(1)

        const nodes: Node[] = [
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ff6b8b26'],
                    [0.5, '#5ce1e612'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).opacity(a),
            // Huge 4 MB Erase Block silicon frame
            rect(540, 440, { fill: '#0d1324', stroke: '#ff6b8b', width: 3.8, radius: 18 }).at(CX, CY).opacity(a).glow(12, '#ff6b8b'),
            txt('4 MB FLASH ERASE BLOCK', CX, CY - 252, 26, '#ff6b8b', 'mono').opacity(a),
        ]

        // 6x6 packed grid of 4 KB pages
        for (let idx = 0; idx < 36; idx++) {
            const r = Math.floor(idx / 6)
            const colIdx = idx % 6
            const x = CX - 205 + colIdx * 82
            const y = CY - 155 + r * 62
            const hitOrderIdx = HIT_ORDER.indexOf(idx as (typeof HIT_ORDER)[number])
            const isHit = hitOrderIdx !== -1 && hitOrderIdx <= activeHits
            const isLatest = hitOrderIdx === activeHits
            const strokeCol = isHit ? '#ff6b8b' : '#3a5478'
            const fillCol = isLatest ? '#ff6b8b88' : isHit ? '#ff6b8b34' : '#122038'
            nodes.push(
                rect(68, 46, { fill: fillCol, stroke: strokeCol, width: isHit ? 2.6 : 1.4, radius: 6 }).at(x, y).opacity(a),
            )
            if (isLatest) {
                const ripple = 20 + ((cp * 16) % 1) * 90
                nodes.push(
                    circle(ripple, { fill: null, stroke: '#ff6b8b', width: 2.5 }).at(x, y).opacity(0.8 * a).glow(8, '#ff6b8b'),
                )
            }
        }

        nodes.push(
            txt(`Write Amp: ${waNum}×`, CX, CY + 265, 34, '#ff6b8b', 'mono').opacity(a).glow(8, '#ff6b8b'),
        )
        return group(...nodes)
    })

    // Shot 2: Random Chaos (top) vs Sequential Gold River (bottom)
    const goldGrad = linearGradient([-760, 155], [760, 155], ['#ffd16630', '#ffd166', '#ffffff', '#ffd166', '#ffd16630'])
    const roseGrad = linearGradient([-760, -145], [760, -145], ['#ff6b8b40', '#ff6b8b', '#fb923c', '#ff6b8b'])

    const liveContrast = dynamic(() => {
        if (showContrast.value < 0.02) return []
        const a = showContrast.value
        const f = riverFlow.value

        const chaosPts: Vec[] = STREAM_XS.map((x, idx) => [
            x,
            -140 + Math.sin(idx * 1.9 + f * 6) * 44 + Math.cos(idx * 3.7 - f * 4) * 24,
        ])
        const goldPts: Vec[] = STREAM_XS.map((x) => [
            x,
            155 + Math.sin(x * 0.008 - f * 4.5) * 16,
        ])

        const nodes: Node[] = [
            txt('B-TREE RANDOM 4 KB WRITES  ·  28.8× WRITE AMP', 0, -275, 30, '#ff6b8b', 'mono').opacity(a).glow(8, '#ff6b8b'),
            new Node(polyPath(chaosPts)).stroke(roseGrad, 4.2, 0.9 * a).glow(10, '#ff6b8b'),
            line([-760, 10], [760, 10], { stroke: '#253152', width: 1.8, dash: [10, 12], opacity: 0.65 * a }),
            txt('LSM-TREE SEQUENTIAL STREAM  ·  1.05× FTL AMP', 0, 295, 30, '#ffd166', 'mono').opacity(a).glow(8, '#ffd166'),
            new Node(polyPath(goldPts)).stroke(goldGrad, 7.5, 0.96 * a).glow(14, '#ffd166'),
            new Node(polyPath(goldPts)).stroke('#ffffff', 2.2, 0.65 * a),
        ]

        // Sequential golden data blocks surfing effortlessly along the bottom river
        for (let k = 0; k < 5; k++) {
            const t = (f * 0.35 + k * 0.2) % 1
            const bx = -720 + t * 1440
            const by = 155 + Math.sin(bx * 0.008 - f * 4.5) * 16
            nodes.push(
                rect(58, 30, { fill: '#ffd16648', stroke: '#ffd166', width: 2.4, radius: 6 }).at(bx, by).opacity(a).glow(10, '#ffd166'),
                dot(6, '#ffffff').at(bx + 29, by).opacity(a).glow(10, '#ffd166'),
            )
        }
        return group(...nodes)
    })

    s.add(liveDie, shot1Copy, liveContrast)
    c.at(0.1, () => s.play(chaosProg.to(1, { duration: 11.5, ease: linear })))
    c.on('Watch how', () => {
        s.play(showDie.to(0, { duration: 0.3 }))
        s.play(showContrast.to(1, { duration: 0.35 }))
        s.play(riverFlow.to(4.2, { duration: 3.4, ease: linear }))
    })
    c.hide('Watch how', shot1Copy)
}

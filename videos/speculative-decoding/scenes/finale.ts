import {
    Node, circle, dot, dynamic, fadeIn, group, line, linear, linearGradient, radialGradient, rect, tex,
    type SceneFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const LANES = [
    {
        y: -335,
        speed: 1.0,
        col: COSMOS.cyan,
        seed: 0.08,
        words: ['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'],
    },
    {
        y: -242,
        speed: 1.24,
        col: COSMOS.emerald,
        seed: 0.38,
        words: ['Draft', 'five', 'words', 'then', 'check', 'all', 'at', 'once', 'live'],
    },
    {
        y: -149,
        speed: 0.92,
        col: COSMOS.gold,
        seed: 0.68,
        words: ['KV', 'pages', 'pack', 'tight', 'zero', 'waste', 'fast', 'HBM', 'read'],
    },
    {
        y: -56,
        speed: 1.12,
        col: COSMOS.violet,
        seed: 0.22,
        words: ['Exact', 'math', 'zero', 'loss', 'four', 'times', 'peak', '1000', 'tok/s'],
    },
] as const

export const finale: SceneFunction = (s, c) => {
    const flow = s.value(0)

    const takeawayGroup = group(
        txt('Draft cheap. Verify in parallel.', 0, 224, 62, COSMOS.ink, 'serif').glow(6, '#90b4ff'),
        txt('Prove exact.', 0, 316, 74, COSMOS.gold, 'serif').glow(10, COSMOS.gold),
        txt('KV Cache  ·  PagedAttention  ·', -58, 408, 26, '#94a3c4', 'mono', 'right'),
        tex(String.raw`P_{\text{spec}}(x) \equiv p(x)`, {
            size: 32,
            color: COSMOS.gold,
        }).at(138, 408).glow(6, COSMOS.gold),
    ).hide()

    const liveWaterfall = dynamic(() => {
        const t = flow.value
        const pulse = (t * 0.42) % 1
        const scanX = -830 + pulse * 1660
        const nodes: Node[] = [
            circle(560, {
                fill: radialGradient([0, 0], 560, [
                    [0, '#ffd16634'],
                    [0.45, '#5ce1e61a'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(scanX * 0.4, -195).set('blend', 'screen'),
        ]

        // Radiant golden parallel verification energy wall behind the token lanes (zero stroke crossing glyphs!)
        const shockPulse = (t * 0.9) % 1
        nodes.push(
            rect(190, 400, {
                fill: linearGradient([scanX - 95, -195], [scanX + 95, -195], ['#ffd16600', '#ffd1666e', '#ffffff99', '#ffd16600']),
                stroke: null,
                radius: 20,
            }).at(scanX, -195).opacity(0.75).set('blend', 'screen'),
            // Expanding luminous golden volumetric shockwave halo (smooth multi-stop bell, no concentric banding)
            circle(54 + shockPulse * 155, {
                fill: radialGradient([0, 0], 54 + shockPulse * 155, [
                    [0, '#ffd16600'],
                    [0.35, '#ffd16608'],
                    [0.62, '#ffd16622'],
                    [0.78, '#ffd16638'],
                    [0.88, '#fff4cc36'],
                    [0.95, '#ffd16614'],
                    [1, '#ffd16600'],
                ]),
                stroke: null,
            }).at(scanX, -195).opacity((1 - shockPulse) * 0.78).set('blend', 'screen'),
        )

        // Glowing golden vertical laser segments bridging the gaps cleanly between token lanes
        const laserGaps: readonly [number, number][] = [
            [-398, -365],
            [-305, -272],
            [-212, -179],
            [-119, -86],
            [-26, 8],
        ]
        for (const [y0, y1] of laserGaps) {
            nodes.push(
                line([scanX, y0], [scanX, y1], { stroke: COSMOS.gold, width: 6.0 })
                    .glow(18, COSMOS.gold).opacity(0.95).set('blend', 'screen'),
                line([scanX, y0], [scanX, y1], { stroke: '#ffffff', width: 2.0 }).opacity(0.9),
            )
        }
        nodes.push(dot(8, '#ffffff').at(scanX, -195).glow(18, COSMOS.gold).set('blend', 'screen'))

        // 4 blazing parallel verified token streams populated with real glowing token glyphs!
        for (let lIdx = 0; lIdx < LANES.length; lIdx++) {
            const lane = LANES[lIdx]!
            const nToks = lane.words.length
            // Subtle guide band (fill only, never crosses glyph strokes!)
            nodes.push(rect(1780, 4, { fill: '#233254', stroke: null }).at(0, lane.y).opacity(0.55))

            for (let k = 0; k < nToks; k++) {
                const u = ((t * 0.20 * lane.speed + lane.seed + k / nToks) % 1)
                const x = -900 + u * 1800
                const dist = Math.abs(x - scanX)
                const nearScan = dist < 115
                const hit = Math.max(0, 1 - dist / 115)
                const col = nearScan ? COSMOS.gold : lane.col

                // Radial golden shockwave burst + spark particles behind/around verified token!
                if (hit > 0.15) {
                    const ringR = 56 + (1 - hit) * 52
                    nodes.push(
                        circle(ringR, {
                            fill: radialGradient([0, 0], ringR, [
                                [0, '#ffd16648'],
                                [0.70, '#ffd16632'],
                                [1, '#ffd16600'],
                            ]),
                            stroke: null,
                        }).at(x, lane.y).opacity(hit * 0.9).set('blend', 'screen'),
                    )
                    for (let sp = 0; sp < 4; sp++) {
                        const ang = (sp * Math.PI) / 2 + Math.PI / 4 + lIdx * 0.35
                        const sr = 38 + (1 - hit) * 54
                        nodes.push(
                            dot(4.5, sp % 2 === 0 ? '#ffffff' : COSMOS.gold)
                                .at(x + Math.cos(ang) * sr, lane.y + Math.sin(ang) * sr)
                                .glow(12, COSMOS.gold)
                                .opacity(hit * 0.95)
                                .set('blend', 'screen'),
                        )
                    }
                }

                nodes.push(
                    rect(118, 48, {
                        fill: nearScan ? '#241e12' : '#101728',
                        stroke: col,
                        width: nearScan ? 3.6 : 2.2,
                        radius: 12,
                    }).at(x, lane.y).opacity(0.96).glow(nearScan ? 14 : 6, col),
                    txt(lane.words[k]!, x, lane.y, 26, nearScan ? '#ffffff' : col, 'mono')
                        .glow(nearScan ? 8 : 0, COSMOS.gold),
                )
            }
        }

        // Hero throughput readout floating cleanly in center band
        const tokSec = Math.min(1040, Math.round(260 + Math.min(1, t / 3.2) * 780))
        nodes.push(
            txt(`${tokSec.toLocaleString('en-US')} tok/s`, -340, 82, 62, COSMOS.gold, 'mono').glow(10, COSMOS.gold),
            txt('4.0× Throughput  ·  0% Quality Loss', 310, 82, 34, COSMOS.emerald, 'sans').glow(5, COSMOS.emerald),
        )

        return group(...nodes)
    })

    s.add(liveWaterfall, takeawayGroup)
    const totalDur = Math.max(5.0, c.end - c.start - 0.35)
    c.at(0.05, () => s.play(flow.to(8.0, { duration: totalDur, ease: linear })))
    c.on('Draft cheap', () => s.play(fadeIn(takeawayGroup, { duration: 0.45 })))
}

import {
    Node, circle, dot, dynamic, group, line, linear, radialGradient, rect,
    type SceneFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const LANES = [
    { y: -325, speed: 1.0, col: COSMOS.cyan, seed: 0.1 },
    { y: -235, speed: 1.28, col: COSMOS.emerald, seed: 0.42 },
    { y: -145, speed: 0.92, col: COSMOS.gold, seed: 0.73 },
    { y: -55, speed: 1.15, col: COSMOS.violet, seed: 0.25 },
] as const

export const finale: SceneFunction = (s, c) => {
    const flow = s.value(0)
    const showTakeaway = s.value(0)

    const liveWaterfall = dynamic(() => {
        const t = flow.value
        const pulse = (t * 0.45) % 1
        const nodes: Node[] = [
            circle(540, {
                fill: radialGradient([0, 0], 540, [
                    [0, '#ffd16628'],
                    [0.45, '#5ce1e614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, -185),
        ]

        // 4 blazing parallel verified token streams racing across the upper half
        const scanX = -860 + pulse * 1720
        for (const lane of LANES) {
            nodes.push(line([-880, lane.y], [880, lane.y], { stroke: '#1f2b48', width: 1.6 }).opacity(0.6))
            for (let k = 0; k < 10; k++) {
                const u = ((t * 0.24 * lane.speed + lane.seed + k / 10) % 1)
                const x = -900 + u * 1800
                const nearScan = Math.abs(x - scanX) < 110
                const col = nearScan ? COSMOS.gold : lane.col
                nodes.push(
                    rect(82, 42, { fill: '#111626', stroke: col, width: nearScan ? 3.4 : 2.2, radius: 10 })
                        .at(x, lane.y).opacity(0.9).glow(nearScan ? 12 : 6, col),
                )
            }
        }

        // Golden parallel verification sweep wave crossing all 4 token lanes!
        nodes.push(
            line([scanX, -385], [scanX, 5], { stroke: COSMOS.gold, width: 5 }).glow(16, COSMOS.gold).opacity(0.82),
            dot(8, '#ffffff').at(scanX, -190).glow(16, COSMOS.gold),
        )

        // Hero throughput readout floating cleanly in center band
        const tokSec = Math.min(1040, Math.round(260 + Math.min(1, t / 3.2) * 780))
        nodes.push(
            txt(`${tokSec.toLocaleString('en-US')} tok/s`, -340, 82, 62, COSMOS.gold, 'mono').glow(10, COSMOS.gold),
            txt('4.0× Throughput  ·  0% Quality Loss', 310, 82, 34, COSMOS.emerald, 'sans').glow(5, COSMOS.emerald),
        )

        if (showTakeaway.value >= 0.02) {
            const a = showTakeaway.value
            nodes.push(
                txt('Draft cheap. Verify in parallel.', 0, 232, 64, COSMOS.ink, 'serif').glow(6, '#90b4ff').opacity(a),
                txt('Prove exact.', 0, 326, 76, COSMOS.gold, 'serif').glow(10, COSMOS.gold).opacity(a),
                txt('KV Cache  ·  PagedAttention  ·  P_spec(x) ≡ p(x)', 0, 412, 26, '#8b99b8', 'mono').opacity(a),
            )
        }

        return group(...nodes)
    })

    s.add(liveWaterfall)
    const totalDur = Math.max(5.0, c.end - c.start - 0.35)
    c.at(0.05, () => s.play(flow.to(8.0, { duration: totalDur, ease: linear })))
    c.on('Draft cheap', () => s.play(showTakeaway.to(1, { duration: 0.45 })))
}

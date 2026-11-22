import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { H100, H100_RIDGE_AI, rooflineTflops } from '../math'
import { COSMOS, txt } from '../../../factory/style'

// Roofline log-log coordinates: AI in [1, 2000], TFLOP/s in [1, 1600]
const RX0 = -640
const RX1 = 760
const RY0 = 295
const RY1 = -255
const AI_MIN = 1
const AI_MAX = 2000
const TF_MIN = 1
const TF_MAX = 1600

const mapAI = (ai: number) => RX0 + ((Math.log10(ai) - Math.log10(AI_MIN)) / (Math.log10(AI_MAX) - Math.log10(AI_MIN))) * (RX1 - RX0)
const mapTF = (tf: number) => RY0 - ((Math.log10(tf) - Math.log10(TF_MIN)) / (Math.log10(TF_MAX) - Math.log10(TF_MIN))) * (RY0 - RY1)

const ROOFLINE_SAMPLES = 180
const HBM_ROOF_PTS: Vec[] = Array.from({ length: ROOFLINE_SAMPLES }, (_, i) => {
    const ai = Math.pow(10, Math.log10(AI_MIN) + ((Math.log10(AI_MAX) - Math.log10(AI_MIN)) * i) / (ROOFLINE_SAMPLES - 1))
    return [mapAI(ai), mapTF(rooflineTflops(ai, H100.hbmTbs))] as Vec
})
const SRAM_ROOF_PTS: Vec[] = Array.from({ length: ROOFLINE_SAMPLES }, (_, i) => {
    const ai = Math.pow(10, Math.log10(AI_MIN) + ((Math.log10(AI_MAX) - Math.log10(AI_MIN)) * i) / (ROOFLINE_SAMPLES - 1))
    return [mapAI(ai), mapTF(rooflineTflops(ai, H100.sramTbs))] as Vec
})

const RIDGE_X = mapAI(H100_RIDGE_AI)
const PEAK_Y = mapTF(H100.peakTflops)

// Standard attention operating point (~12 FLOP/B -> ~40 TFLOP/s) vs FlashAttention (~240 FLOP/B -> ~804 TFLOP/s)
const STD_AI = 12
const FLASH_AI = 240

export const memorywall: SceneFunction = (s, c) => {
    const flowPhase = s.value(0)
    const showHier = s.value(1)
    const showRoof = s.value(0)
    const roofProg = s.value(0)
    const climbProg = s.value(0)

    const hierTitle = group(
        txt('NVIDIA H100 Memory Hierarchy', -840, -405, 58, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.blue),
        txt('Bandwidth gap between silicon compute and off-chip memory', -840, -340, 28, COSMOS.muted, 'sans', 'left'),
    )

    // Shot 1: Luminous bandwidth conduits with photon packets moving at true proportional speeds
    const liveHierarchy = dynamic(() => {
        if (showHier.value < 0.02) return []
        const a = showHier.value
        const ph = flowPhase.value
        const tiers = [
            {
                name: 'Tensor Cores',
                metric: '989 TFLOP/s',
                detail: 'FP16 dense matrix compute  ·  132 SMs',
                y: -175,
                width: 1180,
                speed: 2.8,
                packets: 18,
                barH: 26,
                col: COSMOS.gold,
            },
            {
                name: 'On-Chip SRAM',
                metric: '19 TB/s   ·   50 MB',
                detail: '6× faster than HBM — tiny fast scratchpad right beside cores',
                y: 25,
                width: 920,
                speed: 1.85,
                packets: 12,
                barH: 22,
                col: COSMOS.cyan,
            },
            {
                name: 'Off-Chip HBM3',
                metric: '3.35 TB/s   ·   80 GB',
                detail: 'Huge capacity — narrow pipe starving the entire chip',
                y: 225,
                width: 340,
                speed: 0.42,
                packets: 5,
                barH: 18,
                col: COSMOS.rose,
            },
        ] as const

        const xStart = -380
        const nodes: Node[] = []
        for (const tier of tiers) {
            const trackEnd = xStart + tier.width
            const trackGrad = linearGradient([xStart, tier.y], [trackEnd, tier.y], ['#121a30', tier.col])
            nodes.push(
                txt(tier.name, -840, tier.y - 16, 36, tier.col, 'serif', 'left').glow(5, tier.col).opacity(a),
                txt(tier.metric, -840, tier.y + 28, 26, COSMOS.ink, 'mono', 'left').opacity(0.92 * a),
                line([xStart, tier.y], [820, tier.y], { stroke: '#1b243c', width: tier.barH }).opacity(0.5 * a),
                line([xStart, tier.y], [trackEnd, tier.y], { stroke: trackGrad, width: tier.barH }).opacity(0.88 * a).glow(8, tier.col),
                txt(tier.detail, xStart, tier.y + 44, 26, COSMOS.muted, 'sans', 'left').opacity(0.9 * a),
            )
            // Flowing glowing photons proportional to tier speed
            for (let k = 0; k < tier.packets; k++) {
                const u = ((ph * tier.speed * 0.25 + k / tier.packets) % 1)
                const px = xStart + 14 + u * (tier.width - 28)
                nodes.push(
                    dot(tier.barH * 0.28, '#ffffff').at(px, tier.y).glow(8, tier.col).opacity(0.92 * a),
                )
            }
        }

        nodes.push(
            txt('Every byte fetched from HBM must feed ~295 math ops to keep the H100 busy', 0, 405, 30, COSMOS.gold, 'serif').opacity(a),
        )
        return group(...nodes)
    })

    // Shot 2: Real H100 Log-Log Roofline Plot
    const roofGrad = linearGradient([RX0, RY0], [RX1, RY1], [COSMOS.rose, COSMOS.amber, COSMOS.cyan, COSMOS.gold])

    const roofStatic = group(
        txt('H100 Roofline Model', -840, -415, 58, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.cyan),
        txt('Peak 989 TFLOP/s  ·  HBM3 3.35 TB/s  ·  Ridge 295 FLOP/B', 840, -412, 26, COSMOS.gold, 'mono', 'right'),
        // Axes
        line([RX0, RY0], [RX1, RY0], { stroke: '#3c4a70', width: 2.5 }),
        line([RX0, RY0], [RX0, RY1], { stroke: '#3c4a70', width: 2.5 }),
        // X-axis ticks (log scale)
        ...[1, 10, 100, 1000].flatMap((v) => {
            const x = mapAI(v)
            return [
                line([x, RY0], [x, RY1], { stroke: '#1b233a', width: 1.2 }),
                txt(String(v), x, RY0 + 38, 26, COSMOS.muted, 'mono'),
            ]
        }),
        // Y-axis ticks (log scale)
        ...[10, 100, 989].flatMap((v) => {
            const y = mapTF(v)
            return [
                line([RX0, y], [RX1, y], { stroke: '#1b233a', width: 1.2 }),
                txt(String(v), RX0 - 24, y, 26, v === 989 ? COSMOS.gold : COSMOS.muted, 'mono', 'right'),
            ]
        }),
        txt('Arithmetic Intensity  (FLOP / byte)', (RX0 + RX1) / 2, RY0 + 96, 28, COSMOS.muted, 'sans'),
        txt('TFLOP/s', RX0 - 115, RY1 - 36, 28, COSMOS.muted, 'mono', 'left'),
        // SRAM dashed reference ceiling
        new Node(polyPath(SRAM_ROOF_PTS)).stroke(COSMOS.cyan, 2.2, 0.34).dash([10, 10]),
        txt('SRAM ceiling (19 TB/s)', RX0 + 22, mapTF(540), 26, COSMOS.cyan, 'mono', 'left').opacity(0.82),
        // Vertical ridge line at 295 FLOP/B
        line([RIDGE_X, RY0], [RIDGE_X, PEAK_Y], { stroke: COSMOS.gold, width: 2, dash: [8, 8] }).opacity(0.65),
        txt('Ridge: 295', RIDGE_X, RY0 + 38, 26, COSMOS.gold, 'mono'),
        txt('MEMORY-BOUND VALLEY', mapAI(14), mapTF(3.6), 26, COSMOS.rose, 'mono', 'left').opacity(0.85),
        txt('COMPUTE ROOF (989 TFLOP/s)', mapAI(450), PEAK_Y - 34, 26, COSMOS.gold, 'mono', 'left'),
    )

    const liveRoof = dynamic(() => {
        if (showRoof.value < 0.02) return []
        const a = showRoof.value
        const count = Math.max(2, Math.floor(roofProg.value * ROOFLINE_SAMPLES))
        const roofPts = HBM_ROOF_PTS.slice(0, count)

        const stdX = mapAI(STD_AI)
        const stdY = mapTF(rooflineTflops(STD_AI, H100.hbmTbs))

        const nodes: Node[] = [
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#5ce1e618'],
                    [0.5, '#ff6b8b10'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(RIDGE_X, PEAK_Y + 80).opacity(a),
            new Node(polyPath(roofPts)).stroke(roofGrad, 5.5, 0.96 * a).glow(10, COSMOS.cyan),
            new Node(polyPath(roofPts)).stroke('#ffffff', 1.4, 0.4 * a),
        ]

        if (roofProg.value > 0.35) {
            const pOp = Math.min(1, (roofProg.value - 0.35) * 3) * a
            const pulseR = 16 + ((flowPhase.value * 1.4) % 1) * 36
            nodes.push(
                circle(pulseR, { fill: null, stroke: COSMOS.rose, width: 2.2 }).at(stdX, stdY).opacity((1 - ((flowPhase.value * 1.4) % 1)) * 0.8 * pOp),
                dot(10, COSMOS.rose).at(stdX, stdY).glow(14, COSMOS.rose).opacity(pOp),
                dot(4.5, '#ffffff').at(stdX, stdY).opacity(pOp),
                txt('Standard Attention', stdX + 26, stdY + 52, 30, COSMOS.rose, 'serif', 'left').glow(6, COSMOS.rose).opacity(pOp),
                txt('~12 FLOP/B  →  40 TFLOP/s', stdX + 26, stdY + 90, 26, COSMOS.amber, 'mono', 'left').opacity(pOp),
            )
        }

        if (climbProg.value > 0.02) {
            const cp = climbProg.value
            const curAI = Math.pow(10, Math.log10(STD_AI) + (Math.log10(FLASH_AI) - Math.log10(STD_AI)) * cp)
            const curTF = rooflineTflops(curAI, H100.hbmTbs)
            const cx = mapAI(curAI)
            const cy = mapTF(curTF)
            const trailPts: Vec[] = Array.from({ length: 40 }, (_, i) => {
                const u = (i / 39) * cp
                const ai = Math.pow(10, Math.log10(STD_AI) + (Math.log10(FLASH_AI) - Math.log10(STD_AI)) * u)
                return [mapAI(ai), mapTF(rooflineTflops(ai, H100.hbmTbs))] as Vec
            })
            nodes.push(
                new Node(polyPath(trailPts)).stroke(COSMOS.gold, 5, 0.9 * a).glow(10, COSMOS.gold),
                dot(11, COSMOS.gold).at(cx, cy).glow(16, COSMOS.gold).opacity(a),
                dot(5, '#ffffff').at(cx, cy).opacity(a),
            )
            if (cp > 0.55) {
                const lOp = Math.min(1, (cp - 0.55) * 2.5) * a
                nodes.push(
                    txt('Tiled FlashAttention', RIDGE_X + 28, PEAK_Y + 62, 30, COSMOS.gold, 'serif', 'left').glow(6, COSMOS.gold).opacity(lOp),
                    txt('~240 FLOP/B → 804 TFLOP/s', RIDGE_X + 28, PEAK_Y + 100, 26, COSMOS.cyan, 'mono', 'left').opacity(lOp),
                )
            }
        }

        return group(...nodes)
    })

    s.add(liveHierarchy, hierTitle, liveRoof)
    const flowDur = Math.max(30, c.end - c.start - 0.5)
    c.at(0.1, () => s.play(flowPhase.to(18, { duration: flowDur, ease: linear })))

    c.on('Plot that gap', () => {
        s.play(showHier.to(0, { duration: 0.3 }))
        s.play(showRoof.to(1, { duration: 0.35 }))
        s.play(roofProg.to(1, { duration: 2.2 }))
    })
    c.swap('Plot that gap', hierTitle, roofStatic)
    c.on('memory-bound valley', () => {
        s.play(climbProg.to(1, { duration: 1.5 }))
    })
}

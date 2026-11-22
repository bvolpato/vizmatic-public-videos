import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, par, polyPath, radialGradient, rect, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const N_TOKS = 9
const TOK_X0 = -680
const TOK_STEP = 170

// Log-scale hardware roofline mapping for H100 (AI in [0.5 .. 2048], Perf in [1 .. 1500 TFLOP/s])
const RL_LEFT = -140
const RL_RIGHT = 820
const RL_BOT = 310
const RL_TOP = -245
const mapLogAI = (ai: number) => RL_LEFT + ((Math.log2(ai) - Math.log2(0.5)) / (Math.log2(2048) - Math.log2(0.5))) * (RL_RIGHT - RL_LEFT)
const mapLogPerf = (tf: number) => RL_BOT - ((Math.log10(tf) - 0) / (Math.log10(1600) - 0)) * (RL_BOT - RL_TOP)

const RIDGE_AI = 295
const PEAK_TF = 989
const ROOFLINE_PTS: Vec[] = [
    [mapLogAI(0.5), mapLogPerf(Math.min(PEAK_TF, 0.5 * 3.35))],
    [mapLogAI(1.0), mapLogPerf(Math.min(PEAK_TF, 1.0 * 3.35))],
    [mapLogAI(8.0), mapLogPerf(Math.min(PEAK_TF, 8.0 * 3.35))],
    [mapLogAI(64.0), mapLogPerf(Math.min(PEAK_TF, 64.0 * 3.35))],
    [mapLogAI(RIDGE_AI), mapLogPerf(PEAK_TF)],
    [mapLogAI(2048), mapLogPerf(PEAK_TF)],
]

export const kvcache: SceneFunction = (s, c) => {
    const seqProg = s.value(1)
    const showCache = s.value(1)
    const showWall = s.value(0)
    const streamPhase = s.value(0)

    // ── Shot 1: Recompute O(N^2) vs KV Cache O(N) growing glowing token-history ribbons ──
    const cacheTitle = group(
        txt('KV CACHE MEMORY ARCHITECTURE', 0, -420, 26, COSMOS.cyan, 'mono'),
        txt('Save past Keys & Values — slash O(N²) to O(N)', 0, -352, 54, COSMOS.ink, 'serif').glow(5, '#38bdf8'),
    )

    const liveCache = dynamic(() => {
        if (showCache.value < 0.02) return []
        const a = showCache.value
        const count = Math.max(2, Math.min(N_TOKS, Math.floor(seqProg.value)))
        const nodes: Node[] = []

        // Top band: Naive O(N^2) recomputation mesh in warning rose
        const naiveY = -120
        nodes.push(
            txt('WITHOUT CACHE  ·  O(N²) recompute every step', TOK_X0 - 60, naiveY - 126, 28, COSMOS.rose, 'mono', 'left').opacity(a),
            txt(`${(count * (count + 1)) / 2}× K,V ops`, 820, naiveY - 126, 30, COSMOS.rose, 'mono', 'right').opacity(a),
        )
        for (let i = 0; i < count; i++) {
            const x = TOK_X0 + i * TOK_STEP
            const isNewest = i === count - 1
            // Redundant backward recompute arcs from newest token back across ALL previous tokens
            if (isNewest) {
                for (let j = 0; j < i; j++) {
                    const px = TOK_X0 + j * TOK_STEP
                    const midX = (px + x) * 0.5
                    const lift = 18 + Math.min(38, (i - j) * 4.5)
                    const pts: Vec[] = [[px, naiveY - 28], [midX, naiveY - 28 - lift], [x, naiveY - 28]]
                    nodes.push(new Node(polyPath(pts)).stroke(COSMOS.rose, 2.0, 0.55 * a))
                }
            }
            nodes.push(
                rect(144, 54, { fill: '#22101a', stroke: COSMOS.rose, width: isNewest ? 3.2 : 2.0, radius: 10 })
                    .at(x, naiveY).opacity(0.9 * a).glow(isNewest ? 9 : 4, COSMOS.rose),
                txt(`K${i + 1}, V${i + 1}`, x, naiveY, 26, COSMOS.rose, 'mono').opacity(a),
            )
        }

        // Bottom band: Luminous K (cyan) & V (violet) cached ribbons extending linearly!
        const kY = 148
        const vY = 232
        const ribbonEnd = TOK_X0 + (count - 1) * TOK_STEP + 58
        const kGrad = linearGradient([TOK_X0 - 60, kY], [ribbonEnd, kY], [COSMOS.blue, COSMOS.cyan])
        const vGrad = linearGradient([TOK_X0 - 60, vY], [ribbonEnd, vY], ['#6366f1', COSMOS.violet])

        nodes.push(
            txt('WITH KV CACHE  ·  O(N) append 1 new slice per token', TOK_X0 - 40, kY - 82, 28, COSMOS.cyan, 'mono', 'left').opacity(a),
            txt(`${count} slices  ·  +${(count * 320).toLocaleString('en-US')} KiB (70B)`, 820, kY - 82, 28, COSMOS.emerald, 'mono', 'right').opacity(a),
            line([TOK_X0 - 58, kY], [ribbonEnd, kY], { stroke: kGrad, width: 42 }).opacity(0.16 * a).glow(10, COSMOS.cyan),
            line([TOK_X0 - 58, vY], [ribbonEnd, vY], { stroke: vGrad, width: 42 }).opacity(0.16 * a).glow(10, COSMOS.violet),
        )

        for (let i = 0; i < count; i++) {
            const x = TOK_X0 + i * TOK_STEP
            const isNewest = i === count - 1
            nodes.push(
                rect(112, 50, {
                    fill: isNewest ? '#0e2938' : '#111626',
                    stroke: isNewest ? COSMOS.gold : COSMOS.cyan,
                    width: isNewest ? 3.4 : 2.2,
                    radius: 10,
                }).at(x, kY).opacity(a).glow(isNewest ? 12 : 5, isNewest ? COSMOS.gold : COSMOS.cyan),
                txt(`K${i + 1}`, x, kY, 26, isNewest ? COSMOS.gold : COSMOS.cyan, 'mono').opacity(a),
                rect(112, 50, {
                    fill: isNewest ? '#201336' : '#111626',
                    stroke: isNewest ? COSMOS.gold : COSMOS.violet,
                    width: isNewest ? 3.4 : 2.2,
                    radius: 10,
                }).at(x, vY).opacity(a).glow(isNewest ? 12 : 5, isNewest ? COSMOS.gold : COSMOS.violet),
                txt(`V${i + 1}`, x, vY, 26, isNewest ? COSMOS.gold : COSMOS.violet, 'mono').opacity(a),
            )
        }

        nodes.push(
            txt('Only the newest token computes fresh K, V — history streams directly from VRAM', 0, 368, 30, COSMOS.muted, 'sans').opacity(a),
        )
        return group(...nodes)
    })

    // ── Shot 2: HBM Memory Bandwidth Wall & O(1) Arithmetic Intensity Roofline ──
    const wallCopy = group(
        txt('THE HBM MEMORY WALL', -850, -395, 26, COSMOS.rose, 'mono', 'left'),
        txt('99% of the GPU', -854, -310, 62, COSMOS.ink, 'serif', 'left'),
        txt('waits on memory', -854, -238, 62, COSMOS.rose, 'serif', 'left').glow(7, COSMOS.rose),
        tex(String.raw`\text{AI} = \frac{2P \cdot B}{2P + \text{KV}} \approx 1\;\text{FLOP/byte}`, {
            size: 38,
            color: COSMOS.gold,
        }).at(-540, -90).glow(6, COSMOS.gold),
        txt('70B FP16 weights:  140 GB / token', -850, 90, 29, COSMOS.cyan, 'mono', 'left'),
        txt('H100 HBM peak:    3.35 TB/s', -850, 148, 29, COSMOS.muted, 'mono', 'left'),
        txt('Batch-1 decode:   ~1 FLOP/byte', -850, 206, 29, COSMOS.rose, 'mono', 'left'),
        txt('Compute ridge:    295 FLOP/byte', -850, 264, 29, COSMOS.gold, 'mono', 'left'),
    )

    const liveWall = dynamic(() => {
        if (showWall.value < 0.02) return []
        const a = showWall.value
        const ph = streamPhase.value
        const roofGrad = linearGradient([RL_LEFT, RL_BOT], [RL_RIGHT, RL_TOP], [COSMOS.rose, COSMOS.cyan, COSMOS.gold])
        const b1X = mapLogAI(1.0)
        const b1Y = mapLogPerf(3.35)
        const ridgeX = mapLogAI(RIDGE_AI)
        const ridgeY = mapLogPerf(PEAK_TF)
        const pulse = (ph * 0.45) % 1

        const nodes: Node[] = [
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#ff6b8b22'],
                    [0.5, '#5ce1e612'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(b1X + 80, b1Y - 40).opacity(a),
            // Axes
            line([RL_LEFT, RL_BOT], [RL_RIGHT + 20, RL_BOT], { stroke: '#3a4a70', width: 2.2 }).opacity(a),
            line([RL_LEFT, RL_BOT], [RL_LEFT, RL_TOP - 20], { stroke: '#3a4a70', width: 2.2 }).opacity(a),
            // Ridge vertical divider
            line([ridgeX, RL_BOT], [ridgeX, ridgeY], { stroke: COSMOS.gold, width: 1.8, dash: [6, 8] }).opacity(0.65 * a),
            // Roofline curve
            new Node(polyPath(ROOFLINE_PTS)).stroke(roofGrad, 5.2, 0.96 * a).glow(10, COSMOS.cyan),
            new Node(polyPath(ROOFLINE_PTS)).stroke('#ffffff', 1.4, 0.36 * a),
            // Region labels
            txt('MEMORY-BOUND SLOPE (3.35 TB/s)', RL_LEFT + 205, RL_TOP + 125, 26, COSMOS.cyan, 'mono').opacity(a),
            txt('989 TFLOP/s CEILING', ridgeX + 20, ridgeY - 40, 26, COSMOS.gold, 'mono').opacity(a),
            txt('Arithmetic Intensity (FLOPs / byte)', (RL_LEFT + RL_RIGHT) * 0.5, RL_BOT + 54, 28, COSMOS.muted, 'sans').opacity(a),
            txt('TFLOP/s', RL_LEFT, RL_TOP - 46, 26, COSMOS.muted, 'mono').opacity(a),
            // Animated streaming HBM particles climbing the memory wall toward the ridge
            ...Array.from({ length: 7 }, (_, i) => {
                const u = ((ph * 0.32 + i / 7) % 1)
                const ai = Math.pow(2, Math.log2(0.7) + u * (Math.log2(RIDGE_AI) - Math.log2(0.7)))
                const px = mapLogAI(ai)
                const py = mapLogPerf(Math.min(PEAK_TF, ai * 3.35))
                return dot(5, COSMOS.cyan).at(px, py).glow(8, COSMOS.cyan).opacity(0.8 * a)
            }),
            // Batch-1 decode trapped at O(1) arithmetic intensity!
            circle(16 + pulse * 64, { fill: null, stroke: COSMOS.rose, width: 2.6 })
                .at(b1X, b1Y).opacity((1 - pulse) * 0.85 * a).glow(10, COSMOS.rose),
            dot(10, '#ffffff').at(b1X, b1Y).glow(16, COSMOS.rose).opacity(a),
            txt('Batch-1 Decode', b1X + 95, b1Y + 4, 30, COSMOS.rose, 'sans', 'left').glow(6, COSMOS.rose).opacity(a),
            txt('AI ≈ 1  (99% compute idle!)', b1X + 95, b1Y + 44, 26, COSMOS.amber, 'mono', 'left').opacity(a),
            // Ridge beacon
            dot(8, '#ffffff').at(ridgeX, ridgeY).glow(14, COSMOS.gold).opacity(a),
            txt('295', ridgeX, RL_BOT + 26, 26, COSMOS.gold, 'mono').opacity(a),
            txt('1', b1X, RL_BOT + 26, 26, COSMOS.rose, 'mono').opacity(a),
        ]
        return group(...nodes)
    })

    s.add(liveCache, cacheTitle)
    const cacheDur = Math.max(4.0, c.cue('hidden wall').start - c.start - 0.5)
    c.at(0.2, () => s.play(seqProg.to(N_TOKS + 0.4, { duration: cacheDur, ease: linear })))

    const wallDur = Math.max(4.0, c.end - c.cue('hidden wall').start - 0.6)
    c.on('hidden wall', () => {
        s.play(par(
            showCache.to(0, { duration: 0.25 }),
            showWall.to(1, { duration: 0.35 }),
            streamPhase.to(6.0, { duration: wallDur, ease: linear }),
        ))
    })
    c.swap('hidden wall', cacheTitle, wallCopy)
    s.add(liveWall)
}

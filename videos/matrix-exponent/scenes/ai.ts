import {
    Node, circle, curve3d, delay, dot, dynamic, group, line, line3d, linear, par, point3d, radialGradient, rect, scene3d,
    surface, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { omegaOfT, rectangularOmega } from '../math'

// Map (b, c) in [0.08, 1.0]^2 to world coords [-3.2, 3.2]^2 and height z = (omega(1, b, c) - 1.5) * 3.1
const W_HALF = 3.2
function bcToWorld(b: number, c: number): [number, number] {
    return [-W_HALF + ((b - 0.08) / 0.92) * (2 * W_HALF), -W_HALF + ((c - 0.08) / 0.92) * (2 * W_HALF)]
}
function surfaceZ(wx: number, wy: number): number {
    const b = 0.08 + ((wx + W_HALF) / (2 * W_HALF)) * 0.92
    const c = 0.08 + ((wy + W_HALF) / (2 * W_HALF)) * 0.92
    return (rectangularOmega(1, b, c) - 1.3) * 2.6
}

export const ai: SceneFunction = (s, c) => {
    const tracerT = s.value(0.08)
    const showSurf = s.value(1)
    const showAi = s.value(0)
    const aiProg = s.value(0)

    // ── Shot 1: Orbiting 3D Exact Rectangular Exponent Surface omega(1, b, c) ──
    const surfView = scene3d({
        theta: -0.78,
        phi: 1.04,
        distance: 17.6,
        unit: 102,
        perspective: true,
        ambient: 0.42,
        shine: 0.36,
        brightness: 1.12,
        fog: 0.1,
        focus: [0, 0, 1.15],
    }).at(320, -16)

    const rectSurface = surface((wx, wy) => surfaceZ(wx, wy), {
        x: [-W_HALF, W_HALF],
        y: [-W_HALF, W_HALF],
        resolution: [44, 44],
        colors: ['#0c122e', '#1e2c6b', '#4c2f8a', '#2180c2', '#5ce1e6', '#ffd166'],
        mesh: '#7ce8ff',
        meshOpacity: 0.22,
        meshWidth: 0.65,
        opacity: 0.86,
    })

    // Blazing golden ridge along b = 1, c = t in [0.08, 1.0]: FLAT at 2.00 for t <= 1/2, climbs to 9/4 at t = 1!
    const dualRidge = curve3d(
        (u): Vec3 => {
            const t = 0.08 + u * 0.92
            const [wx, wy] = bcToWorld(1.0, t)
            return [wx, wy, (omegaOfT(t) - 1.3) * 2.6 + 0.08]
        },
        0,
        1,
        { color: COSMOS.gold, width: 6.0, glow: 16, blend: 'screen', samples: 120, opacity: 1, bias: 0.14 },
    )

    // Highlighted knee point at t = alpha = 1/2 where omega(1, 1, t) leaves 2.00
    const [kneeX, kneeY] = bcToWorld(1.0, 0.5)
    const kneeZ = (omegaOfT(0.5) - 1.3) * 2.6 + 0.08
    const [topX, topY] = bcToWorld(1.0, 1.0)
    const topZ = (omegaOfT(1.0) - 1.3) * 2.6 + 0.08

    surfView.add(
        rectSurface,
        dualRidge,
        line3d([-W_HALF, -W_HALF, 0], [W_HALF, -W_HALF, 0], { color: '#6b7aa0', width: 2.0, opacity: 0.8 }),
        line3d([-W_HALF, -W_HALF, 0], [-W_HALF, W_HALF, 0], { color: '#6b7aa0', width: 2.0, opacity: 0.8 }),
        line3d([-W_HALF, -W_HALF, 0], [-W_HALF, -W_HALF, 2.6], { color: COSMOS.gold, width: 2.4, opacity: 0.88, glow: 6, blend: 'screen' }),
        // Vertical golden beacon at alpha = 1/2 knee and square peak (1,1,1) = 9/4
        point3d([kneeX, kneeY, kneeZ], { color: COSMOS.emerald, radius: 9.5, glow: 18, blend: 'screen' }),
        point3d([topX, topY, topZ], { color: COSMOS.gold, radius: 10.5, glow: 20, blend: 'screen' }),
        // Animated tracer gliding along the ridge from t = 0.08 -> 0.5 -> 1.0
        point3d((): Vec3 => {
            const t = Math.max(0.08, Math.min(1.0, tracerT.value))
            const [wx, wy] = bcToWorld(1.0, t)
            return [wx, wy, (omegaOfT(t) - 1.3) * 2.6 + 0.14]
        }, { color: '#ffffff', radius: 10, glow: 22, blend: 'screen' }),
    )

    const surfAura = circle(580, {
        fill: radialGradient([0, 0], 580, [
            [0, '#5ce1e624'],
            [0.5, '#ffd16614'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(310, 28).set('blend', 'screen')

    const surfCopy = group(
        txt('EXACT RECTANGULAR EXPONENT LAW', -855, -405, 26, COSMOS.emerald, 'mono', 'left'),
        txt('Rectangular', -860, -322, 62, COSMOS.ink, 'serif', 'left'),
        txt('Sweet Spot', -860, -248, 62, COSMOS.emerald, 'serif', 'left').glow(7, COSMOS.emerald),
        tex(String.raw`\omega(a,b,c) = x + y + \frac{[\max(0,(x+y)z - xy)]^2}{4xyz}`, {
            size: 29,
            color: COSMOS.cyan,
        }).at(-520, -135).glow(5, COSMOS.cyan),
        // Clean flanking 2D captions above/below the 3D surface
        txt('GOLDEN RIDGE:  ω(1, 1, t)  =  2.00  for t ≤ 1/2  →  9/4 at t = 1', 310, -405, 26, COSMOS.gold, 'mono'),
        txt('Shape (n × nᵗ) · (nᵗ × n)   ·   Dual Exponent  α = 1/2', 310, 442, 26, COSMOS.emerald, 'mono'),
    )

    const liveSurfReadout = dynamic(() => {
        const a = showSurf.value
        if (a < 0.02) return []
        const t = Math.max(0.08, Math.min(1.0, tracerT.value))
        const w = omegaOfT(t)
        const inFree = t <= 0.505
        const col = inFree ? COSMOS.emerald : COSMOS.gold
        return group(
            txt(`CURRENT SLICE   t = ${t.toFixed(2)}`, -855, 18, 27, COSMOS.muted, 'mono', 'left').opacity(a),
            txt(`ω(1, 1, ${t.toFixed(2)}) = ${w.toFixed(4)}`, -855, 86, 50, col, 'mono', 'left').glow(10, col).opacity(a),
            txt(
                inFree ? 'QUADRATIC FREE ZONE  (n × √n × n)' : 'CLIMBING TO SQUARE WALL  (9/4)',
                -855,
                156,
                27,
                col,
                'mono',
                'left',
            ).opacity(a),
            txt('Tall-skinny & low-rank projections (LoRA, heads)', -855, 265, 28, COSMOS.ink, 'sans', 'left').opacity(a),
            txt('can run in quadratic O(n²⁺ᵒ⁽¹⁾) operations up to √n.', -855, 318, 28, COSMOS.muted, 'sans', 'left').opacity(a),
        )
    })

    // ── Shot 2: GPU & AI Reality Check (Honest Silicon vs Theory Contrast) ──
    const aiHeader = group(
        txt('IMPLICATIONS FOR AI & GPU SILICON', 0, -418, 26, COSMOS.gold, 'mono'),
        txt('Will GPUs run in n²·²⁵ tomorrow?  No — here is what actually changes', 0, -346, 46, COSMOS.ink, 'serif')
            .glow(5, COSMOS.cyan),
    )

    const liveAi = dynamic(() => {
        const a = showAi.value
        if (a < 0.02) return []
        const p = aiProg.value
        const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 4)
        const nodes: Node[] = [
            // Soft central vertical light filament dividing the two columns (zero boxy cards!)
            line([0, -245], [0, 345], { stroke: '#2c3d64', width: 2.2 }).opacity(a),
            dot(7, COSMOS.gold).at(0, -245 + p * 590).glow(16, COSMOS.gold).opacity(a).set('blend', 'screen'),

            // Left Column: Why H100/B200 GEMM stays O(n^3) today
            txt('WHY GPUs STAY O(n³) TODAY', -845, -225, 28, COSMOS.rose, 'mono', 'left').glow(6, COSMOS.rose).opacity(a),
            dot(7, COSMOS.rose).at(-835, -142).glow(10, COSMOS.rose).opacity(a),
            txt('Galactic constants: crossover n ≫ model width (8k–16k)', -808, -142, 29, COSMOS.ink, 'sans', 'left').opacity(a),
            dot(7, COSMOS.amber).at(-835, -62).glow(10, COSMOS.amber).opacity(a),
            txt('HBM memory bandwidth dominates raw scalar FLOPs', -808, -62, 29, COSMOS.ink, 'sans', 'left').opacity(a),
            dot(7, COSMOS.rose).at(-835, 18).glow(10, COSMOS.rose).opacity(a),
            txt('Tensor Cores demand systolic tiling & FP8 stability', -808, 18, 29, COSMOS.ink, 'sans', 'left').opacity(a),

            // Animated HBM-vs-Compute bottleneck bar on bottom-left
            txt('GPU REALITY:  MEMORY & TILING BOUND', -845, 138, 26, COSMOS.muted, 'mono', 'left').opacity(a),
            rect(740, 38, { fill: '#19101f', stroke: COSMOS.rose, width: 2.2, radius: 10 }).at(-475, 192).opacity(a),
            rect(Math.max(16, (560 + pulse * 48) * Math.min(1, p * 2.2)), 28, { fill: '#ff6b8b68', stroke: null, radius: 7 })
                .at(-840 + Math.max(16, (560 + pulse * 48) * Math.min(1, p * 2.2)) * 0.5, 192).glow(8, COSMOS.rose).opacity(a),
            txt('cuBLAS / FlashAttention  (hardware-bound)', -845, 246, 26, COSMOS.rose, 'mono', 'left').opacity(a),

            // Right Column: What permanently changes for AI & algorithms
            txt('WHAT CHANGES PERMANENTLY FOR AI', 70, -225, 28, COSMOS.emerald, 'mono', 'left').glow(6, COSMOS.emerald).opacity(a),
            dot(7, COSMOS.gold).at(80, -142).glow(10, COSMOS.gold).opacity(a),
            txt('Hard dense floor: no O(n²) algebraic silver bullet', 107, -142, 29, COSMOS.ink, 'sans', 'left').opacity(a),
            dot(7, COSMOS.emerald).at(80, -62).glow(10, COSMOS.emerald).opacity(a),
            txt('α = 1/2 free zone validates low-rank & tall-skinny layers', 107, -62, 29, COSMOS.ink, 'sans', 'left').opacity(a),
            dot(7, COSMOS.cyan).at(80, 18).glow(10, COSMOS.cyan).opacity(a),
            txt('Sparsity, MoE & structured kernels beat dense scaling', 107, 18, 29, COSMOS.ink, 'sans', 'left').opacity(a),

            // Animated architecture-shift bar on bottom-right
            txt('AI FRONTIER:  STRUCTURE OVER BRUTE DENSE MATMUL', 70, 138, 26, COSMOS.muted, 'mono', 'left').opacity(a),
            rect(760, 38, { fill: '#0e1d26', stroke: COSMOS.emerald, width: 2.2, radius: 10 }).at(450, 192).opacity(a),
            rect(Math.max(16, (660 + pulse * 42) * Math.min(1, p * 2.0)), 28, { fill: '#6ee7b768', stroke: null, radius: 7 })
                .at(75 + Math.max(16, (660 + pulse * 42) * Math.min(1, p * 2.0)) * 0.5, 192).glow(8, COSMOS.emerald).opacity(a),
            txt('MoE  ·  LoRA / Low-Rank  ·  FlashAttention  ·  FP4/FP8', 70, 246, 26, COSMOS.emerald, 'mono', 'left').opacity(a),

            // Bottom unifying insight
            txt('Theory closes the dense dream — engineering wins through sparsity, structure, and memory.', 0, 392, 30, COSMOS.gold, 'sans')
                .glow(5, COSMOS.gold).opacity(a),
        ]
        return group(...nodes)
    })

    s.add(surfAura, surfView, surfCopy, liveSurfReadout, liveAi)
    const surfDur = Math.max(4.0, c.cue('So will GPUs').start - c.start - 0.4)
    const freeRel = Math.max(2.0, c.cue('literally free').start - c.start - 0.8)
    const climbDur = Math.max(1.2, surfDur - freeRel - 0.25)
    c.at(0.1, () => {
        s.play(par(
            surfView.orbit({ theta: -0.18, phi: 0.88 }, { duration: surfDur }),
            tracerT.to(0.5, { duration: freeRel * 0.88 }),
        ))
    })
    c.at(freeRel, () => {
        s.play(tracerT.to(1.0, { duration: climbDur }))
    })

    const aiRel = c.cue('So will GPUs').start - c.start
    const aiDur = Math.max(3.5, c.end - c.cue('So will GPUs').start - 0.5)
    c.swap('So will GPUs', [surfAura, surfView, surfCopy], aiHeader)
    c.at(aiRel, () => {
        s.play(par(
            showSurf.to(0, { duration: 0.16 }),
            delay(showAi.to(1, { duration: 0.28 }), 0.2),
            delay(aiProg.to(1, { duration: aiDur, ease: linear }), 0.25),
        ))
    })
}

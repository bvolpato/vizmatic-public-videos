import {
    Node, arrow, circle, dot, dynamic, fadeIn, gridPlane3d, group, line, line3d, linear, linearGradient, par,
    parametricSurface, point3d, polyPath, radialGradient, rect, scalarField, scene3d, tex,
    type Scene3D, type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

/** Add a glowing isometric 3D tensor slab to a Scene3D, returning all its Object3D nodes so opacity can animate! */
function createSlab3D(
    view: Scene3D,
    x0: number,
    y0: number,
    z0: number,
    dx: number,
    dy: number,
    dz: number,
    fillColor: string,
    edgeColor: string,
    faceOpacity = 0.72,
    edgeWidth = 1.9,
    edgeGlow = 6,
): Node[] {
    const x1 = x0 + dx
    const y1 = y0 + dy
    const z1 = z0 + dz
    const opts = { resolution: [1, 1] as const, color: fillColor, opacity: faceOpacity, mesh: false as const, shaded: true }
    const es = { color: edgeColor, width: edgeWidth, opacity: 0.92, glow: edgeGlow, blend: 'screen' as const }
    const objs: Node[] = [
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y0 + v * dy, z1], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y0 + v * dy, z0], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y1, z0 + v * dz], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x1, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
        line3d([x0, y0, z0], [x1, y0, z0], es),
        line3d([x1, y0, z0], [x1, y1, z0], es),
        line3d([x1, y1, z0], [x0, y1, z0], es),
        line3d([x0, y1, z0], [x0, y0, z0], es),
        line3d([x0, y0, z1], [x1, y0, z1], es),
        line3d([x1, y0, z1], [x1, y1, z1], es),
        line3d([x1, y1, z1], [x0, y1, z1], es),
        line3d([x0, y1, z1], [x0, y0, z1], es),
        line3d([x0, y0, z0], [x0, y0, z1], es),
        line3d([x1, y0, z0], [x1, y0, z1], es),
        line3d([x1, y1, z0], [x1, y1, z1], es),
        line3d([x0, y1, z0], [x0, y1, z1], es),
    ]
    view.add(...objs)
    return objs
}

// Log-scale hardware roofline mapping for H100 (AI in [0.5 .. 2048], Perf in [1 .. 1600 TFLOP/s])
const RL_LEFT = -60
const RL_RIGHT = 845
const RL_BOT = 310
const RL_TOP = -240
const LOG2_MIN = Math.log2(0.5)
const LOG2_MAX = Math.log2(2048)
const LOG10_MAX = Math.log10(1600)
const mapLogAI = (ai: number) => RL_LEFT + ((Math.log2(ai) - LOG2_MIN) / (LOG2_MAX - LOG2_MIN)) * (RL_RIGHT - RL_LEFT)
const mapLogPerf = (tf: number) => RL_BOT - (Math.log10(tf) / LOG10_MAX) * (RL_BOT - RL_TOP)

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

const N_STEPS = 6

export const kvcache: SceneFunction = (s, c) => {
    const seqProg = s.value(1)
    const showCache = s.value(1)
    const showWall = s.value(0)
    const streamPhase = s.value(0)

    // ── Shot 1: Isometric 3D KV Tensor Slabs — Crimson O(N^2) Pyramid vs Translucent Gold VRAM Crystal ──
    const cacheTitle = group(
        txt('KV CACHE MEMORY ARCHITECTURE', 0, -430, 26, COSMOS.cyan, 'mono'),
        txt('Save past Keys & Values — slash O(N²) to O(N)', 0, -362, 52, COSMOS.ink, 'serif').glow(5, '#38bdf8'),
    )

    // LEFT Isometric 3D Stage: Growing crimson O(N^2) recomputation pyramid
    const pyramidView = scene3d({
        theta: -0.78,
        phi: 1.04,
        distance: 16.4,
        unit: 88,
        perspective: true,
        ambient: 0.44,
        shine: 0.3,
        brightness: 1.1,
        fog: 0.1,
        focus: [0, 0, 1.2],
    }).at(-445, 8)

    pyramidView.add(
        gridPlane3d({ x: [-3.4, 3.4], y: [-2.8, 2.8], z: 0, step: 1.1, color: '#3b1f32', width: 1.1, opacity: 0.52 }),
    )

    // Build 6 pyramid layers: step r (0..5) adds (r+1) recomputed crimson K,V tensor slabs!
    const pyramidLayers: Node[][] = []
    for (let step = 0; step < N_STEPS; step++) {
        const layerNodes: Node[] = []
        const nSlabs = step + 1
        const z = 0.05 + step * 0.52
        const totalW = nSlabs * 0.92
        const xStart = -totalW * 0.5
        for (let k = 0; k < nSlabs; k++) {
            const x = xStart + k * 0.92
            const isNewest = k === nSlabs - 1
            const col = isNewest ? '#ff4d79' : COSMOS.rose
            const slabObjs = createSlab3D(
                pyramidView,
                x,
                -0.62,
                z,
                0.78,
                1.24,
                0.38,
                col,
                isNewest ? COSMOS.amber : COSMOS.rose,
                isNewest ? 0.85 : 0.62,
                isNewest ? 2.4 : 1.6,
                isNewest ? 10 : 5,
            )
            layerNodes.push(...slabObjs)
        }
        // Flashing crimson recomputation beam sweeping across the entire step row
        layerNodes.push(
            line3d([xStart - 0.15, 0, z + 0.44], [xStart + totalW + 0.05, 0, z + 0.44], {
                color: COSMOS.amber,
                width: 3.4,
                glow: 12,
                blend: 'screen',
                opacity: 0.9,
            }),
        )
        if (step > 0) {
            for (const n of layerNodes) n.hide()
        }
        pyramidLayers.push(layerNodes)
    }

    // RIGHT Isometric 3D Stage: Persistent translucent VRAM crystal appending 1 glowing gold slice per step
    const crystalView = scene3d({
        theta: -0.78,
        phi: 1.04,
        distance: 16.4,
        unit: 88,
        perspective: true,
        ambient: 0.46,
        shine: 0.36,
        brightness: 1.12,
        fog: 0.1,
        focus: [0, 0, 1.05],
    }).at(445, 8)

    crystalView.add(
        gridPlane3d({ x: [-3.4, 3.4], y: [-2.8, 2.8], z: 0, step: 1.1, color: '#243a5e', width: 1.1, opacity: 0.52 }),
    )
    // Persistent frosted translucent VRAM crystal vessel holding all cached K & V slices
    createSlab3D(crystalView, -3.0, -1.65, 0.04, 6.0, 3.3, 1.95, '#1b3556', COSMOS.cyan, 0.16, 1.8, 6)

    // 6 clean sequential K (cyan) & V (violet) slices + glowing golden write-slice highlight
    const crystalSlices: Node[][] = []
    for (let step = 0; step < N_STEPS; step++) {
        const x = -2.72 + step * 0.94
        const kSlice = createSlab3D(crystalView, x, -1.38, 0.18, 0.72, 1.24, 1.56, COSMOS.cyan, COSMOS.gold, 0.72, 2.2, 8)
        const vSlice = createSlab3D(crystalView, x, 0.14, 0.18, 0.72, 1.24, 1.56, COSMOS.violet, COSMOS.gold, 0.72, 2.2, 8)
        const writeBeacon = point3d([x + 0.36, 0, 2.15], { color: COSMOS.gold, radius: 7.5, glow: 14, blend: 'screen' })
        const writeBeam = line3d([x + 0.36, -1.35, 1.88], [x + 0.36, 1.35, 1.88], {
            color: COSMOS.gold,
            width: 3.4,
            glow: 12,
            blend: 'screen',
            opacity: 0.92,
        })
        crystalView.add(writeBeacon, writeBeam)
        const sliceGroup = [...kSlice, ...vSlice, writeBeacon, writeBeam]
        if (step > 0) {
            for (const n of sliceGroup) n.hide()
        }
        crystalSlices.push(sliceGroup)
    }

    const cacheAuras = group(
        circle(430, {
            fill: radialGradient([0, 0], 430, [
                [0, '#ff6b8b28'],
                [0.55, '#07091000'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(-445, 38).set('blend', 'screen'),
        circle(430, {
            fill: radialGradient([0, 0], 430, [
                [0, '#5ce1e626'],
                [0.45, '#ffd16618'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(445, 38).set('blend', 'screen'),
        line([0, -270], [0, 325], { stroke: '#253252', width: 1.8, dash: [6, 8] }).opacity(0.65),
    )

    const cacheOverlay = dynamic(() => {
        if (showCache.value < 0.02) return []
        const a = showCache.value
        const count = Math.max(1, Math.min(N_STEPS, Math.floor(seqProg.value)))
        const quadOps = (count * (count + 1)) / 2
        return group(
            // Left panel header & live O(N^2) metric
            txt('WITHOUT CACHE  ·  O(N²)', -445, -278, 28, COSMOS.rose, 'mono').glow(5, COSMOS.rose).opacity(a),
            txt(`Step ${count}  →  ${quadOps}× K,V recomputations`, -445, 326, 28, COSMOS.rose, 'mono').opacity(a),
            txt('Rebuilds entire pyramid every token', -445, 368, 26, COSMOS.muted, 'sans').opacity(a),
            // Right panel header & live O(N) metric
            txt('WITH KV CACHE  ·  O(N)', 445, -278, 28, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan).opacity(a),
            txt(`Step ${count}  →  ${count} slices  ·  +${(count * 320).toLocaleString('en-US')} KiB`, 445, 326, 28, COSMOS.emerald, 'mono').opacity(a),
            txt('Appends 1 golden K,V slice into VRAM crystal', 445, 368, 26, COSMOS.gold, 'sans').opacity(a),
        )
    })

    // ── Shot 2: HBM Memory Bandwidth Wall & O(1) Arithmetic Intensity Roofline ──
    const wallCopy = group(
        txt('THE HBM MEMORY WALL', -865, -408, 26, COSMOS.rose, 'mono', 'left'),
        txt('99% of the GPU', -870, -324, 60, COSMOS.ink, 'serif', 'left'),
        txt('waits on memory', -870, -254, 60, COSMOS.rose, 'serif', 'left').glow(7, COSMOS.rose),
        tex(String.raw`\text{AI} = \frac{2P \cdot B}{2P + \text{KV}} \approx 1\;\text{FLOP/byte}`, {
            size: 36,
            color: COSMOS.gold,
        }).at(-565, -112).glow(6, COSMOS.gold),
        txt('70B FP16 weights:  140 GB / pass', -865, 22, 27, COSMOS.cyan, 'mono', 'left'),
        txt('H100 HBM peak:     3.35 TB/s', -865, 72, 27, COSMOS.muted, 'mono', 'left'),
        txt('Batch-1 decode:    ~1 FLOP/byte', -865, 122, 27, COSMOS.rose, 'mono', 'left'),
        txt('Compute ridge:     295 FLOP/byte', -865, 172, 27, COSMOS.gold, 'mono', 'left'),
        // Live GPU Compute Utilization Meter (~0.3% active!)
        txt('GPU COMPUTE UTILIZATION', -865, 248, 26, COSMOS.muted, 'mono', 'left'),
        rect(620, 32, { fill: '#11182c', stroke: '#33446c', width: 2.0, radius: 8 }).at(-555, 294),
        rect(14, 24, { fill: COSMOS.rose, stroke: null, radius: 5 }).at(-856, 294).glow(10, COSMOS.rose),
        txt('~0.3% active', -865, 344, 28, COSMOS.rose, 'mono', 'left').glow(5, COSMOS.rose),
        txt('99.7% idle waiting on HBM', -625, 344, 26, COSMOS.dim, 'sans', 'left'),
    )

    // Crimson-to-gold scalarField shading the memory-bound wall strictly beneath the H100 roofline!
    const roofField = scalarField(
        (x, y) => {
            // x in [LOG2_MIN .. LOG2_MAX], y in [0 .. LOG10_MAX]
            const ai = Math.pow(2, x)
            const roofPerf = Math.min(PEAK_TF, ai * 3.35)
            const roofLogY = Math.log10(roofPerf)
            if (y > roofLogY) return NaN
            // Normalized horizontal climb toward the compute ridge (crimson at AI~1 -> gold near ridge)
            const u = Math.max(0, Math.min(1, (x - Math.log2(0.5)) / (Math.log2(RIDGE_AI) - Math.log2(0.5))))
            const verticalFade = 0.35 + 0.65 * Math.max(0, Math.min(1, y / Math.max(0.05, roofLogY)))
            return u * 0.85 + verticalFade * 0.15
        },
        {
            x: [LOG2_MIN, LOG2_MAX],
            y: [0, LOG10_MAX],
            domain: [0, 1],
            colors: ['#ff6b8b78', '#fb923c58', '#5ce1e63c', '#ffd1665e'],
            width: RL_RIGHT - RL_LEFT,
            height: RL_BOT - RL_TOP,
            resolution: [110, 76],
        },
    ).at((RL_LEFT + RL_RIGHT) * 0.5, (RL_TOP + RL_BOT) * 0.5).set('blend', 'screen')

    const liveWall = dynamic(() => {
        if (showWall.value < 0.02) return []
        const a = showWall.value
        const ph = streamPhase.value
        const roofGrad = linearGradient([RL_LEFT, RL_BOT], [RL_RIGHT, RL_TOP], [COSMOS.rose, COSMOS.cyan, COSMOS.gold])
        const b1X = mapLogAI(1.0)
        const b1Y = mapLogPerf(3.35)
        const specX = mapLogAI(32.0)
        const specY = mapLogPerf(32.0 * 3.35)
        const ridgeX = mapLogAI(RIDGE_AI)
        const ridgeY = mapLogPerf(PEAK_TF)
        const pulse = (ph * 0.45) % 1

        const nodes: Node[] = []

        // Full log-log gridlines (horizontal TFLOP/s + vertical FLOP/byte)
        const yTicks: readonly { val: number; label: string }[] = [
            { val: 1, label: '1' },
            { val: 10, label: '10' },
            { val: 100, label: '100' },
            { val: 1000, label: '1k' },
        ]
        for (const yt of yTicks) {
            const yy = mapLogPerf(yt.val)
            nodes.push(
                line([RL_LEFT, yy], [RL_RIGHT, yy], { stroke: '#1d2948', width: 1.4, dash: [4, 6] }).opacity(0.85 * a),
                line([RL_LEFT - 8, yy], [RL_LEFT, yy], { stroke: '#4d608e', width: 2.0 }).opacity(a),
                txt(yt.label, RL_LEFT - 18, yy, 26, COSMOS.muted, 'mono', 'right').opacity(a),
            )
        }

        const xTicks: readonly { val: number; label: string; col?: string }[] = [
            { val: 1, label: '1', col: COSMOS.rose },
            { val: 4, label: '4' },
            { val: 16, label: '16' },
            { val: 64, label: '64' },
            { val: 295, label: '295', col: COSMOS.gold },
            { val: 1024, label: '1024' },
        ]
        for (const xt of xTicks) {
            const xx = mapLogAI(xt.val)
            nodes.push(
                line([xx, RL_TOP], [xx, RL_BOT], { stroke: '#1d2948', width: 1.4, dash: [4, 6] }).opacity(0.85 * a),
                line([xx, RL_BOT], [xx, RL_BOT + 8], { stroke: '#4d608e', width: 2.0 }).opacity(a),
                txt(xt.label, xx, RL_BOT + 30, 26, xt.col ?? COSMOS.muted, 'mono').opacity(a),
            )
        }

        nodes.push(
            // Primary Axes
            line([RL_LEFT, RL_BOT], [RL_RIGHT + 14, RL_BOT], { stroke: '#4a5f8f', width: 2.4 }).opacity(a),
            line([RL_LEFT, RL_BOT], [RL_LEFT, RL_TOP - 16], { stroke: '#4a5f8f', width: 2.4 }).opacity(a),
            // Ridge vertical divider
            line([ridgeX, RL_BOT], [ridgeX, ridgeY], { stroke: COSMOS.gold, width: 2.0, dash: [6, 8] }).opacity(0.75 * a),
            // Roofline curve with additive screen glow
            new Node(polyPath(ROOFLINE_PTS)).stroke(roofGrad, 5.4, 0.98 * a).glow(12, COSMOS.cyan).set('blend', 'screen'),
            new Node(polyPath(ROOFLINE_PTS)).stroke('#ffffff', 1.5, 0.45 * a),
            // Axis titles & region captions
            txt('MEMORY-BOUND WALL (3.35 TB/s)', RL_LEFT + 28, RL_TOP + 54, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
            txt('989 TFLOP/s CEILING', ridgeX + 18, ridgeY - 40, 26, COSMOS.gold, 'mono').opacity(a),
            txt('Arithmetic Intensity (FLOP / byte)', (RL_LEFT + RL_RIGHT) * 0.5, RL_BOT + 76, 27, COSMOS.muted, 'sans').opacity(a),
            txt('TFLOP/s', RL_LEFT - 10, RL_TOP - 44, 26, COSMOS.muted, 'mono').opacity(a),
            // Glowing vector arrow showing speculative / batched decode climbing up toward the compute ridge!
            arrow([b1X + 22, b1Y - 14], [specX - 10, specY + 6], {
                stroke: COSMOS.emerald,
                width: 4.4,
                tip: 18,
            }).glow(12, COSMOS.emerald).opacity(a).set('blend', 'screen'),
            arrow([specX + 12, specY - 8], [ridgeX - 18, ridgeY + 12], {
                stroke: COSMOS.gold,
                width: 3.4,
                tip: 16,
            }).glow(10, COSMOS.gold).opacity(0.85 * a).set('blend', 'screen'),
            dot(8, '#ffffff').at(specX, specY).glow(14, COSMOS.emerald).opacity(a).set('blend', 'screen'),
            txt('Speculative / Batched ↗', specX + 26, specY + 34, 26, COSMOS.emerald, 'mono', 'left')
                .glow(6, COSMOS.emerald).opacity(a),
            // Animated streaming HBM particles climbing the memory wall toward the ridge
            ...Array.from({ length: 7 }, (_, i) => {
                const u = ((ph * 0.32 + i / 7) % 1)
                const ai = Math.pow(2, Math.log2(0.8) + u * (Math.log2(RIDGE_AI) - Math.log2(0.8)))
                const px = mapLogAI(ai)
                const py = mapLogPerf(Math.min(PEAK_TF, ai * 3.35))
                return dot(5.5, COSMOS.cyan).at(px, py).glow(10, COSMOS.cyan).opacity(0.85 * a).set('blend', 'screen')
            }),
            // Batch-1 decode trapped at O(1) arithmetic intensity!
            circle(16 + pulse * 62, { fill: null, stroke: COSMOS.rose, width: 2.8 })
                .at(b1X, b1Y).opacity((1 - pulse) * 0.88 * a).glow(10, COSMOS.rose).set('blend', 'screen'),
            dot(10, '#ffffff').at(b1X, b1Y).glow(16, COSMOS.rose).opacity(a).set('blend', 'screen'),
            txt('Batch-1 Decode', b1X + 58, b1Y + 12, 28, COSMOS.rose, 'sans', 'left').glow(6, COSMOS.rose).opacity(a),
            txt('AI ≈ 1 (~0.3% active)', b1X + 58, b1Y + 48, 26, COSMOS.amber, 'mono', 'left').opacity(a),
            // Ridge beacon
            dot(8.5, '#ffffff').at(ridgeX, ridgeY).glow(14, COSMOS.gold).opacity(a).set('blend', 'screen'),
        )
        return group(...nodes)
    })

    s.add(cacheAuras, pyramidView, crystalView, cacheOverlay, cacheTitle)
    const cacheDur = Math.max(4.0, c.cue('hidden wall').start - c.start - 0.5)
    c.at(0.15, () => {
        s.play(par(
            seqProg.to(N_STEPS + 0.4, { duration: cacheDur, ease: linear }),
            pyramidView.orbit({ theta: -0.42, phi: 0.96 }, { duration: cacheDur }),
            crystalView.orbit({ theta: -0.42, phi: 0.96 }, { duration: cacheDur }),
        ))
    })
    // Reveal each 3D pyramid layer & VRAM crystal slice cleanly in lockstep with seqProg!
    for (let step = 1; step < N_STEPS; step++) {
        const tReveal = 0.15 + ((step - 0.15) / N_STEPS) * cacheDur
        c.at(tReveal, () => {
            s.play(par(
                ...pyramidLayers[step]!.map((n) => fadeIn(n, { duration: 0.35 })),
                ...crystalSlices[step]!.map((n) => fadeIn(n, { duration: 0.35 })),
            ))
        })
    }

    const wallDur = Math.max(4.0, c.end - c.cue('hidden wall').start - 0.6)
    c.swap('hidden wall', [cacheAuras, pyramidView, crystalView, cacheTitle], [roofField, wallCopy])
    c.on('hidden wall', () => {
        s.play(par(
            showCache.to(0, { duration: 0.25 }),
            showWall.to(1, { duration: 0.35 }),
            streamPhase.to(6.0, { duration: wallDur, ease: linear }),
        ))
    })
    s.add(liveWall.zIndex(5))
}

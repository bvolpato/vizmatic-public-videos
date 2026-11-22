import {
    Node, circle, contourPaths, dot, dynamic, group, line, line3d, linear, linearGradient,
    parametricSurface, points3d, polyPath, radialGradient, scalarField, scene3d,
    type SceneFunction, type Vec, type Vec3,
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
const LOG_AI_MIN = Math.log10(AI_MIN)
const LOG_AI_MAX = Math.log10(AI_MAX)
const LOG_TF_MIN = Math.log10(TF_MIN)
const LOG_TF_MAX = Math.log10(TF_MAX)

const mapAI = (ai: number) => RX0 + ((Math.log10(ai) - LOG_AI_MIN) / (LOG_AI_MAX - LOG_AI_MIN)) * (RX1 - RX0)
const mapTF = (tf: number) => RY0 - ((Math.log10(tf) - LOG_TF_MIN) / (LOG_TF_MAX - LOG_TF_MIN)) * (RY0 - RY1)
const mapLogPt = (logAi: number, logTf: number): Vec => [
    RX0 + ((logAi - LOG_AI_MIN) / (LOG_AI_MAX - LOG_AI_MIN)) * (RX1 - RX0),
    RY0 - ((logTf - LOG_TF_MIN) / (LOG_TF_MAX - LOG_TF_MIN)) * (RY0 - RY1),
]

const ROOFLINE_SAMPLES = 180
const HBM_ROOF_PTS: Vec[] = Array.from({ length: ROOFLINE_SAMPLES }, (_, i) => {
    const ai = Math.pow(10, LOG_AI_MIN + ((LOG_AI_MAX - LOG_AI_MIN) * i) / (ROOFLINE_SAMPLES - 1))
    return [mapAI(ai), mapTF(rooflineTflops(ai, H100.hbmTbs))] as Vec
})
const SRAM_ROOF_PTS: Vec[] = Array.from({ length: ROOFLINE_SAMPLES }, (_, i) => {
    const ai = Math.pow(10, LOG_AI_MIN + ((LOG_AI_MAX - LOG_AI_MIN) * i) / (ROOFLINE_SAMPLES - 1))
    return [mapAI(ai), mapTF(rooflineTflops(ai, H100.sramTbs))] as Vec
})

const RIDGE_X = mapAI(H100_RIDGE_AI)
const PEAK_Y = mapTF(H100.peakTflops)

// Standard attention operating point (~12 FLOP/B -> ~40 TFLOP/s) vs FlashAttention (~240 FLOP/B -> ~804 TFLOP/s)
const STD_AI = 12
const FLASH_AI = 240

// Precompute iso-utilization contour curves inside the attainable HBM roofline region!
// Field = log10(tf / roofline(ai)) -> iso-contours at 12%, 30%, 60% of attainable ceiling
const ISO_CONTOURS = contourPaths(
    (logAi, logTf) => {
        const ai = Math.pow(10, logAi)
        const tf = Math.pow(10, logTf)
        const ceil = rooflineTflops(ai, H100.hbmTbs)
        return tf / ceil
    },
    {
        x: [LOG_AI_MIN, LOG_AI_MAX],
        y: [LOG_TF_MIN, LOG_TF_MAX],
        levels: [0.12, 0.3, 0.6],
        resolution: [72, 48],
    },
)

// Helper: build a luminous 3D silicon slab (top surface + glowing wireframe bezel)
function siliconSlab(
    halfX: number,
    halfY: number,
    zTop: number,
    thickness: number,
    color: string,
    edgeColor: string,
    meshColor: string,
    opacity = 0.62,
) {
    const zBot = zTop - thickness
    const topFace = parametricSurface(
        (u, v) => [(u * 2 - 1) * halfX, (v * 2 - 1) * halfY, zTop] as Vec3,
        [0, 1],
        [0, 1],
        {
            resolution: [10, 8],
            color,
            mesh: meshColor,
            meshOpacity: 0.32,
            meshWidth: 0.7,
            opacity,
            shaded: true,
        },
    )
    const frontFace = parametricSurface(
        (u, v) => [(u * 2 - 1) * halfX, -halfY, zBot + v * thickness] as Vec3,
        [0, 1],
        [0, 1],
        { resolution: [8, 2], color, mesh: false, opacity: opacity * 0.75, shaded: true },
    )
    const rightFace = parametricSurface(
        (u, v) => [halfX, (u * 2 - 1) * halfY, zBot + v * thickness] as Vec3,
        [0, 1],
        [0, 1],
        { resolution: [8, 2], color, mesh: false, opacity: opacity * 0.62, shaded: true },
    )
    const corners: [number, number][] = [
        [-halfX, -halfY],
        [halfX, -halfY],
        [halfX, halfY],
        [-halfX, halfY],
    ]
    const edges = []
    for (let i = 0; i < 4; i++) {
        const a = corners[i]!
        const b = corners[(i + 1) % 4]!
        edges.push(
            line3d([a[0], a[1], zTop], [b[0], b[1], zTop], { color: edgeColor, width: 3.0, glow: 8, blend: 'screen', onTop: true }),
            line3d([a[0], a[1], zBot], [b[0], b[1], zBot], { color: edgeColor, width: 1.5, opacity: 0.55 }),
            line3d([a[0], a[1], zBot], [a[0], a[1], zTop], { color: edgeColor, width: 1.6, opacity: 0.65 }),
        )
    }
    return [topFace, frontFace, rightFace, ...edges]
}

// 3D conduit lane definitions: 24 wide blazing SRAM lanes vs 4 narrow congested HBM3 lanes
const SRAM_LANES: readonly [number, number][] = Array.from({ length: 24 }, (_, i) => {
    const col = i % 6
    const row = Math.floor(i / 6)
    return [-1.55 + col * 0.62, -0.9 + row * 0.6] as const
})
const HBM_LANES: readonly [number, number][] = [
    [-0.24, -0.22],
    [0.24, -0.22],
    [-0.24, 0.22],
    [0.24, 0.22],
]

export const memorywall: SceneFunction = (s, c) => {
    const flowPhase = s.value(0)
    const showHier = s.value(1)
    const showRoof = s.value(0)
    const roofProg = s.value(0)
    const climbProg = s.value(0)

    const hierTitle = group(
        txt('NVIDIA H100 Memory Hierarchy', -845, -420, 56, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.blue),
        txt('Physical silicon bandwidth gap: 19 TB/s SRAM vs 3.35 TB/s HBM3', -845, -356, 28, COSMOS.muted, 'sans', 'left'),
    )

    // Shot 1: 3D Stacked Silicon Hierarchy (scene3d) with true physical pipe cross-sections & particle flux!
    const stack3d = scene3d({
        theta: -0.72,
        phi: 1.12,
        distance: 16.0,
        unit: 98,
        perspective: true,
        ambient: 0.4,
        shine: 0.36,
        brightness: 1.12,
        fog: 0.08,
        focus: [0, 0, 0.45],
    }).at(285, -38)

    // Tier 1 (Top): Tensor Cores (989 TFLOP/s · 132 SMs)
    const tensorSlab = siliconSlab(2.3, 1.7, 2.55, 0.34, '#c48f26', COSMOS.gold, '#fff4c8', 0.66)
    // Tier 2 (Middle): On-Chip SRAM (19 TB/s · 50 MB) right underneath the cores
    const sramSlab = siliconSlab(2.1, 1.5, 0.62, 0.30, '#166f94', COSMOS.cyan, '#9ef5ff', 0.60)
    // Tier 3 (Bottom): Off-Chip HBM3 (3.35 TB/s · 80 GB — massive footprint, narrow vertical pipe!)
    const hbmSlab = siliconSlab(2.85, 2.05, -1.65, 0.42, '#6e1d3b', COSMOS.rose, '#ff9ab2', 0.56)

    // Wide luminous 19 TB/s SRAM-to-Tensor Core data highway (24 wide conduits!)
    const sramPipes = SRAM_LANES.map(([lx, ly], idx) =>
        line3d([lx, ly, 0.64], [lx, ly, 2.18], {
            color: idx % 3 === 0 ? COSMOS.gold : COSMOS.cyan,
            width: 3.0,
            glow: 9,
            blend: 'screen',
            opacity: 0.85,
            onTop: true,
        }),
    )

    // Narrow congested 3.35 TB/s HBM3-to-SRAM choke pipe (tiny cross-section collar + 4 slow lanes!)
    const hbmCollarRing = (z: number) => [
        line3d([-0.42, -0.38, z], [0.42, -0.38, z], { color: COSMOS.rose, width: 3.2, glow: 8, blend: 'screen', onTop: true }),
        line3d([0.42, -0.38, z], [0.42, 0.38, z], { color: COSMOS.rose, width: 3.2, glow: 8, blend: 'screen', onTop: true }),
        line3d([0.42, 0.38, z], [-0.42, 0.38, z], { color: COSMOS.rose, width: 3.2, glow: 8, blend: 'screen', onTop: true }),
        line3d([-0.42, 0.38, z], [-0.42, -0.38, z], { color: COSMOS.rose, width: 3.2, glow: 8, blend: 'screen', onTop: true }),
    ]
    const hbmPipes = [
        ...hbmCollarRing(-1.60),
        ...hbmCollarRing(-0.62),
        ...hbmCollarRing(0.30),
        ...HBM_LANES.map(([lx, ly]) =>
            line3d([lx, ly, -1.62], [lx, ly, 0.30], {
                color: COSMOS.rose,
                width: 2.6,
                glow: 8,
                blend: 'screen',
                opacity: 0.82,
                onTop: true,
            }),
        ),
    ]

    // Dense high-speed SRAM particle flux (72 blazing photons rushing upward at 6x speed!)
    const sramFlux = points3d(
        () => {
            const ph = flowPhase.value
            const pts: Vec3[] = []
            for (let i = 0; i < SRAM_LANES.length; i++) {
                const [lx, ly] = SRAM_LANES[i]!
                for (let k = 0; k < 3; k++) {
                    const u = (ph * 0.95 + i * 0.09 + k / 3) % 1
                    pts.push([lx, ly, 0.66 + u * 1.52])
                }
            }
            return pts
        },
        {
            colorAt: (idx) => (idx % 3 === 0 ? '#fff7d6' : idx % 2 === 0 ? COSMOS.gold : COSMOS.cyan),
            radius: 4.8,
            glow: 11,
            blend: 'screen',
            onTop: true,
        },
    )

    // Slow sparse HBM3 particle flux (8 slow photons squeezing through the narrow choke!)
    const hbmFlux = points3d(
        () => {
            const ph = flowPhase.value
            const pts: Vec3[] = []
            for (let i = 0; i < HBM_LANES.length; i++) {
                const [lx, ly] = HBM_LANES[i]!
                for (let k = 0; k < 2; k++) {
                    const u = (ph * 0.22 + i * 0.21 + k * 0.5) % 1
                    pts.push([lx, ly, -1.60 + u * 1.88])
                }
            }
            return pts
        },
        {
            color: COSMOS.amber,
            radius: 5.2,
            glow: 10,
            blend: 'screen',
            onTop: true,
        },
    )

    stack3d.add(...hbmSlab, ...hbmPipes, hbmFlux, ...sramSlab, ...sramPipes, sramFlux, ...tensorSlab)

    const liveHierarchy = dynamic(() => {
        if (showHier.value < 0.02) return []
        const a = showHier.value
        return group(
            // Atmospheric 3D silicon halo
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#5ce1e624'],
                    [0.45, '#ffd16614'],
                    [0.8, '#ff6b8b10'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(285, 20).opacity(a).set('blend', 'screen'),
            stack3d.opacity(a),
            // Left-aligned clean tier spec callouts aligned to the 3 physical 3D silicon levels
            txt('Tensor Cores', -845, -238, 38, COSMOS.gold, 'serif', 'left').glow(6, COSMOS.gold).opacity(a),
            txt('989 TFLOP/s  ·  132 SMs', -845, -194, 26, COSMOS.ink, 'mono', 'left').opacity(a),
            txt('FP16 dense matrix compute', -845, -156, 26, COSMOS.muted, 'sans', 'left').opacity(0.9 * a),
            line([-375, -210], [-75, -210], { stroke: COSMOS.gold, width: 2, dash: [8, 8] }).opacity(0.65 * a),
            dot(5, COSMOS.gold).at(-75, -210).glow(8, COSMOS.gold).opacity(a),

            txt('On-Chip SRAM', -845, -36, 38, COSMOS.cyan, 'serif', 'left').glow(6, COSMOS.cyan).opacity(a),
            txt('19 TB/s  ·  50 MB', -845, 8, 26, COSMOS.ink, 'mono', 'left').opacity(a),
            txt('6× wider pipe right beside cores', -845, 46, 26, COSMOS.muted, 'sans', 'left').opacity(0.9 * a),
            line([-375, -8], [-70, -8], { stroke: COSMOS.cyan, width: 2, dash: [8, 8] }).opacity(0.65 * a),
            dot(5, COSMOS.cyan).at(-70, -8).glow(8, COSMOS.cyan).opacity(a),

            txt('Off-Chip HBM3', -845, 178, 38, COSMOS.rose, 'serif', 'left').glow(6, COSMOS.rose).opacity(a),
            txt('3.35 TB/s  ·  80 GB', -845, 222, 26, COSMOS.ink, 'mono', 'left').opacity(a),
            txt('Huge capacity, narrow choke pipe', -845, 260, 26, COSMOS.muted, 'sans', 'left').opacity(0.9 * a),
            line([-375, 206], [-115, 206], { stroke: COSMOS.rose, width: 2, dash: [8, 8] }).opacity(0.65 * a),
            dot(5, COSMOS.rose).at(-115, 206).glow(8, COSMOS.rose).opacity(a),

            // Right-side pipe bandwidth annotations clearly separated from the 3D slabs
            txt('19 TB/s', 655, -110, 32, COSMOS.cyan, 'mono', 'left').glow(8, COSMOS.cyan).opacity(a),
            txt('6× flux', 655, -72, 26, COSMOS.gold, 'sans', 'left').opacity(0.92 * a),
            txt('3.35 TB/s', 655, 84, 32, COSMOS.rose, 'mono', 'left').glow(8, COSMOS.rose).opacity(a),
            txt('bottleneck', 655, 122, 26, COSMOS.amber, 'sans', 'left').opacity(0.92 * a),

            txt('Every byte fetched from HBM must feed ~295 math ops to keep the H100 busy', 0, 434, 30, COSMOS.gold, 'serif').opacity(a),
        )
    })

    // Shot 2: Real H100 Log-Log Roofline Plot with scalarField zone shading + contourPaths iso-utilization + comet trail!
    const roofGrad = linearGradient([RX0, RY0], [RX1, RY1], [COSMOS.rose, COSMOS.amber, COSMOS.cyan, COSMOS.gold])

    // Translucent scalarField shading the memory-bound valley (rose/amber) vs compute-bound zone (cyan/gold)!
    const roofZoneField = scalarField(
        (logAi, logTf) => {
            const ai = Math.pow(10, logAi)
            const tf = Math.pow(10, logTf)
            const ceil = rooflineTflops(ai, H100.hbmTbs)
            if (tf > ceil * 1.04) return NaN
            const util = Math.min(1, tf / ceil)
            const ridgeBlend = Math.max(0, Math.min(1, (logAi - Math.log10(H100_RIDGE_AI) + 0.35) / 0.7))
            // Encode negative for memory-bound valley [-1..0], positive for compute-bound zone [0..1]
            const intensity = 0.22 + 0.78 * Math.pow(util, 0.7)
            return ridgeBlend < 0.5 ? -intensity * (1 - ridgeBlend * 1.4) : intensity * (ridgeBlend * 1.4 - 0.4)
        },
        {
            x: [LOG_AI_MIN, LOG_AI_MAX],
            y: [LOG_TF_MIN, LOG_TF_MAX],
            domain: [-1, 1],
            colors: ['#ff4d7d40', '#fb923c26', '#11162608', '#5ce1e626', '#ffd16642'],
            width: RX1 - RX0,
            height: RY0 - RY1,
            resolution: [96, 64],
        },
    ).at((RX0 + RX1) / 2, (RY0 + RY1) / 2).set('blend', 'screen')

    // Render contourPaths iso-utilization lines inside the attainable roofline envelope
    const isoContourNodes: Node[] = ISO_CONTOURS.flatMap((lvl, idx) =>
        lvl.paths.map((pts) =>
            new Node(polyPath(pts.map(([lx, ly]) => mapLogPt(lx, ly))))
                .stroke(idx === 2 ? COSMOS.cyan : COSMOS.amber, 1.3, idx === 2 ? 0.36 : 0.24)
                .dash([6, 8]),
        ),
    )

    const roofStatic = group(
        txt('H100 Roofline Model', -840, -415, 58, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.cyan),
        txt('Peak 989 TFLOP/s  ·  HBM3 3.35 TB/s  ·  Ridge 295 FLOP/B', 840, -412, 26, COSMOS.gold, 'mono', 'right'),
        // Translucent zone gradient + iso-utilization contours
        roofZoneField,
        ...isoContourNodes,
        // Axes
        line([RX0, RY0], [RX1, RY0], { stroke: '#465885', width: 2.5 }),
        line([RX0, RY0], [RX0, RY1], { stroke: '#465885', width: 2.5 }),
        // X-axis ticks (log scale)
        ...[1, 10, 100, 1000].flatMap((v) => {
            const x = mapAI(v)
            return [
                line([x, RY0], [x, RY1], { stroke: '#222d4a', width: 1.2 }),
                txt(String(v), x, RY0 + 38, 26, COSMOS.muted, 'mono'),
            ]
        }),
        // Y-axis ticks (log scale)
        ...[10, 100, 989].flatMap((v) => {
            const y = mapTF(v)
            return [
                line([RX0, y], [RX1, y], { stroke: '#222d4a', width: 1.2 }),
                txt(String(v), RX0 - 24, y, 26, v === 989 ? COSMOS.gold : COSMOS.muted, 'mono', 'right'),
            ]
        }),
        txt('Arithmetic Intensity  (FLOP / byte)', (RX0 + RX1) / 2, RY0 + 96, 28, COSMOS.muted, 'sans'),
        txt('TFLOP/s', RX0 - 115, RY1 - 36, 28, COSMOS.muted, 'mono', 'left'),
        // Brightened SRAM dashed reference ceiling (19 TB/s)!
        new Node(polyPath(SRAM_ROOF_PTS)).stroke(COSMOS.cyan, 3.2, 0.86).dash([12, 9]).glow(8, COSMOS.cyan).set('blend', 'screen'),
        txt('SRAM ceiling (19 TB/s)', RX0 + 22, mapTF(540), 26, COSMOS.cyan, 'mono', 'left').glow(6, COSMOS.cyan),
        // Vertical ridge line at 295 FLOP/B
        line([RIDGE_X, RY0], [RIDGE_X, PEAK_Y], { stroke: COSMOS.gold, width: 2.2, dash: [8, 8] }).opacity(0.75),
        txt('Ridge: 295', RIDGE_X, RY0 + 38, 26, COSMOS.gold, 'mono'),
        txt('MEMORY-BOUND VALLEY', mapAI(14), mapTF(3.6), 26, COSMOS.rose, 'mono', 'left').opacity(0.92),
        txt('COMPUTE ROOF (989 TFLOP/s)', mapAI(450), PEAK_Y - 34, 26, COSMOS.gold, 'mono', 'left').glow(5, COSMOS.gold),
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
                    [0, '#5ce1e61a'],
                    [0.5, '#ff6b8b12'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(RIDGE_X, PEAK_Y + 80).opacity(a).set('blend', 'screen'),
            new Node(polyPath(roofPts)).stroke(roofGrad, 5.5, 0.96 * a).glow(10, COSMOS.cyan),
            new Node(polyPath(roofPts)).stroke('#ffffff', 1.5, 0.48 * a).set('blend', 'screen'),
        ]

        if (roofProg.value > 0.35) {
            const pOp = Math.min(1, (roofProg.value - 0.35) * 3) * a
            const pulseR = 16 + ((flowPhase.value * 1.4) % 1) * 38
            nodes.push(
                circle(pulseR, { fill: null, stroke: COSMOS.rose, width: 2.4 })
                    .at(stdX, stdY)
                    .opacity((1 - ((flowPhase.value * 1.4) % 1)) * 0.85 * pOp)
                    .set('blend', 'screen'),
                dot(10, COSMOS.rose).at(stdX, stdY).glow(14, COSMOS.rose).opacity(pOp),
                dot(4.5, '#ffffff').at(stdX, stdY).opacity(pOp),
                txt('Standard Attention', stdX + 26, stdY + 52, 30, COSMOS.rose, 'serif', 'left').glow(6, COSMOS.rose).opacity(pOp),
                txt('~12 FLOP/B  →  40 TFLOP/s', stdX + 26, stdY + 90, 26, COSMOS.amber, 'mono', 'left').opacity(pOp),
            )
        }

        // Animated glowing comet trail climbing from Standard Attention to Tiled FlashAttention!
        if (climbProg.value > 0.02) {
            const cp = climbProg.value
            const curAI = Math.pow(10, Math.log10(STD_AI) + (Math.log10(FLASH_AI) - Math.log10(STD_AI)) * cp)
            const curTF = rooflineTflops(curAI, H100.hbmTbs)
            const cx = mapAI(curAI)
            const cy = mapTF(curTF)
            const trailPts: Vec[] = Array.from({ length: 48 }, (_, i) => {
                const u = (i / 47) * cp
                const ai = Math.pow(10, Math.log10(STD_AI) + (Math.log10(FLASH_AI) - Math.log10(STD_AI)) * u)
                return [mapAI(ai), mapTF(rooflineTflops(ai, H100.hbmTbs))] as Vec
            })
            const cometGrad = linearGradient([stdX, stdY], [cx, cy], ['#ff6b8b00', COSMOS.amber, COSMOS.gold, '#ffffff'])
            const cometLayer: Node[] = [
                // Wide additive outer comet tail
                new Node(polyPath(trailPts)).stroke(cometGrad, 14, 0.42 * a).glow(16, COSMOS.gold),
                // Crisp luminous inner comet ribbon
                new Node(polyPath(trailPts)).stroke(cometGrad, 5.2, 0.96 * a).glow(10, COSMOS.gold),
                // Glowing stardust sparks trailing behind the comet head
                ...Array.from({ length: 9 }, (_, k) => {
                    const u = Math.max(0, cp - (k + 1) * 0.055)
                    const ai = Math.pow(10, Math.log10(STD_AI) + (Math.log10(FLASH_AI) - Math.log10(STD_AI)) * u)
                    const sx = mapAI(ai) + Math.sin(k * 2.7 + flowPhase.value * 4) * (4 + k * 1.3)
                    const sy = mapTF(rooflineTflops(ai, H100.hbmTbs)) + Math.cos(k * 3.1 + flowPhase.value * 4) * (4 + k * 1.1)
                    return dot(Math.max(1.8, 4.4 - k * 0.3), k % 2 === 0 ? '#fff7d6' : COSMOS.cyan)
                        .at(sx, sy)
                        .glow(8, COSMOS.gold)
                        .opacity(Math.max(0.15, (1 - k / 10) * 0.85) * a)
                }),
                // Blazing comet head
                circle(26, {
                    fill: radialGradient([0, 0], 26, [
                        [0, '#ffffffcc'],
                        [0.45, '#ffd16688'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                }).at(cx, cy).opacity(a),
                dot(11, COSMOS.gold).at(cx, cy).glow(18, COSMOS.gold).opacity(a),
                dot(5.5, '#ffffff').at(cx, cy).opacity(a),
            ]
            nodes.push(group(...cometLayer).set('blend', 'screen'))

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
    c.at(0.1, () => s.play(stack3d.orbit({ theta: -0.46, phi: 1.06 }), { duration: 22.0 }))

    c.on('Plot that gap', () => {
        s.play(showHier.to(0, { duration: 0.3 }))
        s.play(showRoof.to(1, { duration: 0.35 }))
        s.play(roofProg.to(1, { duration: 2.2 }))
    })
    c.swap('Plot that gap', hierTitle, roofStatic)
    c.on('Standard attention writes', () => {
        s.play(climbProg.to(1, { duration: 4.2 }))
    })
}

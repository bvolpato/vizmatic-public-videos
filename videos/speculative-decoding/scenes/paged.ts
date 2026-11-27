import {
    circle, curve3d, gridPlane3d, group, line3d, linear, par, parametricSurface, point3d, radialGradient, rect, scene3d,
    type Scene3D, type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

/** Add a glowing, depth-sorted 3D rectangular prism (6 shaded faces + 12 wireframe edges) to a Scene3D. */
function addBox3D(
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
    edgeWidth = 2.0,
    edgeGlow = 5,
) {
    const x1 = x0 + dx
    const y1 = y0 + dy
    const z1 = z0 + dz
    const opts = { resolution: [1, 1] as const, color: fillColor, opacity: faceOpacity, mesh: false as const, shaded: true }
    view.add(
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y0 + v * dy, z1], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y0 + v * dy, z0], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y1, z0 + v * dz], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x1, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    )
    const es = { color: edgeColor, width: edgeWidth, opacity: 0.92, glow: edgeGlow }
    view.add(
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
    )
}

function evalQuadBezier(a: Vec3, mid: Vec3, b: Vec3, t: number): Vec3 {
    const u = 1 - t
    return [
        u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
        u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
        u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
    ]
}

/** Add a glowing 3D Bezier pointer arc linking a logical sequence block down to a physical KV cube. */
function addPointerArc(
    view: Scene3D,
    a: Vec3,
    b: Vec3,
    color: string,
    lift = 1.1,
    pulseVal?: { readonly value: number },
    phaseOffset = 0,
) {
    const mid: Vec3 = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, Math.max(a[2], b[2]) + lift]
    view.add(
        curve3d(
            (t): Vec3 => evalQuadBezier(a, mid, b, t),
            0,
            1,
            { color, width: 3.0, glow: 8, blend: 'screen', samples: 40, opacity: 0.92 },
        ),
        point3d(a, { color: '#ffffff', radius: 5.2, glow: 8, blend: 'screen' }),
        point3d(b, { color, radius: 5.5, glow: 8, blend: 'screen' }),
    )
    if (pulseVal) {
        view.add(
            point3d(
                (): Vec3 => evalQuadBezier(a, mid, b, (pulseVal.value + phaseOffset) % 1),
                { color: '#ffffff', radius: 7.2, glow: 12, blend: 'screen' },
            ),
            point3d(
                (): Vec3 => evalQuadBezier(a, mid, b, (pulseVal.value + phaseOffset + 0.5) % 1),
                { color, radius: 5.8, glow: 12, blend: 'screen' },
            ),
        )
    }
}

export const paged: SceneFunction = (s, c) => {
    const pulseT = s.value(0.25)

    // ── Shot 1: Orbiting 3D Fragmented Contiguous Slabs (62% dark wasted VRAM) ──
    const fragView = scene3d({
        theta: -0.92,
        phi: 1.06,
        distance: 15.0,
        unit: 126,
        perspective: true,
        ambient: 0.42,
        shine: 0.25,
        brightness: 1.06,
        fog: 0.14,
        focus: [0, 0, 0.3],
    }).at(210, 30)

    fragView.add(
        gridPlane3d({ x: [-4.4, 4.4], y: [-3.2, 3.2], z: 0, step: 1.1, color: '#263455', width: 1.2, opacity: 0.5 }),
    )

    const slabs = [
        { y: -2.55, used: 2.3, col: COSMOS.cyan },
        { y: -1.05, used: 4.1, col: COSMOS.violet },
        { y: 0.45, used: 1.6, col: COSMOS.emerald },
        { y: 1.95, used: 2.9, col: COSMOS.blue },
    ] as const
    const totalLen = 7.4
    for (const slab of slabs) {
        addBox3D(fragView, -3.7, slab.y, 0.04, slab.used, 0.92, 0.72, slab.col, slab.col, 0.82, 2.2, 6)
        addBox3D(
            fragView,
            -3.7 + slab.used + 0.06,
            slab.y,
            0.04,
            totalLen - slab.used - 0.06,
            0.92,
            0.72,
            '#180b16',
            COSMOS.rose,
            0.34,
            1.7,
            4,
        )
    }

    const fragAura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#ff6b8b26'],
            [0.5, '#1d4ed814'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(210, 30).set('blend', 'screen')

    const fragCopy = group(
        txt('CONTIGUOUS KV RESERVATION', -855, -395, 26, COSMOS.rose, 'mono', 'left'),
        txt('Fragmented', -860, -310, 62, COSMOS.ink, 'serif', 'left'),
        txt('Memory Slabs', -860, -238, 62, COSMOS.rose, 'serif', 'left').glow(7, COSMOS.rose),
        txt('62% VRAM WASTED', -855, -118, 42, COSMOS.amber, 'mono', 'left').glow(6, COSMOS.amber),
        // Compact contiguous waste visual bar filling middle-left gap
        txt('CONTIGUOUS VRAM ALLOCATION', -855, -18, 26, COSMOS.muted, 'mono', 'left'),
        rect(520, 38, { fill: '#1a0e1b', stroke: COSMOS.rose, width: 2.0, radius: 8 }).at(-595, 32),
        rect(198, 30, { fill: COSMOS.cyan, stroke: null, radius: 6 }).at(-752, 32).opacity(0.85),
        txt('38% used', -752, 78, 26, COSMOS.cyan, 'mono'),
        txt('62% dark waste', -470, 78, 26, COSMOS.rose, 'mono'),
        txt('Every request reserves max_seq_len', -855, 275, 28, COSMOS.muted, 'sans', 'left'),
        txt('Dark empty slots block bigger batches', -855, 330, 28, COSMOS.rose, 'sans', 'left'),
    )

    // ── Shot 2: Orbiting 3D PagedAttention Physical Cubes + Virtual Page-Table Arcs ──
    const pagedView = scene3d({
        theta: -0.84,
        phi: 1.02,
        distance: 15.8,
        unit: 122,
        perspective: true,
        ambient: 0.44,
        shine: 0.34,
        brightness: 1.12,
        fog: 0.12,
        focus: [0, 0, 0.95],
    }).at(225, 42)

    pagedView.add(
        gridPlane3d({ x: [-3.5, 3.5], y: [-2.6, 2.6], z: 0, step: 1.2, color: '#27385c', width: 1.2, opacity: 0.48 }),
    )

    // Tightly packed 4 x 3 physical VRAM pool of glowing 3D memory cubes (zero empty gaps!)
    const poolColors: readonly (readonly string[])[] = [
        [COSMOS.gold, COSMOS.gold, COSMOS.cyan, COSMOS.violet],
        [COSMOS.cyan, COSMOS.emerald, COSMOS.violet, COSMOS.cyan],
        [COSMOS.emerald, COSMOS.violet, COSMOS.emerald, COSMOS.blue],
    ]
    const cubeCenters: Vec3[][] = []
    for (let r = 0; r < 3; r++) {
        const rowCenters: Vec3[] = []
        for (let col = 0; col < 4; col++) {
            const x = -2.9 + col * 1.48
            const y = -2.0 + r * 1.48
            const cHex = poolColors[r]![col]!
            const isShared = cHex === COSMOS.gold
            addBox3D(
                pagedView,
                x,
                y,
                0.04,
                1.18,
                1.18,
                isShared ? 1.02 : 0.84,
                cHex,
                cHex,
                isShared ? 0.88 : 0.78,
                isShared ? 2.8 : 2.1,
                isShared ? 10 : 6,
            )
            rowCenters.push([x + 0.59, y + 0.59, isShared ? 1.08 : 0.9])
        }
        cubeCenters.push(rowCenters)
    }

    // Upper floating logical sequence rows (z = 2.55) streaming glowing data pulses down to physical cubes!
    const vSeqs = [
        { y: -1.35, col: COSMOS.cyan, targets: [[0, 0], [0, 2], [1, 0], [1, 3]] as const },
        { y: 0.15, col: COSMOS.violet, targets: [[0, 0], [0, 1], [0, 3], [1, 2]] as const },
        { y: 1.65, col: COSMOS.emerald, targets: [[0, 1], [1, 1], [2, 0], [2, 2]] as const },
    ] as const
    let arcIdx = 0
    for (const seq of vSeqs) {
        for (let i = 0; i < seq.targets.length; i++) {
            const vx = -2.5 + i * 1.42
            const [tr, tc] = seq.targets[i]!
            const isPrefix = poolColors[tr]![tc] === COSMOS.gold
            const boxCol = isPrefix ? COSMOS.gold : seq.col
            addBox3D(pagedView, vx, seq.y, 2.55, 0.88, 0.62, 0.34, boxCol, boxCol, 0.84, 2.0, 6)
            const dst = cubeCenters[tr]![tc]!
            // Stream glowing screen-blended data pulses along every shared-prefix arc + key sequence arcs!
            const animatePulse = isPrefix || i === 1
            addPointerArc(
                pagedView,
                [vx + 0.44, seq.y + 0.31, 2.54],
                dst,
                boxCol,
                0.45,
                animatePulse ? pulseT : undefined,
                arcIdx * 0.19,
            )
            arcIdx++
        }
    }

    const pagedAura = circle(620, {
        fill: radialGradient([0, 0], 620, [
            [0, '#ffd1662a'],
            [0.45, '#5ce1e61a'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(225, 42).set('blend', 'screen')

    // Compact Contiguous (60-80% waste) vs Paged (< 4%) visual bar filling the middle-left gap cleanly!
    const barLeft = -855
    const barW = 510
    const barCenter = barLeft + barW * 0.5
    const pagedCopy = group(
        txt('PAGEDATTENTION VIRTUAL MEMORY', -855, -400, 26, COSMOS.emerald, 'mono', 'left'),
        txt('Packed 3D', -860, -318, 62, COSMOS.ink, 'serif', 'left'),
        txt('KV Blocks', -860, -246, 62, COSMOS.emerald, 'serif', 'left').glow(7, COSMOS.emerald),
        txt('< 4% VRAM WASTE', -855, -138, 40, COSMOS.gold, 'mono', 'left').glow(6, COSMOS.gold),

        // Comparison bars in the middle-left zone (y = -58 .. +165)
        txt('Contiguous  (60–80% waste)', barLeft, -42, 26, COSMOS.rose, 'mono', 'left'),
        rect(barW, 34, { fill: '#1b0f1d', stroke: COSMOS.rose, width: 2.0, radius: 8 }).at(barCenter, 2),
        rect(barW * 0.34, 26, { fill: COSMOS.blue, stroke: null, radius: 6 }).at(barLeft + barW * 0.17 + 4, 2).opacity(0.85),
        txt('WASTE', barLeft + barW * 0.68, 2, 26, COSMOS.rose, 'mono'),

        txt('Paged  (< 4% waste)', barLeft, 76, 26, COSMOS.emerald, 'mono', 'left'),
        rect(barW, 34, { fill: '#0e1d26', stroke: COSMOS.emerald, width: 2.2, radius: 8 }).at(barCenter, 120),
        rect(barW * 0.95, 26, { fill: COSMOS.emerald, stroke: null, radius: 6 }).at(barLeft + barW * 0.475 + 4, 120)
            .opacity(0.82).glow(8, COSMOS.emerald),
        txt('96%+ ACTIVE VRAM', barCenter - 12, 120, 26, '#071217', 'mono'),

        txt('Logical blocks → physical cubes', -855, 255, 28, COSMOS.cyan, 'sans', 'left'),
        txt('Gold prefix blocks shared across users', -855, 310, 28, COSMOS.gold, 'sans', 'left'),
        txt('Zero contiguous slabs required', -855, 365, 28, COSMOS.emerald, 'sans', 'left'),
        // Clean 2D tier captions framing the orbiting 3D scene without ever being crossed by cubes or arcs
        txt('↑  LOGICAL SEQUENCE BLOCKS', 225, -400, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
        txt('↓  PHYSICAL VRAM POOL (PACKED CUBES)', 225, 452, 26, COSMOS.gold, 'mono').glow(5, COSMOS.gold),
    )

    s.add(fragAura, fragView, fragCopy)
    const fragDur = Math.max(3.5, c.cue('virtual memory').start - c.start - 0.35)
    c.at(0.1, () => {
        s.play(fragView.orbit({ theta: -0.24, phi: 0.92 }), { duration: fragDur })
    })

    const pagedDur = Math.max(4.0, c.end - c.cue('virtual memory').start - 0.55)
    c.swap('virtual memory', [fragAura, fragView, fragCopy], [pagedAura, pagedView, pagedCopy])
    c.on('virtual memory', () => {
        s.play(par(
            pagedView.orbit({ theta: -0.14, phi: 0.86 }, { duration: pagedDur }),
            pulseT.to(3.8, { duration: pagedDur, ease: linear }),
        ))
    })
}

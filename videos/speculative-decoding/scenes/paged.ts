import {
    circle, curve3d, gridPlane3d, group, line3d, parametricSurface, point3d, radialGradient, scene3d,
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
    // Top, bottom, front, back, left, right faces
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
        // Bottom ring
        line3d([x0, y0, z0], [x1, y0, z0], es),
        line3d([x1, y0, z0], [x1, y1, z0], es),
        line3d([x1, y1, z0], [x0, y1, z0], es),
        line3d([x0, y1, z0], [x0, y0, z0], es),
        // Top ring
        line3d([x0, y0, z1], [x1, y0, z1], es),
        line3d([x1, y0, z1], [x1, y1, z1], es),
        line3d([x1, y1, z1], [x0, y1, z1], es),
        line3d([x0, y1, z1], [x0, y0, z1], es),
        // Vertical pillars
        line3d([x0, y0, z0], [x0, y0, z1], es),
        line3d([x1, y0, z0], [x1, y0, z1], es),
        line3d([x1, y1, z0], [x1, y1, z1], es),
        line3d([x0, y1, z0], [x0, y1, z1], es),
    )
}

/** Add a glowing 3D Bezier pointer arc linking a virtual slot down to a physical KV block cube. */
function addPointerArc(view: Scene3D, a: Vec3, b: Vec3, color: string, lift = 1.1) {
    const mid: Vec3 = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, Math.max(a[2], b[2]) + lift]
    view.add(
        curve3d(
            (t): Vec3 => {
                const u = 1 - t
                return [
                    u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
                    u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
                    u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
                ]
            },
            0,
            1,
            { color, width: 3.0, glow: 7, samples: 40, opacity: 0.92 },
        ),
        point3d(a, { color: '#ffffff', radius: 5.2, halo: 0 }),
        point3d(b, { color, radius: 5.5, halo: 0 }),
    )
}

export const paged: SceneFunction = (s, c) => {
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
    }).at(200, 30)

    fragView.add(
        gridPlane3d({ x: [-4.4, 4.4], y: [-3.2, 3.2], z: 0, step: 1.1, color: '#263455', width: 1.2, opacity: 0.5 }),
    )

    // 4 contiguous request slabs: short glowing used prefix + huge dark rose-outlined empty waste!
    const slabs = [
        { y: -2.55, used: 2.3, col: COSMOS.cyan },
        { y: -1.05, used: 4.1, col: COSMOS.violet },
        { y: 0.45, used: 1.6, col: COSMOS.emerald },
        { y: 1.95, used: 2.9, col: COSMOS.blue },
    ] as const
    const totalLen = 7.4
    for (const slab of slabs) {
        addBox3D(fragView, -3.7, slab.y, 0.04, slab.used, 0.92, 0.72, slab.col, slab.col, 0.82, 2.2, 6)
        // Huge dark wasted reservation slab
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
            [0, '#ff6b8b22'],
            [0.5, '#1d4ed812'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(200, 30)

    const fragCopy = group(
        txt('CONTIGUOUS KV RESERVATION', -850, -395, 26, COSMOS.rose, 'mono', 'left'),
        txt('Fragmented', -854, -310, 62, COSMOS.ink, 'serif', 'left'),
        txt('Memory Slabs', -854, -238, 62, COSMOS.rose, 'serif', 'left').glow(7, COSMOS.rose),
        txt('62% VRAM WASTED', -850, -108, 42, COSMOS.amber, 'mono', 'left').glow(6, COSMOS.amber),
        txt('Every request reserves max_seq_len', -850, 275, 28, COSMOS.muted, 'sans', 'left'),
        txt('Dark empty slots block bigger batches', -850, 330, 28, COSMOS.rose, 'sans', 'left'),
    )

    // ── Shot 2: Orbiting 3D PagedAttention Physical Cubes + Virtual Page-Table Arcs ──
    const pagedView = scene3d({
        theta: -0.84,
        phi: 1.02,
        distance: 15.4,
        unit: 124,
        perspective: true,
        ambient: 0.44,
        shine: 0.34,
        brightness: 1.1,
        fog: 0.12,
        focus: [0, 0, 0.95],
    }).at(195, 45)

    pagedView.add(
        gridPlane3d({ x: [-4.2, 4.2], y: [-3.2, 3.2], z: 0, step: 1.2, color: '#27385c', width: 1.2, opacity: 0.48 }),
    )

    // Tightly packed 4 x 3 physical VRAM pool of glowing 3D memory cubes (zero empty gaps!)
    // Row 0..2, Col 0..3: gold = shared system prompt prefix; cyan/violet/emerald = packed sequence blocks
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
            addBox3D(pagedView, x, y, 0.04, 1.18, 1.18, isShared ? 1.02 : 0.84, cHex, cHex, isShared ? 0.88 : 0.78, isShared ? 2.8 : 2.1, isShared ? 10 : 6)
            rowCenters.push([x + 0.59, y + 0.59, isShared ? 1.08 : 0.9])
        }
        cubeCenters.push(rowCenters)
    }

    // Upper floating virtual sequence rows (z = 2.65) pointing via 3D arcs down to physical cubes!
    const vSeqs = [
        { y: -1.35, col: COSMOS.cyan, targets: [[0, 0], [0, 2], [1, 0], [1, 3]] as const },
        { y: 0.15, col: COSMOS.violet, targets: [[0, 0], [0, 1], [0, 3], [1, 2]] as const },
        { y: 1.65, col: COSMOS.emerald, targets: [[0, 1], [1, 1], [2, 0], [2, 2]] as const },
    ] as const
    for (const seq of vSeqs) {
        for (let i = 0; i < seq.targets.length; i++) {
            const vx = -2.5 + i * 1.42
            const isPrefix = i === 0
            const boxCol = isPrefix ? COSMOS.gold : seq.col
            addBox3D(pagedView, vx, seq.y, 2.55, 0.88, 0.62, 0.34, boxCol, boxCol, 0.84, 2.0, 6)
            const [tr, tc] = seq.targets[i]!
            const dst = cubeCenters[tr]![tc]!
            addPointerArc(pagedView, [vx + 0.44, seq.y + 0.31, 2.54], dst, boxCol, 0.45)
        }
    }

    const pagedAura = circle(620, {
        fill: radialGradient([0, 0], 620, [
            [0, '#ffd16626'],
            [0.45, '#5ce1e616'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(195, 45)

    const pagedCopy = group(
        txt('PAGEDATTENTION VIRTUAL MEMORY', -850, -395, 26, COSMOS.emerald, 'mono', 'left'),
        txt('Packed 3D', -854, -310, 62, COSMOS.ink, 'serif', 'left'),
        txt('KV Blocks', -854, -238, 62, COSMOS.emerald, 'serif', 'left').glow(7, COSMOS.emerald),
        txt('< 4% VRAM WASTE', -850, -108, 40, COSMOS.gold, 'mono', 'left').glow(6, COSMOS.gold),
        txt('Virtual sequences → physical cubes', -850, 265, 28, COSMOS.cyan, 'sans', 'left'),
        txt('Gold prefix blocks shared across users', -850, 320, 28, COSMOS.gold, 'sans', 'left'),
        txt('Zero contiguous slabs required', -850, 375, 28, COSMOS.emerald, 'sans', 'left'),
    )

    s.add(fragAura, fragView, fragCopy)
    const fragDur = Math.max(3.5, c.cue('virtual memory').start - c.start - 0.35)
    c.at(0.1, () => {
        s.play(fragView.orbit({ theta: -0.24, phi: 0.92 }), { duration: fragDur })
    })

    const pagedDur = Math.max(4.0, c.end - c.cue('virtual memory').start - 0.55)
    c.swap('virtual memory', [fragAura, fragView, fragCopy], [pagedAura, pagedView, pagedCopy])
    c.on('virtual memory', () => {
        s.play(pagedView.orbit({ theta: -0.14, phi: 0.86 }), { duration: pagedDur })
    })
}

import {
    circle, dot, dynamic, group, label3d, line, line3d, linear, points3d, radialGradient, rect, scene3d, surface, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { attentionScoreHeight, flashHbmBytes, naiveHbmBytes } from '../math'
import { COSMOS, txt } from '../../../factory/style'

// 3D Q * K^T attention score matrix landscape in [-3.2, 3.2] x [-3.2, 3.2]
const HALF = 3.2
const GRID = 4 // 4x4 = 16 SRAM tiles (Br x Bc)
const TILE_W = (2 * HALF) / GRID

// High-resolution lookup table for smooth 56x56 attention terrain
const RES = 84
const TABLE = new Float32Array(RES * RES)
for (let j = 0; j < RES; j++) {
    const v = j / (RES - 1)
    for (let i = 0; i < RES; i++) {
        const u = i / (RES - 1)
        TABLE[j * RES + i] = attentionScoreHeight(u, v)
    }
}

function sampleAttnHeight(wx: number, wy: number): number {
    const u = Math.max(0, Math.min(1, (wx + HALF) / (2 * HALF))) * (RES - 1)
    const v = Math.max(0, Math.min(1, (wy + HALF) / (2 * HALF))) * (RES - 1)
    const i0 = Math.min(RES - 2, Math.floor(u))
    const j0 = Math.min(RES - 2, Math.floor(v))
    const fu = u - i0
    const fv = v - j0
    const h00 = TABLE[j0 * RES + i0]!
    const h10 = TABLE[j0 * RES + i0 + 1]!
    const h01 = TABLE[(j0 + 1) * RES + i0]!
    const h11 = TABLE[(j0 + 1) * RES + i0 + 1]!
    return (h00 * (1 - fu) + h10 * fu) * (1 - fv) + (h01 * (1 - fu) + h11 * fu) * fv
}

const NAIVE_GB = naiveHbmBytes(16384, 64) / 1e9
const FLASH_GB = flashHbmBytes(16384, 64) / 1e9
const REDUCTION = NAIVE_GB / FLASH_GB

/** Reactive 3D mini slab wireframe (8 corners, 12 glowing edges) for Q / K SRAM-HBM blocks! */
function miniSlabEdges(
    centerFn: () => Vec3,
    hx: number,
    hy: number,
    hz: number,
    color: string,
) {
    const pt = (sx: number, sy: number, sz: number) => (): Vec3 => {
        const [cx, cy, cz] = centerFn()
        return [cx + sx * hx, cy + sy * hy, cz + sz * hz]
    }
    const style = { color, width: 2.8, glow: 8, blend: 'screen' as const, onTop: true }
    return [
        // Top rect
        line3d(pt(-1, -1, 1), pt(1, -1, 1), style),
        line3d(pt(1, -1, 1), pt(1, 1, 1), style),
        line3d(pt(1, 1, 1), pt(-1, 1, 1), style),
        line3d(pt(-1, 1, 1), pt(-1, -1, 1), style),
        // Bottom rect
        line3d(pt(-1, -1, -1), pt(1, -1, -1), { ...style, width: 1.8, opacity: 0.72 }),
        line3d(pt(1, -1, -1), pt(1, 1, -1), { ...style, width: 1.8, opacity: 0.72 }),
        line3d(pt(1, 1, -1), pt(-1, 1, -1), { ...style, width: 1.8, opacity: 0.72 }),
        line3d(pt(-1, 1, -1), pt(-1, -1, -1), { ...style, width: 1.8, opacity: 0.72 }),
        // Vertical pillars
        line3d(pt(-1, -1, -1), pt(-1, -1, 1), { ...style, width: 1.8, opacity: 0.8 }),
        line3d(pt(1, -1, -1), pt(1, -1, 1), { ...style, width: 1.8, opacity: 0.8 }),
        line3d(pt(1, 1, -1), pt(1, 1, 1), { ...style, width: 1.8, opacity: 0.8 }),
        line3d(pt(-1, 1, -1), pt(-1, 1, 1), { ...style, width: 1.8, opacity: 0.8 }),
    ]
}

export const tiling: SceneFunction = (s, c) => {
    const tileCursor = s.value(0)
    const hbmDrop = s.value(0)
    const showLegend = s.value(1)

    const activeTileBounds = () => {
        const idx = Math.min(GRID * GRID - 1, Math.floor(tileCursor.value))
        const row = Math.floor(idx / GRID)
        const col = idx % GRID
        const x0 = -HALF + col * TILE_W
        const x1 = x0 + TILE_W
        const y0 = -HALF + row * TILE_W
        const y1 = y0 + TILE_W
        return { row, col, x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
    }

    const view3d = scene3d({
        theta: -0.78,
        phi: 1.02,
        distance: 15.4,
        unit: 114,
        perspective: true,
        ambient: 0.36,
        shine: 0.34,
        brightness: 1.1,
        fog: 0.09,
        focus: [0, 0, 0.72],
    }).at(295, 6)

    // Smooth 56x56 3D Q*K^T attention manifold!
    const terrain = surface((wx, wy) => sampleAttnHeight(wx, wy), {
        x: [-HALF, HALF],
        y: [-HALF, HALF],
        resolution: [56, 56],
        colors: ['#070b1a', '#1b275c', '#4c2f8a', '#1f7ec2', '#5ce1e6', '#ffd166'],
        mesh: '#7ce8ff',
        meshOpacity: 0.16,
        meshWidth: 0.55,
        opacity: 0.9,
    })

    // Tile grid divider rails on floor z = 0.05
    const gridLines = []
    for (let k = 0; k <= GRID; k++) {
        const pos = -HALF + k * TILE_W
        gridLines.push(
            line3d([pos, -HALF, 0.05], [pos, HALF, 0.05], { color: '#4c6599', width: 1.5, opacity: 0.52 }),
            line3d([-HALF, pos, 0.05], [HALF, pos, 0.05], { color: '#4c6599', width: 1.5, opacity: 0.52 }),
        )
    }

    // 3D axis guide rails + crisp label3d axis labels (Query Q, Key K, Score S) cleanly outside the mesh!
    const axisGuides = [
        line3d([-HALF, -HALF, 0.05], [HALF + 0.45, -HALF, 0.05], { color: COSMOS.cyan, width: 2.2, opacity: 0.72 }),
        line3d([-HALF, -HALF, 0.05], [-HALF, HALF + 0.45, 0.05], { color: COSMOS.gold, width: 2.2, opacity: 0.72 }),
        line3d([-HALF, HALF, 0.05], [-HALF, HALF, 2.85], { color: COSMOS.violet, width: 2.2, opacity: 0.72 }),
        label3d('Key K', [HALF + 0.55, -HALF + 0.35, 0.12], { size: 26, color: COSMOS.cyan, math: false, font: 'mono', offset: [56, 0] }),
        label3d('Query Q', [HALF + 0.25, 0.1, 0.08], { size: 26, color: COSMOS.gold, math: false, font: 'mono', offset: [18, 72] }),
        label3d('Score S', [-HALF - 0.1, HALF + 0.1, 3.25], { size: 26, color: COSMOS.violet, math: false, font: 'mono', offset: [0, -28] }),
    ]

    // Reactive 3D glowing SRAM tile cage hovering cleanly around the active (row, col) block!
    const zBot = 0.12
    const zTop = 2.38
    const corner = (dx: 0 | 1, dy: 0 | 1, z: number) => (): Vec3 => {
        const b = activeTileBounds()
        return [dx ? b.x1 : b.x0, dy ? b.y1 : b.y0, z]
    }
    const qSlabCenter = (): Vec3 => {
        const b = activeTileBounds()
        return [-HALF - 0.85, b.cy, 0.72]
    }
    const kSlabCenter = (): Vec3 => {
        const b = activeTileBounds()
        return [b.cx, -HALF - 0.85, 0.72]
    }
    const tileCenterTop = (): Vec3 => {
        const b = activeTileBounds()
        return [b.cx, b.cy, zTop]
    }

    // Labeled mini 3D Q (SRAM pinned) and K (HBM streamed) slabs instead of floating unlabeled dots!
    const qMiniSlab = miniSlabEdges(qSlabCenter, 0.32, 0.62, 0.20, COSMOS.gold)
    const kMiniSlab = miniSlabEdges(kSlabCenter, 0.62, 0.32, 0.20, COSMOS.cyan)

    const qSlabLabel = label3d('Q SRAM', () => {
        const [cx, cy] = qSlabCenter()
        return [cx - 0.95, cy, 1.35] as Vec3
    }, { size: 26, color: COSMOS.gold, math: false, font: 'mono', offset: [-82, -24] })

    const kSlabLabel = label3d('K/V HBM', () => {
        const [cx, cy] = kSlabCenter()
        return [cx - 0.95, cy - 0.35, 0.45] as Vec3
    }, { size: 26, color: COSMOS.cyan, math: false, font: 'mono', offset: [-74, 8] })

    view3d.add(
        terrain,
        ...gridLines,
        ...axisGuides,
        ...qMiniSlab,
        ...kMiniSlab,
        qSlabLabel,
        kSlabLabel,
        // Bottom glowing gold frame
        line3d(corner(0, 0, zBot), corner(1, 0, zBot), { color: COSMOS.gold, width: 4.2, glow: 10, blend: 'screen', onTop: true }),
        line3d(corner(1, 0, zBot), corner(1, 1, zBot), { color: COSMOS.gold, width: 4.2, glow: 10, blend: 'screen', onTop: true }),
        line3d(corner(1, 1, zBot), corner(0, 1, zBot), { color: COSMOS.gold, width: 4.2, glow: 10, blend: 'screen', onTop: true }),
        line3d(corner(0, 1, zBot), corner(0, 0, zBot), { color: COSMOS.gold, width: 4.2, glow: 10, blend: 'screen', onTop: true }),
        // Top glowing cyan SRAM block roof
        line3d(corner(0, 0, zTop), corner(1, 0, zTop), { color: COSMOS.cyan, width: 3.4, glow: 10, blend: 'screen', onTop: true }),
        line3d(corner(1, 0, zTop), corner(1, 1, zTop), { color: COSMOS.cyan, width: 3.4, glow: 10, blend: 'screen', onTop: true }),
        line3d(corner(1, 1, zTop), corner(0, 1, zTop), { color: COSMOS.cyan, width: 3.4, glow: 10, blend: 'screen', onTop: true }),
        line3d(corner(0, 1, zTop), corner(0, 0, zTop), { color: COSMOS.cyan, width: 3.4, glow: 10, blend: 'screen', onTop: true }),
        // Vertical corner pillars
        line3d(corner(0, 0, zBot), corner(0, 0, zTop), { color: COSMOS.gold, width: 2.2, glow: 6, blend: 'screen', opacity: 0.85, onTop: true }),
        line3d(corner(1, 0, zBot), corner(1, 0, zTop), { color: COSMOS.gold, width: 2.2, glow: 6, blend: 'screen', opacity: 0.85, onTop: true }),
        line3d(corner(1, 1, zBot), corner(1, 1, zTop), { color: COSMOS.gold, width: 2.2, glow: 6, blend: 'screen', opacity: 0.85, onTop: true }),
        line3d(corner(0, 1, zBot), corner(0, 1, zTop), { color: COSMOS.gold, width: 2.2, glow: 6, blend: 'screen', opacity: 0.85, onTop: true }),
        // Streaming Q and K/V glowing additive energy beams feeding the active SRAM tile!
        line3d(qSlabCenter, tileCenterTop, { color: COSMOS.gold, width: 3.8, glow: 10, blend: 'screen', opacity: 0.94, onTop: true }),
        line3d(kSlabCenter, tileCenterTop, { color: COSMOS.cyan, width: 3.8, glow: 10, blend: 'screen', opacity: 0.94, onTop: true }),
        // Corner & conduit photon highlights
        points3d(() => {
            const b = activeTileBounds()
            const q = qSlabCenter()
            const k = kSlabCenter()
            const top = tileCenterTop()
            const frac = (tileCursor.value * 2.5) % 1
            return [
                [b.x0, b.y0, zTop],
                [b.x1, b.y0, zTop],
                [b.x1, b.y1, zTop],
                [b.x0, b.y1, zTop],
                [q[0] + (top[0] - q[0]) * frac, q[1] + (top[1] - q[1]) * frac, q[2] + (top[2] - q[2]) * frac],
                [k[0] + (top[0] - k[0]) * frac, k[1] + (top[1] - k[1]) * frac, k[2] + (top[2] - k[2]) * frac],
            ] as Vec3[]
        }, {
            colorAt: (idx) => (idx < 4 ? '#fff8dc' : idx === 4 ? COSMOS.gold : COSMOS.cyan),
            radius: 5.5,
            glow: 12,
            blend: 'screen',
            onTop: true,
        }),
    )

    const aura = circle(560, {
        fill: radialGradient([0, 0], 560, [
            [0, '#4c2f8a2a'],
            [0.5, '#2180c216'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(245, 28).set('blend', 'screen')

    const leftCopy = group(
        txt('Tiled SRAM', -855, -395, 64, COSMOS.ink, 'serif', 'left'),
        txt('Attention', -855, -322, 64, COSMOS.cyan, 'serif', 'left').glow(6, '#38bdf8'),
        txt('Never write N × N to HBM', -855, -244, 28, COSMOS.muted, 'sans', 'left'),
    )

    const complexityEq = tex(String.raw`O(N^2) \;\longrightarrow\; O\!\left(\frac{N^2 d}{M}\right)`, {
        size: 46,
        color: COSMOS.gold,
    }).at(-625, 38).glow(6, COSMOS.gold)

    // Compact HBM-vs-SRAM tile legend filling the middle-left gap cleanly BEFORE complexityEq arrives!
    const liveLegend = dynamic(() => {
        const la = showLegend.value
        if (la < 0.02) return []
        return group(
            line([-855, -52], [-475, -52], { stroke: '#2a385c', width: 1.5 }).opacity(0.7 * la),
            rect(18, 18, { fill: COSMOS.gold, stroke: null, radius: 4 }).at(-844, -14).glow(6, COSMOS.gold).opacity(la),
            txt('Q pinned in SRAM', -820, -14, 26, COSMOS.gold, 'sans', 'left').opacity(la),
            rect(18, 18, { fill: COSMOS.cyan, stroke: null, radius: 4 }).at(-844, 34).glow(6, COSMOS.cyan).opacity(la),
            txt('K, V streamed from HBM', -820, 34, 26, COSMOS.cyan, 'sans', 'left').opacity(la),
            dot(8, COSMOS.violet).at(-844, 82).glow(6, COSMOS.violet).opacity(la),
            txt('S tile fused on-chip', -820, 82, 26, COSMOS.muted, 'sans', 'left').opacity(la),
            line([-855, 122], [-475, 122], { stroke: '#2a385c', width: 1.5 }).opacity(0.7 * la),
        )
    })

    const liveMetrics = dynamic(() => {
        const b = activeTileBounds()
        const d = hbmDrop.value
        const curGb = NAIVE_GB + (FLASH_GB - NAIVE_GB) * d
        const col = d < 0.35 ? COSMOS.rose : d < 0.75 ? COSMOS.amber : COSMOS.emerald
        const badge = d > 0.75 ? `${REDUCTION.toFixed(1)}× less HBM I/O` : 'N = 16,384  ·  d = 64  ·  H100 SMEM'
        return group(
            txt(`Active SRAM Tile  (Q${b.row + 1}, K${b.col + 1})`, -855, -148, 28, COSMOS.gold, 'mono', 'left'),
            txt('Br × Bc block fused on-chip', -855, -106, 26, COSMOS.cyan, 'sans', 'left'),
            txt('HBM TRAFFIC PER HEAD', -855, 190, 26, COSMOS.muted, 'mono', 'left'),
            txt(`${curGb.toFixed(2)} GB`, -855, 264, 76, col, 'mono', 'left').glow(10, col),
            txt(badge, -855, 344, 28, d > 0.75 ? COSMOS.cyan : COSMOS.muted, 'mono', 'left'),
        )
    })

    s.add(aura, view3d, leftCopy, liveLegend, liveMetrics)
    c.at(0.1, () => s.play(view3d.orbit({ theta: -0.14, phi: 0.88 }), { duration: 32.0 }))
    c.at(0.1, () => s.play(tileCursor.to(15.95, { duration: 32.0, ease: linear })))
    const plungeRel = Math.max(0.5, c.cue('traffic plunges by an order').start - c.start - 0.26)
    c.at(plungeRel, () => s.play(showLegend.to(0, { duration: 0.2 })))
    c.show('traffic plunges by an order', complexityEq)
    c.on('traffic plunges by an order', () => {
        s.play(hbmDrop.to(1, { duration: 2.2 }))
    })
}

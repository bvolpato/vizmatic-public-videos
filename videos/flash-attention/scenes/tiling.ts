import {
    circle, dynamic, group, line3d, linear, points3d, radialGradient, scene3d, surface, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { attentionScoreHeight, flashHbmBytes, naiveHbmBytes } from '../math'
import { COSMOS, txt } from '../../../factory/style'

// 3D Q * K^T attention score matrix landscape in [-3.2, 3.2] x [-3.2, 3.2]
const HALF = 3.2
const GRID = 4 // 4x4 = 16 SRAM tiles (Br x Bc)
const TILE_W = (2 * HALF) / GRID

// Precompute high-res attention height lookup table so 3D frames render fast
const RES = 52
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

export const tiling: SceneFunction = (s, c) => {
    const tileCursor = s.value(0)
    const hbmDrop = s.value(0)

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
        phi: 1.04,
        distance: 14.6,
        unit: 136,
        perspective: true,
        ambient: 0.36,
        shine: 0.32,
        brightness: 1.08,
        fog: 0.1,
        focus: [0, 0, 0.72],
    }).at(235, 30)

    const terrain = surface((wx, wy) => sampleAttnHeight(wx, wy), {
        x: [-HALF, HALF],
        y: [-HALF, HALF],
        resolution: [44, 44],
        colors: ['#070b1a', '#1b275c', '#4c2f8a', '#1f7ec2', '#5ce1e6', '#ffd166'],
        mesh: '#7ce8ff',
        meshOpacity: 0.26,
        meshWidth: 0.75,
        opacity: 0.86,
    })

    // Tile grid divider rails on floor z = 0.05
    const gridLines = []
    for (let k = 0; k <= GRID; k++) {
        const pos = -HALF + k * TILE_W
        gridLines.push(
            line3d([pos, -HALF, 0.05], [pos, HALF, 0.05], { color: '#4c6599', width: 1.6, opacity: 0.55 }),
            line3d([-HALF, pos, 0.05], [HALF, pos, 0.05], { color: '#4c6599', width: 1.6, opacity: 0.55 }),
        )
    }

    // Reactive 3D glowing SRAM tile cage hovering cleanly around the active (row, col) block!
    const zBot = 0.12
    const zTop = 2.35
    const corner = (dx: 0 | 1, dy: 0 | 1, z: number) => (): Vec3 => {
        const b = activeTileBounds()
        return [dx ? b.x1 : b.x0, dy ? b.y1 : b.y0, z]
    }
    const qSource = (): Vec3 => {
        const b = activeTileBounds()
        return [-HALF - 1.15, b.cy, 0.85]
    }
    const kSource = (): Vec3 => {
        const b = activeTileBounds()
        return [b.cx, -HALF - 1.15, 0.85]
    }
    const tileCenterTop = (): Vec3 => {
        const b = activeTileBounds()
        return [b.cx, b.cy, zTop]
    }

    view3d.add(
        terrain,
        ...gridLines,
        // Bottom glowing gold frame
        line3d(corner(0, 0, zBot), corner(1, 0, zBot), { color: COSMOS.gold, width: 4, glow: 8, onTop: true }),
        line3d(corner(1, 0, zBot), corner(1, 1, zBot), { color: COSMOS.gold, width: 4, glow: 8, onTop: true }),
        line3d(corner(1, 1, zBot), corner(0, 1, zBot), { color: COSMOS.gold, width: 4, glow: 8, onTop: true }),
        line3d(corner(0, 1, zBot), corner(0, 0, zBot), { color: COSMOS.gold, width: 4, glow: 8, onTop: true }),
        // Top glowing cyan SRAM block roof
        line3d(corner(0, 0, zTop), corner(1, 0, zTop), { color: COSMOS.cyan, width: 3.2, glow: 8, onTop: true }),
        line3d(corner(1, 0, zTop), corner(1, 1, zTop), { color: COSMOS.cyan, width: 3.2, glow: 8, onTop: true }),
        line3d(corner(1, 1, zTop), corner(0, 1, zTop), { color: COSMOS.cyan, width: 3.2, glow: 8, onTop: true }),
        line3d(corner(0, 1, zTop), corner(0, 0, zTop), { color: COSMOS.cyan, width: 3.2, glow: 8, onTop: true }),
        // Vertical corner pillars
        line3d(corner(0, 0, zBot), corner(0, 0, zTop), { color: COSMOS.gold, width: 2.2, opacity: 0.85, onTop: true }),
        line3d(corner(1, 0, zBot), corner(1, 0, zTop), { color: COSMOS.gold, width: 2.2, opacity: 0.85, onTop: true }),
        line3d(corner(1, 1, zBot), corner(1, 1, zTop), { color: COSMOS.gold, width: 2.2, opacity: 0.85, onTop: true }),
        line3d(corner(0, 1, zBot), corner(0, 1, zTop), { color: COSMOS.gold, width: 2.2, opacity: 0.85, onTop: true }),
        // Streaming Q and K/V energy beams feeding the active SRAM tile
        line3d(qSource, tileCenterTop, { color: COSMOS.gold, width: 3.2, glow: 10, opacity: 0.9, onTop: true }),
        line3d(kSource, tileCenterTop, { color: COSMOS.cyan, width: 3.2, glow: 10, opacity: 0.9, onTop: true }),
        points3d(() => {
            const b = activeTileBounds()
            return [
                [b.x0, b.y0, zTop],
                [b.x1, b.y0, zTop],
                [b.x1, b.y1, zTop],
                [b.x0, b.y1, zTop],
                [-HALF - 1.15, b.cy, 0.85],
                [b.cx, -HALF - 1.15, 0.85],
            ] as Vec3[]
        }, { color: '#ffffff', radius: 5.5, halo: 0, onTop: true }),
    )

    const aura = circle(560, {
        fill: radialGradient([0, 0], 560, [
            [0, '#4c2f8a28'],
            [0.5, '#2180c214'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(235, 30)

    const leftCopy = group(
        txt('Tiled SRAM', -855, -395, 64, COSMOS.ink, 'serif', 'left'),
        txt('Attention', -855, -322, 64, COSMOS.cyan, 'serif', 'left').glow(6, '#38bdf8'),
        txt('Never write N × N to HBM', -855, -244, 28, COSMOS.muted, 'sans', 'left'),
    )

    const complexityEq = tex(String.raw`O(N^2) \;\longrightarrow\; O\!\left(\frac{N^2 d}{M}\right)`, {
        size: 46,
        color: COSMOS.gold,
    }).at(-585, 25).glow(6, COSMOS.gold)

    const liveMetrics = dynamic(() => {
        const b = activeTileBounds()
        const d = hbmDrop.value
        const curGb = NAIVE_GB + (FLASH_GB - NAIVE_GB) * d
        const col = d < 0.35 ? COSMOS.rose : d < 0.75 ? COSMOS.amber : COSMOS.emerald
        const badge = d > 0.75 ? `${REDUCTION.toFixed(1)}× less HBM I/O` : 'N = 16,384  ·  d = 64  ·  H100 SMEM'
        return group(
            txt(`Active SRAM Tile  (Q${b.row + 1}, K${b.col + 1})`, -855, -145, 28, COSMOS.gold, 'mono', 'left'),
            txt('Br × Bc block fused on-chip', -855, -104, 26, COSMOS.cyan, 'sans', 'left'),
            txt('HBM TRAFFIC PER HEAD', -855, 190, 26, COSMOS.muted, 'mono', 'left'),
            txt(`${curGb.toFixed(2)} GB`, -855, 264, 76, col, 'mono', 'left').glow(10, col),
            txt(badge, -855, 344, 28, d > 0.75 ? COSMOS.cyan : COSMOS.muted, 'mono', 'left'),
        )
    })

    s.add(aura, view3d, leftCopy, liveMetrics)
    c.at(0.1, () => s.play(view3d.orbit({ theta: -0.06, phi: 0.88 }), { duration: 32.0 }))
    c.at(0.1, () => s.play(tileCursor.to(15.95, { duration: 32.0, ease: linear })))
    c.show('traffic plunges by an order', complexityEq)
    c.on('traffic plunges by an order', () => {
        s.play(hbmDrop.to(1, { duration: 2.2 }))
    })
}

import {
    circle, curve3d, group, line3d, parametricSurface, points3d, radialGradient, scene3d, surface,
    type IntroFunction, type Vec3,
} from 'vizmatic/stage'
import { attentionScoreHeight } from '../math'
import { COSMOS, txt } from '../../../factory/style'

// High-resolution precomputed Q * K^T attention score lookup table for the 3D hero manifold
const HALF = 3.05
const RES = 76
const HERO_TABLE = new Float32Array(RES * RES)
for (let j = 0; j < RES; j++) {
    const v = j / (RES - 1)
    for (let i = 0; i < RES; i++) {
        const u = i / (RES - 1)
        HERO_TABLE[j * RES + i] = attentionScoreHeight(u, v)
    }
}

function sampleHero(wx: number, wy: number): number {
    const u = Math.max(0, Math.min(1, (wx + HALF) / (2 * HALF))) * (RES - 1)
    const v = Math.max(0, Math.min(1, (wy + HALF) / (2 * HALF))) * (RES - 1)
    const i0 = Math.min(RES - 2, Math.floor(u))
    const j0 = Math.min(RES - 2, Math.floor(v))
    const fu = u - i0
    const fv = v - j0
    const h00 = HERO_TABLE[j0 * RES + i0]!
    const h10 = HERO_TABLE[j0 * RES + i0 + 1]!
    const h01 = HERO_TABLE[(j0 + 1) * RES + i0]!
    const h11 = HERO_TABLE[(j0 + 1) * RES + i0 + 1]!
    return (h00 * (1 - fu) + h10 * fu) * (1 - fv) + (h01 * (1 - fu) + h11 * fu) * fv
}

export const poster: IntroFunction = (stage, clock) => {
    const flow = stage.value(0.22)

    // Bespoke isometric 3D hero: high-res 56x56 attention manifold + glowing gold SRAM tile hovering above
    const hero3d = scene3d({
        theta: -0.76,
        phi: 1.02,
        distance: 14.8,
        unit: 130,
        perspective: true,
        ambient: 0.38,
        shine: 0.38,
        brightness: 1.14,
        fog: 0.08,
        focus: [0, 0, 0.95],
    }).at(435, 48)

    // 56x56 smooth 3D attention manifold surface
    const manifold = surface((wx, wy) => sampleHero(wx, wy), {
        x: [-HALF, HALF],
        y: [-HALF, HALF],
        resolution: [56, 56],
        colors: ['#060a18', '#152254', '#472c87', '#1d7dc4', '#5ce1e6', '#ffd166'],
        mesh: '#7ce8ff',
        meshOpacity: 0.16,
        meshWidth: 0.55,
        opacity: 0.92,
    })

    // Subtle 4x4 tile boundary grid etched onto the base floor
    const tileStep = (2 * HALF) / 4
    const floorGrid = []
    for (let k = 0; k <= 4; k++) {
        const p = -HALF + k * tileStep
        floorGrid.push(
            line3d([p, -HALF, 0.04], [p, HALF, 0.04], { color: '#456099', width: 1.4, opacity: 0.48 }),
            line3d([-HALF, p, 0.04], [HALF, p, 0.04], { color: '#456099', width: 1.4, opacity: 0.48 }),
        )
    }

    // Hovering glowing gold SRAM tile over the dramatic central-right ridge
    const tx0 = -0.35
    const tx1 = 1.45
    const ty0 = -1.25
    const ty1 = 0.55
    const tcx = (tx0 + tx1) / 2
    const tcy = (ty0 + ty1) / 2
    const zFloat = 2.48
    const zThick = 0.22
    const zBase = 0.14

    // Translucent luminous gold SRAM tile top wafer
    const sramTop = parametricSurface(
        (u, v) => [tx0 + u * (tx1 - tx0), ty0 + v * (ty1 - ty0), zFloat] as Vec3,
        [0, 1],
        [0, 1],
        {
            resolution: [8, 8],
            color: COSMOS.gold,
            mesh: '#fff4c8',
            meshOpacity: 0.42,
            meshWidth: 0.85,
            opacity: 0.42,
            shaded: true,
        },
    )

    // Glowing gold SRAM tile frame + drop-down footprint rails onto the manifold
    const sramFrame = [
        // Top wafer perimeter
        line3d([tx0, ty0, zFloat], [tx1, ty0, zFloat], { color: COSMOS.gold, width: 4.5, glow: 10, blend: 'screen', onTop: true }),
        line3d([tx1, ty0, zFloat], [tx1, ty1, zFloat], { color: COSMOS.gold, width: 4.5, glow: 10, blend: 'screen', onTop: true }),
        line3d([tx1, ty1, zFloat], [tx0, ty1, zFloat], { color: COSMOS.gold, width: 4.5, glow: 10, blend: 'screen', onTop: true }),
        line3d([tx0, ty1, zFloat], [tx0, ty0, zFloat], { color: COSMOS.gold, width: 4.5, glow: 10, blend: 'screen', onTop: true }),
        // Lower bezel of hovering SRAM slab
        line3d([tx0, ty0, zFloat - zThick], [tx1, ty0, zFloat - zThick], { color: COSMOS.cyan, width: 2.6, glow: 8, blend: 'screen', onTop: true }),
        line3d([tx1, ty0, zFloat - zThick], [tx1, ty1, zFloat - zThick], { color: COSMOS.cyan, width: 2.6, glow: 8, blend: 'screen', onTop: true }),
        line3d([tx1, ty1, zFloat - zThick], [tx0, ty1, zFloat - zThick], { color: COSMOS.cyan, width: 2.6, glow: 8, blend: 'screen', onTop: true }),
        line3d([tx0, ty1, zFloat - zThick], [tx0, ty0, zFloat - zThick], { color: COSMOS.cyan, width: 2.6, glow: 8, blend: 'screen', onTop: true }),
        // Vertical projection beams down to the attention landscape
        line3d([tx0, ty0, zBase], [tx0, ty0, zFloat], { color: COSMOS.gold, width: 2.2, glow: 8, blend: 'screen', opacity: 0.72, onTop: true }),
        line3d([tx1, ty0, zBase], [tx1, ty0, zFloat], { color: COSMOS.gold, width: 2.2, glow: 8, blend: 'screen', opacity: 0.72, onTop: true }),
        line3d([tx1, ty1, zBase], [tx1, ty1, zFloat], { color: COSMOS.gold, width: 2.2, glow: 8, blend: 'screen', opacity: 0.72, onTop: true }),
        line3d([tx0, ty1, zBase], [tx0, ty1, zFloat], { color: COSMOS.gold, width: 2.2, glow: 8, blend: 'screen', opacity: 0.72, onTop: true }),
        // Footprint boundary on manifold floor
        line3d([tx0, ty0, zBase], [tx1, ty0, zBase], { color: COSMOS.cyan, width: 2.8, glow: 8, blend: 'screen', onTop: true }),
        line3d([tx1, ty0, zBase], [tx1, ty1, zBase], { color: COSMOS.cyan, width: 2.8, glow: 8, blend: 'screen', onTop: true }),
        line3d([tx1, ty1, zBase], [tx0, ty1, zBase], { color: COSMOS.cyan, width: 2.8, glow: 8, blend: 'screen', onTop: true }),
        line3d([tx0, ty1, zBase], [tx0, ty0, zBase], { color: COSMOS.cyan, width: 2.8, glow: 8, blend: 'screen', onTop: true }),
    ]

    // Glowing HBM-to-SRAM line3d data streams (glow: 10, blend: 'screen') rising from Q & K rails
    const hbmStreams = [
        // Q-side off-chip HBM rail -> hovering SRAM tile
        line3d([-HALF - 0.55, -0.95, 0.25], [tx0, ty0 + 0.35, zFloat - 0.08], { color: COSMOS.gold, width: 3.4, glow: 10, blend: 'screen', opacity: 0.92, onTop: true }),
        line3d([-HALF - 0.55, -0.35, 0.25], [tx0, tcy, zFloat - 0.08], { color: COSMOS.gold, width: 4.0, glow: 10, blend: 'screen', opacity: 0.96, onTop: true }),
        line3d([-HALF - 0.55, 0.25, 0.25], [tx0, ty1 - 0.35, zFloat - 0.08], { color: COSMOS.amber, width: 3.0, glow: 10, blend: 'screen', opacity: 0.85, onTop: true }),
        // K/V-side off-chip HBM rail -> hovering SRAM tile
        line3d([tx0 + 0.35, -HALF - 0.55, 0.25], [tx0 + 0.35, ty0, zFloat - 0.08], { color: COSMOS.cyan, width: 3.4, glow: 10, blend: 'screen', opacity: 0.92, onTop: true }),
        line3d([tcx, -HALF - 0.55, 0.25], [tcx, ty0, zFloat - 0.08], { color: COSMOS.cyan, width: 4.0, glow: 10, blend: 'screen', opacity: 0.96, onTop: true }),
        line3d([tx1 - 0.35, -HALF - 0.55, 0.25], [tx1 - 0.35, ty0, zFloat - 0.08], { color: '#8be9fd', width: 3.0, glow: 10, blend: 'screen', opacity: 0.85, onTop: true }),
        // HBM base bus bars at the perimeter
        line3d([-HALF - 0.55, -1.25, 0.25], [-HALF - 0.55, 0.55, 0.25], { color: COSMOS.rose, width: 5.5, glow: 10, blend: 'screen', onTop: true }),
        line3d([tx0, -HALF - 0.55, 0.25], [tx1, -HALF - 0.55, 0.25], { color: COSMOS.rose, width: 5.5, glow: 10, blend: 'screen', onTop: true }),
    ]

    // Graceful curved energy arc looping over the fused SRAM tile
    const fusionArc = curve3d(
        (u) => {
            const ang = -0.35 + u * Math.PI * 1.15
            const r = 1.95
            return [tcx + Math.cos(ang) * r, tcy + Math.sin(ang) * r * 0.72, zFloat + 0.35 * Math.sin(u * Math.PI)] as Vec3
        },
        0,
        1,
        { samples: 44, colors: [COSMOS.cyan, COSMOS.gold, '#ffffff'], width: 3.0, glow: 10, blend: 'screen', opacity: 0.88, onTop: true },
    )

    // Streaming glowing photon packets riding the HBM -> SRAM conduits + tile corner jewels
    const streamEndpoints: readonly [Vec3, Vec3][] = [
        [[-HALF - 0.55, -0.95, 0.25], [tx0, ty0 + 0.35, zFloat - 0.08]],
        [[-HALF - 0.55, -0.35, 0.25], [tx0, tcy, zFloat - 0.08]],
        [[-HALF - 0.55, 0.25, 0.25], [tx0, ty1 - 0.35, zFloat - 0.08]],
        [[tx0 + 0.35, -HALF - 0.55, 0.25], [tx0 + 0.35, ty0, zFloat - 0.08]],
        [[tcx, -HALF - 0.55, 0.25], [tcx, ty0, zFloat - 0.08]],
        [[tx1 - 0.35, -HALF - 0.55, 0.25], [tx1 - 0.35, ty0, zFloat - 0.08]],
    ]

    const streamPhotons = points3d(
        () => {
            const p = flow.value
            const pts: Vec3[] = [
                [tx0, ty0, zFloat],
                [tx1, ty0, zFloat],
                [tx1, ty1, zFloat],
                [tx0, ty1, zFloat],
            ]
            for (let sIdx = 0; sIdx < streamEndpoints.length; sIdx++) {
                const [a, b] = streamEndpoints[sIdx]!
                for (let k = 0; k < 2; k++) {
                    const u = (p * 1.15 + sIdx * 0.17 + k * 0.5) % 1
                    pts.push([
                        a[0] + (b[0] - a[0]) * u,
                        a[1] + (b[1] - a[1]) * u,
                        a[2] + (b[2] - a[2]) * u,
                    ])
                }
            }
            return pts
        },
        {
            colorAt: (idx) => (idx < 4 ? '#fff8dc' : idx % 2 === 0 ? COSMOS.gold : COSMOS.cyan),
            radius: 5.5,
            glow: 12,
            blend: 'screen',
            onTop: true,
        },
    )

    hero3d.add(manifold, ...floorGrid, sramTop, ...sramFrame, ...hbmStreams, fusionArc, streamPhotons)

    // Atmospheric luminous glow backdrop behind the 3D hero
    const backdropAura = group(
        circle(560, {
            fill: radialGradient([0, 0], 560, [
                [0, '#5ce1e626'],
                [0.42, '#472c871e'],
                [0.75, '#ffd16612'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(340, 20),
        circle(260, {
            fill: radialGradient([0, 0], 260, [
                [0, '#ffd1662c'],
                [0.55, '#5ce1e614'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(430, -85),
    ).set('blend', 'screen')

    stage.add(
        backdropAura,
        hero3d,
        txt('989 TFLOP/s   ·   3.35 TB/s HBM3', -860, -205, 26, COSMOS.gold, 'mono', 'left'),
        txt('FlashAttention', -866, -74, 114, COSMOS.ink, 'serif', 'left').glow(8, COSMOS.blue),
        txt('Why GPUs spend 90%', -860, 58, 56, COSMOS.cyan, 'serif', 'left').glow(8, '#38bdf8'),
        txt('of their time waiting', -860, 128, 56, COSMOS.cyan, 'serif', 'left').glow(8, '#38bdf8'),
        txt('IO-aware exact attention in on-chip SRAM', -858, 224, 28, COSMOS.muted, 'sans', 'left'),
    )

    const dur = Math.max(0.45, clock.intro - 0.05)
    stage.at(0.02, () => stage.play(flow.to(0.95, { duration: dur })))
    stage.at(0.02, () => stage.play(hero3d.orbit({ theta: -0.64, phi: 0.98 }), { duration: dur }))
}

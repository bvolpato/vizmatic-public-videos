import {
    Node, circle, curve3d, dot, dynamic, group, line, line3d, linear, point3d, points3d, radialGradient, scene3d,
    surface,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const R_BOUND = 4.35
const ISLAND_R1 = 1.92
const ISLAND_R2 = 2.92
const ISLAND_R3 = 3.72

function archipelagoHeight(x: number, y: number): number {
    const r2 = x * x + y * y
    const mainPeak = 1.82 * Math.exp(-r2 / 2.25)
    const ridge =
        0.24 *
        Math.exp(-Math.pow(Math.sqrt(r2) - 1.15, 2) / 0.38) *
        (0.65 + 0.35 * Math.cos(3 * Math.atan2(y, x)))
    const seaRipple = 0.08 * Math.sin(x * 1.45 + y * 0.85) * Math.cos(y * 1.35 - x * 0.6)
    return 0.14 + mainPeak + ridge + seaRipple
}

const G_XY: readonly [number, number] = [2.25, -1.12]
const G_SURF_Z = archipelagoHeight(G_XY[0], G_XY[1])
const G_BASE: Vec3 = [G_XY[0], G_XY[1], G_SURF_Z + 0.05]
const G_POS: Vec3 = [G_XY[0], G_XY[1], G_SURF_Z + 0.56]

const GP_XY: readonly [number, number] = [-2.26, 2.74]
const GP_SURF_Z = archipelagoHeight(GP_XY[0], GP_XY[1])
const GP_BASE: Vec3 = [GP_XY[0], GP_XY[1], GP_SURF_Z + 0.05]
const G_PRIME_POS: Vec3 = [GP_XY[0], GP_XY[1], GP_SURF_Z + 0.88]

const AXIOM_THEOREMS: readonly Vec3[] = [
    [1.12, 0.65, archipelagoHeight(1.12, 0.65) + 0.06],
    [-1.2, 0.55, archipelagoHeight(-1.2, 0.55) + 0.06],
    [0.58, -1.22, archipelagoHeight(0.58, -1.22) + 0.06],
    [-0.78, -1.08, archipelagoHeight(-0.78, -1.08) + 0.06],
    [1.45, -0.35, archipelagoHeight(1.45, -0.35) + 0.06],
    [-0.18, 1.48, archipelagoHeight(-0.18, 1.48) + 0.06],
]

// 50 glowing unprovable truth-stars scattered across the dark ocean surrounding the island
const OCEAN_TRUTH_STARS: readonly Vec3[] = Array.from({ length: 50 }, (_, i) => {
    const h1 = Math.sin((i + 1) * 127.1 + 4.3) * 43758.5453
    const h2 = Math.sin((i + 1) * 269.5 + 1.9) * 19642.349
    const u = h1 - Math.floor(h1)
    const v = h2 - Math.floor(h2)
    const angle = (i / 50) * Math.PI * 2 + u * 0.42
    const rad = ISLAND_R1 + 0.34 + v * (R_BOUND - ISLAND_R1 - 0.52)
    const x = rad * Math.cos(angle)
    const y = rad * Math.sin(angle)
    const z = archipelagoHeight(x, y) + 0.12 + (i % 4) * 0.055
    return [x, y, z]
})

export const horizon3d: SceneFunction = (s, c) => {
    const expandProg = s.value(0)

    const aura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#38bdf828'],
            [0.55, '#ffd16618'],
            [1, '#07091000'],
        ]),
        stroke: null,
    })
        .at(190, 32)
        .set('blend', 'screen')

    const view3d = scene3d({
        theta: -0.72,
        phi: 1.04,
        distance: 14.8,
        unit: 132,
        perspective: true,
        ambient: 0.38,
        shine: 0.32,
        brightness: 1.08,
        fog: 0.12,
        focus: [0, 0, 0.54],
    }).at(190, 32)

    const terrain = surface((wx, wy) => archipelagoHeight(wx, wy), {
        x: [-R_BOUND, R_BOUND],
        y: [-R_BOUND, R_BOUND],
        resolution: [52, 52],
        colors: ['#060916', '#141a38', '#1d3b6b', '#2292c7', '#5ce1e6', '#ffd166'],
        mesh: '#7ce8ff',
        meshOpacity: 0.2,
        meshWidth: 0.65,
        opacity: 0.88,
    })

    // Inner formal-system shoreline F
    const shoreF = curve3d(
        (u) => {
            const x = ISLAND_R1 * Math.cos(u)
            const y = ISLAND_R1 * Math.sin(u)
            return [x, y, archipelagoHeight(x, y) + 0.08]
        },
        0,
        Math.PI * 2,
        { samples: 112, color: '#5ce1e6', width: 4.0, glow: 10, blend: 'screen', opacity: 0.95 },
    )

    // Expanding concentric golden horizon ring (F + G)
    const shoreFG = curve3d(
        (u) => {
            const ep = expandProg.value
            const r = ISLAND_R1 + (ISLAND_R2 - ISLAND_R1) * Math.max(0.01, ep)
            const x = r * Math.cos(u)
            const y = r * Math.sin(u)
            return [x, y, archipelagoHeight(x, y) + 0.1]
        },
        0,
        Math.PI * 2,
        { samples: 112, color: '#ffd166', width: 4.4, glow: 10, blend: 'screen', opacity: 0.92, animate: true },
    )

    // Outer receding horizon ring (F + G + G')
    const shoreFGG = curve3d(
        (u) => {
            const ep = expandProg.value
            const r = ISLAND_R2 + (ISLAND_R3 - ISLAND_R2) * Math.max(0.05, ep)
            const x = r * Math.cos(u)
            const y = r * Math.sin(u)
            return [x, y, archipelagoHeight(x, y) + 0.1]
        },
        0,
        Math.PI * 2,
        { samples: 112, color: '#ff8fab', width: 2.4, glow: 8, blend: 'screen', opacity: 0.48, animate: true },
    )

    // Clean curved radial surface arc sweeping gracefully over the hillside from the axiom peak to G (zero vertical needle!)
    const axiomToGArc = curve3d(
        (u) => {
            const ep = expandProg.value
            const p = u * Math.max(0.001, Math.min(1, ep * 1.45))
            const bow = Math.sin(p * Math.PI) * 0.34
            const x = G_XY[0] * p - G_XY[1] * 0.22 * bow
            const y = G_XY[1] * p + G_XY[0] * 0.22 * bow
            const z = archipelagoHeight(x, y) + 0.1 + 0.14 * Math.sin(p * Math.PI)
            return [x, y, z]
        },
        0,
        1,
        { samples: 48, color: '#ffd166', width: 3.4, glow: 10, blend: 'screen', opacity: 0.92, animate: true, bias: 0.08 },
    )

    // 50 glowing truth-stars across the surrounding dark ocean
    const oceanStars = points3d(OCEAN_TRUTH_STARS, {
        radius: 3.4,
        glow: 10,
        blend: 'screen',
        opacity: 0.86,
        bias: 0.05,
        colorAt: (i) => (i % 5 === 0 ? '#ffd166' : i % 3 === 0 ? '#5ce1e6' : i % 4 === 0 ? '#ff8fab' : '#a78bfa'),
    })

    view3d.add(
        terrain,
        oceanStars,
        shoreF,
        shoreFG,
        shoreFGG,
        axiomToGArc,
        point3d([0, 0, archipelagoHeight(0, 0) + 0.08], {
            color: '#ffffff',
            radius: 7.5,
            glow: 14,
            blend: 'screen',
            onTop: true,
        }),
        ...AXIOM_THEOREMS.flatMap((pt) => [
            curve3d(
                (u) => {
                    const x = pt[0] * u
                    const y = pt[1] * u
                    return [x, y, archipelagoHeight(x, y) + 0.09]
                },
                0,
                1,
                { samples: 18, color: '#5ce1e6', width: 2.0, opacity: 0.72, glow: 4, blend: 'screen' },
            ),
            point3d(pt, { color: '#5ce1e6', radius: 5.0, glow: 8, blend: 'screen' }),
        ]),
        // Short vertical beacon pin for G starting cleanly ON the ocean surface (never penetrating below!)
        line3d(G_BASE, G_POS, { color: '#ffd166', width: 2.8, glow: 8, blend: 'screen', opacity: 0.94 }),
        point3d(G_BASE, { color: '#ffd166', radius: 4.0, glow: 6, blend: 'screen' }),
        point3d(G_POS, { color: '#ffd166', radius: 8.5, glow: 14, blend: 'screen', onTop: true }),
    )

    const liveOverlays = dynamic(() => {
        const ep = expandProg.value
        const gPrimeVis = Math.max(0, Math.min(1, (ep - 0.36) * 2.0))
        const [gx, gy] = view3d.stagePoint(G_POS)
        const [gtx, gty] = view3d.stagePoint([G_POS[0], G_POS[1], G_POS[2] + 0.56])

        const nodes: Node[] = [
            txt('G', gtx, gty, 34, '#ffd166', 'serif').glow(10, '#ffd166'),
            // Clean horizon ring legend on the left margin (never crossed by 3D mesh strokes)
            dot(6, '#5ce1e6').at(-828, -90).glow(8, '#5ce1e6'),
            txt('Ring 1:  F  (initial shore)', -804, -88, 26, '#5ce1e6', 'mono', 'left').opacity(0.92),
        ]

        if (ep > 0.05) {
            const a = Math.min(1, ep * 1.6)
            nodes.push(
                circle(20 + ep * 14, { fill: null, stroke: '#5ce1e6', width: 2.6 })
                    .at(gx, gy)
                    .opacity(0.86 * a)
                    .glow(8, '#5ce1e6')
                    .set('blend', 'screen'),
                dot(6, '#ffd166').at(-828, -42).glow(8, '#ffd166').opacity(a),
                txt('Ring 2:  F + G  (expanded)', -804, -40, 26, '#ffd166', 'mono', 'left').glow(4, '#ffd166').opacity(a),
                dot(6, '#ff9bb5').at(-828, 6).glow(8, '#ff6b8b').opacity(0.88 * a),
                txt("Ring 3:  F + G + G'  (receding)", -804, 8, 26, '#ff9bb5', 'mono', 'left').opacity(0.88 * a),
            )
        }

        if (gPrimeVis > 0.04) {
            const [pbx, pby] = view3d.stagePoint(GP_BASE)
            const [px, py] = view3d.stagePoint(G_PRIME_POS)
            const [ptx, pty] = view3d.stagePoint([G_PRIME_POS[0], G_PRIME_POS[1], G_PRIME_POS[2] + 0.6])
            nodes.push(
                line([pbx, pby], [px, py], { stroke: '#ff8fab', width: 3.2 })
                    .opacity(0.95 * gPrimeVis)
                    .glow(10, '#ff6b8b')
                    .set('blend', 'screen'),
                dot(4.5, '#ff8fab').at(pbx, pby).opacity(0.9 * gPrimeVis).glow(6, '#ff6b8b').set('blend', 'screen'),
                circle(44, {
                    fill: radialGradient([0, 0], 44, [
                        [0, '#ff6b8b88'],
                        [0.45, '#ffd16634'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                })
                    .at(px, py)
                    .opacity(gPrimeVis)
                    .set('blend', 'screen'),
                circle(20 + (1 - gPrimeVis) * 20, { fill: null, stroke: '#ff9bb5', width: 3.2 })
                    .at(px, py)
                    .opacity(0.96 * gPrimeVis)
                    .glow(12, '#ff6b8b')
                    .set('blend', 'screen'),
                circle(32, { fill: null, stroke: '#ffd166', width: 1.8 })
                    .at(px, py)
                    .opacity(0.68 * gPrimeVis)
                    .glow(8, '#ffd166')
                    .set('blend', 'screen'),
                dot(9.5, '#ffffff').at(px, py).opacity(gPrimeVis).glow(16, '#ff6b8b').set('blend', 'screen'),
                txt("G'", ptx, pty, 36, '#ffb3c6', 'serif').glow(12, '#ff6b8b').opacity(gPrimeVis),
            )
        }
        return group(...nodes)
    })

    const leftCopy = group(
        txt('The Horizon', -840, -370, 62, '#f8f4ec', 'serif', 'left'),
        txt('of Formal Proof', -840, -300, 62, '#5ce1e6', 'serif', 'left').glow(6, '#38bdf8'),
        txt('Island = Provable in F', -840, -210, 28, '#5ce1e6', 'mono', 'left'),
        txt('Ocean  = True statements', -840, -162, 28, '#ffd166', 'mono', 'left'),
    )

    const beat0Note = group(
        txt('G floats beyond the shore', -840, 315, 32, '#ffd166', 'sans', 'left').glow(5, '#ffd166'),
        txt('True, yet unreachable in F', -840, 365, 28, '#cbd5e8', 'sans', 'left'),
    )

    const beat1Note = group(
        txt('Add G as a new axiom → F + G', -840, 315, 30, '#5ce1e6', 'sans', 'left').glow(5, '#38bdf8'),
        txt("A fresh G' appears past the shore", -840, 365, 28, '#ff9bb5', 'sans', 'left').glow(4, '#ff6b8b'),
    )

    s.add(aura, view3d, liveOverlays, leftCopy, beat0Note)
    c.at(0.1, () => s.play(view3d.orbit({ theta: 0.42, phi: 0.92 }), { duration: 24.0 }))
    c.on('add G as a brand-new axiom', () => {
        s.play(expandProg.to(1, { duration: 4.2, ease: linear }))
    })
    c.swap('add G as a brand-new axiom', beat0Note, beat1Note)
}

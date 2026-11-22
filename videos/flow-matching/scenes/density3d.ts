import {
    circle, curve3d, dynamic, group, line, line3d, point3d, points3d, radialGradient, rect, scene3d, surface, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { TARGET_MODES, lerpPt, manifoldHeight, type Pt2 } from '../math'
import { COSMOS, txt } from '../../../factory/style'

const HALF = 3.2

// 18 draped climbing trajectories gliding smoothly from the Gaussian dome to all 3 mode summits!
const TRAJ_SEEDS: readonly { x0: Pt2; modeIdx: number; color: string; isHero: boolean }[] = [
    // Mode 0 (-1.45, -0.85) — 6 climbing trails
    { x0: [-0.35, -0.25], modeIdx: 0, color: COSMOS.gold, isHero: true },
    { x0: [-0.88, 0.25], modeIdx: 0, color: COSMOS.cyan, isHero: true },
    { x0: [-0.15, -0.95], modeIdx: 0, color: COSMOS.violet, isHero: false },
    { x0: [-1.15, -0.15], modeIdx: 0, color: COSMOS.cyan, isHero: false },
    { x0: [-0.55, -1.25], modeIdx: 0, color: COSMOS.gold, isHero: false },
    { x0: [-0.18, 0.32], modeIdx: 0, color: COSMOS.violet, isHero: false },
    // Mode 1 (1.55, -0.55) — 6 climbing trails
    { x0: [0.45, -0.22], modeIdx: 1, color: COSMOS.gold, isHero: true },
    { x0: [0.78, 0.42], modeIdx: 1, color: COSMOS.cyan, isHero: true },
    { x0: [0.18, -0.82], modeIdx: 1, color: COSMOS.violet, isHero: false },
    { x0: [1.05, 0.22], modeIdx: 1, color: COSMOS.gold, isHero: false },
    { x0: [0.58, -1.12], modeIdx: 1, color: COSMOS.cyan, isHero: false },
    { x0: [0.12, 0.18], modeIdx: 1, color: COSMOS.violet, isHero: false },
    // Mode 2 (0.05, 1.50) — 6 climbing trails
    { x0: [-0.18, 0.58], modeIdx: 2, color: COSMOS.gold, isHero: true },
    { x0: [0.38, 0.68], modeIdx: 2, color: COSMOS.violet, isHero: true },
    { x0: [-0.72, 0.78], modeIdx: 2, color: COSMOS.cyan, isHero: false },
    { x0: [0.82, 0.92], modeIdx: 2, color: COSMOS.cyan, isHero: false },
    { x0: [-0.42, 0.12], modeIdx: 2, color: COSMOS.gold, isHero: false },
    { x0: [0.45, 0.22], modeIdx: 2, color: COSMOS.violet, isHero: false },
]

export const density3d: SceneFunction = (s, c) => {
    const morphT = s.value(0)

    const view3d = scene3d({
        theta: -0.82,
        phi: 1.04,
        distance: 14.4,
        unit: 138,
        perspective: true,
        ambient: 0.38,
        shine: 0.38,
        brightness: 1.12,
        fog: 0.08,
        focus: [0, 0, 0.85],
    }).at(235, 28)

    // Smooth high-res [60, 60] morphing probability density manifold p_t(x, y) — ZERO flat-topped peaks!
    const densitySurface = surface(
        (wx, wy) => manifoldHeight(wx, wy, morphT.value),
        {
            x: [-HALF, HALF],
            y: [-HALF, HALF],
            resolution: [60, 60],
            animate: true,
            colors: ['#060a18', '#191f57', '#552f96', '#1e7fc4', '#5ce1e6', '#ffd166', '#fff7d6'],
            mesh: '#80ecff',
            meshOpacity: 0.14,
            meshWidth: 0.55,
            opacity: 0.9,
        },
    )

    // 18 draped glowing curve3d climbing trajectories (glow: 8, blend: 'screen')!
    const curves = TRAJ_SEEDS.map((tr) => {
        const target = TARGET_MODES[tr.modeIdx]!.mean
        return curve3d(
            (u) => {
                const pos = lerpPt(tr.x0, target, u)
                const z = manifoldHeight(pos[0], pos[1], u) + 0.14
                return [pos[0], pos[1], z] as Vec3
            },
            0,
            1,
            {
                samples: 44,
                color: tr.color,
                width: tr.isHero ? 3.4 : 2.1,
                glow: 8,
                blend: 'screen',
                opacity: tr.isHero ? 0.9 : 0.52,
                onTop: true,
            },
        )
    })

    // Subtle 3D floor reference crosshairs
    const floorLines = [
        line3d([-HALF, 0, 0.02], [HALF, 0, 0.02], { color: '#3a4b78', width: 1.4, opacity: 0.45 }),
        line3d([0, -HALF, 0.02], [0, HALF, 0.02], { color: '#3a4b78', width: 1.4, opacity: 0.45 }),
    ]

    // Glowing summit point3d beacons (glow: 14, blend: 'screen') perched cleanly on each of the 3 summits!
    const summitBeacons = TARGET_MODES.map((mode) =>
        point3d(
            () => {
                const t = morphT.value
                const mx = t * mode.mean[0]
                const my = t * mode.mean[1]
                const mz = manifoldHeight(mx, my, t) + 0.12
                return [mx, my, mz] as Vec3
            },
            {
                color: '#fff7d6',
                radius: 8.5,
                glow: 14,
                blend: 'screen',
                onTop: true,
            },
        ),
    )

    // Reactive glowing particles riding all 18 climbing trails smoothly onto the summits!
    const riders = points3d(
        () => {
            const t = morphT.value
            return TRAJ_SEEDS.map((tr) => {
                const target = TARGET_MODES[tr.modeIdx]!.mean
                const pos = lerpPt(tr.x0, target, t)
                const z = manifoldHeight(pos[0], pos[1], t) + 0.16
                return [pos[0], pos[1], z] as Vec3
            })
        },
        {
            colorAt: (idx) => (TRAJ_SEEDS[idx]!.isHero ? '#ffffff' : TRAJ_SEEDS[idx]!.color),
            radius: 5.5,
            glow: 12,
            blend: 'screen',
            onTop: true,
        },
    )

    view3d.add(densitySurface, ...floorLines, ...curves, ...summitBeacons, riders)

    const aura = circle(560, {
        fill: radialGradient([0, 0], 560, [
            [0, '#5830992c'],
            [0.5, '#2082c918'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(235, 28).set('blend', 'screen')

    const leftCopy = group(
        txt('Probability', -855, -402, 62, COSMOS.ink, 'serif', 'left'),
        txt('Manifold', -855, -330, 62, COSMOS.cyan, 'serif', 'left').glow(6, '#38bdf8'),
        tex(String.raw`p_t(x)`, { size: 50, color: COSMOS.cyan }).at(-512, -330).glow(6, '#38bdf8'),
        txt('Mass flows along the velocity field', -855, 336, 28, COSMOS.muted, 'sans', 'left'),
        txt('into sharp multi-modal summits', -855, 378, 28, COSMOS.gold, 'sans', 'left'),
    )

    const contEq = tex(String.raw`\partial_t p_t + \nabla \cdot (p_t v_t) = 0`, {
        size: 38,
        color: COSMOS.gold,
    }).at(-585, 196).glow(6, COSMOS.gold)

    // Compact live t progress bar + mass-conservation readout filling the middle-left gap cleanly!
    const liveState = dynamic(() => {
        const t = morphT.value
        const phase =
            t < 0.25 ? 'Gaussian Prior  N(0, I)'
                : t < 0.8 ? 'Splitting along Velocity Field'
                    : 'Multi-Modal Data Peaks'
        const col = t < 0.25 ? COSMOS.violet : t < 0.8 ? COSMOS.cyan : COSMOS.gold
        const barW = 450
        const fillW = Math.max(10, barW * t)

        return group(
            txt(`t = ${t.toFixed(2)}`, -855, -214, 68, col, 'mono', 'left').glow(8, col),
            txt(phase, -855, -148, 28, COSMOS.ink, 'sans', 'left'),
            // Live t transport progress bar
            rect(barW, 10, { fill: '#19223d', stroke: '#32426e', width: 1.2, radius: 5 })
                .at(-855 + barW / 2, -96),
            rect(fillW, 10, { fill: col, stroke: null, radius: 5 })
                .at(-855 + fillW / 2, -96)
                .glow(8, col),
            txt('0.0', -855, -62, 26, COSMOS.violet, 'mono', 'left'),
            txt('1.0', -855 + barW, -62, 26, COSMOS.gold, 'mono', 'right'),
            // Exact probability mass conservation readout (integrates to 1.000 at every t!)
            line([-855, -22], [-405, -22], { stroke: '#263457', width: 1.4 }),
            txt('TOTAL PROBABILITY MASS', -855, 14, 26, COSMOS.muted, 'mono', 'left'),
            tex(String.raw`\int p_t(x)\,dx = 1.000`, { size: 32, color: COSMOS.emerald })
                .at(-690, 82)
                .glow(6, COSMOS.emerald),
            line([-855, 134], [-405, 134], { stroke: '#263457', width: 1.4 }),
        )
    })

    s.add(aura, view3d, leftCopy, liveState)
    c.at(0.1, () => {
        s.play(view3d.orbit({ theta: -0.08, phi: 0.88 }), { duration: 24.0 })
    })
    c.show('continuity equation', contEq)
    c.on('continuity equation', () => {
        s.play(morphT.to(1.0, { duration: 9.5 }))
    })
}

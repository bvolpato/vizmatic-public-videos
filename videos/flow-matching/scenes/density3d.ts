import {
    circle, curve3d, dynamic, group, line3d, points3d, radialGradient, scene3d, surface, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { TARGET_MODES, lerpPt, manifoldHeight, type Pt2 } from '../math'
import { COSMOS, txt } from '../../../factory/style'

const HALF = 3.2

// 6 hero particle trajectories gliding from Gaussian dome positions to the 3 mode summits!
const TRAJ_SEEDS: readonly { x0: Pt2; modeIdx: number; color: string }[] = [
    { x0: [-0.45, -0.32], modeIdx: 0, color: COSMOS.gold },
    { x0: [-0.85, 0.28], modeIdx: 0, color: COSMOS.cyan },
    { x0: [0.52, -0.24], modeIdx: 1, color: COSMOS.gold },
    { x0: [0.75, 0.45], modeIdx: 1, color: COSMOS.cyan },
    { x0: [-0.15, 0.65], modeIdx: 2, color: COSMOS.gold },
    { x0: [0.34, 0.72], modeIdx: 2, color: COSMOS.violet },
]

export const density3d: SceneFunction = (s, c) => {
    const morphT = s.value(0)

    const view3d = scene3d({
        theta: -0.82,
        phi: 1.05,
        distance: 14.4,
        unit: 138,
        perspective: true,
        ambient: 0.36,
        shine: 0.34,
        brightness: 1.1,
        fog: 0.1,
        focus: [0, 0, 0.75],
    }).at(230, 30)

    // Live morphing 3D probability density surface p_t(x, y): Gaussian dome -> 3 luminous summits!
    const densitySurface = surface(
        (wx, wy) => manifoldHeight(wx, wy, morphT.value),
        {
            x: [-HALF, HALF],
            y: [-HALF, HALF],
            resolution: [42, 42],
            animate: true,
            colors: ['#070a18', '#1c1f57', '#583099', '#1e7fc4', '#5ce1e6', '#ffd166'],
            mesh: '#80ecff',
            meshOpacity: 0.28,
            meshWidth: 0.75,
            opacity: 0.88,
        },
    )

    // Glowing optimal-transport curve3d trajectories hovering cleanly along the morphing manifold
    const curves = TRAJ_SEEDS.map((tr) => {
        const target = TARGET_MODES[tr.modeIdx]!.mean
        return curve3d(
            (u) => {
                const pos = lerpPt(tr.x0, target, u)
                const z = manifoldHeight(pos[0], pos[1], u) + 0.16
                return [pos[0], pos[1], z] as Vec3
            },
            0,
            1,
            { samples: 40, color: tr.color, width: 3.4, glow: 8, opacity: 0.86, onTop: true },
        )
    })

    // Subtle 3D floor reference crosshairs
    const floorLines = [
        line3d([-HALF, 0, 0.02], [HALF, 0, 0.02], { color: '#3a4b78', width: 1.4, opacity: 0.45 }),
        line3d([0, -HALF, 0.02], [0, HALF, 0.02], { color: '#3a4b78', width: 1.4, opacity: 0.45 }),
    ]

    // Reactive glowing particles riding the 6 curves smoothly onto the summits!
    const riders = points3d(
        () => {
            const t = morphT.value
            return TRAJ_SEEDS.map((tr) => {
                const target = TARGET_MODES[tr.modeIdx]!.mean
                const pos = lerpPt(tr.x0, target, t)
                const z = manifoldHeight(pos[0], pos[1], t) + 0.18
                return [pos[0], pos[1], z] as Vec3
            })
        },
        { color: '#ffffff', radius: 6.5, halo: 0, onTop: true },
    )

    view3d.add(densitySurface, ...floorLines, ...curves, riders)

    const aura = circle(560, {
        fill: radialGradient([0, 0], 560, [
            [0, '#58309928'],
            [0.5, '#2082c914'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(230, 30)

    const leftCopy = group(
        txt('Probability', -855, -395, 62, COSMOS.ink, 'serif', 'left'),
        txt('Manifold pₜ(x)', -855, -322, 62, COSMOS.cyan, 'serif', 'left').glow(6, '#38bdf8'),
        txt('Mass flows along vₜ(x) into', -855, 330, 28, COSMOS.muted, 'sans', 'left'),
        txt('sharp multi-modal summits', -855, 372, 28, COSMOS.gold, 'sans', 'left'),
    )

    const contEq = tex(String.raw`\partial_t p_t + \nabla \cdot (p_t v_t) = 0`, {
        size: 38,
        color: COSMOS.gold,
    }).at(-585, 85).glow(6, COSMOS.gold)

    const liveState = dynamic(() => {
        const t = morphT.value
        const phase =
            t < 0.25 ? 'Gaussian Prior  N(0, I)'
                : t < 0.8 ? 'Splitting along Velocity Field'
                    : 'Multi-Modal Data Peaks'
        const col = t < 0.25 ? COSMOS.violet : t < 0.8 ? COSMOS.cyan : COSMOS.gold
        return group(
            txt(`t = ${t.toFixed(2)}`, -855, -170, 72, col, 'mono', 'left').glow(8, col),
            txt(phase, -855, -96, 28, COSMOS.ink, 'sans', 'left'),
        )
    })

    s.add(aura, view3d, leftCopy, liveState)
    c.at(0.1, () => {
        s.play(view3d.orbit({ theta: -0.06, phi: 0.88 }), { duration: 24.0 })
    })
    c.show('continuity equation', contEq)
    c.on('continuity equation', () => {
        s.play(morphT.to(1.0, { duration: 9.5 }))
    })
}

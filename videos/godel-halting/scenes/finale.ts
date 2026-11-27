import {
    circle, curve3d, group, line3d, linear, point3d, points3d, radialGradient, scene3d, sphere,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// 36 drifting truth-stars orbiting OUTSIDE the astrolabe horizon rings (kept well above the headline band)
const OUTER_TRUTH_STARS: readonly Vec3[] = Array.from({ length: 36 }, (_, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / 36)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    const r = 2.42 + (i % 4) * 0.28
    return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi) * 0.56 + 0.18,
    ]
})

export const finale: SceneFunction = (s, c) => {
    const drift = s.value(0)
    const cy = -194

    const aura = circle(480, {
        fill: radialGradient([0, 0], 480, [
            [0, '#ffd16634'],
            [0.42, '#5ce1e61c'],
            [0.72, '#a78bfa12'],
            [1, '#07091000'],
        ]),
        stroke: null,
    })
        .at(0, cy)
        .set('blend', 'screen')

    // Layered 3D orbital astrolabe horizon emblem
    const astrolabe = scene3d({
        theta: -0.5,
        phi: 1.08,
        distance: 8.6,
        unit: 128,
        perspective: true,
        ambient: 0.44,
        shine: 0.38,
        brightness: 1.12,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(0, cy)

    const coreShell = sphere(0.68, {
        resolution: [56, 32],
        color: '#1c3568',
        opacity: 0.24,
        mesh: '#5ce1e6',
        meshOpacity: 0.14,
        meshWidth: 0.5,
    })

    const ringInner = curve3d(
        (u, t) => {
            const a = u + t * 0.32
            return [1.15 * Math.cos(a), 1.15 * Math.sin(a), 0]
        },
        0,
        Math.PI * 2,
        { samples: 108, color: '#5ce1e6', width: 3.4, glow: 10, blend: 'screen', opacity: 0.94, animate: true },
    )

    const ringTiltA = curve3d(
        (u, t) => {
            const a = u - t * 0.24
            const tilt = 0.72
            return [1.56 * Math.cos(a), 1.56 * Math.sin(a) * Math.cos(tilt), 1.56 * Math.sin(a) * Math.sin(tilt)]
        },
        0,
        Math.PI * 2,
        { samples: 112, color: '#60a5fa', width: 3.0, glow: 10, blend: 'screen', opacity: 0.88, animate: true },
    )

    const ringTiltB = curve3d(
        (u, t) => {
            const a = u + t * 0.19
            const tilt = -0.96
            return [
                1.86 * Math.cos(a) * Math.cos(tilt),
                1.86 * Math.sin(a),
                1.86 * Math.cos(a) * Math.sin(tilt),
            ]
        },
        0,
        Math.PI * 2,
        { samples: 116, color: '#a78bfa', width: 3.2, glow: 10, blend: 'screen', opacity: 0.88, animate: true },
    )

    const ringHorizon = curve3d(
        (u, t) => {
            const a = u + t * 0.12
            const tilt = 0.34
            return [2.14 * Math.cos(a), 2.14 * Math.sin(a) * Math.cos(tilt), 2.14 * Math.sin(a) * Math.sin(tilt)]
        },
        0,
        Math.PI * 2,
        {
            samples: 128,
            colors: ['#ffd166', '#ff8fab', '#5ce1e6', '#ffd166'],
            width: 4.0,
            glow: 12,
            blend: 'screen',
            opacity: 0.96,
            animate: true,
        },
    )

    astrolabe.add(
        coreShell,
        ringInner,
        ringTiltA,
        ringTiltB,
        ringHorizon,
        // Diagonal self-reference paradox beam slicing cleanly through the astrolabe
        line3d([-1.95, -1.35, -0.75], [1.95, 1.35, 0.75], {
            colors: ['#5ce1e6', '#ff6b8b', '#ffd166'],
            width: 3.6,
            glow: 12,
            blend: 'screen',
            opacity: 0.9,
        }),
        // Orbiting beacons riding the outer horizon rings
        point3d(
            () => {
                const a = drift.value * 0.85
                return [2.14 * Math.cos(a), 2.14 * Math.sin(a) * Math.cos(0.34), 2.14 * Math.sin(a) * Math.sin(0.34)]
            },
            { color: '#ff8fab', radius: 7.5, glow: 14, blend: 'screen', onTop: true },
        ),
        point3d(
            () => {
                const a = -drift.value * 0.68 + 2.1
                return [1.86 * Math.cos(a) * Math.cos(-0.96), 1.86 * Math.sin(a), 1.86 * Math.cos(a) * Math.sin(-0.96)]
            },
            { color: '#ffd166', radius: 6.5, glow: 12, blend: 'screen', onTop: true },
        ),
        // Drifting unprovable truth-stars orbiting outside the astrolabe boundary
        points3d(
            () => {
                const d = drift.value * 0.22
                const cd = Math.cos(d)
                const sd = Math.sin(d)
                return OUTER_TRUTH_STARS.map(([x, y, z]) => [x * cd - y * sd, x * sd + y * cd, z] as Vec3)
            },
            {
                radius: 4.0,
                glow: 10,
                blend: 'screen',
                opacity: 0.88,
                colorAt: (i) => (i % 4 === 0 ? '#ffd166' : i % 3 === 0 ? '#ff8fab' : i % 2 === 0 ? '#5ce1e6' : '#c4b5fd'),
            },
        ),
        point3d([0, 0, 0], { color: '#ffffff', radius: 9, glow: 16, blend: 'screen', onTop: true }),
    )

    const headline = group(
        txt('Truth is always larger than proof.', 0, 148, 70, '#f8f4ec', 'serif').glow(8, '#ffd166'),
        txt('Every consistent formal system and AI inherits the horizon.', 0, 232, 34, '#5ce1e6', 'sans'),
        txt('Kurt Gödel (1931)  ·  Alan Turing (1936)', 0, 318, 28, '#a8b8d8', 'mono'),
    )

    s.add(aura, astrolabe, headline)
    c.at(0.05, () => s.play(drift.to(6.2, { duration: 16.0, ease: linear })))
    c.at(0.06, () => s.play(astrolabe.orbit({ theta: 0.95, phi: 0.94 }), { duration: 16.0 }))
}

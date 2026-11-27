import {
    circle, curve3d, line3d, linear, par, parametricSurface, point3d, radialGradient, scene3d,
    type IntroFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

// Bottom-Anchored Theatrical Poster: soaring 3D Tensor Triangle + CAT(0) Tripod Crystal above,
// monumental centered title + blazing omega = 9/4 jewel below (distinct from both neighbors!).
const R = 3.15
const V_A: Vec3 = [R * Math.cos(Math.PI / 6), R * Math.sin(Math.PI / 6), -0.45]
const V_B: Vec3 = [R * Math.cos((5 * Math.PI) / 6), R * Math.sin((5 * Math.PI) / 6), -0.45]
const V_C: Vec3 = [0, -R, -0.45]
const HUB: Vec3 = [0, 0, 2.35]

function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

export const intro: IntroFunction = (stage, clock) => {
    const pulse = stage.value(0.28)

    const crystal = scene3d({
        theta: -0.62,
        phi: 1.06,
        distance: 14.8,
        unit: 108,
        perspective: true,
        ambient: 0.44,
        shine: 0.42,
        brightness: 1.15,
        fog: 0.08,
        focus: [0, -0.1, 0.72],
    }).at(0, -195)

    // Translucent crystal pyramid faces connecting the three sites (A, B, C) up to the shared hub
    const faceOpts = { resolution: [1, 1] as const, mesh: false as const, shaded: true }
    crystal.add(
        parametricSurface(
            (u, v): Vec3 => lerp3(lerp3(V_A, V_B, u), V_C, v),
            [0, 1],
            [0, 1],
            { ...faceOpts, color: '#1b2b59', opacity: 0.48 },
        ),
        parametricSurface(
            (u, v): Vec3 => lerp3(lerp3(V_A, V_B, u), HUB, v),
            [0, 1],
            [0, 1],
            { ...faceOpts, color: '#274c8c', opacity: 0.24 },
        ),
        parametricSurface(
            (u, v): Vec3 => lerp3(lerp3(V_B, V_C, u), HUB, v),
            [0, 1],
            [0, 1],
            { ...faceOpts, color: '#4c2f8a', opacity: 0.24 },
        ),
        parametricSurface(
            (u, v): Vec3 => lerp3(lerp3(V_C, V_A, u), HUB, v),
            [0, 1],
            [0, 1],
            { ...faceOpts, color: '#1f5c78', opacity: 0.24 },
        ),
        // Equatorial orbital ring framing the tripod crystal
        curve3d(
            (t): Vec3 => {
                const ang = t * Math.PI * 2
                return [Math.cos(ang) * 3.45, Math.sin(ang) * 3.45, 0.35 + Math.sin(ang * 3) * 0.14]
            },
            0,
            1,
            { color: COSMOS.cyan, width: 2.2, opacity: 0.55, glow: 8, blend: 'screen', samples: 120 },
        ),
        // Three perimeter index wires (i, j, k) forming the matrix multiplication triangle
        line3d(V_A, V_B, { color: COSMOS.cyan, width: 4.4, glow: 12, blend: 'screen', opacity: 0.96 }),
        line3d(V_B, V_C, { color: COSMOS.violet, width: 4.4, glow: 12, blend: 'screen', opacity: 0.96 }),
        line3d(V_C, V_A, { color: COSMOS.blue, width: 4.4, glow: 12, blend: 'screen', opacity: 0.96 }),
        // Blazing golden CAT(0) tripod arms meeting at the shared-label hub
        line3d(V_A, HUB, { color: COSMOS.gold, width: 5.4, glow: 16, blend: 'screen', opacity: 1 }),
        line3d(V_B, HUB, { color: COSMOS.gold, width: 5.4, glow: 16, blend: 'screen', opacity: 1 }),
        line3d(V_C, HUB, { color: COSMOS.gold, width: 5.4, glow: 16, blend: 'screen', opacity: 1 }),
        // Site beacons & blazing central hub star
        point3d(V_A, { color: COSMOS.cyan, radius: 9, glow: 16, blend: 'screen' }),
        point3d(V_B, { color: COSMOS.violet, radius: 9, glow: 16, blend: 'screen' }),
        point3d(V_C, { color: COSMOS.blue, radius: 9, glow: 16, blend: 'screen' }),
        point3d(HUB, { color: '#ffffff', radius: 12, glow: 22, blend: 'screen' }),
        // Streaming photons racing up the tripod arms
        point3d((): Vec3 => lerp3(V_A, HUB, pulse.value % 1), { color: '#ffffff', radius: 6.5, glow: 14, blend: 'screen' }),
        point3d((): Vec3 => lerp3(V_B, HUB, (pulse.value + 0.33) % 1), { color: COSMOS.gold, radius: 6.5, glow: 14, blend: 'screen' }),
        point3d((): Vec3 => lerp3(V_C, HUB, (pulse.value + 0.66) % 1), { color: COSMOS.cyan, radius: 6.5, glow: 14, blend: 'screen' }),
    )

    stage.add(
        circle(620, {
            fill: radialGradient([0, 0], 620, [
                [0, '#ffd1662c'],
                [0.42, '#4c2f8a22'],
                [0.72, '#1d4ed814'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(0, -155).set('blend', 'screen'),
        crystal,
        txt('OPENAI MATH  ·  FAMILY 379  ·  LEAN 4', 0, 198, 26, COSMOS.gold, 'mono'),
        txt('Matrix Multiplication', 0, 276, 92, COSMOS.ink, 'serif').glow(6, '#60a5fa'),
        txt('Why ω = 9/4', 0, 372, 106, COSMOS.gold, 'serif').glow(12, COSMOS.gold),
        txt('The 57-year race to O(n²) is over — and what it means for AI', 0, 454, 30, '#cbd5e8', 'sans'),
    )

    const dur = Math.max(0.4, clock.intro - 0.08)
    stage.at(0.02, () => {
        stage.play(par(
            crystal.orbit({ theta: -0.32, phi: 0.98 }, { duration: dur }),
            pulse.to(1.25, { duration: dur, ease: linear }),
        ))
    })
}

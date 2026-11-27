import {
    circle, curve3d, dynamic, group, line3d, linear, par, point3d, radialGradient, scene3d, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const R = 2.75
const V_A: Vec3 = [R * Math.cos(Math.PI / 6), R * Math.sin(Math.PI / 6), -0.4]
const V_B: Vec3 = [R * Math.cos((5 * Math.PI) / 6), R * Math.sin((5 * Math.PI) / 6), -0.4]
const V_C: Vec3 = [0, -R, -0.4]
const HUB: Vec3 = [0, 0, 2.25]

function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

export const finale: SceneFunction = (s, c) => {
    const pulse = s.value(0)
    const ringSpin = s.value(0)

    const emblem = scene3d({
        theta: -0.6,
        phi: 1.0,
        distance: 14.5,
        unit: 112,
        perspective: true,
        ambient: 0.44,
        shine: 0.42,
        brightness: 1.15,
        fog: 0.08,
        focus: [0, 0, 0.55],
    }).at(0, -68)

    emblem.add(
        curve3d(
            (t): Vec3 => {
                const ang = t * Math.PI * 2
                return [Math.cos(ang) * 3.55, Math.sin(ang) * 3.55, 0.35]
            },
            0,
            1,
            { color: COSMOS.cyan, width: 2.2, opacity: 0.55, glow: 8, blend: 'screen', samples: 120 },
        ),
        curve3d(
            (t): Vec3 => {
                const ang = t * Math.PI * 2
                return [Math.cos(ang) * 3.1, Math.sin(ang) * 1.4, 0.75 + Math.sin(ang) * 2.2]
            },
            0,
            1,
            { color: COSMOS.violet, width: 1.8, opacity: 0.45, glow: 8, blend: 'screen', samples: 120 },
        ),
        line3d(V_A, V_B, { color: COSMOS.cyan, width: 4.2, glow: 12, blend: 'screen', opacity: 0.94 }),
        line3d(V_B, V_C, { color: COSMOS.violet, width: 4.2, glow: 12, blend: 'screen', opacity: 0.94 }),
        line3d(V_C, V_A, { color: COSMOS.blue, width: 4.2, glow: 12, blend: 'screen', opacity: 0.94 }),
        line3d(V_A, HUB, { color: COSMOS.gold, width: 5.4, glow: 16, blend: 'screen', opacity: 1 }),
        line3d(V_B, HUB, { color: COSMOS.gold, width: 5.4, glow: 16, blend: 'screen', opacity: 1 }),
        line3d(V_C, HUB, { color: COSMOS.gold, width: 5.4, glow: 16, blend: 'screen', opacity: 1 }),
        point3d(V_A, { color: COSMOS.cyan, radius: 8.5, glow: 14, blend: 'screen' }),
        point3d(V_B, { color: COSMOS.violet, radius: 8.5, glow: 14, blend: 'screen' }),
        point3d(V_C, { color: COSMOS.blue, radius: 8.5, glow: 14, blend: 'screen' }),
        point3d(HUB, { color: '#ffffff', radius: 12, glow: 24, blend: 'screen' }),
        point3d((): Vec3 => lerp3(V_A, HUB, pulse.value % 1), { color: '#ffffff', radius: 6, glow: 14, blend: 'screen' }),
        point3d((): Vec3 => lerp3(V_B, HUB, (pulse.value + 0.33) % 1), { color: COSMOS.gold, radius: 6, glow: 14, blend: 'screen' }),
        point3d((): Vec3 => lerp3(V_C, HUB, (pulse.value + 0.66) % 1), { color: COSMOS.cyan, radius: 6, glow: 14, blend: 'screen' }),
    )

    // Subtle breathing radial halo behind the 3D crystal (cleanly clear of flanking text!)
    const liveHalo = dynamic(() => {
        const p = (ringSpin.value % 1)
        const rad = 220 + p * 75
        return group(
            circle(rad, { fill: null, stroke: COSMOS.gold, width: 2.0 })
                .at(0, -68).opacity((1 - p) * 0.38).glow(10, COSMOS.gold).set('blend', 'screen'),
        )
    })

    const summary = group(
        // Left flanking stat (cleanly clear of center crystal!)
        tex(String.raw`\omega = \frac{9}{4}`, { size: 74, color: COSMOS.gold }).at(-615, -138).glow(10, COSMOS.gold),
        txt('SQUARE EXPONENT  (2.25)', -615, 6, 26, COSMOS.gold, 'mono'),
        txt('Exact over every field', -615, 52, 28, COSMOS.muted, 'sans'),

        // Right flanking stat (cleanly clear of center crystal!)
        tex(String.raw`\alpha = \frac{1}{2}`, { size: 74, color: COSMOS.emerald }).at(615, -138).glow(10, COSMOS.emerald),
        txt('DUAL EXPONENT  (n × √n)', 615, 6, 26, COSMOS.emerald, 'mono'),
        txt('Quadratic free zone', 615, 52, 28, COSMOS.muted, 'sans'),

        // Crisp centered finale takeaway below
        txt('OPENAI MATH · FAMILY 379 · LEAN 4 FORMALIZED', 0, 316, 26, COSMOS.cyan, 'mono'),
        txt('Audit the formal definitions — and build AI beyond dense matmuls.', 0, 386, 36, COSMOS.ink, 'serif')
            .glow(6, COSMOS.gold),
    )

    s.add(
        circle(620, {
            fill: radialGradient([0, 0], 620, [
                [0, '#ffd16626'],
                [0.45, '#4c2f8a18'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(0, -68).set('blend', 'screen'),
        liveHalo,
        emblem,
        summary,
    )

    const dur = Math.max(4.0, c.end - c.start - 0.3)
    c.at(0.1, () => {
        s.play(par(
            emblem.orbit({ theta: 0.45, phi: 0.9 }, { duration: dur }),
            pulse.to(3.2, { duration: dur, ease: linear }),
            ringSpin.to(2.4, { duration: dur, ease: linear }),
        ))
    })
}

import {
    circle, curve3d, dynamic, group, line3d, linear, par, parametricSurface, point3d, scene3d, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const R_OUT = 3.05
const R_IN = 1.40
const TILT = 0.56 // Graceful inclination that stays open across the whole camera orbit
const YAW = 0.72 // Rotates ascending node so the rose orbit never pinches edge-on

export const finale: SceneFunction = (s, c) => {
    const pulse = s.value(0)
    const haloSpin = s.value(0)

    const emblem = scene3d({
        theta: -0.62,
        phi: 1.0,
        distance: 15.2,
        unit: 108,
        perspective: true,
        ambient: 0.44,
        shine: 0.42,
        brightness: 1.15,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(0, -68)

    // Orbiting 3D Complexity Sphere with high-res smooth shell + exact constant-radius great circles!
    const cosT = Math.cos(TILT)
    const sinT = Math.sin(TILT)
    const cosY = Math.cos(YAW)
    const sinY = Math.sin(YAW)
    const roseOrbitPoint = (a: number): Vec3 => {
        const x0 = R_OUT * Math.cos(a)
        const y0 = R_OUT * Math.sin(a) * cosT
        const z0 = R_OUT * Math.sin(a) * sinT
        return [x0 * cosY - y0 * sinY, x0 * sinY + y0 * cosY, z0]
    }

    emblem.add(
        // Silky-smooth closed-pole inner cyan P core sphere (64x36 prevents faceted silhouette)
        parametricSurface(
            (u, v): Vec3 => {
                const th = u * Math.PI * 2
                const ph = v * Math.PI
                return [R_IN * Math.sin(ph) * Math.cos(th), R_IN * Math.sin(ph) * Math.sin(th), R_IN * Math.cos(ph)]
            },
            [0, 1],
            [0, 1],
            { resolution: [64, 36], color: COSMOS.cyan, opacity: 0.34, mesh: '#7ce8ff', meshOpacity: 0.1, meshWidth: 0.45 },
        ),
        // Inner cyan P equatorial ring hugging R_IN + 0.03
        curve3d(
            (t): Vec3 => [Math.cos(t * Math.PI * 2) * (R_IN + 0.03), Math.sin(t * Math.PI * 2) * (R_IN + 0.03), 0],
            0,
            1,
            { color: COSMOS.cyan, width: 3.8, glow: 14, blend: 'screen', samples: 240 },
        ),
        // Outer violet NP equatorial great circle (exact radius R_OUT)
        curve3d(
            (t): Vec3 => [Math.cos(t * Math.PI * 2) * R_OUT, Math.sin(t * Math.PI * 2) * R_OUT, 0],
            0,
            1,
            { color: COSMOS.violet, width: 3.0, glow: 12, blend: 'screen', samples: 240 },
        ),
        // Exact yawed + tilted rose great circle (stays open and smooth across the entire orbit)
        curve3d(
            (t): Vec3 => roseOrbitPoint(t * Math.PI * 2),
            0,
            1,
            { color: COSMOS.rose, width: 2.5, opacity: 0.78, glow: 10, blend: 'screen', samples: 240 },
        ),
        // Central golden axis spanning north to south pole of R_OUT
        line3d([0, 0, -R_OUT], [0, 0, R_OUT], { color: COSMOS.gold, width: 4.5, glow: 16, blend: 'screen' }),
        point3d([0, 0, 0], { color: COSMOS.cyan, radius: 10, glow: 18, blend: 'screen' }),
        point3d([0, 0, R_OUT], { color: '#ffffff', radius: 11.5, glow: 24, blend: 'screen' }),
        point3d([0, 0, -R_OUT], { color: COSMOS.gold, radius: 8.5, glow: 16, blend: 'screen' }),
        point3d((): Vec3 => {
            const ang = pulse.value * Math.PI * 2
            return [Math.cos(ang) * R_OUT, Math.sin(ang) * R_OUT, 0]
        }, { color: COSMOS.gold, radius: 7.5, glow: 16, blend: 'screen' }),
        point3d((): Vec3 => {
            const ang = -pulse.value * Math.PI * 2.4
            return [Math.cos(ang) * (R_IN + 0.03), Math.sin(ang) * (R_IN + 0.03), 0]
        }, { color: '#ffffff', radius: 6.5, glow: 14, blend: 'screen' }),
        point3d((): Vec3 => roseOrbitPoint(pulse.value * Math.PI * 1.6 + 1.1), {
            color: COSMOS.rose, radius: 6.5, glow: 14, blend: 'screen',
        }),
    )

    // Smooth thin vector ripple ring (zero 8-bit radial-gradient banding!)
    const liveHalo = dynamic(() => {
        const p = haloSpin.value % 1
        const rad = 220 + p * 115
        const fade = Math.sin(p * Math.PI) * 0.34
        if (fade < 0.01) return []
        return group(
            circle(rad, {
                fill: null,
                stroke: COSMOS.gold,
                width: 1.4,
            }).at(0, -68).glow(10, COSMOS.gold).opacity(fade).set('blend', 'screen'),
        )
    })

    const summary = group(
        // Left flanking stat
        tex(String.raw`\mathsf{P} \stackrel{?}{=} \mathsf{NP}`, { size: 68, color: COSMOS.gold }).at(-615, -120),
        txt('$1,000,000  PRIZE', -615, 14, 27, COSMOS.gold, 'mono'),
        txt('Unsolved for 55 years', -615, 62, 28, COSMOS.muted, 'sans'),

        // Right flanking stat
        txt('42,500+ PRs', 615, -120, 58, COSMOS.emerald, 'mono'),
        txt('PEQUALNP.COM', 615, 14, 27, COSMOS.emerald, 'mono'),
        txt('Checked by Lean 4', 615, 62, 28, COSMOS.muted, 'sans'),

        // One crisp closing sentence
        txt('Whether P = NP or P ≠ NP, how we attack our hardest problems just changed forever.', 0, 344, 36, COSMOS.ink, 'serif'),
    )

    s.add(
        liveHalo,
        emblem,
        summary,
    )

    const dur = Math.max(4.0, c.end - c.start - 0.3)
    c.at(0.1, () => {
        s.play(par(
            emblem.orbit({ theta: 0.45, phi: 0.9 }, { duration: dur }),
            pulse.to(3.0, { duration: dur, ease: linear }),
            haloSpin.to(2.2, { duration: dur, ease: linear }),
        ))
    })
}

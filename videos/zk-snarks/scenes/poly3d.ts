import {
    circle, curve3d, dot, dynamic, group, line3d, point3d, radialGradient, scene3d, surface, tex,
    type SceneFunction,
} from 'vizmatic/stage'
import {
    CHALLENGE_FORGED_Z, CHALLENGE_HONEST_Z, CHALLENGE_RX, CHALLENGE_RY,
    forgedPoly3D, honestPoly3D,
} from '../math'
import { txt } from '../../../factory/style'

const RANGE = 2.55

export const poly3d: SceneFunction = (s, c) => {
    const beamProg = s.value(0)
    const gapReveal = s.value(0)

    const aura = circle(640, {
        fill: radialGradient([0, 0], 640, [
            [0, '#5ce1e61c'],
            [0.45, '#ff6b8b14'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(200, 20)

    const view3d = scene3d({
        theta: -0.82,
        phi: 1.04,
        distance: 14.5,
        unit: 132,
        perspective: true,
        ambient: 0.38,
        shine: 0.32,
        brightness: 1.08,
        fog: 0.1,
        focus: [0, 0, 0.45],
    }).at(200, 30)

    // Honest polynomial surface P(x, y) in glowing cyan
    const honestSurf = surface((x, y) => honestPoly3D(x, y), {
        x: [-RANGE, RANGE],
        y: [-RANGE, RANGE],
        resolution: [38, 38],
        colors: ['#0a2540', '#0e5a78', '#22b8cf', '#5ce1e6'],
        mesh: '#7ce8ff',
        meshOpacity: 0.3,
        meshWidth: 0.8,
        opacity: 0.78,
    })

    // Forged polynomial surface Q(x, y) (1-bit lie) in glowing rose
    const forgedSurf = surface((x, y) => forgedPoly3D(x, y), {
        x: [-RANGE, RANGE],
        y: [-RANGE, RANGE],
        resolution: [38, 38],
        colors: ['#3b071e', '#881337', '#e11d48', '#ff6b8b'],
        mesh: '#fda4af',
        meshOpacity: 0.28,
        meshWidth: 0.75,
        opacity: 0.7,
    })

    // Exact razor-thin intersection hyperbola x^2 - y^2 = 0.55 (both branches!)
    const posBranch = curve3d(
        (u) => {
            const x = Math.sqrt(0.55 + u * u)
            return [x, u, honestPoly3D(x, u) + 0.03]
        },
        -2.2,
        2.2,
        { color: '#ffffff', width: 4.5, glow: 10, opacity: 0.96, samples: 80, bias: 0.06 },
    )
    const negBranch = curve3d(
        (u) => {
            const x = -Math.sqrt(0.55 + u * u)
            return [x, u, honestPoly3D(x, u) + 0.03]
        },
        -2.2,
        2.2,
        { color: '#ffffff', width: 4.5, glow: 10, opacity: 0.96, samples: 80, bias: 0.06 },
    )

    // Subtle glowing base frame
    const baseFrame = [
        line3d([-RANGE, -RANGE, -0.9], [RANGE, -RANGE, -0.9], { color: '#334266', width: 1.4, opacity: 0.5 }),
        line3d([RANGE, -RANGE, -0.9], [RANGE, RANGE, -0.9], { color: '#334266', width: 1.4, opacity: 0.5 }),
        line3d([RANGE, RANGE, -0.9], [-RANGE, RANGE, -0.9], { color: '#334266', width: 1.4, opacity: 0.5 }),
        line3d([-RANGE, RANGE, -0.9], [-RANGE, -RANGE, -0.9], { color: '#334266', width: 1.4, opacity: 0.5 }),
    ]

    // Reactive random golden verifier challenge beam piercing both surfaces at (r_x, r_y)
    const zTop = 2.6
    const zBot = -0.9
    const beamLaser = line3d(
        () => [CHALLENGE_RX, CHALLENGE_RY, zTop],
        () => [CHALLENGE_RX, CHALLENGE_RY, zTop - beamProg.value * (zTop - zBot)],
        { color: '#ffd166', width: 6, glow: 12, opacity: 0.98, onTop: true },
    )
    const gapBar = line3d(
        () => [CHALLENGE_RX, CHALLENGE_RY, CHALLENGE_HONEST_Z],
        () => [
            CHALLENGE_RX,
            CHALLENGE_RY,
            CHALLENGE_HONEST_Z + gapReveal.value * (CHALLENGE_FORGED_Z - CHALLENGE_HONEST_Z),
        ],
        { color: '#ffffff', width: 8.5, glow: 14, opacity: 1, onTop: true },
    )
    const hitHonest = point3d(
        () => [CHALLENGE_RX, CHALLENGE_RY, CHALLENGE_HONEST_Z],
        { color: '#5ce1e6', radius: 9.5, halo: 0, onTop: true },
    )
    const hitForged = point3d(
        () => [CHALLENGE_RX, CHALLENGE_RY, CHALLENGE_FORGED_Z],
        { color: '#ff6b8b', radius: 9.5, halo: 0, onTop: true },
    )

    view3d.add(honestSurf, forgedSurf, posBranch, negBranch, ...baseFrame)

    const leftCopy = group(
        txt('SCHWARTZ-ZIPPEL LEMMA', -850, -385, 26, '#ffd166', 'mono', 'left'),
        txt('Honest vs.', -855, -295, 68, '#f8f4ec', 'serif', 'left'),
        txt('Forged in 3D', -855, -218, 68, '#5ce1e6', 'serif', 'left').glow(6, '#38bdf8'),
        dot(9, '#5ce1e6').at(-838, -110).glow(8, '#5ce1e6'),
        txt('P(x, y)  Honest proof', -810, -110, 30, '#5ce1e6', 'sans', 'left'),
        dot(9, '#ff6b8b').at(-838, -52).glow(8, '#ff6b8b'),
        txt('Q(x, y)  1-bit forgery', -810, -52, 30, '#ff6b8b', 'sans', 'left'),
        dot(9, '#ffffff').at(-838, 6).glow(8, '#ffffff'),
        txt('Intersection curve only', -810, 6, 28, '#cbd5e8', 'sans', 'left'),
    )

    const boundEq = group(
        tex(String.raw`\Pr[P(r) = Q(r)] \le \frac{d}{|\mathbb{F}|}`, { size: 44, color: '#ffd166' }).at(-655, 165).glow(6, '#ffd166'),
        txt('One random point catches the lie', -850, 265, 30, '#f8f4ec', 'sans', 'left'),
        txt('Gap exposed instantly at (rₓ, rᵧ)', -850, 315, 28, '#ffd166', 'mono', 'left'),
    )

    const gapBadge = dynamic(() => {
        if (gapReveal.value < 0.05) return []
        const a = gapReveal.value
        return group(
            txt('P(r) ≠ Q(r)  ·  CAUGHT!', 575, -355, 32, '#ffd166', 'mono').opacity(a).glow(10, '#ffd166'),
        )
    })

    s.add(aura, view3d, leftCopy, gapBadge)
    const orbitDur = Math.max(15.5, c.end - c.start - 0.5)
    c.at(0.1, () => {
        s.play(view3d.orbit({ theta: 0.45, phi: 0.92 }), { duration: orbitDur })
    })
    c.show('razor-thin curves', boundEq)
    c.on('random golden challenge', () => {
        view3d.add(beamLaser, hitHonest, hitForged, gapBar)
        s.play(beamProg.to(1, { duration: 1.1 }))
    })
    c.on('exposing the gap', () => {
        s.play(gapReveal.to(1, { duration: 0.8 }))
    })
}

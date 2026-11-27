import {
    circle, curve3d, dot, dynamic, gridPlane3d, group, label3d, line3d, point3d, radialGradient,
    rect, scene3d, surface, tex, type SceneFunction,
} from 'vizmatic/stage'
import {
    CHALLENGE_FORGED_Z, CHALLENGE_HONEST_Z, CHALLENGE_RX, CHALLENGE_RY,
    forgedPoly3D, honestPoly3D,
} from '../math'
import { txt } from '../../../factory/style'

const RANGE = 2.55
const FLOOR_Z = -0.95

export const poly3d: SceneFunction = (s, c) => {
    const beamProg = s.value(0)
    const gapReveal = s.value(0)

    const aura = circle(650, {
        fill: radialGradient([0, 0], 650, [
            [0, '#5ce1e620'],
            [0.45, '#ff6b8b16'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(205, 25)

    const view3d = scene3d({
        theta: -0.82,
        phi: 1.04,
        distance: 14.5,
        unit: 132,
        perspective: true,
        ambient: 0.4,
        shine: 0.34,
        brightness: 1.1,
        fog: 0.09,
        focus: [0, 0, 0.4],
    }).at(205, 32)

    // Visible 3D coordinate grid floor + glowing perimeter frame
    const floorGrid = gridPlane3d({
        x: [-RANGE, RANGE],
        y: [-RANGE, RANGE],
        z: FLOOR_Z,
        step: 0.85,
        color: '#4a6294',
        width: 1.25,
        opacity: 0.58,
    })

    const baseFrame = [
        line3d([-RANGE, -RANGE, FLOOR_Z], [RANGE, -RANGE, FLOOR_Z], { color: '#5ce1e6', width: 1.8, opacity: 0.55 }),
        line3d([RANGE, -RANGE, FLOOR_Z], [RANGE, RANGE, FLOOR_Z], { color: '#5ce1e6', width: 1.8, opacity: 0.55 }),
        line3d([RANGE, RANGE, FLOOR_Z], [-RANGE, RANGE, FLOOR_Z], { color: '#5ce1e6', width: 1.8, opacity: 0.55 }),
        line3d([-RANGE, RANGE, FLOOR_Z], [-RANGE, -RANGE, FLOOR_Z], { color: '#5ce1e6', width: 1.8, opacity: 0.55 }),
    ]

    // Smoothly subdivided [52, 52] Honest polynomial surface P(x, y) in glowing cyan
    const honestSurf = surface((x, y) => honestPoly3D(x, y), {
        x: [-RANGE, RANGE],
        y: [-RANGE, RANGE],
        resolution: [52, 52],
        colors: ['#0a2540', '#0e5a78', '#22b8cf', '#5ce1e6'],
        mesh: '#7ce8ff',
        meshOpacity: 0.24,
        meshWidth: 0.65,
        opacity: 0.78,
    })

    // Smoothly subdivided [52, 52] Forged polynomial surface Q(x, y) (1-bit lie) in glowing rose
    const forgedSurf = surface((x, y) => forgedPoly3D(x, y), {
        x: [-RANGE, RANGE],
        y: [-RANGE, RANGE],
        resolution: [52, 52],
        colors: ['#3b071e', '#881337', '#e11d48', '#ff6b8b'],
        mesh: '#fda4af',
        meshOpacity: 0.24,
        meshWidth: 0.65,
        opacity: 0.72,
    })

    // Exact razor-thin intersection hyperbola x^2 - y^2 = 0.55 (both branches, additive screen glow!)
    const posBranch = curve3d(
        (u) => {
            const x = Math.sqrt(0.55 + u * u)
            return [x, u, honestPoly3D(x, u) + 0.03]
        },
        -2.2,
        2.2,
        { color: '#ffffff', width: 4.5, glow: 10, blend: 'screen', opacity: 0.96, samples: 88, bias: 0.06 },
    )
    const negBranch = curve3d(
        (u) => {
            const x = -Math.sqrt(0.55 + u * u)
            return [x, u, honestPoly3D(x, u) + 0.03]
        },
        -2.2,
        2.2,
        { color: '#ffffff', width: 4.5, glow: 10, blend: 'screen', opacity: 0.96, samples: 88, bias: 0.06 },
    )

    // Glowing (r_x, r_y) crosshair projected onto the 3D coordinate grid floor!
    const crossX = line3d([-RANGE, CHALLENGE_RY, FLOOR_Z + 0.02], [RANGE, CHALLENGE_RY, FLOOR_Z + 0.02], {
        color: '#ffd166',
        width: 2.6,
        glow: 8,
        blend: 'screen',
        opacity: 0.85,
    })
    const crossY = line3d([CHALLENGE_RX, -RANGE, FLOOR_Z + 0.02], [CHALLENGE_RX, RANGE, FLOOR_Z + 0.02], {
        color: '#ffd166',
        width: 2.6,
        glow: 8,
        blend: 'screen',
        opacity: 0.85,
    })
    const crossRing = curve3d(
        (t) => [CHALLENGE_RX + Math.cos(t) * 0.38, CHALLENGE_RY + Math.sin(t) * 0.38, FLOOR_Z + 0.03],
        0,
        Math.PI * 2,
        { color: '#ffd166', width: 3.2, glow: 10, blend: 'screen', opacity: 0.95, samples: 48 },
    )
    const crossDot = point3d([CHALLENGE_RX, CHALLENGE_RY, FLOOR_Z + 0.04], {
        color: '#ffd166',
        radius: 7,
        glow: 12,
        blend: 'screen',
        onTop: true,
    })
    const pill3d = (label: string, w: number, col: string) =>
        group(
            rect(w, 38, { fill: '#0b1020', stroke: col, width: 2.0, radius: 19 }),
            txt(label, 0, 2, 26, col, 'mono'),
        )

    const crossLabel = label3d(pill3d('(rₓ, rᵧ)', 124, '#ffd166'), [CHALLENGE_RX, CHALLENGE_RY, FLOOR_Z + 0.05], {
        offset: [78, 28],
    })

    // Reactive random golden verifier challenge beam piercing both surfaces at (r_x, r_y)
    const zTop = 2.65
    const beamLaser = line3d(
        () => [CHALLENGE_RX, CHALLENGE_RY, zTop],
        () => [CHALLENGE_RX, CHALLENGE_RY, zTop - beamProg.value * (zTop - FLOOR_Z)],
        { color: '#ffd166', width: 6.5, glow: 12, blend: 'screen', opacity: 0.98, onTop: true },
    )
    const gapBar = line3d(
        () => [CHALLENGE_RX, CHALLENGE_RY, CHALLENGE_HONEST_Z],
        () => [
            CHALLENGE_RX,
            CHALLENGE_RY,
            CHALLENGE_HONEST_Z + gapReveal.value * (CHALLENGE_FORGED_Z - CHALLENGE_HONEST_Z),
        ],
        { color: '#ffffff', width: 9.0, glow: 14, blend: 'screen', opacity: 1, onTop: true },
    )
    const hitHonest = point3d(
        () => [CHALLENGE_RX, CHALLENGE_RY, CHALLENGE_HONEST_Z],
        { color: '#5ce1e6', radius: 10, glow: 12, blend: 'screen', halo: 0, onTop: true },
    )
    const hitForged = point3d(
        () => [CHALLENGE_RX, CHALLENGE_RY, CHALLENGE_FORGED_Z],
        { color: '#ff6b8b', radius: 10, glow: 12, blend: 'screen', halo: 0, onTop: true },
    )
    const tagP = label3d(pill3d('P(r)', 84, '#7ce8ff'), [CHALLENGE_RX, CHALLENGE_RY, CHALLENGE_HONEST_Z], {
        offset: [60, -18],
    })
    const tagQ = label3d(pill3d('Q(r)', 84, '#ff96b0'), [CHALLENGE_RX, CHALLENGE_RY, CHALLENGE_FORGED_Z], {
        offset: [60, 22],
    })

    view3d.add(floorGrid, ...baseFrame, honestSurf, forgedSurf, posBranch, negBranch)

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

    // Full-opacity glowing pill badge snapping in immediately when the golden laser pierces the surfaces!
    const gapBadge = dynamic(() => {
        if (gapReveal.value < 0.05) return []
        const a = Math.min(1, gapReveal.value)
        return group(
            rect(500, 62, { fill: '#111626ee', stroke: '#ffd166', width: 3.2, radius: 31 })
                .at(555, -360)
                .opacity(a)
                .glow(12, '#ffd166'),
            txt('P(r) ≠ Q(r)  ·  CAUGHT!', 555, -358, 30, '#ffd166', 'mono').opacity(a).glow(8, '#ffd166'),
        )
    })

    s.add(aura, view3d, leftCopy, gapBadge)
    const orbitDur = Math.max(15.5, c.end - c.start - 0.5)
    c.at(0.1, () => {
        s.play(view3d.orbit({ theta: 0.45, phi: 0.92 }, { duration: orbitDur }))
    })
    c.show('razor-thin curves', boundEq)
    c.on('random golden challenge', () => {
        view3d.add(crossX, crossY, crossRing, crossDot, crossLabel, beamLaser, hitHonest, hitForged, gapBar, tagP, tagQ)
        s.play(beamProg.to(1, { duration: 0.95 }))
    })
    // Snap the gap bar & glowing P(r) != Q(r) badge in immediately as the laser pierces both surfaces!
    const laserPierceRel = Math.max(0.2, c.cue('random golden challenge').start - c.start + 0.75)
    c.at(laserPierceRel, () => {
        s.play(gapReveal.to(1, { duration: 0.45 }))
    })
}

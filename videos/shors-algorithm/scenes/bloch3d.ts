import {
    circle, curve3d, dynamic, group, line3d, linear, parametricSurface, point3d, radialGradient,
    rect, scene3d, tex, vector3d,
    type SceneFunction,
} from 'vizmatic/stage'
import { blochPoint } from '../math'
import { txt } from '../../../factory/style'

const R = 1.65

export const bloch3d: SceneFunction = (s, c) => {
    const theta = s.value(0.06)
    const phi = s.value(0)

    const aura = circle(560, {
        fill: radialGradient([0, 0], 560, [
            [0, '#38bdf824'],
            [0.5, '#7c8cff16'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(245, 20)

    const view3d = scene3d({
        theta: -0.66,
        phi: 1.16,
        distance: 7.4,
        unit: 210,
        perspective: true,
        ambient: 0.44,
        shine: 0.36,
        brightness: 1.1,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(245, 20)

    const glassShell = parametricSurface(
        (u, v) => [
            R * Math.sin(v) * Math.cos(u),
            R * Math.sin(v) * Math.sin(u),
            R * Math.cos(v),
        ],
        [0, Math.PI * 2],
        [0.05, Math.PI - 0.05],
        {
            resolution: [28, 18],
            color: '#1b3469',
            opacity: 0.16,
            mesh: '#5ce1e6',
            meshOpacity: 0.17,
            meshWidth: 0.7,
            cull: true,
            outwardFrom: [0, 0, 0],
        },
    )

    const equator = curve3d(
        (u) => [R * Math.cos(u), R * Math.sin(u), 0],
        0,
        Math.PI * 2,
        { samples: 96, color: '#5ce1e6', width: 3.6, glow: 8, opacity: 0.92 },
    )

    const meridianX = curve3d(
        (u) => [R * Math.sin(u), 0, R * Math.cos(u)],
        0,
        Math.PI * 2,
        { samples: 84, color: '#7c8cff', width: 1.8, opacity: 0.45 },
    )

    const meridianY = curve3d(
        (u) => [0, R * Math.sin(u), R * Math.cos(u)],
        0,
        Math.PI * 2,
        { samples: 84, color: '#7c8cff', width: 1.8, opacity: 0.38 },
    )

    const stateVec = vector3d(
        [0, 0, 0],
        () => blochPoint(theta.value, phi.value, R),
        { color: '#ffd166', width: 5.5, glow: 12, tip: 16, halo: false, onTop: true },
    )

    const phaseProjection = line3d(
        [0, 0, 0],
        () => {
            const [x, y] = blochPoint(theta.value, phi.value, R)
            return [x, y, 0]
        },
        { color: '#ff6b8b', width: 2.6, glow: 6, opacity: 0.82 },
    )

    view3d.add(
        glassShell,
        equator,
        meridianX,
        meridianY,
        // Axes X, Y, Z
        line3d([-R * 1.05, 0, 0], [R * 1.05, 0, 0], { color: '#6e7c9e', width: 1.6, opacity: 0.55 }),
        line3d([0, -R * 1.05, 0], [0, R * 1.05, 0], { color: '#6e7c9e', width: 1.6, opacity: 0.55 }),
        line3d([0, 0, -R], [0, 0, R], { color: '#9aa8c4', width: 2.2, opacity: 0.72 }),
        // Poles |0> and |1>
        point3d([0, 0, R], { color: '#5ce1e6', radius: 7.5, halo: 0 }),
        point3d([0, 0, -R], { color: '#ff6b8b', radius: 7.5, halo: 0 }),
        phaseProjection,
        stateVec,
        point3d(() => blochPoint(theta.value, phi.value, R), { color: '#ffffff', radius: 7.5, halo: 0, onTop: true }),
    )

    const liveLabels = dynamic(() => {
        const [nX, nY] = view3d.stagePoint([0, 0, R + 0.34])
        const [sX, sY] = view3d.stagePoint([0, 0, -R - 0.34])
        const p0 = Math.cos(theta.value / 2) ** 2
        const p1 = Math.sin(theta.value / 2) ** 2
        const deg = Math.round(((phi.value * 180) / Math.PI) % 360)
        const barMax = 380

        return group(
            txt('|0⟩', nX, nY, 32, '#5ce1e6', 'mono').glow(6, '#38bdf8'),
            txt('|1⟩', sX, sY, 32, '#ff6b8b', 'mono').glow(6, '#ff6b8b'),
            // Live probability + phase telemetry on left side (no boxy cards, pure luminous bars)
            txt(`P(|0⟩) = ${Math.round(p0 * 100)}%`, -840, 26, 28, '#5ce1e6', 'mono', 'left'),
            rect(barMax, 14, { fill: '#15203b', stroke: null, radius: 7 }).at(-840 + barMax / 2, 62),
            rect(Math.max(8, barMax * p0), 14, { fill: '#5ce1e6', stroke: null, radius: 7 })
                .at(-840 + Math.max(8, barMax * p0) / 2, 62)
                .glow(6, '#5ce1e6'),
            txt(`P(|1⟩) = ${Math.round(p1 * 100)}%`, -840, 118, 28, '#ff6b8b', 'mono', 'left'),
            rect(barMax, 14, { fill: '#15203b', stroke: null, radius: 7 }).at(-840 + barMax / 2, 154),
            rect(Math.max(8, barMax * p1), 14, { fill: '#ff6b8b', stroke: null, radius: 7 })
                .at(-840 + Math.max(8, barMax * p1) / 2, 154)
                .glow(6, '#ff6b8b'),
            txt(`Phase φ = ${deg}°`, -840, 218, 32, '#ffd166', 'mono', 'left').glow(6, '#ffd166'),
        )
    })

    const leftCopy = group(
        txt('The Bloch', -840, -375, 64, '#f8f4ec', 'serif', 'left'),
        txt('Sphere', -840, -305, 64, '#5ce1e6', 'serif', 'left').glow(6, '#38bdf8'),
        tex(String.raw`|\psi\rangle = \cos\tfrac{\theta}{2}|0\rangle + e^{i\phi}\sin\tfrac{\theta}{2}|1\rangle`, {
            size: 38,
            color: '#f8f4ec',
        }).at(-560, -182),
        tex(String.raw`P(0) = |\alpha|^2,\quad P(1) = |\beta|^2`, {
            size: 34,
            color: '#9aa8c4',
        }).at(-600, -104),
    )

    const gateNote0 = group(
        txt('Hadamard gate H', -840, 318, 34, '#5ce1e6', 'serif', 'left').glow(5, '#38bdf8'),
        txt('Swings |0⟩ onto the 50/50 equator', -840, 368, 28, '#b5c1d8', 'sans', 'left'),
    )

    const gateNote1 = group(
        txt('Phase gate Rz(φ)', -840, 318, 34, '#ffd166', 'serif', 'left').glow(5, '#ffd166'),
        txt('Same 50/50 odds · hidden phase drives interference', -840, 368, 28, '#b5c1d8', 'sans', 'left'),
    )

    s.add(aura, view3d, liveLabels, leftCopy, gateNote0)
    c.at(0.1, () => s.play(view3d.orbit({ theta: 0.45, phi: 1.05 }), { duration: 25.0 }))
    c.on('swings onto the equator', () => s.play(theta.to(Math.PI / 2, { duration: 2.2 })))
    c.on('phase gate', () => s.play(phi.to(Math.PI * 2.35, { duration: 7.5, ease: linear })))
    c.swap('phase gate', gateNote0, gateNote1)
}

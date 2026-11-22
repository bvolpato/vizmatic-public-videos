import {
    Node, circle, curve3d, dot, group, line, line3d, linearGradient, point3d, polyPath,
    radialGradient, scene3d, surface,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { enstrophyHeight, kolmogorovSpectrum } from '../math'
import { txt } from '../../../factory/style'

const WX_HALF = 3.4
const WY_HALF = 3.4

function buildCascade3D(pinch: number, startTheta: number, startPhi: number) {
    const view = scene3d({
        theta: startTheta,
        phi: startPhi,
        distance: 15.2,
        unit: 126,
        perspective: true,
        ambient: 0.38,
        shine: 0.32,
        brightness: 1.08,
        fog: 0.1,
        focus: [0, 0, 0.88],
    }).at(210, 42)

    const terrain = surface((wx, wy) => enstrophyHeight(wx, wy, pinch), {
        x: [-WX_HALF, WX_HALF],
        y: [-WY_HALF, WY_HALF],
        resolution: [48, 48],
        colors:
            pinch > 0.6
                ? ['#060814', '#22144a', '#7c2d7a', '#ff4d8d', '#ffd166', '#ffffff']
                : ['#060814', '#1b1d52', '#4c2f8a', '#2180c2', '#5ce1e6', '#ffd166'],
        mesh: pinch > 0.6 ? '#ff8fb1' : '#7ce8ff',
        meshOpacity: 0.24,
        meshWidth: 0.75,
        opacity: 0.88,
    })

    // Glowing 3D helical vortex filaments rising out of the major enstrophy peaks!
    const peakTop = enstrophyHeight(0.05, -0.1, pinch)
    const spireTop = peakTop + (pinch > 0.6 ? 1.45 : 0.75)

    const heroFilament = curve3d(
        (u): Vec3 => {
            const z = peakTop * 0.45 + u * (spireTop - peakTop * 0.45)
            const r = (0.34 - 0.24 * pinch) * (1 - 0.65 * u)
            const ang = u * 4.5 * Math.PI
            return [0.05 + r * Math.cos(ang), -0.1 + r * Math.sin(ang), z]
        },
        0,
        1,
        { color: '#ffd166', width: pinch > 0.6 ? 5.0 : 3.8, glow: 12, samples: 44, opacity: 1 },
    )

    const sideFilaments = [
        { x: -1.85, y: 1.25, col: '#5ce1e6' },
        { x: 1.95, y: 1.15, col: '#ff6b8b' },
        { x: 1.7, y: -1.45, col: '#a78bfa' },
    ].map((pk) => {
        const h0 = enstrophyHeight(pk.x, pk.y, pinch)
        return line3d([pk.x, pk.y, h0], [pk.x, pk.y, h0 + 0.65 + 0.35 * pinch], {
            color: pk.col,
            width: 3.0,
            glow: 8,
            opacity: 0.88,
        })
    })

    view.add(
        terrain,
        heroFilament,
        line3d([0.05, -0.1, peakTop], [0.05, -0.1, spireTop], {
            color: '#ffffff',
            width: pinch > 0.6 ? 3.2 : 2.0,
            glow: 10,
            opacity: 0.95,
        }),
        point3d([0.05, -0.1, spireTop], { color: '#ffffff', radius: pinch > 0.6 ? 7.5 : 5.5, halo: 0 }),
        ...sideFilaments,
    )
    return view
}

// Precompute Kolmogorov log-log energy cascade plot in lower-left corner
const K_X0 = -840
const K_X1 = -335
const K_Y0 = 360
const K_Y1 = 125
const KOLMO_PTS: Vec[] = Array.from({ length: 64 }, (_, i) => {
    const frac = i / 63
    const k = Math.pow(10, 0.0 + frac * 1.75) // k from 1 to ~56
    const e = kolmogorovSpectrum(k, 28)
    const logE = Math.log10(Math.max(1e-5, e)) // roughly 0 down to -4
    const y = K_Y1 + ((0 - logE) / 4.2) * (K_Y0 - K_Y1)
    return [K_X0 + frac * (K_X1 - K_X0), Math.min(K_Y0, Math.max(K_Y1, y))] as Vec
})

export const cascade3d: SceneFunction = (s, c) => {
    const aura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#4c2f8a24'],
            [0.55, '#ff6b8b14'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(210, 42)

    const viewCascade = buildCascade3D(0.18, -0.82, 1.05)
    const viewBlowup = buildCascade3D(1.0, -0.32, 0.95)

    const kolmoGrad = linearGradient([K_X0, K_Y1], [K_X1, K_Y0], ['#5ce1e6', '#a78bfa', '#ffd166'])
    const kolmoChart = group(
        txt('Kolmogorov Cascade', K_X0, 72, 28, '#ffd166', 'mono', 'left'),
        line([K_X0, K_Y0], [K_X1, K_Y0], { stroke: '#2c3959', width: 2 }),
        line([K_X0, K_Y0], [K_X0, K_Y1], { stroke: '#2c3959', width: 2 }),
        new Node(polyPath(KOLMO_PTS)).stroke(kolmoGrad, 4.0, 0.95).glow(8, '#5ce1e6'),
        txt('E(k) ∝ k⁻⁵/³', K_X0 + 265, 148, 28, '#5ce1e6', 'mono', 'left').glow(6, '#38bdf8'),
        txt('Large eddies → tiny scales', K_X0, 405, 26, '#9eb0d0', 'sans', 'left'),
        dot(5.5, '#ffd166').at(KOLMO_PTS[8]![0], KOLMO_PTS[8]![1]).glow(10, '#ffd166'),
    )

    const copyCascade = group(
        txt('3D Vorticity', -840, -395, 60, '#f8f4ec', 'serif', 'left'),
        txt('Energy Cascade', -840, -322, 54, '#5ce1e6', 'serif', 'left').glow(6, '#38bdf8'),
        txt('Height = enstrophy  |ω|²', -840, -238, 28, '#9eb0d0', 'mono', 'left'),
    )

    const copyBlowup = group(
        txt('Finite-Time', -840, -395, 60, '#ffd166', 'serif', 'left').glow(8, '#ffd166'),
        txt('Blow-Up?', -840, -322, 58, '#ff6b8b', 'serif', 'left').glow(8, '#ff6b8b'),
        txt('|u| → ∞  or viscous rescue?', -840, -238, 28, '#f8f4ec', 'mono', 'left'),
    )

    s.add(aura, viewCascade, copyCascade, kolmoChart)
    c.at(0.1, () => {
        s.play(viewCascade.orbit({ theta: -0.32, phi: 0.95 }), { duration: 11.5 })
    })

    c.swap('pinch so sharp', [viewCascade, copyCascade], [viewBlowup, copyBlowup])
    c.on('shoots to infinity', () => {
        s.play(viewBlowup.orbit({ theta: 0.25, phi: 0.86 }), { duration: 2.8 })
    })
}

import {
    Node, circle, curve3d, dot, dynamic, group, line, linear, linearGradient, point3d, polygon,
    polyPath, radialGradient, scene3d, surface, tex,
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
    }).at(215, 40)

    const terrain = surface((wx, wy) => enstrophyHeight(wx, wy, pinch), {
        x: [-WX_HALF, WX_HALF],
        y: [-WY_HALF, WY_HALF],
        resolution: [56, 56],
        colors:
            pinch > 0.6
                ? ['#060814', '#22144a', '#7c2d7a', '#ff4d8d', '#ffd166', '#ffffff']
                : ['#060814', '#1b1d52', '#4c2f8a', '#2180c2', '#5ce1e6', '#ffd166'],
        mesh: pinch > 0.6 ? '#ff8fb1' : '#7ce8ff',
        meshOpacity: 0.2,
        meshWidth: 0.68,
        opacity: 0.88,
    })

    // Swirling animated helical curve3d vortex filaments erupting from the central spire (replaces rigid sticks!)
    const peakTop = enstrophyHeight(0.05, -0.1, pinch)
    const spireTop = peakTop + (pinch > 0.6 ? 1.55 : 0.85)
    const heroCols = pinch > 0.6 ? ['#ffd166', '#ff6b8b', '#ffffff'] : ['#ffd166', '#5ce1e6', '#a78bfa']

    const heroFilaments = heroCols.map((col, idx) =>
        curve3d(
            (u, time): Vec3 => {
                const z = peakTop * 0.38 + u * (spireTop - peakTop * 0.38)
                const r = (0.42 - 0.22 * pinch) * (1 - 0.72 * u) + 0.04
                const ang = (2 * Math.PI * idx) / 3 + u * (5.2 + 2.4 * pinch) * Math.PI + time * (1.8 + 1.4 * pinch)
                return [0.05 + r * Math.cos(ang), -0.1 + r * Math.sin(ang), z]
            },
            0,
            1,
            {
                color: col,
                width: idx === 0 ? (pinch > 0.6 ? 4.8 : 3.8) : 3.0,
                glow: 10,
                blend: 'screen',
                animate: true,
                samples: 56,
                opacity: idx === 0 ? 0.98 : 0.82,
            },
        ),
    )

    // Swirling animated helical filaments rising from the surrounding turbulent towers
    const sideFilaments = [
        { x: -1.85, y: 1.25, col: '#5ce1e6', dir: 1 },
        { x: 1.95, y: 1.15, col: '#ff6b8b', dir: -1 },
        { x: 1.7, y: -1.45, col: '#a78bfa', dir: 1 },
        { x: -1.65, y: -1.55, col: '#ffd166', dir: -1 },
    ].map((pk, idx) => {
        const h0 = enstrophyHeight(pk.x, pk.y, pinch)
        const h1 = h0 + 0.78 + 0.42 * pinch
        return curve3d(
            (u, time): Vec3 => {
                const z = h0 * 0.65 + u * (h1 - h0 * 0.65)
                const r = (0.28 - 0.1 * pinch) * (1 - 0.68 * u) + 0.025
                const ang = idx * 1.4 + pk.dir * (u * 4.0 * Math.PI + time * 1.5)
                return [pk.x + r * Math.cos(ang), pk.y + r * Math.sin(ang), z]
            },
            0,
            1,
            {
                color: pk.col,
                width: 3.0,
                glow: 10,
                blend: 'screen',
                animate: true,
                samples: 44,
                opacity: 0.88,
            },
        )
    })

    view.add(
        terrain,
        ...heroFilaments,
        // Glowing singularity tip beacon at the central spire apex!
        point3d([0.05, -0.1, spireTop], {
            color: pinch > 0.6 ? '#ffd166' : '#5ce1e6',
            radius: pinch > 0.6 ? 11 : 7.5,
            glow: 16,
            blend: 'screen',
            halo: 0,
        }),
        point3d([0.05, -0.1, spireTop], {
            color: '#ffffff',
            radius: pinch > 0.6 ? 5.5 : 4.0,
            glow: 12,
            blend: 'screen',
            halo: 0,
        }),
        ...sideFilaments,
    )
    return view
}

// Precompute Kolmogorov log-log energy cascade plot in lower-left corner
const K_X0 = -835
const K_X1 = -325
const K_Y0 = 365
const K_Y1 = 135
const K_SPLIT_X = K_X0 + 0.66 * (K_X1 - K_X0) // k ~ 14 transition from Inertial -> Viscous roll-off!

const KOLMO_PTS: Vec[] = Array.from({ length: 64 }, (_, i) => {
    const frac = i / 63
    const k = Math.pow(10, 0.0 + frac * 1.75) // k from 1 to ~56
    const e = kolmogorovSpectrum(k, 28)
    const logE = Math.log10(Math.max(1e-5, e))
    const y = K_Y1 + ((0 - logE) / 4.2) * (K_Y0 - K_Y1)
    return [K_X0 + frac * (K_X1 - K_X0), Math.min(K_Y0, Math.max(K_Y1, y))] as Vec
})

const INERTIAL_POLY: Vec[] = [
    [K_X0, K_Y1],
    [K_SPLIT_X, K_Y1],
    [K_SPLIT_X, K_Y0],
    [K_X0, K_Y0],
]
const VISCOUS_POLY: Vec[] = [
    [K_SPLIT_X, K_Y1],
    [K_X1, K_Y1],
    [K_X1, K_Y0],
    [K_SPLIT_X, K_Y0],
]

export const cascade3d: SceneFunction = (s, c) => {
    const gradSurge = s.value(0.22)

    const aura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#4c2f8a2a'],
            [0.55, '#ff6b8b18'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(215, 40).set('blend', 'screen')

    const viewCascade = buildCascade3D(0.18, -0.82, 1.05)
    const viewBlowup = buildCascade3D(1.0, -0.32, 0.95)

    const kolmoGrad = linearGradient([K_X0, K_Y1], [K_X1, K_Y0], ['#5ce1e6', '#a78bfa', '#ffd166'])
    const kolmoChart = group(
        txt('Kolmogorov Cascade', K_X0, 74, 28, '#ffd166', 'mono', 'left'),
        // Shaded Inertial vs Viscous dissipation zones
        polygon(INERTIAL_POLY, { fill: '#5ce1e6', stroke: null }).opacity(0.08),
        polygon(VISCOUS_POLY, { fill: '#ff6b8b', stroke: null }).opacity(0.1),
        line([K_SPLIT_X, K_Y1], [K_SPLIT_X, K_Y0], { stroke: '#4d5d85', width: 1.5, dash: [5, 6] }),
        txt('Inertial', (K_X0 + K_SPLIT_X) * 0.5, K_Y0 - 24, 26, '#5ce1e6', 'sans').opacity(0.85),
        txt('Viscous', (K_SPLIT_X + K_X1) * 0.5, K_Y0 - 24, 26, '#ff6b8b', 'sans').opacity(0.85),
        // Axes + crisp log k / log E(k) labels
        line([K_X0, K_Y0], [K_X1, K_Y0], { stroke: '#3a4b73', width: 2.2 }),
        line([K_X0, K_Y0], [K_X0, K_Y1], { stroke: '#3a4b73', width: 2.2 }),
        txt('log E(k)', K_X0, K_Y1 - 24, 26, '#9eb0d0', 'mono', 'left'),
        txt('log k', K_X1, K_Y0 + 34, 26, '#9eb0d0', 'mono', 'right'),
        txt('Large → tiny', K_X0, K_Y0 + 34, 26, '#8da0c4', 'sans', 'left'),
        // Curve + crisp TeX E(k) \propto k^{-5/3} (fixes broken Unicode k⁻⁵/³ slash!)
        new Node(polyPath(KOLMO_PTS)).stroke(kolmoGrad, 4.2, 0.96).glow(10, '#5ce1e6').set('blend', 'screen'),
        new Node(polyPath(KOLMO_PTS)).stroke('#ffffff', 1.1, 0.36),
        tex(String.raw`E(k) \propto k^{-5/3}`, { size: 34, color: '#5ce1e6' }).at(K_X0 + 355, 165).glow(7, '#38bdf8'),
        dot(6, '#ffd166').at(KOLMO_PTS[8]![0], KOLMO_PTS[8]![1]).glow(12, '#ffd166').set('blend', 'screen'),
    )

    // Live max |grad u| velocity-gradient readout filling the middle-left cleanly!
    const liveGradMeter = dynamic(() => {
        const g = gradSurge.value
        const isHot = g > 0.62
        const col = isHot ? '#ff6b8b' : '#5ce1e6'
        const valStr = g > 0.92 ? '∞ ?' : `${(4.2 * Math.pow(35, g)).toFixed(1)} s⁻¹`
        return group(
            txt(`max |∇u| = ${valStr}`, K_X0, -118, 34, col, 'mono', 'left').glow(8, col),
            line([K_X0, -68], [K_X1, -68], { stroke: '#222d4a', width: 10 }),
            line([K_X0, -68], [K_X0 + (K_X1 - K_X0) * Math.min(1, g), -68], { stroke: col, width: 10 })
                .glow(10, col)
                .set('blend', 'screen'),
            dot(6.5, '#ffffff').at(K_X0 + (K_X1 - K_X0) * Math.min(1, g), -68).glow(12, col).set('blend', 'screen'),
            txt(isHot ? 'Gradient spiking near core!' : 'Energy cascading to fine scales', K_X0, -24, 26, isHot ? '#ffd166' : '#9eb0d0', 'sans', 'left'),
        )
    })

    const copyCascade = group(
        txt('3D Vorticity', -835, -405, 58, '#f8f4ec', 'serif', 'left'),
        txt('Energy Cascade', -835, -334, 52, '#5ce1e6', 'serif', 'left').glow(6, '#38bdf8'),
        txt('Height = enstrophy  |ω|²', -835, -256, 26, '#9eb0d0', 'mono', 'left'),
    )

    const copyBlowup = group(
        txt('Finite-Time', -835, -405, 58, '#ffd166', 'serif', 'left').glow(8, '#ffd166'),
        txt('Blow-Up?', -835, -334, 56, '#ff6b8b', 'serif', 'left').glow(8, '#ff6b8b'),
        txt('|u| → ∞  or viscous rescue?', -835, -256, 26, '#f8f4ec', 'mono', 'left'),
    )

    s.add(aura, viewCascade, copyCascade, liveGradMeter, kolmoChart)
    c.at(0.1, () => {
        s.play(viewCascade.orbit({ theta: -0.32, phi: 0.95 }), { duration: 11.5 })
    })
    c.at(0.1, () => {
        s.play(gradSurge.to(0.46, { duration: 11.0, ease: linear }))
    })

    c.swap('pinch so sharp', [viewCascade, copyCascade], [viewBlowup, copyBlowup])
    c.on('pinch so sharp', () => {
        s.play(gradSurge.to(0.96, { duration: 3.2 }))
    })
    c.on('shoots to infinity', () => {
        s.play(viewBlowup.orbit({ theta: 0.25, phi: 0.86 }), { duration: 2.8 })
    })
}

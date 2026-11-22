import {
    circle, curve3d, group, label3d, line3d, linear, par, parametricSurface, point3d, radialGradient, scene3d, surface, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { KERNEL_FREQS, ropeKernel } from '../math'

// 4 representative helical frequency ribbons spiraling along token position m
const HELIX_BANDS = [
    { freq: 1.0, radius: 0.92, color: COSMOS.cyan, width: 4.4, glow: 10 },
    { freq: 0.45, radius: 1.48, color: COSMOS.blue, width: 3.8, glow: 9 },
    { freq: 0.22, radius: 2.02, color: COSMOS.violet, width: 3.8, glow: 9 },
    { freq: 0.115, radius: 2.55, color: COSMOS.gold, width: 4.6, glow: 11 },
] as const

// Smooth 3D Attention-Decay interference surface over (delta, bandIdx)
// Evaluated smoothly so high-frequency cosine ripples never produce jagged polygon sawtooth spikes
const DELTA_MAX = 36
const WX_HALF = 4.2
const WY_HALF = 2.6

function evalBandTheta(bandFrac: number): number {
    // Band 0 (front) = fast local frequency, Band 1 (back) = slow global frequency
    return Math.pow(10_000, -0.16 - bandFrac * 0.78)
}

function surfaceHeight(wx: number, wy: number): number {
    const u = Math.max(0, Math.min(1, (wx + WX_HALF) / (2 * WX_HALF)))
    const v = Math.max(0, Math.min(1, (wy + WY_HALF) / (2 * WY_HALF)))
    const delta = u * DELTA_MAX
    const theta = evalBandTheta(v)
    // Gentle Gaussian-exponential damping prevents Nyquist aliasing at front edge while preserving clear ripples
    const wave = Math.cos(delta * theta) * Math.exp(-delta * 0.032)
    const kernelVal = ropeKernel(delta, KERNEL_FREQS)
    return 0.48 * wave + 1.42 * kernelVal
}

export const helix3d: SceneFunction = (s, c) => {
    const raceT = s.value(0.12)

    // ── Shot 1: Orbiting 3D multi-frequency helical ribbons spiraling along m ──
    const helixView = scene3d({
        theta: -0.92,
        phi: 1.12,
        distance: 17.6,
        unit: 102,
        perspective: true,
        ambient: 0.42,
        shine: 0.32,
        brightness: 1.1,
        fog: 0.12,
        focus: [0, 0, 0],
    }).at(275, 10)

    // Translucent 2D clock dial end-cap sitting at the front (m = 0, x = -4.5) of the 3D helix
    helixView.add(
        parametricSurface(
            (r, a): Vec3 => [-4.5, r * Math.cos(a), r * Math.sin(a)],
            [0.08, 2.75],
            [0, Math.PI * 2],
            {
                resolution: [6, 36],
                color: '#1e2c54',
                opacity: 0.24,
                mesh: '#5ce1e6',
                meshOpacity: 0.14,
                meshWidth: 0.65,
                shaded: false,
            },
        ),
    )
    // Concentric clock rings + 12 dial ticks on the m = 0 end-cap
    for (const band of HELIX_BANDS) {
        helixView.add(
            curve3d(
                (t): Vec3 => [-4.5, Math.cos(t * Math.PI * 2) * band.radius, Math.sin(t * Math.PI * 2) * band.radius],
                0,
                1,
                { color: band.color, width: 2.0, opacity: 0.55, glow: 5, blend: 'screen', samples: 64 },
            ),
        )
    }
    for (let k = 0; k < 12; k++) {
        const a = (k * Math.PI) / 6
        helixView.add(
            line3d(
                [-4.5, Math.cos(a) * 2.52, Math.sin(a) * 2.52],
                [-4.5, Math.cos(a) * 2.82, Math.sin(a) * 2.82],
                { color: '#93c5fd', width: 2.0, opacity: 0.72 },
            ),
        )
    }

    // Glowing central token-position spine axis (m = 0 -> N) with additive screen blend
    helixView.add(
        line3d([-4.8, 0, 0], [4.8, 0, 0], {
            color: '#ffffff',
            width: 3.6,
            opacity: 0.92,
            glow: 8,
            blend: 'screen',
        }),
        label3d('m = 0', [-4.5, 0, 3.05], { size: 26, color: COSMOS.gold, math: false }),
        label3d('m = N', [5.55, 0, 0], { size: 26, color: COSMOS.cyan, math: false }),
    )

    // Token position tick beacons along the central spine
    for (let k = 0; k <= 8; k++) {
        const x = -4.5 + (9.0 * k) / 8
        helixView.add(
            point3d([x, 0, 0], { color: COSMOS.gold, radius: 5.5, glow: 8, blend: 'screen' }),
        )
    }

    // 4 luminous multi-frequency helical ribbons + racing phase beads with additive screen glow!
    for (let bIdx = 0; bIdx < HELIX_BANDS.length; bIdx++) {
        const band = HELIX_BANDS[bIdx]!
        helixView.add(
            curve3d(
                (t): Vec3 => {
                    const m = t * 48
                    const x = -4.5 + t * 9.0
                    const ang = m * band.freq
                    return [x, Math.cos(ang) * band.radius, Math.sin(ang) * band.radius]
                },
                0,
                1,
                {
                    color: band.color,
                    width: band.width,
                    glow: band.glow,
                    blend: 'screen',
                    samples: 320,
                    opacity: 0.94,
                },
            ),
            // Animated racing phase bead + glowing spoke sweeping down each helix
            line3d(
                (): Vec3 => [-4.5 + ((raceT.value + bIdx * 0.06) % 1) * 9.0, 0, 0],
                (): Vec3 => {
                    const t = (raceT.value + bIdx * 0.06) % 1
                    const m = t * 48
                    const x = -4.5 + t * 9.0
                    const ang = m * band.freq
                    return [x, Math.cos(ang) * band.radius, Math.sin(ang) * band.radius]
                },
                { color: band.color, width: 2.2, opacity: 0.72, glow: 6, blend: 'screen' },
            ),
            point3d(
                (): Vec3 => {
                    const t = (raceT.value + bIdx * 0.06) % 1
                    const m = t * 48
                    const x = -4.5 + t * 9.0
                    const ang = m * band.freq
                    return [x, Math.cos(ang) * band.radius, Math.sin(ang) * band.radius]
                },
                { color: '#ffffff', radius: 8.0, glow: 12, blend: 'screen' },
            ),
            // Second staggered glowing phase bead for continuous visual energy
            point3d(
                (): Vec3 => {
                    const t = (raceT.value + 0.5 + bIdx * 0.06) % 1
                    const m = t * 48
                    const x = -4.5 + t * 9.0
                    const ang = m * band.freq
                    return [x, Math.cos(ang) * band.radius, Math.sin(ang) * band.radius]
                },
                { color: band.color, radius: 6.5, glow: 12, blend: 'screen' },
            ),
        )
        // End-cap initial compass hand at m = 0
        helixView.add(
            line3d([-4.5, 0, 0], [-4.5, band.radius, 0], { color: band.color, width: 2.4, opacity: 0.75, glow: 6, blend: 'screen' }),
            point3d([-4.5, band.radius, 0], { color: '#ffffff', radius: 5.5, glow: 10, blend: 'screen' }),
        )
    }

    const helixAura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#5ce1e624'],
            [0.5, '#4c2f8a16'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(265, 5).set('blend', 'screen')

    const helixCopy = group(
        txt('3D MULTI-FREQUENCY HELICES', -850, -395, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Dozens of clocks', -854, -310, 62, COSMOS.ink, 'serif', 'left'),
        txt('spiraling through m', -854, -238, 62, COSMOS.cyan, 'serif', 'left').glow(6, '#38bdf8'),
        tex(String.raw`\theta_i = 10000^{-2i/d}`, { size: 42, color: COSMOS.gold }).at(-600, -110).glow(5, COSMOS.gold),
        txt('Central spine:  m = 0  →  N', -850, 35, 28, COSMOS.gold, 'mono', 'left').glow(5, COSMOS.gold),
        txt('Fast inner helix  — local grammar', -850, 265, 28, COSMOS.cyan, 'sans', 'left'),
        txt('Mid ribbons      — phrase structure', -850, 318, 28, COSMOS.violet, 'sans', 'left'),
        txt('Slow outer sweep — chapter distance', -850, 371, 28, COSMOS.gold, 'sans', 'left'),
    )

    // ── Shot 2: Smooth Orbiting 3D Attention-Decay Interference Surface ──
    const surfaceView = scene3d({
        theta: -0.82,
        phi: 1.04,
        distance: 19.6,
        unit: 96,
        perspective: true,
        ambient: 0.38,
        shine: 0.34,
        brightness: 1.1,
        fog: 0.1,
        focus: [0, 0, 0.45],
    }).at(295, 8)

    const decaySurface = surface((wx, wy) => surfaceHeight(wx, wy), {
        x: [-WX_HALF, WX_HALF],
        y: [-WY_HALF, WY_HALF],
        resolution: [60, 48],
        colors: ['#090d22', '#1e2761', '#4c2f8a', '#2180c2', '#5ce1e6', '#ffd166'],
        mesh: '#7ce8ff',
        meshOpacity: 0.2,
        meshWidth: 0.65,
        opacity: 0.84,
    })

    // Crisp 3D coordinate axes along the outer edges of the decay field (no stray floating bar!)
    const baseZ = -0.35
    const axisLines = [
        line3d([-WX_HALF, -WY_HALF, baseZ], [WX_HALF + 0.4, -WY_HALF, baseZ], { color: '#7084b4', width: 2.2, opacity: 0.85 }),
        line3d([-WX_HALF, -WY_HALF, baseZ], [-WX_HALF, WY_HALF + 0.4, baseZ], { color: '#7084b4', width: 2.2, opacity: 0.85 }),
        line3d([-WX_HALF, -WY_HALF, baseZ], [-WX_HALF, -WY_HALF, 2.45], { color: COSMOS.gold, width: 2.4, opacity: 0.88, glow: 6, blend: 'screen' }),
        label3d('Δ', [WX_HALF + 0.85, -WY_HALF - 0.55, baseZ], { size: 28, color: COSMOS.cyan, math: false }),
        label3d('Band i', [-WX_HALF - 0.15, WY_HALF + 1.15, 0.45], { size: 26, color: COSMOS.violet, math: false }),
        label3d('K(Δ)', [-WX_HALF, -WY_HALF, 2.85], { size: 28, color: COSMOS.gold, math: false }),
    ]

    // Glowing individual-frequency cosine slices overlaid across the surface underneath the golden K(Δ) envelope
    const sliceSpecs = [
        { bandFrac: 0.14, color: COSMOS.cyan },
        { bandFrac: 0.42, color: COSMOS.blue },
        { bandFrac: 0.70, color: COSMOS.violet },
        { bandFrac: 0.92, color: COSMOS.rose },
    ] as const
    const cosineSlices = sliceSpecs.map((sl) => {
        const wy = -WY_HALF + sl.bandFrac * (2 * WY_HALF)
        return curve3d(
            (t): Vec3 => {
                const wx = -WX_HALF + t * (2 * WX_HALF)
                return [wx, wy, surfaceHeight(wx, wy) + 0.04]
            },
            0,
            1,
            { color: sl.color, width: 2.8, glow: 8, blend: 'screen', samples: 160, opacity: 0.88, bias: 0.08 },
        )
    })

    // Blazing golden summed RoPE kernel ridge riding cleanly along the front edge
    const kernelRidge = curve3d(
        (t): Vec3 => {
            const delta = t * DELTA_MAX
            const wx = -WX_HALF + t * (2 * WX_HALF)
            const k = ropeKernel(delta, KERNEL_FREQS)
            return [wx, -WY_HALF - 0.14, 0.42 + k * 1.85]
        },
        0,
        1,
        { color: COSMOS.gold, width: 5.8, glow: 14, blend: 'screen', samples: 200, opacity: 1, bias: 0.12 },
    )

    surfaceView.add(
        decaySurface,
        ...axisLines,
        ...cosineSlices,
        kernelRidge,
        point3d([-WX_HALF, -WY_HALF - 0.14, 2.27], { color: '#ffffff', radius: 8.5, glow: 14, blend: 'screen' }),
    )

    const surfaceAura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#ffd16626'],
            [0.5, '#4c2f8a18'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(280, 48).set('blend', 'screen')

    const surfaceCopy = group(
        txt('CONSTRUCTIVE INTERFERENCE', -860, -395, 26, COSMOS.gold, 'mono', 'left'),
        txt('The RoPE', -864, -310, 60, COSMOS.ink, 'serif', 'left'),
        txt('Attention Decay', -864, -240, 60, COSMOS.gold, 'serif', 'left').glow(6, COSMOS.gold),
        tex(String.raw`K(\Delta) = \frac{1}{P}\sum_{i=0}^{P-1}\cos(\Delta\,\theta_i)`, {
            size: 36,
            color: COSMOS.cyan,
        }).at(-605, -110).glow(5, COSMOS.cyan),
        txt('All clocks align at Δ = 0 → sharp peak', -860, 295, 29, COSMOS.gold, 'sans', 'left'),
        txt('Phases cancel at large Δ → smooth decay', -860, 352, 29, '#cbd5e8', 'sans', 'left'),
    )

    s.add(helixAura, helixView, helixCopy)
    const orbit1Dur = Math.max(4.0, c.cue('Sum their cosines').start - c.start - 0.35)
    c.at(0.1, () => {
        s.play(par(
            helixView.orbit({ theta: -0.22, phi: 0.90 }, { duration: orbit1Dur }),
            raceT.to(1.85, { duration: orbit1Dur, ease: linear }),
        ))
    })

    const orbit2Dur = Math.max(3.5, c.end - c.cue('Sum their cosines').start - 0.55)
    c.swap('Sum their cosines', [helixAura, helixView, helixCopy], [surfaceAura, surfaceView, surfaceCopy])
    c.on('Sum their cosines', () => {
        s.play(surfaceView.orbit({ theta: -0.14, phi: 0.86 }), { duration: orbit2Dur })
    })
}

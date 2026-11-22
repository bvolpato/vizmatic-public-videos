import {
    circle, curve3d, group, line3d, point3d, radialGradient, scene3d, surface, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { KERNEL_FREQS, ropeKernel } from '../math'

// 4 representative helical frequency ribbons spiraling along token position m
const HELIX_BANDS = [
    { freq: 1.0, radius: 0.92, color: COSMOS.cyan, width: 4.2, glow: 8 },
    { freq: 0.45, radius: 1.48, color: COSMOS.blue, width: 3.6, glow: 7 },
    { freq: 0.22, radius: 2.02, color: COSMOS.violet, width: 3.5, glow: 7 },
    { freq: 0.115, radius: 2.55, color: COSMOS.gold, width: 4.4, glow: 9 },
] as const

// Precompute 3D Attention-Decay interference surface table over (delta, bandIdx)
const NX = 60
const NY = 40
const DELTA_MAX = 64
const WX_HALF = 4.2
const WY_HALF = 2.6

const SURFACE_TABLE = new Float32Array(NX * NY)
for (let j = 0; j < NY; j++) {
    const bandFrac = j / (NY - 1)
    const theta = Math.pow(10_000, -bandFrac * 0.85)
    for (let i = 0; i < NX; i++) {
        const delta = (DELTA_MAX * i) / (NX - 1)
        const cosVal = Math.cos(delta * theta)
        // Smooth radial decay envelope + constructive ridge near delta = 0
        const kernelVal = ropeKernel(delta, KERNEL_FREQS)
        const h = 0.55 * cosVal * Math.exp(-delta * 0.018) + 1.35 * kernelVal
        SURFACE_TABLE[j * NX + i] = h
    }
}

function surfaceHeight(wx: number, wy: number): number {
    const u = ((wx + WX_HALF) / (2 * WX_HALF)) * (NX - 1)
    const v = ((wy + WY_HALF) / (2 * WY_HALF)) * (NY - 1)
    const i0 = Math.max(0, Math.min(NX - 2, Math.floor(u)))
    const j0 = Math.max(0, Math.min(NY - 2, Math.floor(v)))
    const fu = Math.max(0, Math.min(1, u - i0))
    const fv = Math.max(0, Math.min(1, v - j0))
    const h00 = SURFACE_TABLE[j0 * NX + i0]!
    const h10 = SURFACE_TABLE[j0 * NX + i0 + 1]!
    const h01 = SURFACE_TABLE[(j0 + 1) * NX + i0]!
    const h11 = SURFACE_TABLE[(j0 + 1) * NX + i0 + 1]!
    return (h00 * (1 - fu) + h10 * fu) * (1 - fv) + (h01 * (1 - fu) + h11 * fu) * fv
}

export const helix3d: SceneFunction = (s, c) => {
    // ── Shot 1: Orbiting 3D multi-frequency helical ribbons spiraling along m ──
    const helixView = scene3d({
        theta: -0.96,
        phi: 1.12,
        distance: 15.2,
        unit: 122,
        perspective: true,
        ambient: 0.4,
        shine: 0.3,
        brightness: 1.08,
        fog: 0.14,
        focus: [0, 0, 0],
    }).at(200, 15)

    // Central token-position spine axis (m = 0 .. 48 mapped onto x in [-4.5, 4.5])
    helixView.add(
        line3d([-4.8, 0, 0], [4.8, 0, 0], { color: '#ffffff', width: 3.2, opacity: 0.85, glow: 6 }),
    )

    // Token position tick beacons along the central spine
    for (let k = 0; k <= 8; k++) {
        const x = -4.5 + (9.0 * k) / 8
        helixView.add(
            point3d([x, 0, 0], { color: COSMOS.gold, radius: 5.5, halo: 0 }),
        )
    }

    // 4 luminous multi-frequency helical ribbons + cross-spokes linking token m = 0, 16, 32, 48
    for (const band of HELIX_BANDS) {
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
                { color: band.color, width: band.width, glow: band.glow, samples: 320, opacity: 0.95 },
            ),
        )
        for (const t of [0.0, 0.33, 0.66, 1.0]) {
            const m = t * 48
            const x = -4.5 + t * 9.0
            const ang = m * band.freq
            const pt: Vec3 = [x, Math.cos(ang) * band.radius, Math.sin(ang) * band.radius]
            helixView.add(
                line3d([x, 0, 0], pt, { color: band.color, width: 1.3, opacity: 0.25 }),
                point3d(pt, { color: '#ffffff', radius: 5.0, halo: 0 }),
            )
        }
    }

    const helixAura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#5ce1e61f'],
            [0.5, '#4c2f8a14'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(200, 15)

    const helixCopy = group(
        txt('3D MULTI-FREQUENCY HELICES', -850, -395, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Dozens of clocks', -854, -310, 62, COSMOS.ink, 'serif', 'left'),
        txt('spiraling through m', -854, -238, 62, COSMOS.cyan, 'serif', 'left').glow(6, '#38bdf8'),
        tex(String.raw`\theta_i = 10000^{-2i/d}`, { size: 42, color: COSMOS.gold }).at(-600, -110).glow(5, COSMOS.gold),
        txt('Fast inner helix  — local grammar', -850, 265, 28, COSMOS.cyan, 'sans', 'left'),
        txt('Mid ribbons      — phrase structure', -850, 318, 28, COSMOS.violet, 'sans', 'left'),
        txt('Slow outer sweep — chapter distance', -850, 371, 28, COSMOS.gold, 'sans', 'left'),
    )

    // ── Shot 2: Orbiting 3D Attention-Decay Interference Surface ──
    const surfaceView = scene3d({
        theta: -0.84,
        phi: 1.04,
        distance: 17.8,
        unit: 112,
        perspective: true,
        ambient: 0.36,
        shine: 0.3,
        brightness: 1.08,
        fog: 0.12,
        focus: [0, 0, 0.35],
    }).at(290, 52)

    const decaySurface = surface((wx, wy) => surfaceHeight(wx, wy), {
        x: [-WX_HALF, WX_HALF],
        y: [-WY_HALF, WY_HALF],
        resolution: [52, 34],
        colors: ['#090d22', '#1e2761', '#4c2f8a', '#2180c2', '#5ce1e6', '#ffd166'],
        mesh: '#7ce8ff',
        meshOpacity: 0.24,
        meshWidth: 0.75,
        opacity: 0.86,
    })

    // Blazing golden summed RoPE kernel ridge riding along the front edge
    const kernelRidge = curve3d(
        (t): Vec3 => {
            const delta = t * DELTA_MAX
            const wx = -WX_HALF + t * (2 * WX_HALF)
            const k = ropeKernel(delta, KERNEL_FREQS)
            return [wx, -WY_HALF - 0.15, 0.35 + k * 1.9]
        },
        0,
        1,
        { color: COSMOS.gold, width: 5.5, glow: 12, samples: 180, opacity: 1 },
    )

    surfaceView.add(
        decaySurface,
        kernelRidge,
        // Glowing golden peak beacon at delta = 0
        line3d([-WX_HALF, -WY_HALF, 0.0], [-WX_HALF, WY_HALF, 0.0], { color: COSMOS.gold, width: 3.5, glow: 8 }),
        point3d([-WX_HALF, -WY_HALF - 0.15, 2.25], { color: '#ffffff', radius: 7.5, halo: 0 }),
    )

    const surfaceAura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#ffd16622'],
            [0.5, '#4c2f8a16'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(290, 52)

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
        s.play(helixView.orbit({ theta: -0.18, phi: 0.88 }), { duration: orbit1Dur })
    })

    const orbit2Dur = Math.max(3.5, c.end - c.cue('Sum their cosines').start - 0.55)
    c.swap('Sum their cosines', [helixAura, helixView, helixCopy], [surfaceAura, surfaceView, surfaceCopy])
    c.on('Sum their cosines', () => {
        s.play(surfaceView.orbit({ theta: -0.12, phi: 0.86 }), { duration: orbit2Dur })
    })
}

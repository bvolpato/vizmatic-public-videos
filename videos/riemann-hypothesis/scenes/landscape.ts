import {
    Node, circle, curve3d, dot, dynamic, group, line3d, linear, linearGradient, point3d, polyPath,
    radialGradient, scene3d, surface, tex,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { ZETA_ZEROS, zeta } from '../math'
import { txt } from '../../../factory/style'

const SIG_MIN = -0.15
const SIG_MAX = 1.45
const IM_MIN = 1.2
const IM_MAX = 35.2
const WX_HALF = 2.6
const WY_HALF = 4.6

const sigToX = (sig: number) => -WX_HALF + ((sig - SIG_MIN) / (SIG_MAX - SIG_MIN)) * (2 * WX_HALF)
const imToY = (im: number) => -WY_HALF + ((im - IM_MIN) / (IM_MAX - IM_MIN)) * (2 * WY_HALF)
const xToSig = (wx: number) => SIG_MIN + ((wx + WX_HALF) / (2 * WX_HALF)) * (SIG_MAX - SIG_MIN)
const yToIm = (wy: number) => IM_MIN + ((wy + WY_HALF) / (2 * WY_HALF)) * (IM_MAX - IM_MIN)

const NX = 56
const NY = 88
const HEIGHT_TABLE = new Float32Array(NX * NY)
for (let j = 0; j < NY; j++) {
    const im = IM_MIN + ((IM_MAX - IM_MIN) * j) / (NY - 1)
    for (let i = 0; i < NX; i++) {
        const sig = SIG_MIN + ((SIG_MAX - SIG_MIN) * i) / (NX - 1)
        const [zr, zi] = zeta(Math.max(0.02, sig), im)
        const mag = Math.hypot(zr, zi)
        HEIGHT_TABLE[j * NX + i] = Math.min(2.2, Math.log1p(mag * 1.35) * 1.15)
    }
}

function zetaHeight(wx: number, wy: number): number {
    const u = ((xToSig(wx) - SIG_MIN) / (SIG_MAX - SIG_MIN)) * (NX - 1)
    const v = ((yToIm(wy) - IM_MIN) / (IM_MAX - IM_MIN)) * (NY - 1)
    const i0 = Math.max(0, Math.min(NX - 2, Math.floor(u)))
    const j0 = Math.max(0, Math.min(NY - 2, Math.floor(v)))
    const fu = Math.max(0, Math.min(1, u - i0))
    const fv = Math.max(0, Math.min(1, v - j0))
    const h00 = HEIGHT_TABLE[j0 * NX + i0]!
    const h10 = HEIGHT_TABLE[j0 * NX + i0 + 1]!
    const h01 = HEIGHT_TABLE[(j0 + 1) * NX + i0]!
    const h11 = HEIGHT_TABLE[(j0 + 1) * NX + i0 + 1]!
    return (h00 * (1 - fu) + h10 * fu) * (1 - fv) + (h01 * (1 - fu) + h11 * fu) * fv
}

const CRIT_X = sigToX(0.5)
const STRIP_0_X = sigToX(0)
const STRIP_1_X = sigToX(1)

// Harmonic bridge arcs connecting integer sum 1/n^s (left) to prime Euler factors 1/(1 - p^{-s}) (right)
interface BridgeArc {
    readonly pts: Vec[]
    readonly color: string
    readonly speed: number
    readonly phase0: number
}

// Harmonic bridge arcs connecting integer sum 1/n^s (left) to prime Euler factors 1/(1 - p^{-s}) (right),
// curving cleanly in the open band (y = 164..196) BELOW prodEq and ABOVE zetaTwo so zero lines cross equations!
const BRIDGE_ARCS: readonly BridgeArc[] = [
    { x0: -395, x1: 215, y0: 164, y1: 164, lift: 10, col: '#ffd166', speed: 0.34, phase0: 0.05 },
    { x0: -330, x1: 290, y0: 164, y1: 164, lift: 18, col: '#5ce1e6', speed: 0.29, phase0: 0.28 },
    { x0: -265, x1: 375, y0: 164, y1: 164, lift: 25, col: '#a78bfa', speed: 0.31, phase0: 0.52 },
    { x0: -430, x1: 430, y0: 164, y1: 164, lift: 32, col: '#ff6b8b', speed: 0.26, phase0: 0.74 },
    { x0: -200, x1: 240, y0: 164, y1: 164, lift: 4, col: '#6ee7b7', speed: 0.38, phase0: 0.4 },
].map((spec) => {
    const pts: Vec[] = []
    const steps = 42
    for (let i = 0; i <= steps; i++) {
        const u = i / steps
        const x = spec.x0 + (spec.x1 - spec.x0) * u
        const y = spec.y0 + Math.sin(Math.PI * u) * spec.lift
        pts.push([x, y])
    }
    return { pts, color: spec.col, speed: spec.speed, phase0: spec.phase0 }
})

export const landscape: SceneFunction = (s, c) => {
    const ribbonPhase = s.value(0)
    const showBridge = s.value(1)
    const arcGlow = s.value(0)
    const ribbonGrad = linearGradient([-960, 0], [960, 0], ['#1d4ed8', '#5ce1e6', '#a78bfa', '#ffd166'])

    const silkBg = dynamic(() => {
        if (showBridge.value < 0.02) return []
        const a = showBridge.value
        const ph = ribbonPhase.value
        const ag = arcGlow.value
        const nodes: Node[] = []
        // Upper and lower cosmic aurora framing bands cleanly clear of the centered TeX equations!
        const bandYs = [-460, -430, -400, 412, 444, 476]
        for (let bIdx = 0; bIdx < bandYs.length; bIdx++) {
            const by = bandYs[bIdx]!
            const pts: Vec[] = []
            for (let i = 0; i <= 48; i++) {
                const x = -960 + (1920 * i) / 48
                const y = by + Math.sin(x * 0.0038 + ph + bIdx * 0.65) * 16 + Math.cos(x * 0.0021 - ph * 0.7) * 9
                pts.push([x, y])
            }
            nodes.push(new Node(polyPath(pts)).stroke(ribbonGrad, 2.0, 0.24 * a).set('blend', 'screen'))
        }
        // Glowing prime-sieve harmonic arcs linking 1/n^s -> 1/(1 - p^{-s})
        if (ag > 0.02) {
            const aa = a * ag
            for (const arc of BRIDGE_ARCS) {
                nodes.push(
                    new Node(polyPath(arc.pts))
                        .stroke(arc.color, 2.4, 0.36 * aa)
                        .glow(8, arc.color)
                        .set('blend', 'screen'),
                )
                const u = (ph * arc.speed + arc.phase0) % 1
                const idx = Math.min(arc.pts.length - 1, Math.floor(u * (arc.pts.length - 1)))
                const bp = arc.pts[idx]!
                nodes.push(
                    dot(5.2, '#ffffff').at(bp[0], bp[1]).glow(12, arc.color).set('blend', 'screen').opacity(0.92 * aa),
                )
            }
            // Subtle anchor halo around the two halves of Euler's product bridge
            nodes.push(
                circle(160, {
                    fill: radialGradient([0, 0], 160, [
                        [0, '#5ce1e626'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                }).at(-290, 45).set('blend', 'screen').opacity(aa),
                circle(180, {
                    fill: radialGradient([0, 0], 180, [
                        [0, '#ffd1662c'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                }).at(285, 45).set('blend', 'screen').opacity(aa),
            )
        }
        return group(...nodes)
    })

    const eulerTag = txt('EULER’S GOLDEN BRIDGE · 1737', 0, -340, 26, '#ffd166', 'mono')
    const sumEq = tex(String.raw`\zeta(s) = 1 + \frac{1}{2^s} + \frac{1}{3^s} + \frac{1}{4^s} + \cdots`, {
        size: 68,
        color: '#f8f4ec',
    }).at(0, -145).glow(5, '#7c8cff')

    const prodEq = tex(String.raw`\sum_{n=1}^{\infty} \frac{1}{n^s} \;=\; \prod_{p\text{ prime}} \frac{1}{1 - p^{-s}}`, {
        size: 68,
        color: '#ffd166',
    }).at(0, 45).glow(7, '#ffd166')

    const zetaTwo = group(
        tex(String.raw`\zeta(2) = \frac{\pi^2}{6} \approx 1.644934\ldots`, { size: 46, color: '#5ce1e6' }).at(0, 255).glow(5, '#5ce1e6'),
        txt('Every whole number on the left — every prime number on the right', 0, 350, 28, '#9aa8c4', 'sans'),
    )

    const view3d = scene3d({
        theta: -0.78,
        phi: 1.06,
        distance: 15.5,
        unit: 128,
        perspective: true,
        ambient: 0.36,
        shine: 0.28,
        brightness: 1.06,
        fog: 0.12,
        focus: [0, 0, 0.65],
    }).at(160, 40)

    const terrain = surface((wx, wy) => zetaHeight(wx, wy), {
        x: [-WX_HALF, WX_HALF],
        y: [-WY_HALF, WY_HALF],
        resolution: [56, 84],
        colors: ['#060814', '#1b1d52', '#4c2f8a', '#2180c2', '#5ce1e6', '#ffd166'],
        mesh: '#7ce8ff',
        meshOpacity: 0.24,
        meshWidth: 0.72,
        opacity: 0.86,
    })

    // Glowing curve3d tracing |zeta(1/2 + it)| right along the golden critical-line ridge!
    const criticalRidge = curve3d(
        (u): Vec3 => {
            const wy = -WY_HALF + u * (2 * WY_HALF)
            return [CRIT_X, wy, zetaHeight(CRIT_X, wy) + 0.05]
        },
        0,
        1,
        { color: '#ffd166', width: 4.5, glow: 12, blend: 'screen', samples: 120, opacity: 0.98 },
    )

    view3d.add(
        terrain,
        criticalRidge,
        line3d([STRIP_0_X, -WY_HALF, 0.02], [STRIP_0_X, WY_HALF, 0.02], { color: '#6b7aa0', width: 1.8, opacity: 0.6, glow: 4, blend: 'screen' }),
        line3d([STRIP_1_X, -WY_HALF, 0.02], [STRIP_1_X, WY_HALF, 0.02], { color: '#6b7aa0', width: 1.8, opacity: 0.6, glow: 4, blend: 'screen' }),
        line3d([CRIT_X, -WY_HALF, 0.05], [CRIT_X, WY_HALF, 0.05], { color: '#ffd166', width: 5.2, glow: 12, blend: 'screen', opacity: 1 }),
        ...ZETA_ZEROS.slice(0, 5).flatMap((g) => {
            const zy = imToY(g)
            return [
                point3d([CRIT_X, zy, 0.08], { color: '#ffd166', radius: 7, glow: 12, blend: 'screen', halo: 0 }),
                line3d([CRIT_X, zy, 0.08], [CRIT_X, zy, 2.15], { color: '#ffd166', width: 2.6, glow: 10, blend: 'screen', opacity: 0.92 }),
                point3d([CRIT_X, zy, 2.18], { color: '#ffffff', radius: 6, glow: 14, blend: 'screen', halo: 0 }),
            ]
        }),
    )

    const landscapeAura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#4c2f8a28'],
            [0.6, '#2180c214'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(160, 40).set('blend', 'screen')

    const landscapeCopy = group(
        txt('The Complex', -840, -390, 62, '#f8f4ec', 'serif', 'left'),
        txt('Zeta Landscape', -840, -320, 62, '#5ce1e6', 'serif', 'left').glow(6, '#38bdf8'),
        txt('Height = |ζ(a + bi)|', -840, -238, 28, '#9eb0d0', 'mono', 'left'),
        txt('Deep funnels plunge to 0', -840, 340, 30, '#f8f4ec', 'sans', 'left'),
        txt('right along Re(s) = 1/2', -840, 386, 28, '#ffd166', 'sans', 'left'),
    )

    s.add(silkBg, eulerTag, sumEq)
    c.at(0.1, () => s.play(ribbonPhase.to(4.2, { duration: 16, ease: linear })))
    c.show('infinite product over', prodEq)
    c.on('infinite product over', () => s.play(arcGlow.to(1, { duration: 0.7 })))
    c.show('Plug in two', zetaTwo)

    c.on('lifted that sum', () => s.play(showBridge.to(0, { duration: 0.3 })))
    c.swap(
        'lifted that sum',
        [eulerTag, sumEq, prodEq, zetaTwo],
        [landscapeAura, view3d, landscapeCopy],
    )
    c.on('lifted that sum', () => {
        s.play(view3d.orbit({ theta: -0.14, phi: 0.9 }), { duration: 11.5 })
    })
}

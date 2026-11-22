import {
    Node, circle, dynamic, group, line3d, linear, linearGradient, point3d, polyPath, radialGradient,
    scene3d, surface, tex,
    type SceneFunction, type Vec,
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

export const landscape: SceneFunction = (s, c) => {
    const ribbonPhase = s.value(0)
    const showBridge = s.value(1)
    const ribbonGrad = linearGradient([-960, 0], [960, 0], ['#1d4ed8', '#5ce1e6', '#a78bfa', '#ffd166'])

    const silkBg = dynamic(() => {
        if (showBridge.value < 0.02) return []
        const a = showBridge.value
        const ph = ribbonPhase.value
        const nodes: Node[] = []
        for (let k = -4; k <= 4; k++) {
            const pts: Vec[] = []
            for (let i = 0; i <= 48; i++) {
                const x = -960 + (1920 * i) / 48
                const y = k * 48 + Math.sin(x * 0.0038 + ph + k * 0.55) * 44 + Math.cos(x * 0.0021 - ph * 0.7) * 26
                pts.push([x, y])
            }
            const w = 1 - Math.abs(k) / 5.5
            nodes.push(new Node(polyPath(pts)).stroke(ribbonGrad, 1.8, 0.14 * w * a))
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
        resolution: [48, 72],
        colors: ['#060814', '#1b1d52', '#4c2f8a', '#2180c2', '#5ce1e6', '#ffd166'],
        mesh: '#7ce8ff',
        meshOpacity: 0.25,
        meshWidth: 0.75,
        opacity: 0.84,
    })

    view3d.add(
        terrain,
        line3d([STRIP_0_X, -WY_HALF, 0.02], [STRIP_0_X, WY_HALF, 0.02], { color: '#6b7aa0', width: 1.6, opacity: 0.55 }),
        line3d([STRIP_1_X, -WY_HALF, 0.02], [STRIP_1_X, WY_HALF, 0.02], { color: '#6b7aa0', width: 1.6, opacity: 0.55 }),
        line3d([CRIT_X, -WY_HALF, 0.05], [CRIT_X, WY_HALF, 0.05], { color: '#ffd166', width: 5, glow: 10, opacity: 1 }),
        ...ZETA_ZEROS.slice(0, 5).flatMap((g) => {
            const zy = imToY(g)
            return [
                point3d([CRIT_X, zy, 0.08], { color: '#ffd166', radius: 6.5, halo: 0 }),
                line3d([CRIT_X, zy, 0.08], [CRIT_X, zy, 2.05], { color: '#ffd166', width: 2.2, opacity: 0.8 }),
                point3d([CRIT_X, zy, 2.08], { color: '#ffffff', radius: 5.5, halo: 0 }),
            ]
        }),
    )

    const landscapeAura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#4c2f8a22'],
            [0.6, '#2180c210'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(160, 40)

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

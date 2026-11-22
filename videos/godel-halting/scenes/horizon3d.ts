import {
    circle, curve3d, dynamic, group, line3d, linear, point3d, radialGradient, scene3d, surface,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const R_BOUND = 4.3
const ISLAND_R1 = 1.95
const ISLAND_R2 = 2.95

const G_POS: Vec3 = [2.42, 0.72, 1.55]
const G_PRIME_POS: Vec3 = [-2.28, 2.72, 1.68]

const AXIOM_THEOREMS: readonly Vec3[] = [
    [1.12, 0.65, 0.92],
    [-1.2, 0.55, 0.88],
    [0.58, -1.22, 0.85],
    [-0.78, -1.08, 0.86],
    [1.45, -0.35, 0.68],
    [-0.18, 1.48, 0.72],
]

function archipelagoHeight(x: number, y: number): number {
    const r2 = x * x + y * y
    const mainPeak = 1.82 * Math.exp(-r2 / 2.25)
    const ridge = 0.24 * Math.exp(-Math.pow(Math.sqrt(r2) - 1.15, 2) / 0.38) * (0.65 + 0.35 * Math.cos(3 * Math.atan2(y, x)))
    const seaRipple = 0.08 * Math.sin(x * 1.45 + y * 0.85) * Math.cos(y * 1.35 - x * 0.6)
    return 0.14 + mainPeak + ridge + seaRipple
}

export const horizon3d: SceneFunction = (s, c) => {
    const expandProg = s.value(0)

    const aura = circle(580, {
        fill: radialGradient([0, 0], 580, [
            [0, '#38bdf822'],
            [0.55, '#ffd16612'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(185, 30)

    const view3d = scene3d({
        theta: -0.72,
        phi: 1.04,
        distance: 14.8,
        unit: 132,
        perspective: true,
        ambient: 0.38,
        shine: 0.3,
        brightness: 1.08,
        fog: 0.13,
        focus: [0, 0, 0.58],
    }).at(185, 30)

    const terrain = surface((wx, wy) => archipelagoHeight(wx, wy), {
        x: [-R_BOUND, R_BOUND],
        y: [-R_BOUND, R_BOUND],
        resolution: [52, 52],
        colors: ['#060916', '#161b3a', '#1d3b6b', '#2292c7', '#5ce1e6', '#ffd166'],
        mesh: '#7ce8ff',
        meshOpacity: 0.22,
        meshWidth: 0.7,
        opacity: 0.86,
    })

    const shore1 = curve3d(
        (u) => {
            const x = ISLAND_R1 * Math.cos(u)
            const y = ISLAND_R1 * Math.sin(u)
            return [x, y, archipelagoHeight(x, y) + 0.08]
        },
        0,
        Math.PI * 2,
        { samples: 96, color: '#5ce1e6', width: 4, glow: 8, opacity: 0.95 },
    )

    const shore2 = curve3d(
        (u) => {
            const r = ISLAND_R1 + (ISLAND_R2 - ISLAND_R1) * Math.max(0.01, expandProg.value)
            const x = r * Math.cos(u)
            const y = r * Math.sin(u)
            return [x, y, archipelagoHeight(x, y) + 0.1]
        },
        0,
        Math.PI * 2,
        { samples: 96, color: '#ffd166', width: 4.4, glow: 10, opacity: 0.95 },
    )

    view3d.add(
        terrain,
        shore1,
        point3d([0, 0, 2.02], { color: '#ffffff', radius: 7.5, halo: 0 }),
        ...AXIOM_THEOREMS.flatMap((pt) => [
            line3d([0, 0, 1.98], pt, { color: '#5ce1e6', width: 2.2, opacity: 0.78 }),
            point3d(pt, { color: '#5ce1e6', radius: 5.5, halo: 0 }),
        ]),
        // Unprovable beacon G outside the first shoreline
        line3d([G_POS[0], G_POS[1], 0.16], G_POS, { color: '#ffd166', width: 2.8, glow: 6, opacity: 0.92 }),
        point3d(G_POS, { color: '#ffd166', radius: 8.5, halo: 0 }),
    )

    const liveExpanded = dynamic(() => {
        if (expandProg.value < 0.03) return []
        const a = Math.min(1, expandProg.value * 1.4)
        const gPrimeVis = Math.max(0, Math.min(1, (expandProg.value - 0.45) * 2.1))
        const [gx, gy] = view3d.stagePoint(G_POS)
        const [px, py] = view3d.stagePoint(G_PRIME_POS)
        const [ptx, pty] = view3d.stagePoint([G_PRIME_POS[0], G_PRIME_POS[1], G_PRIME_POS[2] + 0.55])
        const nodes = [
            circle(22 + expandProg.value * 16, { fill: null, stroke: '#5ce1e6', width: 2.4 })
                .at(gx, gy)
                .opacity(0.8 * a)
                .glow(6, '#5ce1e6'),
        ]
        if (gPrimeVis > 0.05) {
            nodes.push(
                circle(18 + (1 - gPrimeVis) * 26, { fill: null, stroke: '#ff6b8b', width: 3 })
                    .at(px, py)
                    .opacity(0.95 * gPrimeVis)
                    .glow(10, '#ff6b8b'),
                txt("G'", ptx, pty, 34, '#ff6b8b', 'serif').glow(8, '#ff6b8b').opacity(gPrimeVis),
            )
        }
        return group(...nodes)
    })

    const gBeaconTag = dynamic(() => {
        const [gx, gy] = view3d.stagePoint([G_POS[0], G_POS[1], G_POS[2] + 0.58])
        return txt('G', gx, gy, 34, '#ffd166', 'serif').glow(8, '#ffd166')
    })

    const leftCopy = group(
        txt('The Horizon', -840, -370, 62, '#f8f4ec', 'serif', 'left'),
        txt('of Formal Proof', -840, -300, 62, '#5ce1e6', 'serif', 'left').glow(6, '#38bdf8'),
        txt('Island = Provable in F', -840, -210, 28, '#5ce1e6', 'mono', 'left'),
        txt('Ocean  = True statements', -840, -162, 28, '#ffd166', 'mono', 'left'),
    )

    const beat0Note = group(
        txt('G floats beyond the shore', -840, 315, 32, '#ffd166', 'sans', 'left').glow(5, '#ffd166'),
        txt('True, yet unreachable in F', -840, 365, 28, '#b5c1d8', 'sans', 'left'),
    )

    const beat1Note = group(
        txt('Add G as a new axiom → F + G', -840, 315, 30, '#5ce1e6', 'sans', 'left').glow(5, '#38bdf8'),
        txt("A fresh G' appears past the shore", -840, 365, 28, '#ff6b8b', 'sans', 'left'),
    )

    s.add(aura, view3d, gBeaconTag, liveExpanded, leftCopy, beat0Note)
    c.at(0.1, () => s.play(view3d.orbit({ theta: 0.42, phi: 0.92 }), { duration: 24.0 }))
    c.on('add G as a brand-new axiom', () => {
        view3d.add(
            shore2,
            line3d([0, 0, 1.98], G_POS, { color: '#ffd166', width: 2.2, opacity: 0.7 }),
            line3d([G_PRIME_POS[0], G_PRIME_POS[1], 0.16], G_PRIME_POS, { color: '#ff6b8b', width: 2.8, glow: 8, opacity: 0.95 }),
            point3d(G_PRIME_POS, { color: '#ff6b8b', radius: 8.5, halo: 0 }),
        )
        s.play(expandProg.to(1, { duration: 4.2, ease: linear }))
    })
    c.swap('add G as a brand-new axiom', beat0Note, beat1Note)
}

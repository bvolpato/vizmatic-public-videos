import {
    Node, circle, dot, dynamic, group, linearGradient, polyPath, radialGradient,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { SHEAR_VORTICES, traceStreamline } from '../math'
import { txt } from '../../../factory/style'

const CX = 335
const CY = 10
const SCALE_X = 148
const SCALE_Y = 148

// Precompute Kelvin-Helmholtz vortex streamlines on the right half
const KH_SEEDS = [-1.95, -1.45, -1.0, -0.58, -0.22, 0.22, 0.58, 1.0, 1.45, 1.95] as const
const KH_STREAMS: Vec[][] = KH_SEEDS.map((y0) => {
    const raw = traceStreamline(-3.1, y0, 115, 0.024, SHEAR_VORTICES, 0.35, 0.9, 2.35)
    return raw.map(([px, py]) => [CX + px * SCALE_X, CY - py * SCALE_Y] as Vec)
})

const CORE_SPIRALS: Vec[][] = SHEAR_VORTICES.flatMap((vt) =>
    [0, 1, 2].map((k) => {
        const ang0 = (2 * Math.PI * k) / 3
        const raw = traceStreamline(
            vt.x + 0.24 * Math.cos(ang0),
            vt.y + 0.24 * Math.sin(ang0),
            56,
            0.048,
            [vt],
            0,
        )
        return raw.map(([px, py], i) => {
            const grow = 1 + 0.012 * i
            return [CX + (vt.x + (px - vt.x) * grow) * SCALE_X, CY - (vt.y + (py - vt.y) * grow) * SCALE_Y] as Vec
        })
    }),
)

export const intro: IntroFunction = (stage, clock) => {
    const streamGrad = linearGradient([CX - 420, CY], [CX + 420, CY], ['#5ce1e6', '#7c8cff', '#ff6b8b', '#ffd166'])
    const prog = stage.value(0.58)

    stage.add(
        circle(560, {
            fill: radialGradient([0, 0], 560, [
                [0, '#ff6b8b28'],
                [0.45, '#4c2f8a18'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY),
        txt('$1,000,000  MILLENNIUM PRIZE #2', -840, -195, 26, '#ffd166', 'mono', 'left'),
        txt('Navier-Stokes', -848, -72, 116, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Turbulence', -848, 56, 116, '#6be8f2', 'serif', 'left').glow(8, '#38bdf8'),
        txt('Why smooth fluid breaks mathematics', -840, 178, 34, '#b8c5df', 'sans', 'left'),
        dynamic(() => {
            const p = prog.value
            const nodes: Node[] = []
            for (const pts of KH_STREAMS) {
                const count = Math.max(2, Math.floor(p * pts.length))
                const sub = pts.slice(0, count)
                nodes.push(new Node(polyPath(sub)).stroke(streamGrad, 2.8, 0.82).glow(6, '#5ce1e6'))
            }
            for (const sp of CORE_SPIRALS) {
                const count = Math.max(2, Math.floor(p * sp.length))
                nodes.push(new Node(polyPath(sp.slice(0, count))).stroke('#ffd166', 3.2, 0.9).glow(8, '#ff6b8b'))
            }
            for (const vt of SHEAR_VORTICES) {
                nodes.push(dot(6, '#ffffff').at(CX + vt.x * SCALE_X, CY - vt.y * SCALE_Y).glow(14, '#ffd166'))
            }
            return group(...nodes)
        }),
    )
    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

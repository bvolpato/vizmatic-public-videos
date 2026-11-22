import {
    Node, circle, contourPaths, dot, dynamic, group, linearGradient, polyPath, radialGradient,
    scalarField,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import {
    SHEAR_VORTICES,
    traceFullStreamline,
    traceStreamline,
    vortexStreamfunction,
    vortexVorticity,
} from '../math'
import { txt } from '../../../factory/style'

const CX = 345
const CY = 10
const SCALE_X = 148
const SCALE_Y = 148
const X_MIN = -3.4
const X_MAX = 3.8
const Y_MIN = -2.6
const Y_MAX = 2.6

// Full-width continuous RK4 streamlines (ZERO mid-air cutoffs!)
const KH_SEEDS = [-2.05, -1.55, -1.08, -0.62, -0.22, 0.22, 0.62, 1.08, 1.55, 2.05] as const
const KH_STREAMS: Vec[][] = KH_SEEDS.map((y0) => {
    const raw = traceFullStreamline(X_MIN, y0, X_MAX, 130, SHEAR_VORTICES, 0.35, 0.9, 2.45)
    return raw.map(([px, py]) => [CX + px * SCALE_X, CY - py * SCALE_Y] as Vec)
})

const CORE_SPIRALS: Vec[][] = SHEAR_VORTICES.flatMap((vt) =>
    [0, 1, 2].map((k) => {
        const ang0 = (2 * Math.PI * k) / 3
        const raw = traceStreamline(
            vt.x + 0.22 * Math.cos(ang0),
            vt.y + 0.22 * Math.sin(ang0),
            64,
            0.048,
            [vt],
            0,
        )
        return raw.map(([px, py], i) => {
            const grow = 1 + 0.011 * i
            return [CX + (vt.x + (px - vt.x) * grow) * SCALE_X, CY - (vt.y + (py - vt.y) * grow) * SCALE_Y] as Vec
        })
    }),
)

// Luminous fluid tracer streaks advected cleanly along local velocity vectors
const TRACER_STREAKS: { pts: Vec[]; col: string }[] = Array.from({ length: 28 }, (_, i) => {
    const sx = X_MIN + 0.35 + ((i * 1.73) % (X_MAX - X_MIN - 0.9))
    const sy = -1.95 + ((i * 0.97) % 3.9)
    const raw = traceStreamline(sx, sy, 14, 0.022, SHEAR_VORTICES, 0.35, 0.9, 2.45)
    const w = vortexVorticity(sx, sy, SHEAR_VORTICES, 0.35, 0.9)
    const col = w > 0.4 ? '#ffd166' : w < -0.4 ? '#5ce1e6' : '#a78bfa'
    return {
        pts: raw.map(([px, py]) => [CX + px * SCALE_X, CY - py * SCALE_Y] as Vec),
        col,
    }
})

// Streamfunction isolines (exact Kelvin-Helmholtz cat's-eyes + continuous outer streamlines!)
const PSI_CONTOURS = contourPaths(
    (x, y) => vortexStreamfunction(x, y, SHEAR_VORTICES, 0.35, 0.9, 2.45),
    {
        x: [X_MIN, X_MAX],
        y: [Y_MIN, Y_MAX],
        levels: [-4.6, -3.4, -2.2, -1.1, -0.25, 0.25, 1.1, 2.2, 3.4, 4.6],
        resolution: [68, 48],
    },
)

function featheredVorticity(x: number, y: number): number {
    const nx = (x - (X_MIN + X_MAX) * 0.5) / ((X_MAX - X_MIN) * 0.5)
    const ny = (y - (Y_MIN + Y_MAX) * 0.5) / ((Y_MAX - Y_MIN) * 0.5)
    const edge = Math.max(0, 1 - Math.pow(nx * nx * 0.72 + ny * ny * 0.82, 1.45))
    return vortexVorticity(x, y, SHEAR_VORTICES, 0.35, 0.9) * edge
}

export const intro: IntroFunction = (stage, clock) => {
    const streamGrad = linearGradient([CX + X_MIN * SCALE_X, CY], [CX + X_MAX * SCALE_X, CY], ['#5ce1e6', '#7c8cff', '#ff6b8b', '#ffd166'])
    const prog = stage.value(0.68)

    const fw = (X_MAX - X_MIN) * SCALE_X
    const fh = (Y_MAX - Y_MIN) * SCALE_Y
    const fcx = CX + ((X_MIN + X_MAX) * 0.5) * SCALE_X
    const fcy = CY - ((Y_MIN + Y_MAX) * 0.5) * SCALE_Y

    const vortField = scalarField((x, y) => featheredVorticity(x, y), {
        x: [X_MIN, X_MAX],
        y: [Y_MIN, Y_MAX],
        domain: [-3.2, 3.2],
        colors: ['#5ce1e6dd', '#2563ebbb', '#1e1b5255', '#07091000', '#581c5e58', '#ff4d8dcc', '#ffd166ee'],
        width: fw,
        height: fh,
        resolution: [104, 72],
    }).at(fcx, fcy).set('blend', 'screen').opacity(0.9)

    const psiNodes: Node[] = []
    PSI_CONTOURS.forEach((lvl, li) => {
        const col = li % 2 === 0 ? '#5ce1e6' : '#a78bfa'
        for (const poly of lvl.paths) {
            if (poly.length < 2) continue
            const pts: Vec[] = poly.map(([x, y]) => [CX + x * SCALE_X, CY - y * SCALE_Y] as Vec)
            psiNodes.push(new Node(polyPath(pts)).stroke(col, 1.3, 0.24).set('blend', 'screen'))
        }
    })

    stage.add(
        vortField,
        ...psiNodes,
        circle(560, {
            fill: radialGradient([0, 0], 560, [
                [0, '#ff6b8b28'],
                [0.45, '#4c2f8a18'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY).set('blend', 'screen'),
        txt('$1,000,000  MILLENNIUM PRIZE #2', -840, -195, 26, '#ffd166', 'mono', 'left'),
        txt('Navier-Stokes', -848, -72, 116, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Turbulence', -848, 56, 116, '#6be8f2', 'serif', 'left').glow(8, '#38bdf8'),
        txt('Why smooth fluid breaks mathematics', -840, 178, 34, '#b8c5df', 'sans', 'left'),
        dynamic(() => {
            const p = prog.value
            const nodes: Node[] = []
            for (const st of TRACER_STREAKS) {
                nodes.push(new Node(polyPath(st.pts)).stroke(st.col, 2.2, 0.58 * p).glow(7, st.col).set('blend', 'screen'))
            }
            for (const pts of KH_STREAMS) {
                nodes.push(
                    new Node(polyPath(pts)).stroke(streamGrad, 3.0, 0.86 * p).glow(8, '#5ce1e6').set('blend', 'screen'),
                    new Node(polyPath(pts)).stroke('#ffffff', 0.9, 0.26 * p),
                )
            }
            for (const sp of CORE_SPIRALS) {
                const count = Math.max(2, Math.floor(p * sp.length))
                nodes.push(new Node(polyPath(sp.slice(0, count))).stroke('#ffd166', 3.2, 0.92).glow(10, '#ff6b8b').set('blend', 'screen'))
            }
            for (const vt of SHEAR_VORTICES) {
                const vx = CX + vt.x * SCALE_X
                const vy = CY - vt.y * SCALE_Y
                const col = vt.gamma > 0 ? '#ffd166' : '#5ce1e6'
                nodes.push(
                    circle(18, { fill: null, stroke: col, width: 2.2 }).at(vx, vy).opacity(0.8).glow(8, col).set('blend', 'screen'),
                    dot(6.5, '#ffffff').at(vx, vy).glow(15, col).set('blend', 'screen'),
                )
            }
            return group(...nodes)
        }),
    )
    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

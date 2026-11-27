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

// Full-bleed edge-to-edge IMAX fluid river spanning all 1920 pixels + monumental centered title above
const CX = 0
const CY = 128
const SCALE_X = 186
const SCALE_Y = 120
const X_MIN = -5.4
const X_MAX = 5.4
const Y_MIN = -2.2
const Y_MAX = 2.2

const KH_SEEDS = [-1.8, -1.38, -0.96, -0.54, -0.16, 0.16, 0.54, 0.96, 1.38, 1.8] as const
const KH_STREAMS: Vec[][] = KH_SEEDS.map((y0) => {
    const raw = traceFullStreamline(X_MIN, y0, X_MAX, 160, SHEAR_VORTICES, 0.35, 0.9, 2.45)
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

const TRACER_STREAKS: { pts: Vec[]; col: string }[] = Array.from({ length: 36 }, (_, i) => {
    const sx = X_MIN + 0.4 + ((i * 2.17) % (X_MAX - X_MIN - 0.9))
    const sy = -1.85 + ((i * 0.97) % 3.7)
    const raw = traceStreamline(sx, sy, 14, 0.022, SHEAR_VORTICES, 0.35, 0.9, 2.45)
    const w = vortexVorticity(sx, sy, SHEAR_VORTICES, 0.35, 0.9)
    const col = w > 0.4 ? '#ffd166' : w < -0.4 ? '#5ce1e6' : '#a78bfa'
    return {
        pts: raw.map(([px, py]) => [CX + px * SCALE_X, CY - py * SCALE_Y] as Vec),
        col,
    }
})

const PSI_CONTOURS = contourPaths(
    (x, y) => vortexStreamfunction(x, y, SHEAR_VORTICES, 0.35, 0.9, 2.45),
    {
        x: [X_MIN, X_MAX],
        y: [Y_MIN, Y_MAX],
        levels: [-4.6, -3.4, -2.2, -1.1, -0.25, 0.25, 1.1, 2.2, 3.4, 4.6],
        resolution: [82, 48],
    },
)

function featheredVorticity(x: number, y: number): number {
    const nx = x / X_MAX
    const ny = y / Y_MAX
    const edge = Math.max(0, 1 - Math.pow(nx * nx * 0.65 + ny * ny * 0.88, 1.5))
    return vortexVorticity(x, y, SHEAR_VORTICES, 0.35, 0.9) * edge
}

export const poster: IntroFunction = (stage, clock) => {
    const streamGrad = linearGradient([-960, CY], [960, CY], ['#5ce1e6', '#7c8cff', '#ff6b8b', '#ffd166'])
    const prog = stage.value(0.68)

    const fw = (X_MAX - X_MIN) * SCALE_X
    const fh = (Y_MAX - Y_MIN) * SCALE_Y

    const vortField = scalarField((x, y) => featheredVorticity(x, y), {
        x: [X_MIN, X_MAX],
        y: [Y_MIN, Y_MAX],
        domain: [-3.2, 3.2],
        colors: ['#5ce1e6dd', '#2563ebbb', '#1e1b5255', '#07091000', '#581c5e58', '#ff4d8dcc', '#ffd166ee'],
        width: fw,
        height: fh,
        resolution: [120, 68],
    }).at(CX, CY).set('blend', 'screen').opacity(0.92)

    const psiNodes: Node[] = []
    PSI_CONTOURS.forEach((lvl, li) => {
        const col = li % 2 === 0 ? '#5ce1e6' : '#a78bfa'
        for (const poly of lvl.paths) {
            if (poly.length < 2) continue
            const pts: Vec[] = poly.map(([x, y]) => [CX + x * SCALE_X, CY - y * SCALE_Y] as Vec)
            psiNodes.push(new Node(polyPath(pts)).stroke(col, 1.3, 0.24).set('blend', 'screen'))
        }
    })

    const titleCradle = circle(680, {
        fill: radialGradient([0, 0], 680, [
            [0, '#070910e0'],
            [0.55, '#07091090'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(0, -320)

    stage.add(
        vortField,
        ...psiNodes,
        circle(620, {
            fill: radialGradient([0, 0], 620, [
                [0, '#ff6b8b28'],
                [0.45, '#4c2f8a18'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY).set('blend', 'screen'),
        dynamic(() => {
            const p = prog.value
            const nodes: Node[] = []
            for (const st of TRACER_STREAKS) {
                nodes.push(new Node(polyPath(st.pts)).stroke(st.col, 2.2, 0.58 * p).glow(7, st.col).set('blend', 'screen'))
            }
            for (const pts of KH_STREAMS) {
                nodes.push(
                    new Node(polyPath(pts)).stroke(streamGrad, 3.2, 0.88 * p).glow(8, '#5ce1e6').set('blend', 'screen'),
                    new Node(polyPath(pts)).stroke('#ffffff', 0.9, 0.28 * p),
                )
            }
            for (const sp of CORE_SPIRALS) {
                const count = Math.max(2, Math.floor(p * sp.length))
                nodes.push(new Node(polyPath(sp.slice(0, count))).stroke('#ffd166', 3.4, 0.94).glow(10, '#ff6b8b').set('blend', 'screen'))
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
        titleCradle,
        txt('$1,000,000', 0, -396, 82, '#ffd166', 'mono', 'center').glow(12, '#ffd166'),
        txt('Navier-Stokes Turbulence', 0, -282, 102, '#f8f4ec', 'serif', 'center').glow(9, '#5ce1e6'),
        txt('MILLENNIUM PRIZE #2   ·   WHY SMOOTH FLUID BREAKS MATH', 0, 424, 26, '#cbd5e8', 'mono', 'center'),
    )
    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

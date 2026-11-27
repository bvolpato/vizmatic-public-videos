import {
    Node, circle, contourPaths, dot, dynamic, group, linear, linearGradient, polyPath,
    radialGradient, scalarField,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import {
    SHEAR_VORTICES,
    traceFullStreamline,
    traceStreamline,
    vortexStreamfunction,
    vortexVorticity,
} from '../math'
import { txt } from '../../../factory/style'

// Full-bleed edge-to-edge Kelvin-Helmholtz fluid river across all 1920 pixels + monumental centered Millennium title above
const CX = 0
const CY = 128
const SX = 186
const SY = 120
const X_MIN = -5.4
const X_MAX = 5.4
const Y_MIN = -2.2
const Y_MAX = 2.2
const SAMPLES = 160

const Y_SEEDS = [-1.8, -1.42, -1.04, -0.66, -0.32, -0.04, 0.24, 0.56, 0.94, 1.34, 1.76] as const

interface MorphStream {
    readonly laminar: Vec[]
    readonly curled: Vec[]
    readonly isInner: boolean
}

const MORPH_STREAMS: readonly MorphStream[] = Y_SEEDS.map((y0) => {
    const rawCurled = traceFullStreamline(X_MIN, y0, X_MAX, SAMPLES, SHEAR_VORTICES, 0.35, 0.9, 2.45)
    const curled: Vec[] = rawCurled.map(([px, py]) => [CX + px * SX, CY - py * SY] as Vec)
    const laminar: Vec[] = Array.from({ length: SAMPLES }, (_, i) => {
        const px = X_MIN + ((X_MAX - X_MIN) * i) / (SAMPLES - 1)
        return [CX + px * SX, CY - y0 * SY] as Vec
    })
    return { laminar, curled, isInner: Math.abs(y0) < 0.9 }
})

const VORTEX_EYES: Vec[][] = SHEAR_VORTICES.flatMap((vt) =>
    [0, 1, 2, 3].map((k) => {
        const ang = (2 * Math.PI * k) / 4
        const raw = traceStreamline(
            vt.x + 0.22 * Math.cos(ang),
            vt.y + 0.22 * Math.sin(ang),
            62,
            0.048,
            [vt],
            0,
        )
        return raw.map(([px, py], i) => {
            const grow = 1 + 0.011 * i
            return [CX + (vt.x + (px - vt.x) * grow) * SX, CY - (vt.y + (py - vt.y) * grow) * SY] as Vec
        })
    }),
)

const STREAK_SEEDS: { pts: Vec[]; col: string; phase0: number }[] = Array.from({ length: 40 }, (_, i) => {
    const sx = X_MIN + 0.35 + ((i * 2.13) % (X_MAX - X_MIN - 0.85))
    const sy = -1.85 + ((i * 1.13) % 3.7)
    const raw = traceStreamline(sx, sy, 16, 0.022, SHEAR_VORTICES, 0.35, 0.9, 2.45)
    const w = vortexVorticity(sx, sy, SHEAR_VORTICES, 0.35, 0.9)
    const col = w > 0.35 ? '#ffd166' : w < -0.35 ? '#5ce1e6' : '#ff6b8b'
    return {
        pts: raw.map(([px, py]) => [CX + px * SX, CY - py * SY] as Vec),
        col,
        phase0: (i * 0.23) % 1,
    }
})

const SHOT1_CONTOURS = contourPaths(
    (x, y) => vortexStreamfunction(x, y, SHEAR_VORTICES, 0.35, 0.9, 2.45),
    {
        x: [X_MIN, X_MAX],
        y: [Y_MIN, Y_MAX],
        levels: [-4.8, -3.5, -2.2, -1.05, -0.25, 0.25, 1.05, 2.2, 3.5, 4.8],
        resolution: [84, 50],
    },
)

function featheredVort1(x: number, y: number): number {
    const nx = x / X_MAX
    const ny = y / Y_MAX
    const edge = Math.max(0, 1 - Math.pow(nx * nx * 0.65 + ny * ny * 0.88, 1.45))
    return vortexVorticity(x, y, SHEAR_VORTICES, 0.35, 0.9) * edge
}

const WIDE_STREAMS: Vec[][] = [-2.25, -1.6, -1.0, -0.45, 0.0, 0.45, 1.0, 1.6, 2.25].map((y0) => {
    const raw = traceFullStreamline(-5.3, y0, 5.3, 155, SHEAR_VORTICES, 0.35, 0.95, 2.5)
    return raw.map(([px, py]) => [px * 185, -py * 114] as Vec)
})

function featheredVort2(x: number, y: number): number {
    const nx = x / 5.3
    const ny = y / 3.2
    const edge = Math.max(0, 1 - Math.pow(nx * nx * 0.85 + ny * ny * 0.85, 1.5))
    return vortexVorticity(x, y, SHEAR_VORTICES, 0.35, 0.95) * edge
}

export const hook: SceneFunction = (s, c) => {
    const curlAmt = s.value(0.76)
    const flowPhase = s.value(0)
    const showShot1 = s.value(1)
    const showShot2 = s.value(0)
    const shot2Phase = s.value(0)

    const khGrad = linearGradient([-960, CY], [960, CY], ['#5ce1e6', '#60a5fa', '#ff6b8b', '#ffd166'])
    const wideGrad = linearGradient([-920, 0], [920, 0], ['#5ce1e6', '#7c8cff', '#ff6b8b', '#ffd166'])

    const fw1 = (X_MAX - X_MIN) * SX
    const fh1 = (Y_MAX - Y_MIN) * SY

    const shot1Field = scalarField((x, y) => featheredVort1(x, y), {
        x: [X_MIN, X_MAX],
        y: [Y_MIN, Y_MAX],
        domain: [-3.2, 3.2],
        colors: ['#5ce1e6dd', '#2563ebbb', '#1e1b5255', '#07091000', '#581c5e58', '#ff4d8dcc', '#ffd166ee'],
        width: fw1,
        height: fh1,
        resolution: [124, 72],
    }).at(CX, CY).set('blend', 'screen').opacity(0.92)

    const shot1Contours = group(
        ...SHOT1_CONTOURS.flatMap((lvl, li) => {
            const col = li % 2 === 0 ? '#5ce1e6' : '#a78bfa'
            return lvl.paths
                .filter((poly) => poly.length >= 2)
                .map((poly) => {
                    const pts: Vec[] = poly.map(([x, y]) => [CX + x * SX, CY - y * SY] as Vec)
                    return new Node(polyPath(pts)).stroke(col, 1.35, 0.24).set('blend', 'screen')
                })
        }),
    )

    const shot2Field = scalarField((x, y) => featheredVort2(x, y), {
        x: [-5.3, 5.3],
        y: [-3.2, 3.2],
        domain: [-4.0, 4.0],
        colors: ['#5ce1e685', '#1d6fa57a', '#151c4426', '#07091000', '#3d194832', '#ff4d8d88', '#ffd16698'],
        width: 1920,
        height: 920,
        resolution: [112, 64],
    }).at(0, 0).set('blend', 'screen').opacity(0.58)

    // Monumental Centered IMAX Millennium Title over soft atmospheric dark cradle
    const shot1Title = group(
        circle(720, {
            fill: radialGradient([0, 0], 720, [
                [0, '#070910e6'],
                [0.52, '#07091096'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(0, -325),
        txt('$1,000,000', 0, -396, 84, '#ffd166', 'mono', 'center').glow(12, '#ffd166'),
        txt('Navier-Stokes Turbulence', 0, -282, 102, '#f8f4ec', 'serif', 'center').glow(9, '#5ce1e6'),
        txt('MILLENNIUM PRIZE #2   ·   WHY SMOOTH FLUID BREAKS MATH', 0, 424, 26, '#cbd5e8', 'mono', 'center'),
    )

    const liveShot1 = dynamic(() => {
        if (showShot1.value < 0.02) return []
        const a = showShot1.value
        const u = curlAmt.value
        const ph = flowPhase.value
        const nodes: Node[] = [
            circle(640, {
                fill: radialGradient([0, 0], 640, [
                    [0, '#ff6b8b2e'],
                    [0.45, '#4c2f8a1e'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).set('blend', 'screen').opacity(a),
        ]

        for (const st of STREAK_SEEDS) {
            const shimmer = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(ph * 2.4 + st.phase0 * Math.PI * 2))
            nodes.push(
                new Node(polyPath(st.pts))
                    .stroke(st.col, 2.2, shimmer * u * a)
                    .glow(8, st.col)
                    .set('blend', 'screen'),
            )
        }

        for (let si = 0; si < MORPH_STREAMS.length; si++) {
            const st = MORPH_STREAMS[si]!
            const pts: Vec[] = st.laminar.map((p, i) => {
                const q = st.curled[i]!
                const wave = Math.sin(i * 0.14 - ph * 2.4 + si) * (4 + 9 * u)
                return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u + wave] as Vec
            })
            const col = st.isInner ? khGrad : '#5ce1e6'
            const w = st.isInner ? 4.2 : 2.4
            nodes.push(
                new Node(polyPath(pts))
                    .stroke(col, w, (st.isInner ? 0.96 : 0.68) * a)
                    .glow(st.isInner ? 10 : 6, st.isInner ? '#ff6b8b' : '#38bdf8')
                    .set('blend', 'screen'),
            )
            if (st.isInner) {
                nodes.push(new Node(polyPath(pts)).stroke('#ffffff', 1.1, 0.36 * a))
            }
            const beadIdx = Math.floor((ph * 28 + si * 13) % (pts.length - 1))
            const bp = pts[beadIdx]!
            nodes.push(
                dot(st.isInner ? 5.8 : 3.8, '#ffffff')
                    .at(bp[0], bp[1])
                    .glow(12, st.isInner ? '#ffd166' : '#5ce1e6')
                    .set('blend', 'screen')
                    .opacity(a),
            )
        }

        if (u > 0.2) {
            const eyeOp = Math.min(1, (u - 0.2) / 0.5) * a
            for (const sp of VORTEX_EYES) {
                nodes.push(new Node(polyPath(sp)).stroke('#ffd166', 3.2, 0.88 * eyeOp).glow(10, '#ff6b8b').set('blend', 'screen'))
            }
            for (const vt of SHEAR_VORTICES) {
                const vx = CX + vt.x * SX
                const vy = CY - vt.y * SY
                const col = vt.gamma > 0 ? '#ffd166' : '#5ce1e6'
                const rPulse = 20 + ((ph * 0.7) % 1) * 66
                nodes.push(
                    circle(rPulse, { fill: null, stroke: col, width: 2.2 })
                        .at(vx, vy)
                        .opacity((1 - ((ph * 0.7) % 1)) * 0.7 * eyeOp)
                        .glow(8, col)
                        .set('blend', 'screen'),
                    dot(7.5, '#ffffff').at(vx, vy).glow(16, col).set('blend', 'screen').opacity(eyeOp),
                )
            }
        }
        return group(...nodes)
    })

    const shot2Caption = group(
        txt('Smooth forever —', 0, -350, 68, '#5ce1e6', 'serif').glow(8, '#38bdf8'),
        txt('or explode to infinite speed in finite time?', 0, 365, 38, '#ffd166', 'serif').glow(6, '#ffd166'),
    )

    const liveShot2 = dynamic(() => {
        if (showShot2.value < 0.02) return []
        const a = showShot2.value
        const ph = shot2Phase.value
        const nodes: Node[] = [
            circle(540, {
                fill: radialGradient([0, 0], 540, [
                    [0, '#ffd1662c'],
                    [0.5, '#ff6b8b1a'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, 0).set('blend', 'screen').opacity(a),
        ]
        for (let si = 0; si < WIDE_STREAMS.length; si++) {
            const raw = WIDE_STREAMS[si]!
            const pts: Vec[] = raw.map(([x, y], i) => [x, y + Math.sin(i * 0.12 - ph * 2.5 + si) * 10] as Vec)
            nodes.push(
                new Node(polyPath(pts)).stroke(wideGrad, 3.8, 0.9 * a).glow(10, '#a78bfa').set('blend', 'screen'),
                new Node(polyPath(pts)).stroke('#ffffff', 1.1, 0.34 * a),
            )
        }
        for (const vt of SHEAR_VORTICES) {
            const vx = vt.x * 185
            const vy = -vt.y * 114
            const col = vt.gamma > 0 ? '#ffd166' : '#5ce1e6'
            nodes.push(
                circle(22 + Math.sin(ph * 3 + vt.x) * 6, { fill: null, stroke: col, width: 2.6 })
                    .at(vx, vy)
                    .opacity(0.92 * a)
                    .glow(10, col)
                    .set('blend', 'screen'),
                dot(7, '#ffffff').at(vx, vy).glow(16, col).set('blend', 'screen').opacity(a),
            )
        }
        return group(...nodes)
    })

    s.add(shot1Field, shot1Contours, liveShot1, shot1Title)
    c.at(0.05, () => s.play(curlAmt.to(1.0, { duration: 3.6 })))
    c.at(0.05, () => s.play(flowPhase.to(8.5, { duration: 10.5, ease: linear })))

    c.on('stay smooth forever', () => {
        s.play(showShot1.to(0, { duration: 0.25 }), showShot2.to(1, { duration: 0.3 }))
    })
    c.on('stay smooth forever', () => {
        s.play(shot2Phase.to(4.2, { duration: 3.4, ease: linear }))
    })
    c.swap('stay smooth forever', [shot1Title, shot1Field, shot1Contours], [shot2Field, shot2Caption])
    s.add(liveShot2)
}

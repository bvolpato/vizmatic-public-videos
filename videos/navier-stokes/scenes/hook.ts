import {
    Node, circle, dot, dynamic, group, linear, linearGradient, polyPath, radialGradient,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { SHEAR_VORTICES, traceStreamline } from '../math'
import { txt } from '../../../factory/style'

// Precompute smooth laminar streamlines and curled Kelvin-Helmholtz vortex streamlines
// so we can morph seamlessly from glassy laminar cyan into exploding magenta/gold vortices!
const CX = 395
const CY = 10
const SX = 138
const SY = 148
const STEPS = 110

const Y_SEEDS = [-2.1, -1.65, -1.2, -0.78, -0.4, -0.1, 0.1, 0.4, 0.78, 1.2, 1.65, 2.1] as const

interface MorphStream {
    readonly laminar: Vec[]
    readonly curled: Vec[]
    readonly isInner: boolean
}

const MORPH_STREAMS: readonly MorphStream[] = Y_SEEDS.map((y0) => {
    const rawCurled = traceStreamline(-3.2, y0, STEPS, 0.025, SHEAR_VORTICES, 0.35, 0.9, 2.35)
    const curled: Vec[] = rawCurled.map(([px, py]) => [CX + px * SX, CY - py * SY] as Vec)
    const laminar: Vec[] = rawCurled.map((_, i) => {
        const px = -3.2 + (6.4 * i) / STEPS
        return [CX + px * SX, CY - y0 * SY] as Vec
    })
    return { laminar, curled, isInner: Math.abs(y0) < 0.95 }
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

// Shot 2: Full-bleed luminous vortex streamlines across entire 1920x1080 canvas
const WIDE_STREAMS: Vec[][] = [-2.2, -1.55, -0.95, -0.42, 0.0, 0.42, 0.95, 1.55, 2.2].map((y0) => {
    const raw = traceStreamline(-4.6, y0, 150, 0.025, SHEAR_VORTICES, 0.35, 0.95, 2.45)
    return raw.map(([px, py]) => [px * 185, -py * 138] as Vec)
})

export const hook: SceneFunction = (s, c) => {
    const curlAmt = s.value(0.58)
    const flowPhase = s.value(0)
    const showShot1 = s.value(1)
    const showShot2 = s.value(0)
    const shot2Phase = s.value(0)

    const khGrad = linearGradient([CX - 460, CY], [CX + 460, CY], ['#5ce1e6', '#60a5fa', '#ff6b8b', '#ffd166'])
    const wideGrad = linearGradient([-860, 0], [860, 0], ['#5ce1e6', '#7c8cff', '#ff6b8b', '#ffd166'])

    const shot1Title = group(
        txt('$1,000,000', -840, -175, 92, '#ffd166', 'mono', 'left').glow(10, '#ffd166'),
        txt('Navier-Stokes', -848, -32, 102, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Turbulence', -848, 84, 102, '#6be8f2', 'serif', 'left').glow(8, '#38bdf8'),
        txt('Millennium Prize #2', -840, 206, 34, '#cbd5e8', 'sans', 'left'),
    )

    const liveShot1 = dynamic(() => {
        if (showShot1.value < 0.02) return []
        const a = showShot1.value
        const u = curlAmt.value
        const ph = flowPhase.value
        const nodes: Node[] = [
            circle(540, {
                fill: radialGradient([0, 0], 540, [
                    [0, '#ff6b8b26'],
                    [0.45, '#4c2f8a18'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).opacity(a),
        ]

        for (let si = 0; si < MORPH_STREAMS.length; si++) {
            const st = MORPH_STREAMS[si]!
            const pts: Vec[] = st.laminar.map((p, i) => {
                const q = st.curled[i]!
                const wave = Math.sin(i * 0.14 - ph * 2.4 + si) * (6 + 12 * u)
                return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u + wave] as Vec
            })
            const col = st.isInner ? khGrad : '#5ce1e6'
            const w = st.isInner ? 3.8 : 2.3
            nodes.push(
                new Node(polyPath(pts)).stroke(col, w, (st.isInner ? 0.94 : 0.62) * a).glow(st.isInner ? 9 : 5, st.isInner ? '#ff6b8b' : '#38bdf8'),
            )
            // Bright glowing tracer bead riding each streamline
            const beadIdx = Math.floor(((ph * 26 + si * 13) % (pts.length - 1)))
            const bp = pts[beadIdx]!
            nodes.push(dot(st.isInner ? 5.2 : 3.6, '#ffffff').at(bp[0], bp[1]).glow(10, st.isInner ? '#ffd166' : '#5ce1e6').opacity(a))
        }

        if (u > 0.2) {
            const eyeOp = Math.min(1, (u - 0.2) / 0.5) * a
            for (const sp of VORTEX_EYES) {
                nodes.push(new Node(polyPath(sp)).stroke('#ffd166', 2.8, 0.78 * eyeOp).glow(8, '#ff6b8b'))
            }
            for (const vt of SHEAR_VORTICES) {
                const vx = CX + vt.x * SX
                const vy = CY - vt.y * SY
                const rPulse = 18 + ((ph * 0.7) % 1) * 55
                nodes.push(
                    circle(rPulse, { fill: null, stroke: '#ffd166', width: 2 }).at(vx, vy).opacity((1 - ((ph * 0.7) % 1)) * 0.6 * eyeOp),
                    dot(6.5, '#ffffff').at(vx, vy).glow(14, '#ffd166').opacity(eyeOp),
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
            circle(500, {
                fill: radialGradient([0, 0], 500, [
                    [0, '#ffd16622'],
                    [0.5, '#ff6b8b14'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, 0).opacity(a),
        ]
        for (let si = 0; si < WIDE_STREAMS.length; si++) {
            const raw = WIDE_STREAMS[si]!
            const pts: Vec[] = raw.map(([x, y], i) => [x, y + Math.sin(i * 0.12 - ph * 2.5 + si) * 10] as Vec)
            nodes.push(
                new Node(polyPath(pts)).stroke(wideGrad, 3.6, 0.88 * a).glow(8, '#a78bfa'),
                new Node(polyPath(pts)).stroke('#ffffff', 1.0, 0.3 * a),
            )
        }
        for (const vt of SHEAR_VORTICES) {
            const vx = vt.x * 185
            const vy = -vt.y * 138
            nodes.push(
                circle(22 + Math.sin(ph * 3 + vt.x) * 6, { fill: null, stroke: '#ffd166', width: 2.5 }).at(vx, vy).opacity(0.9 * a).glow(8, '#ffd166'),
                dot(6.5, '#ffffff').at(vx, vy).glow(14, '#ffd166').opacity(a),
            )
        }
        return group(...nodes)
    })

    s.add(liveShot1, shot1Title)
    c.at(0.05, () => s.play(curlAmt.to(1.0, { duration: 4.2 })))
    c.at(0.05, () => s.play(flowPhase.to(8.5, { duration: 10.5, ease: linear })))

    c.on('stay smooth forever', () => {
        s.play(showShot1.to(0, { duration: 0.25 }), showShot2.to(1, { duration: 0.3 }))
    })
    c.on('stay smooth forever', () => {
        s.play(shot2Phase.to(4.2, { duration: 3.4, ease: linear }))
    })
    c.swap('stay smooth forever', shot1Title, shot2Caption)
    s.add(liveShot2)
}

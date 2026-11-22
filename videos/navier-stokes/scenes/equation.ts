import {
    Node, circle, contourPaths, dot, dynamic, group, line, linear, linearGradient, polyPath,
    radialGradient, scalarField, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import {
    TURB_EDDIES,
    traceFullStreamline,
    traceStreamline,
    vortexStreamfunction,
    vortexVorticity,
} from '../math'
import { txt } from '../../../factory/style'

// Full-width edge-to-edge laminar -> turbulent channel streamlines (ZERO mid-air cutoffs!)
const CH_Y = 212
const CH_SX = 236
const CH_SY = 94
const X_MIN = -3.56
const X_MAX = 3.56
const Y_MIN = -1.72
const Y_MAX = 1.72
const CH_SAMPLES = 150
const CH_SEEDS = [-1.48, -1.12, -0.78, -0.44, -0.14, 0.14, 0.44, 0.78, 1.12, 1.48] as const

interface ChannelLine {
    readonly laminar: Vec[]
    readonly turbulent: Vec[]
    readonly inner: boolean
}

const CHANNEL_LINES: readonly ChannelLine[] = CH_SEEDS.map((y0) => {
    const rawTurb = traceFullStreamline(X_MIN, y0, X_MAX, CH_SAMPLES, TURB_EDDIES, 0.45, 0.85, 2.55)
    const turbulent: Vec[] = rawTurb.map(([px, py]) => [px * CH_SX, CH_Y - py * CH_SY] as Vec)
    const laminar: Vec[] = Array.from({ length: CH_SAMPLES }, (_, i) => {
        const px = X_MIN + ((X_MAX - X_MIN) * i) / (CH_SAMPLES - 1)
        return [px * CH_SX, CH_Y - y0 * CH_SY] as Vec
    })
    return { laminar, turbulent, inner: Math.abs(y0) < 0.9 }
})

// Dense curl-advected multi-scale turbulent eddy filaments (erupt when Re -> 5,000!)
const EDDY_FILAMENTS: { pts: Vec[]; col: string }[] = TURB_EDDIES.flatMap((vt, vi) =>
    [0, 1, 2].map((k) => {
        const ang = (2 * Math.PI * k) / 3 + vi * 0.4
        const r0 = vt.core * 0.46
        const raw = traceStreamline(
            vt.x + r0 * Math.cos(ang),
            vt.y + r0 * Math.sin(ang),
            52,
            0.036,
            [vt],
            0,
        )
        const col = vt.gamma > 0 ? (vi < 5 ? '#ffd166' : '#ff6b8b') : (vi < 5 ? '#5ce1e6' : '#a78bfa')
        return {
            pts: raw.map(([px, py], i) => {
                const grow = 1 + 0.011 * i
                return [
                    (vt.x + (px - vt.x) * grow) * CH_SX,
                    CH_Y - (vt.y + (py - vt.y) * grow) * CH_SY,
                ] as Vec
            }),
            col,
        }
    }),
)

// Turbulent streamfunction isolines for high-Re multi-scale eddy texture
const TURB_CONTOURS = contourPaths(
    (x, y) => vortexStreamfunction(x, y, TURB_EDDIES, 0.45, 0.85, 2.55),
    {
        x: [X_MIN, X_MAX],
        y: [Y_MIN, Y_MAX],
        levels: [-3.4, -2.2, -1.1, -0.35, 0.35, 1.1, 2.2, 3.4],
        resolution: [84, 36],
    },
)

function channelVorticity(x: number, y: number): number {
    const nx = x / X_MAX
    const ny = y / Y_MAX
    const env = Math.max(0, 1 - Math.pow(nx * nx, 2.2)) * Math.max(0, 1 - Math.pow(ny * ny, 1.6))
    return vortexVorticity(x, y, TURB_EDDIES, 0.45, 0.85) * env
}

export const equation: SceneFunction = (s, c) => {
    const sceneLen = Math.max(12, c.beats[c.beats.length - 1]!.until - c.beats[0]!.start)
    const phase = s.value(0)
    const reProg = s.value(0) // 0 => Re = 50 (laminar silk), 1 => Re = 5000 (multi-scale turbulence!)
    const advGlow = s.value(0.2)
    const presGlow = s.value(0.2)
    const viscGlow = s.value(0.2)
    const showReDial = s.value(0)

    const lamGrad = linearGradient([-840, CH_Y], [840, CH_Y], ['#38bdf8', '#5ce1e6', '#60a5fa'])
    const turbGrad = linearGradient([-840, CH_Y], [840, CH_Y], ['#5ce1e6', '#a78bfa', '#ff6b8b', '#ffd166'])

    const topEquation = group(
        txt("NEWTON'S  F = ma  FOR FLUIDS", 0, -424, 26, '#ffd166', 'mono'),
        tex(String.raw`\partial_t \mathbf{u} + (\mathbf{u}\cdot\nabla)\mathbf{u} \;=\; -\frac{1}{\rho}\nabla p \;+\; \nu\,\Delta \mathbf{u}`, {
            size: 62,
            color: '#f8f4ec',
        }).at(0, -320).glow(7, '#7c8cff'),
    )

    // Crisp TeX labels for all 3 physical terms (fixes ambiguous mono 'ν' vs 'v' glyph!)
    const termSymbols = group(
        tex(String.raw`(\mathbf{u}\cdot\nabla)\mathbf{u}`, { size: 34, color: '#ffd166' }).at(-650, -192).glow(6, '#ffd166'),
        tex(String.raw`-\tfrac{1}{\rho}\nabla p`, { size: 34, color: '#5ce1e6' }).at(-85, -192).glow(6, '#38bdf8'),
        tex(String.raw`\nu\,\Delta \mathbf{u}`, { size: 34, color: '#a78bfa' }).at(468, -192).glow(6, '#a78bfa'),
    )

    // Live signed-vorticity scalarField heatmap inside the fluid channel (intensifies cleanly with Re!)
    const turbField = scalarField(
        (x, y) => {
            const t = reProg.value
            if (t < 0.05) return 0
            const shiftX = x - Math.sin(phase.value * 0.45) * 0.14
            return channelVorticity(shiftX, y) * Math.min(1, t * 1.15)
        },
        {
            x: [X_MIN, X_MAX],
            y: [Y_MIN, Y_MAX],
            domain: [-5.5, 5.5],
            colors: ['#5ce1e6a0', '#1d6fa592', '#161f4a38', '#07091000', '#3d194842', '#ff4d8da2', '#ffd166b5'],
            width: (X_MAX - X_MIN) * CH_SX,
            height: (Y_MAX - Y_MIN) * CH_SY,
            resolution: [112, 44],
        },
    ).at(0, CH_Y).set('blend', 'screen').opacity(0.76)

    const livePhysics = dynamic(() => {
        const ph = phase.value
        const turb = reProg.value
        const adv = advGlow.value
        const pres = presGlow.value
        const visc = viscGlow.value
        const reVis = showReDial.value

        const nodes: Node[] = [
            // Glowing physical term callouts neatly paired with their crisp TeX expressions
            txt('Advection', -455, -192, 28, '#ffd166', 'sans', 'center').opacity(0.45 + 0.55 * adv).glow(adv > 0.6 ? 9 : 0, '#ffd166'),
            txt('folds fast fluid over slow', -560, -142, 26, '#cbd5e8', 'sans').opacity(0.35 + 0.65 * adv),

            txt('Pressure', 88, -192, 28, '#5ce1e6', 'sans', 'center').opacity(0.45 + 0.55 * pres).glow(pres > 0.6 ? 9 : 0, '#38bdf8'),
            txt('pushes high to low', 0, -142, 26, '#cbd5e8', 'sans').opacity(0.35 + 0.65 * pres),

            txt('Viscosity', 630, -192, 28, '#a78bfa', 'sans', 'center').opacity(0.45 + 0.55 * visc).glow(visc > 0.6 ? 9 : 0, '#a78bfa'),
            txt('damps sharp ripples', 560, -142, 26, '#cbd5e8', 'sans').opacity(0.35 + 0.65 * visc),

            // Soft channel ambient glow
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, turb > 0.45 ? '#ff6b8b28' : '#38bdf81c'],
                    [0.6, '#4c2f8a14'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, CH_Y).set('blend', 'screen'),
        ]

        // Channel top/bottom boundary rails
        nodes.push(
            line([-840, CH_Y - 166], [840, CH_Y - 166], { stroke: '#253457', width: 2.0 }),
            line([-840, CH_Y + 166], [840, CH_Y + 166], { stroke: '#253457', width: 2.0 }),
        )

        // Multi-scale turbulent streamfunction contours emerge when Re climbs!
        if (turb > 0.25) {
            const cOp = Math.min(1, (turb - 0.25) / 0.55) * 0.28
            for (const lvl of TURB_CONTOURS) {
                for (const poly of lvl.paths) {
                    if (poly.length < 2) continue
                    const pts: Vec[] = poly.map(([x, y]) => [x * CH_SX, CH_Y - y * CH_SY] as Vec)
                    nodes.push(new Node(polyPath(pts)).stroke('#a78bfa', 1.3, cOp).set('blend', 'screen'))
                }
            }
        }

        // Full-width edge-to-edge streamlines morphing from laminar (Re=50) to multi-scale turbulent chaos (Re=5000)
        for (let si = 0; si < CHANNEL_LINES.length; si++) {
            const cl = CHANNEL_LINES[si]!
            const pts: Vec[] = cl.laminar.map((p, i) => {
                const q = cl.turbulent[i]!
                const x = p[0] + (q[0] - p[0]) * turb
                // Multi-frequency turbulent eddy flutter at high Re (clamped cleanly inside channel walls!)
                const foldRipple =
                    (Math.sin(i * 0.16 - ph * 2.8 + si * 0.7) * (4 + 14 * turb + 7 * adv * (1 - turb)) +
                        Math.sin(i * 0.39 + ph * 4.2 - si * 1.3) * 8 * turb) *
                    (cl.inner ? 1 : 0.45)
                const rawY = p[1] + (q[1] - p[1]) * turb + foldRipple
                const y = Math.max(CH_Y - 158, Math.min(CH_Y + 158, rawY))
                return [x, y] as Vec
            })
            const strokeCol = turb > 0.35 && cl.inner ? turbGrad : lamGrad
            nodes.push(
                new Node(polyPath(pts))
                    .stroke(strokeCol, cl.inner ? 3.6 : 2.3, cl.inner ? 0.94 : 0.65)
                    .glow(cl.inner ? 9 : 5, turb > 0.45 ? '#ff6b8b' : '#38bdf8')
                    .set('blend', 'screen'),
            )
            const beadIdx = Math.floor((ph * 30 + si * 17) % (pts.length - 1))
            const bp = pts[beadIdx]!
            nodes.push(
                dot(cl.inner ? 5.2 : 3.6, '#ffffff')
                    .at(bp[0], bp[1])
                    .glow(12, turb > 0.5 ? '#ffd166' : '#5ce1e6')
                    .set('blend', 'screen'),
            )
        }

        // Expanding pressure ring pulse when pressure term lights up
        if (pres > 0.5 && turb < 0.25) {
            const pr = 25 + ((ph * 0.9) % 1) * 110
            nodes.push(
                circle(pr, { fill: null, stroke: '#5ce1e6', width: 2.5 })
                    .at(0, CH_Y)
                    .opacity((1 - ((ph * 0.9) % 1)) * 0.75 * pres)
                    .glow(10, '#38bdf8')
                    .set('blend', 'screen'),
            )
        }

        // Dense curl-advected multi-scale turbulent eddy filaments & vortex cores erupt at high Re!
        if (turb > 0.28) {
            const vOp = Math.min(1, (turb - 0.28) / 0.45)
            for (const fil of EDDY_FILAMENTS) {
                nodes.push(
                    new Node(polyPath(fil.pts))
                        .stroke(fil.col, 2.5, 0.72 * vOp)
                        .glow(8, fil.col)
                        .set('blend', 'screen'),
                )
            }
            for (let vi = 0; vi < TURB_EDDIES.length; vi++) {
                const vt = TURB_EDDIES[vi]!
                const vx = vt.x * CH_SX
                const vy = CH_Y - vt.y * CH_SY
                const isMajor = vi < 5
                const col = vt.gamma > 0 ? '#ffd166' : '#5ce1e6'
                const rRing = (isMajor ? 18 : 11) + Math.sin(ph * 3.4 + vt.x * 2) * (isMajor ? 4 : 2.5)
                nodes.push(
                    circle(rRing, { fill: null, stroke: col, width: isMajor ? 2.4 : 1.7 })
                        .at(vx, vy)
                        .opacity(0.88 * vOp)
                        .glow(9, col)
                        .set('blend', 'screen'),
                    dot(isMajor ? 5.8 : 4.0, '#ffffff').at(vx, vy).glow(14, col).set('blend', 'screen').opacity(vOp),
                )
            }
        }

        // Sleek Reynolds Number dial readout in lower band (y = 428)
        if (reVis > 0.02) {
            const reNum = Math.round(50 * Math.pow(100, turb)) // Log sweep 50 -> 5000
            const regime = turb < 0.3 ? 'Laminar silk' : turb < 0.7 ? 'Transitional instability' : 'Full turbulence'
            const regimeCol = turb < 0.3 ? '#5ce1e6' : turb < 0.7 ? '#a78bfa' : '#ffd166'
            nodes.push(
                txt(`Re = ${reNum.toLocaleString('en-US')}`, -840, 428, 38, regimeCol, 'mono', 'left').glow(8, regimeCol).opacity(reVis),
                line([-460, 428], [260, 428], { stroke: '#222d4a', width: 10 }).opacity(reVis),
                line([-460, 428], [-460 + 720 * turb, 428], { stroke: regimeCol, width: 10 }).glow(10, regimeCol).set('blend', 'screen').opacity(reVis),
                dot(8, '#ffffff').at(-460 + 720 * turb, 428).glow(14, regimeCol).set('blend', 'screen').opacity(reVis),
                txt(regime, 840, 428, 30, regimeCol, 'sans', 'right').opacity(reVis),
            )
        }
        return group(...nodes)
    })

    s.add(turbField, topEquation, termSymbols, livePhysics)
    c.at(0.1, () => s.play(phase.to(14, { duration: Math.max(8, sceneLen - 0.4), ease: linear })))

    c.on('violent feedback term', () => s.play(advGlow.to(1, { duration: 0.4 })))
    c.on('pressure pushes', () => {
        s.play(advGlow.to(0.35, { duration: 0.35 }), presGlow.to(1, { duration: 0.35 }))
    })
    c.on('viscosity acts', () => {
        s.play(presGlow.to(0.35, { duration: 0.35 }), viscGlow.to(1, { duration: 0.35 }))
    })
    c.on('tug-of-war is captured', () => {
        s.play(
            advGlow.to(0.65, { duration: 0.35 }),
            presGlow.to(0.65, { duration: 0.35 }),
            viscGlow.to(0.65, { duration: 0.35 }),
            showReDial.to(1, { duration: 0.35 }),
        )
    })
    c.on('five thousand', () => s.play(reProg.to(1, { duration: 2.2 })))
}

import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { SHEAR_VORTICES, traceStreamline } from '../math'
import { txt } from '../../../factory/style'

// Precompute full-width laminar & turbulent channel streamlines in the lower half (y in [50, 395])
const CH_Y = 220
const CH_SX = 235
const CH_SY = 88
const CH_STEPS = 120
const CH_SEEDS = [-1.6, -1.15, -0.72, -0.32, 0.0, 0.32, 0.72, 1.15, 1.6] as const

interface ChannelLine {
    readonly laminar: Vec[]
    readonly turbulent: Vec[]
    readonly inner: boolean
}

const CHANNEL_LINES: readonly ChannelLine[] = CH_SEEDS.map((y0) => {
    const rawTurb = traceStreamline(-3.55, y0, CH_STEPS, 0.025, SHEAR_VORTICES, 0.35, 0.85, 2.4)
    const turbulent: Vec[] = rawTurb.map(([px, py]) => [px * CH_SX, CH_Y - py * CH_SY] as Vec)
    const laminar: Vec[] = rawTurb.map((_, i) => {
        const px = -3.55 + (7.1 * i) / CH_STEPS
        return [px * CH_SX, CH_Y - y0 * CH_SY] as Vec
    })
    return { laminar, turbulent, inner: Math.abs(y0) < 0.85 }
})

export const equation: SceneFunction = (s, c) => {
    const sceneLen = Math.max(12, c.beats[c.beats.length - 1]!.until - c.beats[0]!.start)
    const phase = s.value(0)
    const reProg = s.value(0) // 0 => Re = 50 (laminar silk), 1 => Re = 5000 (turbulent chaos)
    const advGlow = s.value(0.2)
    const presGlow = s.value(0.2)
    const viscGlow = s.value(0.2)
    const showReDial = s.value(0)

    const lamGrad = linearGradient([-840, CH_Y], [840, CH_Y], ['#38bdf8', '#5ce1e6', '#60a5fa'])
    const turbGrad = linearGradient([-840, CH_Y], [840, CH_Y], ['#5ce1e6', '#a78bfa', '#ff6b8b', '#ffd166'])

    const topEquation = group(
        txt("NEWTON'S  F = ma  FOR FLUIDS", 0, -420, 26, '#ffd166', 'mono'),
        tex(String.raw`\partial_t \mathbf{u} + (\mathbf{u}\cdot\nabla)\mathbf{u} \;=\; -\frac{1}{\rho}\nabla p \;+\; \nu\,\Delta \mathbf{u}`, {
            size: 62,
            color: '#f8f4ec',
        }).at(0, -315).glow(7, '#7c8cff'),
    )

    const livePhysics = dynamic(() => {
        const ph = phase.value
        const turb = reProg.value
        const adv = advGlow.value
        const pres = presGlow.value
        const visc = viscGlow.value
        const reVis = showReDial.value

        const nodes: Node[] = [
            // Glowing physical term callouts neatly spaced below the equation (no overlap!)
            txt('(u·∇)u  Advection', -560, -185, 30, '#ffd166', 'mono').opacity(0.38 + 0.62 * adv).glow(adv > 0.6 ? 9 : 0, '#ffd166'),
            txt('folds fast fluid over slow', -560, -142, 26, '#cbd5e8', 'sans').opacity(0.32 + 0.68 * adv),

            txt('-(1/ρ)∇p  Pressure', 0, -185, 30, '#5ce1e6', 'mono').opacity(0.38 + 0.62 * pres).glow(pres > 0.6 ? 9 : 0, '#38bdf8'),
            txt('pushes high to low', 0, -142, 26, '#cbd5e8', 'sans').opacity(0.32 + 0.68 * pres),

            txt('νΔu  Viscosity', 560, -185, 30, '#a78bfa', 'mono').opacity(0.38 + 0.62 * visc).glow(visc > 0.6 ? 9 : 0, '#a78bfa'),
            txt('damps sharp ripples', 560, -142, 26, '#cbd5e8', 'sans').opacity(0.32 + 0.68 * visc),

            // Soft channel ambient glow
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, turb > 0.45 ? '#ff6b8b20' : '#38bdf818'],
                    [0.6, '#4c2f8a10'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, CH_Y),
        ]

        // Channel top/bottom subtle boundary rails
        nodes.push(
            line([-840, CH_Y - 165], [840, CH_Y - 165], { stroke: '#1f2b47', width: 1.8 }),
            line([-840, CH_Y + 165], [840, CH_Y + 165], { stroke: '#1f2b47', width: 1.8 }),
        )

        // Live animated fluid channel streamlines morphing cleanly from laminar (Re=50) to turbulent (Re=5000)
        for (let si = 0; si < CHANNEL_LINES.length; si++) {
            const cl = CHANNEL_LINES[si]!
            const pts: Vec[] = cl.laminar.map((p, i) => {
                const q = cl.turbulent[i]!
                const x = p[0] + (q[0] - p[0]) * turb
                // Gentle ripple during advection/pressure highlight + wild turbulence at high Re
                const foldRipple =
                    Math.sin(i * 0.16 - ph * 2.8 + si * 0.7) * (5 + 16 * turb + 8 * adv * (1 - turb)) * (cl.inner ? 1 : 0.45)
                const y = p[1] + (q[1] - p[1]) * turb + foldRipple
                return [x, y] as Vec
            })
            const strokeCol = turb > 0.35 && cl.inner ? turbGrad : lamGrad
            nodes.push(
                new Node(polyPath(pts))
                    .stroke(strokeCol, cl.inner ? 3.5 : 2.2, cl.inner ? 0.92 : 0.62)
                    .glow(cl.inner ? 8 : 4, turb > 0.45 ? '#ff6b8b' : '#38bdf8'),
            )
            const beadIdx = Math.floor(((ph * 28 + si * 17) % (pts.length - 1)))
            const bp = pts[beadIdx]!
            nodes.push(dot(cl.inner ? 5 : 3.5, '#ffffff').at(bp[0], bp[1]).glow(10, turb > 0.5 ? '#ffd166' : '#5ce1e6'))
        }

        // Expanding pressure ring pulse when pressure term lights up
        if (pres > 0.5 && turb < 0.25) {
            const pr = 25 + ((ph * 0.9) % 1) * 110
            nodes.push(
                circle(pr, { fill: null, stroke: '#5ce1e6', width: 2.5 })
                    .at(0, CH_Y)
                    .opacity((1 - ((ph * 0.9) % 1)) * 0.7 * pres)
                    .glow(8, '#38bdf8'),
            )
        }

        // Glowing vortex cores emerge when Reynolds number crosses into turbulence!
        if (turb > 0.3) {
            const vOp = Math.min(1, (turb - 0.3) / 0.45)
            for (const vt of SHEAR_VORTICES) {
                const vx = vt.x * CH_SX
                const vy = CH_Y - vt.y * CH_SY
                nodes.push(
                    circle(18 + Math.sin(ph * 3 + vt.x) * 4, { fill: null, stroke: '#ffd166', width: 2.4 }).at(vx, vy).opacity(0.85 * vOp).glow(8, '#ffd166'),
                    dot(6, '#ffffff').at(vx, vy).glow(14, '#ffd166').opacity(vOp),
                )
            }
        }

        // Sleek Reynolds Number dial readout in lower band (y = 425)
        if (reVis > 0.02) {
            const reNum = Math.round(50 * Math.pow(100, turb)) // Log sweep 50 -> 5000
            const regime = turb < 0.3 ? 'Laminar silk' : turb < 0.7 ? 'Transitional instability' : 'Full turbulence'
            const regimeCol = turb < 0.3 ? '#5ce1e6' : turb < 0.7 ? '#a78bfa' : '#ffd166'
            nodes.push(
                txt(`Re = ${reNum.toLocaleString('en-US')}`, -840, 428, 38, regimeCol, 'mono', 'left').glow(8, regimeCol).opacity(reVis),
                line([-460, 428], [260, 428], { stroke: '#222d4a', width: 10 }).opacity(reVis),
                line([-460, 428], [-460 + 720 * turb, 428], { stroke: regimeCol, width: 10 }).glow(8, regimeCol).opacity(reVis),
                dot(8, '#ffffff').at(-460 + 720 * turb, 428).glow(12, regimeCol).opacity(reVis),
                txt(regime, 840, 428, 30, regimeCol, 'sans', 'right').opacity(reVis),
            )
        }
        return group(...nodes)
    })

    s.add(topEquation, livePhysics)
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

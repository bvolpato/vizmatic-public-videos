import {
    Node, arc, arrow, circle, dot, dynamic, group, line, linear, par, radialGradient, rect, tex,
    type SceneFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { rotatePair } from '../math'

const CX = 225
const CY = 10
const RADIUS = 262
const THETA = 0.22 // Single clean 2D clock dial frequency for visual clarity
// Unit base vectors q and k in R^2
const Q0: readonly [number, number] = [0.92, -0.39]
const K0: readonly [number, number] = [0.42, -0.907]

// Projection gauge geometry beside the complex unit circle
const GAUGE_X = 720
const GAUGE_TOP = -205
const GAUGE_BOT = 225
const GAUGE_MID = (GAUGE_TOP + GAUGE_BOT) * 0.5
const GAUGE_HALF = (GAUGE_BOT - GAUGE_TOP) * 0.5

export const clocks: SceneFunction = (s, c) => {
    const mSingle = s.value(0)
    const showPair = s.value(0)
    const baseShift = s.value(0)

    // Left editorial math: Beat 0 (rotation of a 2D needle) -> Beat 1 (relative inner product)
    const rotTitle = group(
        txt('2D COMPLEX ROTATION', -865, -370, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Pair dimensions into', -870, -280, 60, COSMOS.ink, 'serif', 'left'),
        txt('spinning compass needles', -870, -206, 60, COSMOS.cyan, 'serif', 'left').glow(6, '#38bdf8'),
        tex(String.raw`R(m\theta) = \begin{pmatrix}\cos m\theta & \sin m\theta \\ -\sin m\theta & \cos m\theta\end{pmatrix}`, {
            size: 36,
            color: COSMOS.ink,
        }).at(-525, -10).glow(4, '#7c8cff'),
        txt('Length is preserved — meaning stays untouched', -865, 175, 29, COSMOS.muted, 'sans', 'left'),
        txt('Position m rotates each 2D pair by angle m·θ', -865, 232, 29, COSMOS.gold, 'sans', 'left'),
    )

    const relFormula = group(
        txt('RELATIVE POSITION INVARIANCE', -865, -370, 26, COSMOS.gold, 'mono', 'left'),
        txt('Absolute positions vanish', -870, -280, 58, COSMOS.ink, 'serif', 'left'),
        txt('Only (m − n)θ survives', -870, -208, 58, COSMOS.gold, 'serif', 'left').glow(6, COSMOS.gold),
        tex(String.raw`q_m^\top k_n = \mathrm{Re}\!\left(q^H e^{i(m-n)\theta} k\right)`, {
            size: 44,
            color: COSMOS.gold,
        }).at(-515, -25).glow(7, COSMOS.gold),
        txt('Watch both needles spin together as m and n grow:', -865, 130, 28, COSMOS.muted, 'sans', 'left'),
        txt('Distance Δ = m − n stays fixed at 6', -865, 188, 31, COSMOS.emerald, 'mono', 'left').glow(4, COSMOS.emerald),
    )

    // Right geometric stage: exact rotating unit circle + glowing motion arcs + projection gauge
    const liveCircle = dynamic(() => {
        const pairA = showPair.value
        const m = pairA < 0.02 ? mSingle.value : 10 + baseShift.value
        const n = 4 + baseShift.value

        // Rotate clockwise: rotatePair matches e^(-i * angle)
        const [qx, qy] = rotatePair(Q0[0], Q0[1], m * THETA)
        const [kx, ky] = rotatePair(K0[0], K0[1], n * THETA)

        // Screen coords (y inverted for standard upward imaginary axis)
        const qSx = CX + qx * RADIUS
        const qSy = CY - qy * RADIUS
        const kSx = CX + kx * RADIUS
        const kSy = CY - ky * RADIUS

        const qAng = Math.atan2(-qy, qx)
        const kAng = Math.atan2(-ky, kx)
        const dotVal = qx * kx + qy * ky
        const singleCos = Math.cos(m * THETA)
        const gaugeVal = pairA < 0.02 ? singleCos : dotVal
        const gaugeY = GAUGE_MID - gaugeVal * GAUGE_HALF

        const nodes: Node[] = [
            circle(400, {
                fill: radialGradient([0, 0], 400, [
                    [0, '#5ce1e622'],
                    [0.52, '#4c2f8a16'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).set('blend', 'screen'),
            circle(RADIUS, { fill: null, stroke: '#3f5484', width: 2.4 }).at(CX, CY),
            circle(RADIUS * 0.52, { fill: null, stroke: '#273558', width: 1.5, dash: [5, 8] }).at(CX, CY),
            line([CX - RADIUS - 36, CY], [CX + RADIUS + 36, CY], { stroke: '#304066', width: 1.6 }),
            line([CX, CY - RADIUS - 36], [CX, CY + RADIUS + 36], { stroke: '#304066', width: 1.6 }),
            txt('Re', CX + RADIUS + 58, CY, 26, COSMOS.muted, 'mono'),
            txt('Im', CX, CY - RADIUS - 54, 26, COSMOS.muted, 'mono'),
        ]

        // 12 crisp dial ticks around the unit circle
        for (let t = 0; t < 12; t++) {
            const a = (t * Math.PI) / 6
            nodes.push(line(
                [CX + Math.cos(a) * (RADIUS - 9), CY + Math.sin(a) * (RADIUS - 9)],
                [CX + Math.cos(a) * (RADIUS + 9), CY + Math.sin(a) * (RADIUS + 9)],
                { stroke: '#6d83b8', width: 2.2 },
            ))
        }

        // Additive screen-blended rotational motion wake behind q_m
        const qTrail = 0.78
        nodes.push(
            arc(RADIUS, qAng - qTrail, qAng, { fill: null, stroke: COSMOS.cyan, width: 6.5 })
                .at(CX, CY).opacity(0.75).glow(12, COSMOS.cyan).set('blend', 'screen'),
            arc(RADIUS - 18, qAng - qTrail * 0.7, qAng, { fill: null, stroke: COSMOS.cyan, width: 2.6 })
                .at(CX, CY).opacity(0.45).set('blend', 'screen'),
        )

        // In Beat 0, show phase sweep arc from base q to R(m*theta) q
        if (pairA < 0.98) {
            const bAng = Math.atan2(-Q0[1], Q0[0])
            const sweep = m * THETA
            const fade0 = 1 - pairA
            nodes.push(
                arrow([CX, CY], [CX + Q0[0] * RADIUS, CY - Q0[1] * RADIUS], {
                    stroke: '#64748b',
                    width: 2.6,
                    tip: 14,
                }).opacity(0.65 * fade0),
                arc(112, bAng, bAng + sweep, { fill: null, stroke: COSMOS.cyan, width: 4.8 })
                    .at(CX, CY).opacity(0.92 * fade0).glow(10, COSMOS.cyan).set('blend', 'screen'),
                txt(`R(mθ) q   ·   m = ${m.toFixed(1)}`, CX, CY + RADIUS + 76, 30, COSMOS.cyan, 'mono').opacity(fade0),
            )
        }

        // In Beat 1, show key vector R(n*theta) k, additive wake arc, projection drop-line, and color-matched legend!
        if (pairA >= 0.02) {
            let dAng = qAng - kAng
            while (dAng <= -Math.PI) dAng += 2 * Math.PI
            while (dAng > Math.PI) dAng -= 2 * Math.PI
            const arcR = 132

            // Orthogonal projection of q_m onto k_n
            const projX = CX + (dotVal * kx) * RADIUS
            const projY = CY - (dotVal * ky) * RADIUS

            nodes.push(
                // Glowing rotational motion wake behind k_n
                arc(RADIUS, kAng - 0.78, kAng, { fill: null, stroke: COSMOS.gold, width: 6.5 })
                    .at(CX, CY).opacity(0.72 * pairA).glow(12, COSMOS.gold).set('blend', 'screen'),
                // Invariant emerald relative-angle arc (double-pass additive glow)
                arc(arcR, kAng, kAng + dAng, { fill: null, stroke: COSMOS.emerald, width: 6.0 })
                    .at(CX, CY).opacity(0.96 * pairA).glow(12, COSMOS.emerald).set('blend', 'screen'),
                arc(arcR - 14, kAng, kAng + dAng, { fill: null, stroke: COSMOS.emerald, width: 2.2 })
                    .at(CX, CY).opacity(0.45 * pairA).set('blend', 'screen'),
                // Projection drop-line from q_m tip onto k_n axis
                line([qSx, qSy], [projX, projY], { stroke: COSMOS.emerald, width: 2.0, dash: [5, 5] })
                    .opacity(0.75 * pairA),
                dot(5.5, COSMOS.emerald).at(projX, projY).glow(10, COSMOS.emerald).opacity(pairA).set('blend', 'screen'),
                arrow([CX, CY], [kSx, kSy], { stroke: COSMOS.gold, width: 4.6, tip: 18 })
                    .glow(10, COSMOS.gold).opacity(pairA),
                dot(8, '#ffffff').at(kSx, kSy).glow(14, COSMOS.gold).opacity(pairA).set('blend', 'screen'),
                txt(
                    `qₘᵀ kₙ = ${dotVal.toFixed(4)}  (constant!)`,
                    -865,
                    264,
                    34,
                    COSMOS.gold,
                    'mono',
                    'left',
                ).glow(7, COSMOS.gold).opacity(pairA),
                txt(
                    `qₘ (m=${Math.round(m)})   kₙ (n=${Math.round(n)})   Δ = m − n = 6`,
                    CX,
                    CY + RADIUS + 76,
                    27,
                    COSMOS.ink,
                    'mono',
                ).opacity(pairA),
                // Color-matched legend bullets (cyan = q_m, gold = k_n, emerald = (m-n)theta)
                dot(8, COSMOS.cyan).at(-852, 342).glow(8, COSMOS.cyan).opacity(pairA),
                txt('qₘ', -834, 342, 26, COSMOS.cyan, 'mono', 'left').opacity(pairA),
                dot(8, COSMOS.gold).at(-748, 342).glow(8, COSMOS.gold).opacity(pairA),
                txt('kₙ', -730, 342, 26, COSMOS.gold, 'mono', 'left').opacity(pairA),
                dot(8, COSMOS.emerald).at(-644, 342).glow(8, COSMOS.emerald).opacity(pairA),
                txt('(m−n)θ', -626, 342, 26, COSMOS.emerald, 'mono', 'left').opacity(pairA),
            )
        }

        // Always render query vector R(m*theta) q on top
        nodes.push(
            arrow([CX, CY], [qSx, qSy], { stroke: COSMOS.cyan, width: 4.8, tip: 18 }).glow(10, COSMOS.cyan),
            dot(8, '#ffffff').at(qSx, qSy).glow(14, COSMOS.cyan).set('blend', 'screen'),
            dot(7.5, '#ffffff').at(CX, CY).glow(14, '#ffffff').set('blend', 'screen'),
        )

        // ── Live Synchronized Projection Gauge beside the complex circle ──
        const gaugeCol = pairA < 0.02 ? COSMOS.cyan : COSMOS.emerald
        const barH = Math.max(4, Math.abs(GAUGE_MID - gaugeY))
        const barCenterY = (GAUGE_MID + gaugeY) * 0.5
        nodes.push(
            rect(44, GAUGE_BOT - GAUGE_TOP + 16, {
                fill: '#0e1529',
                stroke: '#2d3d64',
                width: 2.0,
                radius: 12,
            }).at(GAUGE_X, GAUGE_MID),
            // Zero midline + ticks (+1, 0, -1)
            line([GAUGE_X - 28, GAUGE_MID], [GAUGE_X + 28, GAUGE_MID], { stroke: '#4d608e', width: 1.6 }),
            line([GAUGE_X - 24, GAUGE_TOP], [GAUGE_X + 24, GAUGE_TOP], { stroke: '#3a4a70', width: 1.4 }),
            line([GAUGE_X - 24, GAUGE_BOT], [GAUGE_X + 24, GAUGE_BOT], { stroke: '#3a4a70', width: 1.4 }),
            txt('+1', GAUGE_X + 42, GAUGE_TOP, 26, COSMOS.dim, 'mono', 'left'),
            txt('0', GAUGE_X + 42, GAUGE_MID, 26, COSMOS.dim, 'mono', 'left'),
            txt('-1', GAUGE_X + 42, GAUGE_BOT, 26, COSMOS.dim, 'mono', 'left'),
            // Glowing live projection fill bar
            rect(26, barH, {
                fill: gaugeCol,
                stroke: null,
                radius: 6,
            }).at(GAUGE_X, barCenterY).opacity(0.62).glow(10, gaugeCol).set('blend', 'screen'),
            // Live marker bead & readout
            line([GAUGE_X - 26, gaugeY], [GAUGE_X + 26, gaugeY], { stroke: '#ffffff', width: 3.0 })
                .glow(10, gaugeCol).set('blend', 'screen'),
            dot(7, '#ffffff').at(GAUGE_X, gaugeY).glow(12, gaugeCol).set('blend', 'screen'),
            txt(
                pairA < 0.02 ? 'cos(mθ)' : 'cos(Δθ)',
                GAUGE_X,
                GAUGE_TOP - 54,
                28,
                gaugeCol,
                'mono',
            ).glow(5, gaugeCol),
            txt(
                gaugeVal.toFixed(2),
                GAUGE_X,
                GAUGE_BOT + 54,
                30,
                pairA < 0.02 ? COSMOS.cyan : COSMOS.gold,
                'mono',
            ).glow(6, pairA < 0.02 ? COSMOS.cyan : COSMOS.gold),
            txt(
                pairA < 0.02 ? 'live' : 'LOCKED',
                GAUGE_X,
                GAUGE_BOT + 90,
                26,
                pairA < 0.02 ? COSMOS.dim : COSMOS.emerald,
                'mono',
            ),
        )

        return group(...nodes)
    })

    s.add(liveCircle, rotTitle)
    const beat0Dur = Math.max(3.0, c.cue('geometric magic').start - c.start - 0.35)
    c.at(0.15, () => s.play(mSingle.to(10, { duration: beat0Dur, ease: linear })))

    const beat1Dur = Math.max(3.0, c.end - c.cue('geometric magic').start - 0.6)
    c.on('geometric magic', () => {
        s.play(par(
            showPair.to(1, { duration: 0.45 }),
            baseShift.to(24, { duration: beat1Dur, ease: linear }),
        ))
    })
    c.swap('geometric magic', rotTitle, relFormula)
}

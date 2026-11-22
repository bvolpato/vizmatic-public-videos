import {
    Node, arc, arrow, circle, dot, dynamic, group, line, linear, par, radialGradient, tex,
    type SceneFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { rotatePair } from '../math'

const CX = 340
const CY = 15
const RADIUS = 285
const THETA = 0.22 // Single clean 2D clock dial frequency for visual clarity
// Unit base vectors q and k in R^2
const Q0: readonly [number, number] = [0.92, -0.39]
const K0: readonly [number, number] = [0.42, -0.907]

export const clocks: SceneFunction = (s, c) => {
    const mSingle = s.value(0)
    const showPair = s.value(0)
    const baseShift = s.value(0)

    // Left editorial math: Beat 0 (rotation of a 2D needle) -> Beat 1 (relative inner product)
    const rotTitle = group(
        txt('2D COMPLEX ROTATION', -850, -370, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Pair dimensions into', -854, -280, 62, COSMOS.ink, 'serif', 'left'),
        txt('spinning compass needles', -854, -206, 62, COSMOS.cyan, 'serif', 'left').glow(6, '#38bdf8'),
        tex(String.raw`R(m\theta) = \begin{pmatrix}\cos m\theta & \sin m\theta \\ -\sin m\theta & \cos m\theta\end{pmatrix}`, {
            size: 38,
            color: COSMOS.ink,
        }).at(-500, -10).glow(4, '#7c8cff'),
        txt('Length is preserved — meaning stays untouched', -850, 175, 30, COSMOS.muted, 'sans', 'left'),
        txt('Position m rotates each 2D pair by angle m·θ', -850, 232, 30, COSMOS.gold, 'sans', 'left'),
    )

    const relFormula = group(
        txt('RELATIVE POSITION INVARIANCE', -850, -370, 26, COSMOS.gold, 'mono', 'left'),
        txt('Absolute positions vanish', -854, -280, 60, COSMOS.ink, 'serif', 'left'),
        txt('Only (m − n)θ survives', -854, -208, 60, COSMOS.gold, 'serif', 'left').glow(6, COSMOS.gold),
        tex(String.raw`q_m^\top k_n = \mathrm{Re}\!\left(q^H e^{i(m-n)\theta} k\right)`, {
            size: 46,
            color: COSMOS.gold,
        }).at(-490, -25).glow(7, COSMOS.gold),
        txt('Watch both needles spin together as m and n grow:', -850, 130, 29, COSMOS.muted, 'sans', 'left'),
        txt('Distance Δ = m − n stays fixed at 6', -850, 190, 32, COSMOS.emerald, 'mono', 'left').glow(4, COSMOS.emerald),
    )

    // Right geometric stage: exact rotating unit circle + glowing vector needles + angle wedge
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

        const nodes: Node[] = [
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#5ce1e61c'],
                    [0.55, '#4c2f8a12'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY),
            circle(RADIUS, { fill: null, stroke: '#324268', width: 2.2 }).at(CX, CY),
            circle(RADIUS * 0.52, { fill: null, stroke: '#1f2944', width: 1.4, dash: [5, 8] }).at(CX, CY),
            line([CX - RADIUS - 42, CY], [CX + RADIUS + 42, CY], { stroke: '#273454', width: 1.6 }),
            line([CX, CY - RADIUS - 42], [CX, CY + RADIUS + 42], { stroke: '#273454', width: 1.6 }),
            txt('Re', CX + RADIUS + 62, CY, 26, COSMOS.dim, 'mono'),
            txt('Im', CX, CY - RADIUS - 62, 26, COSMOS.dim, 'mono'),
        ]

        // 12 dial ticks around the unit circle
        for (let t = 0; t < 12; t++) {
            const a = (t * Math.PI) / 6
            nodes.push(line(
                [CX + Math.cos(a) * (RADIUS - 8), CY + Math.sin(a) * (RADIUS - 8)],
                [CX + Math.cos(a) * (RADIUS + 8), CY + Math.sin(a) * (RADIUS + 8)],
                { stroke: '#4c5e8a', width: 2 },
            ))
        }

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
                arc(118, bAng, bAng + sweep, { fill: null, stroke: COSMOS.cyan, width: 4.5 })
                    .at(CX, CY).opacity(0.9 * fade0).glow(8, COSMOS.cyan),
                txt(`R(mθ) q   ·   m = ${m.toFixed(1)}`, CX, CY + RADIUS + 82, 32, COSMOS.cyan, 'mono').opacity(fade0),
            )
        }

        // In Beat 1, show key vector R(n*theta) k AND the rock-solid angle wedge (m - n)*theta!
        if (pairA >= 0.02) {
            let dAng = qAng - kAng
            while (dAng <= -Math.PI) dAng += 2 * Math.PI
            while (dAng > Math.PI) dAng -= 2 * Math.PI
            const arcR = 138
            nodes.push(
                arc(arcR, kAng, kAng + dAng, { fill: null, stroke: COSMOS.emerald, width: 5.5 })
                    .at(CX, CY).opacity(0.95 * pairA).glow(10, COSMOS.emerald),
                arrow([CX, CY], [kSx, kSy], { stroke: COSMOS.gold, width: 4.6, tip: 18 })
                    .glow(9, COSMOS.gold).opacity(pairA),
                dot(8, '#ffffff').at(kSx, kSy).glow(14, COSMOS.gold).opacity(pairA),
                txt(
                    `qₘᵀ kₙ = ${dotVal.toFixed(4)}  (constant!)`,
                    -850,
                    270,
                    36,
                    COSMOS.gold,
                    'mono',
                    'left',
                ).glow(7, COSMOS.gold).opacity(pairA),
                txt(
                    `qₘ (m=${Math.round(m)})   kₙ (n=${Math.round(n)})   Δ = m − n = 6`,
                    CX,
                    CY + RADIUS + 82,
                    28,
                    COSMOS.ink,
                    'mono',
                ).opacity(pairA),
                txt('● Cyan = qₘ   ● Gold = kₙ   ● Green = φ₀ + (m−n)θ', -850, 345, 26, COSMOS.muted, 'mono', 'left').opacity(pairA),
            )
        }

        // Always render query vector R(m*theta) q on top
        nodes.push(
            arrow([CX, CY], [qSx, qSy], { stroke: COSMOS.cyan, width: 4.8, tip: 18 }).glow(10, COSMOS.cyan),
            dot(8, '#ffffff').at(qSx, qSy).glow(14, COSMOS.cyan),
            dot(7, '#ffffff').at(CX, CY).glow(12, '#ffffff'),
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

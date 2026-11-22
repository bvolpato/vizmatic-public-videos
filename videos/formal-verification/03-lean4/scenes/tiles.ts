import {
    Node, circle, dot, dynamic, fadeIn, group, line, polyPath, rect, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

// 5 glowing linked cons-cells: 1 :: 2 :: 3 :: 4 :: 5 :: []
// Hero tiles 1, 2, 3 plus 4, 5 flip via parabolic comet arcs from Input into Accumulator!
const CELLS = [
    { val: '1', col: COSMOS.gold },
    { val: '2', col: COSMOS.cyan },
    { val: '3', col: COSMOS.violet },
    { val: '4', col: COSMOS.emerald },
    { val: '5', col: COSMOS.blue },
] as const

const CELL_Y = 38
const IN_XS = [-770, -645, -520, -395, -270] as const
const IN_NIL_X = -150
const ACC_XS = [150, 275, 400, 525, 650] as const
const ACC_NIL_X = 770

function parabolicArc(x0: number, x1: number, yBase: number, peakH: number, steps = 34): Vec[] {
    const out: Vec[] = []
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const x = x0 + (x1 - x0) * t
        const y = yBase - Math.sin(t * Math.PI) * peakH
        out.push([x, y])
    }
    return out
}

const TRACE_ROWS = [
    { step: 0, text: 'revAux [1,2,3,4,5] []' },
    { step: 1, text: 'revAux [2,3,4,5] [1]' },
    { step: 2, text: 'revAux [3,4,5] [2,1]' },
    { step: 3, text: 'revAux [4,5] [3,2,1]' },
    { step: 4, text: 'revAux [5] [4,3,2,1]' },
    { step: 5, text: 'revAux [] [5,4,3,2,1]' },
] as const

export const tiles: SceneFunction = (s, c) => {
    const step = s.value(0.25) // Smoothly starts first flip early so frame 1 & poster are alive!
    const theoremReveal = s.value(0)

    const ruleTex = tex(String.raw`\operatorname{revAux}(x :: xs,\; acc) = \operatorname{revAux}(xs,\; x :: acc)`, {
        size: 28,
        color: COSMOS.cyan,
    }).at(468, -360)

    const header = group(
        txt('PROOFS FOR REAL SYSTEMS  ·  EP 3 / 3', -852, -408, 26, COSMOS.violet, 'mono', 'left'),
        txt('Lean 4: The Shape of a Proof', -858, -338, 62, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.violet),
        rect(756, 76, { fill: '#0d1426', stroke: COSMOS.cyan, width: 2.2, radius: 14 }).at(468, -360).glow(6, COSMOS.cyan),
        ruleTex,
    )

    const liveStage = dynamic(() => {
        const st = step.value
        const th = theoremReveal.value
        const nodes: Node[] = [
            nebula(-460, CELL_Y, 340, '#ffd16618'),
            nebula(460, CELL_Y, 340, '#a78bfa1e'),
            nebula(0, -120, 360, '#5ce1e614'),
            // Input & Accumulator lane frames (balanced left + right, zero empty half-screen!)
            rect(770, 186, { fill: '#0b1020', stroke: '#293556', width: 2.0, radius: 18 }).at(-460, CELL_Y + 18),
            rect(770, 186, { fill: '#0b1020', stroke: '#2c3d62', width: 2.0, radius: 18 }).at(460, CELL_Y + 18),
            txt('INPUT LIST  (xs)', -815, CELL_Y + 86, 26, COSMOS.gold, 'mono', 'left'),
            txt('ACCUMULATOR  (acc)', 105, CELL_Y + 86, 26, COSMOS.violet, 'mono', 'left'),
        ]

        // Pre-lit target cons slots & pointer arrows on both trays
        for (let i = 0; i < 5; i++) {
            nodes.push(
                rect(84, 84, { fill: '#0e1529', stroke: '#1f2c48', width: 1.6, radius: 14, dash: [6, 5] }).at(IN_XS[i]!, CELL_Y),
                rect(84, 84, { fill: '#0e1529', stroke: '#233152', width: 1.6, radius: 14, dash: [6, 5] }).at(ACC_XS[i]!, CELL_Y),
            )
            // Cons :: pointer links between adjacent slots
            const inNext = i < 4 ? IN_XS[i + 1]! : IN_NIL_X
            nodes.push(
                line([IN_XS[i]! + 44, CELL_Y], [inNext - 44, CELL_Y], { stroke: '#33466b', width: 2.2 }),
            )
            const accNext = i < 4 ? ACC_XS[i + 1]! : ACC_NIL_X
            nodes.push(
                line([ACC_XS[i]! + 44, CELL_Y], [accNext - 44, CELL_Y], { stroke: '#33466b', width: 2.2 }),
            )
        }

        // Glowing [] nil terminators on BOTH Input & Accumulator
        nodes.push(
            rect(74, 74, { fill: '#10182e', stroke: COSMOS.muted, width: 2.4, radius: 14 }).at(IN_NIL_X, CELL_Y),
            txt('[]', IN_NIL_X, CELL_Y, 28, COSMOS.muted, 'mono'),
            rect(74, 74, { fill: '#10182e', stroke: COSMOS.emerald, width: 2.6, radius: 14 }).at(ACC_NIL_X, CELL_Y).glow(8, COSMOS.emerald),
            txt('[]', ACC_NIL_X, CELL_Y, 28, COSMOS.emerald, 'mono'),
        )

        // Draw parabolic comet arc trails & glowing cons-cells in flight!
        CELLS.forEach((cell, i) => {
            const p = Math.max(0, Math.min(1, st - i))
            const x0 = IN_XS[i]!
            // Reversed landing slot: 1 lands at ACC_XS[4] (next to []), 2 at ACC_XS[3], ..., 5 at ACC_XS[0]!
            const x1 = ACC_XS[4 - i]!
            const peakH = 185 + (i % 3) * 26
            const fullArc = parabolicArc(x0, x1, CELL_Y, peakH, 36)

            if (p > 0.01) {
                const maxIdx = Math.max(2, Math.floor(p * (fullArc.length - 1)))
                const trailPts = fullArc.slice(0, maxIdx + 1)
                const isFlying = p < 0.99
                // Luminous parabolic comet arc trail
                nodes.push(
                    new Node(polyPath(trailPts))
                        .stroke(cell.col, isFlying ? 5.2 : 2.6, isFlying ? 0.92 : 0.34)
                        .glow(isFlying ? 14 : 6, cell.col)
                        .set('blend', 'screen'),
                )
                if (isFlying) {
                    // Bright comet spark particles trailing behind the airborne tile
                    for (let k = 1; k <= 5; k++) {
                        const ti = Math.max(0, maxIdx - k * 2)
                        const tp = fullArc[ti]!
                        nodes.push(
                            dot(5.6 - k * 0.75, '#ffffff')
                                .at(tp[0], tp[1])
                                .glow(12, cell.col)
                                .opacity(1 - k * 0.16)
                                .set('blend', 'screen'),
                        )
                    }
                }
            }

            // Current cell position along parabola
            const cx = x0 + (x1 - x0) * p
            const cy = CELL_Y - Math.sin(p * Math.PI) * peakH
            const active = p > 0.01 && p < 0.99

            // Active cons-link highlight once landed in Accumulator
            if (p >= 0.99) {
                const slotIdx = 4 - i
                const nextX = slotIdx < 4 ? ACC_XS[slotIdx + 1]! : ACC_NIL_X
                nodes.push(
                    line([x1 + 46, CELL_Y], [nextX - 42, CELL_Y], { stroke: cell.col, width: 3.4 })
                        .glow(8, cell.col)
                        .set('blend', 'screen'),
                )
            }

            nodes.push(
                rect(88, 88, {
                    fill: active ? '#17203a' : '#11182c',
                    stroke: cell.col,
                    width: active ? 4.4 : 3.4,
                    radius: 16,
                })
                    .at(cx, cy)
                    .glow(active ? 16 : 9, cell.col),
                txt(cell.val, cx, cy, 40, cell.col, 'mono'),
            )
            if (active) {
                nodes.push(
                    circle(64, { fill: null, stroke: cell.col, width: 2.0 })
                        .at(cx, cy)
                        .opacity(0.45)
                        .set('blend', 'screen'),
                )
            }
        })

        // ── Bottom Live Step-by-Step revAux Trace Panel ──────────────────────
        const currentStep = Math.min(5, Math.floor(st + 0.15))
        nodes.push(
            rect(1684, 152, { fill: '#0b1020', stroke: '#283556', width: 2.2, radius: 16 }).at(0, 232),
            txt('LIVE TAIL-RECURSIVE TRACE', -810, 184, 26, COSMOS.muted, 'mono', 'left'),
            txt(`step ${currentStep} / 5`, 810, 184, 26, COSMOS.gold, 'mono', 'right'),
        )

        // Show 3 sliding/paired trace columns cleanly (left: previous, center: current active, right: next/final)
        const leftIdx = Math.max(0, Math.min(3, currentStep - 1))
        const colsX = [-535, 0, 535] as const
        for (let k = 0; k < 3; k++) {
            const rowIdx = Math.min(5, leftIdx + k)
            const row = TRACE_ROWS[rowIdx]!
            const isNow = rowIdx === currentStep
            const isPast = rowIdx < currentStep
            const col = isNow ? COSMOS.gold : isPast ? COSMOS.emerald : COSMOS.dim
            nodes.push(
                rect(516, 62, {
                    fill: isNow ? '#19213a' : '#0f1629',
                    stroke: isNow ? COSMOS.gold : isPast ? '#27594f' : '#1f2b45',
                    width: isNow ? 2.8 : 1.6,
                    radius: 12,
                })
                    .at(colsX[k]!, 250)
                    .glow(isNow ? 10 : 0, COSMOS.gold),
                txt(row.text, colsX[k]!, 250, 26, col, 'mono'),
            )
        }

        // Universal Lean 4 theorem bar at bottom
        nodes.push(
            txt(
                'theorem revAux_eq : ∀ xs, revAux xs [] = xs.reverse',
                0,
                362,
                30,
                th > 0.4 ? COSMOS.emerald : COSMOS.cyan,
                'mono',
            ).glow(th > 0.4 ? 10 : 5, th > 0.4 ? COSMOS.emerald : COSMOS.cyan),
        )

        return group(...nodes)
    })

    s.add(header, liveStage)

    // Smooth flight across tiles 1..5 timed to narration:
    // By t~2.5s (poster moment), tile 1 is in acc, tile 2 is mid-air on a glowing arc, tiles 3-5 are in input!
    c.at(0.05, () => s.play(step.to(2.45, { duration: 4.5 })))
    c.on('moving each head', () => s.play(step.to(5.0, { duration: 5.2 })))
    c.on('every finite list', () => s.play(theoremReveal.to(1, { duration: 1.0 })))
}

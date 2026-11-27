import {
    Node, circle, dot, dynamic, group, line, polyPath, rect, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

// 5 glowing linked cons-cells: 1 :: 2 :: 3 :: 4 :: 5 :: []
const CELLS = [
    { val: '1', col: COSMOS.gold },
    { val: '2', col: COSMOS.cyan },
    { val: '3', col: COSMOS.violet },
    { val: '4', col: COSMOS.emerald },
    { val: '5', col: COSMOS.blue },
] as const

// Upper-hero / bottom-title composition (soaring parabolic proof arcs above, monumental title below)
const CELL_Y = -58
const IN_XS = [-770, -645, -520, -395, -270] as const
const IN_NIL_X = -150
const ACC_XS = [150, 275, 400, 525, 650] as const
const ACC_NIL_X = 770

function parabolicArc(x0: number, x1: number, yBase: number, peakH: number, steps = 36): Vec[] {
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
    const step = s.value(0.25)
    const theoremReveal = s.value(0)

    // Clean floating TeX rewrite rule crowning the soaring arcs (zero box frame!)
    const ruleCrown = tex(String.raw`\operatorname{revAux}(x :: xs,\; acc) = \operatorname{revAux}(xs,\; x :: acc)`, {
        size: 32,
        color: COSMOS.cyan,
    }).at(0, -432).glow(7, COSMOS.cyan)

    // Monumental bottom-third editorial title
    const bottomTitle = group(
        txt('PROOFS FOR REAL SYSTEMS  ·  EP 3 / 3', 0, 198, 26, COSMOS.violet, 'mono', 'center'),
        txt('Lean 4: The Shape of a Proof', 0, 286, 86, COSMOS.ink, 'serif', 'center').glow(8, COSMOS.violet),
    )

    const liveStage = dynamic(() => {
        const st = step.value
        const th = theoremReveal.value
        const nodes: Node[] = [
            nebula(-460, CELL_Y, 380, '#ffd16620'),
            nebula(460, CELL_Y, 380, '#a78bfa24'),
            nebula(0, -240, 420, '#5ce1e618'),
            // Clean floating laser baseline rails under Input & Accumulator (de-boxed!)
            line([-825, CELL_Y + 62], [-105, CELL_Y + 62], { stroke: COSMOS.gold, width: 1.8 }).opacity(0.42),
            line([105, CELL_Y + 62], [825, CELL_Y + 62], { stroke: COSMOS.violet, width: 1.8 }).opacity(0.42),
            txt('INPUT LIST  (xs)', -465, CELL_Y + 102, 26, COSMOS.gold, 'mono', 'center'),
            txt('ACCUMULATOR  (acc)', 465, CELL_Y + 102, 26, COSMOS.violet, 'mono', 'center'),
        ]

        // Pre-lit target cons slots & pointer links on both rails
        for (let i = 0; i < 5; i++) {
            nodes.push(
                rect(84, 84, { fill: '#0e152988', stroke: '#233152', width: 1.6, radius: 16, dash: [6, 5] }).at(IN_XS[i]!, CELL_Y),
                rect(84, 84, { fill: '#0e152988', stroke: '#26375c', width: 1.6, radius: 16, dash: [6, 5] }).at(ACC_XS[i]!, CELL_Y),
            )
            const inNext = i < 4 ? IN_XS[i + 1]! : IN_NIL_X
            nodes.push(line([IN_XS[i]! + 44, CELL_Y], [inNext - 44, CELL_Y], { stroke: '#33466b', width: 2.2 }))
            const accNext = i < 4 ? ACC_XS[i + 1]! : ACC_NIL_X
            nodes.push(line([ACC_XS[i]! + 44, CELL_Y], [accNext - 44, CELL_Y], { stroke: '#33466b', width: 2.2 }))
        }

        // Glowing [] nil terminators
        nodes.push(
            rect(74, 74, { fill: '#10182e', stroke: COSMOS.muted, width: 2.4, radius: 14 }).at(IN_NIL_X, CELL_Y),
            txt('[]', IN_NIL_X, CELL_Y, 28, COSMOS.muted, 'mono'),
            rect(74, 74, { fill: '#10182e', stroke: COSMOS.emerald, width: 2.6, radius: 14 }).at(ACC_NIL_X, CELL_Y).glow(8, COSMOS.emerald),
            txt('[]', ACC_NIL_X, CELL_Y, 28, COSMOS.emerald, 'mono'),
        )

        // Parabolic comet arc trails & glowing cons-cells in flight
        CELLS.forEach((cell, i) => {
            const p = Math.max(0, Math.min(1, st - i))
            const x0 = IN_XS[i]!
            const x1 = ACC_XS[4 - i]!
            const peakH = 192 + (i % 3) * 20
            const fullArc = parabolicArc(x0, x1, CELL_Y, peakH, 36)

            if (p > 0.01) {
                const maxIdx = Math.max(2, Math.floor(p * (fullArc.length - 1)))
                const trailPts = fullArc.slice(0, maxIdx + 1)
                const isFlying = p < 0.99
                nodes.push(
                    new Node(polyPath(trailPts))
                        .stroke(cell.col, isFlying ? 5.6 : 2.8, isFlying ? 0.94 : 0.36)
                        .glow(isFlying ? 16 : 6, cell.col)
                        .set('blend', 'screen'),
                )
                if (isFlying) {
                    for (let k = 1; k <= 5; k++) {
                        const ti = Math.max(0, maxIdx - k * 2)
                        const tp = fullArc[ti]!
                        nodes.push(
                            dot(6.0 - k * 0.8, '#ffffff')
                                .at(tp[0], tp[1])
                                .glow(12, cell.col)
                                .opacity(1 - k * 0.16)
                                .set('blend', 'screen'),
                        )
                    }
                }
            }

            const cx = x0 + (x1 - x0) * p
            const cy = CELL_Y - Math.sin(p * Math.PI) * peakH
            const active = p > 0.01 && p < 0.99

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
                    circle(68, { fill: null, stroke: cell.col, width: 2.0 })
                        .at(cx, cy)
                        .opacity(0.45)
                        .set('blend', 'screen'),
                )
            }
        })

        // Clean unboxed live trace strip floating between the rails and title
        const currentStep = Math.min(5, Math.floor(st + 0.15))
        const leftIdx = Math.max(0, Math.min(3, currentStep - 1))
        const colsX = [-560, 0, 560] as const
        for (let k = 0; k < 3; k++) {
            const rowIdx = Math.min(5, leftIdx + k)
            const row = TRACE_ROWS[rowIdx]!
            const isNow = rowIdx === currentStep
            const isPast = rowIdx < currentStep
            const col = isNow ? COSMOS.gold : isPast ? COSMOS.emerald : COSMOS.dim
            nodes.push(
                txt(row.text, colsX[k]!, 104, isNow ? 30 : 26, col, 'mono')
                    .opacity(isNow ? 1 : 0.45)
                    .glow(isNow ? 10 : 0, COSMOS.gold),
            )
        }

        // Universal Lean 4 theorem anchoring the bottom edge
        nodes.push(
            txt(
                'theorem revAux_eq : ∀ xs, revAux xs [] = xs.reverse',
                0,
                386,
                30,
                th > 0.4 ? COSMOS.emerald : COSMOS.cyan,
                'mono',
            ).glow(th > 0.4 ? 10 : 6, th > 0.4 ? COSMOS.emerald : COSMOS.cyan),
        )

        return group(...nodes)
    })

    s.add(ruleCrown, liveStage, bottomTitle)

    c.at(0.05, () => s.play(step.to(2.45, { duration: 4.5 })))
    c.on('moving each head', () => s.play(step.to(5.0, { duration: 5.2 })))
    c.on('every finite list', () => s.play(theoremReveal.to(1, { duration: 1.0 })))
}

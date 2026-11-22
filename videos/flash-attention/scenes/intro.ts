import {
    Node, circle, dot, dynamic, group, radialGradient, rect,
    type IntroFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const COLS = 12
const ROWS = 11
const CX = 370
const CY = 10
const STEP_X = 42
const STEP_Y = 38

export const intro: IntroFunction = (stage, clock) => {
    const pulse = stage.value(0.25)

    const liveDie = dynamic(() => {
        const p = pulse.value
        const nodes: Node[] = [
            circle(470, {
                fill: radialGradient([0, 0], 470, [
                    [0, '#5ce1e62a'],
                    [0.48, '#ffd16614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY),
            circle(330 + p * 40, { fill: null, stroke: COSMOS.cyan, width: 2.2 }).at(CX, CY).opacity(0.45 * (1 - p * 0.4)).glow(8, COSMOS.cyan),
            circle(285, { fill: null, stroke: COSMOS.gold, width: 1.6, dash: [14, 10] }).at(CX, CY).opacity(0.5),
        ]
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = CX + (c - (COLS - 1) / 2) * STEP_X
                const y = CY + (r - (ROWS - 1) / 2) * STEP_Y
                const dist = Math.hypot((c - 5.5) / 6, (r - 5) / 5.5)
                const wave = Math.max(0, 1 - Math.abs(dist - p * 1.35) * 2.4)
                const isTile = r >= 3 && r <= 6 && c >= 4 && c <= 7
                const col = isTile ? COSMOS.gold : wave > 0.35 ? COSMOS.cyan : '#273a62'
                const op = isTile ? 0.95 : 0.32 + wave * 0.62
                nodes.push(
                    rect(28, 22, { fill: col, stroke: null, radius: 4 }).at(x, y).opacity(op),
                )
            }
        }
        nodes.push(
            rect(STEP_X * 4 + 12, STEP_Y * 4 + 10, { fill: null, stroke: COSMOS.gold, width: 3.2, radius: 8 })
                .at(CX + 0.5 * STEP_X, CY - 0.5 * STEP_Y)
                .glow(10, COSMOS.gold),
            dot(6, '#ffffff').at(CX + 330 * Math.cos(p * 2.2), CY + 330 * Math.sin(p * 2.2)).glow(12, COSMOS.cyan),
        )
        return group(...nodes)
    })

    stage.add(
        liveDie,
        txt('989 TFLOP/s   ·   3.35 TB/s HBM3', -840, -195, 26, COSMOS.gold, 'mono', 'left'),
        txt('FlashAttention', -848, -68, 114, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.blue),
        txt('Why GPUs spend 90%', -842, 62, 56, COSMOS.cyan, 'serif', 'left').glow(8, '#38bdf8'),
        txt('of their time waiting', -842, 132, 56, COSMOS.cyan, 'serif', 'left').glow(8, '#38bdf8'),
        txt('IO-aware exact attention in on-chip SRAM', -840, 224, 28, COSMOS.muted, 'sans', 'left'),
    )

    stage.at(0.02, () => stage.play(pulse.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

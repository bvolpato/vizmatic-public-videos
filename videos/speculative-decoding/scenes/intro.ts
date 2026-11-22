import {
    Node, circle, dot, dynamic, group, line, radialGradient, rect,
    type IntroFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const CX = 340
const CY = 0

export const intro: IntroFunction = (stage, clock) => {
    const prog = stage.value(0.25)

    stage.add(
        circle(520, {
            fill: radialGradient([0, 0], 520, [
                [0, '#ffd16626'],
                [0.45, '#5ce1e616'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY),
        txt('HIGH-SPEED LLM INFERENCE', -850, -210, 26, COSMOS.gold, 'mono', 'left'),
        txt('1,000 tok/s', -856, -78, 124, COSMOS.ink, 'serif', 'left').glow(6, '#90b4ff'),
        txt('Speculative Decoding', -856, 52, 86, COSMOS.cyan, 'serif', 'left').glow(8, '#38bdf8'),
        txt('KV Cache  ·  PagedAttention  ·  Exact Verification', -850, 174, 30, '#b8c5df', 'sans', 'left'),
        dynamic(() => {
            const p = prog.value
            const nodes: Node[] = []
            const startX = CX - 260
            const endX = CX + 260
            // Glowing parallel verification wave sweeping across 5 candidate token orbs
            const scanX = startX + p * (endX - startX)
            nodes.push(
                line([startX - 40, CY], [endX + 40, CY], { stroke: '#273454', width: 2.2 }),
                line([scanX, CY - 210], [scanX, CY + 210], { stroke: COSMOS.gold, width: 4.5 }).glow(14, COSMOS.gold),
                circle(40 + p * 220, { fill: null, stroke: COSMOS.gold, width: 2.2 }).at(CX, CY).opacity((1 - p * 0.7) * 0.55),
            )
            for (let i = 0; i < 5; i++) {
                const tx = startX + i * 130
                const verified = scanX >= tx
                const col = verified ? COSMOS.emerald : COSMOS.cyan
                nodes.push(
                    rect(88, 66, { fill: '#111626', stroke: col, width: 3.0, radius: 14 })
                        .at(tx, CY).glow(verified ? 12 : 6, col),
                    dot(6, '#ffffff').at(tx, CY - 54).glow(10, col),
                    txt(`t+${i + 1}`, tx, CY, 28, col, 'mono'),
                )
            }
            return group(...nodes)
        }),
    )

    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

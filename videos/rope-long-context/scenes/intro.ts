import {
    Node, arc, circle, dot, dynamic, group, line, radialGradient,
    type IntroFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const CX = 340
const CY = 0
const RING_RADII = [66, 114, 162, 210, 258, 306, 354] as const
const RING_COLORS = [
    COSMOS.cyan, '#38bdf8', COSMOS.blue, COSMOS.violet, '#c084fc', COSMOS.rose, COSMOS.gold,
] as const
// Geometric speeds matching theta_i = 10000^(-2i/d) visual ratio
const RING_SPEEDS = [1.0, 0.52, 0.27, 0.14, 0.075, 0.04, 0.022] as const

export const intro: IntroFunction = (stage, clock) => {
    const pos = stage.value(10)

    stage.add(
        circle(540, {
            fill: radialGradient([0, 0], 540, [
                [0, '#ffd16622'],
                [0.45, '#5ce1e614'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY),
        txt('ROTARY POSITIONAL EMBEDDINGS', -850, -210, 26, COSMOS.gold, 'mono', 'left'),
        txt('RoPE', -856, -78, 136, COSMOS.ink, 'serif', 'left').glow(6, '#90b4ff'),
        txt('Spinning Clocks', -856, 52, 102, COSMOS.cyan, 'serif', 'left').glow(8, '#38bdf8'),
        txt('How LLMs remember long context', -850, 174, 34, '#b8c5df', 'sans', 'left'),
        dynamic(() => {
            const m = pos.value
            const nodes: Node[] = [
                dot(7, '#ffffff').at(CX, CY).glow(14, COSMOS.gold),
            ]
            for (let i = 0; i < RING_RADII.length; i++) {
                const r = RING_RADII[i]!
                const col = RING_COLORS[i]!
                const ang = -Math.PI / 2 + m * RING_SPEEDS[i]!
                const hx = CX + Math.cos(ang) * r
                const hy = CY + Math.sin(ang) * r
                nodes.push(
                    circle(r, { fill: null, stroke: col, width: 1.6 }).at(CX, CY).opacity(0.32),
                    arc(r, ang - 0.85, ang, { fill: null, stroke: col, width: 3.4 }).at(CX, CY).opacity(0.85).glow(6, col),
                    line([CX, CY], [hx, hy], { stroke: col, width: 2.0 }).opacity(0.55),
                    dot(6.5, '#ffffff').at(hx, hy).glow(12, col),
                )
            }
            return group(...nodes)
        }),
    )

    stage.at(0.02, () => stage.play(pos.to(16, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

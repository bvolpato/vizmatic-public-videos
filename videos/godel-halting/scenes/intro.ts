import {
    Node, circle, dot, dynamic, group, line, linearGradient, radialGradient, rect,
    type IntroFunction,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const GRID = 7
const PITCH = 68
const GX = 405
const GY = 0
const HALF = ((GRID - 1) * PITCH) / 2

export const intro: IntroFunction = (stage, clock) => {
    const beam = stage.value(0.68)
    const beamGrad = linearGradient([GX - HALF, GY - HALF], [GX + HALF, GY + HALF], ['#ff6b8b', '#ffd166', '#ffffff'])

    stage.add(
        circle(520, {
            fill: radialGradient([0, 0], 520, [
                [0, '#ff6b8b26'],
                [0.45, '#4c2f8a18'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(GX, GY),
        txt('1931 · 1936 · LIMITS OF LOGIC', -840, -198, 26, '#ffd166', 'mono', 'left'),
        txt('Gödel & the', -848, -74, 114, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Halting Problem', -848, 54, 114, '#5ce1e6', 'serif', 'left').glow(8, '#38bdf8'),
        txt('Why no AI can prove every truth', -840, 178, 34, '#b8c5df', 'sans', 'left'),
        dynamic(() => {
            const p = beam.value
            const nodes: Node[] = []
            for (let r = 0; r < GRID; r++) {
                for (let c = 0; c < GRID; c++) {
                    const x = GX - HALF + c * PITCH
                    const y = GY - HALF + r * PITCH
                    const isDiag = r === c
                    const flipped = isDiag && r / (GRID - 1) <= p
                    const stroke = flipped ? '#ffd166' : '#2a3c63'
                    const fill = flipped ? '#ff6b8b38' : '#111b3388'
                    nodes.push(
                        rect(52, 52, { fill, stroke, width: flipped ? 2.4 : 1.2, radius: 10 }).at(x, y),
                        dot(flipped ? 6.5 : 4.2, flipped ? '#ffd166' : '#5ce1e6')
                            .at(x, y)
                            .opacity(flipped ? 1 : 0.72),
                    )
                }
            }
            const x0 = GX - HALF - 18
            const y0 = GY - HALF - 18
            const x1 = x0 + (HALF * 2 + 36) * p
            const y1 = y0 + (HALF * 2 + 36) * p
            nodes.push(
                line([x0, y0], [x1, y1], { stroke: beamGrad, width: 5.5 }).glow(12, '#ff6b8b'),
                line([x0, y0], [x1, y1], { stroke: '#ffffff', width: 1.6, opacity: 0.7 }),
                dot(8, '#ffffff').at(x1, y1).glow(16, '#ffd166'),
            )
            return group(...nodes)
        }),
    )

    stage.at(0.02, () => stage.play(beam.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

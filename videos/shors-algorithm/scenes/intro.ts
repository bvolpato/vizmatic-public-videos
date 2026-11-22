import {
    Node, circle, dot, dynamic, group, line, linearGradient, polyPath, radialGradient,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { QFT_32 } from '../math'
import { txt } from '../../../factory/style'

const CX = 415
const CY = 120
const WIDTH = 740

export const intro: IntroFunction = (stage, clock) => {
    const prog = stage.value(0.68)
    const waveGrad = linearGradient([CX - WIDTH / 2, CY], [CX + WIDTH / 2, CY], ['#5ce1e6', '#a78bfa', '#ffd166', '#5ce1e6'])

    stage.add(
        circle(520, {
            fill: radialGradient([0, 0], 520, [
                [0, '#ffd16628'],
                [0.45, '#38bdf818'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, -20),
        txt("SHOR'S ALGORITHM · 1994", -840, -198, 26, '#ffd166', 'mono', 'left'),
        txt('Quantum', -848, -74, 120, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Interference', -848, 54, 120, '#5ce1e6', 'serif', 'left').glow(8, '#38bdf8'),
        txt('Quantum computing without the hype', -840, 178, 34, '#b8c5df', 'sans', 'left'),
        dynamic(() => {
            const p = prog.value
            const nodes: Node[] = [
                line([CX - WIDTH / 2, CY], [CX + WIDTH / 2, CY], { stroke: '#253356', width: 2 }),
            ]
            const wavePts: Vec[] = Array.from({ length: 120 }, (_, i) => {
                const u = i / 119
                const x = CX - WIDTH / 2 + u * WIDTH
                const y = CY - 45 - Math.sin(u * Math.PI * 8 + p * 4.5) * 28 * (1 - 0.55 * p)
                return [x, y] as Vec
            })
            nodes.push(new Node(polyPath(wavePts)).stroke(waveGrad, 2.8, 0.58).glow(6, '#5ce1e6'))

            for (const bin of QFT_32) {
                const x = CX - WIDTH / 2 + (bin.k / (QFT_32.length - 1)) * WIDTH
                const isPeak = bin.prob > 0.1
                const h = isPeak ? 310 * p : 34 * (1 - p * 0.72)
                const col = isPeak ? '#ffd166' : '#5ce1e6'
                nodes.push(
                    line([x, CY], [x, CY - h], { stroke: col, width: isPeak ? 6 : 2.2 })
                        .opacity(isPeak ? 0.96 : 0.42)
                        .glow(isPeak ? 12 : 0, col),
                )
                if (isPeak) {
                    nodes.push(dot(7.5, '#ffffff').at(x, CY - h).glow(14, '#ffd166'))
                }
            }
            return group(...nodes)
        }),
    )

    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

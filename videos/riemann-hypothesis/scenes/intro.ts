import {
    Node, circle, dot, dynamic, group, line, linearGradient, polyPath, radialGradient,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { zeta } from '../math'
import { txt } from '../../../factory/style'

const SPIRAL_SAMPLES = 480
const CX = 330
const CY = 10
const SCALE = 158

const SPIRAL_PTS: Vec[] = Array.from({ length: SPIRAL_SAMPLES }, (_, i) => {
    const t = 0.6 + (32.8 * i) / (SPIRAL_SAMPLES - 1)
    const [re, im] = zeta(0.5, t)
    return [CX + re * SCALE, CY - im * SCALE] as Vec
})

export const intro: IntroFunction = (stage, clock) => {
    const grad = linearGradient([CX - 260, CY + 300], [CX + 380, CY - 300], ['#5ce1e6', '#7c8cff', '#c084fc', '#ff6b8b', '#ffd166'])
    const prog = stage.value(0.55)
    stage.add(
        circle(560, {
            fill: radialGradient([0, 0], 560, [
                [0, '#ffd16628'],
                [0.45, '#4c2f8a18'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY),
        line([CX - 340, CY], [CX + 420, CY], { stroke: '#1c243a', width: 1.2 }),
        line([CX, CY - 340], [CX, CY + 340], { stroke: '#1c243a', width: 1.2 }),
        txt('$1,000,000  MILLENNIUM PRIZE', -840, -195, 26, '#ffd166', 'mono', 'left'),
        txt('The Riemann', -848, -72, 126, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Hypothesis', -848, 56, 126, '#6be8f2', 'serif', 'left').glow(8, '#38bdf8'),
        txt('The hidden music of the prime numbers', -840, 178, 34, '#b8c5df', 'sans', 'left'),
        dynamic(() => {
            const count = Math.max(2, Math.floor(prog.value * SPIRAL_SAMPLES))
            const pts = SPIRAL_PTS.slice(0, count)
            const tip = pts[pts.length - 1]!
            return group(
                new Node(polyPath(pts)).stroke(grad, 4.6, 0.96).glow(9, '#7c8cff'),
                new Node(polyPath(pts)).stroke('#ffffff', 1.3, 0.4),
                dot(7, '#ffffff').at(tip[0], tip[1]).glow(14, '#ffd166'),
            )
        }),
    )
    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

import {
    Node, circle, dot, dynamic, group, line, linearGradient, polyPath, radialGradient,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { HOOK_CONTOUR, HOOK_EPICYCLES, evalEpicycles } from '../math'
import { txt } from '../../../factory/style'

const CX = 330
const CY = 10
const SCALE = 185

const FULL_TRACE: Vec[] = Array.from({ length: 240 }, (_, i) => {
    const u = i / 239
    const { tip } = evalEpicycles(HOOK_EPICYCLES, u, 5)
    return [CX + tip[0] * SCALE, CY - tip[1] * SCALE] as Vec
})

export const intro: IntroFunction = (stage, clock) => {
    const grad = linearGradient([CX - 280, CY + 280], [CX + 300, CY - 280], ['#5ce1e6', '#7c8cff', '#c084fc', '#ff6b8b', '#ffd166'])
    const prog = stage.value(0.58)
    const ghostPts: Vec[] = [...HOOK_CONTOUR, HOOK_CONTOUR[0]!].map(([re, im]) => [CX + re * SCALE, CY - im * SCALE])

    stage.add(
        circle(560, {
            fill: radialGradient([0, 0], 560, [
                [0, '#ffd16628'],
                [0.45, '#4c2f8a18'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY),
        line([CX - 360, CY], [CX + 360, CY], { stroke: '#1c243a', width: 1.2 }),
        line([CX, CY - 340], [CX, CY + 340], { stroke: '#1c243a', width: 1.2 }),
        new Node(polyPath(ghostPts)).stroke('#4c5e8a', 1.5, 0.25),
        txt('THE LANGUAGE OF SIGNALS', -840, -195, 26, '#ffd166', 'mono', 'left'),
        txt('The Fourier', -848, -72, 124, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Transform', -848, 56, 124, '#6be8f2', 'serif', 'left').glow(8, '#38bdf8'),
        txt('Turning chaos into epicycles & music', -840, 178, 34, '#b8c5df', 'sans', 'left'),
        dynamic(() => {
            const u = prog.value
            const count = Math.max(2, Math.floor(u * FULL_TRACE.length))
            const pts = FULL_TRACE.slice(0, count)
            const { centers, tip } = evalEpicycles(HOOK_EPICYCLES, u, 5)
            const nodes: Node[] = [
                new Node(polyPath(pts)).stroke(grad, 4.8, 0.96).glow(10, '#7c8cff'),
                new Node(polyPath(pts)).stroke('#ffffff', 1.3, 0.42),
            ]
            for (let k = 0; k < 5; k++) {
                const c0 = centers[k]!
                const c1 = centers[k + 1]!
                const r = HOOK_EPICYCLES[k]!.amp * SCALE
                const x0 = CX + c0[0] * SCALE
                const y0 = CY - c0[1] * SCALE
                const x1 = CX + c1[0] * SCALE
                const y1 = CY - c1[1] * SCALE
                nodes.push(
                    circle(r, { fill: null, stroke: '#ffd166', width: k === 0 ? 1.8 : 1.3 }).at(x0, y0).opacity(0.42),
                    line([x0, y0], [x1, y1], { stroke: '#ffd166', width: 2.2 }).opacity(0.85),
                )
            }
            nodes.push(dot(7, '#ffffff').at(CX + tip[0] * SCALE, CY - tip[1] * SCALE).glow(14, '#ffd166'))
            return group(...nodes)
        }),
    )
    stage.at(0.02, () => stage.play(prog.to(0.95, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

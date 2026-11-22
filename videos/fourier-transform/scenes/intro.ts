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

const RING_COLS = ['#ffd166', '#5ce1e6', '#a78bfa', '#ff6b8b', '#ffd166'] as const

export const intro: IntroFunction = (stage, clock) => {
    const grad = linearGradient([CX - 280, CY + 280], [CX + 300, CY - 280], ['#5ce1e6', '#7c8cff', '#c084fc', '#ff6b8b', '#ffd166'])
    const prog = stage.value(0.62)
    const ghostPts: Vec[] = [...HOOK_CONTOUR, HOOK_CONTOUR[0]!].map(([re, im]) => [CX + re * SCALE, CY - im * SCALE])

    stage.add(
        circle(560, {
            fill: radialGradient([0, 0], 560, [
                [0, '#ffd16634'],
                [0.45, '#4c2f8a22'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY).set('blend', 'screen'),
        line([CX - 360, CY], [CX + 360, CY], { stroke: '#222d48', width: 1.4 }),
        line([CX, CY - 340], [CX, CY + 340], { stroke: '#222d48', width: 1.4 }),
        new Node(polyPath(ghostPts)).stroke('#5b6f9e', 1.6, 0.32),
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
                new Node(polyPath(pts)).stroke(grad, 5.4, 0.96).glow(13, '#7c8cff').set('blend', 'screen'),
                new Node(polyPath(pts)).stroke('#ffffff', 1.4, 0.46),
            ]
            for (let k = 0; k < 5; k++) {
                const c0 = centers[k]!
                const c1 = centers[k + 1]!
                const r = HOOK_EPICYCLES[k]!.amp * SCALE
                const x0 = CX + c0[0] * SCALE
                const y0 = CY - c0[1] * SCALE
                const x1 = CX + c1[0] * SCALE
                const y1 = CY - c1[1] * SCALE
                const rCol = RING_COLS[k]!
                nodes.push(
                    circle(r, { fill: null, stroke: rCol, width: k === 0 ? 2.4 : 1.7 })
                        .at(x0, y0)
                        .opacity(k === 0 ? 0.68 : 0.56)
                        .glow(6, rCol)
                        .set('blend', 'screen'),
                    line([x0, y0], [x1, y1], { stroke: '#ffd166', width: k === 0 ? 2.8 : 2.2 })
                        .glow(7, '#ffd166')
                        .set('blend', 'screen')
                        .opacity(0.95),
                    dot(4.2, '#ffffff').at(x0, y0).glow(9, rCol).set('blend', 'screen').opacity(0.9),
                )
            }
            const tx = CX + tip[0] * SCALE
            const ty = CY - tip[1] * SCALE
            nodes.push(
                circle(26, {
                    fill: radialGradient([0, 0], 26, [
                        [0, '#ffd166aa'],
                        [1, '#ffd16600'],
                    ]),
                    stroke: null,
                }).at(tx, ty).set('blend', 'screen'),
                dot(7.5, '#ffffff').at(tx, ty).glow(16, '#ffd166').set('blend', 'screen'),
            )
            return group(...nodes)
        }),
    )
    stage.at(0.02, () => stage.play(prog.to(0.96, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

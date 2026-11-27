import {
    Node, circle, dot, dynamic, group, line, linearGradient, polyPath, radialGradient,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { HOOK_CONTOUR, HOOK_EPICYCLES, evalEpicycles } from '../math'
import { txt } from '../../../factory/style'

// Mirrored composition: Monumental golden epicycles on LEFT, crisp right-aligned editorial on RIGHT
const CX = -370
const CY = 0
const SCALE = 205

const FULL_TRACE: Vec[] = Array.from({ length: 240 }, (_, i) => {
    const u = i / 239
    const { tip } = evalEpicycles(HOOK_EPICYCLES, u, 5)
    return [CX + tip[0] * SCALE, CY - tip[1] * SCALE] as Vec
})

const RING_COLS = ['#ffd166', '#5ce1e6', '#a78bfa', '#ff6b8b', '#ffd166'] as const

export const intro: IntroFunction = (stage, clock) => {
    const grad = linearGradient([CX - 300, CY + 300], [CX + 320, CY - 300], ['#5ce1e6', '#7c8cff', '#c084fc', '#ff6b8b', '#ffd166'])
    const prog = stage.value(0.62)
    const ghostPts: Vec[] = [...HOOK_CONTOUR, HOOK_CONTOUR[0]!].map(([re, im]) => [CX + re * SCALE, CY - im * SCALE])

    stage.add(
        circle(580, {
            fill: radialGradient([0, 0], 580, [
                [0, '#ffd16638'],
                [0.45, '#4c2f8a24'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY).set('blend', 'screen'),
        line([CX - 390, CY], [CX + 390, CY], { stroke: '#222d48', width: 1.4 }),
        line([CX, CY - 370], [CX, CY + 370], { stroke: '#222d48', width: 1.4 }),
        new Node(polyPath(ghostPts)).stroke('#5b6f9e', 1.6, 0.32),
        txt('THE LANGUAGE OF SIGNALS', 852, -195, 26, '#ffd166', 'mono', 'right'),
        txt('The Fourier', 858, -72, 124, '#f8f4ec', 'serif', 'right').glow(6, '#90b4ff'),
        txt('Transform', 858, 56, 124, '#6be8f2', 'serif', 'right').glow(8, '#38bdf8'),
        txt('Turning chaos into epicycles & music', 852, 178, 34, '#b8c5df', 'sans', 'right'),
        dynamic(() => {
            const u = prog.value
            const count = Math.max(2, Math.floor(u * FULL_TRACE.length))
            const pts = FULL_TRACE.slice(0, count)
            const { centers, tip } = evalEpicycles(HOOK_EPICYCLES, u, 5)
            const nodes: Node[] = [
                new Node(polyPath(pts)).stroke(grad, 5.6, 0.96).glow(13, '#7c8cff').set('blend', 'screen'),
                new Node(polyPath(pts)).stroke('#ffffff', 1.5, 0.48),
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
                    circle(r, { fill: null, stroke: rCol, width: k === 0 ? 2.5 : 1.8 })
                        .at(x0, y0)
                        .opacity(k === 0 ? 0.72 : 0.58)
                        .glow(6, rCol)
                        .set('blend', 'screen'),
                    line([x0, y0], [x1, y1], { stroke: '#ffd166', width: k === 0 ? 3.0 : 2.3 })
                        .glow(7, '#ffd166')
                        .set('blend', 'screen')
                        .opacity(0.95),
                    dot(4.4, '#ffffff').at(x0, y0).glow(9, rCol).set('blend', 'screen').opacity(0.9),
                )
            }
            const tx = CX + tip[0] * SCALE
            const ty = CY - tip[1] * SCALE
            nodes.push(
                circle(28, {
                    fill: radialGradient([0, 0], 28, [
                        [0, '#ffd166aa'],
                        [1, '#ffd16600'],
                    ]),
                    stroke: null,
                }).at(tx, ty).set('blend', 'screen'),
                dot(8, '#ffffff').at(tx, ty).glow(16, '#ffd166').set('blend', 'screen'),
            )
            return group(...nodes)
        }),
    )
    stage.at(0.02, () => stage.play(prog.to(0.96, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

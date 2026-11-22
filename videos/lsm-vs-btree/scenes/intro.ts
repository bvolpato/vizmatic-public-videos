import {
    Node, circle, dot, dynamic, group, line, linearGradient, polyPath, radialGradient, rect,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const CX = 390
const CY = 0

const RIVER_XS = Array.from({ length: 64 }, (_, i) => CX - 260 + (520 * i) / 63)

export const intro: IntroFunction = (stage, clock) => {
    const prog = stage.value(0.2)
    const goldGrad = linearGradient([CX - 260, CY + 120], [CX + 260, CY + 120], ['#ffd16620', '#ffd166', '#ffffff', '#ffd166'])

    stage.add(
        circle(520, {
            fill: radialGradient([0, 0], 520, [
                [0, '#ffd16624'],
                [0.45, '#ff6b8b18'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY),
        txt('NVME SILICON & STORAGE ENGINES', -840, -195, 26, '#5ce1e6', 'mono', 'left'),
        txt('Inside an SSD', -848, -72, 114, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('B-Trees vs LSM', -848, 56, 106, '#ffd166', 'serif', 'left').glow(9, '#ffd166'),
        txt('Breaking the flash write-amplification wall', -840, 178, 34, '#b8c5df', 'sans', 'left'),
        dynamic(() => {
            const p = prog.value
            const nodes: Node[] = [
                // Silicon NVMe Die outer frame + glowing micro-pins
                rect(460, 440, { fill: '#0d1324', stroke: '#3a4b73', width: 3.2, radius: 18 }).at(CX, CY).glow(10, '#5ce1e6'),
                rect(420, 400, { fill: null, stroke: '#1f2b48', width: 1.5, radius: 12 }).at(CX, CY),
            ]
            // Flash page cells inside upper half (random rose strikes)
            for (let r = 0; r < 4; r++) {
                for (let colIdx = 0; colIdx < 6; colIdx++) {
                    const x = CX - 165 + colIdx * 66
                    const y = CY - 140 + r * 52
                    const hot = (r * 7 + colIdx * 3) % 5 === 0
                    const c = hot ? '#ff6b8b' : '#5ce1e6'
                    nodes.push(
                        rect(52, 36, { fill: hot ? '#ff6b8b38' : '#5ce1e618', stroke: c, width: hot ? 2.4 : 1.4, radius: 5 })
                            .at(x, y)
                            .opacity(hot ? 0.95 : 0.6),
                    )
                }
            }
            // Sequential golden river gliding cleanly through lower silicon channel
            const riverPts: Vec[] = RIVER_XS.map((x) => [
                x,
                CY + 125 + Math.sin(x * 0.025 - p * 5.0) * 14,
            ])
            nodes.push(
                new Node(polyPath(riverPts)).stroke(goldGrad, 6.5, 0.96).glow(12, '#ffd166'),
                new Node(polyPath(riverPts)).stroke('#ffffff', 1.8, 0.55),
                dot(8, '#ffffff').at(CX - 220 + p * 440, CY + 125).glow(16, '#ffd166'),
            )
            return group(...nodes)
        }),
    )

    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

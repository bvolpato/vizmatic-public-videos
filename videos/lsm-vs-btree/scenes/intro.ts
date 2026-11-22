import {
    Node, circle, dot, dynamic, group, line, linearGradient, polyPath, radialGradient, rect,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const CX = 390
const CY = 0

const RIVER_XS = Array.from({ length: 64 }, (_, i) => CX - 260 + (520 * i) / 63)

export const intro: IntroFunction = (stage, clock) => {
    const prog = stage.value(0.25)
    const goldGrad = linearGradient([CX - 260, CY + 120], [CX + 260, CY + 120], ['#ffd16620', '#ffd166', '#ffffff', '#ffd166'])

    stage.add(
        circle(530, {
            fill: radialGradient([0, 0], 530, [
                [0, '#ffd16628'],
                [0.45, '#ff6b8b1e'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY),
        txt('NVME SILICON & STORAGE ENGINES', -840, -195, 26, '#5ce1e6', 'mono', 'left'),
        txt('Inside an SSD', -848, -72, 114, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('B-Trees vs LSM', -848, 56, 106, '#ffd166', 'serif', 'left').glow(9, '#ffd166'),
        txt('Breaking the flash write-amplification wall', -840, 178, 34, '#c8d4ec', 'sans', 'left'),
        dynamic(() => {
            const p = prog.value
            const nodes: Node[] = [
                // Silicon NVMe Die outer frame + glowing micro-pins
                rect(480, 450, { fill: '#0d1324', stroke: '#4d6596', width: 3.4, radius: 18 }).at(CX, CY).glow(10, '#5ce1e6'),
                rect(440, 410, { fill: null, stroke: '#28395e', width: 1.6, radius: 12 }).at(CX, CY),
            ]
            // Flash page cells inside upper half (brightened unlit grid + hot random rose strikes with incoming 4 KB rays!)
            const hotTargets: Vec[] = []
            for (let r = 0; r < 4; r++) {
                for (let colIdx = 0; colIdx < 6; colIdx++) {
                    const x = CX - 165 + colIdx * 66
                    const y = CY - 140 + r * 52
                    const hot = (r * 7 + colIdx * 3) % 5 === 0
                    const c = hot ? '#ff6b8b' : '#5882b8'
                    if (hot) hotTargets.push([x, y])
                    nodes.push(
                        rect(54, 38, { fill: hot ? '#ff6b8b48' : '#182b4a', stroke: c, width: hot ? 2.6 : 1.6, radius: 5 })
                            .at(x, y)
                            .opacity(hot ? 0.98 : 0.85),
                    )
                }
            }
            // Incoming glowing 4 KB write rays smashing into hot pages with additive screen flashes
            for (let k = 0; k < Math.min(3, hotTargets.length); k++) {
                const [tx, ty] = hotTargets[k]!
                const sx = tx - 90 + k * 45
                const sy = CY - 265
                nodes.push(
                    line([sx, sy], [tx, ty], { stroke: '#ff6b8b', width: 3.2, opacity: 0.78 })
                        .glow(10, '#ff6b8b')
                        .set('blend', 'screen'),
                    circle(26, {
                        fill: radialGradient([0, 0], 26, [
                            [0, '#ffffffcc'],
                            [0.45, '#ff6b8b88'],
                            [1, '#07091000'],
                        ]),
                        stroke: null,
                    })
                        .at(tx, ty)
                        .set('blend', 'screen'),
                )
            }
            // Sequential golden river gliding cleanly through lower silicon channel
            const riverPts: Vec[] = RIVER_XS.map((x) => [
                x,
                CY + 125 + Math.sin(x * 0.025 - p * 5.0) * 14,
            ])
            nodes.push(
                new Node(polyPath(riverPts)).stroke(goldGrad, 7.0, 0.98).glow(14, '#ffd166').set('blend', 'screen'),
                new Node(polyPath(riverPts)).stroke('#ffffff', 2.0, 0.65).set('blend', 'screen'),
                dot(8.5, '#ffffff').at(CX - 220 + p * 440, CY + 125).glow(16, '#ffd166').set('blend', 'screen'),
            )
            return group(...nodes)
        }),
    )

    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

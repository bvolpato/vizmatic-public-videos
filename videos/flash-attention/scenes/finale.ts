import {
    Node, circle, dot, dynamic, ellipse, group, linear, radialGradient, rect,
    type SceneFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const CX = 0
const CY = -145

export const finale: SceneFunction = (s, c) => {
    const spin = s.value(0)

    const liveSymphony = dynamic(() => {
        const ph = spin.value
        const waveR = 55 + ((ph * 0.45) % 1) * 195
        const waveOp = (1 - ((ph * 0.45) % 1)) * 0.55

        const nodes: Node[] = [
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ffd1662c'],
                    [0.45, '#5ce1e618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY),
            circle(waveR, { fill: null, stroke: COSMOS.gold, width: 2.5 }).at(CX, CY).opacity(waveOp).glow(10, COSMOS.gold),
            // Concentric luminous SRAM orbital rings
            ellipse(340, 125, { fill: null, stroke: COSMOS.cyan, width: 2.6 }).at(CX, CY).opacity(0.62).glow(8, COSMOS.cyan),
            ellipse(270, 215, { fill: null, stroke: COSMOS.gold, width: 2.2, dash: [14, 10] }).at(CX, CY).opacity(0.55).glow(6, COSMOS.gold),
            circle(195, { fill: null, stroke: COSMOS.violet, width: 1.8 }).at(CX, CY).opacity(0.45),
        ]

        // Glowing miniature 12x11 GPU core jewel at center
        for (let r = 0; r < 11; r++) {
            for (let col = 0; col < 12; col++) {
                const x = CX + (col - 5.5) * 19
                const y = CY + (r - 5) * 16
                const wave = 0.55 + 0.45 * Math.sin(ph * 2.4 + (r + col) * 0.45)
                const isGold = (Math.floor(r / 3) + Math.floor(col / 3)) % 2 === 0
                nodes.push(
                    rect(13, 10, { fill: isGold ? COSMOS.gold : COSMOS.cyan, stroke: null, radius: 2.5 })
                        .at(x, y)
                        .opacity(0.45 + wave * 0.52),
                )
            }
        }

        // Orbiting glowing SRAM packets along the ellipses
        for (let k = 0; k < 6; k++) {
            const a1 = ph * 1.15 + (k * Math.PI) / 3
            const x1 = CX + Math.cos(a1) * 340
            const y1 = CY + Math.sin(a1) * 125
            nodes.push(dot(5.5, '#ffffff').at(x1, y1).glow(12, COSMOS.cyan))

            const a2 = -ph * 0.85 + (k * Math.PI) / 3 + 0.4
            const x2 = CX + Math.cos(a2) * 270
            const y2 = CY + Math.sin(a2) * 215
            nodes.push(dot(5, '#ffffff').at(x2, y2).glow(10, COSMOS.gold))
        }

        return group(...nodes)
    })

    const takeaway = group(
        txt("Don't write what you can fuse.", 0, 145, 78, COSMOS.ink, 'serif').glow(8, COSMOS.blue),
        txt('2–4× faster  ·  O(N) memory  ·  exact attention', 0, 236, 42, COSMOS.gold, 'serif').glow(8, COSMOS.gold),
        txt('FlashAttention  ·  IO-Aware On-Chip SRAM Kernel', 0, 322, 26, '#8b99b8', 'mono'),
    )

    s.add(liveSymphony, takeaway)
    c.at(0.05, () => s.play(spin.to(7.5, { duration: 15.0, ease: linear })))
}

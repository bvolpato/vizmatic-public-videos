import {
    Node, circle, dot, dynamic, group, line, linear, polygon, radialGradient,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// Equilateral RUM Tradeoff Triangle centered cleanly in the upper stage
const CX = 0
const CY = -165
const TRI_R = 175
const V_READ: Vec = [CX, CY - TRI_R] // Top: Read Overhead (B-Tree)
const V_UPDATE: Vec = [CX - TRI_R * 0.95, CY + TRI_R * 0.62] // Bottom-left: Update Overhead (LSM-Tree)
const V_MEM: Vec = [CX + TRI_R * 0.95, CY + TRI_R * 0.62] // Bottom-right: Memory Overhead (Bloom + Cache)

export const finale: SceneFunction = (s, c) => {
    const orbit = s.value(0)
    const reveal = s.value(0)

    const liveFinale = dynamic(() => {
        const o = orbit.value
        const rv = reveal.value
        // Smooth cursor balancing inside the RUM triangle
        const cursorX = CX + Math.cos(o * 1.4) * 58
        const cursorY = CY + 14 + Math.sin(o * 1.4) * 38
        const waveR = 45 + ((o * 0.45) % 1) * 190
        const waveOp = (1 - ((o * 0.45) % 1)) * 0.55

        const nodes: Node[] = [
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ffd16624'],
                    [0.45, '#5ce1e618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY),
            circle(waveR, { fill: null, stroke: '#ffd166', width: 2.2 }).at(CX, CY + 12).opacity(waveOp).glow(8, '#ffd166'),
            // RUM Tradeoff Triangle
            polygon([V_READ, V_UPDATE, V_MEM], { fill: '#121b3366', stroke: '#5ce1e6', width: 3.6 }).glow(10, '#5ce1e6'),
            line(V_READ, [cursorX, cursorY], { stroke: '#5ce1e6', width: 2, opacity: 0.65 }),
            line(V_UPDATE, [cursorX, cursorY], { stroke: '#ffd166', width: 2.6, opacity: 0.85 }),
            line(V_MEM, [cursorX, cursorY], { stroke: '#a78bfa', width: 2, opacity: 0.65 }),
            // Glowing equilibrium dot
            dot(10, '#ffffff').at(cursorX, cursorY).glow(16, '#ffd166'),
            // Three RUM vertices + labels
            circle(20, { fill: '#0d182b', stroke: '#5ce1e6', width: 3.5 }).at(V_READ[0], V_READ[1]).glow(10, '#5ce1e6'),
            txt('READ  (B-Tree)', V_READ[0], V_READ[1] - 48, 30, '#5ce1e6', 'mono').glow(6, '#5ce1e6'),
            circle(22, { fill: '#0d182b', stroke: '#ffd166', width: 3.8 }).at(V_UPDATE[0], V_UPDATE[1]).glow(12, '#ffd166'),
            txt('UPDATE  (LSM-Tree)', V_UPDATE[0] - 195, V_UPDATE[1] + 8, 30, '#ffd166', 'mono').glow(6, '#ffd166'),
            circle(20, { fill: '#0d182b', stroke: '#a78bfa', width: 3.5 }).at(V_MEM[0], V_MEM[1]).glow(10, '#a78bfa'),
            txt('MEMORY  (Bloom)', V_MEM[0] + 195, V_MEM[1] + 8, 30, '#a78bfa', 'mono').glow(6, '#a78bfa'),
            // Closing viral takeaway
            txt('Turn random writes into', 0, 128, 70, '#f8f4ec', 'serif').opacity(0.35 + rv * 0.65).glow(6, '#90b4ff'),
            txt('sequential streams.', 0, 218, 74, '#ffd166', 'serif').opacity(0.35 + rv * 0.65).glow(10, '#ffd166'),
            txt('NVMe Flash Silicon  ·  B-Trees vs LSM-Trees  ·  RUM Conjecture', 0, 316, 28, '#8b99b8', 'mono').opacity(0.4 + rv * 0.6),
        ]
        return group(...nodes)
    })

    s.add(liveFinale)
    c.at(0.1, () => s.play(orbit.to(6.2, { duration: 15.5, ease: linear })))
    c.on('turn random writes', () => s.play(reveal.to(1, { duration: 0.8 })))
}

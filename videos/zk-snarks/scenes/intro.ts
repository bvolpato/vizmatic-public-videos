import {
    Node, circle, dot, dynamic, group, line, linearGradient, polyPath, polygon, radialGradient,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const CX = 370
const CY = 0

function hexRing(radius: number, rot: number): Vec[] {
    return Array.from({ length: 6 }, (_, i) => {
        const a = rot + (i * Math.PI) / 3
        return [CX + Math.cos(a) * radius, CY + Math.sin(a) * radius] as Vec
    })
}

export const intro: IntroFunction = (stage, clock) => {
    const prog = stage.value(0.25)
    const beamGrad = linearGradient([CX - 340, CY], [CX + 340, CY], ['#5ce1e600', '#ffd166', '#ffffff', '#ffd166', '#5ce1e600'])

    stage.add(
        circle(520, {
            fill: radialGradient([0, 0], 520, [
                [0, '#ffd1662c'],
                [0.42, '#a78bfa1c'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY),
        txt('192-BYTE CRYPTOGRAPHIC GEM', -840, -195, 26, '#5ce1e6', 'mono', 'left'),
        txt('Zero-Knowledge', -848, -72, 112, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Proofs', -848, 56, 116, '#ffd166', 'serif', 'left').glow(9, '#ffd166'),
        txt('Proving a secret without showing a single bit', -840, 178, 34, '#b8c5df', 'sans', 'left'),
        dynamic(() => {
            const p = prog.value
            const outer = hexRing(245, p * 0.45)
            const inner = hexRing(155, -p * 0.7)
            const gem: Vec[] = [
                [CX, CY - 92],
                [CX + 68, CY],
                [CX, CY + 92],
                [CX - 68, CY],
            ]
            const facets: Node[] = [
                line([CX, CY - 92], [CX, CY + 92], { stroke: '#fff7d6', width: 2, opacity: 0.7 }),
                line([CX - 68, CY], [CX + 68, CY], { stroke: '#fff7d6', width: 2, opacity: 0.7 }),
                line([CX - 320, CY], [CX + 320, CY], { stroke: beamGrad, width: 3.5, opacity: 0.85 }).glow(8, '#ffd166'),
            ]
            const orbitNodes: Node[] = Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2 + p * 0.9
                const r = 200
                const col = i % 2 === 0 ? '#5ce1e6' : '#a78bfa'
                return dot(4, col).at(CX + Math.cos(a) * r, CY + Math.sin(a) * r).glow(6, col)
            })
            return group(
                circle(290, { fill: null, stroke: '#a78bfa', width: 1.8, dash: [10, 14] }).at(CX, CY).opacity(0.42),
                polygon(outer, { fill: null, stroke: '#5ce1e6', width: 2.2 }).opacity(0.55).glow(6, '#5ce1e6'),
                polygon(inner, { fill: '#17123080', stroke: '#a78bfa', width: 2.6 }).glow(8, '#a78bfa'),
                ...orbitNodes,
                polygon(gem, { fill: '#ffd16638', stroke: '#ffd166', width: 4 }).glow(14, '#ffd166'),
                ...facets,
                dot(8, '#ffffff').at(CX, CY).glow(16, '#ffd166'),
                new Node(polyPath([outer[0]!, inner[0]!])).stroke('#5ce1e6', 1.5, 0.35),
            )
        }),
    )

    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

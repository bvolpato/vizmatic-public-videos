import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, polygon, radialGradient,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const GEM_X = 0
const GEM_Y = -145

// Deterministic cloud of hidden computation gates collapsing along light filaments into one gem
const GATE_CLOUD = Array.from({ length: 40 }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1
    const angle = (side === -1 ? Math.PI : 0) + (((i * 37) % 100) / 100 - 0.5) * 0.65
    const dist = 250 + ((i * 89) % 440)
    return {
        x: GEM_X + Math.cos(angle) * dist,
        y: GEM_Y + Math.sin(angle) * dist * 0.34,
        col: i % 3 === 0 ? '#5ce1e6' : i % 3 === 1 ? '#a78bfa' : '#60a5fa',
        phase: (i * 0.17) % 1,
    }
})

export const finale: SceneFunction = (s, c) => {
    const flow = s.value(0)
    const takeaway = s.value(0)

    const filamentGrad = linearGradient([-760, GEM_Y], [760, GEM_Y], ['#5ce1e620', '#a78bfa70', '#ffd166', '#a78bfa70', '#5ce1e620'])

    const liveFinale = dynamic(() => {
        const f = flow.value
        const waveR = 65 + ((f * 1.4) % 1) * 240
        const waveOp = (1 - ((f * 1.4) % 1)) * 0.65

        const gem: Vec[] = [
            [GEM_X, GEM_Y - 102],
            [GEM_X + 74, GEM_Y],
            [GEM_X, GEM_Y + 102],
            [GEM_X - 74, GEM_Y],
        ]

        const nodes: Node[] = [
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, '#ffd16634'],
                    [0.45, '#5ce1e618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(GEM_X, GEM_Y),
        ]

        // Millions of gates collapsing into the central 192-byte golden proof gem
        for (const g of GATE_CLOUD) {
            const t = (f * 0.55 + g.phase) % 1
            const px = g.x + (GEM_X - g.x) * t
            const py = g.y + (GEM_Y - g.y) * t
            nodes.push(
                line([g.x, g.y], [GEM_X, GEM_Y], { stroke: filamentGrad, width: 1.3, opacity: 0.22 }),
                dot(3.4, g.col).at(g.x, g.y).opacity(0.65),
                dot(4.5, '#ffd166').at(px, py).opacity((1 - t) * 0.9).glow(6, '#ffd166'),
            )
        }

        nodes.push(
            circle(waveR, { fill: null, stroke: '#6ee7b7', width: 2.6 }).at(GEM_X, GEM_Y).opacity(waveOp).glow(8, '#6ee7b7'),
            circle(145, { fill: null, stroke: '#a78bfa', width: 1.8, dash: [8, 12] }).at(GEM_X, GEM_Y).opacity(0.55),
            polygon(gem, { fill: '#ffd16645', stroke: '#ffd166', width: 4.5 }).glow(16, '#ffd166'),
            line([GEM_X, GEM_Y - 102], [GEM_X, GEM_Y + 102], { stroke: '#fff7d6', width: 2, opacity: 0.75 }),
            line([GEM_X - 74, GEM_Y], [GEM_X + 74, GEM_Y], { stroke: '#fff7d6', width: 2, opacity: 0.75 }),
            dot(9, '#ffffff').at(GEM_X, GEM_Y).glow(18, '#ffd166'),
            new Node(polyPath([[-760, GEM_Y], [-170, GEM_Y]])).stroke('#5ce1e6', 2, 0.3),
            new Node(polyPath([[170, GEM_Y], [760, GEM_Y]])).stroke('#5ce1e6', 2, 0.3),
            txt('1,000,000+ GATES', -580, GEM_Y - 195, 28, '#5ce1e6', 'mono'),
            txt('192 BYTES · 4 MS', 580, GEM_Y - 195, 28, '#6ee7b7', 'mono'),
        )

        const tw = takeaway.value
        nodes.push(
            txt('Algebra turns a million hidden steps', 0, 128, 66, '#f8f4ec', 'serif').opacity(0.35 + tw * 0.65).glow(6, '#90b4ff'),
            txt('into one unforgeable point.', 0, 214, 68, '#ffd166', 'serif').opacity(0.35 + tw * 0.65).glow(10, '#ffd166'),
            txt('zk-SNARKs  ·  Constant-size proofs  ·  Zero secret bits revealed', 0, 312, 28, '#8b99b8', 'mono').opacity(0.4 + tw * 0.6),
        )
        return group(...nodes)
    })

    s.add(liveFinale)
    c.at(0.1, () => s.play(flow.to(5.0, { duration: 11.5, ease: linear })))
    c.on('Algebra turns', () => s.play(takeaway.to(1, { duration: 0.8 })))
}

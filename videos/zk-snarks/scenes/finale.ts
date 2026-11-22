import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, polygon,
    radialGradient, rect, type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const GEM_X = 95
const GEM_Y = -155

function quadPt(p0: Vec, p1: Vec, p2: Vec, t: number): Vec {
    const u = 1 - t
    return [
        u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
        u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]
}

// Dense 220-node sparkling circuit cloud on the LEFT funneling dramatically into the glowing golden prism!
const CIRCUIT_CLOUD = Array.from({ length: 220 }, (_, i) => {
    const h1 = Math.sin(i * 127.1 + 1.3) * 43758.5453
    const h2 = Math.sin(i * 269.5 + 7.9) * 19642.349
    const u = h1 - Math.floor(h1) // 0..1 horizontal depth inside funnel
    const v = (h2 - Math.floor(h2)) * 2 - 1 // -1..1 vertical spread
    const x = -830 + u * 735 // -830 .. -95
    // Funnel height narrows smoothly as x approaches GEM_X
    const tFunnel = Math.max(0.12, (GEM_X - x) / 925)
    const maxSpread = 230 * Math.pow(tFunnel, 0.85)
    const y = GEM_Y + v * maxSpread
    const col = i % 5 === 0 ? '#ffd166' : i % 3 === 0 ? '#5ce1e6' : i % 3 === 1 ? '#a78bfa' : '#60a5fa'
    return {
        x,
        y,
        ctrlX: (x + GEM_X) * 0.52,
        ctrlY: GEM_Y + (y - GEM_Y) * 0.28,
        col,
        size: 2.0 + (i % 4) * 0.85,
        phase: (i * 0.073) % 1,
        hasFilament: i % 4 === 0,
    }
})

export const finale: SceneFunction = (s, c) => {
    const flow = s.value(0)
    const takeaway = s.value(0)

    const beamGrad = linearGradient([GEM_X + 70, GEM_Y], [810, GEM_Y], ['#ffffff', '#ffd166', '#ffd166', '#6ee7b7'])

    const liveFinale = dynamic(() => {
        const f = flow.value
        const wavePhase = (f * 1.1) % 1
        const waveR = 68 + wavePhase * 185
        const waveOp = (1 - wavePhase) * 0.62

        const gem: Vec[] = [
            [GEM_X, GEM_Y - 104],
            [GEM_X + 76, GEM_Y],
            [GEM_X, GEM_Y + 104],
            [GEM_X - 76, GEM_Y],
        ]

        const nodes: Node[] = [
            // Left cloud ambient cyan-violet glow
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#5ce1e622'],
                    [0.5, '#a78bfa16'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(-450, GEM_Y),
            // Prism golden aura
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ffd1663c'],
                    [0.45, '#5ce1e618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(GEM_X, GEM_Y),
        ]

        // 220-node sparkling circuit cloud funneling into the golden prism with additive screen blend
        const entryPt: Vec = [GEM_X - 68, GEM_Y]
        for (const g of CIRCUIT_CLOUD) {
            const p0: Vec = [g.x, g.y]
            const p1: Vec = [g.ctrlX, g.ctrlY]
            if (g.hasFilament) {
                const pts = Array.from({ length: 14 }, (_, k) => quadPt(p0, p1, entryPt, k / 13))
                nodes.push(
                    new Node(polyPath(pts)).stroke(g.col, 1.25, 0.26).set('blend', 'screen'),
                )
            }
            const twinkle = 0.55 + 0.45 * Math.sin(f * 5.2 + g.phase * 18)
            nodes.push(
                dot(g.size, g.col).at(g.x, g.y).opacity(twinkle).glow(5, g.col).set('blend', 'screen'),
            )
            // Sparkling compressed photons accelerating along the funnel into the prism
            if (g.hasFilament) {
                const t = (f * 0.58 + g.phase) % 1
                const [px, py] = quadPt(p0, p1, entryPt, t * t)
                nodes.push(
                    dot(3.8, '#ffd166').at(px, py).opacity((1 - t * 0.65) * 0.92).glow(8, '#ffd166').set('blend', 'screen'),
                )
            }
        }

        // Funnel boundary guide curves (subtle cyan/violet optics framing the compression cone)
        const topEdge = Array.from({ length: 24 }, (_, k) => quadPt([-825, GEM_Y - 215], [-340, GEM_Y - 120], [GEM_X - 68, GEM_Y - 14], k / 23))
        const botEdge = Array.from({ length: 24 }, (_, k) => quadPt([-825, GEM_Y + 215], [-340, GEM_Y + 120], [GEM_X - 68, GEM_Y + 14], k / 23))
        nodes.push(
            new Node(polyPath(topEdge)).stroke('#5ce1e6', 2.0, 0.35).glow(6, '#5ce1e6').set('blend', 'screen'),
            new Node(polyPath(botEdge)).stroke('#a78bfa', 2.0, 0.35).glow(6, '#a78bfa').set('blend', 'screen'),
        )

        // ONE single razor-sharp concentrated golden 192-byte proof beam shooting cleanly to the right!
        const beamStartX = GEM_X + 74
        const beamEndX = 765
        const pulseX = beamStartX + ((f * 0.85) % 1) * (beamEndX - beamStartX - 30)
        nodes.push(
            // Wide soft additive golden halo
            line([beamStartX, GEM_Y], [beamEndX, GEM_Y], { stroke: beamGrad, width: 22, opacity: 0.34 })
                .glow(20, '#ffd166')
                .set('blend', 'screen'),
            // Concentrated golden beam
            line([beamStartX, GEM_Y], [beamEndX, GEM_Y], { stroke: beamGrad, width: 7.5, opacity: 0.98 })
                .glow(12, '#ffd166')
                .set('blend', 'screen'),
            // Razor-sharp white-hot optical core
            line([beamStartX, GEM_Y], [beamEndX, GEM_Y], { stroke: '#ffffff', width: 2.5, opacity: 0.96 })
                .set('blend', 'screen'),
            // Streaking photon burst along the output beam
            line([Math.max(beamStartX, pulseX - 70), GEM_Y], [pulseX, GEM_Y], { stroke: '#ffffff', width: 5.5, opacity: 0.9 })
                .glow(14, '#ffd166')
                .set('blend', 'screen'),
            dot(8.5, '#ffffff').at(pulseX, GEM_Y).glow(16, '#ffd166').set('blend', 'screen'),
            // Right-side verifier terminal target jewel
            circle(34, { fill: '#0f2822', stroke: '#6ee7b7', width: 3.4 }).at(beamEndX + 26, GEM_Y).glow(14, '#6ee7b7'),
            dot(10, '#6ee7b7').at(beamEndX + 26, GEM_Y).glow(16, '#6ee7b7').set('blend', 'screen'),
        )

        // Glowing golden compression prism
        nodes.push(
            circle(waveR, { fill: null, stroke: '#6ee7b7', width: 2.4 }).at(GEM_X, GEM_Y).opacity(waveOp).glow(10, '#6ee7b7').set('blend', 'screen'),
            circle(138, { fill: null, stroke: '#a78bfa', width: 1.8, dash: [8, 12] }).at(GEM_X, GEM_Y).opacity(0.55),
            polygon(gem, { fill: '#ffd1664e', stroke: '#ffd166', width: 4.6 }).glow(18, '#ffd166').set('blend', 'screen'),
            line([GEM_X, GEM_Y - 104], [GEM_X, GEM_Y + 104], { stroke: '#fff7d6', width: 2, opacity: 0.85 }).set('blend', 'screen'),
            line([GEM_X - 76, GEM_Y], [GEM_X + 76, GEM_Y], { stroke: '#fff7d6', width: 2, opacity: 0.85 }).set('blend', 'screen'),
            dot(10, '#ffffff').at(GEM_X, GEM_Y).glow(20, '#ffd166').set('blend', 'screen'),
            // Clean callout headers above left cloud & right proof beam
            rect(325, 48, { fill: '#111626d8', stroke: '#5ce1e6', width: 2.2, radius: 24 }).at(-560, -395),
            txt('1,000,000+ GATES', -560, -393, 26, '#5ce1e6', 'mono'),
            rect(325, 48, { fill: '#111626d8', stroke: '#6ee7b7', width: 2.2, radius: 24 }).at(545, -395),
            txt('192 BYTES · 4 MS', 545, -393, 26, '#6ee7b7', 'mono'),
            txt('192-BYTE PROOF BEAM', 475, GEM_Y + 56, 26, '#ffd166', 'mono').glow(6, '#ffd166'),
        )

        const tw = takeaway.value
        nodes.push(
            txt('Algebra turns a million hidden steps', 0, 132, 66, '#f8f4ec', 'serif').opacity(0.4 + tw * 0.6).glow(6, '#90b4ff'),
            txt('into one unforgeable point.', 0, 218, 68, '#ffd166', 'serif').opacity(0.4 + tw * 0.6).glow(10, '#ffd166'),
            txt('zk-SNARKs  ·  Constant-size proofs  ·  Zero secret bits revealed', 0, 316, 28, '#a8b8d8', 'mono').opacity(0.65 + tw * 0.35),
        )
        return group(...nodes)
    })

    s.add(liveFinale)
    c.at(0.1, () => s.play(flow.to(5.0, { duration: Math.max(6.0, c.end - c.start - 0.25), ease: linear })))
    c.on('Algebra turns', () => s.play(takeaway.to(1, { duration: 0.8 })))
}

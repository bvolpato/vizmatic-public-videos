import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, radialGradient,
    type SceneFunction,
} from 'vizmatic/stage'
import { mulberry32, sampleGaussian2D } from '../math'
import { COSMOS, txt } from '../../../factory/style'

const CY = -145
const LEFT_X = -515
const RIGHT_X = 515

const rng = mulberry32(4242)
// 26 optimal-transport bridge pairs connecting pure Gaussian noise (left) to a luminous geometric star mandala (right)
const BRIDGE_PAIRS = Array.from({ length: 26 }, (_, i) => {
    const [gx, gy] = sampleGaussian2D(rng)
    const x0 = LEFT_X + gx * 82
    const y0 = CY + gy * 82

    // Crisp 13-point concentric golden star mandala on right
    const ang = (i * Math.PI * 2) / 26 - Math.PI / 2
    const rad = i % 2 === 0 ? 158 : 74
    const x1 = RIGHT_X + Math.cos(ang) * rad
    const y1 = CY + Math.sin(ang) * rad
    return { x0, y0, x1, y1, speed: 0.45 + (i % 5) * 0.08, offset: (i * 0.13) % 1 }
})

// Extra ambient noise dots on left
const NOISE_SWARM = Array.from({ length: 70 }, () => {
    const [gx, gy] = sampleGaussian2D(rng)
    return [LEFT_X + gx * 95, CY + gy * 95] as const
})

export const finale: SceneFunction = (s, c) => {
    const flow = s.value(0)

    const liveBridge = dynamic(() => {
        const ph = flow.value
        const shockR = 45 + ((ph * 0.42) % 1) * 240
        const shockOp = (1 - ((ph * 0.42) % 1)) * 0.65

        const nodes: Node[] = [
            // Left violet noise nebula
            circle(265, {
                fill: radialGradient([0, 0], 265, [
                    [0, '#a78bfa2e'],
                    [0.55, '#5ce1e612'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(LEFT_X, CY),
            // Right golden structure aura
            circle(285, {
                fill: radialGradient([0, 0], 285, [
                    [0, '#ffd16634'],
                    [0.5, '#5ce1e616'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(RIGHT_X, CY),
            circle(shockR, { fill: null, stroke: COSMOS.gold, width: 2.5 }).at(RIGHT_X, CY).opacity(shockOp).glow(10, COSMOS.gold),
            // Noise cloud ambient particles
            ...NOISE_SWARM.map(([x, y], i) =>
                dot(2.1, i % 2 === 0 ? COSMOS.violet : COSMOS.cyan).at(x, y).opacity(0.62),
            ),
        ]

        // 26 laser-straight optimal-transport light beams + gliding photons
        for (let i = 0; i < BRIDGE_PAIRS.length; i++) {
            const p = BRIDGE_PAIRS[i]!
            const grad = linearGradient([p.x0, p.y0], [p.x1, p.y1], [COSMOS.violet, COSMOS.cyan, COSMOS.gold])
            nodes.push(
                line([p.x0, p.y0], [p.x1, p.y1], { stroke: grad, width: i % 3 === 0 ? 2.4 : 1.3 }).opacity(i % 3 === 0 ? 0.56 : 0.28),
                dot(3.8, COSMOS.violet).at(p.x0, p.y0).opacity(0.85),
                dot(4.6, COSMOS.gold).at(p.x1, p.y1).glow(8, COSMOS.gold),
            )
            // Gliding photon packet along the straight ray
            const u = (ph * p.speed + p.offset) % 1
            const px = p.x0 + (p.x1 - p.x0) * u
            const py = p.y0 + (p.y1 - p.y0) * u
            nodes.push(dot(3.8, '#ffffff').at(px, py).glow(8, u > 0.55 ? COSMOS.gold : COSMOS.cyan).opacity(0.92))
        }

        // Connect right star vertices into a crisp glowing mandala outline
        for (let i = 0; i < BRIDGE_PAIRS.length; i++) {
            const a = BRIDGE_PAIRS[i]!
            const b = BRIDGE_PAIRS[(i + 1) % BRIDGE_PAIRS.length]!
            nodes.push(
                line([a.x1, a.y1], [b.x1, b.y1], { stroke: COSMOS.gold, width: 2.4 }).opacity(0.85).glow(6, COSMOS.gold),
            )
        }

        nodes.push(
            txt('PURE NOISE', LEFT_X, CY + 202, 26, COSMOS.violet, 'mono'),
            txt('STRAIGHT OPTIMAL TRANSPORT', 0, CY + 202, 26, COSMOS.cyan, 'mono'),
            txt('PURE STRUCTURE', RIGHT_X, CY + 202, 26, COSMOS.gold, 'mono'),
        )

        return group(...nodes)
    })

    const takeaway = group(
        txt('Straight paths turn 1,000 steps into a blink.', 0, 165, 68, COSMOS.ink, 'serif').glow(8, COSMOS.violet),
        txt('Noise  →  Straight Velocity Field  →  Structure', 0, 254, 40, COSMOS.gold, 'serif').glow(8, COSMOS.gold),
        txt('Diffusion & Flow Matching  ·  dx/dt = vθ(x, t)', 0, 336, 26, '#8b99b8', 'mono'),
    )

    s.add(liveBridge, takeaway)
    c.at(0.05, () => s.play(flow.to(6.0, { duration: 15.0, ease: linear })))
}

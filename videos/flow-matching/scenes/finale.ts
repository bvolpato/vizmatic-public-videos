import {
    Node, circle, contourPaths, dot, dynamic, group, line, linear, linearGradient, polyPath, scalarField, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { HOOK_PARTICLES, mulberry32, sampleGaussian2D } from '../math'
import { COSMOS, txt } from '../../../factory/style'

const CY = -148
const LEFT_X = -545
const RIGHT_X = 505
const TARGET_SCALE = 112

const rng = mulberry32(4242)

// Callback to the iconic golden crescent + 5-pointed star constellation on the right!
const TARGET_CONSTELLATION = HOOK_PARTICLES.filter((p, i) => p.kind !== 'halo' && i % 3 === 0)

// Triple the blend('screen') straight optimal-transport light rays across the frame (78 rays!)
const BRIDGE_PAIRS = Array.from({ length: 78 }, (_, i) => {
    const [gx, gy] = sampleGaussian2D(rng)
    const r = Math.hypot(gx, gy)
    const clampR = r > 2.2 ? 2.2 / r : 1
    const x0 = LEFT_X + gx * clampR * 76
    const y0 = CY + gy * clampR * 76

    const tp = TARGET_CONSTELLATION[Math.floor((i * TARGET_CONSTELLATION.length) / 78)]!
    const x1 = RIGHT_X + tp.x1[0] * TARGET_SCALE
    const y1 = CY + tp.x1[1] * TARGET_SCALE
    return {
        x0,
        y0,
        x1,
        y1,
        kind: tp.kind,
        speed: 0.44 + (i % 6) * 0.08,
        offset: (i * 0.137) % 1,
        isHero: i % 3 === 0,
    }
})

// Crisp 5-pointed star wireframe vertices matching the iconic star tucked inside the golden crescent!
const STAR_RING: Vec[] = Array.from({ length: 11 }, (_, k) => {
    const ang = -Math.PI / 2 + (k * Math.PI) / 5
    const r = (k % 2 === 0 ? 0.38 : 0.15) * TARGET_SCALE
    return [RIGHT_X + 0.42 * TARGET_SCALE + r * Math.cos(ang), CY - 0.02 * TARGET_SCALE + r * Math.sin(ang)]
})

// Crisp golden crescent spine arc callback!
const CRESCENT_OUTER: Vec[] = Array.from({ length: 48 }, (_, k) => {
    const theta = -2.08 + (k / 47) * 4.16
    const rad = 1.15 * TARGET_SCALE
    return [RIGHT_X + (-rad * Math.cos(theta) + 0.12 * TARGET_SCALE), CY + rad * Math.sin(theta)]
})

// Ambient Gaussian noise cloud on left
const NOISE_SWARM = Array.from({ length: 120 }, () => {
    const [gx, gy] = sampleGaussian2D(rng)
    const r = Math.hypot(gx, gy)
    const c = r > 2.3 ? 2.3 / r : 1
    return [LEFT_X + gx * c * 84, CY + gy * c * 84] as const
})

// Gaussian contour rings around left Pure Noise nebula
const LEFT_CONTOURS = contourPaths(
    (x, y) => Math.exp(-(x * x + y * y) / (2 * 0.85 * 0.85)),
    {
        x: [-2.4, 2.4],
        y: [-2.4, 2.4],
        levels: [0.22, 0.55],
        resolution: 48,
    },
)

export const finale: SceneFunction = (s, c) => {
    const flow = s.value(0)

    // Luminous scalarField density clouds behind left Noise and right Crescent + Star!
    const leftField = scalarField(
        (x, y) => Math.exp(-(x * x + y * y) / (2 * 0.9 * 0.9)),
        {
            x: [-2.4, 2.4],
            y: [-2.4, 2.4],
            domain: [0.05, 1.0],
            colors: ['#07091000', '#5b3cc43a', '#a78bfa56', '#5ce1e644'],
            width: 440,
            height: 440,
            resolution: 56,
        },
    ).at(LEFT_X, CY).set('blend', 'screen')

    const rightField = scalarField(
        (x, y) => {
            const cx = x - 0.12
            const cy = -y
            const rad = Math.hypot(cx, cy)
            const ang = Math.atan2(cy, -cx)
            const crescent = Math.exp(-Math.pow((rad - 1.06) / 0.32, 2)) * Math.exp(-Math.pow(ang / 1.6, 2)) * 0.95
            const star = Math.exp(-((x - 0.42) ** 2 + (y - 0.02) ** 2) / 0.28) * 1.1
            return crescent + star
        },
        {
            x: [-2.2, 2.2],
            y: [-2.2, 2.2],
            domain: [0.05, 1.25],
            colors: ['#07091000', '#24669630', '#5ce1e642', '#ffd16668', '#fff5cc78'],
            width: 480,
            height: 480,
            resolution: 64,
        },
    ).at(RIGHT_X, CY).set('blend', 'screen')

    const leftContours = group(
        ...LEFT_CONTOURS.flatMap((lvl, idx) =>
            lvl.paths.map((pts) =>
                new Node(polyPath(pts.map(([wx, wy]) => [LEFT_X + wx * 88, CY + wy * 88] as Vec)))
                    .stroke(COSMOS.violet, 1.4, 0.28 + idx * 0.14),
            ),
        ),
    ).set('blend', 'screen')

    const liveBridge = dynamic(() => {
        const ph = flow.value
        const shockR = 45 + ((ph * 0.42) % 1) * 230
        const shockOp = (1 - ((ph * 0.42) % 1)) * 0.65

        const screenNodes: Node[] = [
            circle(shockR, { fill: null, stroke: COSMOS.gold, width: 2.6 }).at(RIGHT_X, CY).opacity(shockOp).glow(10, COSMOS.gold),
            // Crisp iconic golden crescent arc + 5-pointed star glow callback!
            new Node(polyPath(CRESCENT_OUTER)).stroke(COSMOS.gold, 2.4, 0.62).glow(10, COSMOS.gold),
            new Node(polyPath(STAR_RING)).stroke('#fff7d6', 2.4, 0.88).glow(10, COSMOS.gold),
        ]

        // 78 tripled blend('screen') straight optimal-transport light rays + gliding photons!
        for (let i = 0; i < BRIDGE_PAIRS.length; i++) {
            const p = BRIDGE_PAIRS[i]!
            const endCol = p.kind === 'star' ? '#fff7d6' : COSMOS.gold
            const grad = linearGradient([p.x0, p.y0], [p.x1, p.y1], [COSMOS.violet, COSMOS.cyan, endCol])
            screenNodes.push(
                line([p.x0, p.y0], [p.x1, p.y1], { stroke: grad, width: p.isHero ? 2.2 : 1.15 })
                    .opacity(p.isHero ? 0.56 : 0.26)
                    .glow(p.isHero ? 5 : 0, COSMOS.cyan),
            )
            // Gliding photon packet along the straight ray
            const u = (ph * p.speed + p.offset) % 1
            const px = p.x0 + (p.x1 - p.x0) * u
            const py = p.y0 + (p.y1 - p.y0) * u
            if (i % 2 === 0) {
                screenNodes.push(
                    dot(p.isHero ? 4.2 : 2.8, '#ffffff')
                        .at(px, py)
                        .glow(p.isHero ? 10 : 5, u > 0.55 ? COSMOS.gold : COSMOS.cyan)
                        .opacity(0.92),
                )
            }
        }

        const nodes: Node[] = [
            group(...screenNodes).set('blend', 'screen'),
            // Left Gaussian noise swarm particles
            ...NOISE_SWARM.map(([x, y], i) =>
                dot(2.1, i % 2 === 0 ? COSMOS.violet : COSMOS.cyan).at(x, y).opacity(0.68),
            ),
            // Right iconic golden crescent + 5-pointed star particle constellation!
            ...TARGET_CONSTELLATION.map((tp) =>
                dot(tp.size * 0.78, tp.kind === 'star' ? '#fff7d6' : COSMOS.gold)
                    .at(RIGHT_X + tp.x1[0] * TARGET_SCALE, CY + tp.x1[1] * TARGET_SCALE)
                    .opacity(0.94),
            ),
            txt('PURE NOISE', LEFT_X, CY + 206, 26, COSMOS.violet, 'mono'),
            txt('STRAIGHT OPTIMAL TRANSPORT', 0, CY + 206, 26, COSMOS.cyan, 'mono'),
            txt('COHERENT STRUCTURE', RIGHT_X, CY + 206, 26, COSMOS.gold, 'mono'),
        ]

        return group(...nodes)
    })

    // Crisp high-contrast TeX ODE formula dx/dt = v_\theta(x, t)!
    const takeaway = group(
        txt('Straight paths turn 1,000 steps into a blink.', 0, 162, 68, COSMOS.ink, 'serif').glow(8, COSMOS.violet),
        txt('Noise  →  Straight Velocity Field  →  Structure', 0, 248, 40, COSMOS.gold, 'serif').glow(8, COSMOS.gold),
        txt('Diffusion & Flow Matching  ·', -40, 344, 26, COSMOS.muted, 'mono', 'right'),
        tex(String.raw`\frac{dx}{dt} = v_\theta(x, t)`, { size: 38, color: COSMOS.cyan }).at(125, 342).glow(7, COSMOS.cyan),
    )

    s.add(leftField, rightField, leftContours, liveBridge, takeaway)
    c.at(0.05, () => s.play(flow.to(6.0, { duration: 15.0, ease: linear })))
}

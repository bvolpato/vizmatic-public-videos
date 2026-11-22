import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { diffusionTrajectory, flowMatchingTrajectory, type Pt2 } from '../math'
import { COSMOS, txt } from '../../../factory/style'

// 7 shared (x0 -> x1) particle pairs raced side-by-side:
// Kept well inside y in [-240, 240] so curved SDE arcs never cross headers or bottom TeX
const PAIRS: readonly { x0: Pt2; x1: Pt2; bend: number }[] = [
    { x0: [-285, -125], x1: [240, -115], bend: 0.72 },
    { x0: [-310, -70], x1: [265, -62], bend: -0.78 },
    { x0: [-270, -12], x1: [275, -8], bend: 0.85 },
    { x0: [-300, 42], x1: [260, 38], bend: -0.82 },
    { x0: [-260, 100], x1: [230, 92], bend: 0.72 },
    { x0: [-225, -150], x1: [195, -138], bend: -0.58 },
    { x0: [-220, 145], x1: [195, 134], bend: 0.58 },
]

const DIFF_STEPS = 50
const FLOW_STEPS = 4

// Precompute exact Euler trajectories for both panels!
const LEFT_CX = -455
const RIGHT_CX = 455
const PANEL_CY = 10

const DIFF_PATHS: Vec[][] = PAIRS.map((p, i) =>
    diffusionTrajectory(p.x0, p.x1, DIFF_STEPS, 701 + i * 37, p.bend).map(
        ([x, y]) => [LEFT_CX + x, PANEL_CY + y] as Vec,
    ),
)

const FLOW_PATHS: Vec[][] = PAIRS.map((p) =>
    flowMatchingTrajectory(p.x0, p.x1, FLOW_STEPS).map(
        ([x, y]) => [RIGHT_CX + x, PANEL_CY + y] as Vec,
    ),
)

export const curvedvsstraight: SceneFunction = (s, c) => {
    // Shared race clock in "step units" (0 -> 50): Flow Matching finishes at step 4!
    const raceStep = s.value(0)
    const showRight = s.value(0.25)

    const staticChrome = group(
        // Subtle luminous vertical meridian dividing the two races (zero boxes!)
        line([0, -430], [0, 420], { stroke: '#253152', width: 2, dash: [10, 10] }).opacity(0.65),
        // Left header
        txt('Classic Diffusion', LEFT_CX, -415, 50, COSMOS.rose, 'serif').glow(6, COSMOS.rose),
        // Right header
        txt('Rectified Flow Matching', RIGHT_CX, -415, 50, COSMOS.cyan, 'serif').glow(6, COSMOS.cyan),
        // Bottom equations
        tex(String.raw`dx = f(x,t)\,dt + g(t)\,dW`, { size: 38, color: COSMOS.rose }).at(LEFT_CX, 385).glow(5, COSMOS.rose),
        tex(String.raw`\frac{dx}{dt} = v_\theta(x, t) \approx x_1 - x_0`, { size: 38, color: COSMOS.cyan }).at(RIGHT_CX, 385).glow(5, COSMOS.cyan),
        // Noise & Data anchors on both halves
        txt('Noise', LEFT_CX - 275, 290, 26, COSMOS.muted, 'mono'),
        txt('Data', LEFT_CX + 235, 290, 26, COSMOS.gold, 'mono'),
        txt('Noise', RIGHT_CX - 275, 290, 26, COSMOS.muted, 'mono'),
        txt('Data', RIGHT_CX + 235, 290, 26, COSMOS.gold, 'mono'),
    )

    const liveRace = dynamic(() => {
        const step = raceStep.value
        const ra = showRight.value
        const dStep = Math.min(DIFF_STEPS, step)
        const fStep = Math.min(FLOW_STEPS, step)

        const nodes: Node[] = [
            // Soft radial auras behind target clusters
            circle(190, {
                fill: radialGradient([0, 0], 190, [[0, '#ff6b8b1c'], [1, '#07091000']]),
                stroke: null,
            }).at(LEFT_CX + 235, PANEL_CY),
            circle(210, {
                fill: radialGradient([0, 0], 210, [[0, '#ffd16626'], [1, '#07091000']]),
                stroke: null,
            }).at(RIGHT_CX + 235, PANEL_CY).opacity(ra),
            // Live step odometers
            txt(
                dStep >= DIFF_STEPS ? '50 / 50 STEPS  ·  FINISHED' : `STEP ${Math.floor(dStep)} / 50  ·  CURVED SDE`,
                LEFT_CX,
                -350,
                28,
                dStep >= DIFF_STEPS ? COSMOS.amber : COSMOS.rose,
                'mono',
            ),
            txt(
                fStep >= FLOW_STEPS ? '4 / 4 STEPS  ·  ARRIVED!' : `STEP ${Math.floor(fStep)} / 4  ·  STRAIGHT ODE`,
                RIGHT_CX,
                -350,
                28,
                fStep >= FLOW_STEPS ? COSMOS.emerald : COSMOS.gold,
                'mono',
            ).glow(fStep >= FLOW_STEPS ? 8 : 4, fStep >= FLOW_STEPS ? COSMOS.emerald : COSMOS.gold).opacity(ra),
        ]

        // Left: 50-step curved Diffusion paths
        for (let pIdx = 0; pIdx < DIFF_PATHS.length; pIdx++) {
            const path = DIFF_PATHS[pIdx]!
            const start = path[0]!
            const end = path[path.length - 1]!
            nodes.push(
                dot(4.5, COSMOS.violet).at(start[0], start[1]).opacity(0.85),
                circle(6, { fill: null, stroke: COSMOS.gold, width: 1.6 }).at(end[0], end[1]).opacity(0.65),
            )
            if (dStep > 0.05) {
                const whole = Math.floor(dStep)
                const frac = dStep - whole
                const segPts: Vec[] = path.slice(0, whole + 1)
                if (whole < DIFF_STEPS && frac > 0.01) {
                    const a = path[whole]!
                    const b = path[whole + 1]!
                    segPts.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac])
                }
                const tip = segPts[segPts.length - 1]!
                const isHero = pIdx === 2
                nodes.push(
                    new Node(polyPath(segPts))
                        .stroke(isHero ? COSMOS.amber : COSMOS.rose, isHero ? 3.8 : 2.2, isHero ? 0.96 : 0.72)
                        .glow(isHero ? 8 : 0, COSMOS.rose),
                    dot(isHero ? 7 : 4.5, '#ffffff').at(tip[0], tip[1]).glow(isHero ? 10 : 0, COSMOS.rose),
                )
            }
        }

        // Right: 4-step straight Rectified Flow Matching paths
        if (ra > 0.02) {
            for (let pIdx = 0; pIdx < FLOW_PATHS.length; pIdx++) {
                const path = FLOW_PATHS[pIdx]!
                const start = path[0]!
                const end = path[path.length - 1]!
                nodes.push(
                    dot(4.5, COSMOS.violet).at(start[0], start[1]).opacity(0.85 * ra),
                    circle(6, { fill: null, stroke: COSMOS.gold, width: 1.6 }).at(end[0], end[1]).opacity(0.75 * ra),
                )
                if (fStep > 0.05) {
                    const whole = Math.floor(fStep)
                    const frac = fStep - whole
                    const segPts: Vec[] = path.slice(0, whole + 1)
                    if (whole < FLOW_STEPS && frac > 0.01) {
                        const a = path[whole]!
                        const b = path[whole + 1]!
                        segPts.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac])
                    }
                    const tip = segPts[segPts.length - 1]!
                    const isHero = pIdx === 2
                    nodes.push(
                        new Node(polyPath(segPts))
                            .stroke(isHero ? COSMOS.gold : COSMOS.cyan, isHero ? 4.4 : 2.6, (isHero ? 0.98 : 0.8) * ra)
                            .glow(isHero ? 10 : 0, COSMOS.cyan),
                    )
                    // Highlight each of the 4 discrete Euler leap nodes!
                    for (let k = 1; k < segPts.length; k++) {
                        const pt = segPts[k]!
                        nodes.push(dot(isHero ? 5.5 : 3.6, COSMOS.gold).at(pt[0], pt[1]).opacity(0.95 * ra))
                    }
                    nodes.push(dot(isHero ? 7.5 : 4.8, '#ffffff').at(tip[0], tip[1]).glow(isHero ? 12 : 0, COSMOS.gold).opacity(ra))
                }
            }

            // Arrival shockwave ring right after Flow Matching hits step 4!
            if (step > 4 && step < 16) {
                const sp = (step - 4) / 12
                nodes.push(
                    circle(40 + sp * 220, { fill: null, stroke: COSMOS.emerald, width: 3.5 })
                        .at(RIGHT_CX + 235, PANEL_CY)
                        .opacity((1 - sp) * 0.85 * ra)
                        .glow(10, COSMOS.emerald),
                )
            }
        }

        return group(...nodes)
    })

    s.add(staticChrome, liveRace)
    // Preview curved diffusion slowly during beat 0
    c.at(0.15, () => s.play(raceStep.to(16, { duration: 12.0, ease: linear })))
    // Reveal Flow Matching & reset for the live race
    c.on('Rectified flow matching', () => {
        s.play(showRight.to(1, { duration: 0.45 }))
        s.play(raceStep.to(0, { duration: 0.35 }))
    })
    c.on('Watch the race', () => {
        s.play(raceStep.to(50, { duration: 6.2, ease: linear }))
    })
}

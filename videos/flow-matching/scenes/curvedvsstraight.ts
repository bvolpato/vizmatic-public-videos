import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, radialGradient, scalarField, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { diffusionTrajectory, flowMatchingTrajectory, mulberry32, type Pt2 } from '../math'
import { COSMOS, txt } from '../../../factory/style'

// 5 bright hero (x0 -> x1) particle pairs raced side-by-side (kept cleanly inside y in [-220, 220])
const HERO_PAIRS: readonly { x0: Pt2; x1: Pt2; bend: number }[] = [
    { x0: [-285, -125], x1: [240, -115], bend: 0.72 },
    { x0: [-310, -64], x1: [265, -58], bend: -0.78 },
    { x0: [-272, 0], x1: [275, 0], bend: 0.85 },
    { x0: [-300, 62], x1: [260, 56], bend: -0.82 },
    { x0: [-265, 124], x1: [232, 114], bend: 0.72 },
]

// 28 deterministic faint background trajectories underneath the 5 bright hero trajectories on each side!
const bgRng = mulberry32(31415)
const BG_PAIRS: readonly { x0: Pt2; x1: Pt2; bend: number }[] = Array.from({ length: 28 }, (_, i) => {
    const y0 = -168 + (i / 27) * 336 + (bgRng() - 0.5) * 18
    const y1 = -152 + (i / 27) * 304 + (bgRng() - 0.5) * 18
    const x0 = -295 + (bgRng() - 0.5) * 65
    const x1 = 235 + (bgRng() - 0.5) * 55
    const bend = (i % 2 === 0 ? 1 : -1) * (0.45 + bgRng() * 0.45)
    return { x0: [x0, y0] as const, x1: [x1, y1] as const, bend }
})

const DIFF_STEPS = 50
const FLOW_STEPS = 4

const LEFT_CX = -455
const RIGHT_CX = 455
const PANEL_CY = 6

const DIFF_HERO_PATHS: Vec[][] = HERO_PAIRS.map((p, i) =>
    diffusionTrajectory(p.x0, p.x1, DIFF_STEPS, 701 + i * 37, p.bend).map(
        ([x, y]) => [LEFT_CX + x, PANEL_CY + y] as Vec,
    ),
)

const FLOW_HERO_PATHS: Vec[][] = HERO_PAIRS.map((p) =>
    flowMatchingTrajectory(p.x0, p.x1, FLOW_STEPS).map(
        ([x, y]) => [RIGHT_CX + x, PANEL_CY + y] as Vec,
    ),
)

const DIFF_BG_PATHS: Vec[][] = BG_PAIRS.map((p, i) =>
    diffusionTrajectory(p.x0, p.x1, DIFF_STEPS, 1901 + i * 19, p.bend).map(
        ([x, y]) => [LEFT_CX + x, PANEL_CY + y] as Vec,
    ),
)

const FLOW_BG_PATHS: Vec[][] = BG_PAIRS.map((p) =>
    flowMatchingTrajectory(p.x0, p.x1, FLOW_STEPS).map(
        ([x, y]) => [RIGHT_CX + x, PANEL_CY + y] as Vec,
    ),
)

// Helper to build a luminous scalarField Gaussian density cloud for Noise or Data endpoints!
function endpointCloud(cx: number, cy: number, colors: readonly string[], w = 260, h = 440) {
    return scalarField(
        (x, y) => Math.exp(-(x * x) / (2 * 0.52 * 0.52) - (y * y) / (2 * 0.88 * 0.88)),
        {
            x: [-1.4, 1.4],
            y: [-2.0, 2.0],
            domain: [0.05, 1.0],
            colors,
            width: w,
            height: h,
            resolution: [44, 64],
        },
    ).at(cx, cy).set('blend', 'screen')
}

export const curvedvsstraight: SceneFunction = (s, c) => {
    const raceStep = s.value(0)
    const showRight = s.value(0.25)
    const racing = s.value(0)

    // Glowing scalarField density clouds at BOTH Noise and Data endpoints on both panels!
    const leftNoiseCloud = endpointCloud(LEFT_CX - 280, PANEL_CY, ['#07091000', '#5b3cc43a', '#a78bfa56', '#5ce1e640'])
    const leftDataCloud = endpointCloud(LEFT_CX + 245, PANEL_CY, ['#07091000', '#a8224d38', '#ff6b8b52', '#ffd16658'])
    const rightNoiseCloud = endpointCloud(RIGHT_CX - 280, PANEL_CY, ['#07091000', '#5b3cc43a', '#a78bfa56', '#5ce1e644'])
    const rightDataCloud = endpointCloud(RIGHT_CX + 245, PANEL_CY, ['#07091000', '#1c7da838', '#5ce1e650', '#ffd16668'])

    const staticChrome = group(
        // Subtle luminous vertical meridian dividing the two races
        line([0, -430], [0, 420], { stroke: '#29375c', width: 2, dash: [10, 10] }).opacity(0.72),
        // Headers
        txt('Classic Diffusion', LEFT_CX, -418, 50, COSMOS.rose, 'serif').glow(6, COSMOS.rose),
        txt('Rectified Flow Matching', RIGHT_CX, -418, 50, COSMOS.cyan, 'serif').glow(6, COSMOS.cyan),
        // Bottom equations
        tex(String.raw`dx = f(x,t)\,dt + g(t)\,dW`, { size: 38, color: COSMOS.rose }).at(LEFT_CX, 385).glow(5, COSMOS.rose),
        tex(String.raw`\frac{dx}{dt} = v_\theta(x, t) \approx x_1 - x_0`, { size: 38, color: COSMOS.cyan }).at(RIGHT_CX, 385).glow(5, COSMOS.cyan),
        // Noise & Data anchors on both halves
        txt('Noise', LEFT_CX - 275, 290, 26, COSMOS.violet, 'mono'),
        txt('Data', LEFT_CX + 235, 290, 26, COSMOS.gold, 'mono'),
        txt('Noise', RIGHT_CX - 275, 290, 26, COSMOS.violet, 'mono'),
        txt('Data', RIGHT_CX + 235, 290, 26, COSMOS.gold, 'mono'),
    )

    const liveRace = dynamic(() => {
        const step = raceStep.value
        const ra = showRight.value
        const isRacing = racing.value > 0.5
        const dStep = Math.min(DIFF_STEPS, step)
        const fStep = isRacing ? Math.min(FLOW_STEPS, step) : 0

        const screenBgNodes: Node[] = [
            leftNoiseCloud,
            leftDataCloud,
            rightNoiseCloud.opacity(ra),
            rightDataCloud.opacity(ra),
        ]

        // 28 faint blend('screen') background Diffusion trajectories underneath the 5 hero paths!
        if (dStep > 0.05) {
            const whole = Math.floor(dStep)
            const frac = dStep - whole
            for (let bIdx = 0; bIdx < DIFF_BG_PATHS.length; bIdx++) {
                const path = DIFF_BG_PATHS[bIdx]!
                const segPts: Vec[] = path.slice(0, whole + 1)
                if (whole < DIFF_STEPS && frac > 0.01) {
                    const a = path[whole]!
                    const b = path[whole + 1]!
                    segPts.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac])
                }
                const col = bIdx % 3 === 0 ? COSMOS.amber : COSMOS.rose
                screenBgNodes.push(
                    new Node(polyPath(segPts)).stroke(col, 1.15, 0.24),
                )
            }
        }

        // 28 faint blend('screen') background Rectified Flow trajectories underneath the 5 hero paths!
        if (ra > 0.02 && fStep > 0.05) {
            const whole = Math.floor(fStep)
            const frac = fStep - whole
            for (let bIdx = 0; bIdx < FLOW_BG_PATHS.length; bIdx++) {
                const path = FLOW_BG_PATHS[bIdx]!
                const segPts: Vec[] = path.slice(0, whole + 1)
                if (whole < FLOW_STEPS && frac > 0.01) {
                    const a = path[whole]!
                    const b = path[whole + 1]!
                    segPts.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac])
                }
                const col = bIdx % 3 === 0 ? COSMOS.gold : COSMOS.cyan
                screenBgNodes.push(
                    new Node(polyPath(segPts)).stroke(col, 1.25, 0.28 * ra),
                )
            }
        }

        // Turbulent Brownian stochastic clouds surrounding the jagged 50-step Diffusion wave-front!
        if (dStep > 0.5) {
            const whole = Math.min(DIFF_STEPS, Math.floor(dStep))
            for (let pIdx = 0; pIdx < DIFF_HERO_PATHS.length; pIdx++) {
                const path = DIFF_HERO_PATHS[pIdx]!
                const tip = path[whole]!
                // Soft turbulent Brownian noise halo pulsing around each diffusion walker
                const cloudR = 26 + Math.sin(step * 1.9 + pIdx * 1.7) * 8
                screenBgNodes.push(
                    circle(cloudR, {
                        fill: radialGradient([0, 0], cloudR, [
                            [0, '#ff6b8b50'],
                            [0.55, '#fb923c20'],
                            [1, '#07091000'],
                        ]),
                        stroke: null,
                    }).at(tip[0], tip[1]),
                )
                // Micro-jitter stochastic Brownian dust around recent sharp bends
                for (let j = 1; j <= 4; j++) {
                    const idx = Math.max(0, whole - j * 3)
                    const pt = path[idx]!
                    const jx = Math.sin(idx * 17.3 + pIdx * 5) * 11
                    const jy = Math.cos(idx * 13.7 + pIdx * 9) * 11
                    screenBgNodes.push(dot(2.1, COSMOS.amber).at(pt[0] + jx, pt[1] + jy).opacity(0.45))
                }
            }
        }

        const nodes: Node[] = [
            group(...screenBgNodes).set('blend', 'screen'),
            // Live step odometers
            txt(
                dStep >= DIFF_STEPS ? '50 / 50 STEPS  ·  FINISHED' : `STEP ${Math.floor(dStep)} / 50  ·  CURVED SDE`,
                LEFT_CX,
                -352,
                28,
                dStep >= DIFF_STEPS ? COSMOS.amber : COSMOS.rose,
                'mono',
            ),
            txt(
                fStep >= FLOW_STEPS ? '4 / 4 STEPS  ·  ARRIVED!' : `STEP ${Math.floor(fStep)} / 4  ·  STRAIGHT ODE`,
                RIGHT_CX,
                -352,
                28,
                fStep >= FLOW_STEPS ? COSMOS.emerald : COSMOS.gold,
                'mono',
            ).glow(fStep >= FLOW_STEPS ? 8 : 4, fStep >= FLOW_STEPS ? COSMOS.emerald : COSMOS.gold).opacity(ra),
        ]

        // Left: 5 bright hero 50-step curved Diffusion paths
        for (let pIdx = 0; pIdx < DIFF_HERO_PATHS.length; pIdx++) {
            const path = DIFF_HERO_PATHS[pIdx]!
            const start = path[0]!
            const end = path[path.length - 1]!
            nodes.push(
                dot(4.8, COSMOS.violet).at(start[0], start[1]).opacity(0.9),
                circle(6.5, { fill: null, stroke: COSMOS.gold, width: 1.7 }).at(end[0], end[1]).opacity(0.72),
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
                        .stroke(isHero ? COSMOS.amber : COSMOS.rose, isHero ? 4.2 : 2.6, isHero ? 0.98 : 0.85)
                        .glow(isHero ? 10 : 4, COSMOS.rose),
                    dot(isHero ? 7.5 : 5, '#ffffff').at(tip[0], tip[1]).glow(isHero ? 12 : 6, COSMOS.rose),
                )
            }
        }

        // Right: 5 bright hero 4-step straight Rectified Flow paths + pulsing Euler step-checkpoint rings!
        if (ra > 0.02) {
            const pulseRings: Node[] = []
            for (let pIdx = 0; pIdx < FLOW_HERO_PATHS.length; pIdx++) {
                const path = FLOW_HERO_PATHS[pIdx]!
                const start = path[0]!
                const end = path[path.length - 1]!
                nodes.push(
                    dot(4.8, COSMOS.violet).at(start[0], start[1]).opacity(0.9 * ra),
                    circle(6.5, { fill: null, stroke: COSMOS.gold, width: 1.8 }).at(end[0], end[1]).opacity(0.8 * ra),
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
                            .stroke(isHero ? COSMOS.gold : COSMOS.cyan, isHero ? 4.6 : 2.9, (isHero ? 0.98 : 0.86) * ra)
                            .glow(isHero ? 12 : 5, isHero ? COSMOS.gold : COSMOS.cyan),
                    )
                    // Pulsing luminous Euler step-checkpoint rings at every completed leap k = 1..4!
                    for (let k = 1; k < segPts.length; k++) {
                        const pt = segPts[k]!
                        const pulsePhase = ((step * 0.22 + k * 0.25 + pIdx * 0.11) % 1)
                        const ringR = (isHero ? 10 : 7) + pulsePhase * (isHero ? 20 : 12)
                        const ringOp = (1 - pulsePhase) * (isHero ? 0.88 : 0.55) * ra
                        pulseRings.push(
                            circle(ringR, {
                                fill: null,
                                stroke: k === FLOW_STEPS ? COSMOS.emerald : COSMOS.gold,
                                width: isHero ? 2.4 : 1.6,
                            }).at(pt[0], pt[1]).opacity(ringOp).glow(8, k === FLOW_STEPS ? COSMOS.emerald : COSMOS.gold),
                        )
                        nodes.push(dot(isHero ? 6 : 4, COSMOS.gold).at(pt[0], pt[1]).glow(8, COSMOS.gold).opacity(0.95 * ra))
                    }
                    nodes.push(dot(isHero ? 8 : 5.2, '#ffffff').at(tip[0], tip[1]).glow(isHero ? 14 : 7, COSMOS.gold).opacity(ra))
                }
            }

            // Arrival shockwave ring right after Flow Matching hits step 4!
            if (isRacing && step > 4 && step < 18) {
                const sp = (step - 4) / 14
                pulseRings.push(
                    circle(42 + sp * 240, { fill: null, stroke: COSMOS.emerald, width: 3.6 })
                        .at(RIGHT_CX + 235, PANEL_CY)
                        .opacity((1 - sp) * 0.88 * ra)
                        .glow(12, COSMOS.emerald),
                )
            }
            if (pulseRings.length > 0) {
                nodes.push(group(...pulseRings).set('blend', 'screen'))
            }
        }

        return group(...nodes)
    })

    s.add(staticChrome, liveRace)
    const previewDur = Math.max(8.0, c.cue('Rectified flow matching').start - c.start - 0.3)
    c.at(0.15, () => s.play(raceStep.to(16, { duration: previewDur, ease: linear })))
    c.on('Rectified flow matching', () => {
        s.play(showRight.to(1, { duration: 0.45 }))
        s.play(raceStep.to(0, { duration: 0.35 }))
    })
    c.on('Watch the race', () => {
        s.play(racing.to(1, { duration: 0.05 }))
        s.play(raceStep.to(50, { duration: 6.2, ease: linear }))
    })
}

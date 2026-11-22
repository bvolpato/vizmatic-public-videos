import {
    Node, arrow, circle, dot, dynamic, group, line, linear, linearGradient, radialGradient, tex,
    type SceneFunction,
} from 'vizmatic/stage'
import {
    BIMODAL_MODES, NOISE_CENTER, bimodalVelocity, lerpPt, mulberry32, sampleGaussian2D,
} from '../math'
import { COSMOS, txt } from '../../../factory/style'

// Map world space [-2.6, 2.6] x [-1.6, 1.6] -> stage space [-740, 740] x [-250, 290]
const mapX = (wx: number) => wx * 290
const mapY = (wy: number) => 20 + wy * 185

// Precompute 110 deterministic transport particles from Gaussian left nebula to bimodal golden modes on right
const rng = mulberry32(9911)
const FIELD_PARTICLES = Array.from({ length: 110 }, (_, i) => {
    const [gx, gy] = sampleGaussian2D(rng)
    const x0 = [NOISE_CENTER[0] + gx * 0.42, NOISE_CENTER[1] + gy * 0.52] as const
    const targetMode = BIMODAL_MODES[i % 2]!
    const [tx, ty] = sampleGaussian2D(rng)
    const x1 = [targetMode.mean[0] + tx * 0.24, targetMode.mean[1] + ty * 0.24] as const
    return { x0, x1, phaseOffset: (i % 7) * 0.02, col: i % 2 === 0 ? COSMOS.gold : COSMOS.cyan }
})

// Hero pair for the conditional bridge x_t = (1-t)x_0 + t x_1
const HERO_X0 = [-1.62, 0.36] as const
const HERO_X1 = [1.58, -0.88] as const

// Grid of quiver arrows over world space
const QUIVER_XS = Array.from({ length: 11 }, (_, i) => -2.2 + i * 0.44)
const QUIVER_YS = Array.from({ length: 7 }, (_, j) => -1.35 + j * 0.45)

export const noisefield: SceneFunction = (s, c) => {
    const fieldT = s.value(0.08)
    const showHero = s.value(0)
    const heroT = s.value(0.15)

    const title = group(
        txt('Velocity Vector Field  vₜ(x)', -840, -415, 52, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.cyan),
        txt('Pushing Gaussian noise back into data', 840, -412, 28, COSMOS.muted, 'sans', 'right'),
    )

    const eqInterp = tex(String.raw`x_t = (1 - t)\,x_0 + t\,x_1`, {
        size: 54,
        color: COSMOS.gold,
    }).at(-360, -312).glow(6, COSMOS.gold)

    const eqVel = tex(String.raw`v_t(x_t \mid x_1) = x_1 - x_0`, {
        size: 50,
        color: COSMOS.cyan,
    }).at(390, -312).glow(6, COSMOS.cyan)

    const liveField = dynamic(() => {
        const t = fieldT.value
        const hVis = showHero.value
        const ht = heroT.value
        const dimFactor = 1 - hVis * 0.42

        const nodes: Node[] = [
            // Left Gaussian noise nebula p_0
            circle(260, {
                fill: radialGradient([0, 0], 260, [
                    [0, '#a78bfa34'],
                    [0.55, '#5ce1e614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(mapX(NOISE_CENTER[0]), mapY(NOISE_CENTER[1])),
            // Right twin data modes p_1
            ...BIMODAL_MODES.map((m) =>
                circle(185, {
                    fill: radialGradient([0, 0], 185, [
                        [0, '#ffd16638'],
                        [0.55, '#fb923c14'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                }).at(mapX(m.mean[0]), mapY(m.mean[1])),
            ),
            txt('Gaussian Noise  p₀', mapX(NOISE_CENTER[0]), 375, 28, COSMOS.violet, 'mono'),
            txt('Bimodal Data  p₁', mapX(1.55), 375, 28, COSMOS.gold, 'mono'),
            txt(`t = ${(hVis > 0.3 ? ht : t).toFixed(2)}`, 0, 375, 30, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan),
        ]

        // Animated velocity vector field arrows computed from real marginal bimodalVelocity(wx, wy, t)
        const evalT = hVis > 0.3 ? ht : t
        for (const wx of QUIVER_XS) {
            for (const wy of QUIVER_YS) {
                const [vx, vy] = bimodalVelocity(wx, wy, evalT)
                const mag = Math.hypot(vx, vy)
                if (mag < 1e-4) continue
                const len = Math.min(44, 18 + mag * 7.5)
                const sx = mapX(wx)
                const sy = mapY(wy)
                const ux = (vx / mag) * len
                const uy = (vy / mag) * len * 0.72
                const col = wx < 0 ? COSMOS.violet : COSMOS.cyan
                nodes.push(
                    arrow([sx - ux * 0.45, sy - uy * 0.45], [sx + ux * 0.45, sy + uy * 0.45], {
                        stroke: col,
                        width: 2.1,
                        tip: 8,
                    }).opacity(0.58 * dimFactor),
                )
            }
        }

        // Flowing particles transported across the velocity field
        for (const p of FIELD_PARTICLES) {
            const pt = Math.max(0, Math.min(1, t + p.phaseOffset))
            const pos = lerpPt(p.x0, p.x1, pt)
            const prev = lerpPt(p.x0, p.x1, Math.max(0, pt - 0.08))
            const sx = mapX(pos[0])
            const sy = mapY(pos[1])
            const px = mapX(prev[0])
            const py = mapY(prev[1])
            nodes.push(
                line([px, py], [sx, sy], { stroke: p.col, width: 1.6 }).opacity(0.32 * dimFactor),
                dot(3.2, p.col).at(sx, sy).opacity(0.85 * dimFactor),
            )
        }

        // Hero conditional bridge x_t = (1-t)x_0 + t x_1 + constant velocity vector x_1 - x_0
        if (hVis > 0.02) {
            const x0s = [mapX(HERO_X0[0]), mapY(HERO_X0[1])] as const
            const x1s = [mapX(HERO_X1[0]), mapY(HERO_X1[1])] as const
            const cur = lerpPt(HERO_X0, HERO_X1, ht)
            const curS = [mapX(cur[0]), mapY(cur[1])] as const
            const dx = x1s[0] - x0s[0]
            const dy = x1s[1] - x0s[1]
            const dLen = Math.hypot(dx, dy)
            const vx = (dx / dLen) * 155
            const vy = (dy / dLen) * 155
            const chordGrad = linearGradient([x0s[0], x0s[1]], [x1s[0], x1s[1]], [COSMOS.violet, COSMOS.cyan, COSMOS.gold])

            nodes.push(
                line([x0s[0], x0s[1]], [x1s[0], x1s[1]], { stroke: chordGrad, width: 4.5, dash: [12, 8] })
                    .opacity(0.85 * hVis)
                    .glow(10, COSMOS.cyan),
                dot(10, COSMOS.violet).at(x0s[0], x0s[1]).glow(14, COSMOS.violet).opacity(hVis),
                txt('x₀ (noise)', x0s[0], x0s[1] + 42, 28, COSMOS.violet, 'mono').opacity(hVis),
                dot(10, COSMOS.gold).at(x1s[0], x1s[1]).glow(14, COSMOS.gold).opacity(hVis),
                txt('x₁ (data)', x1s[0], x1s[1] - 42, 28, COSMOS.gold, 'mono').opacity(hVis),
                // Constant velocity arrow anchored at current x_t
                arrow([curS[0], curS[1]], [curS[0] + vx, curS[1] + vy], {
                    stroke: COSMOS.gold,
                    width: 4.5,
                    tip: 16,
                }).glow(10, COSMOS.gold).opacity(hVis),
                dot(11, '#ffffff').at(curS[0], curS[1]).glow(16, COSMOS.cyan).opacity(hVis),
                txt('xₜ', curS[0] - 18, curS[1] - 38, 30, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan).opacity(hVis),
            )
        }

        return group(...nodes)
    })

    s.add(liveField, title)
    c.at(0.1, () => s.play(fieldT.to(0.95, { duration: 14.0, ease: linear })))

    c.show('straight bridge between them', eqInterp)
    c.show('constant vector', eqVel)
    c.on('Pair one random noise point', () => {
        s.play(showHero.to(1, { duration: 0.5 }))
        s.play(heroT.to(0.86, { duration: 10.5, ease: linear }))
    })
}

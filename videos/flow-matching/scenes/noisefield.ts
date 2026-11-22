import {
    Node, arrow, contourPaths, dot, dynamic, group, line, linear, linearGradient, polyPath, rect, scalarField, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import {
    BIMODAL_MODES, NOISE_CENTER, bimodalVelocity, lerpPt, mulberry32, sampleGaussian2D,
} from '../math'
import { COSMOS, txt } from '../../../factory/style'

// Map world space [-2.6, 2.6] x [-1.6, 1.6] -> stage space [-754, 754] x [-276, 316]
const WX_HALF = 2.6
const WY_HALF = 1.6
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

// Density functions for p_0 (left Gaussian) and p_1 (right bimodal target)
function p0Density(wx: number, wy: number): number {
    const dx = wx - NOISE_CENTER[0]
    const dy = wy - NOISE_CENTER[1]
    return Math.exp(-(dx * dx) / (2 * 0.62 * 0.62) - (dy * dy) / (2 * 0.72 * 0.72))
}

function p1Density(wx: number, wy: number): number {
    let sum = 0
    for (const m of BIMODAL_MODES) {
        const dx = wx - m.mean[0]
        const dy = wy - m.mean[1]
        sum += Math.exp(-(dx * dx + dy * dy) / (2 * 0.46 * 0.46))
    }
    return sum
}

// Precompute crisp contourPaths iso-density rings under p_0 and p_1
const P0_CONTOURS = contourPaths((x, y) => p0Density(x, y), {
    x: [-WX_HALF, WX_HALF],
    y: [-WY_HALF, WY_HALF],
    levels: [0.22, 0.52, 0.82],
    resolution: [72, 48],
})

const P1_CONTOURS = contourPaths((x, y) => p1Density(x, y), {
    x: [-WX_HALF, WX_HALF],
    y: [-WY_HALF, WY_HALF],
    levels: [0.22, 0.52, 0.82],
    resolution: [72, 48],
})

// Magnitude-based velocity arrow color ramp (2.5x brighter and vividly color-coded!)
function velocityColor(mag: number): string {
    if (mag < 2.2) return '#9d7dff'
    if (mag < 3.0) return '#5ce1e6'
    if (mag < 3.8) return '#7ef7d4'
    return '#ffd166'
}

export const noisefield: SceneFunction = (s, c) => {
    const fieldT = s.value(0.08)
    const showHero = s.value(0)
    const heroT = s.value(0.15)

    // Crisp TeX title math — ZERO raw ASCII underscores ever!
    const title = group(
        txt('Velocity Vector Field', -845, -420, 52, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.cyan),
        tex(String.raw`v_t(x)`, { size: 46, color: COSMOS.cyan }).at(-292, -420).glow(6, COSMOS.cyan),
        txt('Pushing Gaussian noise back into data', 845, -418, 28, COSMOS.muted, 'sans', 'right'),
    )

    const eqInterp = tex(String.raw`x_t = (1 - t)\,x_0 + t\,x_1`, {
        size: 52,
        color: COSMOS.gold,
    }).at(-365, -315).glow(6, COSMOS.gold)

    const eqVel = tex(String.raw`v_t(x_t \mid x_1) = x_1 - x_0`, {
        size: 48,
        color: COSMOS.cyan,
    }).at(395, -315).glow(6, COSMOS.cyan)

    // Luminous scalarField density clouds under p_0 (violet/cyan) and p_1 (gold/amber)!
    // Note scalarField samples wy positive-up -> negate wy to match stage y-down!
    const p0CloudField = scalarField(
        (wx, wy) => p0Density(wx, -wy),
        {
            x: [-WX_HALF, WX_HALF],
            y: [-WY_HALF, WY_HALF],
            domain: [0.06, 1.05],
            colors: ['#07091000', '#5b3cc43a', '#a78bfa56', '#5ce1e65c'],
            width: WX_HALF * 2 * 290,
            height: WY_HALF * 2 * 185,
            resolution: [84, 56],
        },
    ).at(0, 20).set('blend', 'screen')

    const p1CloudField = scalarField(
        (wx, wy) => p1Density(wx, -wy),
        {
            x: [-WX_HALF, WX_HALF],
            y: [-WY_HALF, WY_HALF],
            domain: [0.06, 1.05],
            colors: ['#07091000', '#c45b2c38', '#fb923c52', '#ffd16666'],
            width: WX_HALF * 2 * 290,
            height: WY_HALF * 2 * 185,
            resolution: [84, 56],
        },
    ).at(0, 20).set('blend', 'screen')

    const densityContours = group(
        ...P0_CONTOURS.flatMap((lvl, idx) =>
            lvl.paths.map((pts) =>
                new Node(polyPath(pts.map(([wx, wy]) => [mapX(wx), mapY(wy)] as Vec)))
                    .stroke(COSMOS.violet, 1.6, 0.28 + idx * 0.12)
                    .glow(4, COSMOS.violet),
            ),
        ),
        ...P1_CONTOURS.flatMap((lvl, idx) =>
            lvl.paths.map((pts) =>
                new Node(polyPath(pts.map(([wx, wy]) => [mapX(wx), mapY(wy)] as Vec)))
                    .stroke(COSMOS.gold, 1.6, 0.28 + idx * 0.12)
                    .glow(4, COSMOS.gold),
            ),
        ),
    ).set('blend', 'screen')

    // Bottom distribution labels with crisp TeX subscripts (zero raw underscores!)
    const bottomLabels = group(
        txt('Gaussian Noise', mapX(NOISE_CENTER[0]) - 26, 385, 28, COSMOS.violet, 'mono'),
        tex(String.raw`p_0`, { size: 32, color: COSMOS.violet }).at(mapX(NOISE_CENTER[0]) + 114, 385),
        txt('Bimodal Data', mapX(1.55) - 26, 385, 28, COSMOS.gold, 'mono'),
        tex(String.raw`p_1`, { size: 32, color: COSMOS.gold }).at(mapX(1.55) + 98, 385),
    )

    const liveField = dynamic(() => {
        const t = fieldT.value
        const hVis = showHero.value
        const ht = heroT.value
        const dimFactor = 1 - hVis * 0.26

        // Hero label keep-out zones so strokes (arrows, trails) never cross x_0 (noise), x_1 (data), or x_t badges!
        const x0s = [mapX(HERO_X0[0]), mapY(HERO_X0[1])] as const
        const x1s = [mapX(HERO_X1[0]), mapY(HERO_X1[1])] as const
        const cur = lerpPt(HERO_X0, HERO_X1, ht)
        const curS = [mapX(cur[0]), mapY(cur[1])] as const
        // Place x_0 (noise) and x_1 (data) in clean quiet pockets outside contour rings!
        const x0LblX = x0s[0] - 110
        const x0LblY = x0s[1] + 195
        const x1LblX = x1s[0] + 150
        const x1LblY = x1s[1] - 96
        const xtX = curS[0] - 26
        const xtY = curS[1] - 58

        const hitsLabel = (sx: number, sy: number) => {
            if (hVis < 0.05) return false
            if (Math.abs(sx - x0LblX) < 105 && Math.abs(sy - x0LblY) < 42) return true
            if (Math.abs(sx - x1LblX) < 100 && Math.abs(sy - x1LblY) < 42) return true
            if (Math.abs(sx - xtX) < 58 && Math.abs(sy - xtY) < 42) return true
            return false
        }

        const arrowNodes: Node[] = []
        // Brightened (2.5x!) magnitude-colored velocity vector field arrows!
        const evalT = hVis > 0.3 ? ht : t
        for (const wx of QUIVER_XS) {
            for (const wy of QUIVER_YS) {
                const sx = mapX(wx)
                const sy = mapY(wy)
                if (hitsLabel(sx, sy)) continue
                const [vx, vy] = bimodalVelocity(wx, wy, evalT)
                const mag = Math.hypot(vx, vy)
                if (mag < 1e-4) continue
                const len = Math.min(52, 24 + mag * 8.5)
                const ux = (vx / mag) * len
                const uy = (vy / mag) * len * 0.72
                const col = velocityColor(mag)
                arrowNodes.push(
                    arrow([sx - ux * 0.48, sy - uy * 0.48], [sx + ux * 0.48, sy + uy * 0.48], {
                        stroke: col,
                        width: 2.8,
                        tip: 10,
                    }).glow(5, col).opacity(0.88 * dimFactor),
                )
            }
        }

        const particleNodes: Node[] = []
        for (const p of FIELD_PARTICLES) {
            const pt = Math.max(0, Math.min(1, t + p.phaseOffset))
            const pos = lerpPt(p.x0, p.x1, pt)
            const prev = lerpPt(p.x0, p.x1, Math.max(0, pt - 0.08))
            const sx = mapX(pos[0])
            const sy = mapY(pos[1])
            const px = mapX(prev[0])
            const py = mapY(prev[1])
            if (hitsLabel(sx, sy) || hitsLabel(px, py)) {
                particleNodes.push(dot(3.3, p.col).at(sx, sy).opacity(0.55 * dimFactor))
            } else {
                particleNodes.push(
                    line([px, py], [sx, sy], { stroke: p.col, width: 1.7 }).opacity(0.38 * dimFactor),
                    dot(3.3, p.col).at(sx, sy).opacity(0.85 * dimFactor),
                )
            }
        }

        const nodes: Node[] = [
            group(...arrowNodes).set('blend', 'screen'),
            ...particleNodes,
            txt(`t = ${(hVis > 0.3 ? ht : t).toFixed(2)}`, 0, 385, 30, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan),
        ]

        // Hero conditional bridge x_t = (1-t)x_0 + t x_1 + constant velocity vector x_1 - x_0
        if (hVis > 0.02) {
            const dx = x1s[0] - x0s[0]
            const dy = x1s[1] - x0s[1]
            const dLen = Math.hypot(dx, dy)
            const vx = (dx / dLen) * 158
            const vy = (dy / dLen) * 158
            const chordGrad = linearGradient([x0s[0], x0s[1]], [x1s[0], x1s[1]], [COSMOS.violet, COSMOS.cyan, COSMOS.gold])

            nodes.push(
                line([x0s[0], x0s[1]], [x1s[0], x1s[1]], { stroke: chordGrad, width: 4.8, dash: [12, 8] })
                    .opacity(0.9 * hVis)
                    .glow(10, COSMOS.cyan)
                    .set('blend', 'screen'),
                // x_0 anchor + crisp TeX label in clean lower-left pocket with short leader
                dot(10, COSMOS.violet).at(x0s[0], x0s[1]).glow(14, COSMOS.violet).opacity(hVis),
                line([x0s[0], x0s[1] + 12], [x0LblX + 42, x0LblY - 24], { stroke: COSMOS.violet, width: 1.8, dash: [5, 5] }).opacity(0.75 * hVis),
                rect(166, 44, { fill: '#070910ee', stroke: '#a78bfa88', width: 1.6, radius: 10 })
                    .at(x0LblX, x0LblY)
                    .opacity(hVis),
                tex(String.raw`x_0`, { size: 30, color: COSMOS.violet }).at(x0LblX - 54, x0LblY).opacity(hVis),
                txt('(noise)', x0LblX - 24, x0LblY, 26, COSMOS.violet, 'mono', 'left').opacity(hVis),
                // x_1 anchor + crisp TeX label in clean upper-right pocket with short leader
                dot(10, COSMOS.gold).at(x1s[0], x1s[1]).glow(14, COSMOS.gold).opacity(hVis),
                line([x1s[0] + 10, x1s[1] - 8], [x1LblX - 55, x1LblY + 24], { stroke: COSMOS.gold, width: 1.8, dash: [5, 5] }).opacity(0.75 * hVis),
                rect(156, 44, { fill: '#070910ee', stroke: '#ffd16688', width: 1.6, radius: 10 })
                    .at(x1LblX, x1LblY)
                    .opacity(hVis),
                tex(String.raw`x_1`, { size: 30, color: COSMOS.gold }).at(x1LblX - 48, x1LblY).opacity(hVis),
                txt('(data)', x1LblX - 20, x1LblY, 26, COSMOS.gold, 'mono', 'left').opacity(hVis),
                // Constant velocity arrow anchored at current x_t
                arrow([curS[0], curS[1]], [curS[0] + vx, curS[1] + vy], {
                    stroke: COSMOS.gold,
                    width: 4.8,
                    tip: 16,
                }).glow(12, COSMOS.gold).opacity(hVis),
                dot(11, '#ffffff').at(curS[0], curS[1]).glow(16, COSMOS.cyan).opacity(hVis),
                // Crisp dark halo pill behind TeX x_t label!
                rect(66, 48, { fill: '#070910f2', stroke: COSMOS.cyan, width: 1.8, radius: 12 })
                    .at(xtX, xtY)
                    .glow(8, COSMOS.cyan)
                    .opacity(hVis),
                tex(String.raw`x_t`, { size: 34, color: COSMOS.cyan })
                    .at(xtX, xtY)
                    .glow(6, COSMOS.cyan)
                    .opacity(hVis),
            )
        }

        return group(...nodes)
    })

    s.add(p0CloudField, p1CloudField, densityContours, liveField, title, bottomLabels)
    c.at(0.1, () => s.play(fieldT.to(0.95, { duration: 14.0, ease: linear })))

    c.show('straight bridge between them', eqInterp)
    c.show('constant vector', eqVel)
    c.on('Pair one random noise point', () => {
        s.play(showHero.to(1, { duration: 0.5 }))
        s.play(heroT.to(0.86, { duration: 10.5, ease: linear }))
    })
}

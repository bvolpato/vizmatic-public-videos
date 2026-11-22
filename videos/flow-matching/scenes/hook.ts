import {
    Node, circle, contourPaths, dot, dynamic, group, line, linearGradient, par, polyPath, rect, scalarField,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { HOOK_PARTICLES, lerpPt } from '../math'
import { COSMOS, txt } from '../../../factory/style'

const CX_RIGHT = 345
const CY = -4
const SCALE = 195
const SWARM_COLORS = [COSMOS.cyan, COSMOS.violet, COSMOS.blue, COSMOS.gold] as const

// 110 representative streamlines for vivid awakening velocity tails & full-frame transport
const STREAM_INDICES = Array.from({ length: 110 }, (_, i) => Math.floor((i * HOOK_PARTICLES.length) / 110))
// 24 luminous hero stars to bloom when constellation snaps
const HERO_STARS = HOOK_PARTICLES.filter((p) => p.kind === 'star').slice(0, 24)

// Precompute Gaussian 1-sigma, 2-sigma, 3-sigma contourPaths rings (in world units, sigma=0.95)
const GAUSS_SPAN = 3.2
const GAUSS_PX = 1040
const GAUSS_CONTOURS = contourPaths(
    (x, y) => Math.exp(-(x * x + y * y) / (2 * 0.95 * 0.95)),
    {
        x: [-GAUSS_SPAN, GAUSS_SPAN],
        y: [-GAUSS_SPAN, GAUSS_SPAN],
        // Exact 1σ (e^-0.5), 2σ (e^-2), 3σ (e^-4.5) iso-density rings!
        levels: [Math.exp(-0.5), Math.exp(-2), Math.exp(-4.5)],
        resolution: 64,
    },
)

// Shot 2 full-frame (16:9) converging streamline sources from the left & right thirds into the constellation!
const WIDE_RAYS = Array.from({ length: 44 }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1
    const frac = Math.floor(i / 2) / 21
    const sx = side * (620 + ((i * 73) % 280))
    const sy = -280 + frac * 560
    const p = HOOK_PARTICLES[(i * 29) % HOOK_PARTICLES.length]!
    const tx = p.x1[0] * SCALE
    const ty = CY + Math.max(-250, Math.min(250, p.x1[1] * SCALE))
    const col = i % 3 === 0 ? COSMOS.gold : i % 3 === 1 ? COSMOS.cyan : COSMOS.violet
    return { sx, sy, tx, ty, col, phase: (i * 0.17) % 1 }
})

// Shot 2 wide elliptical contourPaths rings spanning left/right thirds
const WIDE_CONTOURS = contourPaths(
    (x, y) => Math.exp(-((x / 2.2) ** 2 + (y / 1.15) ** 2)),
    {
        x: [-4.6, 4.6],
        y: [-2.6, 2.6],
        levels: [0.16, 0.38, 0.68],
        resolution: [72, 48],
    },
)

export const hook: SceneFunction = (s, c) => {
    const flowT = s.value(0.04)
    const centerShift = s.value(0)
    const shockProg = s.value(0)

    // Soft Gaussian scalarField glow behind the particle cloud (screen blended!)
    const gaussGlow = scalarField(
        (x, y) => {
            const t = flowT.value
            const r2 = x * x + y * y
            const g = Math.exp(-r2 / (2 * 1.12 * 1.12))
            const star = Math.exp(-((x - 0.42) ** 2 + (y + 0.02) ** 2) / 0.35) * t
            return g * (0.85 - 0.35 * t) + star * 0.9
        },
        {
            x: [-GAUSS_SPAN, GAUSS_SPAN],
            y: [-GAUSS_SPAN, GAUSS_SPAN],
            domain: [0.04, 1.25],
            colors: ['#07091000', '#3f268534', '#5ce1e630', '#ffd1664c', '#fff4cc58'],
            width: GAUSS_PX,
            height: GAUSS_PX,
            resolution: 72,
        },
    ).set('blend', 'screen')

    const shot1Copy = group(
        txt('PURE NOISE', -845, -265, 34, COSMOS.violet, 'mono', 'left').glow(6, COSMOS.violet),
        txt('Sculpting', -848, -142, 104, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.blue),
        txt('Reality', -848, -28, 104, COSMOS.gold, 'serif', 'left').glow(8, COSMOS.gold),
        txt('1,240 Gaussian particles streaming', -845, 86, 30, COSMOS.muted, 'sans', 'left'),
        txt('along optimal-transport streamlines', -845, 128, 30, COSMOS.cyan, 'sans', 'left'),
    )

    const shot2Caption = group(
        txt('From Random Static to Coherent Structure', 0, -405, 62, COSMOS.gold, 'serif').glow(8, COSMOS.gold),
        txt('Laser-straight velocity fields sculpt Gaussian noise directly into data', 0, 412, 32, COSMOS.cyan, 'sans'),
    )

    const liveConstellation = dynamic(() => {
        const t = flowT.value
        const cs = centerShift.value
        const cx = CX_RIGHT * (1 - cs)
        const sp = shockProg.value

        const screenNodes: Node[] = [
            gaussGlow.at(cx, CY),
        ]

        // Shot 1: Crisp Gaussian 1σ / 2σ / 3σ contourPaths rings around the noise nebula
        if (cs < 0.92) {
            const gOp = (1 - cs) * Math.max(0.25, 1 - t * 0.65)
            for (let idx = 0; idx < GAUSS_CONTOURS.length; idx++) {
                const lvl = GAUSS_CONTOURS[idx]!
                const col = idx === 0 ? COSMOS.cyan : idx === 1 ? COSMOS.violet : '#506499'
                for (const pts of lvl.paths) {
                    const mapped: Vec[] = pts.map(([wx, wy]) => [cx + wx * SCALE, CY + wy * SCALE])
                    screenNodes.push(
                        new Node(polyPath(mapped))
                            .stroke(col, idx === 0 ? 1.9 : 1.4, (0.44 - idx * 0.08) * gOp)
                            .dash(idx === 2 ? [10, 10] : null),
                    )
                }
            }
        }

        // Shot 2: Full-frame 16:9 converging optimal-transport streamlines + contour rings across left & right thirds!
        if (cs > 0.04) {
            for (let idx = 0; idx < WIDE_CONTOURS.length; idx++) {
                const lvl = WIDE_CONTOURS[idx]!
                const col = idx === 2 ? COSMOS.gold : idx === 1 ? COSMOS.cyan : COSMOS.violet
                for (const pts of lvl.paths) {
                    const mapped: Vec[] = pts.map(([wx, wy]) => [wx * 192, CY + wy * 130])
                    screenNodes.push(
                        new Node(polyPath(mapped))
                            .stroke(col, 1.5, (0.22 + idx * 0.08) * cs)
                            .glow(4, col),
                    )
                }
            }

            // Converging full-frame light rays sweeping inward from both left and right thirds!
            for (const ray of WIDE_RAYS) {
                const grad = linearGradient([ray.sx, ray.sy], [ray.tx, ray.ty], ['#07091000', ray.col, '#fff7d688'])
                screenNodes.push(
                    line([ray.sx, ray.sy], [ray.tx, ray.ty], { stroke: grad, width: 1.7 }).opacity(0.42 * cs),
                )
                const u = (t * 0.85 + ray.phase) % 1
                const px = ray.sx + (ray.tx - ray.sx) * u
                const py = ray.sy + (ray.ty - ray.sy) * u
                if (Math.abs(py) < 295) {
                    screenNodes.push(dot(2.8, ray.col).at(px, py).glow(8, ray.col).opacity(0.72 * cs))
                }
            }
        }

        // Glowing shockwave ring as constellation snaps into place
        if (sp > 0.01 && sp < 0.99) {
            const r = 60 + sp * 460
            screenNodes.push(
                circle(r, { fill: null, stroke: COSMOS.gold, width: 4.4 })
                    .at(cx, CY)
                    .opacity((1 - sp) * 0.88)
                    .glow(14, COSMOS.gold),
            )
        }

        // Awakening directional velocity tails on 110 representative particles from frame 1!
        const tailLen = 0.09 + 0.16 * Math.sin(Math.PI * Math.min(1, t))
        const tailAlpha = 0.56 + 0.3 * Math.sin(Math.PI * Math.min(1, t))
        for (const idx of STREAM_INDICES) {
            const p = HOOK_PARTICLES[idx]!
            const head = lerpPt(p.x0, p.x1, t)
            // Extend velocity vector forward slightly when t is near 0 so awakening directional tails shine immediately!
            const vx = p.x1[0] - p.x0[0]
            const vy = p.x1[1] - p.x0[1]
            const tailX = head[0] - vx * tailLen
            const tailY = head[1] - vy * tailLen
            const hx = cx + head[0] * SCALE
            let hy = CY + head[1] * SCALE
            const tx = cx + tailX * SCALE
            let ty = CY + tailY * SCALE
            if (cs > 0.2 && p.kind === 'halo') {
                hy = CY + (hy - CY) * (1 - 0.24 * cs)
                ty = CY + (ty - CY) * (1 - 0.24 * cs)
            }
            const col = t < 0.3 ? (idx % 2 === 0 ? COSMOS.cyan : COSMOS.violet) : p.kind === 'star' ? COSMOS.gold : COSMOS.cyan
            const grad = linearGradient([tx, ty], [hx, hy], ['#07091000', col])
            screenNodes.push(
                line([tx, ty], [hx, hy], { stroke: grad, width: 2.3 }).opacity(tailAlpha).glow(5, col),
            )
        }

        const nodes: Node[] = [
            group(...screenNodes).set('blend', 'screen'),
        ]

        // Shot 1 lower-left prior readout + 1σ/2σ/3σ gauge (eliminates the empty bottom-left void!)
        if (cs < 0.85) {
            const la = 1 - cs
            const barW = 460
            nodes.push(
                txt('PRIOR  N(0, I)  ·  1σ / 2σ / 3σ RINGS', -845, 224, 26, COSMOS.violet, 'mono', 'left').opacity(0.92 * la),
                rect(barW, 8, { fill: '#192340', stroke: null, radius: 4 }).at(-845 + barW / 2, 268).opacity(0.85 * la),
                rect(Math.max(12, barW * t), 8, { fill: COSMOS.cyan, stroke: null, radius: 4 })
                    .at(-845 + Math.max(12, barW * t) / 2, 268)
                    .glow(8, COSMOS.cyan)
                    .opacity(0.95 * la),
                txt(`t = ${t.toFixed(2)}   (noise → structure)`, -845, 310, 26, COSMOS.gold, 'mono', 'left').opacity(0.92 * la),
                // Clean 1σ / 2σ tags positioned along the top-right edge of the Gaussian rings
                txt('1σ', cx + 0.95 * SCALE * 0.72, CY - 0.95 * SCALE * 0.72 - 14, 26, COSMOS.cyan, 'mono').opacity(0.85 * la),
                txt('2σ', cx + 1.9 * SCALE * 0.72, CY - 1.9 * SCALE * 0.72 - 14, 26, COSMOS.violet, 'mono').opacity(0.78 * la),
            )
        }

        // All 1,240 deterministic particles streaming smoothly — strictly keeping Shot 2 halo clear of bottom typography!
        for (let i = 0; i < HOOK_PARTICLES.length; i++) {
            const p = HOOK_PARTICLES[i]!
            const pos = lerpPt(p.x0, p.x1, t)
            let x = cx + pos[0] * SCALE
            let y = CY + pos[1] * SCALE
            if (cs > 0.1 && p.kind === 'halo') {
                // Keep outer cyan halo comfortably inside [-280, +280] vertically while expanding slightly horizontally!
                x = cx + pos[0] * SCALE * (1 + 0.32 * cs)
                const maxY = 278
                const dy = y - CY
                if (Math.abs(dy) > maxY) {
                    y = CY + Math.sign(dy) * (maxY - (Math.abs(dy) - maxY) * 0.25)
                }
            }
            let col: string
            if (t < 0.35) {
                col = SWARM_COLORS[p.hueIdx]!
            } else {
                col = p.kind === 'star' ? '#fff7d6' : p.kind === 'crescent' ? COSMOS.gold : COSMOS.cyan
            }
            const op = p.kind === 'halo' ? 0.54 : 0.74 + t * 0.24
            nodes.push(dot(p.size, col).at(x, y).opacity(op))
        }

        // Hero glowing stars inside the star constellation
        if (t > 0.55) {
            const ga = Math.min(1, (t - 0.55) * 2.2)
            const starGlows: Node[] = []
            for (const p of HERO_STARS) {
                const pos = lerpPt(p.x0, p.x1, t)
                starGlows.push(
                    dot(4.0, '#ffffff')
                        .at(cx + pos[0] * SCALE, CY + pos[1] * SCALE)
                        .opacity(ga)
                        .glow(12, COSMOS.gold),
                )
            }
            nodes.push(group(...starGlows).set('blend', 'screen'))
        }

        return group(...nodes)
    })

    s.add(liveConstellation, shot1Copy)
    c.at(0.05, () => s.play(flowT.to(0.58, { duration: 6.0 })))

    c.on('into coherent reality', () => {
        s.play(par(
            centerShift.to(1, { duration: 0.85 }),
            flowT.to(1.0, { duration: 2.6 }),
            shockProg.to(1, { duration: 2.2 }),
        ))
    })
    c.swap('into coherent reality', shot1Copy, shot2Caption)
}

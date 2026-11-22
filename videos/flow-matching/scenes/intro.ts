import {
    Node, contourPaths, dot, dynamic, group, linearGradient, polyPath, scalarField, tex,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { HOOK_PARTICLES, lerpPt } from '../math'
import { COSMOS, txt } from '../../../factory/style'

const CX = 365
const CY = 4
const SCALE = 210
const PREVIEW_PARTICLES = HOOK_PARTICLES.filter((_, i) => i % 2 === 0)

// Smooth luminous density field peaking over the golden crescent arc + 5-pointed star + soft Gaussian halo
function heroDensityField(wx: number, wy: number): number {
    // Gaussian outer nebula
    const gauss = 0.24 * Math.exp(-(wx * wx + wy * wy) / 2.6)
    // Crescent ridge centered around (-0.95..0.12, y in [-1.1, 1.1])
    const cx = wx - 0.12
    const cy = wy
    const rad = Math.hypot(cx, cy)
    const ang = Math.atan2(cy, -cx) // 0 at left spine of crescent
    const arcMask = Math.exp(-Math.pow(ang / 1.55, 2))
    const ring = Math.exp(-Math.pow((rad - 1.06) / 0.26, 2)) * arcMask * 0.92
    // 5-pointed star glow centered at (0.42, -0.02)
    const sx = wx - 0.42
    const sy = wy + 0.02
    const starGlow = Math.exp(-(sx * sx + sy * sy) / 0.22) * 1.05
    return gauss + ring + starGlow
}

const FIELD_SPAN = 2.65
const FIELD_PX = 920

const mapFieldPt = (wx: number, wy: number): Vec => [
    CX + ((wx + FIELD_SPAN) / (2 * FIELD_SPAN) - 0.5) * FIELD_PX,
    CY + (0.5 - (wy + FIELD_SPAN) / (2 * FIELD_SPAN)) * FIELD_PX,
]

// Precompute smooth iso-density contour rings around the crescent + star + Gaussian nebula
const HERO_CONTOURS = contourPaths((x, y) => heroDensityField(x, -y), {
    x: [-FIELD_SPAN, FIELD_SPAN],
    y: [-FIELD_SPAN, FIELD_SPAN],
    levels: [0.14, 0.28, 0.52, 0.84],
    resolution: 72,
})

// Dense set of 96 representative curved optimal-transport streamlines sweeping smoothly into the constellation!
const STREAM_COUNT = 96
const STREAM_PARTICLES = Array.from({ length: STREAM_COUNT }, (_, i) => {
    const p = HOOK_PARTICLES[Math.floor((i * HOOK_PARTICLES.length) / STREAM_COUNT)]!
    const dx = p.x1[0] - p.x0[0]
    const dy = p.x1[1] - p.x0[1]
    const len = Math.max(0.01, Math.hypot(dx, dy))
    const bend = ((i % 2 === 0 ? 1 : -1) * (0.14 + (i % 5) * 0.035)) * len
    const nx = -dy / len
    const ny = dx / len
    return { p, nx, ny, bend }
})

function curvedPt(x0: readonly [number, number], x1: readonly [number, number], nx: number, ny: number, bend: number, u: number): Vec {
    const base = lerpPt(x0, x1, u)
    const arch = Math.sin(Math.PI * u) * bend
    return [CX + (base[0] + nx * arch) * SCALE, CY + (base[1] + ny * arch) * SCALE]
}

export const intro: IntroFunction = (stage, clock) => {
    const morph = stage.value(0.76)

    // Luminous scalarField density aura behind the crescent + star constellation (additive screen blend!)
    const auraField = scalarField(
        (wx, wy) => heroDensityField(wx, -wy),
        {
            x: [-FIELD_SPAN, FIELD_SPAN],
            y: [-FIELD_SPAN, FIELD_SPAN],
            domain: [0.06, 1.35],
            colors: ['#07091000', '#3b24782e', '#2272a840', '#5ce1e644', '#ffd16660', '#fff4cc72'],
            width: FIELD_PX,
            height: FIELD_PX,
            resolution: 88,
        },
    ).at(CX, CY).set('blend', 'screen')

    // Crisp concentric iso-density contourPaths rings
    const contourLayer = group(
        ...HERO_CONTOURS.flatMap((lvl, idx) =>
            lvl.paths.map((pts) =>
                new Node(polyPath(pts.map(([wx, wy]) => mapFieldPt(wx, wy))))
                    .stroke(idx >= 2 ? COSMOS.gold : idx === 1 ? COSMOS.cyan : COSMOS.violet, idx >= 2 ? 1.8 : 1.3, 0.24 + idx * 0.1)
                    .glow(idx >= 2 ? 6 : 3, idx >= 2 ? COSMOS.gold : COSMOS.cyan),
            ),
        ),
    ).set('blend', 'screen')

    const livePreview = dynamic(() => {
        const t = morph.value
        const streamNodes: Node[] = []

        // 96 dense blend('screen') curved transport streamlines sweeping smoothly into the crescent + star!
        for (let i = 0; i < STREAM_PARTICLES.length; i++) {
            const sp = STREAM_PARTICLES[i]!
            const u0 = Math.max(0, t - 0.44)
            const u1 = t
            const segs = 12
            const pts: Vec[] = Array.from({ length: segs + 1 }, (_, k) => {
                const u = u0 + ((u1 - u0) * k) / segs
                return curvedPt(sp.p.x0, sp.p.x1, sp.nx, sp.ny, sp.bend, u)
            })
            const tail = pts[0]!
            const head = pts[pts.length - 1]!
            const endCol = sp.p.kind === 'star' ? '#fff7d6' : sp.p.kind === 'crescent' ? COSMOS.gold : COSMOS.cyan
            const grad = linearGradient([tail[0], tail[1]], [head[0], head[1]], ['#07091000', COSMOS.violet, endCol])
            const isHero = i % 4 === 0
            streamNodes.push(
                new Node(polyPath(pts))
                    .stroke(grad, isHero ? 2.6 : 1.5, isHero ? 0.72 : 0.44)
                    .glow(isHero ? 7 : 0, endCol),
            )
        }

        // Luminous particle swarm converging into crisp golden crescent + 5-pointed star
        const particleNodes: Node[] = []
        for (let i = 0; i < PREVIEW_PARTICLES.length; i++) {
            const p = PREVIEW_PARTICLES[i]!
            const pos = lerpPt(p.x0, p.x1, t)
            const col = p.kind === 'star' ? '#fff7d6' : p.kind === 'crescent' ? COSMOS.gold : COSMOS.cyan
            const isSpark = p.kind === 'star' && i % 5 === 0
            particleNodes.push(
                dot(p.size * (p.kind === 'star' ? 1.05 : 0.95), col)
                    .at(CX + pos[0] * SCALE, CY + pos[1] * SCALE)
                    .opacity(p.kind === 'halo' ? 0.62 : 0.92)
                    .glow(isSpark ? 10 : 0, COSMOS.gold),
            )
        }

        return group(
            group(...streamNodes).set('blend', 'screen'),
            ...particleNodes,
        )
    })

    // Tightened, crisp left title block with clean TeX formula badge (zero raw underscores!)
    const titleBlock = group(
        tex(String.raw`\frac{dx}{dt} = v_t(x)`, { size: 32, color: COSMOS.gold }).at(-745, -172).glow(6, COSMOS.gold),
        txt('·   OPTIMAL TRANSPORT', -622, -170, 26, COSMOS.gold, 'mono', 'left'),
        txt('Diffusion &', -848, -62, 108, COSMOS.ink, 'serif', 'left').glow(7, COSMOS.violet),
        txt('Flow Matching', -848, 52, 108, COSMOS.cyan, 'serif', 'left').glow(9, '#38bdf8'),
        txt('How AI sculpts noise into reality', -842, 152, 34, COSMOS.muted, 'sans', 'left'),
    )

    stage.add(auraField, contourLayer, livePreview, titleBlock)
    stage.at(0.02, () => stage.play(morph.to(0.97, { duration: Math.max(0.45, clock.intro - 0.05) })))
}

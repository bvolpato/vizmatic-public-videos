import {
    Node, circle, contourPaths, dot, dynamic, group, linearGradient, polyPath, radialGradient, scalarField, tex,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { HOOK_PARTICLES, lerpPt } from '../math'
import { COSMOS, txt } from '../../../factory/style'

// Full-bleed centered optimal-transport constellation spanning the entire 1920x1080 canvas
const CX = 0
const CY = -16
const SCALE = 232
const PREVIEW_PARTICLES = HOOK_PARTICLES.filter((_, i) => i % 2 === 0)

function heroDensityField(wx: number, wy: number): number {
    const gauss = 0.24 * Math.exp(-(wx * wx + wy * wy) / 2.8)
    const cx = wx - 0.12
    const cy = wy
    const rad = Math.hypot(cx, cy)
    const ang = Math.atan2(cy, -cx)
    const arcMask = Math.exp(-Math.pow(ang / 1.55, 2))
    const ring = Math.exp(-Math.pow((rad - 1.06) / 0.26, 2)) * arcMask * 0.94
    const sx = wx - 0.42
    const sy = wy + 0.02
    const starGlow = Math.exp(-(sx * sx + sy * sy) / 0.22) * 1.08
    return gauss + ring + starGlow
}

const FIELD_SPAN = 2.75
const FIELD_PX = 1280

const mapFieldPt = (wx: number, wy: number): Vec => [
    CX + ((wx + FIELD_SPAN) / (2 * FIELD_SPAN) - 0.5) * FIELD_PX,
    CY + (0.5 - (wy + FIELD_SPAN) / (2 * FIELD_SPAN)) * FIELD_PX,
]

const HERO_CONTOURS = contourPaths((x, y) => heroDensityField(x, -y), {
    x: [-FIELD_SPAN, FIELD_SPAN],
    y: [-FIELD_SPAN, FIELD_SPAN],
    levels: [0.12, 0.26, 0.5, 0.82],
    resolution: 72,
})

const STREAM_COUNT = 112
const STREAM_PARTICLES = Array.from({ length: STREAM_COUNT }, (_, i) => {
    const p = HOOK_PARTICLES[Math.floor((i * HOOK_PARTICLES.length) / STREAM_COUNT)]!
    const dx = p.x1[0] - p.x0[0]
    const dy = p.x1[1] - p.x0[1]
    const len = Math.max(0.01, Math.hypot(dx, dy))
    const bend = ((i % 2 === 0 ? 1 : -1) * (0.15 + (i % 5) * 0.036)) * len
    const nx = -dy / len
    const ny = dx / len
    return { p, nx, ny, bend }
})

function curvedPt(x0: readonly [number, number], x1: readonly [number, number], nx: number, ny: number, bend: number, u: number): Vec {
    const base = lerpPt(x0, x1, u)
    const arch = Math.sin(Math.PI * u) * bend
    return [CX + (base[0] + nx * arch) * SCALE, CY + (base[1] + ny * arch) * SCALE]
}

export const poster: IntroFunction = (stage, clock) => {
    const morph = stage.value(0.76)

    const auraField = scalarField(
        (wx, wy) => heroDensityField(wx, -wy),
        {
            x: [-FIELD_SPAN, FIELD_SPAN],
            y: [-FIELD_SPAN, FIELD_SPAN],
            domain: [0.05, 1.35],
            colors: ['#07091000', '#3b247834', '#2272a848', '#5ce1e64e', '#ffd16668', '#fff4cc7c'],
            width: FIELD_PX,
            height: FIELD_PX,
            resolution: 92,
        },
    ).at(CX, CY).set('blend', 'screen')

    const contourLayer = group(
        ...HERO_CONTOURS.flatMap((lvl, idx) =>
            lvl.paths.map((pts) =>
                new Node(polyPath(pts.map(([wx, wy]) => mapFieldPt(wx, wy))))
                    .stroke(idx >= 2 ? COSMOS.gold : idx === 1 ? COSMOS.cyan : COSMOS.violet, idx >= 2 ? 1.9 : 1.3, 0.26 + idx * 0.1)
                    .glow(idx >= 2 ? 6 : 3, idx >= 2 ? COSMOS.gold : COSMOS.cyan),
            ),
        ),
    ).set('blend', 'screen')

    const livePreview = dynamic(() => {
        const t = morph.value
        const streamNodes: Node[] = []

        for (let i = 0; i < STREAM_PARTICLES.length; i++) {
            const sp = STREAM_PARTICLES[i]!
            const u0 = Math.max(0, t - 0.46)
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
                    .stroke(grad, isHero ? 2.7 : 1.5, isHero ? 0.76 : 0.44)
                    .glow(isHero ? 7 : 0, endCol),
            )
        }

        const particleNodes: Node[] = []
        for (let i = 0; i < PREVIEW_PARTICLES.length; i++) {
            const p = PREVIEW_PARTICLES[i]!
            const pos = lerpPt(p.x0, p.x1, t)
            const col = p.kind === 'star' ? '#fff7d6' : p.kind === 'crescent' ? COSMOS.gold : COSMOS.cyan
            const isSpark = p.kind === 'star' && i % 5 === 0
            particleNodes.push(
                dot(p.size * (p.kind === 'star' ? 1.12 : 1.0), col)
                    .at(CX + pos[0] * SCALE, CY + pos[1] * SCALE)
                    .opacity(p.kind === 'halo' ? 0.65 : 0.94)
                    .glow(isSpark ? 10 : 0, COSMOS.gold),
            )
        }

        return group(
            group(...streamNodes).set('blend', 'screen'),
            ...particleNodes,
        )
    })

    // Soft dark cosmic contrast cradle behind bottom theatrical typography
    const titleCradle = circle(740, {
        fill: radialGradient([0, 0], 740, [
            [0, '#070910dd'],
            [0.52, '#07091096'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(0, 355)

    // Centered theatrical one-sheet typography (top crown + monumental lower-third title)
    const titleBlock = group(
        tex(String.raw`\frac{dx}{dt} = v_t(x)`, { size: 34, color: COSMOS.gold }).at(-195, -438).glow(6, COSMOS.gold),
        txt('·   OPTIMAL TRANSPORT', -62, -436, 26, COSMOS.gold, 'mono', 'left'),
        txt('Diffusion & Flow Matching', 0, 316, 102, COSMOS.ink, 'serif', 'center').glow(9, COSMOS.cyan),
        txt('How AI sculpts noise into reality', 0, 412, 34, COSMOS.cyan, 'sans', 'center').glow(6, '#38bdf8'),
    )

    stage.add(auraField, contourLayer, livePreview, titleCradle, titleBlock)
    stage.at(0.02, () => stage.play(morph.to(0.97, { duration: Math.max(0.45, clock.intro - 0.05) })))
}

import {
    Node, circle, dot, dynamic, group, line, linearGradient, par, radialGradient,
    type SceneFunction,
} from 'vizmatic/stage'
import { HOOK_PARTICLES, lerpPt } from '../math'
import { COSMOS, txt } from '../../../factory/style'

const CX_RIGHT = 335
const CY = 5
const SCALE = 205
const SWARM_COLORS = [COSMOS.cyan, COSMOS.violet, COSMOS.blue, COSMOS.gold] as const

// Select 56 representative streamlines for glowing velocity trails
const STREAM_INDICES = Array.from({ length: 56 }, (_, i) => Math.floor((i * HOOK_PARTICLES.length) / 56))
// Select 18 luminous hero stars to bloom with glow when constellation snaps
const HERO_STARS = HOOK_PARTICLES.filter((p) => p.kind === 'star').slice(0, 18)

export const hook: SceneFunction = (s, c) => {
    const flowT = s.value(0.02)
    const centerShift = s.value(0)
    const shockProg = s.value(0)

    const shot1Copy = group(
        txt('PURE NOISE', -845, -245, 34, COSMOS.violet, 'mono', 'left').glow(6, COSMOS.violet),
        txt('Sculpting', -848, -118, 104, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.blue),
        txt('Reality', -848, -4, 104, COSMOS.gold, 'serif', 'left').glow(8, COSMOS.gold),
        txt('1,240 Gaussian particles streaming', -845, 114, 30, COSMOS.muted, 'sans', 'left'),
        txt('along optimal-transport streamlines', -845, 156, 30, COSMOS.cyan, 'sans', 'left'),
    )

    const shot2Caption = group(
        txt('From Random Static to Coherent Structure', 0, -395, 62, COSMOS.gold, 'serif').glow(8, COSMOS.gold),
        txt('Laser-straight velocity fields sculpt Gaussian noise directly into data', 0, 398, 32, COSMOS.cyan, 'sans'),
    )

    const liveConstellation = dynamic(() => {
        const t = flowT.value
        const cx = CX_RIGHT * (1 - centerShift.value)
        const trailAmt = Math.sin(Math.PI * Math.min(1, t))
        const sp = shockProg.value

        const nodes: Node[] = [
            circle(510, {
                fill: radialGradient([0, 0], 510, [
                    [0, t > 0.65 ? '#ffd1662c' : '#a78bfa24'],
                    [0.48, '#5ce1e614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(cx, CY),
        ]

        // Glowing shockwave ring as constellation snaps into place
        if (sp > 0.01 && sp < 0.99) {
            const r = 60 + sp * 460
            nodes.push(
                circle(r, { fill: null, stroke: COSMOS.gold, width: 4.2 })
                    .at(cx, CY)
                    .opacity((1 - sp) * 0.85)
                    .glow(12, COSMOS.gold),
            )
        }

        // 56 glowing velocity streamlines visible during transport
        if (trailAmt > 0.03) {
            for (const idx of STREAM_INDICES) {
                const p = HOOK_PARTICLES[idx]!
                const head = lerpPt(p.x0, p.x1, t)
                const tail = lerpPt(p.x0, p.x1, Math.max(0, t - 0.18 * trailAmt))
                const hx = cx + head[0] * SCALE
                const hy = CY + head[1] * SCALE
                const tx = cx + tail[0] * SCALE
                const ty = CY + tail[1] * SCALE
                const grad = linearGradient([tx, ty], [hx, hy], ['#07091000', p.kind === 'star' ? COSMOS.gold : COSMOS.cyan])
                nodes.push(
                    line([tx, ty], [hx, hy], { stroke: grad, width: 2.2 }).opacity(0.68 * trailAmt),
                )
            }
        }

        // All 1,240 deterministic particles streaming smoothly from Gaussian nebula to golden crescent + star!
        for (let i = 0; i < HOOK_PARTICLES.length; i++) {
            const p = HOOK_PARTICLES[i]!
            const pos = lerpPt(p.x0, p.x1, t)
            const x = cx + pos[0] * SCALE
            const y = CY + pos[1] * SCALE
            let col: string
            if (t < 0.35) {
                col = SWARM_COLORS[p.hueIdx]!
            } else {
                col = p.kind === 'star' ? '#fff7d6' : p.kind === 'crescent' ? COSMOS.gold : COSMOS.cyan
            }
            const op = p.kind === 'halo' ? 0.52 : 0.72 + t * 0.24
            nodes.push(dot(p.size, col).at(x, y).opacity(op))
        }

        // Hero glowing stars inside the star constellation
        if (t > 0.55) {
            const ga = Math.min(1, (t - 0.55) * 2.2)
            for (const p of HERO_STARS) {
                const pos = lerpPt(p.x0, p.x1, t)
                nodes.push(
                    dot(3.8, '#ffffff')
                        .at(cx + pos[0] * SCALE, CY + pos[1] * SCALE)
                        .opacity(ga)
                        .glow(10, COSMOS.gold),
                )
            }
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

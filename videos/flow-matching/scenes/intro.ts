import {
    Node, circle, dot, dynamic, group, line, radialGradient,
    type IntroFunction,
} from 'vizmatic/stage'
import { HOOK_PARTICLES, lerpPt } from '../math'
import { COSMOS, txt } from '../../../factory/style'

const CX = 375
const CY = 5
const SCALE = 205
const PREVIEW_PARTICLES = HOOK_PARTICLES.filter((_, i) => i % 2 === 0)

export const intro: IntroFunction = (stage, clock) => {
    const morph = stage.value(0.68)

    const livePreview = dynamic(() => {
        const t = morph.value
        const nodes: Node[] = [
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ffd16628'],
                    [0.45, '#7c8cff18'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY),
        ]

        // Luminous velocity trails for first 40 particles
        for (let i = 0; i < 40; i++) {
            const p = PREVIEW_PARTICLES[i * 11]!
            const cur = lerpPt(p.x0, p.x1, t)
            const tail = lerpPt(p.x0, p.x1, Math.max(0, t - 0.14))
            nodes.push(
                line(
                    [CX + tail[0] * SCALE, CY + tail[1] * SCALE],
                    [CX + cur[0] * SCALE, CY + cur[1] * SCALE],
                    { stroke: p.kind === 'star' ? COSMOS.gold : COSMOS.cyan, width: 1.8 },
                ).opacity(0.45),
            )
        }

        for (let i = 0; i < PREVIEW_PARTICLES.length; i++) {
            const p = PREVIEW_PARTICLES[i]!
            const pos = lerpPt(p.x0, p.x1, t)
            const col = p.kind === 'star' ? '#fff7d6' : p.kind === 'crescent' ? COSMOS.gold : COSMOS.cyan
            nodes.push(
                dot(p.size * 0.95, col).at(CX + pos[0] * SCALE, CY + pos[1] * SCALE).opacity(0.88),
            )
        }

        return group(...nodes)
    })

    stage.add(
        livePreview,
        txt('dx/dt = vₜ(x)   ·   OPTIMAL TRANSPORT', -840, -195, 26, COSMOS.gold, 'mono', 'left'),
        txt('Diffusion &', -848, -68, 108, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.violet),
        txt('Flow Matching', -848, 56, 108, COSMOS.cyan, 'serif', 'left').glow(8, '#38bdf8'),
        txt('How AI sculpts noise into reality', -840, 178, 36, COSMOS.muted, 'sans', 'left'),
    )

    stage.at(0.02, () => stage.play(morph.to(0.96, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

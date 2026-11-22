import {
    Node, arc, circle, dot, dynamic, group, line, linear, radialGradient,
    type SceneFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const CX = 0
const CY = -195
const RINGS = [46, 76, 106, 136, 166, 196, 226] as const
const SPEEDS = [1.0, 0.58, 0.34, 0.2, 0.12, 0.07, 0.04] as const
const COLS = [COSMOS.cyan, '#38bdf8', COSMOS.blue, COSMOS.violet, '#e879f9', COSMOS.amber, COSMOS.gold] as const
const MILESTONES = [
    { x: -720, label: '4k' },
    { x: -360, label: '32k' },
    { x: 0, label: '128k' },
    { x: 360, label: '512k' },
    { x: 720, label: '1M+' },
] as const

export const finale: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const showTakeaway = s.value(0)

    const liveClockwork = dynamic(() => {
        const ph = phase.value
        const pulse = (ph * 0.16) % 1
        const nodes: Node[] = [
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, '#ffd1662c'],
                    [0.45, '#5ce1e614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY),
            circle(42 + pulse * 310, { fill: null, stroke: COSMOS.gold, width: 2.2 })
                .at(CX, CY).opacity((1 - pulse) * 0.55).glow(8, COSMOS.gold),
        ]

        // Glowing 128k-token horizon bar beneath the celestial clockwork
        const horY = 128
        nodes.push(
            line([-780, horY], [780, horY], { stroke: COSMOS.gold, width: 3.2 }).opacity(0.65).glow(8, COSMOS.gold),
        )
        for (const ms of MILESTONES) {
            const isHero = ms.label === '128k'
            nodes.push(
                line([ms.x, horY - 12], [ms.x, horY + 12], {
                    stroke: isHero ? COSMOS.gold : COSMOS.cyan,
                    width: isHero ? 3.5 : 2.2,
                }),
                dot(isHero ? 7 : 5, '#ffffff').at(ms.x, horY).glow(isHero ? 14 : 8, isHero ? COSMOS.gold : COSMOS.cyan),
                txt(ms.label, ms.x, horY + 38, isHero ? 30 : 26, isHero ? COSMOS.gold : COSMOS.muted, 'mono'),
            )
        }

        // 7 synchronized golden/cyan harmonic clock rings
        for (let i = 0; i < RINGS.length; i++) {
            const r = RINGS[i]!
            const col = COLS[i]!
            const ang = -Math.PI / 2 + ph * SPEEDS[i]!
            const hx = CX + Math.cos(ang) * r
            const hy = CY + Math.sin(ang) * r
            nodes.push(
                circle(r, { fill: null, stroke: col, width: 1.8 }).at(CX, CY).opacity(0.32),
                arc(r, ang - 0.9, ang, { fill: null, stroke: col, width: 4.0 }).at(CX, CY).opacity(0.92).glow(8, col),
                line([CX, CY], [hx, hy], { stroke: col, width: 2.0 }).opacity(0.55),
                dot(6.5, '#ffffff').at(hx, hy).glow(12, col),
            )
        }

        nodes.push(dot(9, '#ffffff').at(CX, CY).glow(16, COSMOS.gold))

        if (showTakeaway.value >= 0.02) {
            const a = showTakeaway.value
            nodes.push(
                txt('Position is not a number you add.', 0, 255, 62, COSMOS.ink, 'serif').glow(6, '#90b4ff').opacity(a),
                txt('It is an angle you spin.', 0, 342, 70, COSMOS.gold, 'serif').glow(10, COSMOS.gold).opacity(a),
                txt('RoPE  ·  θᵢ = base^(-2i/d)  ·  128k+ Context', 0, 422, 26, '#8b99b8', 'mono').opacity(a),
            )
        }

        return group(...nodes)
    })

    s.add(liveClockwork)
    const totalDur = Math.max(5.0, c.end - c.start - 0.35)
    c.at(0.05, () => s.play(phase.to(14, { duration: totalDur, ease: linear })))
    c.on('Position is not', () => s.play(showTakeaway.to(1, { duration: 0.45 })))
}

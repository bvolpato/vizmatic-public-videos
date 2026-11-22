import {
    Node, arc, circle, dot, dynamic, fadeIn, group, line, linear, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const CX = 0
const CY = -190
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

// 4 wide full-width helical light ribbons flanking the central clock dial across the entire 16:9 canvas
const RIBBONS = [
    { freq: 0.0115, amp: 145, speed: 1.35, phase: 0.0, col: COSMOS.cyan, width: 3.4 },
    { freq: 0.0082, amp: 112, speed: 0.92, phase: 1.4, col: COSMOS.blue, width: 3.0 },
    { freq: 0.0058, amp: 175, speed: 0.64, phase: 2.8, col: COSMOS.violet, width: 3.2 },
    { freq: 0.0038, amp: 198, speed: 0.42, phase: 4.1, col: COSMOS.gold, width: 3.8 },
] as const

export const finale: SceneFunction = (s, c) => {
    const phase = s.value(0)

    const takeawayFormula = tex(String.raw`\theta_i = \text{base}^{-2i/d}`, {
        size: 32,
        color: COSMOS.gold,
    }).at(0, 422).glow(5, COSMOS.gold)

    const takeawayGroup = group(
        txt('Position is not a number you add.', 0, 252, 62, COSMOS.ink, 'serif').glow(6, '#90b4ff'),
        txt('It is an angle you spin.', 0, 338, 70, COSMOS.gold, 'serif').glow(10, COSMOS.gold),
        txt('RoPE  ·', -265, 422, 26, '#94a3c4', 'mono', 'right'),
        takeawayFormula,
        txt('·  128k+ Context', 265, 422, 26, '#94a3c4', 'mono', 'left'),
    ).hide()

    const liveClockwork = dynamic(() => {
        const ph = phase.value
        const pulse = (ph * 0.16) % 1
        const nodes: Node[] = [
            circle(540, {
                fill: radialGradient([0, 0], 540, [
                    [0, '#ffd16630'],
                    [0.45, '#5ce1e618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).set('blend', 'screen'),
            circle(42 + pulse * 320, { fill: null, stroke: COSMOS.gold, width: 2.4 })
                .at(CX, CY).opacity((1 - pulse) * 0.6).glow(8, COSMOS.gold).set('blend', 'screen'),
        ]

        // Wide full-width glowing helical light ribbons flanking the central clock across the full 1920px canvas
        const samples = 110
        for (const rib of RIBBONS) {
            const pts: Vec[] = []
            for (let i = 0; i <= samples; i++) {
                const x = -960 + (1920 * i) / samples
                const distFromCenter = Math.abs(x)
                // Envelope blooms smoothly outward on left & right flanks while softly threading behind the dial
                const flankEnv = 0.28 + 0.72 * Math.min(1, Math.max(0, (distFromCenter - 150) / 360))
                const edgeTaper = 1 - 0.18 * Math.pow(distFromCenter / 960, 2)
                const y = CY + Math.sin(x * rib.freq - ph * rib.speed + rib.phase) * rib.amp * flankEnv * edgeTaper
                pts.push([x, y])
            }
            nodes.push(
                new Node(polyPath(pts))
                    .stroke(rib.col, rib.width, 0.58)
                    .glow(10, rib.col)
                    .set('blend', 'screen'),
            )
            // Luminous phase beads gliding along both wings
            for (const side of [-1, 1] as const) {
                const wingFrac = ((ph * 0.14 * rib.speed + rib.phase * 0.17) % 1)
                const bx = side * (290 + wingFrac * 610)
                const dist = Math.abs(bx)
                const flankEnv = 0.28 + 0.72 * Math.min(1, Math.max(0, (dist - 150) / 360))
                const edgeTaper = 1 - 0.18 * Math.pow(dist / 960, 2)
                const by = CY + Math.sin(bx * rib.freq - ph * rib.speed + rib.phase) * rib.amp * flankEnv * edgeTaper
                nodes.push(
                    dot(5.5, '#ffffff').at(bx, by).glow(12, rib.col).set('blend', 'screen'),
                )
            }
        }

        // Glowing 128k-token horizon bar beneath the celestial clockwork
        const horY = 128
        nodes.push(
            line([-780, horY], [780, horY], { stroke: COSMOS.gold, width: 3.4 })
                .opacity(0.75).glow(10, COSMOS.gold).set('blend', 'screen'),
        )
        for (const ms of MILESTONES) {
            const isHero = ms.label === '128k'
            nodes.push(
                line([ms.x, horY - 12], [ms.x, horY + 12], {
                    stroke: isHero ? COSMOS.gold : COSMOS.cyan,
                    width: isHero ? 3.6 : 2.2,
                }),
                dot(isHero ? 7.5 : 5.2, '#ffffff')
                    .at(ms.x, horY)
                    .glow(isHero ? 16 : 9, isHero ? COSMOS.gold : COSMOS.cyan)
                    .set('blend', 'screen'),
                txt(ms.label, ms.x, horY + 38, isHero ? 30 : 26, isHero ? COSMOS.gold : COSMOS.muted, 'mono'),
            )
        }

        // 7 synchronized golden/cyan harmonic clock rings with crisp bezel ticks
        for (let t = 0; t < 24; t++) {
            const ta = (t * Math.PI) / 12
            const major = t % 2 === 0
            nodes.push(line(
                [CX + Math.cos(ta) * (major ? 220 : 224), CY + Math.sin(ta) * (major ? 220 : 224)],
                [CX + Math.cos(ta) * 238, CY + Math.sin(ta) * 238],
                { stroke: major ? '#93c5fd' : '#526796', width: major ? 2.2 : 1.2 },
            ).opacity(major ? 0.78 : 0.42))
        }

        for (let i = 0; i < RINGS.length; i++) {
            const r = RINGS[i]!
            const col = COLS[i]!
            const ang = -Math.PI / 2 + ph * SPEEDS[i]!
            const hx = CX + Math.cos(ang) * r
            const hy = CY + Math.sin(ang) * r
            nodes.push(
                circle(r, { fill: null, stroke: col, width: 2.0 }).at(CX, CY).opacity(0.45),
                arc(r, ang - 0.92, ang, { fill: null, stroke: col, width: 4.4 })
                    .at(CX, CY).opacity(0.95).glow(10, col).set('blend', 'screen'),
                line([CX, CY], [hx, hy], { stroke: col, width: 2.2 }).opacity(0.68).set('blend', 'screen'),
                dot(7, '#ffffff').at(hx, hy).glow(14, col).set('blend', 'screen'),
            )
        }

        nodes.push(dot(9.5, '#ffffff').at(CX, CY).glow(18, COSMOS.gold).set('blend', 'screen'))

        return group(...nodes)
    })

    s.add(liveClockwork, takeawayGroup)
    const totalDur = Math.max(5.0, c.end - c.start - 0.35)
    c.at(0.05, () => s.play(phase.to(14, { duration: totalDur, ease: linear })))
    c.on('Position is not', () => {
        s.play(fadeIn(takeawayGroup, { duration: 0.45 }))
    })
}

import {
    Node, arc, circle, dot, dynamic, group, line, linear, par, radialGradient, tex,
    type SceneFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const RING_RADII = [58, 102, 146, 190, 234, 278, 322, 366] as const
const RING_COLORS = [
    COSMOS.cyan, '#38bdf8', COSMOS.blue, '#818cf8', COSMOS.violet, '#e879f9', COSMOS.rose, COSMOS.gold,
] as const
// Exponential frequency ladder theta_i = 10000^(-2i/d) scaled for continuous visual sweep
const RING_FREQS = [1.0, 0.562, 0.316, 0.178, 0.10, 0.0562, 0.0316, 0.0178] as const

export const hook: SceneFunction = (s, c) => {
    const pos = s.value(0)
    const showSplit = s.value(1)
    const showGalaxy = s.value(0)
    const galaxyPos = s.value(12)

    const splitTitle = group(
        tex(String.raw`\theta_i = 10000^{-2i/d}`, {
            size: 38,
            color: COSMOS.gold,
        }).at(-668, -210).glow(6, COSMOS.gold),
        txt('RoPE', -852, -74, 134, COSMOS.ink, 'serif', 'left').glow(6, '#90b4ff'),
        txt('Spinning Clocks', -852, 54, 96, COSMOS.cyan, 'serif', 'left').glow(8, '#38bdf8'),
        txt('Why LLMs turn token order into angle', -845, 174, 34, '#cbd5e8', 'sans', 'left'),
    )

    // Shot 1: Luminous concentric clockwork galaxy on right advancing m = 0 -> 36
    const liveSplitClocks = dynamic(() => {
        if (showSplit.value < 0.02) return []
        const a = showSplit.value
        const m = pos.value
        const cx = 330
        const cy = 0
        const pulse = (m * 0.25) % 1
        const nodes: Node[] = [
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ffd1662c'],
                    [0.45, '#5ce1e61a'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(cx, cy).opacity(a).set('blend', 'screen'),
            circle(40 + pulse * 360, { fill: null, stroke: COSMOS.gold, width: 2.4 })
                .at(cx, cy).opacity((1 - pulse) * 0.55 * a).set('blend', 'screen'),
        ]

        // 60 fine bezel ticks + 12 bright radial hour ticks
        for (let t = 0; t < 60; t++) {
            const ta = (t * Math.PI) / 30
            const major = t % 5 === 0
            const r0 = major ? 350 : 358
            const r1 = major ? 380 : 374
            nodes.push(line(
                [cx + Math.cos(ta) * r0, cy + Math.sin(ta) * r0],
                [cx + Math.cos(ta) * r1, cy + Math.sin(ta) * r1],
                { stroke: major ? '#93c5fd' : '#526796', width: major ? 2.5 : 1.3 },
            ).opacity((major ? 0.85 : 0.45) * a))
        }

        for (let i = 0; i < RING_RADII.length; i++) {
            const r = RING_RADII[i]!
            const col = RING_COLORS[i]!
            const ang = -Math.PI / 2 + m * RING_FREQS[i]!
            const hx = cx + Math.cos(ang) * r
            const hy = cy + Math.sin(ang) * r
            const trailLen = 0.62 + (RING_RADII.length - i) * 0.09
            nodes.push(
                circle(r, { fill: null, stroke: col, width: 1.9 }).at(cx, cy).opacity(0.45 * a),
                arc(r, ang - trailLen, ang, { fill: null, stroke: col, width: 4.2 })
                    .at(cx, cy).opacity(0.95 * a).glow(9, col).set('blend', 'screen'),
                line([cx, cy], [hx, hy], { stroke: col, width: 2.3 }).opacity(0.68 * a).set('blend', 'screen'),
                dot(7.2, '#ffffff').at(hx, hy).glow(14, col).opacity(a).set('blend', 'screen'),
            )
        }

        nodes.push(
            dot(9, '#ffffff').at(cx, cy).glow(16, COSMOS.gold).opacity(a).set('blend', 'screen'),
            txt(`m = ${Math.round(m).toString().padStart(2, '0')}`, cx, 425, 34, COSMOS.gold, 'mono').glow(5, COSMOS.gold).opacity(a),
        )
        return group(...nodes)
    })

    // Shot 2: Full-bleed centered galaxy of concentric clocks snapping into alignment up to m = 64
    const galaxyCaption = group(
        txt('A galaxy of hidden clocks', 0, -405, 68, COSMOS.gold, 'serif').glow(8, COSMOS.gold),
        txt('spinning inside every token from fast local ticks to slow sweeps', 0, 415, 32, '#cbd5e8', 'sans'),
    )

    const liveGalaxy = dynamic(() => {
        if (showGalaxy.value < 0.02) return []
        const a = showGalaxy.value
        const m = galaxyPos.value
        const cx = 0
        const cy = 5
        const nodes: Node[] = [
            circle(540, {
                fill: radialGradient([0, 0], 540, [
                    [0, '#ffd1662c'],
                    [0.45, '#a78bfa18'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(cx, cy).opacity(a).set('blend', 'screen'),
        ]

        const radii = [56, 98, 140, 182, 224, 266, 308, 350]
        nodes.push(
            line([cx, cy - 372], [cx, cy + 372], { stroke: '#3a4c78', width: 1.5, dash: [6, 8] }).opacity(0.65 * a),
            line([cx - 372, cy], [cx + 372, cy], { stroke: '#3a4c78', width: 1.5, dash: [6, 8] }).opacity(0.65 * a),
        )

        for (let t = 0; t < 24; t++) {
            const ta = (t * Math.PI) / 12
            const major = t % 2 === 0
            nodes.push(line(
                [cx + Math.cos(ta) * (major ? 340 : 346), cy + Math.sin(ta) * (major ? 340 : 346)],
                [cx + Math.cos(ta) * 364, cy + Math.sin(ta) * 364],
                { stroke: major ? '#93c5fd' : '#526796', width: major ? 2.4 : 1.4 },
            ).opacity((major ? 0.8 : 0.45) * a))
        }

        for (let i = 0; i < radii.length; i++) {
            const r = radii[i]!
            const col = RING_COLORS[i]!
            const ang = -Math.PI / 2 + m * RING_FREQS[i]!
            const hx = cx + Math.cos(ang) * r
            const hy = cy + Math.sin(ang) * r
            nodes.push(
                circle(r, { fill: null, stroke: col, width: 2.0 }).at(cx, cy).opacity(0.46 * a),
                arc(r, ang - 0.95, ang, { fill: null, stroke: col, width: 4.4 })
                    .at(cx, cy).opacity(0.96 * a).glow(10, col).set('blend', 'screen'),
                line([cx, cy], [hx, hy], { stroke: col, width: 2.3 }).opacity(0.72 * a).set('blend', 'screen'),
                dot(7.5, '#ffffff').at(hx, hy).glow(14, col).opacity(a).set('blend', 'screen'),
            )
        }

        nodes.push(
            dot(9.5, '#ffffff').at(cx, cy).glow(16, COSMOS.gold).opacity(a).set('blend', 'screen'),
            txt(`token m = ${Math.round(m)}`, -620, -10, 38, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan).opacity(a),
            txt('0 → 64', -620, 44, 28, COSMOS.muted, 'mono').opacity(a),
            txt('8 frequency bands', 620, -18, 34, COSMOS.gold, 'sans').opacity(a),
            txt('θ₀ fast  →  θ₇ slow', 620, 34, 28, COSMOS.cyan, 'mono').opacity(a),
        )
        return group(...nodes)
    })

    s.add(liveSplitClocks, splitTitle)
    const splitDur = Math.max(2.0, c.cue('spinning a galaxy').start - c.start - 0.15)
    c.at(0.05, () => s.play(pos.to(36, { duration: splitDur, ease: linear })))

    const remDur = Math.max(1.5, c.end - c.cue('spinning a galaxy').start - 0.55)
    c.on('spinning a galaxy', () => {
        s.play(par(
            showSplit.to(0, { duration: 0.25 }),
            showGalaxy.to(1, { duration: 0.3 }),
            galaxyPos.to(64, { duration: remDur, ease: linear }),
        ))
    })
    c.swap('spinning a galaxy', splitTitle, galaxyCaption)
    s.add(liveGalaxy)
}

import {
    Node, arc, circle, curve3d, dot, dynamic, group, line, line3d, par, point3d, radialGradient, scene3d, tex,
    type IntroFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

// Mirrored composition: Giant iridescent spinning clockwork + 3D multi-frequency helix on LEFT, Right-Aligned Editorial on RIGHT
const CX = -345
const CY = -8
const RING_RADII = [66, 114, 162, 210, 258, 306, 354] as const
const RING_COLORS = [
    COSMOS.cyan, '#38bdf8', COSMOS.blue, COSMOS.violet, '#c084fc', COSMOS.rose, COSMOS.gold,
] as const
const RING_SPEEDS = [1.0, 0.52, 0.27, 0.14, 0.075, 0.04, 0.022] as const

const HERO_HELIX_BANDS = [
    { freq: 0.95, radius: 0.95, color: COSMOS.cyan, width: 3.6, glow: 10 },
    { freq: 0.46, radius: 1.55, color: COSMOS.blue, width: 3.2, glow: 9 },
    { freq: 0.23, radius: 2.15, color: COSMOS.violet, width: 3.2, glow: 9 },
    { freq: 0.12, radius: 2.75, color: COSMOS.gold, width: 3.8, glow: 12 },
] as const

export const poster: IntroFunction = (stage, clock) => {
    const pos = stage.value(10.5)
    const beadT = stage.value(0.28)

    const hero3d = scene3d({
        theta: 0.68,
        phi: 1.18,
        distance: 15.2,
        unit: 106,
        perspective: true,
        ambient: 0.45,
        shine: 0.35,
        brightness: 1.14,
        fog: 0.2,
        focus: [-0.3, 0, 0.2],
    }).at(CX - 30, CY)

    hero3d.add(
        line3d([-5.4, 0, 0], [4.2, 0, 0], {
            color: COSMOS.gold,
            width: 3.0,
            opacity: 0.78,
            glow: 10,
            blend: 'screen',
        }),
    )

    for (const band of HERO_HELIX_BANDS) {
        hero3d.add(
            curve3d(
                (t): Vec3 => {
                    const m = t * 44
                    const x = 4.2 - t * 9.6
                    const ang = m * band.freq
                    return [x, Math.cos(ang) * band.radius, Math.sin(ang) * band.radius]
                },
                0,
                1,
                {
                    color: band.color,
                    width: band.width,
                    glow: band.glow,
                    blend: 'screen',
                    samples: 260,
                    opacity: 0.74,
                },
            ),
            point3d(
                (): Vec3 => {
                    const t = beadT.value
                    const m = t * 44
                    const x = 4.2 - t * 9.6
                    const ang = m * band.freq
                    return [x, Math.cos(ang) * band.radius, Math.sin(ang) * band.radius]
                },
                { color: '#ffffff', radius: 7.5, glow: 14, blend: 'screen' },
            ),
            point3d(
                (): Vec3 => {
                    const t = (beadT.value + 0.45) % 1
                    const m = t * 44
                    const x = 4.2 - t * 9.6
                    const ang = m * band.freq
                    return [x, Math.cos(ang) * band.radius, Math.sin(ang) * band.radius]
                },
                { color: band.color, radius: 6.2, glow: 12, blend: 'screen' },
            ),
        )
    }

    stage.add(
        circle(580, {
            fill: radialGradient([0, 0], 580, [
                [0, '#ffd16630'],
                [0.42, '#5ce1e620'],
                [0.72, '#4c2f8a16'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY).set('blend', 'screen'),
        hero3d,
        // Crisp Right-Aligned Editorial Typography
        txt('ROTARY POSITIONAL EMBEDDINGS', 854, -268, 26, COSMOS.cyan, 'mono', 'right'),
        tex(String.raw`\theta_i = 10000^{-2i/d}`, {
            size: 38,
            color: COSMOS.gold,
        }).at(668, -196).glow(6, COSMOS.gold),
        txt('RoPE', 860, -62, 144, COSMOS.ink, 'serif', 'right').glow(8, '#90b4ff'),
        txt('Spinning Clocks', 860, 66, 98, COSMOS.cyan, 'serif', 'right').glow(10, '#38bdf8'),
        txt('Why LLMs turn token order into angle', 854, 184, 34, '#cbd5e8', 'sans', 'right'),
        dynamic(() => {
            const m = pos.value
            const nodes: Node[] = []

            for (let t = 0; t < 60; t++) {
                const ta = (t * Math.PI) / 30
                const major = t % 5 === 0
                const r0 = major ? 340 : 348
                const r1 = major ? 372 : 364
                nodes.push(
                    line(
                        [CX + Math.cos(ta) * r0, CY + Math.sin(ta) * r0],
                        [CX + Math.cos(ta) * r1, CY + Math.sin(ta) * r1],
                        { stroke: major ? '#93c5fd' : '#536898', width: major ? 2.6 : 1.3 },
                    ).opacity(major ? 0.88 : 0.45),
                )
            }

            nodes.push(
                line([CX - 380, CY], [CX + 380, CY], { stroke: '#3a4c78', width: 1.4, dash: [6, 10] }).opacity(0.45),
                line([CX, CY - 380], [CX, CY + 380], { stroke: '#3a4c78', width: 1.4, dash: [6, 10] }).opacity(0.45),
            )

            for (let i = 0; i < RING_RADII.length; i++) {
                const r = RING_RADII[i]!
                const col = RING_COLORS[i]!
                const ang = -Math.PI / 2 + m * RING_SPEEDS[i]!
                const hx = CX + Math.cos(ang) * r
                const hy = CY + Math.sin(ang) * r
                const trail = 0.72 + (RING_RADII.length - i) * 0.08
                nodes.push(
                    circle(r, { fill: null, stroke: col, width: 2.0 }).at(CX, CY).opacity(0.48),
                    arc(r, ang - trail, ang, { fill: null, stroke: col, width: 4.4 })
                        .at(CX, CY).opacity(0.95).glow(10, col).set('blend', 'screen'),
                    line([CX, CY], [hx, hy], { stroke: col, width: 2.4 }).opacity(0.72).set('blend', 'screen'),
                    dot(7.5, '#ffffff').at(hx, hy).glow(14, col).set('blend', 'screen'),
                )
            }

            nodes.push(
                dot(10, '#ffffff').at(CX, CY).glow(18, COSMOS.gold).set('blend', 'screen'),
            )
            return group(...nodes)
        }),
    )

    const dur = Math.max(0.4, clock.intro - 0.06)
    stage.at(0.02, () => {
        stage.play(par(
            pos.to(15.5, { duration: dur }),
            beadT.to(0.68, { duration: dur }),
            hero3d.orbit({ theta: 0.42, phi: 1.08 }, { duration: dur }),
        ))
    })
}

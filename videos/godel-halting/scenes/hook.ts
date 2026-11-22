import {
    Node, circle, curve3d, dot, dynamic, group, line, line3d, linear, linearGradient, point3d, points3d, polyPath,
    radialGradient, scene3d,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const CX = 395
const CY = 10

// Deterministic 3D formal-system theorem constellation inside the AI proof engine
const PROOF_NODES: readonly Vec3[] = Array.from({ length: 28 }, (_, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / 28)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    const r = 1.05 + (i % 3) * 0.34
    return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
    ]
})

const OUTSIDE_TRUTHS: readonly Vec3[] = Array.from({ length: 18 }, (_, i) => {
    const ang = (i * 2.39996) + 0.4
    const r = 2.15 + (i % 4) * 0.26
    const z = ((i % 5) - 2) * 0.42
    return [r * Math.cos(ang), r * Math.sin(ang), z]
})

export const hook: SceneFunction = (s, c) => {
    const pulse = s.value(0)
    const sliceProg = s.value(0)
    const showEngine = s.value(1)
    const showPillars = s.value(0)
    const pillarPhase = s.value(0)

    const shot1Title = group(
        txt('INFINITE COMPUTE?', -840, -225, 34, '#ffd166', 'mono', 'left').glow(6, '#ffd166'),
        txt('Every formal', -848, -98, 102, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('system has a', -848, 14, 102, '#f8f4ec', 'serif', 'left'),
        txt('blind spot.', -848, 126, 102, '#ff6b8b', 'serif', 'left').glow(10, '#ff6b8b'),
        txt('Proved mathematically in the 1930s', -840, 240, 32, '#cbd5e8', 'sans', 'left'),
    )

    // Distinct 3D rotating AI Proof & Computation Engine (completely distinct from intro's 2D matrix!)
    const engine3d = scene3d({
        theta: -0.58,
        phi: 1.12,
        distance: 8.6,
        unit: 162,
        perspective: true,
        ambient: 0.42,
        shine: 0.35,
        brightness: 1.12,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(CX, CY)

    const ringProof = curve3d(
        (u, t) => {
            const a = u + t * 0.25
            return [1.78 * Math.cos(a), 1.78 * Math.sin(a), 0.32 * Math.sin(2 * a)]
        },
        0,
        Math.PI * 2,
        { samples: 120, color: '#5ce1e6', width: 3.8, glow: 10, blend: 'screen', opacity: 0.92, animate: true },
    )

    const ringCode = curve3d(
        (u, t) => {
            const a = u - t * 0.22
            const tilt = 1.05
            const x = 1.56 * Math.cos(a)
            const y = 1.56 * Math.sin(a) * Math.cos(tilt)
            const z = 1.56 * Math.sin(a) * Math.sin(tilt)
            return [x, y, z]
        },
        0,
        Math.PI * 2,
        { samples: 120, color: '#a78bfa', width: 3.4, glow: 10, blend: 'screen', opacity: 0.86, animate: true },
    )

    const ringLogic = curve3d(
        (u, t) => {
            const a = u + t * 0.18
            const x = 1.98 * Math.cos(a) * 0.78
            const y = 1.98 * Math.sin(a)
            const z = -1.98 * Math.cos(a) * 0.62
            return [x, y, z]
        },
        0,
        Math.PI * 2,
        { samples: 120, colors: ['#5ce1e6', '#60a5fa', '#ffd166', '#5ce1e6'], width: 2.6, glow: 8, blend: 'screen', opacity: 0.72, animate: true },
    )

    engine3d.add(
        ringProof,
        ringCode,
        ringLogic,
        ...PROOF_NODES.slice(0, 12).map((pt) =>
            line3d([0, 0, 0], pt, { color: '#5ce1e6', width: 1.5, opacity: 0.36, blend: 'screen' }),
        ),
        points3d(PROOF_NODES, {
            radius: 4.5,
            glow: 8,
            blend: 'screen',
            opacity: 0.92,
            colorAt: (i) => (i % 3 === 0 ? '#ffd166' : i % 2 === 0 ? '#5ce1e6' : '#a78bfa'),
        }),
        points3d(OUTSIDE_TRUTHS, {
            radius: 3.8,
            glow: 10,
            blend: 'screen',
            opacity: 0.78,
            colorAt: (i) => (i % 3 === 0 ? '#ff6b8b' : '#ffd166'),
        }),
        point3d([0, 0, 0], { color: '#ffffff', radius: 9.5, glow: 16, blend: 'screen', onTop: true }),
    )

    const engineOverlay = dynamic(() => {
        if (showEngine.value < 0.02) return []
        const a = showEngine.value
        const t = pulse.value
        const sp = sliceProg.value
        const nodes: Node[] = [
            circle(490, {
                fill: radialGradient([0, 0], 490, [
                    [0, sp > 0.05 ? '#ff6b8b34' : '#5ce1e62a'],
                    [0.48, '#4c2f8a1e'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            })
                .at(CX, CY)
                .opacity(a)
                .set('blend', 'screen'),
            txt('FORMAL SYSTEM F', CX, -352, 26, '#5ce1e6', 'mono').opacity(0.86 * a).glow(5, '#38bdf8'),
            txt('Axioms · Rules · Infinite Compute', CX, 386, 26, '#a5b9db', 'mono').opacity(0.88 * a),
        ]

        // Orbiting subtle proof-pulse ring around the engine
        const idleR = 235 + Math.sin(t * 1.4) * 14
        nodes.push(
            circle(idleR, { fill: null, stroke: '#5ce1e6', width: 1.4 })
                .at(CX, CY)
                .opacity(0.24 * a)
                .dash([8, 12]),
        )

        // When "answer is no" hits: diagonal paradox laser slices right through the 3D AI proof core!
        if (sp > 0.01) {
            const x0 = CX - 305
            const y0 = CY - 265
            const x1 = x0 + 610 * sp
            const y1 = y0 + 530 * sp
            const beamGrad = linearGradient([x0, y0], [CX + 305, CY + 265], ['#ff6b8b', '#ffd166', '#ffffff'])
            const ringR = 22 + ((sp * 4) % 1) * 130
            const ringOp = (1 - ((sp * 4) % 1)) * 0.78 * a
            nodes.push(
                line([x0, y0], [x1, y1], { stroke: beamGrad, width: 12 })
                    .opacity(0.45 * a)
                    .glow(20, '#ff6b8b')
                    .set('blend', 'screen'),
                line([x0, y0], [x1, y1], { stroke: beamGrad, width: 5.5 })
                    .opacity(a)
                    .glow(14, '#ffd166'),
                line([x0, y0], [x1, y1], { stroke: '#ffffff', width: 2 })
                    .opacity(0.9 * a)
                    .set('blend', 'screen'),
                circle(ringR, { fill: null, stroke: '#ffd166', width: 2.6 })
                    .at(x1, y1)
                    .opacity(ringOp)
                    .glow(10, '#ffd166')
                    .set('blend', 'screen'),
                dot(10, '#ffffff').at(x1, y1).glow(18, '#ffd166').opacity(a).set('blend', 'screen'),
            )

            // Inversion sparks bursting along the paradox cut
            const sparkCount = Math.floor(sp * 7)
            for (let k = 0; k < sparkCount; k++) {
                const f = (k + 0.6) / 7
                const sx = x0 + 610 * f
                const sy = y0 + 530 * f
                const ang = (k % 2 === 0 ? -1 : 1) * 0.95 + Math.sin(k * 2.1) * 0.35
                nodes.push(
                    line(
                        [sx - Math.cos(ang) * 26, sy - Math.sin(ang) * 26],
                        [sx + Math.cos(ang) * 26, sy + Math.sin(ang) * 26],
                        { stroke: k % 2 === 0 ? '#ffd166' : '#ff6b8b', width: 2.4 },
                    )
                        .opacity(0.85 * a)
                        .glow(8, '#ffd166')
                        .set('blend', 'screen'),
                    dot(4.5, '#ffd166').at(sx, sy).glow(10, '#ff6b8b').opacity(0.9 * a).set('blend', 'screen'),
                )
            }

            if (sp > 0.38) {
                const tagOp = Math.min(1, (sp - 0.38) * 2.4) * a
                nodes.push(
                    txt('PARADOX CUT  ↯  UNPROVABLE TRUTH', CX, -298, 26, '#ffd166', 'mono')
                        .glow(8, '#ff6b8b')
                        .opacity(tagOp),
                )
            }
        }
        return group(...nodes)
    })

    const shot2Copy = group(
        txt('Two proofs. One diagonal trap.', 0, -345, 66, '#ffd166', 'serif').glow(8, '#ffd166'),
        txt('1931 · Kurt Gödel', -465, -135, 44, '#5ce1e6', 'serif').glow(6, '#38bdf8'),
        txt('Incompleteness', -465, -70, 34, '#f8f4ec', 'sans'),
        txt('Truth outruns proof', -465, -15, 28, '#cbd5e8', 'sans'),
        txt('1936 · Alan Turing', 465, -135, 44, '#ff8fab', 'serif').glow(6, '#ff6b8b'),
        txt('Halting Problem', 465, -70, 34, '#f8f4ec', 'sans'),
        txt('Logic turns on itself', 465, -15, 28, '#cbd5e8', 'sans'),
        txt('Every formal system and algorithm hits the same boundary', 0, 345, 32, '#cbd5e8', 'sans'),
    )

    const livePillars = dynamic(() => {
        if (showPillars.value < 0.02) return []
        const a = showPillars.value
        const ph = pillarPhase.value
        const bridgeGrad = linearGradient([-320, 120], [320, -120], ['#5ce1e6', '#a78bfa', '#ff6b8b', '#ffd166'])
        const pts: Vec[] = Array.from({ length: 80 }, (_, i) => {
            const u = -1 + (2 * i) / 79
            const x = u * 310
            const y = 75 + Math.sin(u * Math.PI * 1.5 + ph * 2.2) * 58 * (1 - 0.35 * Math.abs(u))
            return [x, y] as Vec
        })
        const pts2: Vec[] = Array.from({ length: 80 }, (_, i) => {
            const u = -1 + (2 * i) / 79
            const x = u * 310
            const y = 75 - Math.sin(u * Math.PI * 1.5 + ph * 2.2) * 44 * (1 - 0.35 * Math.abs(u))
            return [x, y] as Vec
        })
        const waveR = 26 + ((ph * 0.7) % 1) * 190
        const waveOp = (1 - ((ph * 0.7) % 1)) * 0.62 * a
        return group(
            circle(440, {
                fill: radialGradient([0, 0], 440, [
                    [0, '#ffd16628'],
                    [0.5, '#5ce1e614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            })
                .at(0, 75)
                .opacity(a)
                .set('blend', 'screen'),
            line([-465, 55], [-465, 255], { stroke: '#5ce1e6', width: 4.5 }).glow(10, '#5ce1e6').opacity(0.9 * a),
            line([465, 55], [465, 255], { stroke: '#ff6b8b', width: 4.5 }).glow(10, '#ff6b8b').opacity(0.9 * a),
            new Node(polyPath(pts2)).stroke('#a78bfa', 2.4, 0.52 * a).glow(8, '#a78bfa').set('blend', 'screen'),
            new Node(polyPath(pts)).stroke(bridgeGrad, 4.8, 0.95 * a).glow(12, '#ffd166').set('blend', 'screen'),
            new Node(polyPath(pts)).stroke('#ffffff', 1.5, 0.48 * a).set('blend', 'screen'),
            circle(waveR, { fill: null, stroke: '#ffd166', width: 2.4 })
                .at(0, 75)
                .opacity(waveOp)
                .glow(8, '#ffd166')
                .set('blend', 'screen'),
            dot(8.5, '#ffffff').at(0, 75).glow(16, '#ffd166').opacity(a).set('blend', 'screen'),
        )
    })

    s.add(engineOverlay, engine3d, shot1Title, livePillars)
    c.at(0.05, () => s.play(pulse.to(6.0, { duration: 14.0, ease: linear })))
    c.at(0.06, () => s.play(engine3d.orbit({ theta: 0.75, phi: 0.96 }), { duration: 14.0 }))
    c.on('answer is no', () => s.play(sliceProg.to(1, { duration: 1.75 })))
    c.on('diagonal paradox', () => {
        s.play(showEngine.to(0, { duration: 0.25 }))
        s.play(showPillars.to(1, { duration: 0.3 }))
        s.play(pillarPhase.to(4.2, { duration: 4.0, ease: linear }))
    })
    c.swap('diagonal paradox', [shot1Title, engine3d], shot2Copy)
}

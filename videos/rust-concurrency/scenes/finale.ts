import {
    Node, circle, curve3d, dot, dynamic, group, line, line3d, linear, linearGradient,
    parametricSurface, point3d, polyPath, radialGradient, rect, scene3d,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const finale: SceneFunction = (s, c) => {
    const showPipe = s.value(1)
    const flowT = s.value(0)
    const queryOn = s.value(0)
    const showEnd = s.value(0)
    const endPhase = s.value(0)

    const pipeGrad = linearGradient([-720, -25], [720, -25], [COSMOS.blue, COSMOS.gold, COSMOS.cyan, COSMOS.emerald])
    const pipeCopy = group(
        txt('REAL-WORLD RUST SERVICE', 0, -425, 26, COSMOS.cyan, 'mono'),
        txt('Zero-Mutex Actor Pipeline', 0, -360, 58, COSMOS.ink, 'serif').glow(5, COSMOS.cyan),
    )

    // Stage 1: Lush panoramic multi-stage actor pipeline (3 Ingesters -> Semaphore -> Bounded mpsc -> Zero-Mutex Actor + oneshot + CancellationToken)
    const livePipe = dynamic(() => {
        if (showPipe.value < 0.04) return []
        const a = showPipe.value
        const ph = flowT.value
        const q = queryOn.value

        const yMid = -35
        const nodes: Node[] = [
            nebula(-50, yMid, 540, '#5ce1e61c', '#ffd16612').opacity(a),
            // Main horizontal pipeline conduit
            new Node(polyPath([[-560, yMid], [560, yMid]])).stroke(pipeGrad, 5, 0.72 * a).glow(8, COSMOS.cyan),
        ]

        // 3 parallel async ingesters on the left converging cleanly from right edge into Semaphore
        const ingYs = [-145, -35, 75]
        for (let i = 0; i < ingYs.length; i++) {
            const iy = ingYs[i]!
            const u = (ph * 0.85 + i * 0.31) % 1
            const px = -675 + u * 195
            const py = iy + (yMid - iy) * u
            nodes.push(
                line([-675, iy], [-480, yMid], { stroke: COSMOS.blue, width: 2.8 }).opacity(0.65 * a),
                rect(155, 56, { fill: '#0f192f', stroke: COSMOS.blue, width: 2.6, radius: 10 }).at(-755, iy).glow(6, COSMOS.blue).opacity(a),
                txt(`Ingest ${i + 1}`, -755, iy, 26, COSMOS.blue, 'mono').opacity(a),
                dot(7.5, '#ffffff').at(px, py).glow(10, COSMOS.blue).opacity(a),
            )
        }

        // Semaphore permit gate
        nodes.push(
            rect(200, 175, { fill: '#171722', stroke: COSMOS.gold, width: 3.5, radius: 16 })
                .at(-380, yMid)
                .glow(12, COSMOS.gold)
                .opacity(a),
            txt('Semaphore', -380, yMid - 42, 28, COSMOS.gold, 'mono').opacity(a),
            txt('N permits', -380, yMid + 54, 26, COSMOS.muted, 'sans').opacity(a),
        )
        for (let p = 0; p < 4; p++) {
            const lit = p < 3
            nodes.push(
                circle(13, { fill: lit ? COSMOS.gold : '#121826', stroke: COSMOS.gold, width: 2.2 })
                    .at(-434 + p * 36, yMid + 8)
                    .glow(lit ? 8 : 0, COSMOS.gold)
                    .opacity(a),
            )
        }

        // Bounded mpsc 6-slot buffer channel
        nodes.push(
            rect(370, 130, { fill: '#0c1526', stroke: COSMOS.cyan, width: 3.2, radius: 14 })
                .at(65, yMid)
                .glow(10, COSMOS.cyan)
                .opacity(a),
            txt('bounded mpsc', 65, yMid - 96, 26, COSMOS.cyan, 'mono').opacity(a),
        )
        for (let sIdx = 0; sIdx < 6; sIdx++) {
            const sx = -75 + sIdx * 56
            const active = ((sIdx - Math.floor(ph * 5)) % 6 + 6) % 6 < 4
            nodes.push(
                rect(44, 72, { fill: active ? '#152b3c' : '#0b1020', stroke: active ? COSMOS.cyan : '#243250', width: active ? 2.8 : 1.4, radius: 7 })
                    .at(sx, yMid)
                    .glow(active ? 7 : 0, COSMOS.cyan)
                    .opacity(a),
            )
        }

        // Zero-Mutex Actor owning its state exclusively
        nodes.push(
            rect(300, 210, { fill: '#0e2220', stroke: COSMOS.emerald, width: 4, radius: 18 })
                .at(590, yMid)
                .glow(14, COSMOS.emerald)
                .opacity(a),
            txt('Actor Task', 590, yMid - 50, 32, COSMOS.emerald, 'serif').opacity(a),
            txt('owned: HashMap', 590, yMid + 4, 26, COSMOS.ink, 'mono').opacity(a),
            txt('0 Mutexes', 590, yMid + 54, 26, COSMOS.gold, 'mono').opacity(a),
        )

        // Streaming luminous batch particles across the pipeline
        for (let k = 0; k < 4; k++) {
            const px = -270 + (((ph * 0.7 + k * 0.25) % 1) * 700)
            nodes.push(dot(8.5, '#ffffff').at(px, yMid).glow(14, COSMOS.gold).opacity(a))
        }

        // Bottom row: CancellationToken drain bus + oneshot query reply arc
        const busY = 235
        nodes.push(
            rect(560, 74, { fill: '#1c1220', stroke: COSMOS.rose, width: 2.8, radius: 12 })
                .at(-360, busY)
                .glow(8, COSMOS.rose)
                .opacity(a * (0.4 + 0.6 * q)),
            txt('CancellationToken  ->  clean drain', -360, busY, 26, COSMOS.rose, 'mono').opacity(a * (0.4 + 0.6 * q)),
        )

        if (q > 0.04) {
            const arcPts: Vec[] = Array.from({ length: 24 }, (_, i) => {
                const t = i / 23
                const x = 590 - t * 240
                const y = yMid + 108 + Math.sin(t * Math.PI * 0.5) * 125
                return [x, y] as Vec
            })
            nodes.push(
                new Node(polyPath(arcPts)).stroke(COSMOS.violet, 4, 0.9 * q * a).glow(10, COSMOS.violet),
                rect(440, 74, { fill: '#17132c', stroke: COSMOS.violet, width: 3, radius: 12 })
                    .at(350, busY)
                    .glow(10, COSMOS.violet)
                    .opacity(q * a),
                txt('oneshot::channel() reply', 350, busY, 26, COSMOS.violet, 'mono').opacity(q * a),
            )
        }

        return group(...nodes)
    })

    // ── Stage 2: Glowing 3D Ownership-Lattice Callback (echoing intro.ts!) ──
    const endAura = circle(520, {
        fill: radialGradient([0, 0], 520, [
            [0, '#ffd16634'],
            [0.45, '#5ce1e61c'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(0, -145)

    const endView = scene3d({
        theta: -0.5,
        phi: 1.05,
        distance: 13.5,
        unit: 112,
        perspective: true,
        ambient: 0.45,
        shine: 0.4,
        brightness: 1.15,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(0, -140)

    // Crystalline Send / Sync octahedron + braided golden/cyan thread orbits
    const octR = 1.45
    const topV: Vec3 = [0, 0, octR]
    const botV: Vec3 = [0, 0, -octR]
    const eq: readonly Vec3[] = [
        [octR, 0, 0],
        [0, octR, 0],
        [-octR, 0, 0],
        [0, -octR, 0],
    ]
    for (let i = 0; i < 4; i++) {
        const a = eq[i]!
        const b = eq[(i + 1) % 4]!
        endView.add(
            parametricSurface(
                (u, v): Vec3 => [
                    (1 - v) * ((1 - u) * a[0] + u * b[0]) + v * topV[0],
                    (1 - v) * ((1 - u) * a[1] + u * b[1]) + v * topV[1],
                    (1 - v) * ((1 - u) * a[2] + u * b[2]) + v * topV[2],
                ],
                [0, 1],
                [0, 1],
                { resolution: [1, 1], color: COSMOS.gold, opacity: 0.24, mesh: false, shaded: true },
            ),
            line3d(a, b, { color: COSMOS.gold, width: 3.2, glow: 9, blend: 'screen' }),
            line3d(a, topV, { color: COSMOS.amber, width: 2.8, glow: 8, blend: 'screen' }),
            line3d(a, botV, { color: COSMOS.cyan, width: 2.8, glow: 8, blend: 'screen' }),
        )
    }

    const endStrands = [COSMOS.cyan, COSMOS.amber, COSMOS.emerald] as const
    for (let i = 0; i < endStrands.length; i++) {
        const col = endStrands[i]!
        const off = (i * Math.PI * 2) / 3
        endView.add(
            curve3d(
                (t): Vec3 => {
                    const a = t * Math.PI * 2 + endPhase.value * 0.65 + off
                    return [Math.cos(a) * 2.55, Math.sin(a) * 2.55, Math.sin(a * 2 + off) * 0.72]
                },
                0,
                1,
                { color: col, width: 4.0, glow: 10, blend: 'screen', samples: 64, animate: true },
            ),
            point3d(
                (): Vec3 => {
                    const a = endPhase.value * 1.4 + off
                    return [Math.cos(a) * 2.55, Math.sin(a) * 2.55, Math.sin(a * 2 + off) * 0.72]
                },
                { color: '#ffffff', radius: 8, glow: 14, blend: 'screen', onTop: true },
            ),
        )
    }

    const endWords = group(
        txt('Ownership is Rust’s concurrency model.', 0, 148, 66, COSMOS.ink, 'serif').glow(6, COSMOS.amber),
        txt('Zero data races  ·  Verified on Rust 2024 & Tokio 1.54', 0, 240, 28, COSMOS.cyan, 'mono'),
    )

    s.add(pipeCopy, livePipe)

    const pipeDur = Math.max(4, c.cue('not bolted onto').start - c.start - 0.2)
    c.at(0.05, () => s.play(flowT.to(pipeDur * 0.65, { duration: pipeDur, ease: linear })))
    c.on('answering queries', () => s.play(queryOn.to(1, { duration: 0.7 })))

    const endDur = Math.max(3, c.end - c.cue('not bolted onto').start - 0.2)
    c.swap('not bolted onto', pipeCopy, [endAura, endView, endWords])
    c.on('not bolted onto', () => {
        s.play(
            showPipe.to(0, { duration: 0.3 }),
            showEnd.to(1, { duration: 0.4 }),
            endPhase.to(endDur * 1.1, { duration: endDur, ease: linear }),
            endView.orbit({ theta: 0.75, phi: 0.94 }, { duration: endDur }),
        )
    })
}

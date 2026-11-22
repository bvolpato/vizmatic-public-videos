import {
    Node, circle, curve3d, dot, dynamic, group, line, line3d, linear, linearGradient, point3d,
    polyPath, radialGradient, scene3d,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { samplePairHistory } from '../math'
import { txt } from '../../../factory/style'

const CX = 240
const CY = 10
const SCALE = 162

const RIBBON_COLS = ['#38bdf8', '#5ce1e6', '#60a5fa', '#ffd166', '#ff6b8b', '#a78bfa', '#5ce1e6'] as const

export const vortices: SceneFunction = (s, c) => {
    const pairProg = s.value(0.06)
    const show2D = s.value(1)
    const show3D = s.value(0)
    const stretch = s.value(0)
    const spin3D = s.value(0)

    const copy2D = group(
        txt('2D Vortex Advection', -840, -395, 56, '#f8f4ec', 'serif', 'left'),
        txt('Incompressible  ·  ∇·u = 0', -840, -320, 30, '#5ce1e6', 'mono', 'left'),
        txt('Computed via RK4 Biot-Savart flow', -840, -252, 26, '#9eb0d0', 'sans', 'left'),
        txt('Vorticity stays bounded forever', -840, 350, 30, '#ffd166', 'sans', 'left'),
    )

    const live2D = dynamic(() => {
        if (show2D.value < 0.02) return []
        const a = show2D.value
        const snap = samplePairHistory(pairProg.value)
        const nodes: Node[] = [
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#4c2f8a24'],
                    [0.55, '#5ce1e612'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).opacity(a),
            line([CX - 430, CY], [CX + 430, CY], { stroke: '#192136', width: 1.2 }).opacity(a),
            line([CX, CY - 370], [CX, CY + 370], { stroke: '#192136', width: 1.2 }).opacity(a),
        ]

        // Render the 7 RK4-advected glowing fluid ribbons wrapping into mesmerizing spirals!
        for (let r = 0; r < snap.ribbons.length; r++) {
            const rib = snap.ribbons[r]!
            const pts: Vec[] = rib.map(([px, py]) => [CX + px * SCALE, CY - py * SCALE] as Vec)
            const col = RIBBON_COLS[r]!
            const isCenter = r === 3
            nodes.push(
                new Node(polyPath(pts)).stroke(col, isCenter ? 4.4 : 3.0, (isCenter ? 0.96 : 0.8) * a).glow(isCenter ? 10 : 6, col),
            )
            if (isCenter) {
                nodes.push(new Node(polyPath(pts)).stroke('#ffffff', 1.2, 0.36 * a))
            }
        }

        // Orbiting glowing Lamb-Oseen vortex cores
        for (const vt of snap.vortices) {
            const vx = CX + vt.x * SCALE
            const vy = CY - vt.y * SCALE
            nodes.push(
                circle(44, {
                    fill: radialGradient([0, 0], 44, [
                        [0, '#ffd16670'],
                        [0.5, '#ff6b8b25'],
                        [1, '#ffd16600'],
                    ]),
                    stroke: null,
                }).at(vx, vy).opacity(a),
                circle(18, { fill: null, stroke: '#ffd166', width: 2.6 }).at(vx, vy).opacity(0.95 * a).glow(8, '#ffd166'),
                dot(6.5, '#ffffff').at(vx, vy).glow(14, '#ffd166').opacity(a),
            )
        }
        return group(...nodes)
    })

    const copy3D = group(
        txt('3D Vortex Stretching', -840, -395, 56, '#ffd166', 'serif', 'left').glow(6, '#ffd166'),
        txt('Thinner tube  →  faster spin', -840, -320, 32, '#ff6b8b', 'mono', 'left'),
        txt('Angular momentum concentrates energy', -840, 350, 28, '#cbd5e8', 'sans', 'left'),
    )

    // Hero 3D stretching vortex tube with helical curve3d streamlines!
    const live3DTube = dynamic(() => {
        if (show3D.value < 0.02) return []
        const a = show3D.value
        const st = stretch.value
        const sp = spin3D.value

        const view = scene3d({
            theta: -0.65 + sp * 0.22,
            phi: 1.18,
            distance: 13.5,
            unit: 130,
            perspective: true,
            fog: 0.14,
            focus: [0, 0, 0],
        }).at(230, 15).opacity(a)

        const halfH = 1.65 + 1.55 * st
        const baseR = 1.65 - 1.08 * st // Radius narrows dramatically as tube stretches!
        const turns = 2.6 + 3.8 * st   // Spin rate accelerates as tube thins!

        // Central vortex spine axis
        view.add(
            line3d([0, 0, -halfH], [0, 0, halfH], { color: '#ffd166', width: 4.2, glow: 10, opacity: 0.95 }),
            point3d([0, 0, halfH], { color: '#ffffff', radius: 6, halo: 0 }),
            point3d([0, 0, -halfH], { color: '#ffffff', radius: 6, halo: 0 }),
        )

        // 5 helical glowing fluid filaments wrapping tightly around the stretching vortex tube
        const strandCols = ['#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'] as const
        for (let k = 0; k < 5; k++) {
            const offset = (2 * Math.PI * k) / 5 + sp * (1.2 + 2.2 * st)
            const col = st > 0.65 && k >= 3 ? '#ffd166' : strandCols[k]!
            view.add(
                curve3d(
                    (u): Vec3 => {
                        const z = -halfH + 2 * halfH * u
                        // Pinch slightly tighter at the waist (u = 0.5)
                        const waist = 1 - 0.32 * st * Math.exp(-Math.pow((u - 0.5) / 0.25, 2))
                        const r = baseR * waist
                        const ang = offset + turns * 2 * Math.PI * u
                        return [r * Math.cos(ang), r * Math.sin(ang), z]
                    },
                    0,
                    1,
                    { color: col, width: 3.6 + 1.2 * st, glow: 9, samples: 68, opacity: 0.92 },
                ),
            )
        }

        // Cross-section glowing rings at top, waist, and bottom
        for (const zu of [0.12, 0.5, 0.88]) {
            const z = -halfH + 2 * halfH * zu
            const waist = 1 - 0.32 * st * Math.exp(-Math.pow((zu - 0.5) / 0.25, 2))
            const r = baseR * waist
            view.add(
                curve3d(
                    (u): Vec3 => [r * Math.cos(2 * Math.PI * u), r * Math.sin(2 * Math.PI * u), z],
                    0,
                    1,
                    { color: zu === 0.5 ? '#ffd166' : '#5ce1e6', width: 2.2, opacity: 0.65, samples: 36 },
                ),
            )
        }

        const spinMult = (1 + 5.8 * st * st).toFixed(1)
        const aura = circle(440, {
            fill: radialGradient([0, 0], 440, [
                [0, st > 0.5 ? '#ffd16628' : '#5ce1e61e'],
                [0.55, '#ff6b8b14'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(230, 15).opacity(a)

        return group(
            aura,
            view,
            txt(`Spin rate: ${spinMult}×`, -840, -145, 52, st > 0.55 ? '#ffd166' : '#5ce1e6', 'mono', 'left')
                .glow(8, st > 0.55 ? '#ffd166' : '#38bdf8')
                .opacity(a),
            txt(`Tube radius: ${(1 - 0.65 * st).toFixed(2)} r₀`, -840, -68, 30, '#cbd5e8', 'mono', 'left').opacity(a),
        )
    })

    s.add(live2D, copy2D)
    c.at(0.05, () => {
        s.play(pairProg.to(1.0, { duration: 12.0, ease: linear }))
    })

    c.on('Step into three dimensions', () => {
        s.play(show2D.to(0, { duration: 0.3 }), show3D.to(1, { duration: 0.35 }))
    })
    c.on('Step into three dimensions', () => {
        s.play(spin3D.to(5.2, { duration: 13.5, ease: linear }))
    })
    c.swap('Step into three dimensions', copy2D, copy3D)
    c.on('thinner along its axis', () => {
        s.play(stretch.to(1.0, { duration: 5.5 }))
    })
    s.add(live3DTube)
}

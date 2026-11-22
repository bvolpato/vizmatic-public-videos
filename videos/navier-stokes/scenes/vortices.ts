import {
    Node, circle, contourPaths, curve3d, dot, dynamic, group, line, line3d, linear, linearGradient,
    point3d, points3d, polyPath, radialGradient, scalarField, scene3d, tex, vector3d,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { coRotatingPair, samplePairHistory, vortexVorticity } from '../math'
import { txt } from '../../../factory/style'

const CX = 240
const CY = 10
const SCALE = 162

const RIBBON_COLS = [
    '#38bdf8', '#5ce1e6', '#60a5fa', '#a78bfa', '#ffd166',
    '#ff6b8b', '#a78bfa', '#5ce1e6', '#38bdf8',
] as const

// Precompute canonical t = 0 co-rotating pair vorticity contours (exact rigid rotation for any t!)
const BASE_VORTICES = coRotatingPair(0)
const VORT_CONTOURS = contourPaths(
    (x, y) => vortexVorticity(x, y, BASE_VORTICES, 0),
    {
        x: [-2.8, 2.8],
        y: [-2.4, 2.4],
        levels: [0.35, 0.9, 1.8, 3.2, 4.6],
        resolution: [56, 48],
    },
)

function pairVortField(x: number, y: number, cosA: number, sinA: number): number {
    // Un-rotate query point (x, y) by -angle to sample canonical pair at t = 0
    const rx = x * cosA + y * sinA
    const ry = -x * sinA + y * cosA
    const r2 = (x * x) / (2.8 * 2.8) + (y * y) / (2.4 * 2.4)
    if (r2 >= 1) return 0
    const fade = Math.pow(1 - r2, 1.35)
    return vortexVorticity(rx, ry, BASE_VORTICES, 0) * fade
}

// Left-column bounded max |omega(t)| sparkline geometry (fills middle-left void cleanly!)
const SPK_X0 = -840
const SPK_X1 = -355
const SPK_BASE_Y = 236
const SPK_TOP_Y = 102
const SPK_PTS: Vec[] = Array.from({ length: 64 }, (_, i) => {
    const u = i / 63
    // Viscous 2D bound: max |omega(t)| <= |omega_0| gently decays without ever blowing up!
    const val = 0.86 * Math.exp(-0.22 * u) + 0.02 * Math.sin(u * 12)
    return [SPK_X0 + u * (SPK_X1 - SPK_X0), SPK_BASE_Y - val * (SPK_BASE_Y - SPK_TOP_Y)] as Vec
})

// Deterministic 3D spiraling fluid particle seeds converging into the narrowing vortex waist
const PARTICLE_SEEDS = Array.from({ length: 72 }, (_, i) => ({
    u0: (i + 0.5) / 72,
    ang0: i * 2.39996, // golden angle spiral distribution
    radialLayer: 0.72 + (i % 4) * 0.2,
    speed: 0.7 + (i % 5) * 0.14,
}))

export const vortices: SceneFunction = (s, c) => {
    const pairProg = s.value(0.06)
    const show2D = s.value(1)
    const show3D = s.value(0)
    const stretch = s.value(0)
    const spin3D = s.value(0)

    const copy2D = group(
        txt('2D Vortex Advection', -840, -405, 56, '#f8f4ec', 'serif', 'left'),
        txt('Incompressible  ·  ∇·u = 0', -840, -330, 30, '#5ce1e6', 'mono', 'left'),
        txt('Computed via RK4 Biot-Savart flow', -840, -264, 26, '#9eb0d0', 'sans', 'left'),
        // Exact 2D vorticity transport equation in the middle-left column
        tex(String.raw`\frac{D\omega}{Dt} = \nu\,\Delta\omega`, { size: 44, color: '#ffd166' }).at(-655, -110).glow(7, '#ffd166'),
        txt('No stretching term in 2D', -840, -30, 26, '#cbd5e8', 'sans', 'left'),
        // Bounded max |omega(t)| sparkline frame
        txt('max |ω(t)|  ≤  |ω₀|', SPK_X0, 56, 26, '#5ce1e6', 'mono', 'left'),
        line([SPK_X0, SPK_BASE_Y], [SPK_X1, SPK_BASE_Y], { stroke: '#2c3959', width: 2 }),
        line([SPK_X0, SPK_BASE_Y], [SPK_X0, SPK_TOP_Y - 12], { stroke: '#2c3959', width: 2 }),
        line([SPK_X0, SPK_TOP_Y + 10], [SPK_X1, SPK_TOP_Y + 10], { stroke: '#ffd166', width: 1.6, dash: [6, 7] }).opacity(0.65),
        txt('ceiling |ω₀|', SPK_X1, SPK_TOP_Y - 16, 26, '#ffd166', 'mono', 'right'),
        txt('Vorticity stays bounded forever', -840, 355, 30, '#ffd166', 'sans', 'left'),
    )

    // Subtle live vorticity scalarField behind the 2D RK4 vortex pair
    const vort2DField = scalarField(
        (x, y) => {
            if (show2D.value < 0.02) return 0
            const snap = samplePairHistory(pairProg.value)
            const v0 = snap.vortices[0]!
            const r = Math.hypot(v0.x, v0.y) || 1
            const cosA = v0.x / r
            const sinA = v0.y / r
            return pairVortField(x, y, cosA, sinA) * show2D.value
        },
        {
            x: [-2.8, 2.8],
            y: [-2.4, 2.4],
            domain: [0, 5.4],
            colors: ['#07091000', '#1d346b55', '#4c2f8a78', '#ff4d8d8c', '#ffd166aa'],
            width: 5.6 * SCALE,
            height: 4.8 * SCALE,
            resolution: [84, 72],
        },
    ).at(CX, CY).set('blend', 'screen').opacity(0.66)

    const sparkGrad = linearGradient([SPK_X0, SPK_TOP_Y], [SPK_X1, SPK_BASE_Y], ['#ffd166', '#5ce1e6'])

    const live2D = dynamic(() => {
        if (show2D.value < 0.02) return []
        const a = show2D.value
        const prog = pairProg.value
        const snap = samplePairHistory(prog)
        const v0 = snap.vortices[0]!
        const r = Math.hypot(v0.x, v0.y) || 1
        const cosA = v0.x / r
        const sinA = v0.y / r

        const nodes: Node[] = [
            circle(500, {
                fill: radialGradient([0, 0], 500, [
                    [0, '#4c2f8a2c'],
                    [0.55, '#5ce1e616'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).set('blend', 'screen').opacity(a),
            line([CX - 430, CY], [CX + 430, CY], { stroke: '#222d4a', width: 1.3 }).opacity(a),
            line([CX, CY - 370], [CX, CY + 370], { stroke: '#222d4a', width: 1.3 }).opacity(a),
        ]

        // Rotated exact vorticity contourPaths isolines behind the RK4 yin-yang filaments
        for (let li = 0; li < VORT_CONTOURS.length; li++) {
            const lvl = VORT_CONTOURS[li]!
            const col = li >= 3 ? '#ffd166' : li >= 1 ? '#ff6b8b' : '#5ce1e6'
            for (const poly of lvl.paths) {
                if (poly.length < 2) continue
                const pts: Vec[] = poly.map(([x, y]) => {
                    const wx = x * cosA - y * sinA
                    const wy = x * sinA + y * cosA
                    return [CX + wx * SCALE, CY - wy * SCALE] as Vec
                })
                nodes.push(new Node(polyPath(pts)).stroke(col, 1.4, (0.2 + li * 0.05) * a).set('blend', 'screen'))
            }
        }

        // Live bounded max |omega(t)| sparkline progress on left
        const spCount = Math.max(2, Math.floor(Math.max(0.08, prog) * SPK_PTS.length))
        const spSub = SPK_PTS.slice(0, spCount)
        const spTip = spSub[spSub.length - 1]!
        nodes.push(
            new Node(polyPath(spSub)).stroke(sparkGrad, 3.6, 0.94 * a).glow(8, '#5ce1e6').set('blend', 'screen'),
            dot(6, '#ffffff').at(spTip[0], spTip[1]).glow(12, '#ffd166').set('blend', 'screen').opacity(a),
        )

        // Render all 9 RK4-advected glowing fluid ribbons + gossamer secondary glow layer!
        for (let rIdx = 0; rIdx < snap.ribbons.length; rIdx++) {
            const rib = snap.ribbons[rIdx]!
            const pts: Vec[] = rib.map(([px, py]) => [CX + px * SCALE, CY - py * SCALE] as Vec)
            const col = RIBBON_COLS[rIdx]!
            const isHero = rIdx === 4 || rIdx === 5
            nodes.push(
                new Node(polyPath(pts))
                    .stroke(col, isHero ? 4.4 : 2.8, (isHero ? 0.96 : 0.78) * a)
                    .glow(isHero ? 11 : 7, col)
                    .set('blend', 'screen'),
            )
            if (isHero) {
                nodes.push(new Node(polyPath(pts)).stroke('#ffffff', 1.2, 0.38 * a))
            }
        }

        // Orbiting glowing Lamb-Oseen vortex cores
        for (const vt of snap.vortices) {
            const vx = CX + vt.x * SCALE
            const vy = CY - vt.y * SCALE
            nodes.push(
                circle(52, {
                    fill: radialGradient([0, 0], 52, [
                        [0, '#ffd16688'],
                        [0.5, '#ff6b8b34'],
                        [1, '#ffd16600'],
                    ]),
                    stroke: null,
                }).at(vx, vy).set('blend', 'screen').opacity(a),
                circle(19, { fill: null, stroke: '#ffd166', width: 2.6 }).at(vx, vy).opacity(0.95 * a).glow(10, '#ffd166').set('blend', 'screen'),
                dot(7, '#ffffff').at(vx, vy).glow(16, '#ffd166').set('blend', 'screen').opacity(a),
            )
        }
        return group(...nodes)
    })

    const copy3D = group(
        txt('3D Vortex Stretching', -840, -405, 56, '#ffd166', 'serif', 'left').glow(6, '#ffd166'),
        txt('Thinner tube  →  faster spin', -840, -330, 30, '#ff6b8b', 'mono', 'left'),
        // Highlighted 3D vortex stretching term in middle-left column!
        tex(String.raw`\frac{D\omega}{Dt} = (\omega\cdot\nabla)\mathbf{u} + \nu\Delta\omega`, {
            size: 36,
            color: '#ffd166',
        }).at(-585, 118).glow(8, '#ffd166'),
        txt('3D stretching term  (ω · ∇)u', -840, 198, 26, '#ff6b8b', 'mono', 'left'),
        txt('Angular momentum concentrates energy', -840, 355, 28, '#cbd5e8', 'sans', 'left'),
    )

    // Volumetric glowing multi-strand animated 3D vortex stretching bundle + axial strain vectors + spiraling particles!
    const live3DTube = dynamic((time) => {
        if (show3D.value < 0.02) return []
        const a = show3D.value
        const st = stretch.value
        const sp = spin3D.value

        const view = scene3d({
            theta: -0.62 + sp * 0.22,
            phi: 1.16,
            distance: 15.6,
            unit: 118,
            perspective: true,
            fog: 0.12,
            focus: [0, 0, 0],
        }).at(245, 10).opacity(a)

        const halfH = 1.48 + 1.05 * st
        const baseR = 1.62 - 0.96 * st
        const turns = 2.6 + 3.6 * st

        // Central luminous vortex spine + glowing axial stretching strain arrows pulling both poles!
        view.add(
            line3d([0, 0, -halfH], [0, 0, halfH], { color: '#ffd166', width: 5.0, glow: 14, blend: 'screen', opacity: 0.98 }),
            vector3d([0, 0, halfH + 0.08], [0, 0, halfH + 0.88 + 0.22 * st], {
                color: '#ff6b8b',
                width: 4.4,
                glow: 10,
                blend: 'screen',
                tip: 16,
                halo: false,
            }),
            vector3d([0, 0, -halfH - 0.08], [0, 0, -halfH - 0.88 - 0.22 * st], {
                color: '#ff6b8b',
                width: 4.4,
                glow: 10,
                blend: 'screen',
                tip: 16,
                halo: false,
            }),
            point3d([0, 0, halfH], { color: '#ffffff', radius: 6.5, glow: 14, blend: 'screen', halo: 0 }),
            point3d([0, 0, -halfH], { color: '#ffffff', radius: 6.5, glow: 14, blend: 'screen', halo: 0 }),
        )

        // Radial inward strain arrows squeezing the narrowing waist!
        const waistR = baseR * (1 - 0.34 * st)
        for (let ai = 0; ai < 4; ai++) {
            const ang = (Math.PI * 0.5) * ai + sp * 0.35
            const rOuter = waistR + 1.18
            const rInner = waistR + 0.24
            view.add(
                vector3d(
                    [rOuter * Math.cos(ang), rOuter * Math.sin(ang), 0],
                    [rInner * Math.cos(ang), rInner * Math.sin(ang), 0],
                    { color: '#5ce1e6', width: 3.0, glow: 10, blend: 'screen', tip: 12, halo: false, opacity: 0.85 },
                ),
            )
        }

        // Volumetric 9-strand multi-layer animated helical filament bundle (inner plasma core + mid + outer sheath!)
        const strandCols = ['#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166', '#5ce1e6', '#ff6b8b', '#ffd166', '#ffffff'] as const
        for (let k = 0; k < 9; k++) {
            const layerScale = k < 3 ? 0.42 : k < 6 ? 0.78 : 1.06
            const offset = (2 * Math.PI * k) / 9 + sp * (1.3 + 2.4 * st)
            const col = k < 3 ? '#ffd166' : strandCols[k]!
            view.add(
                curve3d(
                    (u, tNow): Vec3 => {
                        const z = -halfH + 2 * halfH * u
                        const waist = 1 - 0.34 * st * Math.exp(-Math.pow((u - 0.5) / 0.26, 2))
                        const r = baseR * layerScale * waist
                        const ang = offset + turns * 2 * Math.PI * u + tNow * 0.15
                        return [r * Math.cos(ang), r * Math.sin(ang), z]
                    },
                    0,
                    1,
                    {
                        color: col,
                        width: k < 3 ? 4.0 + 1.0 * st : 2.8 + 0.8 * st,
                        glow: 8,
                        blend: 'screen',
                        animate: true,
                        samples: 180,
                        opacity: k < 3 ? 0.94 : 0.74,
                    },
                ),
            )
        }

        // Cross-section glowing vortex rings at top, waist, and bottom
        for (const zu of [0.1, 0.5, 0.9]) {
            const z = -halfH + 2 * halfH * zu
            const waist = 1 - 0.34 * st * Math.exp(-Math.pow((zu - 0.5) / 0.26, 2))
            const r = baseR * 1.06 * waist
            view.add(
                curve3d(
                    (u): Vec3 => [r * Math.cos(2 * Math.PI * u), r * Math.sin(2 * Math.PI * u), z],
                    0,
                    1,
                    {
                        color: zu === 0.5 ? '#ffd166' : '#5ce1e6',
                        width: zu === 0.5 ? 2.8 : 2.0,
                        glow: 8,
                        blend: 'screen',
                        opacity: zu === 0.5 ? 0.85 : 0.58,
                        samples: 40,
                    },
                ),
            )
        }

        // Spiraling 3D fluid particles converging into the narrowing waist!
        const pts3: Vec3[] = PARTICLE_SEEDS.map((p) => {
            const u = (p.u0 + sp * 0.14 * p.speed) % 1
            const z = -halfH * 0.95 + 1.9 * halfH * u
            const waist = 1 - 0.36 * st * Math.exp(-Math.pow((u - 0.5) / 0.26, 2))
            const r = baseR * p.radialLayer * waist
            const ang = p.ang0 + sp * (1.8 + 3.0 * st) * p.speed + u * turns * Math.PI * 1.5 + time * 0.05
            return [r * Math.cos(ang), r * Math.sin(ang), z] as Vec3
        })
        view.add(
            points3d(pts3, {
                colorAt: (idx) => (idx % 3 === 0 ? '#ffd166' : idx % 3 === 1 ? '#5ce1e6' : '#ff6b8b'),
                radius: 3.6 + 1.0 * st,
                glow: 10,
                blend: 'screen',
                opacity: 0.92,
                halo: 0,
            }),
        )

        const radFrac = 1 - 0.65 * st
        const spinMult = (1 / (radFrac * radFrac)).toFixed(1)
        const aura = circle(480, {
            fill: radialGradient([0, 0], 480, [
                [0, st > 0.5 ? '#ffd16634' : '#5ce1e626'],
                [0.52, '#ff6b8b1c'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(245, 10).set('blend', 'screen').opacity(a)

        return group(
            aura,
            view,
            txt(`Spin rate: ${spinMult}×`, -840, -172, 52, st > 0.55 ? '#ffd166' : '#5ce1e6', 'mono', 'left')
                .glow(8, st > 0.55 ? '#ffd166' : '#38bdf8')
                .opacity(a),
            txt(`Tube radius: ${radFrac.toFixed(2)} r₀`, -840, -96, 30, '#cbd5e8', 'mono', 'left').opacity(a),
        )
    })

    s.add(vort2DField, live2D, copy2D)
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

import {
    circle, curve3d, gridPlane3d, group, line3d, linear, parametricSurface, point3d, points3d,
    radialGradient, scene3d, type IntroFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

// Theatrical One-Sheet: Monumental Upper-Center 3D Borrow-Checker Prism + Bottom-Center Editorial Title (zero overlap!)
export const poster: IntroFunction = (stage, clock) => {
    const cx = 0
    const cy = -196
    const phase = stage.value(0)

    const aura = circle(560, {
        fill: radialGradient([0, 0], 560, [
            [0, '#ffd16638'],
            [0.42, '#fb923c24'],
            [0.72, '#5ce1e616'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(cx, cy).set('blend', 'screen')

    const view3d = scene3d({
        theta: -0.62,
        phi: 1.08,
        distance: 14.6,
        unit: 108,
        perspective: true,
        ambient: 0.45,
        shine: 0.42,
        brightness: 1.16,
        fog: 0.07,
        focus: [0, 0, 0.1],
    }).at(cx, cy)

    view3d.add(
        gridPlane3d({ x: [-3.8, 3.8], y: [-2.4, 2.4], z: -2.05, step: 0.95, color: '#243252', width: 1.1, opacity: 0.38 }),
    )

    const hexR = 1.65
    const hexHalfT = 0.16
    const hexVerts = (r: number, xVal: number): Vec3[] =>
        Array.from({ length: 6 }, (_, i) => {
            const a = (i * Math.PI) / 3 + Math.PI / 6
            return [xVal, Math.cos(a) * r, Math.sin(a) * r] as Vec3
        })

    const frontHex = hexVerts(hexR, -hexHalfT)
    const backHex = hexVerts(hexR, hexHalfT)
    const innerHex = hexVerts(hexR * 0.64, 0)

    for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6
        const f0 = frontHex[i]!
        const f1 = frontHex[j]!
        const b0 = backHex[i]!
        const b1 = backHex[j]!
        const n0 = innerHex[i]!
        const n1 = innerHex[j]!

        view3d.add(
            parametricSurface(
                (u, v): Vec3 => [
                    (1 - v) * ((1 - u) * f0[0] + u * f1[0]) + v * ((1 - u) * b0[0] + u * b1[0]),
                    (1 - v) * ((1 - u) * f0[1] + u * f1[1]) + v * ((1 - u) * b0[1] + u * b1[1]),
                    (1 - v) * ((1 - u) * f0[2] + u * f1[2]) + v * ((1 - u) * b0[2] + u * b1[2]),
                ],
                [0, 1],
                [0, 1],
                { resolution: [1, 1], color: COSMOS.gold, opacity: 0.28, mesh: false, shaded: true },
            ),
            parametricSurface(
                (u, v): Vec3 => [
                    0,
                    (1 - v) * ((1 - u) * n0[1] + u * n1[1]),
                    (1 - v) * ((1 - u) * n0[2] + u * n1[2]),
                ],
                [0, 1],
                [0, 1],
                { resolution: [1, 1], color: COSMOS.amber, opacity: 0.14, mesh: false, shaded: false },
            ),
            line3d(f0, f1, { color: COSMOS.gold, width: 3.6, glow: 10, blend: 'screen', opacity: 0.96 }),
            line3d(b0, b1, { color: COSMOS.amber, width: 2.8, glow: 8, blend: 'screen', opacity: 0.85 }),
            line3d(f0, b0, { color: '#fff4cc', width: 2.2, glow: 6, blend: 'screen', opacity: 0.9 }),
            line3d(n0, n1, { color: COSMOS.cyan, width: 2.2, glow: 7, blend: 'screen', opacity: 0.78 }),
        )
    }

    const strands: readonly { col: string; off: number; rOut: number; rGate: number; w: number }[] = [
        { col: COSMOS.cyan, off: 0, rOut: 1.08, rGate: 0.42, w: 4.6 },
        { col: COSMOS.amber, off: Math.PI * 0.5, rOut: 1.08, rGate: 0.42, w: 4.6 },
        { col: COSMOS.emerald, off: Math.PI, rOut: 1.0, rGate: 0.38, w: 4.2 },
        { col: COSMOS.violet, off: Math.PI * 1.5, rOut: 1.0, rGate: 0.38, w: 4.2 },
    ]

    const strandPos = (sIdx: number, t: number, ph: number): Vec3 => {
        const st = strands[sIdx]!
        const x = -3.1 + t * 6.2
        const pinch = Math.exp(-x * x * 0.85)
        const r = st.rOut * (1 - pinch) + st.rGate * pinch
        const ang = t * Math.PI * 3.1 + st.off + ph * 1.6
        return [x, Math.cos(ang) * r, Math.sin(ang) * r]
    }

    for (let i = 0; i < strands.length; i++) {
        const st = strands[i]!
        view3d.add(
            curve3d(
                (t) => strandPos(i, t, phase.value),
                0,
                1,
                { color: st.col, width: st.w, glow: 10, blend: 'screen', samples: 76, animate: true, opacity: 0.96 },
            ),
            point3d(
                () => strandPos(i, (0.22 + i * 0.21 + phase.value * 0.42) % 1, phase.value),
                { color: '#ffffff', radius: 7.8, glow: 14, blend: 'screen', onTop: true },
            ),
            point3d(
                () => strandPos(i, (0.68 + i * 0.19 + phase.value * 0.42) % 1, phase.value),
                { color: st.col, radius: 6.4, glow: 12, blend: 'screen', onTop: true },
            ),
        )
    }

    view3d.add(
        points3d(
            () =>
                Array.from({ length: 18 }, (_, k) => {
                    const a = (k / 18) * Math.PI * 2 + phase.value * 0.8
                    return [Math.sin(a * 2) * 0.25, Math.cos(a) * 2.25, Math.sin(a) * 2.25] as Vec3
                }),
            { color: COSMOS.gold, radius: 3.8, glow: 8, blend: 'screen', opacity: 0.85 },
        ),
    )

    // Clean Bottom-Center Editorial Typography with breathing room below the 3D ribbons
    const bottomCopy = group(
        txt('RUST  /  FEARLESS CONCURRENCY', 0, 198, 26, COSMOS.amber, 'mono', 'center').glow(5, COSMOS.amber),
        txt('Rust Concurrency', 0, 286, 108, COSMOS.ink, 'serif', 'center').glow(8, COSMOS.amber),
        txt('Ownership Across Time', 0, 370, 48, COSMOS.cyan, 'serif', 'center').glow(8, COSMOS.cyan),
        txt('Send & Sync  ·  thread::scope  ·  48-byte Futures  ·  Tokio', 0, 434, 28, COSMOS.muted, 'sans', 'center'),
    )

    stage.add(aura, view3d, bottomCopy)

    const dur = Math.max(0.45, clock.intro - 0.04)
    stage.at(0.01, () => {
        stage.play(
            phase.to(1.2, { duration: dur, ease: linear }),
            view3d.orbit({ theta: -0.25, phi: 0.98 }, { duration: dur }),
        )
    })
}

import {
    Node, curve3d, dynamic, gridPlane3d, group, line3d,
    parametricSurface, point3d, points3d, rect, scene3d, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

// Exact 32-bit signed binary-search domain: 0 <= low <= high < 2^31.
// Normalized l = low / 2^31, h = high / 2^31 in [0, 1].
const SPAN = 4.6
const toXY = (l: number, h: number): [number, number] => [(l - 0.5) * SPAN, (h - 0.5) * SPAN]

const safeHeight = (l: number, h: number) => 1.42 * (l + h)
const overflowHeight = (l: number, h: number) => -1.38 + 0.9 * (l + h - 1)

// Exact Z3 counterexample: low = high = 1.5e9 -> low + high = 3.0e9 -> wraps to -1,294,967,296!
const CE_L = 1_500_000_000 / 2_147_483_648
const CE_H = CE_L
const [CE_X, CE_Y] = toXY(CE_L, CE_H)
const CE_Z = overflowHeight(CE_L, CE_H)

// 150 deterministic emerald unit-test samples clustered near the safe origin corner
const UNIT_TEST_DOTS: Vec3[] = Array.from({ length: 150 }, (_, i) => {
    const r1 = Math.sin(i * 127.1 + 3.1) * 43758.5453
    const r2 = Math.sin(i * 269.5 + 7.7) * 19642.349
    const u = r1 - Math.floor(r1)
    const v = r2 - Math.floor(r2)
    const rad = Math.pow(u, 1.8) * 0.22
    const l = rad * v * 0.92
    const h = Math.min(0.24, l + rad * (1 - v * 0.85) + 0.008)
    const [wx, wy] = toXY(l, h)
    return [wx, wy, safeHeight(l, h) + 0.045] as Vec3
})

const HERO_X = -325
const HERO_Y = 44

export const hook: SceneFunction = (s, c) => {
    const revealBug = s.value(0)
    const pulsePhase = s.value(0)

    // ── Right-aligned cinema typography (de-boxed, floating cleanly in deep space) ──
    const rightCopy = group(
        txt('PROOFS FOR REAL SYSTEMS  ·  EP 1 / 3', 855, -360, 26, COSMOS.violet, 'mono', 'right'),
        txt('50% FAIL', 855, -264, 78, COSMOS.rose, 'mono', 'right').glow(10, COSMOS.rose),
        txt('Why Tests', 860, -142, 102, COSMOS.ink, 'serif', 'right').glow(6, COSMOS.violet),
        txt('Miss the Bug', 860, -34, 102, COSMOS.rose, 'serif', 'right').glow(9, COSMOS.rose),
        txt('mid = (low + high) / 2', 855, 62, 30, COSMOS.gold, 'mono', 'right').glow(5, COSMOS.gold),
    )

    // Clean floating TeX equation (zero dashboard rectangle!)
    const mathCallout = tex(String.raw`\text{overflow} \iff \text{low} + \text{high} \ge 2^{31}`, {
        size: 32,
        color: COSMOS.rose,
    })
        .at(575, 146)
        .glow(7, COSMOS.rose)

    // Minimal floating 32-bit sign-bit flip readout (zero outer box chrome!)
    const signBitStrip = dynamic(() => {
        const b = revealBug.value
        const p = pulsePhase.value
        const op = 0.28 + 0.72 * b
        const signCol = b > 0.4 ? COSMOS.rose : COSMOS.emerald
        const nodes: Node[] = [
            txt(
                b > 0.4 ? 'Z3 COUNTEREXAMPLE · (1.5e9, 1.5e9)' : 'INT32 SIGN BIT · SAFE ORIGIN',
                855,
                238,
                26,
                COSMOS.gold,
                'mono',
                'right',
            ).opacity(op),
            rect(52, 46, { fill: b > 0.4 ? '#3a0d1c' : '#0f2d28', stroke: signCol, width: 3, radius: 10 })
                .at(325, 298)
                .glow(b > 0.4 ? 12 + Math.sin(p * 4) * 3 : 5, signCol)
                .opacity(op),
            txt(b > 0.4 ? '1' : '0', 325, 298, 30, signCol, 'mono').opacity(op),
            txt(
                b > 0.4 ? '011 0010 ... -> -1,294,967,296' : '010 1100 ... -> positive index',
                855,
                298,
                26,
                b > 0.4 ? COSMOS.rose : COSMOS.muted,
                'mono',
                'right',
            )
                .glow(b > 0.4 ? 6 : 0, COSMOS.rose)
                .opacity(op),
            txt(
                b > 0.4 ? 'Bit 31 flips 0 -> 1  (negative index!)' : 'Bit 31 = 0  (positive safe corner)',
                855,
                356,
                26,
                b > 0.4 ? COSMOS.rose : COSMOS.emerald,
                'sans',
                'right',
            ).opacity(op),
        ]
        return group(...nodes)
    })

    // ── Monumental Left Orbiting 3D Overflow Cliff (scene3d) ─────────────────
    const view = scene3d({
        theta: -0.78,
        phi: 1.02,
        distance: 13.4,
        unit: 148,
        perspective: true,
        ambient: 0.42,
        shine: 0.36,
        brightness: 1.12,
        fog: 0.07,
        focus: [0, 0.05, 0.05],
    }).at(HERO_X, HERO_Y)

    const floorGrid = gridPlane3d({
        x: [-2.55, 2.55],
        y: [-2.55, 2.55],
        z: -1.48,
        step: 0.5,
        color: '#263556',
        width: 1.1,
        opacity: 0.42,
    })

    const safeRamp = parametricSurface(
        (u, v): Vec3 => {
            const l = 0.5 * u * v
            const h = u - l
            const [wx, wy] = toXY(l, h)
            return [wx, wy, safeHeight(l, h)]
        },
        [0, 1],
        [0, 1],
        {
            resolution: [32, 32],
            colors: ['#0a2524', '#0e5b53', '#1ca88f', '#5ce1e6', '#6ee7b7'],
            mesh: '#6ee7b7',
            meshOpacity: 0.24,
            meshWidth: 0.75,
            opacity: 0.92,
        },
    )

    const overflowAbyss = parametricSurface(
        (u, v): Vec3 => {
            const l = u + v * 0.5 * (1 - u)
            const h = 1 + u - l
            const [wx, wy] = toXY(l, h)
            return [wx, wy, overflowHeight(l, h)]
        },
        [0, 1],
        [0, 1],
        {
            resolution: [32, 32],
            colors: ['#7a0e2c', '#c81748', '#ff3b6b', '#ff7aa2'],
            mesh: '#ff9cb5',
            meshOpacity: 0.32,
            meshWidth: 0.85,
            opacity: 0.94,
        },
    )

    const cliffWall = parametricSurface(
        (u, v): Vec3 => {
            const l = 0.5 * u
            const h = 1 - l
            const [wx, wy] = toXY(l, h)
            const z = -1.38 + v * (1.42 - -1.38)
            return [wx, wy, z]
        },
        [0, 1],
        [0, 1],
        {
            resolution: [20, 8],
            colors: ['#ff2e63', '#ff6b8b', '#ffd166'],
            mesh: '#ff6b8b',
            meshOpacity: 0.3,
            meshWidth: 0.75,
            opacity: 0.44,
            shaded: false,
        },
    )

    const [F0X, F0Y] = toXY(0, 1)
    const [F1X, F1Y] = toXY(0.5, 0.5)
    const faultTop = line3d([F0X, F0Y, 1.44], [F1X, F1Y, 1.44], {
        color: COSMOS.rose,
        width: 5.8,
        glow: 14,
        blend: 'screen',
        bias: 0.08,
        opacity: 0.98,
    })

    const faultBottom = line3d([F0X, F0Y, -1.36], [F1X, F1Y, -1.36], {
        color: '#ff2e63',
        width: 4.2,
        glow: 11,
        blend: 'screen',
        bias: 0.06,
        opacity: 0.92,
    })

    const [O0X, O0Y] = toXY(0, 0)
    const [O1X, O1Y] = toXY(1, 1)
    const domainEdges = [
        line3d([O0X, O0Y, 0.02], [F0X, F0Y, 1.42], { color: COSMOS.emerald, width: 2.6, glow: 6, blend: 'screen', opacity: 0.85 }),
        line3d([O0X, O0Y, 0.02], [F1X, F1Y, 1.42], { color: COSMOS.cyan, width: 2.6, glow: 6, blend: 'screen', opacity: 0.85 }),
        line3d([F0X, F0Y, -1.38], [O1X, O1Y, -0.48], { color: COSMOS.rose, width: 2.8, glow: 8, blend: 'screen', opacity: 0.88 }),
        line3d([F1X, F1Y, -1.38], [O1X, O1Y, -0.48], { color: COSMOS.rose, width: 2.8, glow: 8, blend: 'screen', opacity: 0.88 }),
    ]

    const testCloud = points3d(UNIT_TEST_DOTS, {
        color: COSMOS.emerald,
        radius: 3.6,
        glow: 7,
        blend: 'screen',
        bias: 0.08,
        opacity: 0.95,
    })

    view.add(
        floorGrid,
        safeRamp,
        overflowAbyss,
        cliffWall,
        ...domainEdges,
        faultBottom,
        faultTop,
        testCloud,
    )

    // Dynamic Golden Z3 Counterexample Beacon locked 1:1 to view's orbiting camera
    const liveBeacon = dynamic(() => {
        const b = revealBug.value
        if (b < 0.02) return []
        const p = pulsePhase.value
        const bv = scene3d({
            theta: view.theta.value,
            phi: view.phi.value,
            distance: 13.4,
            unit: 148,
            perspective: true,
            fog: 0.04,
            focus: [0, 0.05, 0.05],
        })
            .at(HERO_X, HERO_Y)
            .opacity(b)

        const r1 = 0.28 + 0.1 * Math.sin(p * 3.5)
        const r2 = 0.54 + 0.12 * Math.cos(p * 2.8)
        bv.add(
            curve3d(
                (u): Vec3 => [CE_X + r2 * Math.cos(u * Math.PI * 2), CE_Y + r2 * Math.sin(u * Math.PI * 2), CE_Z + 0.05],
                0,
                1,
                { color: COSMOS.rose, width: 3.0, glow: 10, blend: 'screen', samples: 36, opacity: 0.9 },
            ),
            curve3d(
                (u): Vec3 => [CE_X + r1 * Math.cos(u * Math.PI * 2), CE_Y + r1 * Math.sin(u * Math.PI * 2), CE_Z + 0.07],
                0,
                1,
                { color: COSMOS.gold, width: 4.4, glow: 14, blend: 'screen', samples: 36, onTop: true },
            ),
            line3d([CE_X, CE_Y, CE_Z], [CE_X, CE_Y, 2.15], {
                color: COSMOS.gold,
                width: 5.8,
                glow: 16,
                blend: 'screen',
                onTop: true,
            }),
            line3d([CE_X, CE_Y, CE_Z], [CE_X, CE_Y, 2.15], {
                color: '#ffffff',
                width: 1.8,
                onTop: true,
                opacity: 0.92,
            }),
            point3d([CE_X, CE_Y, CE_Z + 0.05], {
                color: '#ffffff',
                radius: 10,
                glow: 18,
                blend: 'screen',
                onTop: true,
            }),
            point3d([CE_X, CE_Y, 2.15], {
                color: COSMOS.gold,
                radius: 8.5,
                glow: 16,
                blend: 'screen',
                onTop: true,
            }),
        )
        return bv
    })

    // Perimeter annotations framing the left 3D cliff cleanly
    const leftLabels = dynamic(() => {
        const b = revealBug.value
        const nodes: Node[] = [
            nebula(HERO_X, HERO_Y, 540, b > 0.35 ? '#ff6b8b2a' : '#5ce1e61c', '#22184014'),
            txt('SAFE RAMP  (50%)', -855, -408, 26, COSMOS.emerald, 'mono', 'left').glow(6, COSMOS.emerald),
            txt('150 unit tests near (0, 0)', -855, 404, 26, COSMOS.emerald, 'mono', 'left'),
            txt('low + high = 2³¹ cliff', 140, 404, 26, COSMOS.rose, 'mono', 'right').opacity(0.45 + 0.55 * b),
        ]
        if (b > 0.05) {
            nodes.push(
                txt('OVERFLOW ABYSS  (50%)', 140, -424, 26, COSMOS.rose, 'mono', 'right').glow(8, COSMOS.rose).opacity(b),
                txt('Z3 BEACON · (1.5e9, 1.5e9)', 140, -380, 26, COSMOS.gold, 'mono', 'right').glow(8, COSMOS.gold).opacity(b),
            )
        }
        return group(...nodes)
    })

    s.add(leftLabels, view, liveBeacon, rightCopy, signBitStrip)

    c.at(0.05, () => {
        s.play(view.orbit({ theta: -0.44, phi: 0.94 }, { duration: 11.0 }))
    })
    c.at(0.05, () => {
        s.play(pulsePhase.to(12.0, { duration: 17.0 }))
    })
    c.show('thirty-two-bit pair', mathCallout)
    c.on('half of all valid', () => {
        s.play(
            revealBug.to(1, { duration: 1.1 }),
            view.orbit({ theta: -0.22, phi: 0.9 }, { duration: 2.2 }),
        )
    })
}

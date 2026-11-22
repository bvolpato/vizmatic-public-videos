import {
    Node, circle, dynamic, group, line3d, linear, parametricSurface, point3d, points3d,
    radialGradient, scene3d, surface, type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

interface HexCol {
    readonly cx: number
    readonly cy: number
    readonly dist: number
    readonly col: string
    readonly maxH: number
    readonly delay: number
}

// 64 translucent 3D hexagonal microVM columns arranged in an 8x8 honeycomb on the bare-metal host slab
const HEX_COLS: readonly HexCol[] = Array.from({ length: 64 }, (_, i) => {
    const r = Math.floor(i / 8)
    const c = i % 8
    const cx = (c - 3.5) * 0.92 + (r % 2 === 1 ? 0.44 : 0)
    const cy = (r - 3.5) * 0.82
    const dist = Math.hypot(cx, cy)
    const col = (r + c) % 7 === 0 ? COSMOS.gold : (r + c) % 5 === 0 ? COSMOS.emerald : COSMOS.cyan
    const maxH = 0.72 + ((i * 37) % 10) * 0.095
    const delay = Math.min(0.62, dist * 0.12)
    return { cx, cy, dist, col, maxH, delay }
})

export const hook: SceneFunction = (s, c) => {
    const ignite = s.value(0.32)
    const pulse = s.value(0)

    const aura = circle(560, {
        fill: radialGradient([0, 0], 560, [
            [0, '#5ce1e62a'],
            [0.45, '#ffd16618'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(365, -5)

    const view3d = scene3d({
        theta: -0.78,
        phi: 1.04,
        distance: 16.8,
        unit: 94,
        perspective: true,
        ambient: 0.44,
        shine: 0.38,
        brightness: 1.12,
        fog: 0.08,
        focus: [0.1, 0, 0.45],
    }).at(365, 5)

    // Glowing Host Kernel + KVM bare-metal baseplate slab at z = 0
    view3d.add(
        surface(
            (x, y, t) => -0.06 + Math.sin(Math.hypot(x, y) * 1.4 - t * 2.4) * 0.035,
            {
                x: [-4.2, 4.5],
                y: [-3.6, 3.6],
                resolution: [28, 24],
                colors: ['#0a1628', '#112947', '#19456b', '#22668d'],
                mesh: COSMOS.cyan,
                meshOpacity: 0.34,
                meshWidth: 0.8,
                opacity: 0.78,
                animate: true,
            },
        ),
        // Glowing KVM perimeter rail around the bare-metal host slab
        line3d([-4.2, -3.6, 0.02], [4.5, -3.6, 0.02], { color: COSMOS.gold, width: 3.4, glow: 10, blend: 'screen' }),
        line3d([4.5, -3.6, 0.02], [4.5, 3.6, 0.02], { color: COSMOS.gold, width: 3.4, glow: 10, blend: 'screen' }),
        line3d([4.5, 3.6, 0.02], [-4.2, 3.6, 0.02], { color: COSMOS.gold, width: 3.4, glow: 10, blend: 'screen' }),
        line3d([-4.2, 3.6, 0.02], [-4.2, -3.6, 0.02], { color: COSMOS.gold, width: 3.4, glow: 10, blend: 'screen' }),
        // Lower host-metal sub-chassis line
        line3d([-4.2, -3.6, -0.45], [4.5, -3.6, -0.45], { color: COSMOS.blue, width: 2.0, opacity: 0.65, blend: 'screen' }),
        line3d([4.5, -3.6, -0.45], [4.5, 3.6, -0.45], { color: COSMOS.blue, width: 2.0, opacity: 0.65, blend: 'screen' }),
        line3d([-4.2, -3.6, -0.45], [-4.2, -3.6, 0.02], { color: COSMOS.blue, width: 2.0, opacity: 0.65, blend: 'screen' }),
        line3d([4.5, -3.6, -0.45], [4.5, -3.6, 0.02], { color: COSMOS.blue, width: 2.0, opacity: 0.65, blend: 'screen' }),
        line3d([4.5, 3.6, -0.45], [4.5, 3.6, 0.02], { color: COSMOS.blue, width: 2.0, opacity: 0.65, blend: 'screen' }),
    )

    // 64 translucent 3D hexagonal microVM columns rising smoothly + ambient heartbeat ripple!
    const hexHeight = (hc: HexCol): number => {
        const u = Math.max(0, Math.min(1, (ignite.value - hc.delay) / 0.36))
        const eased = u * u * (3 - 2 * u)
        const ripple = 0.08 * Math.sin(pulse.value * 2.8 - hc.dist * 1.15)
        return Math.max(0.06, eased * hc.maxH + eased * ripple)
    }

    const rHex = 0.34
    for (let i = 0; i < HEX_COLS.length; i++) {
        const hc = HEX_COLS[i]!
        // Translucent 6-sided hexagonal prism barrel (reactive height!)
        view3d.add(
            parametricSurface(
                (u, v): Vec3 => {
                    const seg = Math.min(5, Math.floor(u * 6))
                    const frac = u * 6 - seg
                    const a0 = (seg * Math.PI) / 3
                    const a1 = ((seg + 1) * Math.PI) / 3
                    const x = hc.cx + (Math.cos(a0) * (1 - frac) + Math.cos(a1) * frac) * rHex
                    const y = hc.cy + (Math.sin(a0) * (1 - frac) + Math.sin(a1) * frac) * rHex
                    return [x, y, 0.02 + v * hexHeight(hc)]
                },
                [0, 1],
                [0, 1],
                {
                    resolution: [6, 1],
                    color: hc.col,
                    opacity: 0.42,
                    mesh: hc.col,
                    meshOpacity: 0.52,
                    meshWidth: 0.9,
                    shaded: true,
                    animate: true,
                },
            ),
            // Glowing vertical kernel beacon spine inside every microVM column
            line3d(
                () => [hc.cx, hc.cy, 0.04] as Vec3,
                () => [hc.cx, hc.cy, 0.06 + hexHeight(hc)] as Vec3,
                { color: hc.col, width: 2.0, glow: 6, blend: 'screen', opacity: 0.82 },
            ),
        )
    }

    // Glowing top-cap heartbeat sparks across all 64 active microVM columns
    view3d.add(
        points3d(
            () => HEX_COLS.map((hc): Vec3 => [hc.cx, hc.cy, 0.08 + hexHeight(hc)]),
            {
                colorAt: (idx) => HEX_COLS[idx]!.col,
                radius: 5.2,
                glow: 10,
                blend: 'screen',
                onTop: true,
            },
        ),
        point3d([0.1, 0, 1.85], { color: '#ffffff', radius: 4, glow: 12, blend: 'screen', opacity: 0.01 }),
    )

    const headline = group(
        txt('KVM  /  FIRECRACKER MICROVMS', -855, -295, 26, COSMOS.gold, 'mono', 'left'),
        txt('Sub-Second', -860, -178, 102, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.cyan),
        txt('Sandboxes', -860, -66, 102, COSMOS.cyan, 'serif', 'left').glow(8, COSMOS.cyan),
        txt('Dedicated Linux kernels on bare metal', -855, 52, 28, COSMOS.muted, 'sans', 'left'),
        txt('64 microVMs  ·  < 5 MiB RAM each', -855, 108, 26, COSMOS.emerald, 'mono', 'left'),
    )

    const liveTelemetry = dynamic(() => {
        const u = Math.min(1, ignite.value)
        const ms = Math.round(u * 125)
        const activeCount = Math.round(u * 64)
        const nodes: Node[] = [
            txt(`BOOT TELEMETRY  ${String(ms).padStart(3, '0')} ms  /  125 ms`, -855, 212, 28, u > 0.92 ? COSMOS.emerald : COSMOS.gold, 'mono', 'left')
                .glow(7, u > 0.92 ? COSMOS.emerald : COSMOS.gold),
            txt(`ACTIVE KERNELS  ${activeCount} / 64  (VMX + EPT)`, -855, 264, 26, COSMOS.cyan, 'mono', 'left'),
            txt('HOST KERNEL + KVM BASEPLATE', 365, -395, 26, COSMOS.gold, 'mono'),
        ]
        return group(...nodes)
    })

    s.add(aura, view3d, headline, liveTelemetry)

    const fullDur = Math.max(8, c.end - c.start - 0.15)
    c.at(0.04, () => {
        s.play(
            ignite.to(1, { duration: 2.9 }),
            pulse.to(fullDur * 1.1, { duration: fullDur, ease: linear }),
            view3d.orbit({ theta: 0.28, phi: 0.94 }, { duration: fullDur }),
        )
    })
}

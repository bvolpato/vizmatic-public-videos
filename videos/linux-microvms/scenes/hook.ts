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

// 64 translucent 3D hexagonal microVM towers arranged in an 8x8 honeycomb on the bare-metal host slab
const HEX_COLS: readonly HexCol[] = Array.from({ length: 64 }, (_, i) => {
    const r = Math.floor(i / 8)
    const c = i % 8
    const cx = (c - 3.5) * 0.92 + (r % 2 === 1 ? 0.44 : 0)
    const cy = (r - 3.5) * 0.82
    const dist = Math.hypot(cx, cy)
    const col = (r + c) % 7 === 0 ? COSMOS.gold : (r + c) % 5 === 0 ? COSMOS.emerald : COSMOS.cyan
    const maxH = 0.78 + ((i * 37) % 10) * 0.105
    const delay = Math.min(0.62, dist * 0.12)
    return { cx, cy, dist, col, maxH, delay }
})

export const hook: SceneFunction = (s, c) => {
    const ignite = s.value(0.32)
    const pulse = s.value(0)

    // Sweeping lower-right architectural 3D city framing + bold upper-left stat & title
    const aura = circle(660, {
        fill: radialGradient([0, 0], 660, [
            [0, '#5ce1e630'],
            [0.45, '#ffd1661c'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(305, 86).set('blend', 'screen')

    const view3d = scene3d({
        theta: -0.78,
        phi: 1.04,
        distance: 15.6,
        unit: 108,
        perspective: true,
        ambient: 0.44,
        shine: 0.4,
        brightness: 1.14,
        fog: 0.07,
        focus: [0.1, 0, 0.45],
    }).at(305, 92)

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
                meshOpacity: 0.36,
                meshWidth: 0.8,
                opacity: 0.8,
                animate: true,
            },
        ),
        line3d([-4.2, -3.6, 0.02], [4.5, -3.6, 0.02], { color: COSMOS.gold, width: 3.6, glow: 10, blend: 'screen' }),
        line3d([4.5, -3.6, 0.02], [4.5, 3.6, 0.02], { color: COSMOS.gold, width: 3.6, glow: 10, blend: 'screen' }),
        line3d([4.5, 3.6, 0.02], [-4.2, 3.6, 0.02], { color: COSMOS.gold, width: 3.6, glow: 10, blend: 'screen' }),
        line3d([-4.2, 3.6, 0.02], [-4.2, -3.6, 0.02], { color: COSMOS.gold, width: 3.6, glow: 10, blend: 'screen' }),
        line3d([-4.2, -3.6, -0.45], [4.5, -3.6, -0.45], { color: COSMOS.blue, width: 2.0, opacity: 0.65, blend: 'screen' }),
        line3d([4.5, -3.6, -0.45], [4.5, 3.6, -0.45], { color: COSMOS.blue, width: 2.0, opacity: 0.65, blend: 'screen' }),
        line3d([-4.2, -3.6, -0.45], [-4.2, -3.6, 0.02], { color: COSMOS.blue, width: 2.0, opacity: 0.65, blend: 'screen' }),
        line3d([4.5, -3.6, -0.45], [4.5, -3.6, 0.02], { color: COSMOS.blue, width: 2.0, opacity: 0.65, blend: 'screen' }),
        line3d([4.5, 3.6, -0.45], [4.5, 3.6, 0.02], { color: COSMOS.blue, width: 2.0, opacity: 0.65, blend: 'screen' }),
    )

    const hexHeight = (hc: HexCol): number => {
        const u = Math.max(0, Math.min(1, (ignite.value - hc.delay) / 0.36))
        const eased = u * u * (3 - 2 * u)
        const ripple = 0.08 * Math.sin(pulse.value * 2.8 - hc.dist * 1.15)
        return Math.max(0.06, eased * hc.maxH + eased * ripple)
    }

    const rHex = 0.34
    for (let i = 0; i < HEX_COLS.length; i++) {
        const hc = HEX_COLS[i]!
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
                    opacity: 0.44,
                    mesh: hc.col,
                    meshOpacity: 0.54,
                    meshWidth: 0.9,
                    shaded: true,
                    animate: true,
                },
            ),
            line3d(
                () => [hc.cx, hc.cy, 0.04] as Vec3,
                () => [hc.cx, hc.cy, 0.06 + hexHeight(hc)] as Vec3,
                { color: hc.col, width: 2.1, glow: 6, blend: 'screen', opacity: 0.84 },
            ),
        )
    }

    view3d.add(
        points3d(
            () => HEX_COLS.map((hc): Vec3 => [hc.cx, hc.cy, 0.08 + hexHeight(hc)]),
            {
                colorAt: (idx) => HEX_COLS[idx]!.col,
                radius: 5.5,
                glow: 10,
                blend: 'screen',
                onTop: true,
            },
        ),
        point3d([0.1, 0, 1.85], { color: '#ffffff', radius: 4, glow: 12, blend: 'screen', opacity: 0.01 }),
    )

    // Bold Upper-Left Monumental Stat + Editorial Title (eliminates tiny telemetry lines!)
    const headline = group(
        txt('KVM  /  FIRECRACKER MICROVMS', -855, -408, 26, COSMOS.gold, 'mono', 'left'),
        txt('Sub-Second', -860, -172, 104, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.cyan),
        txt('Sandboxes', -860, -60, 104, COSMOS.cyan, 'serif', 'left').glow(9, COSMOS.cyan),
        txt('64 Linux kernels  ·  < 5 MiB RAM each', -855, 42, 30, COSMOS.muted, 'sans', 'left'),
    )

    const liveBootStat = dynamic(() => {
        const u = Math.min(1, ignite.value)
        const ms = Math.round(u * 125)
        const activeCount = Math.round(u * 64)
        const statCol = u > 0.92 ? COSMOS.emerald : COSMOS.gold
        const nodes: Node[] = [
            txt(`${ms} ms`, -858, -304, 88, statCol, 'mono', 'left').glow(12, statCol),
            txt(`HOST KERNEL + KVM  ·  ${activeCount} / 64 VMX`, 855, -408, 26, COSMOS.gold, 'mono', 'right'),
        ]
        return group(...nodes)
    })

    s.add(aura, view3d, headline, liveBootStat)

    const fullDur = Math.max(8, c.end - c.start - 0.15)
    c.at(0.04, () => {
        s.play(
            ignite.to(1, { duration: 2.9 }),
            pulse.to(fullDur * 1.1, { duration: fullDur, ease: linear }),
            view3d.orbit({ theta: 0.28, phi: 0.94 }, { duration: fullDur }),
        )
    })
}

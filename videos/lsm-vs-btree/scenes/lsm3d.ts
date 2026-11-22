import {
    circle, dot, dynamic, group, label3d, line3d, linear, parametricSurface, point3d,
    radialGradient, rect, scene3d, surface, tex, type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { LSM_LEVELS } from '../math'
import { txt } from '../../../factory/style'

// Cleanly separated vertical z-tiers so MemTable (z = 2.85) never overlaps L0 (z = 1.65)!
const LEVEL_ZS = [1.65, 0.58, -0.48, -1.52] as const
const MEM_Z = 2.88

export const lsm3d: SceneFunction = (s, c) => {
    const compactFlow = s.value(0)
    const bloomOn = s.value(0)
    const probeProg = s.value(0)

    const aura = circle(650, {
        fill: radialGradient([0, 0], 650, [
            [0, '#ffd16626'],
            [0.45, '#5ce1e61a'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(210, 15)

    const view3d = scene3d({
        theta: -0.78,
        phi: 1.04,
        distance: 15.8,
        unit: 118,
        perspective: true,
        ambient: 0.45,
        shine: 0.35,
        brightness: 1.14,
        fog: 0.07,
        focus: [0, 0, 0.52],
    }).at(210, 28)

    const tierPill = (label: string, w: number, col: string) =>
        group(
            rect(w, 36, { fill: '#0b1020', stroke: col, width: 2.0, radius: 18 }),
            txt(label, 0, 2, 26, col, 'mono'),
        )

    // Blazing in-memory MemTable floating cleanly high above L0 in bright warm white/amber!
    const memTableSlab = surface(() => MEM_Z, {
        x: [-0.85, 0.85],
        y: [-0.62, 0.62],
        resolution: [8, 6],
        color: '#fff3d1',
        mesh: '#fbbf24',
        meshOpacity: 0.65,
        meshWidth: 1.1,
        opacity: 0.92,
    })
    view3d.add(
        memTableSlab,
        line3d([-0.85, -0.62, MEM_Z + 0.02], [0.85, -0.62, MEM_Z + 0.02], { color: '#ffffff', width: 3.4, glow: 10, blend: 'screen' }),
        line3d([0.85, -0.62, MEM_Z + 0.02], [0.85, 0.62, MEM_Z + 0.02], { color: '#ffffff', width: 3.4, glow: 10, blend: 'screen' }),
        line3d([0.85, 0.62, MEM_Z + 0.02], [-0.85, 0.62, MEM_Z + 0.02], { color: '#ffffff', width: 3.4, glow: 10, blend: 'screen' }),
        line3d([-0.85, 0.62, MEM_Z + 0.02], [-0.85, -0.62, MEM_Z + 0.02], { color: '#ffffff', width: 3.4, glow: 10, blend: 'screen' }),
        label3d(tierPill('Mem', 78, '#fff3d1'), [0.92, 0.0, MEM_Z + 0.06], { offset: [56, -4] }),
    )

    // Four glowing translucent 3D leveled slabs (L0 -> L1 -> L2 -> L3) + crisp opaque pill label3d tier tags!
    for (let idx = 0; idx < LSM_LEVELS.length; idx++) {
        const lv = LSM_LEVELS[idx]!
        const hx = lv.width / 2
        const hy = lv.depth / 2
        const z = LEVEL_ZS[idx]!
        view3d.add(
            surface(() => z, {
                x: [-hx, hx],
                y: [-hy, hy],
                resolution: [lv.tables * 3, 8],
                color: lv.color,
                mesh: '#ffffff',
                meshOpacity: 0.28,
                meshWidth: 0.8,
                opacity: 0.68,
            }),
            line3d([-hx, -hy, z + 0.02], [hx, -hy, z + 0.02], { color: lv.color, width: 3.4, glow: 8, blend: 'screen', opacity: 0.96 }),
            line3d([hx, -hy, z + 0.02], [hx, hy, z + 0.02], { color: lv.color, width: 3.4, glow: 8, blend: 'screen', opacity: 0.96 }),
            line3d([hx, hy, z + 0.02], [-hx, hy, z + 0.02], { color: lv.color, width: 3.4, glow: 8, blend: 'screen', opacity: 0.96 }),
            line3d([-hx, hy, z + 0.02], [-hx, -hy, z + 0.02], { color: lv.color, width: 3.4, glow: 8, blend: 'screen', opacity: 0.96 }),
            label3d(tierPill(lv.name, 62, lv.color), [hx + 0.18, 0.0, z + 0.04], { offset: [48, 0] }),
        )
        // Immutable SSTable partition dividers across each tier
        for (let t = 1; t < lv.tables; t++) {
            const x = -hx + (lv.width * t) / lv.tables
            view3d.add(line3d([x, -hy, z + 0.03], [x, hy, z + 0.03], { color: '#ffffff', width: 1.8, opacity: 0.5 }))
        }
    }

    // Sequential compaction cascade columns connecting MemTable -> L0 -> L1 -> L2 -> L3
    const cascadeXs = [-0.45, 0, 0.45] as const
    for (let k = 0; k < cascadeXs.length; k++) {
        const cx = cascadeXs[k]!
        view3d.add(
            line3d([cx, 0, MEM_Z - 0.04], [cx * 2.2, 0, LEVEL_ZS[3]], { color: '#ffd166', width: 2.4, glow: 6, blend: 'screen', opacity: 0.55 }),
            point3d(
                () => {
                    const p = (compactFlow.value * 0.65 + k * 0.33) % 1
                    const z = MEM_Z - 0.04 - p * (MEM_Z - 0.04 - LEVEL_ZS[3])
                    const x = cx * (1 + p * 1.2)
                    return [x, 0, z] as Vec3
                },
                { color: '#ffd166', radius: 9.0, glow: 12, blend: 'screen', halo: 0, onTop: true },
            ),
        )
    }

    // Upgraded Bloom filters: glowing translucent VERTICAL holographic shields guarding the front face of L0, L1, L2!
    const bloomShields = LSM_LEVELS.slice(0, 3).flatMap((lv, idx) => {
        const hx = lv.width / 2
        const hy = -lv.depth / 2 - 0.22
        const z = LEVEL_ZS[idx]!
        const zBot = z - 0.12
        const zTop = z + 0.56
        return [
            parametricSurface(
                (u, v) => [u, hy, v] as Vec3,
                [-hx, hx],
                [zBot, zTop],
                {
                    resolution: [10, 4],
                    color: '#6ee7b7',
                    mesh: '#a7f3d0',
                    meshOpacity: 0.52,
                    meshWidth: 0.9,
                    opacity: 0.32,
                    shaded: false,
                },
            ),
            // Glowing neon shield perimeter frame
            line3d([-hx, hy, zTop], [hx, hy, zTop], { color: '#6ee7b7', width: 5.0, glow: 12, blend: 'screen', opacity: 0.98, onTop: true }),
            line3d([-hx, hy, zBot], [hx, hy, zBot], { color: '#34d399', width: 3.4, glow: 10, blend: 'screen', opacity: 0.9, onTop: true }),
            line3d([-hx, hy, zBot], [-hx, hy, zTop], { color: '#6ee7b7', width: 3.4, glow: 10, blend: 'screen', opacity: 0.92, onTop: true }),
            line3d([hx, hy, zBot], [hx, hy, zTop], { color: '#6ee7b7', width: 3.4, glow: 10, blend: 'screen', opacity: 0.92, onTop: true }),
        ]
    })

    // Thick vivid incoming cyan miss laser beam + bright emerald starburst deflection off L1's Bloom holographic shield!
    const probeStart: Vec3 = [-0.6, -3.5, 1.35]
    const probeHit: Vec3 = [0.15, -1.32, LEVEL_ZS[1] + 0.24]
    const probeBounce: Vec3 = [2.25, -2.85, 2.35]

    const probeBeamIn = line3d(
        () => probeStart,
        () => {
            const u = Math.min(1, probeProg.value * 2.1)
            return [
                probeStart[0] + (probeHit[0] - probeStart[0]) * u,
                probeStart[1] + (probeHit[1] - probeStart[1]) * u,
                probeStart[2] + (probeHit[2] - probeStart[2]) * u,
            ] as Vec3
        },
        { color: '#5ce1e6', width: 8.0, glow: 12, blend: 'screen', opacity: 1, onTop: true },
    )
    const probeBeamInCore = line3d(
        () => probeStart,
        () => {
            const u = Math.min(1, probeProg.value * 2.1)
            return [
                probeStart[0] + (probeHit[0] - probeStart[0]) * u,
                probeStart[1] + (probeHit[1] - probeStart[1]) * u,
                probeStart[2] + (probeHit[2] - probeStart[2]) * u,
            ] as Vec3
        },
        { color: '#ffffff', width: 2.6, glow: 6, blend: 'screen', opacity: 0.95, onTop: true },
    )
    const probeBeamBounce = line3d(
        () => probeHit,
        () => {
            const u = Math.max(0, Math.min(1, (probeProg.value - 0.45) * 2.0))
            return [
                probeHit[0] + (probeBounce[0] - probeHit[0]) * u,
                probeHit[1] + (probeBounce[1] - probeHit[1]) * u,
                probeHit[2] + (probeBounce[2] - probeHit[2]) * u,
            ] as Vec3
        },
        { color: '#6ee7b7', width: 8.0, glow: 14, blend: 'screen', opacity: 1, onTop: true },
    )
    const probeBeamBounceCore = line3d(
        () => probeHit,
        () => {
            const u = Math.max(0, Math.min(1, (probeProg.value - 0.45) * 2.0))
            return [
                probeHit[0] + (probeBounce[0] - probeHit[0]) * u,
                probeHit[1] + (probeBounce[1] - probeHit[1]) * u,
                probeHit[2] + (probeBounce[2] - probeHit[2]) * u,
            ] as Vec3
        },
        { color: '#ffffff', width: 2.6, glow: 6, blend: 'screen', opacity: 0.95, onTop: true },
    )

    // Bright emerald starburst deflection rays exploding off the L1 Bloom shield impact point!
    const starDirs: readonly Vec3[] = [
        [0.65, -0.65, 0.55],
        [-0.62, -0.58, 0.52],
        [0.52, -0.72, -0.45],
        [-0.55, -0.68, -0.42],
        [0.05, -0.82, 0.68],
        [0.72, -0.52, 0.08],
    ]
    const starburstRays = starDirs.map((d) =>
        line3d(
            () => probeHit,
            () => {
                const u = Math.max(0, Math.min(1, (probeProg.value - 0.45) * 2.2))
                return [
                    probeHit[0] + d[0] * u,
                    probeHit[1] + d[1] * u,
                    probeHit[2] + d[2] * u,
                ] as Vec3
            },
            { color: '#6ee7b7', width: 4.5, glow: 12, blend: 'screen', opacity: 0.96, onTop: true },
        ),
    )

    const probeSpark = point3d(() => probeHit, {
        color: '#6ee7b7',
        radius: 15,
        glow: 16,
        blend: 'screen',
        halo: 0,
        onTop: true,
    })
    const probeSparkCore = point3d(() => probeHit, {
        color: '#ffffff',
        radius: 7,
        glow: 12,
        blend: 'screen',
        halo: 0,
        onTop: true,
    })
    const missLabel = label3d(tierPill('MISS ✕', 118, '#6ee7b7'), [probeBounce[0] - 0.35, probeBounce[1], probeBounce[2] + 0.12], {
        offset: [36, -24],
    })

    const leftCopy = group(
        txt('3D LEVELED LSM-TREE', -850, -385, 26, '#ffd166', 'mono', 'left'),
        txt('Sequential', -855, -295, 66, '#f8f4ec', 'serif', 'left'),
        txt('Pyramid', -855, -220, 66, '#ffd166', 'serif', 'left').glow(6, '#ffd166'),
        dot(9, '#fff3d1').at(-838, -126).glow(8, '#fbbf24'),
        txt('MemTable (In-Memory RAM)', -810, -126, 26, '#fff3d1', 'sans', 'left'),
        dot(9, '#ffd166').at(-838, -76).glow(8, '#ffd166'),
        txt('L0 Sequential Flush (64 MB)', -810, -76, 26, '#ffd166', 'sans', 'left'),
        dot(9, '#5ce1e6').at(-838, -26).glow(8, '#5ce1e6'),
        txt('L1 Sorted SSTables (640 MB)', -810, -26, 26, '#5ce1e6', 'sans', 'left'),
        dot(9, '#60a5fa').at(-838, 24).glow(8, '#60a5fa'),
        txt('L2 Compacted (6.4 GB)', -810, 24, 26, '#60a5fa', 'sans', 'left'),
        dot(9, '#a78bfa').at(-838, 74).glow(8, '#a78bfa'),
        txt('L3 Cold Tier (64 GB)', -810, 74, 26, '#c4b5fd', 'sans', 'left'),
    )

    const bloomCopy = group(
        tex(String.raw`\text{FPR} = \left(1 - e^{-kn/m}\right)^k = 0.82\%`, { size: 38, color: '#6ee7b7' }).at(-595, 200).glow(6, '#6ee7b7'),
        txt('10 bits/key · k = 7 optimal hashes', -850, 290, 28, '#cbd5e8', 'mono', 'left'),
        txt('99.2% of miss reads skip disk I/O', -850, 338, 28, '#6ee7b7', 'sans', 'left'),
    )

    // Full-opacity glowing pill badge (#111626ee fill + bright emerald border) — NEVER dim!
    const gateBadge = dynamic(() => {
        if (bloomOn.value < 0.05) return []
        const a = Math.min(1, bloomOn.value)
        return group(
            rect(775, 58, { fill: '#111626ee', stroke: '#6ee7b7', width: 3.2, radius: 29 })
                .at(445, -365)
                .opacity(a)
                .glow(14, '#6ee7b7'),
            txt('BLOOM LASER GATE  ·  MISS SHORT-CIRCUITED!', 445, -363, 27, '#6ee7b7', 'mono').opacity(a).glow(8, '#6ee7b7'),
        )
    })

    s.add(aura, view3d, leftCopy, gateBadge)
    c.at(0.1, () => s.play(view3d.orbit({ theta: 0.58, phi: 0.94 }, { duration: 29.5 })))
    c.at(0.1, () => s.play(compactFlow.to(9.5, { duration: 29.5, ease: linear })))
    // Trigger holographic Bloom shields + thick probe beam + full-opacity badge on "what about reads" (t ~ 102.9s)
    // so by t = 105.0s the badge is 100% full-opacity and the incoming cyan beam + emerald starburst are blazing!
    c.show('what about reads', bloomCopy)
    c.on('what about reads', () => {
        view3d.add(...bloomShields, probeBeamIn, probeBeamInCore, probeBeamBounce, probeBeamBounceCore, ...starburstRays, probeSpark, probeSparkCore, missLabel)
        s.play(
            bloomOn.to(1, { duration: 0.45 }),
            probeProg.to(1, { duration: 1.55 }),
        )
    })
}

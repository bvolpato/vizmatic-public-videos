import {
    circle, dot, dynamic, group, line3d, linear, point3d, radialGradient, scene3d, surface, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { LSM_LEVELS } from '../math'
import { txt } from '../../../factory/style'

export const lsm3d: SceneFunction = (s, c) => {
    const compactFlow = s.value(0)
    const bloomOn = s.value(0)
    const probeProg = s.value(0)

    const aura = circle(640, {
        fill: radialGradient([0, 0], 640, [
            [0, '#ffd16622'],
            [0.45, '#5ce1e616'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(205, 15)

    const view3d = scene3d({
        theta: -0.78,
        phi: 1.06,
        distance: 15.2,
        unit: 126,
        perspective: true,
        ambient: 0.44,
        shine: 0.34,
        brightness: 1.12,
        fog: 0.08,
        focus: [0, 0, 0.45],
    }).at(205, 25)

    // Blazing in-memory MemTable floating above the pyramid at z = 2.55
    const memTableSlab = surface(() => 2.55, {
        x: [-0.85, 0.85],
        y: [-0.65, 0.65],
        resolution: [8, 6],
        color: '#ffd166',
        mesh: '#fff7d6',
        meshOpacity: 0.55,
        meshWidth: 1.0,
        opacity: 0.88,
    })
    view3d.add(
        memTableSlab,
        line3d([-0.85, -0.65, 2.56], [0.85, -0.65, 2.56], { color: '#ffffff', width: 2.8, glow: 8 }),
        line3d([0.85, -0.65, 2.56], [0.85, 0.65, 2.56], { color: '#ffffff', width: 2.8, glow: 8 }),
        line3d([0.85, 0.65, 2.56], [-0.85, 0.65, 2.56], { color: '#ffffff', width: 2.8, glow: 8 }),
        line3d([-0.85, 0.65, 2.56], [-0.85, -0.65, 2.56], { color: '#ffffff', width: 2.8, glow: 8 }),
    )

    // Four glowing translucent 3D leveled slabs (L0 -> L1 -> L2 -> L3) with SSTable dividers!
    for (const lv of LSM_LEVELS) {
        const hx = lv.width / 2
        const hy = lv.depth / 2
        const z = lv.z
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
            // Perimeter neon edge around each tier slab
            line3d([-hx, -hy, z + 0.02], [hx, -hy, z + 0.02], { color: lv.color, width: 3.2, glow: 8, opacity: 0.95 }),
            line3d([hx, -hy, z + 0.02], [hx, hy, z + 0.02], { color: lv.color, width: 3.2, glow: 8, opacity: 0.95 }),
            line3d([hx, hy, z + 0.02], [-hx, hy, z + 0.02], { color: lv.color, width: 3.2, glow: 8, opacity: 0.95 }),
            line3d([-hx, hy, z + 0.02], [-hx, -hy, z + 0.02], { color: lv.color, width: 3.2, glow: 8, opacity: 0.95 }),
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
            line3d([cx, 0, 2.52], [cx * 2.2, 0, -1.25], { color: '#ffd166', width: 2.2, opacity: 0.48 }),
            point3d(
                () => {
                    const p = (compactFlow.value * 0.65 + k * 0.33) % 1
                    const z = 2.52 - p * 3.77
                    const x = cx * (1 + p * 1.2)
                    return [x, 0, z] as Vec3
                },
                { color: '#ffd166', radius: 8.5, halo: 0, onTop: true },
            ),
        )
    }

    // Bloom Filter glowing laser gates guarding the front face of L0, L1, L2!
    const bloomGates = LSM_LEVELS.slice(0, 3).flatMap((lv) => {
        const hx = lv.width / 2
        const hy = -lv.depth / 2 - 0.14
        return [
            line3d([-hx, hy, lv.z + 0.22], [hx, hy, lv.z + 0.22], { color: '#6ee7b7', width: 5.2, glow: 12, opacity: 0.98, onTop: true }),
            line3d([-hx, hy, lv.z - 0.05], [hx, hy, lv.z - 0.05], { color: '#a78bfa', width: 3.2, glow: 8, opacity: 0.85, onTop: true }),
        ]
    })

    // Reactive read-miss probe beam deflecting cleanly off the L1 Bloom filter laser gate!
    const probeStart: Vec3 = [0.2, -2.95, 1.4]
    const probeHit: Vec3 = [0.2, -1.24, 0.82]
    const probeBounce: Vec3 = [1.8, -2.45, 2.2]
    const probeBeamIn = line3d(
        () => probeStart,
        () => {
            const u = Math.min(1, probeProg.value * 2)
            return [
                probeStart[0] + (probeHit[0] - probeStart[0]) * u,
                probeStart[1] + (probeHit[1] - probeStart[1]) * u,
                probeStart[2] + (probeHit[2] - probeStart[2]) * u,
            ] as Vec3
        },
        { color: '#5ce1e6', width: 5.5, glow: 12, opacity: 1, onTop: true },
    )
    const probeBeamBounce = line3d(
        () => probeHit,
        () => {
            const u = Math.max(0, (probeProg.value - 0.5) * 2)
            return [
                probeHit[0] + (probeBounce[0] - probeHit[0]) * u,
                probeHit[1] + (probeBounce[1] - probeHit[1]) * u,
                probeHit[2] + (probeBounce[2] - probeHit[2]) * u,
            ] as Vec3
        },
        { color: '#6ee7b7', width: 5.5, glow: 12, opacity: 1, onTop: true },
    )
    const probeSpark = point3d(() => probeHit, { color: '#6ee7b7', radius: 10.5, halo: 0, onTop: true })

    const leftCopy = group(
        txt('3D LEVELED LSM-TREE', -850, -385, 26, '#ffd166', 'mono', 'left'),
        txt('Sequential', -855, -295, 66, '#f8f4ec', 'serif', 'left'),
        txt('Pyramid', -855, -220, 66, '#ffd166', 'serif', 'left').glow(6, '#ffd166'),
        dot(9, '#ffd166').at(-838, -118).glow(8, '#ffd166'),
        txt('MemTable → L0 (64 MB)', -810, -118, 28, '#ffd166', 'sans', 'left'),
        dot(9, '#5ce1e6').at(-838, -62).glow(8, '#5ce1e6'),
        txt('L1 Sorted SSTables (640 MB)', -810, -62, 28, '#5ce1e6', 'sans', 'left'),
        dot(9, '#60a5fa').at(-838, -6).glow(8, '#60a5fa'),
        txt('L2 Compacted (6.4 GB)', -810, -6, 28, '#60a5fa', 'sans', 'left'),
        dot(9, '#a78bfa').at(-838, 50).glow(8, '#a78bfa'),
        txt('L3 Cold Tier (64 GB)', -810, 50, 28, '#a78bfa', 'sans', 'left'),
    )

    const bloomCopy = group(
        tex(String.raw`\text{FPR} = \left(1 - e^{-kn/m}\right)^k = 0.82\%`, { size: 38, color: '#6ee7b7' }).at(-595, 195).glow(6, '#6ee7b7'),
        txt('10 bits/key · k = 7 optimal hashes', -850, 285, 28, '#cbd5e8', 'mono', 'left'),
        txt('99.2% of miss reads skip disk I/O', -850, 332, 28, '#6ee7b7', 'sans', 'left'),
    )

    const gateBadge = dynamic(() => {
        if (bloomOn.value < 0.05) return []
        return group(
            txt('BLOOM LASER GATE  ·  MISS SHORT-CIRCUITED!', 440, -355, 28, '#6ee7b7', 'mono')
                .opacity(bloomOn.value)
                .glow(10, '#6ee7b7'),
        )
    })

    s.add(aura, view3d, leftCopy, gateBadge)
    c.at(0.1, () => s.play(view3d.orbit({ theta: 0.58, phi: 0.94 }), { duration: 29.5 }))
    c.at(0.1, () => s.play(compactFlow.to(9.5, { duration: 29.5, ease: linear })))
    c.show('Bloom filters', bloomCopy)
    c.on('Bloom filters', () => {
        view3d.add(...bloomGates, probeBeamIn, probeBeamBounce, probeSpark)
        s.play(bloomOn.to(1, { duration: 0.6 }))
        s.play(probeProg.to(1, { duration: 1.8 }))
    })
}

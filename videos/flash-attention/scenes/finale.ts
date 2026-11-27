import {
    circle, curve3d, group, line3d, linear, parametricSurface, points3d, radialGradient, scene3d, sphere,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const CX = 0
const CY = -175
const RING_R = 2.75
const TILE_COUNT = 8

// Build a tilted glowing 3D SRAM tile module sitting on the panoramic orbital ring
function orbitalTile3d(angle: number, isGold: boolean) {
    const cx = Math.cos(angle) * RING_R
    const cy = Math.sin(angle) * RING_R
    const tx = -Math.sin(angle)
    const ty = Math.cos(angle)
    const rx = Math.cos(angle)
    const ry = Math.sin(angle)
    const halfTang = 0.56
    const halfRad = 0.34
    const halfZ = 0.22
    const edgeCol = isGold ? COSMOS.gold : COSMOS.cyan
    const fillCol = isGold ? '#b58420' : '#187599'

    const pt = (u: number, v: number, w: number): Vec3 => [
        cx + tx * u * halfTang + rx * v * halfRad,
        cy + ty * u * halfTang + ry * v * halfRad,
        w * halfZ,
    ]

    const topFace = parametricSurface(
        (u, v) => pt(u * 2 - 1, v * 2 - 1, 1),
        [0, 1],
        [0, 1],
        {
            resolution: [4, 3],
            color: fillCol,
            mesh: isGold ? '#fff5cc' : '#b2f7ff',
            meshOpacity: 0.38,
            meshWidth: 0.7,
            opacity: 0.58,
            shaded: true,
        },
    )

    const corners: [number, number][] = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
    ]
    const edges = []
    for (let i = 0; i < 4; i++) {
        const a = corners[i]!
        const b = corners[(i + 1) % 4]!
        edges.push(
            line3d(pt(a[0], a[1], 1), pt(b[0], b[1], 1), { color: edgeCol, width: 3.0, glow: 9, blend: 'screen', onTop: true }),
            line3d(pt(a[0], a[1], -1), pt(b[0], b[1], -1), { color: edgeCol, width: 1.6, opacity: 0.58 }),
            line3d(pt(a[0], a[1], -1), pt(a[0], a[1], 1), { color: edgeCol, width: 1.8, opacity: 0.7 }),
        )
    }

    // Radial energy spoke connecting this fused tile to the central SRAM core
    const spoke = line3d([cx * 0.34, cy * 0.34, 0], [cx * 0.85, cy * 0.85, 0], {
        color: edgeCol,
        width: 2.0,
        glow: 8,
        blend: 'screen',
        opacity: 0.65,
        onTop: true,
    })

    return [topFace, ...edges, spoke]
}

export const finale: SceneFunction = (s, c) => {
    const view3d = scene3d({
        theta: -0.52,
        phi: 1.18,
        distance: 15.0,
        unit: 118,
        perspective: true,
        ambient: 0.4,
        shine: 0.42,
        brightness: 1.15,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(CX, CY)

    // Radiant central fused SRAM core jewel
    const coreSphere = sphere(0.86, {
        resolution: [56, 32],
        colors: ['#183473', '#1f7ec2', '#5ce1e6', '#ffd166', '#fff8dc'],
        mesh: '#a3f4ff',
        meshOpacity: 0.14,
        meshWidth: 0.45,
        opacity: 0.88,
    })

    // 8 fused Q/K/V/O SRAM tiles arranged in a panoramic 3D orbital ring!
    const tileModules = Array.from({ length: TILE_COUNT }, (_, i) =>
        orbitalTile3d((i * Math.PI * 2) / TILE_COUNT, i % 2 === 0),
    ).flat()

    // Animated curve3d glowing data streams (animate: true, glow: 8, blend: 'screen') weaving through the ring!
    const streamGold = curve3d(
        (u, time) => {
            const ang = u * Math.PI * 2 + time * 0.45
            const r = RING_R + 0.58 * Math.cos(u * Math.PI * 6 - time * 1.4)
            const z = 0.56 * Math.sin(u * Math.PI * 6 - time * 1.4)
            return [Math.cos(ang) * r, Math.sin(ang) * r, z] as Vec3
        },
        0,
        1,
        {
            samples: 120,
            animate: true,
            colors: [COSMOS.gold, '#fff7d6', COSMOS.amber, COSMOS.gold],
            width: 3.4,
            glow: 8,
            blend: 'screen',
            opacity: 0.92,
            onTop: true,
        },
    )

    const streamCyan = curve3d(
        (u, time) => {
            const ang = u * Math.PI * 2 - time * 0.35
            const r = RING_R - 0.52 * Math.cos(u * Math.PI * 6 + time * 1.2)
            const z = -0.58 * Math.sin(u * Math.PI * 6 + time * 1.2)
            return [Math.cos(ang) * r, Math.sin(ang) * r, z] as Vec3
        },
        0,
        1,
        {
            samples: 120,
            animate: true,
            colors: [COSMOS.cyan, '#ffffff', COSMOS.violet, COSMOS.cyan],
            width: 3.2,
            glow: 8,
            blend: 'screen',
            opacity: 0.88,
            onTop: true,
        },
    )

    const outerHaloRing = curve3d(
        (u, time) => {
            const ang = u * Math.PI * 2 + time * 0.18
            const r = RING_R + 0.72
            const z = 0.24 * Math.sin(u * Math.PI * 4 + time * 0.8)
            return [Math.cos(ang) * r, Math.sin(ang) * r, z] as Vec3
        },
        0,
        1,
        {
            samples: 96,
            animate: true,
            color: COSMOS.cyan,
            width: 2.0,
            glow: 8,
            blend: 'screen',
            opacity: 0.52,
            onTop: true,
        },
    )

    // Orbiting glowing photon packets streaming along the helical conduits
    const photonPhase = s.value(0)
    const orbitalPhotons = points3d(
        () => {
            const t = photonPhase.value
            const pts: Vec3[] = []
            for (let k = 0; k < 16; k++) {
                const u = ((k / 16) + t * 0.16) % 1
                const ang = u * Math.PI * 2 + t * 0.45
                const sign = k % 2 === 0 ? 1 : -1
                const r = RING_R + sign * 0.58 * Math.cos(u * Math.PI * 6 - sign * t * 1.4)
                const z = sign * 0.56 * Math.sin(u * Math.PI * 6 - sign * t * 1.4)
                pts.push([Math.cos(ang) * r, Math.sin(ang) * r, z])
            }
            return pts
        },
        {
            colorAt: (idx) => (idx % 2 === 0 ? '#fff7d6' : COSMOS.cyan),
            radius: 5.2,
            glow: 12,
            blend: 'screen',
            onTop: true,
        },
    )

    view3d.add(coreSphere, ...tileModules, streamGold, streamCyan, outerHaloRing, orbitalPhotons)

    const aura = group(
        circle(520, {
            fill: radialGradient([0, 0], 520, [
                [0, '#ffd1662c'],
                [0.42, '#5ce1e61c'],
                [0.75, '#4c2f8a10'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY),
    ).set('blend', 'screen')

    const takeaway = group(
        txt("Don't write what you can fuse.", 0, 192, 78, COSMOS.ink, 'serif').glow(8, COSMOS.blue),
        txt('2–4× faster  ·  O(N) memory  ·  exact attention', 0, 276, 42, COSMOS.gold, 'serif').glow(8, COSMOS.gold),
        txt('FlashAttention  ·  IO-Aware On-Chip SRAM Kernel', 0, 356, 26, '#8b99b8', 'mono'),
    )

    s.add(aura, view3d, takeaway)
    c.at(0.05, () => s.play(view3d.orbit({ theta: 1.45, phi: 1.08 }), { duration: 15.0, ease: linear }))
    c.at(0.05, () => s.play(photonPhase.to(14.0, { duration: 15.0, ease: linear })))
}

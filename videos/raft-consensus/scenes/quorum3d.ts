import {
    circle, curve3d, dot, dynamic, group, line3d, point3d, radialGradient, scene3d, surface, tex,
    type SceneFunction,
} from 'vizmatic/stage'
import { QUORUM_NODES_3D } from '../math'
import { txt } from '../../../factory/style'

// Two tilted 3D quorum hyperplanes intersecting along the exact vertical axis passing through Witness S3 (0, 0, 0.35)!
// Plane A (Cyan, covers S1, S2, S3): z = 0.35 - 0.22 * x - 0.28 * y
// Plane B (Violet, covers S3, S4, S5): z = 0.35 + 0.22 * x + 0.28 * y
// Intersection line: 0.22 * x + 0.28 * y = 0  =>  y = -(0.22 / 0.28) * x, z = 0.35 (passes RIGHT through S3!)
const planeA = (x: number, y: number) => 0.35 - 0.16 * x - 0.26 * y
const planeB = (x: number, y: number) => 0.35 + 0.16 * x + 0.26 * y

export const quorum3d: SceneFunction = (s, c) => {
    const witnessGlow = s.value(0)

    const aura = circle(620, {
        fill: radialGradient([0, 0], 620, [
            [0, '#ffd16622'],
            [0.45, '#5ce1e618'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(205, 25)

    const view3d = scene3d({
        theta: -0.75,
        phi: 1.05,
        distance: 14.5,
        unit: 132,
        perspective: true,
        ambient: 0.42,
        shine: 0.32,
        brightness: 1.1,
        fog: 0.09,
        focus: [0, 0, 0.35],
    }).at(205, 30)

    // Quorum Plane A {S1, S2, S3} in translucent cyan
    const surfA = surface((x, y) => planeA(x, y), {
        x: [-2.75, 1.35],
        y: [-2.35, 2.35],
        resolution: [24, 24],
        colors: ['#0c2c44', '#165a72', '#22b8cf', '#5ce1e6'],
        mesh: '#7ce8ff',
        meshOpacity: 0.32,
        meshWidth: 0.8,
        opacity: 0.72,
    })

    // Quorum Plane B {S3, S4, S5} in translucent violet
    const surfB = surface((x, y) => planeB(x, y), {
        x: [-1.35, 2.75],
        y: [-2.35, 2.35],
        resolution: [24, 24],
        colors: ['#241145', '#4c1d95', '#7c3aed', '#a78bfa'],
        mesh: '#c4b5fd',
        meshOpacity: 0.32,
        meshWidth: 0.8,
        opacity: 0.72,
    })

    // Exact golden intersection seam where Plane A and Plane B cross right through S3
    const seamLine = line3d([-1.35, 1.35 * (0.16 / 0.26), 0.37], [1.35, -1.35 * (0.16 / 0.26), 0.37], {
        color: '#ffd166',
        width: 6.5,
        glow: 12,
        opacity: 1,
        onTop: true,
    })

    // Orbiting golden halo ring around the central Witness Node S3
    const witnessRing = curve3d(
        (t) => [Math.cos(t) * 0.55, Math.sin(t) * 0.55, 0.35 + Math.sin(t * 2) * 0.06],
        0,
        Math.PI * 2,
        { color: '#ffd166', width: 4.2, glow: 10, opacity: 0.95, samples: 64, onTop: true },
    )

    // 5 Cluster Servers placed on their respective quorum planes + subtle base grid lines
    const serverMarks = QUORUM_NODES_3D.flatMap((node, idx) => {
        const [x, y] = node.pos
        const z = idx < 2 ? planeA(x, y) : idx > 2 ? planeB(x, y) : 0.35
        const isWitness = idx === 2
        const col = isWitness ? '#ffd166' : idx < 2 ? '#5ce1e6' : '#a78bfa'
        return [
            line3d([x, y, -1.1], [x, y, z], { color: col, width: isWitness ? 3.5 : 1.8, opacity: isWitness ? 0.9 : 0.45 }),
            point3d([x, y, z + 0.05], { color: col, radius: isWitness ? 12 : 8.5, halo: 0, onTop: true }),
            ...(isWitness
                ? [
                      line3d([x, y, z], [x, y, 2.25], { color: '#ffd166', width: 4, glow: 10, opacity: 0.95, onTop: true }),
                      point3d([x, y, 2.25], { color: '#ffffff', radius: 7, halo: 0, onTop: true }),
                  ]
                : []),
        ]
    })

    // Connect quorum triangles cleanly in 3D space
    const s1 = [-2.4, -1.6, planeA(-2.4, -1.6) + 0.04] as const
    const s2 = [-2.1, 1.8, planeA(-2.1, 1.8) + 0.04] as const
    const s3 = [0, 0, 0.39] as const
    const s4 = [2.2, -1.7, planeB(2.2, -1.7) + 0.04] as const
    const s5 = [2.4, 1.65, planeB(2.4, 1.65) + 0.04] as const

    view3d.add(
        surfA,
        surfB,
        seamLine,
        line3d(s1, s2, { color: '#5ce1e6', width: 2.5, opacity: 0.75 }),
        line3d(s2, s3, { color: '#5ce1e6', width: 2.5, opacity: 0.75 }),
        line3d(s3, s1, { color: '#5ce1e6', width: 2.5, opacity: 0.75 }),
        line3d(s3, s4, { color: '#a78bfa', width: 2.5, opacity: 0.75 }),
        line3d(s4, s5, { color: '#a78bfa', width: 2.5, opacity: 0.75 }),
        line3d(s5, s3, { color: '#a78bfa', width: 2.5, opacity: 0.75 }),
        ...serverMarks,
    )

    const leftCopy = group(
        txt('3D QUORUM GEOMETRY', -850, -385, 26, '#ffd166', 'mono', 'left'),
        txt('Why Majorities', -855, -295, 62, '#f8f4ec', 'serif', 'left'),
        txt('Always Overlap', -855, -222, 62, '#ffd166', 'serif', 'left').glow(6, '#ffd166'),
        dot(9, '#5ce1e6').at(-838, -110).glow(8, '#5ce1e6'),
        txt('Quorum A  {S1, S2, S3}', -810, -110, 28, '#5ce1e6', 'sans', 'left'),
        dot(9, '#a78bfa').at(-838, -52).glow(8, '#a78bfa'),
        txt('Quorum B  {S3, S4, S5}', -810, -52, 28, '#a78bfa', 'sans', 'left'),
        dot(10, '#ffd166').at(-838, 8).glow(10, '#ffd166'),
        txt('Shared Witness  S3', -810, 8, 30, '#ffd166', 'sans', 'left'),
    )

    const mathTheorem = group(
        tex(String.raw`|Q_1 \cap Q_2| \;\ge\; 2q - N = 1`, { size: 42, color: '#ffd166' }).at(-635, 165).glow(6, '#ffd166'),
        txt('Pigeonhole Principle for N = 5, q = 3', -850, 260, 28, '#cbd5e8', 'sans', 'left'),
        txt('Carries highest Term 2 into every election', -850, 308, 28, '#6ee7b7', 'sans', 'left'),
    )

    const witnessBadge = dynamic(() => {
        if (witnessGlow.value < 0.05) return []
        return group(
            txt('SHARED WITNESS · S3 (TERM 2)', 510, -355, 28, '#ffd166', 'mono')
                .opacity(witnessGlow.value)
                .glow(10, '#ffd166'),
        )
    })

    s.add(aura, view3d, leftCopy, witnessBadge)
    c.at(0.1, () => {
        s.play(view3d.orbit({ theta: 0.65, phi: 0.92 }), { duration: 24.5 })
    })
    c.show('pigeonhole principle', mathTheorem)
    c.on('intersect in at least', () => {
        view3d.add(witnessRing)
        s.play(witnessGlow.to(1, { duration: 0.7 }))
    })
}

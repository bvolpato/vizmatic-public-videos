import {
    circle, curve3d, dot, dynamic, gridPlane3d, group, label3d, line3d, point3d, radialGradient,
    rect, scene3d, surface, tex, vector3d, type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { QUORUM_NODES_3D } from '../math'
import { txt } from '../../../factory/style'

// Two tilted 3D quorum hyperplanes intersecting along the exact seam passing through Witness S3 (0, 0, 0.35)!
const planeA = (x: number, y: number) => 0.35 - 0.16 * x - 0.26 * y
const planeB = (x: number, y: number) => 0.35 + 0.16 * x + 0.26 * y

const FLOOR_Z = -1.1

export const quorum3d: SceneFunction = (s, c) => {
    const witnessGlow = s.value(0)

    const aura = circle(640, {
        fill: radialGradient([0, 0], 640, [
            [0, '#ffd16626'],
            [0.45, '#5ce1e61a'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(205, 25)

    const view3d = scene3d({
        theta: -0.75,
        phi: 1.04,
        distance: 14.8,
        unit: 130,
        perspective: true,
        ambient: 0.44,
        shine: 0.34,
        brightness: 1.12,
        fog: 0.08,
        focus: [0, 0, 0.35],
    }).at(205, 30)

    // Reference coordinate floor grid grounding the 3D quorum space
    const floorGrid = gridPlane3d({
        x: [-2.8, 2.8],
        y: [-2.4, 2.4],
        z: FLOOR_Z,
        step: 0.95,
        color: '#394f7e',
        width: 1.15,
        opacity: 0.48,
    })

    // Quorum Plane A {S1, S2, S3} in translucent cyan
    const surfA = surface((x, y) => planeA(x, y), {
        x: [-2.75, 1.35],
        y: [-2.35, 2.35],
        resolution: [32, 32],
        colors: ['#0c2c44', '#165a72', '#22b8cf', '#5ce1e6'],
        mesh: '#7ce8ff',
        meshOpacity: 0.28,
        meshWidth: 0.72,
        opacity: 0.7,
    })

    // Quorum Plane B {S3, S4, S5} in translucent violet
    const surfB = surface((x, y) => planeB(x, y), {
        x: [-1.35, 2.75],
        y: [-2.35, 2.35],
        resolution: [32, 32],
        colors: ['#241145', '#4c1d95', '#7c3aed', '#a78bfa'],
        mesh: '#c4b5fd',
        meshOpacity: 0.28,
        meshWidth: 0.72,
        opacity: 0.7,
    })

    // Exact golden intersection seam where Plane A and Plane B cross right through Witness S3
    const seamLine = line3d([-1.35, 1.35 * (0.16 / 0.26), 0.37], [1.35, -1.35 * (0.16 / 0.26), 0.37], {
        color: '#ffd166',
        width: 6.5,
        glow: 12,
        blend: 'screen',
        opacity: 1,
        onTop: true,
    })

    // Orbiting radiant golden halo rings around the central Witness Node S3
    const witnessRing = curve3d(
        (t, time) => [Math.cos(t + time * 0.7) * 0.58, Math.sin(t + time * 0.7) * 0.58, 0.38 + Math.sin(t * 2) * 0.08],
        0,
        Math.PI * 2,
        { color: '#ffd166', width: 4.4, glow: 12, blend: 'screen', opacity: 0.96, samples: 64, animate: true, onTop: true },
    )
    const witnessRingOuter = curve3d(
        (t, time) => [Math.cos(t - time * 0.5) * 0.86, Math.sin(t - time * 0.5) * 0.86, 0.38],
        0,
        Math.PI * 2,
        { color: '#ffd166', width: 2.2, glow: 10, blend: 'screen', opacity: 0.65, samples: 64, animate: true, onTop: true },
    )

    // Explicitly labeled 3D vertical TERM elevation axis (T1 -> T2) placed cleanly outside the planes!
    const AXIS_X = -3.35
    const AXIS_Y = -2.45
    const termAxis = [
        vector3d([AXIS_X, AXIS_Y, FLOOR_Z], [AXIS_X, AXIS_Y, 2.2], {
            color: '#ffd166',
            width: 3.6,
            tip: 14,
            glow: 10,
            blend: 'screen',
            halo: false,
            opacity: 0.96,
            onTop: true,
        }),
        // Tick mark for T1 (lower elevation)
        line3d([AXIS_X - 0.18, AXIS_Y, -0.35], [AXIS_X + 0.18, AXIS_Y, -0.35], {
            color: '#5ce1e6',
            width: 3.2,
            glow: 8,
            blend: 'screen',
            onTop: true,
        }),
        label3d(
            group(
                rect(54, 34, { fill: '#0b1020', stroke: '#5ce1e6', width: 1.8, radius: 17 }),
                txt('T1', 0, 2, 26, '#5ce1e6', 'mono'),
            ),
            [AXIS_X, AXIS_Y, -0.35],
            { offset: [-46, 0] },
        ),
        // Tick mark for T2 (higher elevation)
        line3d([AXIS_X - 0.18, AXIS_Y, 1.35], [AXIS_X + 0.18, AXIS_Y, 1.35], {
            color: '#ffd166',
            width: 3.2,
            glow: 8,
            blend: 'screen',
            onTop: true,
        }),
        label3d(
            group(
                rect(54, 34, { fill: '#0b1020', stroke: '#ffd166', width: 1.8, radius: 17 }),
                txt('T2', 0, 2, 26, '#ffd166', 'mono'),
            ),
            [AXIS_X, AXIS_Y, 1.35],
            { offset: [-46, 0] },
        ),
        label3d(
            group(
                rect(116, 36, { fill: '#0b1020', stroke: '#ffd166', width: 1.8, radius: 18 }),
                txt('TERM ↑', 0, 2, 26, '#ffd166', 'mono'),
            ),
            [AXIS_X, AXIS_Y, 2.42],
            { offset: [0, -18] },
        ),
    ]

    // 5 Cluster Servers placed on their respective quorum planes + crisp opaque pill label3d tags on ALL 5 nodes!
    const labelOffsets: readonly (readonly [number, number])[] = [
        [-48, -20], // S1
        [-52, -22], // S2
        [0, -68],   // S3 (witness) — lifted cleanly above the witness halo ring!
        [52, 22],   // S4
        [52, -20],  // S5
    ]

    const serverPts: Vec3[] = QUORUM_NODES_3D.map((node, idx) => {
        const [x, y] = node.pos
        const z = idx < 2 ? planeA(x, y) : idx > 2 ? planeB(x, y) : 0.35
        return [x, y, z + 0.05] as Vec3
    })

    const serverMarks = QUORUM_NODES_3D.flatMap((node, idx) => {
        const pt = serverPts[idx]!
        const isWitness = idx === 2
        const col = isWitness ? '#ffd166' : idx < 2 ? '#5ce1e6' : '#c4b5fd'
        const tag = isWitness ? 'S3 ★' : node.name
        const pillW = isWitness ? 96 : 64
        const tagPill = group(
            rect(pillW, 38, { fill: '#0b1020', stroke: col, width: 2.0, radius: 19 }),
            txt(tag, 0, 2, 26, col, 'mono'),
        )
        return [
            // Radiant glowing halo on S3 (glow: 16, blend: 'screen') and crisp glowing dots on all 5 servers
            point3d(pt, {
                color: col,
                radius: isWitness ? 15 : 10,
                glow: isWitness ? 16 : 10,
                blend: 'screen',
                halo: 0,
                onTop: true,
            }),
            point3d(pt, {
                color: '#ffffff',
                radius: isWitness ? 6 : 3.5,
                glow: isWitness ? 10 : 4,
                blend: 'screen',
                halo: 0,
                onTop: true,
            }),
            label3d(tagPill, pt, {
                offset: labelOffsets[idx]!,
            }),
        ]
    })

    // Thickened glowing cyan ({S1,S2,S3}) and purple ({S3,S4,S5}) quorum simplex edges!
    const [s1, s2, s3, s4, s5] = serverPts as [Vec3, Vec3, Vec3, Vec3, Vec3]
    const simplexEdges = [
        line3d(s1, s2, { color: '#5ce1e6', width: 4.8, glow: 8, blend: 'screen', opacity: 0.96, onTop: true }),
        line3d(s2, s3, { color: '#5ce1e6', width: 4.8, glow: 8, blend: 'screen', opacity: 0.96, onTop: true }),
        line3d(s3, s1, { color: '#5ce1e6', width: 4.8, glow: 8, blend: 'screen', opacity: 0.96, onTop: true }),
        line3d(s3, s4, { color: '#a78bfa', width: 4.8, glow: 8, blend: 'screen', opacity: 0.96, onTop: true }),
        line3d(s4, s5, { color: '#a78bfa', width: 4.8, glow: 8, blend: 'screen', opacity: 0.96, onTop: true }),
        line3d(s5, s3, { color: '#a78bfa', width: 4.8, glow: 8, blend: 'screen', opacity: 0.96, onTop: true }),
    ]

    view3d.add(floorGrid, surfA, surfB, seamLine, witnessRing, witnessRingOuter, ...simplexEdges, ...termAxis, ...serverMarks)

    const leftCopy = group(
        txt('3D QUORUM GEOMETRY', -850, -385, 26, '#ffd166', 'mono', 'left'),
        txt('Why Majorities', -855, -295, 62, '#f8f4ec', 'serif', 'left'),
        txt('Always Overlap', -855, -222, 62, '#ffd166', 'serif', 'left').glow(6, '#ffd166'),
        dot(9, '#5ce1e6').at(-838, -110).glow(8, '#5ce1e6'),
        txt('Quorum A  {S1, S2, S3}', -810, -110, 28, '#5ce1e6', 'sans', 'left'),
        dot(9, '#a78bfa').at(-838, -52).glow(8, '#a78bfa'),
        txt('Quorum B  {S3, S4, S5}', -810, -52, 28, '#c4b5fd', 'sans', 'left'),
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
        const a = Math.min(1, witnessGlow.value)
        return group(
            rect(520, 58, { fill: '#111626ee', stroke: '#ffd166', width: 3.0, radius: 29 })
                .at(520, -360)
                .opacity(a)
                .glow(12, '#ffd166'),
            txt('SHARED WITNESS · S3 (TERM 2)', 520, -358, 28, '#ffd166', 'mono').opacity(a).glow(8, '#ffd166'),
        )
    })

    s.add(aura, view3d, leftCopy, witnessBadge)
    c.at(0.1, () => {
        s.play(view3d.orbit({ theta: 0.65, phi: 0.92 }, { duration: 24.5 }))
    })
    c.show('pigeonhole principle', mathTheorem)
    c.on('pigeonhole principle', () => {
        s.play(witnessGlow.to(1, { duration: 0.6 }))
    })
}

import {
    Node, circle, curve3d, dot, dynamic, group, line, line3d, linearGradient, point3d, points3d,
    polygon, radialGradient, scene3d, type IntroFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const CX = 370
const CY = 0

// Regular octahedron vertices (radius R) + dual rotated inner octahedral cage
function octaEdges(r: number, rotZ = 0): readonly (readonly [Vec3, Vec3])[] {
    const c = Math.cos(rotZ)
    const s = Math.sin(rotZ)
    const rot = (x: number, y: number, z: number): Vec3 => [x * c - y * s, x * s + y * c, z]
    const top = rot(0, 0, r * 1.18)
    const bot = rot(0, 0, -r * 1.18)
    const eq: Vec3[] = [
        rot(r, 0, 0),
        rot(0, r, 0),
        rot(-r, 0, 0),
        rot(0, -r, 0),
    ]
    const edges: [Vec3, Vec3][] = []
    for (let i = 0; i < 4; i++) {
        const a = eq[i]!
        const b = eq[(i + 1) % 4]!
        edges.push([top, a], [bot, a], [a, b])
    }
    return edges
}

const OUTER_EDGES = octaEdges(2.35, 0)
const INNER_EDGES = octaEdges(1.52, Math.PI / 4)
const CORE_EDGES = octaEdges(0.76, 0)
const OUTER_VERTS: Vec3[] = [
    [0, 0, 2.35 * 1.18],
    [0, 0, -2.35 * 1.18],
    [2.35, 0, 0],
    [0, 2.35, 0],
    [-2.35, 0, 0],
    [0, -2.35, 0],
]

export const intro: IntroFunction = (stage, clock) => {
    const prog = stage.value(0.25)
    const beamGrad = linearGradient([CX - 340, CY], [CX + 340, CY], ['#5ce1e600', '#ffd166', '#ffffff', '#ffd166', '#5ce1e600'])

    const vault3d = scene3d({
        theta: -0.68,
        phi: 1.06,
        distance: 12.8,
        unit: 118,
        perspective: true,
        ambient: 0.45,
        brightness: 1.12,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(CX, CY)

    // Orbiting 3D faceted wireframe octahedron vault with additive screen glow
    for (const [a, b] of OUTER_EDGES) {
        vault3d.add(line3d(a, b, { color: '#5ce1e6', width: 3.2, glow: 10, blend: 'screen', opacity: 0.92 }))
    }
    for (const [a, b] of INNER_EDGES) {
        vault3d.add(line3d(a, b, { color: '#a78bfa', width: 2.5, glow: 10, blend: 'screen', opacity: 0.85 }))
    }
    for (const [a, b] of CORE_EDGES) {
        vault3d.add(line3d(a, b, { color: '#ffd166', width: 3.6, glow: 12, blend: 'screen', opacity: 0.98, onTop: true }))
    }
    // Equatorial orbital cryptographic seal rings
    vault3d.add(
        curve3d((t) => [Math.cos(t) * 2.55, Math.sin(t) * 2.55, 0], 0, Math.PI * 2, {
            color: '#a78bfa',
            width: 2.2,
            glow: 10,
            blend: 'screen',
            opacity: 0.72,
            samples: 72,
        }),
        curve3d((t) => [Math.cos(t) * 2.1, 0, Math.sin(t) * 2.1], 0, Math.PI * 2, {
            color: '#5ce1e6',
            width: 1.8,
            glow: 8,
            blend: 'screen',
            opacity: 0.55,
            samples: 72,
        }),
        points3d(OUTER_VERTS, { color: '#5ce1e6', radius: 6.5, glow: 12, blend: 'screen', onTop: true }),
        point3d([0, 0, 0], { color: '#ffffff', radius: 9, glow: 16, blend: 'screen', onTop: true }),
    )

    stage.add(
        circle(540, {
            fill: radialGradient([0, 0], 540, [
                [0, '#ffd16634'],
                [0.42, '#a78bfa22'],
                [0.72, '#5ce1e612'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX, CY),
        txt('192-BYTE CRYPTOGRAPHIC GEM', -840, -195, 26, '#5ce1e6', 'mono', 'left'),
        txt('Zero-Knowledge', -848, -72, 112, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Proofs', -848, 56, 116, '#ffd166', 'serif', 'left').glow(9, '#ffd166'),
        txt('Proving a secret without showing a single bit', -840, 178, 34, '#c8d4ec', 'sans', 'left'),
        vault3d,
        dynamic(() => {
            const p = prog.value
            const gem: Vec[] = [
                [CX, CY - 82],
                [CX + 58, CY],
                [CX, CY + 82],
                [CX - 58, CY],
            ]
            const facets: Node[] = [
                line([CX, CY - 82], [CX, CY + 82], { stroke: '#fff7d6', width: 2, opacity: 0.8 }).set('blend', 'screen'),
                line([CX - 58, CY], [CX + 58, CY], { stroke: '#fff7d6', width: 2, opacity: 0.8 }).set('blend', 'screen'),
                line([CX - 335, CY], [CX + 335, CY], { stroke: beamGrad, width: 3.6, opacity: 0.88 })
                    .glow(10, '#ffd166')
                    .set('blend', 'screen'),
            ]
            const orbitNodes: Node[] = Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2 + p * 0.9
                const r = 295
                const col = i % 2 === 0 ? '#5ce1e6' : '#a78bfa'
                return dot(3.8, col).at(CX + Math.cos(a) * r, CY + Math.sin(a) * r).glow(8, col).set('blend', 'screen')
            })
            return group(
                circle(315, { fill: null, stroke: '#a78bfa', width: 1.8, dash: [10, 14] }).at(CX, CY).opacity(0.45),
                ...orbitNodes,
                polygon(gem, { fill: '#ffd16648', stroke: '#ffd166', width: 4.2 }).glow(16, '#ffd166').set('blend', 'screen'),
                ...facets,
                dot(9, '#ffffff').at(CX, CY).glow(18, '#ffd166').set('blend', 'screen'),
                txt('SEALED WITNESS VAULT', CX, 365, 28, '#d4c2ff', 'mono').glow(8, '#a78bfa'),
            )
        }),
    )

    const dur = Math.max(0.4, clock.intro - 0.08)
    stage.at(0.02, () => {
        stage.play(prog.to(1, { duration: dur }))
        stage.play(vault3d.orbit({ theta: 0.25, phi: 0.96 }, { duration: dur }))
    })
}

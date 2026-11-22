import {
    Node, circle, curve3d, dot, dynamic, group, line3d, linear, parametricSurface, point3d,
    radialGradient, scene3d, surface, type Scene3D, type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

function addReactiveCube(
    view: Scene3D,
    x0: number,
    y0: number,
    zBase: number,
    w: number,
    hFn: () => number,
    col: string,
) {
    const x1 = x0 + w
    const y1 = y0 + w
    const opts = { resolution: [1, 1] as const, color: col, opacity: 0.78, mesh: false as const, shaded: true, animate: true }
    view.add(
        // Top cap & 4 vertical walls smoothly extruding upward as CoW fault happens!
        parametricSurface((u, v): Vec3 => [x0 + u * w, y0 + v * w, zBase + hFn()], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * w, y0, zBase + v * hFn()], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * w, y1, zBase + v * hFn()], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0, y0 + u * w, zBase + v * hFn()], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x1, y0 + u * w, zBase + v * hFn()], [0, 1], [0, 1], opts),
        line3d(() => [x0, y0, zBase + hFn()], () => [x1, y0, zBase + hFn()], { color: '#ffffff', width: 2.0, glow: 6, blend: 'screen' }),
        line3d(() => [x1, y0, zBase + hFn()], () => [x1, y1, zBase + hFn()], { color: '#ffffff', width: 2.0, glow: 6, blend: 'screen' }),
        line3d(() => [x1, y1, zBase + hFn()], () => [x0, y1, zBase + hFn()], { color: '#ffffff', width: 2.0, glow: 6, blend: 'screen' }),
        line3d(() => [x0, y1, zBase + hFn()], () => [x0, y0, zBase + hFn()], { color: '#ffffff', width: 2.0, glow: 6, blend: 'screen' }),
    )
}

export const snapshots: SceneFunction = (s, c) => {
    const cow = s.value(0)
    const reseed = s.value(0)
    const pulse = s.value(0)

    const aura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#5ce1e626'],
            [0.45, '#ffd16618'],
            [0.75, '#a78bfa16'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(205, 30)

    const view3d = scene3d({
        theta: -0.78,
        phi: 1.02,
        distance: 15.8,
        unit: 114,
        perspective: true,
        ambient: 0.45,
        shine: 0.36,
        brightness: 1.14,
        fog: 0.08,
        focus: [0, 0, 0.9],
    }).at(205, 45)

    // 6x6 glowing cyan baseplate of 36 shared read-only snapshot pages at z = 0!
    view3d.add(
        surface(() => 0, {
            x: [-3.0, 3.0],
            y: [-3.0, 3.0],
            resolution: [6, 6],
            colors: ['#0c2c44', '#165a72', '#22b8cf', '#5ce1e6'],
            mesh: '#8cf0ff',
            meshOpacity: 0.65,
            meshWidth: 1.2,
            opacity: 0.62,
        }),
        line3d([-3.0, -3.0, 0.03], [3.0, -3.0, 0.03], { color: COSMOS.cyan, width: 3.4, glow: 10, blend: 'screen' }),
        line3d([3.0, -3.0, 0.03], [3.0, 3.0, 0.03], { color: COSMOS.cyan, width: 3.4, glow: 10, blend: 'screen' }),
        line3d([3.0, 3.0, 0.03], [-3.0, 3.0, 0.03], { color: COSMOS.cyan, width: 3.4, glow: 10, blend: 'screen' }),
        line3d([-3.0, 3.0, 0.03], [-3.0, -3.0, 0.03], { color: COSMOS.cyan, width: 3.4, glow: 10, blend: 'screen' }),
    )

    // 3 cloned microVMs hovering above the shared snapshot baseplate
    const clones: readonly { pos: Vec3; col: string; sharedCells: readonly [number, number][]; dirtyCells: readonly [number, number][] }[] = [
        {
            pos: [-2.35, -1.55, 2.75],
            col: COSMOS.gold,
            sharedCells: [[0, 1], [1, 2], [2, 1]],
            dirtyCells: [[0, 0], [1, 1], [2, 0]],
        },
        {
            pos: [0.05, 2.15, 2.75],
            col: COSMOS.emerald,
            sharedCells: [[2, 3], [3, 4], [4, 3]],
            dirtyCells: [[2, 5], [3, 5], [4, 4]],
        },
        {
            pos: [2.35, -1.45, 2.75],
            col: COSMOS.violet,
            sharedCells: [[4, 2], [5, 1], [3, 2]],
            dirtyCells: [[4, 0], [5, 2], [5, 0]],
        },
    ]

    const cellCenter = (r: number, col: number): Vec3 => [-2.5 + col * 1.0, -2.5 + r * 1.0, 0.05]

    for (let ci = 0; ci < clones.length; ci++) {
        const cl = clones[ci]!
        const [cx, cy, cz] = cl.pos

        // Hovering microVM clone hexagonal halo
        view3d.add(
            curve3d(
                (t): Vec3 => [cx + Math.cos(t) * 0.62, cy + Math.sin(t) * 0.62, cz],
                0,
                Math.PI * 2,
                { color: cl.col, width: 4.0, glow: 10, blend: 'screen', samples: 36, onTop: true },
            ),
            point3d([cx, cy, cz], { color: '#ffffff', radius: 9, glow: 16, blend: 'screen', onTop: true }),
            // Animated VMGenID entropy-reseed pulse ring expanding smoothly from each clone!
            curve3d(
                (t): Vec3 => {
                    const rs = reseed.value
                    const r = rs > 0.04 ? 0.62 + ((pulse.value * 0.7 + ci * 0.33) % 1) * 1.35 * rs : 0.001
                    return [cx + Math.cos(t) * r, cy + Math.sin(t) * r, cz + 0.08]
                },
                0,
                Math.PI * 2,
                { color: COSMOS.emerald, width: 3.5, glow: 12, blend: 'screen', samples: 36, animate: true, onTop: true },
            ),
        )

        // Luminous shared read-only arcs down to clean cyan pages
        for (const [r, col] of cl.sharedCells) {
            const dst = cellCenter(r, col)
            const mid: Vec3 = [(cx + dst[0]) * 0.5, (cy + dst[1]) * 0.5, 1.85]
            view3d.add(
                curve3d(
                    (t): Vec3 => {
                        const u = 1 - t
                        return [
                            u * u * cx + 2 * u * t * mid[0] + t * t * dst[0],
                            u * u * cy + 2 * u * t * mid[1] + t * t * dst[1],
                            u * u * cz + 2 * u * t * mid[2] + t * t * dst[2],
                        ]
                    },
                    0,
                    1,
                    { color: COSMOS.cyan, width: 2.2, glow: 6, blend: 'screen', opacity: 0.72, samples: 28 },
                ),
            )
        }

        // Smoothly extruding private Copy-on-Write dirty 3D cubes + fault arcs!
        for (let di = 0; di < cl.dirtyCells.length; di++) {
            const [r, col] = cl.dirtyCells[di]!
            const x0 = -2.92 + col * 1.0
            const y0 = -2.92 + r * 1.0
            const delay = ci * 0.18 + di * 0.1
            const hFn = () => {
                const u = Math.max(0, Math.min(1, (cow.value - delay) / 0.42))
                const eased = u * u * (3 - 2 * u)
                return 0.03 + eased * (0.95 + di * 0.24)
            }
            addReactiveCube(view3d, x0, y0, 0.02, 0.84, hFn, cl.col)
            view3d.add(
                line3d(
                    () => [cx, cy, cz - 0.05] as Vec3,
                    () => [x0 + 0.42, y0 + 0.42, 0.04 + hFn()] as Vec3,
                    { color: cl.col, width: 2.8, glow: 8, blend: 'screen', opacity: 0.85 },
                ),
                point3d(
                    () => [x0 + 0.42, y0 + 0.42, 0.05 + hFn()] as Vec3,
                    { color: '#ffffff', radius: 5.5, glow: 12, blend: 'screen', onTop: true },
                ),
            )
        }
    }

    const leftCopy = group(
        txt('SNAPSHOT CLONES  ·  COPY-ON-WRITE', -855, -415, 26, COSMOS.cyan, 'mono', 'left'),
        txt('3D Page-Fault', -858, -330, 60, COSMOS.ink, 'serif', 'left'),
        txt('Memory Tree', -858, -260, 60, COSMOS.cyan, 'serif', 'left').glow(6, COSMOS.cyan),
        dot(9, COSMOS.cyan).at(-840, -148).glow(9, COSMOS.cyan),
        txt('36 shared read-only pages', -810, -148, 28, COSMOS.cyan, 'sans', 'left'),
        dot(9, COSMOS.gold).at(-840, -88).glow(9, COSMOS.gold),
        txt('Clone A  (dirty CoW cubes)', -810, -88, 28, COSMOS.gold, 'sans', 'left'),
        dot(9, COSMOS.emerald).at(-840, -28).glow(9, COSMOS.emerald),
        txt('Clone B  (dirty CoW cubes)', -810, -28, 28, COSMOS.emerald, 'sans', 'left'),
        dot(9, COSMOS.violet).at(-840, 32).glow(9, COSMOS.violet),
        txt('Clone C  (dirty CoW cubes)', -810, 32, 28, COSMOS.violet, 'sans', 'left'),
    )

    const liveStatus = dynamic(() => {
        const rs = reseed.value
        const dirtyCount = Math.round(Math.min(1, cow.value) * 9)
        const nodes: Node[] = [
            txt(`SHARED: ${36 - dirtyCount} / 36   ·   PRIVATE COW: ${dirtyCount}`, -855, 165, 26, COSMOS.gold, 'mono', 'left'),
        ]
        if (rs > 0.04) {
            nodes.push(
                txt('CLONE HYGIENE ACTIVE', -855, 240, 28, COSMOS.emerald, 'mono', 'left').glow(8, COSMOS.emerald).opacity(rs),
                txt('VMGenID  ·  reseed RNG  ·  unique MAC/IP', -855, 294, 26, COSMOS.rose, 'mono', 'left').opacity(rs),
            )
        }
        return group(...nodes)
    })

    s.add(aura, view3d, leftCopy, liveStatus)

    const fullDur = Math.max(10, c.end - c.start - 0.15)
    c.at(0.05, () => {
        s.play(
            pulse.to(fullDur * 1.1, { duration: fullDur, ease: linear }),
            view3d.orbit({ theta: 0.36, phi: 0.9 }, { duration: fullDur }),
        )
    })
    c.on('first page fault', () => s.play(cow.to(0.45, { duration: 1.8 })))
    c.on('copy-on-write', () => s.play(cow.to(1, { duration: 2.0 })))
    c.on('fresh entropy', () => s.play(reseed.to(1, { duration: 0.9 })))
}

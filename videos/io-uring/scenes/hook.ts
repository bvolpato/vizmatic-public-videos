import {
    Node, circle, curve3d, dot, dynamic, group, line, line3d, linear, parametricSurface,
    point3d, polyPath, radialGradient, scene3d, surface, type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

// 48 crimson syscall streaks slamming across the USER / KERNEL boundary
const STREAKS = Array.from({ length: 48 }, (_, i) => ({
    xOff: -330 + (i / 47) * 680,
    speed: 0.72 + ((i * 29) % 11) * 0.085,
    phase: ((i * 47) % 100) / 100,
    len: 44 + (i % 5) * 18,
}))

export const hook: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const showRings = s.value(0)

    const copy = group(
        txt('LINUX  /  ZERO-SYSCALL I/O', -855, -265, 26, COSMOS.cyan, 'mono', 'left'),
        txt('io_uring', -860, -135, 134, COSMOS.ink, 'serif', 'left').glow(7, COSMOS.cyan),
        txt('From millions of syscalls to zero', -855, -2, 42, COSMOS.gold, 'serif', 'left').glow(6, COSMOS.gold),
        txt('Lock-free shared memory bridging user space & Linux', -855, 86, 28, COSMOS.muted, 'sans', 'left'),
        txt('64 B SQE   ·   16 B CQE   ·   SQPOLL', -855, 152, 26, COSMOS.emerald, 'mono', 'left'),
    )

    // Stage 1A: 48 glowing crimson syscall streaks slamming into USER/KERNEL barrier + KPTI waves!
    const liveStorm = dynamic(() => {
        const r = showRings.value
        const wallOp = Math.max(0, 1 - r * 1.15)
        if (wallOp < 0.03) return []
        const ph = phase.value
        const cx = 315
        const nodes: Node[] = [
            nebula(cx, 0, 480, '#ff6b8b28', '#fb923c12').opacity(wallOp),
            // User / Kernel barrier line with KPTI context-switch overhead wave!
            line([cx - 380, 0], [cx + 420, 0], { stroke: COSMOS.rose, width: 3.5, dash: [12, 8] })
                .glow(10, COSMOS.rose)
                .opacity(wallOp),
            txt('USER SPACE', cx + 410, -395, 26, COSMOS.cyan, 'mono', 'right').opacity(wallOp),
            txt('KPTI  /  CONTEXT SWITCH WALL', cx - 365, -395, 26, COSMOS.rose, 'mono', 'left').opacity(wallOp),
            txt('KERNEL SPACE', cx + 410, 385, 26, COSMOS.amber, 'mono', 'right').opacity(wallOp),
        ]

        // KPTI overhead harmonic wave rippling along the user/kernel boundary
        const wavePts: Vec[] = Array.from({ length: 44 }, (_, i) => {
            const t = i / 43
            const x = cx - 360 + t * 760
            const y = Math.sin(t * 22 - ph * 8.5) * 14 * Math.sin(t * Math.PI)
            return [x, y] as Vec
        })
        nodes.push(
            new Node(polyPath(wavePts)).stroke(COSMOS.amber, 3.0, 0.85 * wallOp).glow(8, COSMOS.amber),
        )

        // 48 crimson syscall streaks slamming vertically into the wall
        for (let i = 0; i < STREAKS.length; i++) {
            const st = STREAKS[i]!
            const u = (ph * st.speed + st.phase) % 1
            const sx = cx + st.xOff
            const sy = -310 + u * 620
            const nearWall = Math.abs(sy) < 38
            const col = nearWall ? COSMOS.gold : COSMOS.rose
            nodes.push(
                line([sx, sy - st.len], [sx, sy], { stroke: col, width: nearWall ? 3.2 : 1.8 })
                    .glow(nearWall ? 10 : 4, col)
                    .opacity((nearWall ? 0.95 : 0.62) * wallOp),
            )
            if (nearWall) {
                nodes.push(dot(5, '#ffffff').at(sx, 0).glow(10, COSMOS.rose).opacity(wallOp))
            }
        }
        return group(...nodes)
    })

    // Stage 1B: Orbiting 3D Dual-Torus Shared-Ring Centerpiece straddling the User/Kernel plane!
    const torusAura = circle(560, {
        fill: radialGradient([0, 0], 560, [
            [0, '#ffd1662c'],
            [0.45, '#6ee7b722'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(315, 10)

    const view3d = scene3d({
        theta: -0.68,
        phi: 1.04,
        distance: 14.8,
        unit: 108,
        perspective: true,
        ambient: 0.45,
        shine: 0.42,
        brightness: 1.15,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(315, -18)

    // Glowing User / Kernel shared-memory plane at z = 0
    view3d.add(
        surface(() => 0, {
            x: [-3.9, 3.9],
            y: [-2.4, 2.4],
            resolution: [18, 12],
            color: '#13283d',
            mesh: COSMOS.cyan,
            meshOpacity: 0.34,
            meshWidth: 0.85,
            opacity: 0.42,
        }),
        line3d([-3.9, -2.4, 0.02], [3.9, -2.4, 0.02], { color: COSMOS.cyan, width: 2.8, glow: 8, blend: 'screen' }),
        line3d([3.9, -2.4, 0.02], [3.9, 2.4, 0.02], { color: COSMOS.cyan, width: 2.8, glow: 8, blend: 'screen' }),
        line3d([3.9, 2.4, 0.02], [-3.9, 2.4, 0.02], { color: COSMOS.cyan, width: 2.8, glow: 8, blend: 'screen' }),
        line3d([-3.9, 2.4, 0.02], [-3.9, -2.4, 0.02], { color: COSMOS.cyan, width: 2.8, glow: 8, blend: 'screen' }),
    )

    // Helper: 3D vertical Torus straddling z = 0 (upper half in User Space, lower half in Kernel Space!)
    const addRingTorus = (xCenter: number, majorR: number, minorR: number, col: string, meshCol: string) => {
        view3d.add(
            parametricSurface(
                (u, v): Vec3 => {
                    const a = u * Math.PI * 2
                    const b = v * Math.PI * 2
                    const rr = majorR + minorR * Math.cos(b)
                    return [xCenter + Math.cos(a) * rr, minorR * Math.sin(b), Math.sin(a) * rr]
                },
                [0, 1],
                [0, 1],
                {
                    resolution: [32, 12],
                    color: col,
                    mesh: meshCol,
                    meshOpacity: 0.42,
                    meshWidth: 0.85,
                    opacity: 0.56,
                    shaded: true,
                },
            ),
            // Glowing centerline track around the torus
            curve3d(
                (t): Vec3 => [xCenter + Math.cos(t) * majorR, 0, Math.sin(t) * majorR],
                0,
                Math.PI * 2,
                { color: col, width: 4.0, glow: 10, blend: 'screen', samples: 64 },
            ),
        )
    }

    // Left Torus: Submission Queue (Gold), Right Torus: Completion Queue (Emerald)
    addRingTorus(-1.72, 1.32, 0.32, COSMOS.gold, '#fff2c2')
    addRingTorus(1.72, 1.32, 0.32, COSMOS.emerald, '#b6f9df')

    // Streaming SQE & CQE glowing packets orbiting both 3D tori!
    for (let k = 0; k < 6; k++) {
        const off = (k / 6) * Math.PI * 2
        view3d.add(
            point3d(
                (): Vec3 => {
                    const a = phase.value * 1.45 + off
                    return [-1.72 + Math.cos(a) * 1.32, 0, Math.sin(a) * 1.32]
                },
                { color: k % 2 === 0 ? '#ffffff' : COSMOS.gold, radius: 7.5, glow: 14, blend: 'screen', onTop: true },
            ),
            point3d(
                (): Vec3 => {
                    const a = -phase.value * 1.45 + off
                    return [1.72 + Math.cos(a) * 1.32, 0, Math.sin(a) * 1.32]
                },
                { color: k % 2 === 0 ? '#ffffff' : COSMOS.emerald, radius: 7.5, glow: 14, blend: 'screen', onTop: true },
            ),
        )
    }

    // Kernel-side transfer arc from SQ bottom to CQ bottom
    view3d.add(
        curve3d(
            (t): Vec3 => {
                const x = -1.72 + t * 3.44
                const z = -1.35 - Math.sin(t * Math.PI) * 0.58
                return [x, 0, z]
            },
            0,
            1,
            { color: COSMOS.cyan, width: 3.6, glow: 10, blend: 'screen', samples: 36 },
        ),
    )

    const torusLabels = dynamic(() => {
        const r = showRings.value
        if (r < 0.08) return []
        return group(
            txt('SQ  (Submission Ring)', 110, -345, 26, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(r),
            txt('CQ  (Completion Ring)', 535, -345, 26, COSMOS.emerald, 'mono').glow(6, COSMOS.emerald).opacity(r),
            txt('SHARED MEMORY  ·  ZERO SYSCALL CROSSINGS', 315, 392, 26, COSMOS.cyan, 'mono').opacity(r),
        )
    })

    const torusGroup = group(torusAura, view3d)
    s.add(liveStorm, torusLabels, copy)

    const fullDur = Math.max(10, c.end - c.start - 0.15)
    c.at(0.05, () => {
        s.play(phase.to(fullDur * 0.72, { duration: fullDur, ease: linear }))
    })
    const zeroDur = Math.max(0.8, c.end - c.cue('all the way to zero').start - 0.15)
    c.show('all the way to zero', torusGroup)
    c.on('all the way to zero', () => {
        s.play(
            showRings.to(1, { duration: 0.85 }),
            view3d.orbit({ theta: -0.22, phi: 0.94 }, { duration: zeroDur }),
        )
    })
}

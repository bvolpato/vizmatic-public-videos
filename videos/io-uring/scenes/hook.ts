import {
    Node, circle, curve3d, dot, dynamic, group, line, line3d, linear, parametricSurface,
    point3d, polyPath, radialGradient, scene3d, surface, type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

// 48 crimson syscall streaks slamming across the USER / KERNEL boundary
const STREAKS = Array.from({ length: 48 }, (_, i) => ({
    xOff: -560 + (i / 47) * 1120,
    speed: 0.72 + ((i * 29) % 11) * 0.085,
    phase: ((i * 47) % 100) / 100,
    len: 46 + (i % 5) * 18,
}))

export const hook: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const showRings = s.value(0)

    // Monumental Bottom-Center Cinema Title (IMAX lower-third anchor cleanly below the 3D twin tori)
    const copy = group(
        txt('io_uring', 0, 272, 126, COSMOS.ink, 'serif', 'center').glow(9, COSMOS.cyan),
        txt('From millions of syscalls to zero', 0, 366, 42, COSMOS.gold, 'serif', 'center').glow(7, COSMOS.gold),
        txt('LINUX ZERO-SYSCALL I/O   ·   64 B SQE   ·   16 B CQE   ·   SQPOLL', 0, 428, 26, COSMOS.emerald, 'mono', 'center'),
    )

    // Stage 1A: Wide centered crimson syscall storm slamming into USER / KERNEL wall
    const liveStorm = dynamic(() => {
        const r = showRings.value
        const wallOp = Math.max(0, 1 - r * 2.8)
        if (wallOp < 0.03) return []
        const ph = phase.value
        const cy = -125
        const nodes: Node[] = [
            nebula(0, cy, 560, '#ff6b8b28', '#fb923c12').opacity(wallOp),
            line([-640, cy], [640, cy], { stroke: COSMOS.rose, width: 3.8, dash: [12, 8] })
                .glow(10, COSMOS.rose)
                .opacity(wallOp),
            txt('KPTI  /  CONTEXT SWITCH WALL', -640, -405, 26, COSMOS.rose, 'mono', 'left').opacity(wallOp),
            txt('USER SPACE', 640, -405, 26, COSMOS.cyan, 'mono', 'right').opacity(wallOp),
            txt('KERNEL SPACE', 640, 145, 26, COSMOS.amber, 'mono', 'right').opacity(wallOp),
        ]

        const wavePts: Vec[] = Array.from({ length: 56 }, (_, i) => {
            const t = i / 55
            const x = -620 + t * 1240
            const y = cy + Math.sin(t * 24 - ph * 8.5) * 14 * Math.sin(t * Math.PI)
            return [x, y] as Vec
        })
        nodes.push(
            new Node(polyPath(wavePts)).stroke(COSMOS.amber, 3.0, 0.85 * wallOp).glow(8, COSMOS.amber),
        )

        for (let i = 0; i < STREAKS.length; i++) {
            const st = STREAKS[i]!
            const u = (ph * st.speed + st.phase) % 1
            const sx = st.xOff
            // Keep streaks strictly below top header labels (y >= -355) and above bottom title
            const sy = cy - 175 + u * 380
            const yTop = Math.max(cy - 210, sy - st.len)
            const nearWall = Math.abs(sy - cy) < 34
            const col = nearWall ? COSMOS.gold : COSMOS.rose
            nodes.push(
                line([sx, yTop], [sx, sy], { stroke: col, width: nearWall ? 3.2 : 1.8 })
                    .glow(nearWall ? 10 : 4, col)
                    .opacity((nearWall ? 0.95 : 0.62) * wallOp),
            )
            if (nearWall) {
                nodes.push(dot(5, '#ffffff').at(sx, cy).glow(10, COSMOS.rose).opacity(wallOp))
            }
        }
        return group(...nodes)
    })

    // Stage 1B: Monumental Centered 3D Dual-Torus Shared-Ring Centerpiece dominating upper 65%
    const torusAura = circle(580, {
        fill: radialGradient([0, 0], 580, [
            [0, '#ffd16634'],
            [0.45, '#6ee7b726'],
            [0.75, '#5ce1e614'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(0, -155).set('blend', 'screen')

    const view3d = scene3d({
        theta: -0.64,
        phi: 1.06,
        distance: 15.0,
        unit: 102,
        perspective: true,
        ambient: 0.45,
        shine: 0.44,
        brightness: 1.16,
        fog: 0.06,
        focus: [0, 0, 0],
    }).at(0, -162)

    // Glowing User / Kernel shared-memory plane at z = 0
    view3d.add(
        surface(() => 0, {
            x: [-4.1, 4.1],
            y: [-2.4, 2.4],
            resolution: [18, 12],
            color: '#13283d',
            mesh: COSMOS.cyan,
            meshOpacity: 0.36,
            meshWidth: 0.85,
            opacity: 0.44,
        }),
        line3d([-4.1, -2.4, 0.02], [4.1, -2.4, 0.02], { color: COSMOS.cyan, width: 3.0, glow: 8, blend: 'screen' }),
        line3d([4.1, -2.4, 0.02], [4.1, 2.4, 0.02], { color: COSMOS.cyan, width: 3.0, glow: 8, blend: 'screen' }),
        line3d([4.1, 2.4, 0.02], [-4.1, 2.4, 0.02], { color: COSMOS.cyan, width: 3.0, glow: 8, blend: 'screen' }),
        line3d([-4.1, 2.4, 0.02], [-4.1, -2.4, 0.02], { color: COSMOS.cyan, width: 3.0, glow: 8, blend: 'screen' }),
    )

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
                    meshOpacity: 0.44,
                    meshWidth: 0.85,
                    opacity: 0.58,
                    shaded: true,
                },
            ),
            curve3d(
                (t): Vec3 => [xCenter + Math.cos(t) * majorR, 0, Math.sin(t) * majorR],
                0,
                Math.PI * 2,
                { color: col, width: 4.2, glow: 10, blend: 'screen', samples: 64 },
            ),
        )
    }

    addRingTorus(-1.76, 1.36, 0.34, COSMOS.gold, '#fff2c2')
    addRingTorus(1.76, 1.36, 0.34, COSMOS.emerald, '#b6f9df')

    for (let k = 0; k < 6; k++) {
        const off = (k / 6) * Math.PI * 2
        view3d.add(
            point3d(
                (): Vec3 => {
                    const a = phase.value * 1.45 + off
                    return [-1.76 + Math.cos(a) * 1.36, 0, Math.sin(a) * 1.36]
                },
                { color: k % 2 === 0 ? '#ffffff' : COSMOS.gold, radius: 8.0, glow: 14, blend: 'screen', onTop: true },
            ),
            point3d(
                (): Vec3 => {
                    const a = -phase.value * 1.45 + off
                    return [1.76 + Math.cos(a) * 1.36, 0, Math.sin(a) * 1.36]
                },
                { color: k % 2 === 0 ? '#ffffff' : COSMOS.emerald, radius: 8.0, glow: 14, blend: 'screen', onTop: true },
            ),
        )
    }

    view3d.add(
        curve3d(
            (t): Vec3 => {
                const x = -1.76 + t * 3.52
                const z = -1.38 - Math.sin(t * Math.PI) * 0.6
                return [x, 0, z]
            },
            0,
            1,
            { color: COSMOS.cyan, width: 3.8, glow: 10, blend: 'screen', samples: 36 },
        ),
    )

    // Clean flanking labels outside the twin tori (sequential fade prevents crossfade overlap with Stage 1A)
    const torusLabels = dynamic(() => {
        const r = showRings.value
        if (r < 0.45) return []
        const op = Math.min(1, (r - 0.45) * 2.2)
        return group(
            txt('SQ  ·  SUBMISSION RING', -850, -395, 26, COSMOS.gold, 'mono', 'left').glow(6, COSMOS.gold).opacity(op),
            txt('CQ  ·  COMPLETION RING', 850, -395, 26, COSMOS.emerald, 'mono', 'right').glow(6, COSMOS.emerald).opacity(op),
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

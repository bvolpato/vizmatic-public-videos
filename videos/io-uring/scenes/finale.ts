import {
    Node, circle, curve3d, dot, dynamic, group, line, line3d, linear, parametricSurface,
    point3d, polyPath, radialGradient, rect, scene3d, type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const finale: SceneFunction = (s, c) => {
    const showPolicy = s.value(1)
    const phase = s.value(0)
    const restrict = s.value(0)
    const showEnd = s.value(0)

    const policyHeader = group(
        txt('SECURITY BOUNDARY  ·  SECCOMP VS IO_URING', 0, -425, 26, COSMOS.rose, 'mono'),
        txt('Close the Second Door into the Kernel', 0, -360, 56, COSMOS.ink, 'serif').glow(5, COSMOS.rose),
    )

    // Stage 1: Explicit seccomp syscall gate + io_uring bypass tunnel + IORING_REGISTER_RESTRICTIONS emerald lock!
    const livePolicy = dynamic(() => {
        if (showPolicy.value < 0.04) return []
        const a = showPolicy.value
        const ph = phase.value
        const rs = restrict.value

        const gateX = 0
        const nodes: Node[] = [
            nebula(0, 20, 520, rs > 0.35 ? '#6ee7b722' : '#ff6b8b28').opacity(a),
            // Left User App & Right Linux Kernel chambers
            rect(260, 440, { fill: '#0e1628', stroke: COSMOS.cyan, width: 3, radius: 16 }).at(-680, 15).glow(8, COSMOS.cyan).opacity(a),
            txt('User Process', -680, -140, 30, COSMOS.cyan, 'serif').opacity(a),
            txt('Untrusted', -680, -96, 26, COSMOS.muted, 'mono').opacity(a),
            txt('worker', -680, -58, 26, COSMOS.muted, 'mono').opacity(a),

            rect(260, 440, { fill: '#121826', stroke: COSMOS.amber, width: 3, radius: 16 }).at(680, 15).glow(8, COSMOS.amber).opacity(a),
            txt('Linux Kernel', 680, -140, 30, COSMOS.amber, 'serif').opacity(a),
            txt('VFS · Net', 680, -96, 26, COSMOS.muted, 'mono').opacity(a),
            txt('Syscalls', 680, -58, 26, COSMOS.muted, 'mono').opacity(a),

            // Upper crimson seccomp syscall gate wall (blocks classic syscalls cleanly!)
            rect(74, 240, { fill: '#2a101d', stroke: COSMOS.rose, width: 4, radius: 10 })
                .at(gateX, -110)
                .glow(12, COSMOS.rose)
                .opacity(a),
            txt('seccomp-bpf', gateX, -258, 28, COSMOS.rose, 'mono').glow(6, COSMOS.rose).opacity(a),

            // Blocked classic syscalls hitting the crimson seccomp wall
            line([-545, -155], [-46, -155], { stroke: COSMOS.rose, width: 3.5 }).glow(8, COSMOS.rose).opacity(a),
            line([-545, -75], [-46, -75], { stroke: COSMOS.rose, width: 3.5 }).glow(8, COSMOS.rose).opacity(a),
            txt('openat()  BLOCKED', -295, -190, 26, COSMOS.rose, 'mono').opacity(a),
            txt('execve()  BLOCKED', -295, -110, 26, COSMOS.rose, 'mono').opacity(a),
            dot(9, COSMOS.rose).at(-46, -155).glow(12, COSMOS.rose).opacity(a),
            dot(9, COSMOS.rose).at(-46, -75).glow(12, COSMOS.rose).opacity(a),
        ]

        // Lower path: io_uring ring tunneling UNDER the seccomp wall!
        const tunnelY = 148
        const tunCol = rs > 0.35 ? COSMOS.emerald : COSMOS.rose
        const tunnelPts: Vec[] = [[-545, 75], [-320, tunnelY], [320, tunnelY], [545, 75]]
        nodes.push(
            new Node(polyPath(tunnelPts)).stroke(tunCol, 5.5, 0.92 * a).glow(12, tunCol),
            txt(
                rs > 0.35 ? 'OP_READ / OP_WRITE ALLOWED' : 'UNGUARDED IO_URING BYPASSES SECCOMP!',
                0,
                tunnelY + 114,
                28,
                rs > 0.35 ? COSMOS.emerald : COSMOS.rose,
                'mono',
            ).glow(8, tunCol).opacity(a),
        )

        // Streaming packets through the lower tunnel
        for (let k = 0; k < 3; k++) {
            const u = (ph * 0.55 + k * 0.33) % 1
            const px = -320 + u * 640
            const blockedOp = rs > 0.35 && k === 2
            const drawX = blockedOp ? Math.min(-62, px) : px
            nodes.push(
                dot(9, blockedOp ? COSMOS.rose : rs > 0.35 ? COSMOS.emerald : COSMOS.amber)
                    .at(drawX, tunnelY)
                    .glow(14, blockedOp ? COSMOS.rose : tunCol)
                    .opacity(a),
            )
        }

        // Emerald IORING_REGISTER_RESTRICTIONS allowlist ring snapping shut over the tunnel!
        if (rs > 0.04) {
            const lockScale = 0.4 + rs * 0.6
            nodes.push(
                circle(78 * lockScale, { fill: '#0e2420', stroke: COSMOS.emerald, width: 5 })
                    .at(gateX, tunnelY)
                    .glow(16, COSMOS.emerald)
                    .opacity(rs * a),
                circle(52 * lockScale, { fill: null, stroke: COSMOS.gold, width: 2.5, dash: [8, 6] })
                    .at(gateX, tunnelY)
                    .opacity(rs * a),
                txt('ALLOW', gateX, tunnelY, 26, COSMOS.emerald, 'mono').opacity(rs * a),
                txt('IORING_REGISTER_RESTRICTIONS', 0, 340, 30, COSMOS.gold, 'mono')
                    .glow(8, COSMOS.gold)
                    .opacity(rs * a),
            )
        }

        return group(...nodes)
    })

    // ── Stage 2: Orbiting 3D Twin-Torus Closing Emblem ──
    const endAura = circle(520, {
        fill: radialGradient([0, 0], 520, [
            [0, '#6ee7b72c'],
            [0.45, '#ffd1661c'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(0, -145)

    const endView = scene3d({
        theta: -0.55,
        phi: 1.02,
        distance: 13.8,
        unit: 112,
        perspective: true,
        ambient: 0.45,
        shine: 0.4,
        brightness: 1.15,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(0, -140)

    const addEndTorus = (xC: number, col: string, meshCol: string) => {
        const R = 1.18
        const r = 0.26
        endView.add(
            parametricSurface(
                (u, v): Vec3 => {
                    const a = u * Math.PI * 2
                    const b = v * Math.PI * 2
                    const rr = R + r * Math.cos(b)
                    return [xC + Math.cos(a) * rr, r * Math.sin(b), Math.sin(a) * rr]
                },
                [0, 1],
                [0, 1],
                { resolution: [28, 10], color: col, mesh: meshCol, meshOpacity: 0.4, opacity: 0.56, shaded: true },
            ),
            curve3d(
                (t): Vec3 => [xC + Math.cos(t) * R, 0, Math.sin(t) * R],
                0,
                Math.PI * 2,
                { color: col, width: 3.6, glow: 10, blend: 'screen', samples: 48 },
            ),
        )
    }

    addEndTorus(-1.35, COSMOS.gold, '#fff2c2')
    addEndTorus(1.35, COSMOS.emerald, '#b6f9df')
    endView.add(
        point3d(
            (): Vec3 => [-1.35 + Math.cos(phase.value * 1.8) * 1.18, 0, Math.sin(phase.value * 1.8) * 1.18],
            { color: '#ffffff', radius: 9, glow: 16, blend: 'screen', onTop: true },
        ),
        point3d(
            (): Vec3 => [1.35 + Math.cos(-phase.value * 1.8) * 1.18, 0, Math.sin(-phase.value * 1.8) * 1.18],
            { color: '#ffffff', radius: 9, glow: 16, blend: 'screen', onTop: true },
        ),
        line3d([-3.1, 0, 0], [3.1, 0, 0], { color: COSMOS.cyan, width: 2.2, glow: 7, blend: 'screen', opacity: 0.65 }),
    )

    const endWords = group(
        txt('Shared memory turns syscalls into pointers.', 0, 148, 62, COSMOS.ink, 'serif').glow(6, COSMOS.emerald),
        txt('Linux io_uring  ·  SQ / CQ  ·  SQPOLL  ·  O_DIRECT', 0, 240, 28, COSMOS.cyan, 'mono'),
    )

    s.add(policyHeader, livePolicy)

    const fullDur = Math.max(10, c.end - c.start - 0.1)
    c.at(0.05, () => s.play(phase.to(fullDur * 0.9, { duration: fullDur, ease: linear })))
    c.on('explicit restrictions', () => s.play(restrict.to(1, { duration: 0.85 })))

    const endDur = Math.max(2.0, c.end - c.cue('Shared memory turns').start - 0.15)
    c.swap('Shared memory turns', policyHeader, [endAura, endView, endWords])
    c.on('Shared memory turns', () => {
        s.play(
            showPolicy.to(0, { duration: 0.3 }),
            showEnd.to(1, { duration: 0.4 }),
            endView.orbit({ theta: 0.68, phi: 0.94 }, { duration: endDur }),
        )
    })
}

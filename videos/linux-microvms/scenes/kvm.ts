import {
    Node, circle, curve3d, dot, dynamic, group, line3d, linear, parametricSurface, point3d,
    radialGradient, scene3d, surface, type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

export const kvm: SceneFunction = (s, c) => {
    const trip = s.value(0)
    const eptOn = s.value(0)
    const amb = s.value(0)

    const aura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#ffd16624'],
            [0.45, '#5ce1e618'],
            [0.8, '#a78bfa14'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(205, 20)

    const view3d = scene3d({
        theta: -0.64,
        phi: 1.24,
        distance: 16.0,
        unit: 114,
        perspective: true,
        ambient: 0.45,
        shine: 0.36,
        brightness: 1.14,
        fog: 0.08,
        focus: [0, 0, 0.05],
    }).at(215, 25)

    // 3 Hardware-Virtualization Planes:
    // z = +1.75: VMX Non-Root Guest Kernel
    // z =  0.00: VMX Root Host Kernel (Linux KVM)
    // z = -1.65: User-Space VMM (Firecracker / QEMU)
    const addPlane = (z: number, xSpan: readonly [number, number], ySpan: readonly [number, number], col: string, meshCol: string) => {
        const [x0, x1] = xSpan
        const [y0, y1] = ySpan
        view3d.add(
            surface(() => z, {
                x: xSpan,
                y: ySpan,
                resolution: [16, 12],
                color: col,
                mesh: meshCol,
                meshOpacity: 0.36,
                meshWidth: 0.85,
                opacity: 0.46,
            }),
            line3d([x0, y0, z + 0.02], [x1, y0, z + 0.02], { color: col, width: 3.0, glow: 8, blend: 'screen' }),
            line3d([x1, y0, z + 0.02], [x1, y1, z + 0.02], { color: col, width: 3.0, glow: 8, blend: 'screen' }),
            line3d([x1, y1, z + 0.02], [x0, y1, z + 0.02], { color: col, width: 3.0, glow: 8, blend: 'screen' }),
            line3d([x0, y1, z + 0.02], [x0, y0, z + 0.02], { color: col, width: 3.0, glow: 8, blend: 'screen' }),
        )
    }

    addPlane(1.75, [-3.4, 3.4], [-1.5, 1.5], COSMOS.cyan, '#80eeff')
    addPlane(0.0, [-3.6, 3.6], [-1.6, 1.6], COSMOS.gold, '#ffeaad')
    addPlane(-1.65, [-3.2, 3.2], [-1.4, 1.4], COSMOS.emerald, '#9ff7d6')

    // Exact 3D instruction path: Guest native -> VM Exit -> KVM -> User-Space VMM -> KVM -> VM Resume -> Guest
    const WAYS: readonly Vec3[] = [
        [-3.0, -0.6, 1.82],
        [-1.1, -0.6, 1.82],
        [-1.1, -0.6, 0.05],
        [-0.2, 0.4, -1.58],
        [1.1, 0.4, -1.58],
        [1.6, -0.4, 0.05],
        [1.6, -0.4, 1.82],
        [3.1, -0.4, 1.82],
    ]

    const sample3D = (u: number): Vec3 => {
        const segs = WAYS.length - 1
        const sc = Math.max(0, Math.min(segs, u * segs))
        const idx = Math.min(segs - 1, Math.floor(sc))
        const rem = sc - idx
        const a = WAYS[idx]!
        const b = WAYS[idx + 1]!
        return [a[0] + (b[0] - a[0]) * rem, a[1] + (b[1] - a[1]) * rem, a[2] + (b[2] - a[2]) * rem]
    }

    // Glowing 3D instruction trail across the hardware boundary
    view3d.add(
        curve3d(
            (t): Vec3 => sample3D(t * Math.max(0.01, trip.value)),
            0,
            1,
            { color: COSMOS.gold, width: 5.0, glow: 12, blend: 'screen', samples: 72, animate: true },
        ),
        point3d(() => sample3D(Math.max(0.01, trip.value)), {
            color: '#ffffff',
            radius: 10.5,
            glow: 16,
            blend: 'screen',
            onTop: true,
        }),
    )

    // Glowing VMCS Context-Switch Prism dropping across the VMX boundary at x = -1.1, y = -0.6!
    const vmcsZ = () => {
        const u = trip.value
        if (u < 0.14) return 1.82
        if (u < 0.35) return 1.82 - ((u - 0.14) / 0.21) * 1.77
        if (u < 0.72) return 0.05
        if (u < 0.9) return 0.05 + ((u - 0.72) / 0.18) * 1.77
        return 1.82
    }
    const vmcsX = () => (trip.value < 0.55 ? -1.1 : 1.6)
    const vmcsY = () => (trip.value < 0.55 ? -0.6 : -0.4)
    const pR = 0.42

    // Animated VMCS crystal octahedron (reactive position!)
    const octaEdges: readonly [Vec3, Vec3][] = [
        [[pR, 0, 0], [0, pR, 0]],
        [[0, pR, 0], [-pR, 0, 0]],
        [[-pR, 0, 0], [0, -pR, 0]],
        [[0, -pR, 0], [pR, 0, 0]],
        [[pR, 0, 0], [0, 0, pR * 1.4]],
        [[0, pR, 0], [0, 0, pR * 1.4]],
        [[-pR, 0, 0], [0, 0, pR * 1.4]],
        [[0, -pR, 0], [0, 0, pR * 1.4]],
        [[pR, 0, 0], [0, 0, -pR * 1.4]],
        [[0, pR, 0], [0, 0, -pR * 1.4]],
        [[-pR, 0, 0], [0, 0, -pR * 1.4]],
        [[0, -pR, 0], [0, 0, -pR * 1.4]],
    ]
    for (const [ea, eb] of octaEdges) {
        view3d.add(
            line3d(
                (): Vec3 => [vmcsX() + ea[0], vmcsY() + ea[1], vmcsZ() + ea[2]],
                (): Vec3 => [vmcsX() + eb[0], vmcsY() + eb[1], vmcsZ() + eb[2]],
                { color: COSMOS.rose, width: 3.0, glow: 10, blend: 'screen', onTop: true },
            ),
        )
    }

    // 4-Level EPT (Extended Page Tables) translation arcs on the right side (GVA -> PML4 -> PDPT -> PD -> HPA)
    const eptLevels: readonly Vec3[] = [
        [2.65, 1.55, 1.75],
        [2.95, 1.15, 1.25],
        [2.55, 0.75, 0.75],
        [2.95, 0.35, 0.32],
        [2.55, 0.0, 0.02],
    ]
    for (let i = 0; i < eptLevels.length - 1; i++) {
        const a = eptLevels[i]!
        const b = eptLevels[i + 1]!
        const mid: Vec3 = [(a[0] + b[0]) * 0.5 + 0.32, (a[1] + b[1]) * 0.5 + 0.25, (a[2] + b[2]) * 0.5 + 0.14]
        view3d.add(
            curve3d(
                (t): Vec3 => {
                    const u = 1 - t
                    return [
                        u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
                        u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
                        u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
                    ]
                },
                0,
                1,
                { color: COSMOS.violet, width: 3.4, glow: 10, blend: 'screen', samples: 28, onTop: true },
            ),
            point3d(a, { color: COSMOS.violet, radius: 7.5, glow: 12, blend: 'screen', onTop: true }),
        )
    }
    // Live EPT lookup pulse riding the 4-level translation chain
    view3d.add(
        point3d(
            (): Vec3 => {
                const segs = eptLevels.length - 1
                const p = ((amb.value * 0.45) % 1) * segs
                const idx = Math.min(segs - 1, Math.floor(p))
                const rem = p - idx
                const a = eptLevels[idx]!
                const b = eptLevels[idx + 1]!
                return [a[0] + (b[0] - a[0]) * rem, a[1] + (b[1] - a[1]) * rem, a[2] + (b[2] - a[2]) * rem]
            },
            { color: '#ffffff', radius: 7.0, glow: 14, blend: 'screen', onTop: true },
        ),
        // Subtle VMCS exit halo ring on the host boundary plane
        parametricSurface(
            (u, v): Vec3 => {
                const a = u * Math.PI * 2
                const r = 0.28 + v * 0.42
                return [-1.1 + Math.cos(a) * r, -0.6 + Math.sin(a) * r, 0.9]
            },
            [0, 1],
            [0, 1],
            { resolution: [16, 1], color: COSMOS.rose, opacity: 0.25, mesh: false, shaded: false },
        ),
    )

    const leftCopy = group(
        txt('HARDWARE VIRTUALIZATION', -855, -415, 26, COSMOS.gold, 'mono', 'left'),
        txt('VM Exit &', -858, -330, 62, COSMOS.ink, 'serif', 'left'),
        txt('VM Resume', -858, -258, 62, COSMOS.cyan, 'serif', 'left').glow(6, COSMOS.cyan),
        dot(9, COSMOS.cyan).at(-840, -148).glow(9, COSMOS.cyan),
        txt('VMX Non-Root (Guest)', -810, -148, 28, COSMOS.cyan, 'mono', 'left'),
        dot(9, COSMOS.gold).at(-840, -88).glow(9, COSMOS.gold),
        txt('VMX Root (Host KVM)', -810, -88, 28, COSMOS.gold, 'mono', 'left'),
        dot(9, COSMOS.emerald).at(-840, -28).glow(9, COSMOS.emerald),
        txt('User-Space VMM', -810, -28, 28, COSMOS.emerald, 'mono', 'left'),
        dot(9, COSMOS.rose).at(-840, 32).glow(9, COSMOS.rose),
        txt('VMCS Context Prism', -810, 32, 28, COSMOS.rose, 'mono', 'left'),
        dot(9, COSMOS.violet).at(-840, 92).glow(9, COSMOS.violet),
        txt('4-Level EPT Walk', -810, 92, 28, COSMOS.violet, 'mono', 'left'),
    )

    const liveCounter = dynamic(() => {
        const u = trip.value
        const us = (u * 4.2).toFixed(1)
        const stageLabel = u < 0.2
            ? 'NATIVE GUEST EXECUTION'
            : u < 0.45
              ? 'VM EXIT -> KVM TRAP'
              : u < 0.72
                ? 'VMM VIRTIO EMULATION'
                : 'VM RESUME -> GUEST'
        const stCol = u < 0.2 ? COSMOS.cyan : u < 0.45 ? COSMOS.rose : u < 0.72 ? COSMOS.emerald : COSMOS.gold
        const nodes: Node[] = [
            txt(`TRAP LATENCY:  ${us} µs`, -855, 225, 32, stCol, 'mono', 'left').glow(8, stCol),
            txt(stageLabel, -855, 278, 26, COSMOS.muted, 'mono', 'left'),
        ]
        if (eptOn.value > 0.05) {
            nodes.push(
                txt('EPT: GVA -> GPA -> HPA STRICTLY WALLED OFF', -855, 345, 26, COSMOS.violet, 'mono', 'left')
                    .glow(6, COSMOS.violet)
                    .opacity(eptOn.value),
            )
        }
        return group(...nodes)
    })

    s.add(aura, view3d, leftCopy, liveCounter)

    const fullDur = Math.max(10, c.end - c.start - 0.15)
    c.at(0.05, () => {
        s.play(
            amb.to(fullDur, { duration: fullDur, ease: linear }),
            view3d.orbit({ theta: 0.32, phi: 0.92 }, { duration: fullDur }),
        )
    })
    c.on('full speed', () => s.play(trip.to(0.18, { duration: 1.8 })))
    c.on('trapping out', () => s.play(trip.to(0.62, { duration: 3.0 })))
    c.on('drop back', () => s.play(trip.to(1, { duration: 2.2 })))
    c.on('page tables', () => s.play(eptOn.to(1, { duration: 0.7 })))
}

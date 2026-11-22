import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, rect, regularPolygon,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

// 32 legacy QEMU emulated devices collapsing inward when Firecracker replaces the 1.8M LOC monolith!
const LEGACY_32: readonly string[] = [
    'BIOS', 'PCI', 'USB', 'VGA', 'IDE', 'Floppy', 'PS/2', 'ACPI',
    'Sound', 'SCSI', 'ISA', 'APM', 'LPT', 'CD-ROM', 'CMOS', 'RTC',
    'DMA', 'PIC', 'APIC', 'HPET', 'FDC', 'UHCI', 'EHCI', 'XHCI',
    'e1000', 'Cirrus', 'QXL', 'TPM', 'SMBus', 'i8042', 'UART', 'AGP',
]

// 40 allowlisted syscalls inside a 16x12 (192-cell) visual seccomp filter matrix (representing 300+ Linux syscalls)
const ALLOW_SET = new Set<number>([
    1, 4, 9, 14, 19, 24, 30, 35, 42, 48,
    53, 60, 66, 71, 77, 84, 89, 95, 102, 108,
    114, 121, 126, 132, 138, 144, 150, 155, 161, 166,
    171, 175, 180, 184, 188, 12, 27, 58, 99, 147,
])

export const firecracker: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const collapse = s.value(0)
    const fortress = s.value(0)

    const headline = group(
        txt('MINIMAL RUST VMM  ·  ATTACK SURFACE REDUCTION', -855, -425, 26, COSMOS.amber, 'mono', 'left'),
        txt('From 1.8M LOC QEMU to ~50k LOC Firecracker', -855, -360, 52, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.amber),
    )

    const liveScene = dynamic(() => {
        const ph = phase.value
        const col = collapse.value
        const ft = fortress.value
        // Shift Firecracker core gently left when the seccomp syscall matrix enters on the right
        const coreX = -340 * ft
        const coreY = 30
        const nodes: Node[] = [
            nebula(coreX, coreY, 440, ft > 0.25 ? '#6ee7b722' : col > 0.5 ? '#fb923c24' : '#ff6b8b26'),
        ]

        // 32 legacy QEMU device cloud collapsing inward and dissolving!
        const legOp = Math.max(0, 1 - col * 1.15)
        if (legOp > 0.03) {
            for (let i = 0; i < LEGACY_32.length; i++) {
                const ring = i < 16 ? 0 : 1
                const idx = i % 16
                const ang = (idx / 16) * Math.PI * 2 + ph * (ring === 0 ? 0.16 : -0.12) + ring * 0.2
                const baseR = ring === 0 ? 355 : 245
                const r = baseR * (1 - col * 0.72)
                const x = coreX + Math.cos(ang) * r * 1.38
                const y = coreY + Math.sin(ang) * r * 0.68
                nodes.push(
                    line([coreX, coreY], [x, y], { stroke: COSMOS.rose, width: 1.2 }).opacity(0.22 * legOp),
                    dot(ring === 0 ? 7 : 5.5, ring === 0 ? COSMOS.rose : COSMOS.amber)
                        .at(x, y)
                        .glow(8, COSMOS.rose)
                        .opacity(0.9 * legOp),
                )
                // Show crisp non-overlapping labels for 8 major outer devices (size 26), well below header
                if (ring === 0 && idx % 2 === 0) {
                    const lx = coreX + Math.cos(ang) * (baseR + 48) * 1.42
                    const ly = coreY + Math.sin(ang) * (baseR + 36) * 0.72
                    nodes.push(txt(LEGACY_32[i]!, lx, ly, 26, COSMOS.rose, 'mono').opacity(legOp))
                }
            }
            nodes.push(
                txt('QEMU MONOLITH:  ~1.8M LOC  ·  30+ LEGACY DEVICES', 0, 385, 28, COSMOS.rose, 'mono')
                    .glow(6, COSMOS.rose)
                    .opacity(legOp),
            )
        }

        // Firecracker minimal Rust VMM core + 3 animated virtio ring streams (virtio-blk, virtio-net, vsock)
        const fcCol = col > 0.4 ? COSMOS.amber : COSMOS.rose
        nodes.push(
            circle(102, { fill: '#12182b', stroke: fcCol, width: 4 }).at(coreX, coreY).glow(14, fcCol),
            txt(col > 0.35 ? 'Firecracker' : 'QEMU VMM', coreX, coreY - 16, 28, COSMOS.ink, 'serif'),
            txt(col > 0.35 ? '~50k LOC Rust' : '1.8M LOC C', coreX, coreY + 22, 26, fcCol, 'mono'),
        )

        const virtioOp = Math.min(1, col * 1.3)
        if (virtioOp > 0.04) {
            const rings = [
                { name: 'virtio-blk', ang: -Math.PI / 2, col: COSMOS.cyan, lx: 0, ly: -38 },
                { name: 'virtio-net', ang: Math.PI / 6, col: COSMOS.emerald, lx: 18, ly: 42 },
                { name: 'vsock', ang: (5 * Math.PI) / 6, col: COSMOS.gold, lx: -18, ly: 42 },
            ] as const
            const rStart = 104
            const rDist = 172
            for (let i = 0; i < rings.length; i++) {
                const rg = rings[i]!
                const sx = coreX + Math.cos(rg.ang) * rStart
                const sy = coreY + Math.sin(rg.ang) * rStart
                const vx = coreX + Math.cos(rg.ang) * rDist
                const vy = coreY + Math.sin(rg.ang) * rDist
                const u = (ph * 0.9 + i * 0.33) % 1
                const px = sx + (vx - sx) * u
                const py = sy + (vy - sy) * u
                nodes.push(
                    line([sx, sy], [vx, vy], { stroke: rg.col, width: 3 }).opacity(0.75 * virtioOp).glow(8, rg.col),
                    dot(7.5, '#ffffff').at(px, py).glow(12, rg.col).opacity(virtioOp),
                    circle(20, { fill: '#0e1a2a', stroke: rg.col, width: 3 }).at(vx, vy).glow(10, rg.col).opacity(virtioOp),
                    txt(rg.name, vx + rg.lx, vy + rg.ly, 26, rg.col, 'mono').opacity(virtioOp),
                )
            }
            if (ft < 0.35) {
                nodes.push(
                    txt('< 5 MiB overhead  ·  ~125 ms cold boot  ·  3 virtio devices', 0, 385, 28, COSMOS.cyan, 'mono')
                        .opacity(virtioOp * (1 - ft * 2.5)),
                )
            }
        }

        // Layered Fortress: visible chroot jailer + cgroups walls around core + 16x12 Linux syscall seccomp matrix on right!
        if (ft > 0.04) {
            nodes.push(
                regularPolygon(6, 286, { fill: null, stroke: COSMOS.gold, width: 3.5, dash: [14, 8] })
                    .at(coreX, coreY)
                    .glow(10, COSMOS.gold)
                    .opacity(ft),
                regularPolygon(6, 322, { fill: null, stroke: COSMOS.emerald, width: 3.5 })
                    .at(coreX, coreY)
                    .glow(12, COSMOS.emerald)
                    .opacity(ft * 0.92),
                txt('chroot jailer  +  cgroups', coreX, 396, 26, COSMOS.emerald, 'mono').opacity(ft),
            )

            // Right side: 16x12 Linux Syscall Filter Matrix (300+ syscalls blocked crimson, ~40 emerald seccomp allowlist!)
            const matCx = 465
            const matCy = 25
            const cols = 16
            const rows = 12
            const cw = 38
            const ch = 38
            const gx0 = matCx - ((cols - 1) * cw) / 2
            const gy0 = matCy - ((rows - 1) * ch) / 2

            nodes.push(
                rect(cols * cw + 34, rows * ch + 34, {
                    fill: '#0a101f',
                    stroke: COSMOS.emerald,
                    width: 3,
                    radius: 14,
                }).at(matCx, matCy).glow(10, COSMOS.emerald).opacity(ft),
                txt('SECCOMP SYSCALL FILTER MATRIX', matCx, matCy - (rows * ch) / 2 - 44, 26, COSMOS.gold, 'mono').opacity(ft),
                txt('~40 allowed (emerald)  ·  300+ blocked (crimson)', matCx, matCy + (rows * ch) / 2 + 54, 26, COSMOS.emerald, 'mono').opacity(ft),
            )

            for (let idx = 0; idx < cols * rows; idx++) {
                const rr = Math.floor(idx / cols)
                const cc = idx % cols
                const cx = gx0 + cc * cw
                const cy = gy0 + rr * ch
                const allowed = ALLOW_SET.has(idx)
                const shimmer = allowed ? 0.72 + 0.28 * Math.sin(ph * 4 + idx * 0.7) : 0.65
                nodes.push(
                    rect(cw - 8, ch - 8, {
                        fill: allowed ? '#12382c' : '#2a0e1a',
                        stroke: allowed ? COSMOS.emerald : '#6b1d32',
                        width: allowed ? 2.4 : 1.2,
                        radius: 4,
                    }).at(cx, cy).glow(allowed ? 7 : 0, COSMOS.emerald).opacity(ft * shimmer),
                )
            }
        }

        return group(...nodes)
    })

    s.add(headline, liveScene)

    const fullDur = Math.max(10, c.end - c.start - 0.1)
    c.at(0.05, () => s.play(phase.to(fullDur, { duration: fullDur, ease: linear })))
    c.on('replaces the monitor', () => s.play(collapse.to(1, { duration: 2.2 })))
    c.on('layered fortress', () => s.play(fortress.to(1, { duration: 1.2 })))
}

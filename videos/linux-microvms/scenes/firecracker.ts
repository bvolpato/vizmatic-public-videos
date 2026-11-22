import { Node, circle, dot, dynamic, group, regularPolygon, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

const LEGACY = ['BIOS', 'USB', 'PCI Bus', 'VGA', 'Floppy', 'PS/2', 'IDE', 'Sound']
const MINIMAL = ['virtio-blk', 'virtio-net', 'serial']

export const firecracker: SceneFunction = (s, c) => {
    const strip = s.value(0)
    const fortress = s.value(0)

    const headline = group(
        txt('Firecracker: Minimal Rust VMM', -830, -405, 58, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.amber),
        txt('Strip decades of legacy devices · wrap in seccomp & jailer', -830, -335, 28, COSMOS.muted, 'sans', 'left'),
    )

    const liveCore = dynamic(() => {
        const st = strip.value
        const ft = fortress.value
        const nodes: Node[] = [
            nebula(0, 40, 440, ft > 0.2 ? '#6ee7b724' : '#ff6b8b1e'),
            circle(115, { fill: '#12182b', stroke: COSMOS.amber, width: 4 }).at(0, 40).glow(12, COSMOS.amber),
            txt('Firecracker', 0, 26, 32, COSMOS.ink, 'serif'),
            txt('1 Rust process', 0, 66, 26, COSMOS.amber, 'mono'),
        ]

        // Legacy QEMU devices orbiting far out -> dissolving into space!
        const legAlpha = Math.max(0, 1 - st)
        if (legAlpha > 0.02) {
            LEGACY.forEach((name, i) => {
                const a = (i * Math.PI * 2) / LEGACY.length - Math.PI / 2
                const r = 385 + st * 90
                const x = Math.cos(a) * r
                const y = 40 + Math.sin(a) * r * 0.76
                nodes.push(
                    dot(6, COSMOS.rose).at(x, y - 24).opacity(legAlpha * 0.85).glow(8, COSMOS.rose),
                    txt(name, x, y + 6, 26, COSMOS.rose, 'mono').opacity(legAlpha),
                )
            })
        }

        // Minimal virtio trio glowing crisply right around the core
        MINIMAL.forEach((name, i) => {
            const a = -Math.PI / 2 + (i * Math.PI * 2) / 3
            const r = 175
            const x = Math.cos(a) * r
            const y = 40 + Math.sin(a) * r * 0.85
            nodes.push(
                dot(8, COSMOS.cyan).at(x, y).glow(12, COSMOS.cyan),
                txt(name, x + (i === 1 ? 85 : i === 2 ? -85 : 0), y + (i === 0 ? -36 : 36), 26, COSMOS.cyan, 'mono'),
            )
        })

        // Layered seccomp + cgroups + chroot jailer fortress rings
        if (ft > 0.04) {
            nodes.push(
                regularPolygon(6, 330, { fill: null, stroke: COSMOS.gold, width: 3.5, dash: [14, 8] }).at(0, 40).opacity(ft).glow(10, COSMOS.gold),
                regularPolygon(6, 385, { fill: null, stroke: COSMOS.emerald, width: 3 }).at(0, 40).opacity(ft * 0.85).glow(10, COSMOS.emerald),
                txt('seccomp  ·  cgroups  ·  chroot jailer', 0, 445, 30, COSMOS.emerald, 'mono').opacity(ft),
            )
        }
        return group(...nodes)
    })

    s.add(headline, liveCore)
    c.on('replaces the monitor', () => s.play(strip.to(1, { duration: 2.2 })))
    c.on('layered fortress', () => s.play(fortress.to(1, { duration: 1.4 })))
}

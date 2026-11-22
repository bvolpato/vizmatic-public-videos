import { circle, dot, dynamic, group, linear, regularPolygon, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const finale: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const showEnd = s.value(0)

    const spectrum = group(
        txt('Choosing the Right Isolation Boundary', 0, -395, 58, COSMOS.ink, 'serif').glow(5, COSMOS.cyan),
        ...([
            [-630, 'Containers', 'Shared kernel', COSMOS.blue],
            [-210, 'gVisor', 'User-space kernel', COSMOS.violet],
            [210, 'Firecracker', 'KVM microVM', COSMOS.gold],
            [630, 'Full QEMU', 'Legacy OS & devices', COSMOS.dim],
        ] as const).map(([x, name, sub, col]) =>
            group(
                regularPolygon(6, 128, { fill: '#111626', stroke: col, width: col === COSMOS.gold ? 4.5 : 2.5 }).at(x, 0).glow(col === COSMOS.gold ? 14 : 6, col),
                txt(name, x, -4, 26, col, 'mono'),
                txt(sub, x, 168, 26, COSMOS.muted, 'sans'),
            ),
        ),
    )

    const closingWords = group(
        txt('Hardware isolation at container speed.', 0, 128, 66, COSMOS.ink, 'serif').glow(6, COSMOS.cyan),
        txt('Linux KVM  ·  Rust VMM  ·  seccomp  ·  Copy-on-Write', 0, 224, 28, COSMOS.gold, 'mono'),
    )

    const liveEmblem = dynamic(() => {
        if (showEnd.value < 0.02) return []
        const a = showEnd.value
        const p = phase.value
        return group(
            nebula(0, -140, 420, '#5ce1e62c', '#ffd16614').opacity(a),
            circle(145 + Math.sin(p) * 8, { fill: null, stroke: COSMOS.gold, width: 3 }).at(0, -140).opacity(0.8 * a).glow(10, COSMOS.gold),
            regularPolygon(6, 96, { fill: '#111626', stroke: COSMOS.cyan, width: 4 }).at(0, -140).glow(12, COSMOS.cyan).opacity(a),
            dot(8, '#ffffff').at(0, -140).glow(14, COSMOS.gold).opacity(a),
        )
    })

    s.add(spectrum)
    c.on('Hardware isolation', () => {
        s.play(showEnd.to(1, { duration: 0.45 }))
        s.play(phase.to(5.0, { duration: 4.5, ease: linear }))
    })
    c.swap('Hardware isolation', spectrum, closingWords)
    s.add(liveEmblem)
}

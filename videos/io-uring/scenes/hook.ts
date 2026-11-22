import { Node, circle, dot, dynamic, group, line, linear, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const hook: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const showRings = s.value(0)

    const copy = group(
        txt('LINUX  /  ZERO-SYSCALL I/O', -840, -230, 26, COSMOS.cyan, 'mono', 'left'),
        txt('io_uring', -848, -98, 128, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.cyan),
        txt('From millions of syscalls to zero', -840, 32, 40, COSMOS.gold, 'serif', 'left').glow(6, COSMOS.gold),
        txt('Two shared memory rings bridging user space and Linux', -840, 128, 30, COSMOS.muted, 'sans', 'left'),
    )

    const liveArt = dynamic(() => {
        const ph = phase.value
        const r = showRings.value
        const cx = 380
        const nodes: Node[] = [
            nebula(cx, 0, 460, r > 0.3 ? '#6ee7b724' : '#ff6b8b22'),
            line([cx - 320, 0], [cx + 380, 0], { stroke: r > 0.3 ? COSMOS.emerald : COSMOS.rose, width: 3, dash: [10, 8] }).glow(8, r > 0.3 ? COSMOS.emerald : COSMOS.rose),
            txt('USER SPACE', cx + 360, -255, 26, COSMOS.dim, 'mono', 'right'),
            txt('KERNEL SPACE', cx + 360, 255, 26, COSMOS.dim, 'mono', 'right'),
        ]
        if (r < 0.8) {
            const wallOp = 1 - r
            for (let i = 0; i < 6; i++) {
                const x = cx - 220 + i * 95
                const y = -200 + (((ph * 1.4 + i * 0.23) % 1) * 400)
                nodes.push(
                    line([x, -180], [x, 180], { stroke: COSMOS.rose, width: 1.5 }).opacity(0.25 * wallOp),
                    dot(7, COSMOS.rose).at(x, y).glow(10, COSMOS.rose).opacity(wallOp),
                )
            }
        }
        if (r > 0.05) {
            nodes.push(
                circle(120, { fill: '#0e1624', stroke: COSMOS.gold, width: 4.5 }).at(cx - 115, 0).glow(10, COSMOS.gold).opacity(r),
                txt('SQ', cx - 115, 0, 42, COSMOS.gold, 'mono').opacity(r),
                circle(120, { fill: '#0e1624', stroke: COSMOS.emerald, width: 4.5 }).at(cx + 155, 0).glow(10, COSMOS.emerald).opacity(r),
                txt('CQ', cx + 155, 0, 42, COSMOS.emerald, 'mono').opacity(r),
            )
        }
        return group(...nodes)
    })

    s.add(liveArt, copy)
    c.at(0.05, () => s.play(phase.to(3.5, { duration: 11, ease: linear })))
    c.on('all the way to zero', () => s.play(showRings.to(1, { duration: 1.0 })))
}

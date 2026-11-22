import { circle, dot, dynamic, group, linear, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const finale: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const showEnd = s.value(0)

    const policyView = group(
        txt('Security Boundary: Lock Down the Rings', 0, -370, 56, COSMOS.rose, 'serif').glow(5, COSMOS.rose),
        txt('seccomp alone misses operations queued inside io_uring', 0, -280, 30, COSMOS.muted, 'sans'),
        txt('Enforce IORING_REGISTER_RESTRICTIONS for untrusted workers', 0, 260, 30, COSMOS.gold, 'mono'),
    )

    const endWords = group(
        txt('Shared memory turns syscalls into pointers.', 0, 132, 64, COSMOS.ink, 'serif').glow(6, COSMOS.emerald),
        txt('Linux io_uring  ·  SQ / CQ  ·  SQPOLL  ·  O_DIRECT', 0, 228, 28, COSMOS.cyan, 'mono'),
    )

    const liveRings = dynamic(() => {
        const a = showEnd.value
        const p = phase.value
        const y = a > 0.5 ? -135 : 0
        return group(
            nebula(0, y, 420, '#6ee7b722', '#ffd16614'),
            circle(115, { fill: '#0e1624', stroke: COSMOS.gold, width: 4.5 }).at(-90, y).glow(12, COSMOS.gold),
            circle(115, { fill: '#0e1624', stroke: COSMOS.emerald, width: 4.5 }).at(90, y).glow(12, COSMOS.emerald),
            dot(9, '#ffffff').at(-90 + Math.cos(p) * 115, y + Math.sin(p) * 115).glow(14, COSMOS.gold),
            dot(9, '#ffffff').at(90 + Math.cos(-p) * 115, y + Math.sin(-p) * 115).glow(14, COSMOS.emerald),
        )
    })

    s.add(liveRings, policyView)
    c.at(0.1, () => s.play(phase.to(7.5, { duration: 15, ease: linear })))
    c.on('Shared memory turns', () => s.play(showEnd.to(1, { duration: 0.45 })))
    c.swap('Shared memory turns', policyView, endWords)
}

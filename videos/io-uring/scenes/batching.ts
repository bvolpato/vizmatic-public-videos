import { Node, circle, dot, dynamic, group, rect, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const batching: SceneFunction = (s, c) => {
    const mode = s.value(0) // 0 = 32 syscalls, 1 = 1 batched enter, 2 = 0 with SQPOLL

    const header = group(
        txt('Collapsing Syscalls to Zero', 0, -400, 62, COSMOS.ink, 'serif').glow(5, COSMOS.emerald),
        txt('32 reads of 4 KiB each — watch the kernel crossings vanish', 0, -325, 30, COSMOS.muted, 'sans'),
    )

    const liveCompare = dynamic(() => {
        const m = mode.value
        const items = [
            { x: -560, title: 'Classic read()', count: '32', sub: '1 syscall per op', col: COSMOS.rose, active: m < 0.5 },
            { x: 0, title: 'io_uring batch', count: '1', sub: '1 io_uring_enter', col: COSMOS.gold, active: m >= 0.5 && m < 1.5 },
            { x: 560, title: 'SQPOLL mode', count: '0', sub: 'Kernel polls ring', col: COSMOS.emerald, active: m >= 1.5 },
        ]
        const nodes: Node[] = [
            nebula(m < 0.5 ? -560 : m < 1.5 ? 0 : 560, 40, 380, m < 0.5 ? '#ff6b8b24' : m < 1.5 ? '#ffd16624' : '#6ee7b728'),
        ]
        for (const it of items) {
            const op = it.active ? 1 : 0.35
            nodes.push(
                circle(145, { fill: '#111626', stroke: it.col, width: it.active ? 5 : 2 }).at(it.x, 40).glow(it.active ? 14 : 0, it.col).opacity(op),
                txt(it.count, it.x, 30, 96, it.col, 'mono').opacity(op),
                txt('syscalls', it.x, 108, 26, COSMOS.muted, 'mono').opacity(op),
                txt(it.title, it.x, -160, 34, COSMOS.ink, 'serif').opacity(op),
                txt(it.sub, it.x, 240, 28, it.col, 'sans').opacity(op),
            )
        }
        return group(...nodes)
    })

    s.add(header, liveCompare)
    c.on('one single enter', () => s.play(mode.to(1, { duration: 0.7 })))
    c.on('Turn on', () => s.play(mode.to(2, { duration: 0.8 })))
}

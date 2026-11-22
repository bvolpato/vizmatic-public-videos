import { Node, circle, dot, dynamic, group, line, polyPath, rect, regularPolygon, type SceneFunction, type Vec } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const futures: SceneFunction = (s, c) => {
    const showSize = s.value(1)
    const showLoop = s.value(0)
    const loopAngle = s.value(0)

    // Stage 1: Towering 2 MiB OS stack pillar vs glowing 48-byte crystalline state machine!
    const sizeScene = group(
        txt('Zero-Cost Async', -830, -395, 64, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.gold),
        txt('No per-task OS stack — compiled straight into an enum', -830, -322, 30, COSMOS.muted, 'sans', 'left'),

        // Left: massive 2 MiB monolith
        rect(220, 520, { fill: '#141c33', stroke: COSMOS.blue, width: 3, radius: 14 }).at(-440, 65).glow(8, COSMOS.blue),
        txt('OS Thread', -440, -145, 34, COSMOS.blue, 'serif'),
        txt('~2 MiB', -440, 20, 48, COSMOS.ink, 'mono'),
        txt('stack', -440, 82, 28, COSMOS.muted, 'sans'),

        // Right: tiny luminous 48-byte crystal gem!
        nebula(340, 65, 360, '#ffd16628', '#5ce1e614'),
        regularPolygon(6, 95, { fill: '#192624', stroke: COSMOS.emerald, width: 4 }).at(340, 65).glow(14, COSMOS.emerald),
        txt('48 B', 340, 65, 44, COSMOS.emerald, 'mono'),
        txt('Future state machine', 340, -110, 34, COSMOS.gold, 'serif'),
        txt('Start -> Wait1 -> Wait2 -> Done', 340, 235, 28, COSMOS.cyan, 'mono'),
        txt('Measured on rustc 1.99.1', 340, 290, 26, COSMOS.dim, 'mono'),
    )

    // Stage 2: Luminous orbital Poll -> Pending -> Waker -> Ready ring + Pin anchor
    const loopCopy = group(
        txt('Pull-Based Execution', 0, -400, 62, COSMOS.ink, 'serif').glow(5, COSMOS.cyan),
        txt('Pin<&mut Self> locks self-references in memory while suspended', 0, 405, 30, COSMOS.violet, 'mono'),
    )

    const STOPS: { label: string; sub: string; ang: number; col: string }[] = [
        { label: '1. poll()', sub: 'Executor drives', ang: -Math.PI / 2, col: COSMOS.blue },
        { label: '2. Pending', sub: 'Stores Waker', ang: 0, col: COSMOS.gold },
        { label: '3. wake()', sub: 'epoll / kqueue', ang: Math.PI / 2, col: COSMOS.cyan },
        { label: '4. Ready', sub: 'Value returned', ang: Math.PI, col: COSMOS.emerald },
    ]

    const liveLoop = dynamic(() => {
        if (showLoop.value < 0.02) return []
        const a = showLoop.value
        const cur = loopAngle.value
        const R = 230
        const px = Math.cos(cur) * R
        const py = Math.sin(cur) * R
        const nodes: Node[] = [
            nebula(0, 0, 360, '#5ce1e622', '#a78bfa12').opacity(a),
            circle(R, { fill: null, stroke: '#293554', width: 4 }).at(0, 0).opacity(a),
            regularPolygon(6, 74, { fill: '#151829', stroke: COSMOS.violet, width: 3.5 }).at(0, 0).glow(10, COSMOS.violet).opacity(a),
            txt('Pin', 0, 0, 36, COSMOS.violet, 'mono').opacity(a),
        ]
        for (const st of STOPS) {
            const sx = Math.cos(st.ang) * R
            const sy = Math.sin(st.ang) * R
            const lx = Math.cos(st.ang) * (R + 145)
            const ly = Math.sin(st.ang) * (R + 82)
            nodes.push(
                circle(18, { fill: '#101624', stroke: st.col, width: 3.5 }).at(sx, sy).glow(10, st.col).opacity(a),
                txt(st.label, lx, ly - 14, 30, st.col, 'mono').opacity(a),
                txt(st.sub, lx, ly + 22, 26, COSMOS.muted, 'sans').opacity(a),
            )
        }
        nodes.push(dot(12, '#ffffff').at(px, py).glow(16, COSMOS.gold).opacity(a))
        return group(...nodes)
    })

    s.add(sizeScene)
    c.on('Nothing runs until', () => {
        s.play(showSize.to(0, { duration: 0.3 }))
        s.play(showLoop.to(1, { duration: 0.35 }))
        s.play(loopAngle.to(Math.PI * 2.5, { duration: 9.5 }))
    })
    c.swap('Nothing runs until', sizeScene, loopCopy)
    s.add(liveLoop)
}

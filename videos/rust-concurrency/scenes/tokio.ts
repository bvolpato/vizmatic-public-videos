import { Node, circle, dot, dynamic, group, line, polyPath, type SceneFunction, type Vec } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const tokioScene: SceneFunction = (s, c) => {
    const showRuntime = s.value(1)
    const stealU = s.value(0)
    const freezeW1 = s.value(0)
    const showEscape = s.value(0)
    const showSelect = s.value(0)
    const raceProg = s.value(0)
    const dropFlash = s.value(0)

    const rtCopy = group(
        txt('Tokio Work-Stealing Runtime', -830, -395, 60, COSMOS.blue, 'serif', 'left').glow(5, COSMOS.blue),
        txt('Per-core queues · idle workers steal half · never block a worker', -830, -325, 28, COSMOS.muted, 'sans', 'left'),
    )

    const liveRuntime = dynamic(() => {
        if (showRuntime.value < 0.02) return []
        const a = showRuntime.value
        const u = stealU.value
        const fr = freezeW1.value
        const esc = showEscape.value
        const w1Col = fr > 0.3 ? COSMOS.rose : COSMOS.blue
        const nodes: Node[] = [
            nebula(-360, 20, 300, fr > 0.3 ? '#ff6b8b26' : '#60a5fa22').opacity(a),
            nebula(360, 20, 300, '#ffd16620').opacity(a),
            circle(155, { fill: '#111626', stroke: w1Col, width: 4 }).at(-360, 20).glow(10, w1Col).opacity(a),
            txt('Worker 1', -360, -10, 34, w1Col, 'serif').opacity(a),
            txt(fr > 0.3 ? 'BLOCKED!' : 'Local queue', -360, 40, 26, fr > 0.3 ? COSMOS.rose : COSMOS.muted, 'mono').opacity(a),

            circle(155, { fill: '#111626', stroke: COSMOS.gold, width: 4 }).at(360, 20).glow(10, COSMOS.gold).opacity(a),
            txt('Worker 2', 360, -10, 34, COSMOS.gold, 'serif').opacity(a),
            txt(u > 0.4 ? 'Stole 2 tasks' : 'Idle core', 360, 40, 26, COSMOS.muted, 'mono').opacity(a),
        ]

        // Work-stealing glowing arc carrying 2 sparks from Worker 1 to Worker 2
        if (u > 0.02) {
            const arcPts: Vec[] = Array.from({ length: 30 }, (_, i) => {
                const t = i / 29
                const x = -205 + t * 410
                const y = 20 - Math.sin(t * Math.PI) * 145
                return [x, y] as Vec
            })
            const sx = -205 + u * 410
            const sy = 20 - Math.sin(u * Math.PI) * 145
            nodes.push(
                new Node(polyPath(arcPts)).stroke(COSMOS.gold, 3, 0.7 * a).glow(6, COSMOS.gold),
                dot(10, COSMOS.gold).at(sx, sy).glow(14, COSMOS.gold).opacity(a),
                txt('steal half', 0, -158, 26, COSMOS.gold, 'mono').opacity(a),
            )
        }

        // Escape lane: spawn_blocking pool below
        if (esc > 0.02) {
            nodes.push(
                line([-360, 175], [0, 325], { stroke: COSMOS.emerald, width: 3.5 }).glow(8, COSMOS.emerald).opacity(esc * a),
                txt('spawn_blocking  /  Rayon pool', 0, 365, 32, COSMOS.emerald, 'mono').glow(6, COSMOS.emerald).opacity(esc * a),
            )
        }
        return group(...nodes)
    })

    // Stage 2: Structured JoinSet + Semaphore + select! drop-based cancellation race
    const selectCopy = group(
        txt('Structured Async & Drop Cancellation', 0, -395, 58, COSMOS.ink, 'serif').glow(5, COSMOS.gold),
        txt('JoinSet aborts on Drop  ·  Semaphore caps in-flight work  ·  select! drops the loser', 0, -325, 28, COSMOS.muted, 'sans'),
    )

    const liveSelect = dynamic(() => {
        if (showSelect.value < 0.02) return []
        const a = showSelect.value
        const p = raceProg.value
        const df = dropFlash.value
        const rpcX = -680 + p * 820
        const tmoX = -680 + Math.min(1, p * 1.15) * 1160
        const nodes: Node[] = [
            line([480, -180], [480, 220], { stroke: COSMOS.gold, width: 3.5, dash: [8, 8] }).glow(8, COSMOS.gold).opacity(a),
            txt('deadline', 480, -215, 26, COSMOS.gold, 'mono').opacity(a),

            // Branch 1: slow RPC
            new Node(polyPath([[-680, -60], [rpcX, -60]])).stroke(df > 0.2 ? COSMOS.rose : COSMOS.blue, 5, (df > 0.2 ? 0.5 : 0.9) * a).glow(8, df > 0.2 ? COSMOS.rose : COSMOS.blue),
            txt('rpc_fetch().await', -680, -108, 28, COSMOS.blue, 'mono', 'left').opacity(a),

            // Branch 2: timeout wins!
            new Node(polyPath([[-680, 100], [tmoX, 100]])).stroke(COSMOS.emerald, 5, 0.95 * a).glow(9, COSMOS.emerald),
            dot(10, '#ffffff').at(tmoX, 100).glow(14, COSMOS.emerald).opacity(a),
            txt('sleep(15 ms)  ->  WINNER', -680, 152, 28, COSMOS.emerald, 'mono', 'left').opacity(a),
        ]
        if (df > 0.05) {
            nodes.push(
                circle(20 + df * 75, { fill: null, stroke: COSMOS.rose, width: 3.5 }).at(rpcX, -60).opacity((1 - df * 0.5) * a).glow(10, COSMOS.rose),
                txt('drop(rpc_fut) -> Drop runs!', rpcX + 45, -60, 28, COSMOS.rose, 'mono', 'left').opacity(df * a),
            )
        }
        return group(...nodes)
    })

    s.add(rtCopy, liveRuntime)
    c.on('steal half', () => s.play(stealU.to(1, { duration: 1.8 })))
    c.on('blocking a worker', () => s.play(freezeW1.to(1, { duration: 0.5 })))
    c.on('spawn blocking', () => s.play(showEscape.to(1, { duration: 0.6 })))

    c.on('structured lifecycles', () => {
        s.play(showRuntime.to(0, { duration: 0.35 }))
        s.play(showSelect.to(1, { duration: 0.35 }))
        s.play(raceProg.to(0.92, { duration: 3.6 }))
    })
    c.swap('structured lifecycles', rtCopy, selectCopy)
    s.add(liveSelect)
    c.on('drops the losing', () => s.play(dropFlash.to(1, { duration: 0.9 })))
}

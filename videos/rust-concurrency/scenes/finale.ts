import { Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, regularPolygon, type SceneFunction, type Vec } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const finale: SceneFunction = (s, c) => {
    const showPipe = s.value(1)
    const flowT = s.value(0)
    const showEnd = s.value(0)
    const endPhase = s.value(0)

    const pipeGrad = linearGradient([-720, 0], [720, 0], [COSMOS.blue, COSMOS.gold, COSMOS.cyan, COSMOS.emerald])
    const pipeCopy = group(
        txt('Production Actor Pipeline', 0, -395, 62, COSMOS.ink, 'serif').glow(5, COSMOS.cyan),
        txt('Semaphore  ->  Bounded mpsc  ->  Zero-Mutex Actor  ->  CancellationToken', 0, -322, 26, COSMOS.gold, 'mono'),
    )

    const NODES: { x: number; label: string; sub: string; col: string }[] = [
        { x: -640, label: 'Ingesters', sub: 'Tokio tasks', col: COSMOS.blue },
        { x: -220, label: 'Semaphore', sub: 'Bounded N', col: COSMOS.gold },
        { x: 200, label: 'mpsc', sub: 'Backpressure', col: COSMOS.cyan },
        { x: 640, label: 'Actor', sub: '0 Mutexes', col: COSMOS.emerald },
    ]

    const livePipe = dynamic(() => {
        if (showPipe.value < 0.02) return []
        const a = showPipe.value
        const ph = flowT.value
        const nodes: Node[] = [
            new Node(polyPath([[-640, 20], [640, 20]])).stroke(pipeGrad, 4, 0.7 * a).glow(8, COSMOS.cyan),
        ]
        for (const n of NODES) {
            nodes.push(
                circle(98, { fill: '#111626', stroke: n.col, width: 4 }).at(n.x, 20).glow(10, n.col).opacity(a),
                txt(n.label, n.x, 12, 26, n.col, 'mono').opacity(a),
                txt(n.sub, n.x, 152, 26, COSMOS.muted, 'sans').opacity(a),
            )
        }
        for (let k = 0; k < 3; k++) {
            const px = -640 + (((ph + k * 0.33) % 1) * 1280)
            nodes.push(dot(9, '#ffffff').at(px, 20).glow(14, COSMOS.gold).opacity(a))
        }
        return group(...nodes)
    })

    const endWords = group(
        txt('Ownership is Rust’s concurrency model.', 0, 122, 68, COSMOS.ink, 'serif').glow(6, COSMOS.amber),
        txt('Zero data races · Verified on Rust 2024 & Tokio 1.54', 0, 218, 28, COSMOS.cyan, 'mono'),
    )

    const liveEnd = dynamic(() => {
        if (showEnd.value < 0.02) return []
        const a = showEnd.value
        const p = endPhase.value
        const r = 115
        return group(
            nebula(0, -145, 420, '#fb923c2c', '#5ce1e614').opacity(a),
            circle(r + 45 + Math.sin(p) * 8, { fill: null, stroke: COSMOS.cyan, width: 2.5 }).at(0, -145).opacity(0.65 * a).glow(8, COSMOS.cyan),
            circle(r, { fill: '#111626', stroke: COSMOS.amber, width: 4.5 }).at(0, -145).glow(12, COSMOS.amber).opacity(a),
            regularPolygon(6, 72, { fill: null, stroke: COSMOS.gold, width: 3 }).at(0, -145).opacity(a),
            txt('Send', 0, -163, 28, COSMOS.ink, 'mono').opacity(a),
            txt('Sync', 0, -127, 28, COSMOS.cyan, 'mono').opacity(a),
        )
    })

    s.add(pipeCopy, livePipe)
    c.at(0.1, () => s.play(flowT.to(3.2, { duration: 14, ease: linear })))
    c.on('not bolted onto', () => {
        s.play(showPipe.to(0, { duration: 0.35 }))
        s.play(showEnd.to(1, { duration: 0.45 }))
        s.play(endPhase.to(5.0, { duration: 4.5, ease: linear }))
    })
    c.swap('not bolted onto', pipeCopy, endWords)
    s.add(liveEnd)
}

import {
    Node, arrow, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { QFT_32 } from '../math'
import { txt } from '../../../factory/style'

const ARENA_X = 365
const TOP_Y = -145
const BOT_Y = 185

export const hook: SceneFunction = (s, c) => {
    const spin = s.value(0)
    const alignProg = s.value(0)
    const showArrows = s.value(1)
    const showComb = s.value(0)
    const combPhase = s.value(0)

    const shot1Title = group(
        txt('NO PARALLEL MAGIC', -840, -215, 34, '#ff6b8b', 'mono', 'left').glow(6, '#ff6b8b'),
        txt('Cancel the', -848, -90, 102, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('wrong', -848, 22, 102, '#ff6b8b', 'serif', 'left').glow(10, '#ff6b8b'),
        txt('answers.', -848, 134, 102, '#ffd166', 'serif', 'left').glow(10, '#ffd166'),
        txt('Quantum speed comes from wave interference', -840, 248, 32, '#b8c5df', 'sans', 'left'),
    )

    const liveArrows = dynamic(() => {
        if (showArrows.value < 0.02) return []
        const a = showArrows.value
        const sp = spin.value
        const ap = alignProg.value
        const nodes: Node[] = [
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#ffd16622'],
                    [0.5, '#ff6b8b14'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(ARENA_X, 20).opacity(a),
            txt('Wrong answers  →  opposite phases cancel to 0', ARENA_X, -328, 26, '#ff6b8b', 'mono').opacity(a),
            txt('Hidden answer  →  phases align & amplify', ARENA_X, 342, 26, '#ffd166', 'mono').opacity(a),
        ]

        // Top arena: 8 out-of-phase complex arrows curling into a centered closed zero polygon
        const polyR = 88
        const ringFade = 1 - ap * 0.45
        nodes.push(
            circle(polyR + 10, { fill: null, stroke: '#ff6b8b', width: 1.4 })
                .at(ARENA_X, TOP_Y)
                .opacity(0.24 * a),
        )
        for (let i = 0; i < 8; i++) {
            const a0 = sp * 0.75 + (2 * Math.PI * i) / 8
            const a1 = sp * 0.75 + (2 * Math.PI * (i + 1)) / 8
            const x0 = ARENA_X + Math.cos(a0) * polyR
            const y0 = TOP_Y + Math.sin(a0) * polyR
            const x1 = ARENA_X + Math.cos(a1) * polyR
            const y1 = TOP_Y + Math.sin(a1) * polyR
            nodes.push(
                arrow([x0, y0], [x1, y1], { stroke: '#ff6b8b', width: 3.6, tip: 11 })
                    .opacity(0.88 * ringFade * a)
                    .glow(6, '#ff6b8b'),
            )
        }
        nodes.push(
            dot(7, '#ffffff').at(ARENA_X, TOP_Y).opacity(0.8 * a),
            txt('Σ = 0', ARENA_X + 200, TOP_Y + 6, 36, '#ff6b8b', 'mono').opacity(a * (0.55 + 0.45 * ap)),
        )

        // Bottom arena: 8 golden arrows flowing and snapping head-to-tail into a blazing beam!
        let bx = ARENA_X - 248
        let by = BOT_Y
        const goldLen = 62
        for (let i = 0; i < 8; i++) {
            const waveTilt = Math.sin(i * 1.1 + sp * 1.2) * 0.85 * (1 - ap)
            const nx = bx + Math.cos(waveTilt) * goldLen
            const ny = by + Math.sin(waveTilt) * goldLen
            nodes.push(
                arrow([bx, by], [nx, ny], { stroke: '#ffd166', width: 4.4, tip: 12 })
                    .opacity(0.96 * a)
                    .glow(9, '#ffd166'),
            )
            bx = nx
            by = ny
        }
        const waveR = 16 + ((sp * 1.1) % 1) * 95
        const waveOp = (1 - ((sp * 1.1) % 1)) * 0.72 * ap * a
        nodes.push(
            circle(waveR, { fill: null, stroke: '#ffd166', width: 2.6 }).at(bx, by).opacity(waveOp).glow(10, '#ffd166'),
            dot(8.5, '#ffffff').at(bx, by).glow(16, '#ffd166').opacity(a),
        )
        return group(...nodes)
    })

    const shot2Copy = group(
        tex(String.raw`P(x) \;=\; \left|\sum \alpha_x\right|^2`, { size: 58, color: '#ffd166' })
            .at(0, -330)
            .glow(8, '#ffd166'),
        txt('Constructive interference turns hidden structure into blazing peaks', 0, 355, 32, '#cbd5e8', 'sans'),
    )

    const liveComb = dynamic(() => {
        if (showComb.value < 0.02) return []
        const a = showComb.value
        const p = combPhase.value
        const baseY = 235
        const span = 1480
        const waveGrad = linearGradient([-740, baseY], [740, baseY], ['#5ce1e6', '#a78bfa', '#ffd166', '#5ce1e6'])
        const nodes: Node[] = [
            line([-780, baseY], [780, baseY], { stroke: '#263459', width: 2 }).opacity(a),
        ]
        const wavePts: Vec[] = Array.from({ length: 160 }, (_, i) => {
            const u = i / 159
            const x = -span / 2 + u * span
            const y = baseY - 58 - Math.sin(u * Math.PI * 10 + p * 4.2) * 32 * (1 - 0.65 * Math.min(1, p))
            return [x, y] as Vec
        })
        nodes.push(new Node(polyPath(wavePts)).stroke(waveGrad, 2.8, 0.55 * a).glow(6, '#5ce1e6'))

        const tPeak = Math.min(1, p * 1.15)
        for (const bin of QFT_32) {
            const x = -span / 2 + (bin.k / (QFT_32.length - 1)) * span
            const isPeak = bin.prob > 0.1
            const h = isPeak ? 45 + 345 * tPeak : 45 * (1 - 0.88 * tPeak)
            const col = isPeak ? '#ffd166' : '#5ce1e6'
            nodes.push(
                line([x, baseY], [x, baseY - h], { stroke: col, width: isPeak ? 8 : 3 })
                    .opacity((isPeak ? 0.96 : 0.45) * a)
                    .glow(isPeak ? 12 : 0, col),
            )
            if (isPeak) {
                nodes.push(dot(8, '#ffffff').at(x, baseY - h).glow(16, '#ffd166').opacity(a))
            }
        }
        return group(...nodes)
    })

    s.add(liveArrows, shot1Title, liveComb)
    c.at(0.05, () => s.play(spin.to(5.5, { duration: 11.0, ease: linear })))
    c.on('cancel to black', () => s.play(alignProg.to(1, { duration: 1.5 })))
    c.on('while the hidden answer', () => {
        s.play(showArrows.to(0, { duration: 0.25 }))
        s.play(showComb.to(1, { duration: 0.3 }))
        s.play(combPhase.to(1.25, { duration: 2.4, ease: linear }))
    })
    c.swap('while the hidden answer', shot1Title, shot2Copy)
}

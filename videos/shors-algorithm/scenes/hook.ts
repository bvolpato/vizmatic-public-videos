import {
    Node, arrow, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, rect,
    scalarField, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { QFT_32 } from '../math'
import { txt } from '../../../factory/style'

const ARENA_X = 365
const POLY_CX = 205
const TOP_Y = -152
const BOT_Y = 172

function backdropWave(wx: number, wy: number, time: number): number {
    const r1 = Math.hypot(wx + 1.35, wy - 0.8)
    const r2 = Math.hypot(wx - 1.35, wy + 0.8)
    const k = 4.2
    const fringe = Math.cos(0.5 * k * (r1 - r2)) ** 2
    const carrier = 0.45 + 0.55 * Math.cos(0.5 * k * (r1 + r2) - 1.9 * time) ** 2
    const env = Math.exp(-0.068 * (wx * wx + wy * wy))
    const leftMask = Math.max(0, Math.min(1, (wx + 5.2) / 3.2))
    return Math.min(1, fringe * carrier * env * leftMask * leftMask * (3 - 2 * leftMask) * 1.15)
}

export const hook: SceneFunction = (s, c) => {
    const spin = s.value(0)
    const alignProg = s.value(0)
    const showArrows = s.value(1)
    const showComb = s.value(0)
    const combPhase = s.value(0)

    const waveBackdrop = scalarField((wx, wy, time) => backdropWave(wx, wy, time), {
        x: [-5.5, 5.5],
        y: [-4.5, 4.5],
        domain: [0, 1],
        width: 1180,
        height: 980,
        resolution: [110, 92],
        colors: ['#07091000', '#101d3b44', '#263a7066', '#ff6b8b55', '#ffd16688'],
    })
        .at(370, 0)
        .opacity(0.52)
        .set('blend', 'screen')

    const shot1Title = group(
        txt('NO PARALLEL MAGIC', -840, -215, 34, '#ff94b2', 'mono', 'left').glow(8, '#ff6b8b'),
        txt('Cancel the', -848, -90, 102, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('wrong', -848, 22, 102, '#ff8fab', 'serif', 'left').glow(10, '#ff6b8b'),
        txt('answers.', -848, 134, 102, '#ffd166', 'serif', 'left').glow(10, '#ffd166'),
        txt('Quantum speed comes from wave interference', -840, 248, 32, '#cbd5e8', 'sans', 'left'),
    )

    const liveArrows = dynamic(() => {
        if (showArrows.value < 0.02) return []
        const a = showArrows.value
        const sp = spin.value
        const ap = alignProg.value
        const nodes: Node[] = [
            circle(470, {
                fill: radialGradient([0, 0], 470, [
                    [0, '#ffd16626'],
                    [0.5, '#ff6b8b18'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            })
                .at(ARENA_X, 15)
                .opacity(a)
                .set('blend', 'screen'),
            txt('Wrong answers  →  opposite phases cancel to 0', ARENA_X, -360, 28, '#ff9bb5', 'mono')
                .glow(6, '#ff6b8b')
                .opacity(a),
            txt('Hidden answer  →  phases align & amplify', ARENA_X, 368, 28, '#ffd166', 'mono')
                .glow(6, '#ffd166')
                .opacity(a),
        ]

        // Top arena: 1.6x larger 8-arrow closed zero polygon (radius 134 vs old 88)
        const polyR = 134
        const ringFade = 1 - ap * 0.28
        nodes.push(
            circle(polyR + 14, { fill: null, stroke: '#ff8fab', width: 1.8 })
                .at(POLY_CX, TOP_Y)
                .opacity(0.32 * a),
        )
        for (let i = 0; i < 8; i++) {
            const a0 = sp * 0.72 + (2 * Math.PI * i) / 8
            const a1 = sp * 0.72 + (2 * Math.PI * (i + 1)) / 8
            const x0 = POLY_CX + Math.cos(a0) * polyR
            const y0 = TOP_Y + Math.sin(a0) * polyR
            const x1 = POLY_CX + Math.cos(a1) * polyR
            const y1 = TOP_Y + Math.sin(a1) * polyR
            nodes.push(
                arrow([x0, y0], [x1, y1], { stroke: '#ff8fab', width: 4.8, tip: 15 })
                    .opacity(0.94 * ringFade * a)
                    .glow(8, '#ff6b8b'),
            )
        }
        // Center zero marker + live destructive probability bar (|Σ|² = 0%)
        const bar0X = 435
        const bar0W = 340
        nodes.push(
            dot(8.5, '#ffffff').at(POLY_CX, TOP_Y).glow(10, '#ff6b8b').opacity(0.9 * a),
            txt('Σ = 0', bar0X, TOP_Y - 46, 36, '#ff9bb5', 'mono', 'left').glow(6, '#ff6b8b').opacity(a),
            txt('|Σ|² = 0%', bar0X, TOP_Y + 6, 30, '#ffb3c6', 'mono', 'left').opacity(a),
            rect(bar0W, 18, { fill: '#171f3a', stroke: '#4c2c46', width: 1.5, radius: 9 })
                .at(bar0X + bar0W / 2, TOP_Y + 46)
                .opacity(a),
            rect(10, 18, { fill: '#ff6b8b', stroke: null, radius: 9 })
                .at(bar0X + 5, TOP_Y + 46)
                .glow(6, '#ff6b8b')
                .opacity(0.45 * a),
        )

        // Bottom arena: 1.6x larger straight aligned golden constructive chain (ZERO wiggly curve!)
        const startX = -6
        const segLen = 96
        let bx = startX
        const by = BOT_Y
        for (let i = 0; i < 8; i++) {
            const nx = bx + segLen
            nodes.push(
                arrow([bx, by], [nx, by], { stroke: '#ffd166', width: 5.6, tip: 16 })
                    .opacity(0.98 * a)
                    .glow(10, '#ffd166'),
            )
            bx = nx
        }
        const waveR = 20 + ((sp * 1.1) % 1) * 96
        const waveOp = (1 - ((sp * 1.1) % 1)) * 0.78 * a
        const bar1W = 540
        const bar1X = 95
        const fillW = bar1W
        nodes.push(
            line([startX, by], [bx, by], { stroke: '#fff4cc', width: 2.0 })
                .opacity(0.65 * a)
                .set('blend', 'screen'),
            circle(waveR, { fill: null, stroke: '#ffd166', width: 2.8 })
                .at(bx, by)
                .opacity(waveOp)
                .glow(10, '#ffd166')
                .set('blend', 'screen'),
            circle(48, {
                fill: radialGradient([0, 0], 48, [
                    [0, '#fff4cc99'],
                    [0.45, '#ffd16644'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            })
                .at(bx, by)
                .opacity(a)
                .set('blend', 'screen'),
            dot(10, '#ffffff').at(bx, by).glow(18, '#ffd166').opacity(a).set('blend', 'screen'),
            // Live constructive probability bar (|Σ|² = 100%)
            txt('|Σ|² = 100%', bar1X, BOT_Y + 72, 30, '#fff3c4', 'mono', 'left').glow(8, '#ffd166').opacity(a),
            rect(bar1W, 18, { fill: '#171f3a', stroke: '#5a4a24', width: 1.5, radius: 9 })
                .at(bar1X + bar1W / 2, BOT_Y + 112)
                .opacity(a),
            rect(fillW, 18, {
                fill: linearGradient([bar1X, BOT_Y + 112], [bar1X + bar1W, BOT_Y + 112], ['#5ce1e6', '#ffd166', '#fff4cc']),
                stroke: null,
                radius: 9,
            })
                .at(bar1X + fillW / 2, BOT_Y + 112)
                .glow(10, '#ffd166')
                .opacity(a)
                .set('blend', 'screen'),
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
            line([-780, baseY], [780, baseY], { stroke: '#2f406b', width: 2 }).opacity(a),
        ]
        const wavePts: Vec[] = Array.from({ length: 160 }, (_, i) => {
            const u = i / 159
            const x = -span / 2 + u * span
            const y = baseY - 58 - Math.sin(u * Math.PI * 10 + p * 4.2) * 32 * (1 - 0.65 * Math.min(1, p))
            return [x, y] as Vec
        })
        nodes.push(new Node(polyPath(wavePts)).stroke(waveGrad, 3.0, 0.62 * a).glow(8, '#5ce1e6').set('blend', 'screen'))

        const tPeak = Math.min(1, p * 1.15)
        for (const bin of QFT_32) {
            const x = -span / 2 + (bin.k / (QFT_32.length - 1)) * span
            const isPeak = bin.prob > 0.1
            const h = isPeak ? 45 + 345 * tPeak : 45 * (1 - 0.88 * tPeak)
            const col = isPeak ? '#ffd166' : '#5ce1e6'
            nodes.push(
                line([x, baseY], [x, baseY - h], { stroke: col, width: isPeak ? 8.5 : 3 })
                    .opacity((isPeak ? 0.96 : 0.45) * a)
                    .glow(isPeak ? 12 : 0, col),
            )
            if (isPeak) {
                nodes.push(dot(8.5, '#ffffff').at(x, baseY - h).glow(16, '#ffd166').opacity(a).set('blend', 'screen'))
            }
        }
        return group(...nodes)
    })

    s.add(waveBackdrop, liveArrows, shot1Title, liveComb)
    c.at(0.05, () => s.play(spin.to(5.5, { duration: 11.0, ease: linear })))
    c.on('cancel to black', () => s.play(alignProg.to(1, { duration: 1.5 })))
    c.on('while the hidden answer', () => {
        s.play(showArrows.to(0, { duration: 0.25 }))
        s.play(showComb.to(1, { duration: 0.3 }))
        s.play(combPhase.to(1.25, { duration: 2.4, ease: linear }))
    })
    c.swap('while the hidden answer', [shot1Title, waveBackdrop], shot2Copy)
}

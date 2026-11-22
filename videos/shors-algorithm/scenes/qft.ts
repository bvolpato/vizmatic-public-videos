import {
    Node, arrow, circle, dot, dynamic, group, line, linear, radialGradient, tex,
    type SceneFunction,
} from 'vizmatic/stage'
import { QFT_32, QFT_M } from '../math'
import { txt } from '../../../factory/style'

const BIN_OFF = QFT_32[5]!
const BIN_PEAK = QFT_32[8]!
const LEFT_CX = -445
const RIGHT_CX = 435
const PHASOR_Y = -170
const BASE_Y = 285
const SPAN = 1520

export const qft: SceneFunction = (s, c) => {
    const spinProg = s.value(0)
    const alignProg = s.value(0)
    const combProg = s.value(0)

    const header = txt('QUANTUM FOURIER TRANSFORM  ·  M = 32, r = 4', 0, -408, 26, '#ffd166', 'mono')

    const liveQft = dynamic(() => {
        const sp = spinProg.value
        const ap = alignProg.value
        const cp = combProg.value
        const nodes: Node[] = [
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#ffd16622'],
                    [0.5, '#5ce1e610'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, 80),
            txt('Off-beat k = 5  →  closes to 0', LEFT_CX, -335, 28, '#ff6b8b', 'mono'),
            txt('Harmonic k = 8  →  aligns head-to-tail', RIGHT_CX, -335, 28, '#ffd166', 'mono'),
        ]

        // Left phasor ring: exact 8 terms of QFT_32[5] (sum === 0), centered cleanly on (LEFT_CX, PHASOR_Y)
        const scaleOff = 1950
        const rot = sp * 0.6
        const cr = Math.cos(rot)
        const sr = Math.sin(rot)
        const verts: Array<[number, number]> = [[0, 0]]
        for (const term of BIN_OFF.terms) {
            const prev = verts[verts.length - 1]!
            const dx = (term.re * cr - term.im * sr) * scaleOff
            const dy = -(term.re * sr + term.im * cr) * scaleOff
            verts.push([prev[0] + dx, prev[1] + dy])
        }
        let mx = 0
        let my = 0
        for (let i = 0; i < BIN_OFF.terms.length; i++) {
            mx += verts[i]![0]
            my += verts[i]![1]
        }
        mx /= BIN_OFF.terms.length
        my /= BIN_OFF.terms.length
        nodes.push(circle(102, { fill: null, stroke: '#ff6b8b', width: 1.5 }).at(LEFT_CX, PHASOR_Y).opacity(0.28))
        for (let i = 0; i < BIN_OFF.terms.length; i++) {
            const p0 = verts[i]!
            const p1 = verts[i + 1]!
            nodes.push(
                arrow([LEFT_CX + p0[0] - mx, PHASOR_Y + p0[1] - my], [LEFT_CX + p1[0] - mx, PHASOR_Y + p1[1] - my], {
                    stroke: '#ff6b8b',
                    width: 3.4,
                    tip: 11,
                })
                    .opacity(0.9)
                    .glow(6, '#ff6b8b'),
            )
        }
        nodes.push(dot(7.5, '#ffffff').at(LEFT_CX - mx, PHASOR_Y - my).glow(10, '#ff6b8b'))

        // Right phasor chain: exact 8 terms of QFT_32[8] (all 8 real positive, aligning head-to-tail!)
        const scalePeak = 1040
        let px = RIGHT_CX - 260
        let py = PHASOR_Y
        for (let i = 0; i < BIN_PEAK.terms.length; i++) {
            const term = BIN_PEAK.terms[i]!
            const baseAng = Math.atan2(term.im, term.re)
            const jitter = ((i - 3.5) * 0.72 + sp * 0.4) * (1 - ap)
            const ang = baseAng + jitter
            const mag = Math.hypot(term.re, term.im) * scalePeak
            const nx = px + Math.cos(ang) * mag
            const ny = py - Math.sin(ang) * mag
            nodes.push(
                arrow([px, py], [nx, ny], { stroke: '#ffd166', width: 4, tip: 11 })
                    .opacity(0.96)
                    .glow(9, '#ffd166'),
            )
            px = nx
            py = ny
        }
        nodes.push(dot(8.5, '#ffffff').at(px, py).glow(16, '#ffd166'))

        // Bottom probability spectrum: exact QFT_32[k].prob across k = 0..31
        nodes.push(line([-SPAN / 2 - 20, BASE_Y], [SPAN / 2 + 20, BASE_Y], { stroke: '#28365a', width: 2 }))
        for (const bin of QFT_32) {
            const x = -SPAN / 2 + (bin.k / (QFT_M - 1)) * SPAN
            const flatProb = 1 / QFT_M
            const prob = flatProb * (1 - cp) + bin.prob * cp
            const h = Math.max(4, prob * 1020)
            const isPeak = bin.prob > 0.1
            const col = isPeak ? '#ffd166' : '#5ce1e6'
            nodes.push(
                line([x, BASE_Y], [x, BASE_Y - h], { stroke: col, width: isPeak ? 8.5 : 3.2 })
                    .opacity(isPeak ? 0.96 : 0.45 * (1 - 0.65 * cp))
                    .glow(isPeak && cp > 0.2 ? 12 : 0, col),
            )
            if (isPeak && cp > 0.35) {
                nodes.push(
                    dot(8, '#ffffff').at(x, BASE_Y - h).glow(14, '#ffd166').opacity(cp),
                    txt('25%', x, BASE_Y - h - 32, 26, '#ffd166', 'mono').opacity(cp),
                )
            }
            if (bin.k % 8 === 0 || bin.k === 31) {
                nodes.push(
                    txt(`k=${bin.k}`, x, BASE_Y + 38, 26, isPeak ? '#ffd166' : '#8b99b8', 'mono'),
                )
            }
        }
        return group(...nodes)
    })

    const spacingEq = tex(String.raw`\Delta k = \frac{M}{r} = \frac{32}{4} = 8 \implies r = 4`, {
        size: 40,
        color: '#5ce1e6',
    }).at(0, 398).glow(6, '#38bdf8')

    s.add(header, liveQft)
    c.at(0.1, () => s.play(spinProg.to(4.8, { duration: 13.0, ease: linear })))
    c.on('snap head-to-tail', () => {
        s.play(alignProg.to(1, { duration: 1.8 }))
        s.play(combProg.to(1, { duration: 2.6 }))
    })
    c.show('single measurement', spacingEq)
}

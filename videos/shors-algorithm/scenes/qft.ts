import {
    Node, arrow, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { QFT_32, QFT_M } from '../math'
import { txt } from '../../../factory/style'

const BIN_OFF = QFT_32[5]!
const BIN_PEAK = QFT_32[8]!
const LEFT_CX = -515
const RIGHT_CX = 350
const PHASOR_Y = -170
const BASE_Y = 285
const SPAN = 1520

function binX(k: number): number {
    return -SPAN / 2 + (k / (QFT_M - 1)) * SPAN
}

/** Exact continuous QFT Dirichlet interference intensity |sum_{m=0}^7 exp(i 2pi * 4m * k / 32)|^2 / (32*8) */
function continuousQftProb(kVal: number): number {
    let re = 0
    let im = 0
    for (let m = 0; m < 8; m++) {
        const ang = (2 * Math.PI * (m * 4) * kVal) / QFT_M
        re += Math.cos(ang)
        im += Math.sin(ang)
    }
    return (re * re + im * im) / (QFT_M * 8)
}

export const qft: SceneFunction = (s, c) => {
    const spinProg = s.value(0)
    const alignProg = s.value(0)
    const combProg = s.value(0)

    const header = txt('QUANTUM FOURIER TRANSFORM  ·  M = 32, r = 4', 0, -412, 26, '#ffd166', 'mono')
    const waveGrad = linearGradient([-SPAN / 2, BASE_Y - 120], [SPAN / 2, BASE_Y - 120], [
        '#5ce1e6',
        '#ffd166',
        '#a78bfa',
        '#ffd166',
        '#5ce1e6',
    ])

    const liveQft = dynamic(() => {
        const sp = spinProg.value
        const ap = alignProg.value
        const cp = combProg.value
        const k5X = binX(5)
        const k8X = binX(8)
        const peakH = (1 / QFT_M * (1 - cp) + 0.25 * cp) * 1020

        const nodes: Node[] = [
            circle(460, {
                fill: radialGradient([0, 0], 460, [
                    [0, '#ffd16626'],
                    [0.5, '#5ce1e614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            })
                .at(0, 75)
                .set('blend', 'screen'),
            // Brightened rose Off-beat k = 5 header and crisp gold Harmonic k = 8 header
            txt('Off-beat k = 5  →  closes to 0', LEFT_CX + 35, -338, 28, '#ff9bb5', 'mono').glow(8, '#ff6b8b'),
            txt('Harmonic k = 8  →  aligns head-to-tail', RIGHT_CX, -338, 28, '#ffd166', 'mono').glow(6, '#ffd166'),
        ]

        // Faint vertical projection guides linking top phasor plots straight down to bins k = 5 (0%) and k = 8 (25%)
        nodes.push(
            line([k5X, PHASOR_Y + 112], [k5X, BASE_Y - 96], { stroke: '#ff8fab', width: 2.0 })
                .dash([7, 8])
                .opacity(0.46)
                .set('blend', 'screen'),
            dot(5.5, '#ff8fab').at(k5X, BASE_Y - 6).glow(8, '#ff6b8b').opacity(0.85),
            txt('0%', k5X, BASE_Y - 66, 26, '#ff9bb5', 'mono').glow(6, '#ff6b8b').opacity(0.86),
            // Stepped vertical projection guide from Harmonic k = 8 phasor cleanly down to bin k = 8 (25%)
            new Node(
                polyPath([
                    [RIGHT_CX - 255, PHASOR_Y + 26],
                    [RIGHT_CX - 255, -82],
                    [k8X, -82],
                    [k8X, BASE_Y - peakH - 80],
                ]),
            )
                .stroke('#ffd166', 2.0, 0.36 + 0.24 * cp)
                .dash([7, 8])
                .set('blend', 'screen'),
        )

        // Left phasor ring: exact 8 terms of QFT_32[5] (sum === 0), centered directly above bin k = 5
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
        nodes.push(circle(104, { fill: null, stroke: '#ff8fab', width: 1.8 }).at(LEFT_CX, PHASOR_Y).opacity(0.36))
        for (let i = 0; i < BIN_OFF.terms.length; i++) {
            const p0 = verts[i]!
            const p1 = verts[i + 1]!
            nodes.push(
                arrow([LEFT_CX + p0[0] - mx, PHASOR_Y + p0[1] - my], [LEFT_CX + p1[0] - mx, PHASOR_Y + p1[1] - my], {
                    stroke: '#ff8fab',
                    width: 3.8,
                    tip: 12,
                })
                    .opacity(0.94)
                    .glow(8, '#ff6b8b'),
            )
        }
        nodes.push(dot(8, '#ffffff').at(LEFT_CX - mx, PHASOR_Y - my).glow(12, '#ff6b8b').set('blend', 'screen'))

        // Right phasor chain: exact 8 terms of QFT_32[8] aligning head-to-tail
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
                arrow([px, py], [nx, ny], { stroke: '#ffd166', width: 4.4, tip: 12 })
                    .opacity(0.98)
                    .glow(10, '#ffd166'),
            )
            px = nx
            py = ny
        }
        nodes.push(dot(9, '#ffffff').at(px, py).glow(18, '#ffd166').set('blend', 'screen'))

        // Continuous glowing interference wave overlaid along k = 0..31
        const wavePts: Vec[] = Array.from({ length: 240 }, (_, i) => {
            const kVal = (i / 239) * (QFT_M - 1)
            const x = binX(kVal)
            const flatP = 1 / QFT_M
            const envP = flatP * (1 - cp) + continuousQftProb(kVal) * cp
            const y = BASE_Y - Math.max(4, envP * 1020)
            return [x, y] as Vec
        })
        const waveFillPts: Vec[] = [[binX(0), BASE_Y], ...wavePts, [binX(QFT_M - 1), BASE_Y]]
        nodes.push(
            new Node(polyPath(waveFillPts)).fill('#5ce1e614', 0.65).stroke(null),
            new Node(polyPath(wavePts)).stroke(waveGrad, 2.8, 0.78).glow(8, '#5ce1e6').set('blend', 'screen'),
        )

        // Bottom probability spectrum: exact QFT_32[k].prob across k = 0..31
        nodes.push(line([-SPAN / 2 - 20, BASE_Y], [SPAN / 2 + 20, BASE_Y], { stroke: '#364873', width: 2.2 }))
        for (const bin of QFT_32) {
            const x = binX(bin.k)
            const flatProb = 1 / QFT_M
            const prob = flatProb * (1 - cp) + bin.prob * cp
            const h = Math.max(4, prob * 1020)
            const isPeak = bin.prob > 0.1
            const col = isPeak ? '#ffd166' : '#5ce1e6'
            nodes.push(
                line([x, BASE_Y], [x, BASE_Y - h], { stroke: col, width: isPeak ? 8.5 : 3.2 })
                    .opacity(isPeak ? 0.98 : 0.48 * (1 - 0.55 * cp))
                    .glow(isPeak && cp > 0.2 ? 12 : 0, col),
            )
            if (isPeak && cp > 0.35) {
                const flareY = BASE_Y - h
                const pulseR = 14 + ((sp * 0.9 + bin.k * 0.11) % 1) * 18
                const pulseOp = (1 - ((sp * 0.9 + bin.k * 0.11) % 1)) * 0.65 * cp
                nodes.push(
                    // Additive blend('screen') energy flares at all 4 golden peaks!
                    circle(54, {
                        fill: radialGradient([0, 0], 54, [
                            [0, '#fff7d6aa'],
                            [0.4, '#ffd16644'],
                            [1, '#07091000'],
                        ]),
                        stroke: null,
                    })
                        .at(x, flareY)
                        .opacity(cp)
                        .set('blend', 'screen'),
                    circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.2 })
                        .at(x, flareY)
                        .opacity(pulseOp)
                        .glow(8, '#ffd166')
                        .set('blend', 'screen'),
                    line([x - 24, flareY], [x + 24, flareY], { stroke: '#fff7d6', width: 2.0 })
                        .opacity(0.72 * cp)
                        .glow(8, '#ffd166')
                        .set('blend', 'screen'),
                    line([x, flareY - 18], [x, flareY + 18], { stroke: '#fff7d6', width: 2.0 })
                        .opacity(0.72 * cp)
                        .glow(8, '#ffd166')
                        .set('blend', 'screen'),
                    dot(8.5, '#ffffff').at(x, flareY).glow(16, '#ffd166').opacity(cp).set('blend', 'screen'),
                    // Brightened crisp gold/white 25% labels cleanly above peak flares!
                    txt('25%', x, flareY - 54, 28, '#fff6d6', 'mono').glow(10, '#ffd166').opacity(cp),
                )
            }
            if (bin.k % 8 === 0 || bin.k === 31 || bin.k === 5) {
                const lblCol = isPeak ? '#ffd166' : bin.k === 5 ? '#ff9bb5' : '#9eb0d0'
                nodes.push(txt(`k=${bin.k}`, x, BASE_Y + 38, 26, lblCol, 'mono'))
            }
        }
        return group(...nodes)
    })

    const spacingEq = tex(String.raw`\Delta k = \frac{M}{r} = \frac{32}{4} = 8 \implies r = 4`, {
        size: 40,
        color: '#5ce1e6',
    })
        .at(0, 398)
        .glow(6, '#38bdf8')

    s.add(header, liveQft)
    c.at(0.1, () => s.play(spinProg.to(4.8, { duration: 13.0, ease: linear })))
    c.on('snap head-to-tail', () => {
        s.play(alignProg.to(1, { duration: 1.8 }))
        s.play(combProg.to(1, { duration: 2.6 }))
    })
    c.show('single measurement', spacingEq)
}

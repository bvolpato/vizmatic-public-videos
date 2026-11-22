import {
    Node, arrow, circle, contourPaths, dot, dynamic, group, line, linearGradient, polyPath, radialGradient,
    scalarField,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { QFT_32 } from '../math'
import { txt } from '../../../factory/style'

const CX = 405
const CY = 165
const WIDTH = 740
const FIELD_CX = 320
const FIELD_CY = 0
const FIELD_W = 1320
const FIELD_H = 1040
const FX: readonly [number, number] = [-6.6, 6.6]
const FY: readonly [number, number] = [-5.2, 5.2]

/** Lush continuous 2-source quantum wave interference intensity in [0, 1] with smooth radial taper. */
function quantumWaveField(wx: number, wy: number, t: number): number {
    // Two coherent quantum sources behind the harmonic comb
    const r1 = Math.hypot(wx + 1.55, wy - 0.15)
    const r2 = Math.hypot(wx - 1.55, wy - 0.15)
    const k = 4.6
    const w = 2.0
    const pathDiff = Math.cos(0.5 * k * (r1 - r2))
    const carrier = Math.cos(0.5 * k * (r1 + r2) - w * t)
    const fringe = pathDiff * pathDiff
    const ripple = 0.45 + 0.55 * carrier * carrier
    const radial = 1 / (0.68 + 0.22 * (r1 + r2))
    // Smooth elliptical vignette so fringes dissolve seamlessly into deep space and keep the left title clear
    const vx = (wx - 0.3) / 6.0
    const vy = wy / 4.85
    const env = Math.exp(-0.72 * (vx * vx + vy * vy))
    const leftMask = Math.max(0, Math.min(1, (wx + 5.6) / 3.4))
    const smoothLeft = leftMask * leftMask * (3 - 2 * leftMask)
    return Math.min(1, fringe * ripple * radial * 1.65 * env * smoothLeft)
}

function fieldToStage([wx, wy]: Vec): Vec {
    const sx = FIELD_CX + ((wx - FX[0]) / (FX[1] - FX[0]) - 0.5) * FIELD_W
    const sy = FIELD_CY - ((wy - FY[0]) / (FY[1] - FY[0]) - 0.5) * FIELD_H
    return [sx, sy]
}

export const intro: IntroFunction = (stage, clock) => {
    const prog = stage.value(0.78)
    const waveGrad = linearGradient([CX - WIDTH / 2, CY], [CX + WIDTH / 2, CY], ['#5ce1e6', '#a78bfa', '#ffd166', '#5ce1e6'])

    // Lush 2D quantum wave-interference scalarField (constructive gold/cyan fringes & dark cancellation nodes)
    const interferenceField = scalarField((wx, wy, time) => quantumWaveField(wx, wy, time * 1.4 + 0.5), {
        x: FX,
        y: FY,
        domain: [0, 1],
        width: FIELD_W,
        height: FIELD_H,
        resolution: [150, 118],
        colors: ['#07091000', '#0a143044', '#16386b99', '#2ea8ccbb', '#5ce1e6cc', '#ffd166dd', '#fff5ccff'],
    })
        .at(FIELD_CX, FIELD_CY)
        .opacity(0.82)
        .set('blend', 'screen')

    // Iso-amplitude contour fringes computed via marching squares
    const staticContours = contourPaths((wx, wy) => quantumWaveField(wx, wy, 1.05), {
        x: FX,
        y: FY,
        levels: [0.24, 0.44, 0.66],
        resolution: [84, 66],
    })
    const contourNodes: Node[] = []
    for (const lvl of staticContours) {
        const isHigh = lvl.level >= 0.6
        const isMid = lvl.level >= 0.4 && !isHigh
        const col = isHigh ? '#ffd166' : isMid ? '#5ce1e6' : '#60a5fa'
        const op = isHigh ? 0.58 : isMid ? 0.36 : 0.22
        const w = isHigh ? 2.0 : 1.3
        for (const poly of lvl.paths) {
            if (poly.length < 2) continue
            contourNodes.push(
                new Node(polyPath(poly.map(fieldToStage)))
                    .stroke(col, w, op)
                    .glow(isHigh ? 6 : 0, col)
                    .set('blend', 'screen'),
            )
        }
    }

    stage.add(
        interferenceField,
        group(...contourNodes),
        circle(540, {
            fill: radialGradient([0, 0], 540, [
                [0, '#ffd16628'],
                [0.45, '#38bdf81c'],
                [1, '#07091000'],
            ]),
            stroke: null,
        })
            .at(CX, -20)
            .set('blend', 'screen'),
        txt("SHOR'S ALGORITHM · 1994", -840, -204, 26, '#ffd166', 'mono', 'left').glow(4, '#ffd166'),
        txt('Quantum', -848, -80, 120, '#f8f4ec', 'serif', 'left').glow(8, '#90b4ff'),
        txt('Interference', -848, 48, 120, '#5ce1e6', 'serif', 'left').glow(10, '#38bdf8'),
        txt('Quantum computing without the hype', -840, 174, 34, '#cbd5e8', 'sans', 'left'),
        txt('Constructive peaks  ·  Destructive cancellation', -840, 238, 26, '#ffd166', 'mono', 'left').opacity(0.88),
        dynamic((time) => {
            const p = prog.value
            const nodes: Node[] = [
                line([CX - WIDTH / 2 - 14, CY], [CX + WIDTH / 2 + 14, CY], { stroke: '#3a4e7c', width: 2.2 }),
            ]

            // Continuous Dirichlet harmonic wave envelope across k = 0..31
            const envPts: Vec[] = Array.from({ length: 160 }, (_, i) => {
                const u = i / 159
                const kVal = u * 31
                let re = 0
                let im = 0
                for (let m = 0; m < 8; m++) {
                    const ang = (2 * Math.PI * (m * 4) * kVal) / 32
                    re += Math.cos(ang)
                    im += Math.sin(ang)
                }
                const prob = (re * re + im * im) / 64
                const x = CX - WIDTH / 2 + u * WIDTH
                const y = CY - 26 - prob * 290 * p
                return [x, y] as Vec
            })
            nodes.push(
                new Node(polyPath(envPts)).stroke(waveGrad, 2.8, 0.72).glow(8, '#5ce1e6').set('blend', 'screen'),
            )

            // Glowing QFT harmonic needles + spinning phase wheels above each peak
            const peakWheelY = CY - 395
            for (const bin of QFT_32) {
                const x = CX - WIDTH / 2 + (bin.k / (QFT_32.length - 1)) * WIDTH
                const isPeak = bin.prob > 0.1
                const h = isPeak ? 315 * p : 30 * (1 - p * 0.74)
                const col = isPeak ? '#ffd166' : '#5ce1e6'
                nodes.push(
                    line([x, CY], [x, CY - h], { stroke: col, width: isPeak ? 6.5 : 2.2 })
                        .opacity(isPeak ? 0.96 : 0.45)
                        .glow(isPeak ? 12 : 0, col),
                )
                if (isPeak) {
                    const wheelR = 36
                    const spinAng = time * 2.2 + (bin.k / 8) * (Math.PI / 2)
                    nodes.push(
                        circle(44, {
                            fill: radialGradient([0, 0], 44, [
                                [0, '#fff4cc90'],
                                [0.45, '#ffd16638'],
                                [1, '#07091000'],
                            ]),
                            stroke: null,
                        })
                            .at(x, CY - h)
                            .set('blend', 'screen'),
                        dot(8, '#ffffff').at(x, CY - h).glow(16, '#ffd166').set('blend', 'screen'),
                        // Spinning phase wheel hovering cleanly above each harmonic needle
                        circle(wheelR, { fill: '#0b142a99', stroke: '#5ce1e6', width: 2.0 })
                            .at(x, peakWheelY)
                            .glow(8, '#38bdf8')
                            .opacity(0.92),
                        circle(wheelR * 0.55, { fill: null, stroke: '#ffd166', width: 1.0 })
                            .at(x, peakWheelY)
                            .opacity(0.32),
                        arrow(
                            [x, peakWheelY],
                            [x + Math.cos(spinAng) * (wheelR - 5), peakWheelY - Math.sin(spinAng) * (wheelR - 5)],
                            { stroke: '#ffd166', width: 3.0, tip: 9 },
                        )
                            .glow(8, '#ffd166')
                            .set('blend', 'screen'),
                        dot(4, '#ffffff').at(x, peakWheelY).glow(8, '#ffd166').set('blend', 'screen'),
                    )
                }
            }
            return group(...nodes)
        }),
    )

    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

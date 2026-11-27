import {
    Node, arrow, circle, contourPaths, dot, dynamic, group, line, linearGradient, polyPath, radialGradient,
    scalarField,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { QFT_32 } from '../math'
import { txt } from '../../../factory/style'

// Full-Bleed Quantum Interference Horizon spanning all 1920px + Monumental Top-Center Title
const CX = 0
const CY = 408
const WIDTH = 1280
const FIELD_CX = 0
const FIELD_CY = 60
const FIELD_W = 1920
const FIELD_H = 1040
const FX: readonly [number, number] = [-8.4, 8.4]
const FY: readonly [number, number] = [-4.6, 4.6]

function quantumWaveField(wx: number, wy: number, t: number): number {
    const r1 = Math.hypot(wx + 2.2, wy + 0.4)
    const r2 = Math.hypot(wx - 2.2, wy + 0.4)
    const k = 4.2
    const w = 2.0
    const pathDiff = Math.cos(0.5 * k * (r1 - r2))
    const carrier = Math.cos(0.5 * k * (r1 + r2) - w * t)
    const fringe = pathDiff * pathDiff
    const ripple = 0.45 + 0.55 * carrier * carrier
    const radial = 1 / (0.72 + 0.18 * (r1 + r2))
    const vx = wx / 8.0
    const vy = (wy + 0.2) / 4.4
    const env = Math.exp(-0.62 * (vx * vx + vy * vy))
    return Math.min(1, fringe * ripple * radial * 1.75 * env)
}

function fieldToStage([wx, wy]: Vec): Vec {
    const sx = FIELD_CX + ((wx - FX[0]) / (FX[1] - FX[0]) - 0.5) * FIELD_W
    const sy = FIELD_CY - ((wy - FY[0]) / (FY[1] - FY[0]) - 0.5) * FIELD_H
    return [sx, sy]
}

export const poster: IntroFunction = (stage, clock) => {
    const prog = stage.value(0.78)
    const waveGrad = linearGradient([CX - WIDTH / 2, CY], [CX + WIDTH / 2, CY], ['#5ce1e6', '#a78bfa', '#ffd166', '#5ce1e6'])

    const interferenceField = scalarField((wx, wy, time) => quantumWaveField(wx, wy, time * 1.4 + 0.5), {
        x: FX,
        y: FY,
        domain: [0, 1],
        width: FIELD_W,
        height: FIELD_H,
        resolution: [160, 108],
        colors: ['#07091000', '#0a143044', '#16386b99', '#2ea8ccbb', '#5ce1e6cc', '#ffd166dd', '#fff5ccff'],
    })
        .at(FIELD_CX, FIELD_CY)
        .opacity(0.84)
        .set('blend', 'screen')

    const staticContours = contourPaths((wx, wy) => quantumWaveField(wx, wy, 1.05), {
        x: FX,
        y: FY,
        levels: [0.22, 0.42, 0.64],
        resolution: [96, 62],
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

    // Soft dark atmospheric cradle behind Top-Center monumental title
    const titleCradle = circle(720, {
        fill: radialGradient([0, 0], 720, [
            [0, '#070910ec'],
            [0.54, '#07091096'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(0, -340)

    stage.add(
        interferenceField,
        group(...contourNodes),
        circle(640, {
            fill: radialGradient([0, 0], 640, [
                [0, '#ffd1662c'],
                [0.45, '#38bdf820'],
                [1, '#07091000'],
            ]),
            stroke: null,
        })
            .at(CX, 160)
            .set('blend', 'screen'),
        dynamic((time) => {
            const p = prog.value
            const nodes: Node[] = [
                line([CX - WIDTH / 2 - 20, CY], [CX + WIDTH / 2 + 20, CY], { stroke: '#3a4e7c', width: 2.4 }),
            ]

            const envPts: Vec[] = Array.from({ length: 180 }, (_, i) => {
                const u = i / 179
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
                const y = CY - 26 - prob * 300 * p
                return [x, y] as Vec
            })
            nodes.push(
                new Node(polyPath(envPts)).stroke(waveGrad, 3.0, 0.78).glow(8, '#5ce1e6').set('blend', 'screen'),
            )

            const peakWheelY = CY - 405
            for (const bin of QFT_32) {
                const x = CX - WIDTH / 2 + (bin.k / (QFT_32.length - 1)) * WIDTH
                const isPeak = bin.prob > 0.1
                const h = isPeak ? 320 * p : 30 * (1 - p * 0.74)
                const col = isPeak ? '#ffd166' : '#5ce1e6'
                nodes.push(
                    line([x, CY], [x, CY - h], { stroke: col, width: isPeak ? 7.2 : 2.2 })
                        .opacity(isPeak ? 0.98 : 0.45)
                        .glow(isPeak ? 14 : 0, col),
                )
                if (isPeak) {
                    const wheelR = 38
                    const spinAng = time * 2.2 + (bin.k / 8) * (Math.PI / 2)
                    nodes.push(
                        circle(48, {
                            fill: radialGradient([0, 0], 48, [
                                [0, '#fff4cc96'],
                                [0.45, '#ffd1663c'],
                                [1, '#07091000'],
                            ]),
                            stroke: null,
                        })
                            .at(x, CY - h)
                            .set('blend', 'screen'),
                        dot(8.5, '#ffffff').at(x, CY - h).glow(16, '#ffd166').set('blend', 'screen'),
                        circle(wheelR, { fill: '#0b142ab0', stroke: '#5ce1e6', width: 2.2 })
                            .at(x, peakWheelY)
                            .glow(8, '#38bdf8')
                            .opacity(0.94),
                        circle(wheelR * 0.55, { fill: null, stroke: '#ffd166', width: 1.0 })
                            .at(x, peakWheelY)
                            .opacity(0.32),
                        arrow(
                            [x, peakWheelY],
                            [x + Math.cos(spinAng) * (wheelR - 5), peakWheelY - Math.sin(spinAng) * (wheelR - 5)],
                            { stroke: '#ffd166', width: 3.2, tip: 9 },
                        )
                            .glow(8, '#ffd166')
                            .set('blend', 'screen'),
                        dot(4.2, '#ffffff').at(x, peakWheelY).glow(8, '#ffd166').set('blend', 'screen'),
                    )
                }
            }
            return group(...nodes)
        }),
        titleCradle,
        // Clean Top-Center Monumental Title (removed tiny cramped 4th line!)
        txt("SHOR'S ALGORITHM   ·   1994", 0, -432, 26, '#ffd166', 'mono', 'center').glow(6, '#ffd166'),
        txt('Quantum Interference', 0, -326, 114, '#f8f4ec', 'serif', 'center').glow(10, '#5ce1e6'),
        txt('Quantum computing without the hype', 0, -220, 34, '#cbd5e8', 'sans', 'center'),
    )

    stage.at(0.02, () => stage.play(prog.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

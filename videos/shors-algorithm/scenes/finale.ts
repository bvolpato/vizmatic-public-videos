import {
    Node, circle, contourPaths, dot, dynamic, group, linear, linearGradient, polyPath, radialGradient,
    scalarField,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const WAVE_XS = Array.from({ length: 140 }, (_, i) => -760 + (1520 * i) / 139)
const CY = -165
const P_CX = -86
const Q_CX = 86

// Full 16:9 2-source interference field coordinates (1 unit = 120 stage px, centered at (0, 0))
const FIELD_W = 1920
const FIELD_H = 1080
const FX: readonly [number, number] = [-8.0, 8.0]
const FY: readonly [number, number] = [-4.5, 4.5]
const SRC_Y = -CY / 120 // scalarField +y is UP, stage CY=-165 is UP -> +1.375
const SRC_X = Q_CX / 120 // 0.7167

/** Genuine 2-source interference intensity emanating from prime p & prime q across the full 16:9 canvas. */
function twoSourceInterference(wx: number, wy: number, time: number): number {
    const r1 = Math.hypot(wx + SRC_X, wy - SRC_Y)
    const r2 = Math.hypot(wx - SRC_X, wy - SRC_Y)
    const k = 4.6
    // Exact constructive/destructive hyperbolic fringes * traveling wave crests
    const pathDiff = Math.cos(0.5 * k * (r1 - r2))
    const carrier = Math.cos(0.5 * k * (r1 + r2) - 2.1 * time)
    const fringe = pathDiff * pathDiff
    const ripple = 0.52 + 0.48 * carrier * carrier
    const radialFalloff = 1 / (0.65 + 0.16 * (r1 + r2))
    // Smooth organic vertical fade over the headline band (zero hard horizontal seam!)
    const s = Math.max(0, Math.min(1, (wy + 2.15) / 2.65))
    const textDim = 0.24 + 0.76 * (s * s * (3 - 2 * s))
    return Math.min(1, fringe * ripple * radialFalloff * 1.42 * textDim)
}

function fieldToStage([wx, wy]: Vec): Vec {
    const sx = ((wx - FX[0]) / (FX[1] - FX[0]) - 0.5) * FIELD_W
    const sy = -((wy - FY[0]) / (FY[1] - FY[0]) - 0.5) * FIELD_H
    return [sx, sy]
}

function isInsideTextZone([sx, sy]: Vec): boolean {
    // Keep contour strokes out of the prime p / prime q labels and bottom headline block
    if (sx > -455 && sx < -195 && sy > -350 && sy < -275) return true
    if (sx > 195 && sx < 455 && sy > -350 && sy < -275) return true
    if (sx > -680 && sx < 680 && sy > 65 && sy < 350) return true
    return false
}

function splitCleanSegments(pts: Vec[]): Vec[][] {
    const out: Vec[][] = []
    let cur: Vec[] = []
    for (const pt of pts) {
        if (isInsideTextZone(pt)) {
            if (cur.length >= 2) out.push(cur)
            cur = []
        } else {
            cur.push(pt)
        }
    }
    if (cur.length >= 2) out.push(cur)
    return out
}

export const finale: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const goldGrad = linearGradient([-760, CY], [760, CY], ['#5ce1e6', '#ffd166', '#5ce1e6'])

    // Genuine 2-source scalarField spanning the whole 16:9 canvas
    const interferenceField = scalarField((wx, wy, time) => twoSourceInterference(wx, wy, time), {
        x: FX,
        y: FY,
        domain: [0, 1],
        width: FIELD_W,
        height: FIELD_H,
        resolution: [192, 108],
        colors: ['#07091000', '#0a122822', '#132a5288', '#257099aa', '#5ce1e6bb', '#ffd166dd', '#fff5ccff'],
    })
        .at(0, 0)
        .opacity(0.68)
        .set('blend', 'screen')

    // Crisp marching-squares contour fringes tracing the constructive hyperbolic interference bands
    const contours = contourPaths((wx, wy) => twoSourceInterference(wx, wy, 1.2), {
        x: FX,
        y: FY,
        levels: [0.3, 0.52, 0.74],
        resolution: [96, 54],
    })
    const contourNodes: Node[] = []
    for (const lvl of contours) {
        const isGold = lvl.level >= 0.7
        const isCyan = lvl.level >= 0.5 && !isGold
        const col = isGold ? '#ffd166' : isCyan ? '#5ce1e6' : '#60a5fa'
        const op = isGold ? 0.52 : isCyan ? 0.3 : 0.18
        for (const poly of lvl.paths) {
            for (const seg of splitCleanSegments(poly.map(fieldToStage))) {
                contourNodes.push(
                    new Node(polyPath(seg))
                        .stroke(col, isGold ? 2.0 : 1.2, op)
                        .glow(isGold ? 6 : 0, col)
                        .set('blend', 'screen'),
                )
            }
        }
    }

    const liveLock = dynamic(() => {
        const ph = phase.value
        const nodes: Node[] = [
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ffd16634'],
                    [0.45, '#5ce1e61a'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            })
                .at(0, CY)
                .set('blend', 'screen'),
        ]

        // Background cancelling rose waves + constructive golden interference wave
        for (let k = 0; k < 3; k++) {
            const pts: Vec[] = WAVE_XS.map((x) => {
                const env = Math.exp(-(x * x) / (2 * 520 * 520))
                const y = CY + Math.sin(x * (0.014 + k * 0.004) + ph * (1.5 + k * 0.35)) * (36 - k * 8) * env
                return [x, y] as Vec
            })
            const isGold = k === 0
            nodes.push(
                new Node(polyPath(pts))
                    .stroke(isGold ? goldGrad : '#ff6b8b', isGold ? 4.2 : 2.0, isGold ? 0.94 : 0.3)
                    .glow(isGold ? 12 : 0, '#ffd166')
                    .set('blend', 'screen'),
            )
        }

        // Interlocked prime rings p and q emitting synchronized interference pulses
        const pulseR = 114 + ((ph * 0.55) % 1) * 95
        const pulseOp = (1 - ((ph * 0.55) % 1)) * 0.58
        nodes.push(
            circle(pulseR, { fill: null, stroke: '#5ce1e6', width: 2.0 })
                .at(P_CX, CY)
                .opacity(pulseOp)
                .glow(8, '#38bdf8')
                .set('blend', 'screen'),
            circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.0 })
                .at(Q_CX, CY)
                .opacity(pulseOp)
                .glow(8, '#ffd166')
                .set('blend', 'screen'),
            circle(116, { fill: null, stroke: '#5ce1e6', width: 4.4 }).at(P_CX, CY).glow(12, '#38bdf8'),
            circle(116, { fill: null, stroke: '#ffd166', width: 4.4 }).at(Q_CX, CY).glow(12, '#ffd166'),
            dot(6, '#5ce1e6').at(P_CX, CY).glow(12, '#38bdf8').set('blend', 'screen'),
            dot(6, '#ffd166').at(Q_CX, CY).glow(12, '#ffd166').set('blend', 'screen'),
            txt('prime p', P_CX - 235, CY - 148, 30, '#5ce1e6', 'mono').glow(6, '#38bdf8'),
            txt('prime q', Q_CX + 235, CY - 148, 30, '#ffd166', 'mono').glow(6, '#ffd166'),
            dot(9, '#ffffff').at(0, CY).glow(18, '#ffd166').set('blend', 'screen'),
        )
        return group(...nodes)
    })

    // Soft radial vignette cushion strictly behind headline text (far below the prime rings)
    const textScrim = circle(420, {
        fill: radialGradient([0, 0], 420, [
            [0, '#070910b8'],
            [0.55, '#07091066'],
            [1, '#07091000'],
        ]),
        stroke: null,
    })
        .at(0, 224)
        .scale([1.85, 0.44])

    const headline = group(
        txt("Quantum computers don't try everything faster.", 0, 112, 52, '#e2ebf8', 'serif'),
        txt('They cancel the wrong answers.', 0, 202, 74, '#ffd166', 'serif').glow(10, '#ffd166'),
        txt('Peter Shor (1994)  ·  Quantum Fourier Transform', 0, 308, 28, '#a8b8d8', 'mono'),
    )

    s.add(interferenceField, group(...contourNodes), liveLock, textScrim, headline)
    c.at(0.05, () => s.play(phase.to(7.5, { duration: 14.5, ease: linear })))
}

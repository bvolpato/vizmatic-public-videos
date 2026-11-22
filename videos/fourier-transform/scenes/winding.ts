import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import {
    SPEC_F_MAX,
    SPEC_F_MIN,
    WINDING_FREQS,
    WINDING_SPECTRUM,
    WINDING_T,
    windingCenterOfMass,
    windingSignal,
} from '../math'
import { txt } from '../../../factory/style'

// Right-upper polar winding machine center
const WX = 360
const WY = -125
const W_SCALE = 112
const COM_SCALE = 560 // Magnify center-of-mass displacement so resonances shoot dramatically outward!
const WIND_SAMPLES = 240

// Bottom spectrum graph bounds (0 Hz -> 9.6 Hz with explicit ticks & subtle vertical gridlines)
const SP_X0 = -820
const SP_X1 = 820
const SP_BASE_Y = 382
const SP_H = 190
const mapFreqX = (f: number) => SP_X0 + (f / SPEC_F_MAX) * (SP_X1 - SP_X0)
const mapMagY = (mag: number) => SP_BASE_Y - Math.min(1, mag / 0.3) * SP_H

// Precompute input waveform g(t) display points (top-left)
const WAVE_X0 = -840
const WAVE_X1 = -165
const WAVE_Y0 = -155
const INPUT_WAVE_PTS: Vec[] = Array.from({ length: 180 }, (_, i) => {
    const frac = i / 179
    const t = frac * WINDING_T
    const val = windingSignal(t) - 1.48
    return [WAVE_X0 + frac * (WAVE_X1 - WAVE_X0), WAVE_Y0 - val * 58] as Vec
})

const FREQ_TICKS = [0, 2, 4, 6, 8] as const

export const winding: SceneFunction = (s, c) => {
    const freqVal = s.value(1.02)
    const cursorT = s.value(0)
    const sceneLen = Math.max(10, c.beats[c.beats.length - 1]!.until - c.beats[0]!.start)

    const woundGrad = linearGradient([WX - 260, WY + 240], [WX + 260, WY - 240], ['#5ce1e6', '#60a5fa', '#a78bfa'])
    const specGrad = linearGradient([SP_X0, SP_BASE_Y], [SP_X1, SP_BASE_Y], ['#5ce1e6', '#a78bfa', '#ffd166'])

    const diag = 245
    const staticCopy = group(
        txt('The Winding Machine', -840, -425, 52, '#f8f4ec', 'serif', 'left'),
        tex(String.raw`g(t)\,e^{-2\pi i f t}`, { size: 46, color: '#5ce1e6' }).at(-650, -342).glow(6, '#38bdf8'),
        txt('Input wave g(t)', -840, -252, 26, '#9eb0d0', 'mono', 'left'),
        line([WAVE_X0, WAVE_Y0], [WAVE_X1, WAVE_Y0], { stroke: '#23304f', width: 1.5 }),
        new Node(polyPath(INPUT_WAVE_PTS)).stroke('#5ce1e6', 3.2, 0.92).glow(8, '#38bdf8').set('blend', 'screen'),

        // Brightened polar coordinate reticle on right
        circle(W_SCALE * 0.85, { fill: null, stroke: '#263459', width: 1.4, dash: [4, 7] }).at(WX, WY),
        circle(W_SCALE * 1.48, { fill: null, stroke: '#354878', width: 1.8, dash: [6, 8] }).at(WX, WY),
        circle(W_SCALE * 2.55, { fill: null, stroke: '#2b3c66', width: 1.6, dash: [6, 8] }).at(WX, WY),
        line([WX - 320, WY], [WX + 340, WY], { stroke: '#334674', width: 1.8 }),
        line([WX, WY - 300], [WX, WY + 290], { stroke: '#334674', width: 1.8 }),
        line([WX - diag, WY - diag], [WX + diag, WY + diag], { stroke: '#212e4e', width: 1.2 }),
        line([WX - diag, WY + diag], [WX + diag, WY - diag], { stroke: '#212e4e', width: 1.2 }),
        dot(5.5, '#cbd5e8').at(WX, WY).glow(6, '#5ce1e6'),

        // Bottom spectrum plot: subtle horizontal & vertical gridlines + explicit 0, 2, 4, 6, 8 Hz ticks
        line([SP_X0, SP_BASE_Y - SP_H * 0.5], [SP_X1, SP_BASE_Y - SP_H * 0.5], { stroke: '#19223a', width: 1.2, dash: [5, 8] }),
        line([SP_X0, SP_BASE_Y - SP_H], [SP_X1, SP_BASE_Y - SP_H], { stroke: '#19223a', width: 1.2, dash: [5, 8] }),
        ...FREQ_TICKS.map((tf) => {
            const tx = mapFreqX(tf)
            const isRes = tf === 2 || tf === 8
            return group(
                line([tx, SP_BASE_Y], [tx, SP_BASE_Y - SP_H], { stroke: isRes ? '#263659' : '#1b2540', width: 1.4 }),
                line([tx, SP_BASE_Y], [tx, SP_BASE_Y + 9], { stroke: '#4c608f', width: 2 }),
                txt(`${tf} Hz`, tx, SP_BASE_Y + 34, 26, '#8fa1c7', 'mono', tf === 0 ? 'left' : 'center'),
            )
        }),
        line([SP_X0, SP_BASE_Y], [SP_X1, SP_BASE_Y], { stroke: '#3a4b73', width: 2.4 }),
        txt('Winding frequency  f  (Hz)', -820, 464, 26, '#9eb0d0', 'mono', 'left'),
        txt('Center-of-mass distance  |W(f)|', 820, 464, 26, '#ffd166', 'mono', 'right'),
    )

    const liveWinding = dynamic(() => {
        const f = freqVal.value
        const [comRe, comIm] = windingCenterOfMass(f, 300)
        const comMag = Math.hypot(comRe, comIm)
        const comX = WX + comRe * COM_SCALE
        const comY = WY - comIm * COM_SCALE

        // Wound polar curve g(t) * e^{-2 pi i f t}
        const woundPts: Vec[] = []
        for (let i = 0; i < WIND_SAMPLES; i++) {
            const t = (WINDING_T * i) / (WIND_SAMPLES - 1)
            const r = windingSignal(t) * W_SCALE
            const ang = -2 * Math.PI * f * t
            woundPts.push([WX + r * Math.cos(ang), WY - r * Math.sin(ang)])
        }

        // Check proximity to exact resonances 2, 5, 8 Hz
        let minResDist = 99
        for (const rf of WINDING_FREQS) minResDist = Math.min(minResDist, Math.abs(f - rf))
        const resBoost = Math.max(0, 1 - minResDist / 0.35)

        // Spectrum trace up to current f
        const specPts: Vec[] = [[mapFreqX(0), SP_BASE_Y]]
        for (const pt of WINDING_SPECTRUM) {
            if (pt.f > f + 0.02) break
            specPts.push([mapFreqX(pt.f), mapMagY(pt.mag)])
        }
        if (specPts.length < 2) {
            specPts.push([mapFreqX(SPEC_F_MIN), SP_BASE_Y], [mapFreqX(f), mapMagY(comMag)])
        }

        const nodes: Node[] = [
            // Glowing radial halo at center-of-mass vector tip (flares dramatically at resonance!)
            circle(78 + resBoost * 105, {
                fill: radialGradient([0, 0], 78 + resBoost * 105, [
                    [0, resBoost > 0.25 ? '#ffd166aa' : '#ffd16652'],
                    [0.45, resBoost > 0.25 ? '#ff6b8b44' : '#5ce1e624'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(comX, comY).set('blend', 'screen'),
            new Node(polyPath(woundPts)).stroke(woundGrad, 3.4, 0.9).glow(8, '#5ce1e6').set('blend', 'screen'),
            new Node(polyPath(woundPts)).stroke('#ffffff', 1.0, 0.3),
            // Tether vector from origin to center of mass W(f)
            line([WX, WY], [comX, comY], { stroke: '#ffd166', width: 3.8 + resBoost * 2.0 })
                .glow(12, '#ffd166')
                .set('blend', 'screen'),
        ]

        // Glowing halo ring around center-of-mass tip
        nodes.push(
            circle(20 + resBoost * 12, { fill: null, stroke: '#ffd166', width: 2.2 })
                .at(comX, comY)
                .opacity(0.65 + 0.35 * resBoost)
                .glow(10, '#ffd166')
                .set('blend', 'screen'),
        )

        if (resBoost > 0.1) {
            nodes.push(
                circle(26 + (1 - resBoost) * 105, { fill: null, stroke: '#ffd166', width: 3.2 })
                    .at(comX, comY)
                    .opacity(resBoost * 0.92)
                    .glow(12, '#ffd166')
                    .set('blend', 'screen'),
            )
        }

        // Glowing gold center-of-mass dot
        nodes.push(
            dot(9.5 + resBoost * 4.5, '#ffd166').at(comX, comY).glow(18, '#ffd166').set('blend', 'screen'),
            dot(4.8, '#ffffff').at(comX, comY),
            // Live readouts on left below the input wave
            txt(`f = ${f.toFixed(2)} Hz`, -840, -8, 52, '#ffd166', 'mono', 'left').glow(8, '#ffd166'),
            txt(`Center of mass |W(f)| = ${comMag.toFixed(2)}`, -840, 58, 28, resBoost > 0.35 ? '#ffd166' : '#cbd5e8', 'mono', 'left'),
            // Moving tracer dot along input waveform g(t)
            dot(6.5, '#ffd166')
                .at(
                    WAVE_X0 + (cursorT.value % 1) * (WAVE_X1 - WAVE_X0),
                    WAVE_Y0 - (windingSignal((cursorT.value % 1) * WINDING_T) - 1.48) * 58,
                )
                .glow(12, '#ffd166')
                .set('blend', 'screen'),
            // Bottom live spectrum trace
            new Node(polyPath(specPts)).stroke(specGrad, 4.6, 0.96).glow(11, '#ffd166').set('blend', 'screen'),
            new Node(polyPath(specPts)).stroke('#ffffff', 1.3, 0.4),
            dot(7.5, '#ffffff').at(mapFreqX(f), mapMagY(comMag)).glow(15, '#ffd166').set('blend', 'screen'),
        )

        // Highlight discovered resonance spikes at 2, 5, 8 Hz once passed
        for (let k = 0; k < WINDING_FREQS.length; k++) {
            const rf = WINDING_FREQS[k]!
            if (f >= rf - 0.14) {
                const px = mapFreqX(rf)
                const [rRe, rIm] = windingCenterOfMass(rf, 240)
                const py = mapMagY(Math.hypot(rRe, rIm))
                nodes.push(
                    line([px, SP_BASE_Y], [px, py], { stroke: '#ffd166', width: 2.4, dash: [4, 5] }).opacity(0.7).set('blend', 'screen'),
                    circle(13, { fill: null, stroke: '#ffd166', width: 2.6 }).at(px, py).glow(10, '#ffd166').set('blend', 'screen'),
                    dot(5.5, '#ffffff').at(px, py),
                    txt(`${rf} Hz`, px, py - 46, 28, '#ffd166', 'mono').glow(6, '#ffd166'),
                )
            }
        }
        return group(...nodes)
    })

    s.add(staticCopy, liveWinding)
    const preTwoDur = Math.max(4.5, c.cue('two hertz').start - c.start - 0.35)
    c.at(0.1, () => s.play(cursorT.to(4.0, { duration: Math.max(6, sceneLen - 0.4), ease: linear })))
    c.at(0.1, () => s.play(freqVal.to(1.62, { duration: preTwoDur, ease: linear })))
    c.on('two hertz', () => s.play(freqVal.to(2.0, { duration: 1.1 })))
    c.on('Five hertz', () => s.play(freqVal.to(5.0, { duration: 1.9 })))
    c.on('Eight hertz', () => s.play(freqVal.to(8.0, { duration: 1.9 })))
    c.on('You just built', () => s.play(freqVal.to(9.4, { duration: 1.6 })))
}

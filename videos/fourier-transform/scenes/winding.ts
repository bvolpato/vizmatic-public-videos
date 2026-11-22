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
const WY = -115
const W_SCALE = 112
const COM_SCALE = 560 // Magnify center-of-mass displacement so resonances shoot dramatically outward!
const WIND_SAMPLES = 240

// Bottom spectrum graph bounds
const SP_X0 = -820
const SP_X1 = 820
const SP_BASE_Y = 395
const SP_H = 195
const mapFreqX = (f: number) => SP_X0 + ((f - SPEC_F_MIN) / (SPEC_F_MAX - SPEC_F_MIN)) * (SP_X1 - SP_X0)
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

export const winding: SceneFunction = (s, c) => {
    const freqVal = s.value(1.02)
    const cursorT = s.value(0)
    const sceneLen = Math.max(10, c.beats[c.beats.length - 1]!.until - c.beats[0]!.start)

    const woundGrad = linearGradient([WX - 260, WY + 240], [WX + 260, WY - 240], ['#5ce1e6', '#60a5fa', '#a78bfa'])
    const specGrad = linearGradient([SP_X0, SP_BASE_Y], [SP_X1, SP_BASE_Y], ['#5ce1e6', '#a78bfa', '#ffd166'])

    const staticCopy = group(
        txt('The Winding Machine', -840, -425, 52, '#f8f4ec', 'serif', 'left'),
        tex(String.raw`g(t)\,e^{-2\pi i f t}`, { size: 46, color: '#5ce1e6' }).at(-650, -342).glow(6, '#38bdf8'),
        txt('Input wave g(t)', -840, -252, 26, '#9eb0d0', 'mono', 'left'),
        line([WAVE_X0, WAVE_Y0], [WAVE_X1, WAVE_Y0], { stroke: '#1c243b', width: 1.4 }),
        new Node(polyPath(INPUT_WAVE_PTS)).stroke('#5ce1e6', 3.0, 0.9).glow(7, '#38bdf8'),

        // Polar plane guides on right
        circle(W_SCALE * 1.48, { fill: null, stroke: '#1e2740', width: 1.4, dash: [6, 8] }).at(WX, WY),
        circle(W_SCALE * 2.55, { fill: null, stroke: '#171e34', width: 1.2, dash: [6, 8] }).at(WX, WY),
        line([WX - 320, WY], [WX + 340, WY], { stroke: '#1d263e', width: 1.5 }),
        line([WX, WY - 300], [WX, WY + 290], { stroke: '#1d263e', width: 1.5 }),
        dot(4.5, '#9eb0d0').at(WX, WY),

        // Bottom spectrum axis
        line([SP_X0, SP_BASE_Y], [SP_X1, SP_BASE_Y], { stroke: '#2c3959', width: 2.2 }),
        txt('Winding frequency  f  (Hz)', -820, 442, 26, '#9eb0d0', 'mono', 'left'),
        txt('Center-of-mass distance  |W(f)|', 820, 442, 26, '#ffd166', 'mono', 'right'),
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
        const specPts: Vec[] = []
        for (const pt of WINDING_SPECTRUM) {
            if (pt.f > f + 0.02) break
            specPts.push([mapFreqX(pt.f), mapMagY(pt.mag)])
        }
        if (specPts.length < 2) {
            specPts.push([mapFreqX(SPEC_F_MIN), SP_BASE_Y], [mapFreqX(f), mapMagY(comMag)])
        }

        const nodes: Node[] = [
            // Soft glow at center of mass that flares at resonance!
            circle(54 + resBoost * 90, {
                fill: radialGradient([0, 0], 54 + resBoost * 90, [
                    [0, resBoost > 0.25 ? '#ffd16688' : '#ffd16630'],
                    [0.5, '#ff6b8b18'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(comX, comY),
            new Node(polyPath(woundPts)).stroke(woundGrad, 3.2, 0.88).glow(7, '#5ce1e6'),
            new Node(polyPath(woundPts)).stroke('#ffffff', 0.9, 0.26),
            // Tether vector from origin to center of mass W(f)
            line([WX, WY], [comX, comY], { stroke: '#ffd166', width: 3.4 + resBoost * 1.8 }).glow(9, '#ffd166'),
        ]

        if (resBoost > 0.1) {
            nodes.push(
                circle(22 + (1 - resBoost) * 95, { fill: null, stroke: '#ffd166', width: 3 }).at(comX, comY).opacity(resBoost * 0.9).glow(10, '#ffd166'),
            )
        }

        // Glowing gold center-of-mass dot
        nodes.push(
            dot(9 + resBoost * 4, '#ffd166').at(comX, comY).glow(16, '#ffd166'),
            dot(4.5, '#ffffff').at(comX, comY),
            // Live readouts on left below the input wave
            txt(`f = ${f.toFixed(2)} Hz`, -840, -8, 52, '#ffd166', 'mono', 'left').glow(8, '#ffd166'),
            txt(`Center of mass |W(f)| = ${comMag.toFixed(2)}`, -840, 58, 28, resBoost > 0.35 ? '#ffd166' : '#cbd5e8', 'mono', 'left'),
            // Moving tracer dot along input waveform g(t)
            dot(
                6.5,
                '#ffd166',
            ).at(
                WAVE_X0 + (cursorT.value % 1) * (WAVE_X1 - WAVE_X0),
                WAVE_Y0 - (windingSignal((cursorT.value % 1) * WINDING_T) - 1.48) * 58,
            ).glow(10, '#ffd166'),
            // Bottom live spectrum trace
            new Node(polyPath(specPts)).stroke(specGrad, 4.4, 0.95).glow(9, '#ffd166'),
            new Node(polyPath(specPts)).stroke('#ffffff', 1.2, 0.35),
            dot(7, '#ffffff').at(mapFreqX(f), mapMagY(comMag)).glow(14, '#ffd166'),
        )

        // Highlight discovered resonance spikes at 2, 5, 8 Hz once passed
        for (let k = 0; k < WINDING_FREQS.length; k++) {
            const rf = WINDING_FREQS[k]!
            if (f >= rf - 0.14) {
                const px = mapFreqX(rf)
                const [rRe, rIm] = windingCenterOfMass(rf, 240)
                const py = mapMagY(Math.hypot(rRe, rIm))
                nodes.push(
                    line([px, SP_BASE_Y], [px, py], { stroke: '#ffd166', width: 2.2, dash: [4, 5] }).opacity(0.6),
                    circle(12, { fill: null, stroke: '#ffd166', width: 2.4 }).at(px, py).glow(8, '#ffd166'),
                    dot(5, '#ffffff').at(px, py),
                    txt(`${rf} Hz`, px, py - 48, 28, '#ffd166', 'mono').glow(6, '#ffd166'),
                )
            }
        }
        return group(...nodes)
    })

    s.add(staticCopy, liveWinding)
    c.at(0.1, () => s.play(cursorT.to(4.0, { duration: Math.max(6, sceneLen - 0.4), ease: linear })))
    c.at(0.1, () => s.play(freqVal.to(1.45, { duration: 4.5 })))
    c.on('two hertz', () => s.play(freqVal.to(2.0, { duration: 1.1 })))
    c.on('Five hertz', () => s.play(freqVal.to(5.0, { duration: 1.9 })))
    c.on('Eight hertz', () => s.play(freqVal.to(8.0, { duration: 1.9 })))
    c.on('You just built', () => s.play(freqVal.to(9.4, { duration: 1.6 })))
}

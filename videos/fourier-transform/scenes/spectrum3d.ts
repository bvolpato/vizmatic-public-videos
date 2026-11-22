import {
    Node, circle, curve3d, dot, dynamic, group, label3d, line, line3d, linear, linearGradient,
    polyPath, radialGradient, scene3d, surface,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { stftHeight, stftSignal, stftSignalClean } from '../math'
import { txt } from '../../../factory/style'

const WX_HALF = 3.8
const WY_HALF = 3.2

// Map normalized frequency fNorm in [0.3, 4.8] -> world y in [-WY_HALF, WY_HALF]
const freqToY = (fNorm: number) => -WY_HALF + ((fNorm - 0.3) / 4.5) * (2 * WY_HALF)
// Map normalized time t in [0, 1] -> world x in [-WX_HALF, WX_HALF]
const timeToX = (t: number) => -WX_HALF + t * (2 * WX_HALF)

// Left-column 2D waveform comparison geometry (Original vs 10% Kept reconstruction)
const W_X0 = -840
const W_X1 = -355
const W_ORIG_Y = -98
const W_COMP_Y = 78
const W_AMP = 21
const W_SAMPLES = 180

const ORIG_WAVE_PTS: Vec[] = Array.from({ length: W_SAMPLES }, (_, i) => {
    const frac = i / (W_SAMPLES - 1)
    const t = 0.14 + frac * 0.62
    return [W_X0 + frac * (W_X1 - W_X0), W_ORIG_Y - stftSignal(t) * W_AMP] as Vec
})

const CLEAN_WAVE_PTS: Vec[] = Array.from({ length: W_SAMPLES }, (_, i) => {
    const frac = i / (W_SAMPLES - 1)
    const t = 0.14 + frac * 0.62
    return [W_X0 + frac * (W_X1 - W_X0), W_COMP_Y - stftSignalClean(t) * W_AMP] as Vec
})

function buildSpectrogram3D(compress: number, startTheta: number, startPhi: number) {
    const view = scene3d({
        theta: startTheta,
        phi: startPhi,
        distance: 16.0,
        unit: 118,
        perspective: true,
        ambient: 0.38,
        shine: 0.32,
        brightness: 1.08,
        fog: 0.1,
        focus: [0, 0, 0.72],
    }).at(205, 32)

    const terrain = surface((wx, wy) => stftHeight(wx, wy, compress, WX_HALF, WY_HALF), {
        x: [-WX_HALF, WX_HALF],
        y: [-WY_HALF, WY_HALF],
        resolution: [56, 56],
        colors:
            compress > 0.5
                ? ['#05070e', '#0c1124', '#1d3566', '#38bdf8', '#ffd166', '#fff2b2']
                : ['#060814', '#1b1d52', '#4c2f8a', '#2180c2', '#5ce1e6', '#ffd166'],
        mesh: compress > 0.5 ? '#ffd166' : '#7ce8ff',
        meshOpacity: compress > 0.5 ? 0.2 : 0.22,
        meshWidth: 0.7,
        opacity: 0.88,
    })

    // Luminous curve3d ridge crests with additive screen glow along the 3 triad harmonics + rising chirp!
    const chordFreqs = [1.05, 2.05, 3.15] as const
    const chordCols = ['#5ce1e6', '#a78bfa', '#ffd166'] as const
    const ridges = chordFreqs.map((fn, idx) => {
        const wy = freqToY(fn)
        return curve3d(
            (u): Vec3 => {
                const wx = timeToX(u)
                return [wx, wy, stftHeight(wx, wy, compress, WX_HALF, WY_HALF) + 0.08]
            },
            0.08,
            0.92,
            { color: chordCols[idx]!, width: 4.0, glow: 10, blend: 'screen', samples: 52, opacity: 0.96 },
        )
    })

    const chirpRidge = curve3d(
        (u): Vec3 => {
            const wx = timeToX(u)
            const wy = freqToY(0.65 + (4.35 - 0.65) * u)
            return [wx, wy, stftHeight(wx, wy, compress, WX_HALF, WY_HALF) + 0.09]
        },
        0.05,
        0.95,
        { color: '#ffd166', width: 5.0, glow: 12, blend: 'screen', samples: 64, opacity: 1 },
    )

    view.add(
        terrain,
        ...ridges,
        chirpRidge,
        // Explicit 3D axes: Time t, Freq f, Energy
        line3d([-WX_HALF, -WY_HALF, 0.03], [WX_HALF + 0.35, -WY_HALF, 0.03], {
            color: '#5ce1e6',
            width: 2.2,
            glow: 6,
            blend: 'screen',
            opacity: 0.82,
        }),
        line3d([-WX_HALF, -WY_HALF, 0.03], [-WX_HALF, WY_HALF + 0.35, 0.03], {
            color: '#a78bfa',
            width: 2.2,
            glow: 6,
            blend: 'screen',
            opacity: 0.82,
        }),
        line3d([-WX_HALF, -WY_HALF, 0.03], [-WX_HALF, -WY_HALF, 2.35], {
            color: '#ffd166',
            width: 2.2,
            glow: 6,
            blend: 'screen',
            opacity: 0.82,
        }),
        label3d('Time t', [0.5, -WY_HALF - 0.72, 0.05], { size: 26, color: '#5ce1e6', math: false, font: 'mono' }),
        label3d('Freq f', [-WX_HALF - 0.15, WY_HALF + 0.95, 0.05], { size: 26, color: '#a78bfa', math: false, font: 'mono' }),
        label3d('Energy', [-WX_HALF - 0.15, -WY_HALF, 2.55], { size: 26, color: '#ffd166', math: false, font: 'mono' }),
    )
    return view
}

export const spectrum3d: SceneFunction = (s, c) => {
    const scanU = s.value(0)
    const isCompressed = s.value(0)

    const aura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#4c2f8a28'],
            [0.55, '#2180c216'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(205, 42).set('blend', 'screen')

    const viewFull = buildSpectrogram3D(0, -0.82, 1.06)
    const viewCompressed = buildSpectrogram3D(1, -0.34, 0.96)

    const copyFull = group(
        txt('3D Spectrogram', -840, -408, 56, '#f8f4ec', 'serif', 'left'),
        txt('Time × Frequency', -840, -338, 46, '#5ce1e6', 'serif', 'left').glow(6, '#38bdf8'),
        txt('Triad chord + rising chirp', -840, -264, 26, '#ffd166', 'mono', 'left'),
        txt('Height = spectral energy', -840, 365, 28, '#9eb0d0', 'sans', 'left'),
    )

    const copyCompressed = group(
        txt('Sparse Ridges', -840, -408, 56, '#ffd166', 'serif', 'left').glow(6, '#ffd166'),
        txt('90% discarded', -840, -334, 46, '#ff6b8b', 'mono', 'left').glow(6, '#ff6b8b'),
        txt('10% preserves the music', -840, -264, 28, '#5ce1e6', 'sans', 'left'),
        txt('MP3  ·  JPEG  ·  Wi-Fi', -840, 365, 30, '#f8f4ec', 'mono', 'left'),
    )

    const origGrad = linearGradient([W_X0, W_ORIG_Y], [W_X1, W_ORIG_Y], ['#38bdf8', '#5ce1e6', '#a78bfa'])
    const compGrad = linearGradient([W_X0, W_COMP_Y], [W_X1, W_COMP_Y], ['#ff6b8b', '#ffd166', '#fff2b2'])

    // Live 2D waveform comparison panel filling the middle-left column cleanly!
    const waveformPanel = dynamic(() => {
        const u = scanU.value % 1
        const comp = isCompressed.value
        const sx = W_X0 + u * (W_X1 - W_X0)
        const idx = Math.min(W_SAMPLES - 1, Math.floor(u * (W_SAMPLES - 1)))
        const op = ORIG_WAVE_PTS[idx]!
        const cp = CLEAN_WAVE_PTS[idx]!
        const fidelityStr = comp > 0.5 ? 'Fidelity: 99.1%  (10% kept)' : 'Full signal  (100% bins)'
        const fidCol = comp > 0.5 ? '#ffd166' : '#5ce1e6'
        const barFrac = comp > 0.5 ? 0.991 : 1.0
        return group(
            txt('Original signal', W_X0, -172, 26, '#5ce1e6', 'mono', 'left'),
            line([W_X0, W_ORIG_Y], [W_X1, W_ORIG_Y], { stroke: '#222d4a', width: 1.4 }),
            new Node(polyPath(ORIG_WAVE_PTS)).stroke(origGrad, 2.8, 0.92).glow(6, '#5ce1e6').set('blend', 'screen'),
            dot(5.5, '#ffffff').at(op[0], op[1]).glow(10, '#5ce1e6').set('blend', 'screen'),

            txt('10% Kept reconstruction', W_X0, 4, 26, '#ffd166', 'mono', 'left'),
            line([W_X0, W_COMP_Y], [W_X1, W_COMP_Y], { stroke: '#222d4a', width: 1.4 }),
            new Node(polyPath(CLEAN_WAVE_PTS))
                .stroke(compGrad, comp > 0.5 ? 3.2 : 2.6, comp > 0.5 ? 0.98 : 0.78)
                .glow(comp > 0.5 ? 9 : 6, '#ffd166')
                .set('blend', 'screen'),
            dot(5.5, '#ffffff').at(cp[0], cp[1]).glow(10, '#ffd166').set('blend', 'screen'),

            // Synchronized vertical playhead linking both waveforms
            line([sx, W_ORIG_Y - 52], [sx, W_COMP_Y + 52], { stroke: '#ffd166', width: 1.6, dash: [4, 5] }).opacity(0.45).set('blend', 'screen'),

            // Fidelity readout & glowing meter bar
            txt(fidelityStr, W_X0, 192, 26, fidCol, 'mono', 'left').glow(6, fidCol),
            line([W_X0, 232], [W_X1, 232], { stroke: '#222d4a', width: 9 }),
            line([W_X0, 232], [W_X0 + (W_X1 - W_X0) * barFrac, 232], { stroke: fidCol, width: 9 }).glow(8, fidCol).set('blend', 'screen'),
        )
    })

    s.add(aura, viewFull, copyFull, waveformPanel)
    c.at(0.1, () => {
        s.play(viewFull.orbit({ theta: -0.34, phi: 0.96 }), { duration: 12.0 })
    })
    c.at(0.1, () => {
        const sceneLen = Math.max(10, c.beats[c.beats.length - 1]!.until - c.beats[0]!.start)
        s.play(scanU.to(3.2, { duration: Math.max(8, sceneLen - 0.5), ease: linear }))
    })

    c.swap('tallest golden ridges', [viewFull, copyFull], [viewCompressed, copyCompressed])
    c.on('tallest golden ridges', () => {
        s.play(isCompressed.to(1, { duration: 0.3 }))
    })
    c.on('ninety percent', () => {
        s.play(viewCompressed.orbit({ theta: 0.24, phi: 0.88 }), { duration: 5.5 })
    })
}

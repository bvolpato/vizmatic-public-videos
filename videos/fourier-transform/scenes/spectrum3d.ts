import {
    circle, curve3d, group, line3d, radialGradient, scene3d, surface,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { stftHeight } from '../math'
import { txt } from '../../../factory/style'

const WX_HALF = 3.8
const WY_HALF = 3.2

// Map normalized frequency fNorm in [0.3, 4.8] -> world y in [-WY_HALF, WY_HALF]
const freqToY = (fNorm: number) => -WY_HALF + ((fNorm - 0.3) / 4.5) * (2 * WY_HALF)
// Map normalized time t in [0, 1] -> world x in [-WX_HALF, WX_HALF]
const timeToX = (t: number) => -WX_HALF + t * (2 * WX_HALF)

function buildSpectrogram3D(compress: number, startTheta: number, startPhi: number) {
    const view = scene3d({
        theta: startTheta,
        phi: startPhi,
        distance: 15.2,
        unit: 126,
        perspective: true,
        ambient: 0.38,
        shine: 0.32,
        brightness: 1.08,
        fog: 0.1,
        focus: [0, 0, 0.72],
    }).at(190, 40)

    const terrain = surface((wx, wy) => stftHeight(wx, wy, compress, WX_HALF, WY_HALF), {
        x: [-WX_HALF, WX_HALF],
        y: [-WY_HALF, WY_HALF],
        resolution: [48, 44],
        colors:
            compress > 0.5
                ? ['#05070e', '#0c1124', '#1d3566', '#38bdf8', '#ffd166', '#fff2b2']
                : ['#060814', '#1b1d52', '#4c2f8a', '#2180c2', '#5ce1e6', '#ffd166'],
        mesh: compress > 0.5 ? '#ffd166' : '#7ce8ff',
        meshOpacity: compress > 0.5 ? 0.22 : 0.24,
        meshWidth: 0.75,
        opacity: 0.88,
    })

    // Luminous golden curve3d ridge crests along the 3 musical triad harmonics + rising diagonal chirp!
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
            { color: chordCols[idx]!, width: 3.8, glow: 9, samples: 44, opacity: 0.95 },
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
        { color: '#ffd166', width: 4.8, glow: 12, samples: 56, opacity: 1 },
    )

    view.add(
        terrain,
        ...ridges,
        chirpRidge,
        // Subtle base perimeter frame lines in 3D space
        line3d([-WX_HALF, -WY_HALF, 0.03], [WX_HALF, -WY_HALF, 0.03], { color: '#4d608c', width: 1.6, opacity: 0.55 }),
        line3d([-WX_HALF, -WY_HALF, 0.03], [-WX_HALF, WY_HALF, 0.03], { color: '#4d608c', width: 1.6, opacity: 0.55 }),
    )
    return view
}

export const spectrum3d: SceneFunction = (s, c) => {
    const aura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#4c2f8a22'],
            [0.55, '#2180c214'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(190, 40)

    const viewFull = buildSpectrogram3D(0, -0.82, 1.06)
    const viewCompressed = buildSpectrogram3D(1, -0.34, 0.96)

    const copyFull = group(
        txt('3D Spectrogram', -840, -395, 58, '#f8f4ec', 'serif', 'left'),
        txt('Time × Frequency', -840, -322, 50, '#5ce1e6', 'serif', 'left').glow(6, '#38bdf8'),
        txt('Triad chord + rising chirp', -840, -238, 28, '#ffd166', 'mono', 'left'),
        txt('Height = spectral energy', -840, 345, 28, '#9eb0d0', 'sans', 'left'),
    )

    const copyCompressed = group(
        txt('Sparse Ridges', -840, -395, 58, '#ffd166', 'serif', 'left').glow(6, '#ffd166'),
        txt('90% discarded', -840, -315, 48, '#ff6b8b', 'mono', 'left').glow(6, '#ff6b8b'),
        txt('10% preserves the music', -840, -245, 32, '#5ce1e6', 'sans', 'left'),
        txt('MP3  ·  JPEG  ·  Wi-Fi', -840, 345, 30, '#f8f4ec', 'mono', 'left'),
    )

    s.add(aura, viewFull, copyFull)
    c.at(0.1, () => {
        s.play(viewFull.orbit({ theta: -0.34, phi: 0.96 }), { duration: 12.0 })
    })

    c.swap('tallest golden ridges', [viewFull, copyFull], [viewCompressed, copyCompressed])
    c.on('ninety percent', () => {
        s.play(viewCompressed.orbit({ theta: 0.24, phi: 0.88 }), { duration: 5.5 })
    })
}

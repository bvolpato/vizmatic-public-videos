import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    HOOK_CONTOUR,
    HOOK_DFT,
    SHAPE_CONTOUR,
    SHAPE_DFT,
    maxRoundTripError,
    parsevalFreqEnergy,
    parsevalTimeEnergy,
    windingCenterOfMass,
} from './math'
import { intro } from './scenes/intro'
import { hook } from './scenes/hook'
import { winding } from './scenes/winding'
import { epicycles } from './scenes/epicycles'
import { spectrum3d } from './scenes/spectrum3d'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

assertEqual(
    Math.abs(parsevalTimeEnergy(HOOK_CONTOUR) - parsevalFreqEnergy(HOOK_DFT)) < 1e-10,
    true,
    'Parseval theorem holds for hook contour DFT (< 1e-10)',
)
assertEqual(
    Math.abs(parsevalTimeEnergy(SHAPE_CONTOUR) - parsevalFreqEnergy(SHAPE_DFT)) < 1e-10,
    true,
    'Parseval theorem holds for shape silhouette DFT (< 1e-10)',
)
assertEqual(
    maxRoundTripError(SHAPE_CONTOUR) < 1e-10,
    true,
    'Inverse DFT recovers exact contour samples (< 1e-10)',
)
assertEqual(
    Math.hypot(...windingCenterOfMass(5.0)) > 5 * Math.hypot(...windingCenterOfMass(3.5)),
    true,
    'Winding center of mass resonates sharply at hidden 5 Hz frequency',
)

const chapters: Record<string, SceneFunction> = { hook, winding, epicycles, spectrum3d, finale }

function chapter(index: number): SceneFunction {
    const scene = timing.scenes[index]!
    return (stage, cue, clock) => {
        for (const [i, beat] of cue.beats.entries()) {
            const captions = stage.captions.filter((c) => c.t0 >= beat.start - 0.002 && c.t0 < beat.end - 0.002)
            if (captions.length > 0) {
                const measured = { ...scene.beats[i]!, start: beat.start, end: beat.end }
                if (!(typeof measured.wav === 'string' && measured.wav.includes('-el-'))) {
                    const aligned = retimeBeatCaptions(captions, measured, script.pronounce)
                    stage.captions.splice(stage.captions.indexOf(captions[0]!), captions.length, ...aligned.captions)
                }
            }
        }
        stage.add(nebula(0, -40, 760, '#1e275228', '#17143314'), ...starfield(140, index + 1))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'The Fourier Transform: Turning Chaos Into Epicycles & Music',
    description: 'A cinematic visual journey into the Fourier Transform, winding machine, DFT epicycles, and 3D spectrograms.',
    width: 1920,
    height: 1080,
    fps: 30,
    background: COSMOS.bg,
    bloom: 0.24,
    bleed: true,
    intro,
    timing,
    scenes: Object.fromEntries(timing.scenes.map((scene, index) => [scene.id, chapter(index)])),
})

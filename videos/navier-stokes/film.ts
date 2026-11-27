import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    SHEAR_VORTICES,
    coRotatingPair,
    contourCirculation,
    numericalDivergence,
    totalCirculation,
} from './math'
import { hook } from './scenes/hook'
import { equation } from './scenes/equation'
import { vortices } from './scenes/vortices'
import { cascade3d } from './scenes/cascade3d'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

assertEqual(
    Math.abs(numericalDivergence(0.7, -0.4, SHEAR_VORTICES, 1.4)) < 1e-9,
    true,
    'Lamb-Oseen multi-vortex + shear velocity field is incompressible (div u < 1e-9)',
)
assertEqual(
    Math.abs(numericalDivergence(-1.1, 0.85, coRotatingPair(1.7), 0)) < 1e-9,
    true,
    'Co-rotating vortex pair field is incompressible (div u < 1e-9)',
)
assertEqual(
    Math.abs(contourCirculation(SHEAR_VORTICES, 14.0, 256) - totalCirculation(SHEAR_VORTICES)) < 1e-5,
    true,
    'Closed contour integral recovers exact total vortex circulation',
)
assertEqual(
    Math.abs(totalCirculation(coRotatingPair(4.2)) - totalCirculation(coRotatingPair(0))) < 1e-12,
    true,
    'Total circulation of co-rotating vortex pair is conserved over time',
)

const chapters: Record<string, SceneFunction> = { hook, equation, vortices, cascade3d, finale }

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
    title: 'The Navier-Stokes $1,000,000 Problem: Why Turbulence Breaks Math',
    description: 'Millennium Prize #2: A cinematic visual journey through fluid turbulence, vortices, and finite-time blow-up.',
    width: 1920,
    height: 1080,
    fps: 30,
    background: COSMOS.bg,
    bloom: 0.24,
    bleed: true,
    intro: false,
    firstSceneTransition: 'cut',
    timing,
    scenes: Object.fromEntries(timing.scenes.map((scene, index) => [scene.id, chapter(index)])),
})

import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    HOOK_PARTICLES, TARGET_MODES, flowMatchingTrajectory, lerpPt,
} from './math'
import { hook } from './scenes/hook'
import { noisefield } from './scenes/noisefield'
import { curvedvsstraight } from './scenes/curvedvsstraight'
import { density3d } from './scenes/density3d'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

// Build-time mathematical verification: exact interpolation endpoints, mixture normalization, & 4-step Euler exactness
const p0 = [-1.4, 0.85] as const
const p1 = [1.25, -0.6] as const
const at0 = lerpPt(p0, p1, 0)
const at1 = lerpPt(p0, p1, 1)
assertEqual(Math.hypot(at0[0] - p0[0], at0[1] - p0[1]) < 1e-12, true, 'Linear interpolation at t=0 must equal x0')
assertEqual(Math.hypot(at1[0] - p1[0], at1[1] - p1[1]) < 1e-12, true, 'Linear interpolation at t=1 must equal x1')

const weightSum = TARGET_MODES.reduce((acc, m) => acc + m.weight, 0)
assertEqual(Math.abs(weightSum - 1) < 1e-12, true, 'Gaussian mixture weights must sum to 1')
assertEqual(TARGET_MODES.every((m) => m.weight > 0), true, 'All Gaussian mixture weights must be positive')

const straight4 = flowMatchingTrajectory(p0, p1, 4)
const end4 = straight4[straight4.length - 1]!
assertEqual(Math.hypot(end4[0] - p1[0], end4[1] - p1[1]) < 1e-12, true, '4-step Euler on straight velocity reaches exact x1')
assertEqual(HOOK_PARTICLES.length >= 1200, true, 'Hook constellation uses 1,200+ deterministic particles')

const chapters: Record<string, SceneFunction> = { hook, noisefield, curvedvsstraight, density3d, finale }

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
        stage.add(nebula(0, -40, 780, '#1e1c4a2b', '#12183614'), ...starfield(135, index + 37, COSMOS.gold))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'Diffusion & Flow Matching: How AI Sculpts Noise Into Reality',
    description: 'A cinematic visual journey from chaotic Gaussian noise through velocity vector fields, 50-step curved diffusion vs 4-step straight flow matching, and an orbiting 3D probability density manifold.',
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

import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    DUAL_EXPONENT,
    SQUARE_EXPONENT,
    TRIPOD_PERIMETER,
    TRIPOD_SHARED_RATE,
    UPPER_MILESTONES,
    minBorderRank,
    minNonlinearGates,
    naive2x2,
    omegaOfT,
    rectangularOmega,
    strassen2x2,
} from './math'
import { intro } from './scenes/intro'
import { hook } from './scenes/hook'
import { race } from './scenes/race'
import { geometry } from './scenes/geometry'
import { ai } from './scenes/ai'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

// Build-time mathematical invariants matching MatrixExponent.lean (OAI Family 379)
assertEqual(Math.abs(SQUARE_EXPONENT - 9 / 4) < 1e-12, true, 'Tripod ratio 6 / (8/3) must equal 9/4')
assertEqual(Math.abs(TRIPOD_PERIMETER / TRIPOD_SHARED_RATE - 2.25) < 1e-12, true, 'Tripod perimeter/rate = 2.25')
assertEqual(Math.abs(rectangularOmega(1, 1, 1) - 9 / 4) < 1e-12, true, 'omega(1, 1, 1) must equal 9/4')
assertEqual(Math.abs(omegaOfT(0) - 2) < 1e-12, true, 'omega(1, 1, 0) must equal 2')
assertEqual(Math.abs(omegaOfT(DUAL_EXPONENT) - 2) < 1e-12, true, 'omega(1, 1, 1/2) must equal 2')
assertEqual(omegaOfT(0.55) > 2, true, 'omega(1, 1, t) must exceed 2 strictly above alpha = 1/2')
assertEqual(Math.abs(omegaOfT(1) - 2.25) < 1e-12, true, 'omega(1, 1, 1) must equal 2.25')
assertEqual(minBorderRank(256), 2 ** 18, 'Border rank floor at n = 256 must equal 2^18')
assertEqual(minNonlinearGates(256), 2 ** 17, 'Nonlinear gate floor at n = 256 must equal 2^17')
assertEqual(
    UPPER_MILESTONES.every((m, idx) => idx === 0 || m.omega <= UPPER_MILESTONES[idx - 1]!.omega),
    true,
    'Historical upper-bound milestones must be non-increasing',
)
const strassenA = [3, -2, 5, 7] as const
const strassenB = [4, 1, -6, 2] as const
const sOut = strassen2x2(strassenA, strassenB)
const nOut = naive2x2(strassenA, strassenB)
assertEqual(
    Math.max(...sOut.map((v, i) => Math.abs(v - nOut[i]!))) < 1e-12,
    true,
    'Strassen 7-product identity must match exact 2x2 matrix multiplication',
)

const chapters: Record<string, SceneFunction> = { hook, race, geometry, ai, finale }

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
        stage.add(nebula(0, -40, 780, '#18244d2a', '#11163314'), ...starfield(135, index + 23, COSMOS.gold))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'Matrix Multiplication: Why ω = 9/4 Changes Computing',
    description:
        'A cinematic breakdown of the November 2026 Lean 4 proof pinning matrix multiplication at ω = 9/4: the 57-year race from Strassen, CAT(0) tripod tensor geometry, the α = 1/2 rectangular law, and what it really means for AI and GPUs.',
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

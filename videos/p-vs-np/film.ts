import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    DEMO_3SAT,
    DEMO_WITNESS,
    EXP_266,
    EXP_266_UNIVERSE_RATIO,
    PEQUALNP_FRONTS,
    THREE_BARRIERS,
    UNIVERSE_ATOMS,
    countSolutions3SAT,
    verify3SAT,
} from './math'
import { hook } from './scenes/hook'
import { worlds } from './scenes/worlds'
import { barriers } from './scenes/barriers'
import { pequalnp } from './scenes/pequalnp'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

// Build-time verification of 3-SAT verifier, witness, and universe-scale exponential bounds
assertEqual(verify3SAT(DEMO_3SAT, DEMO_WITNESS), true, 'DEMO_WITNESS must satisfy all 4 DEMO_3SAT clauses')
assertEqual(verify3SAT(DEMO_3SAT, [false, false, false, true]), false, 'Counter-assignment must fail DEMO_3SAT')
assertEqual(countSolutions3SAT(DEMO_3SAT, 4) > 0, true, 'DEMO_3SAT must be satisfiable')
assertEqual(EXP_266 > UNIVERSE_ATOMS && EXP_266 < UNIVERSE_ATOMS * 1.25, true, '2^266 must sit right at ~10^80 atoms in the observable universe')
assertEqual(EXP_266_UNIVERSE_RATIO > 1.1 && EXP_266_UNIVERSE_RATIO < 1.25, true, '2^266 / 10^80 ~ 1.19')
assertEqual(Math.abs(Math.log10(EXP_266) - 80) < 0.08, true, '266 is the closest integer exponent of 2 to 10^80')
assertEqual(THREE_BARRIERS.length, 3, 'Must cover all three proof walls')
assertEqual(PEQUALNP_FRONTS.length, 5, 'Must list all 5 active Lean research fronts')

const chapters: Record<string, SceneFunction> = { hook, worlds, barriers, pequalnp, finale }

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
        stage.add(nebula(0, -40, 1180, '#18244d28', '#10153010'), ...starfield(135, index + 31, COSMOS.cyan))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'P vs NP: The $1,000,000 Problem & the Live AI Proof Fleet',
    description:
        'A cinematic breakdown of P vs NP, what breaks if P = NP vs P ≠ NP, the three proof walls explained intuitively, and the live AI fleet attacking it in Lean 4 at pequalnp.com.',
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

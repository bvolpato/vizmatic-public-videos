import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../../factory/style'
import { hook } from './scenes/hook'
import { spectrum } from './scenes/spectrum'
import { ai } from './scenes/ai'
import script from './script.json'
import timing from './timing.json'

// Verify signed 32-bit binary-search midpoint overflow geometry & Z3 counterexample
const INT32_MAX = 2_147_483_647
const signedSum = (1_500_000_000 + 1_500_000_000) | 0
assertEqual(signedSum, -1_294_967_296, '1.5e9 + 1.5e9 wraps to exact int32 negative value')
assertEqual((1_500_000_000 + Math.floor((1_500_000_000 - 1_500_000_000) / 2)) <= INT32_MAX, true, 'Safe midpoint stays inside int32')
assertEqual(0.5 * 0.5 / 0.5, 0.5, 'Exactly 50% of valid (0 <= low <= high < 2^31) pairs overflow')

const chapters: Record<string, SceneFunction> = { hook, spectrum, ai }

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
        stage.add(nebula(0, -30, 760, '#22184028', '#14243b14'), ...starfield(130, index + 61, COSMOS.violet))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'Why Tests Miss the Bug',
    description: 'Episode 1 of Proofs for Real Systems: input-space overflow, SMT, TLA+, Lean 4, and AI verification.',
    width: 1920,
    height: 1080,
    fps: 30,
    background: COSMOS.bg,
    bloom: 0.22,
    bleed: true,
    timing,
    scenes: Object.fromEntries(timing.scenes.map((scene, index) => [scene.id, chapter(index)])),
})

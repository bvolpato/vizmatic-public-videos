import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../../factory/style'
import { tiles } from './scenes/tiles'
import { induction } from './scenes/induction'
import { kernel } from './scenes/kernel'
import script from './script.json'
import timing from './timing.json'

// Verify generalized tail-recursive reversal theorem: revAux(xs, acc) = reverse(xs) ++ acc
function revAux<T>(xs: readonly T[], acc: readonly T[]): T[] {
    return xs.length === 0 ? [...acc] : revAux(xs.slice(1), [xs[0]!, ...acc])
}
assertEqual(revAux([1, 2, 3, 4, 5], []).join(','), '5,4,3,2,1', 'revAux [1..5] [] = [5..1]')
assertEqual(revAux([3, 4, 5], [2, 1]).join(','), '5,4,3,2,1', 'Generalized accumulator invariant holds at every step')

const chapters: Record<string, SceneFunction> = { tiles, induction, kernel }

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
        stage.add(nebula(0, -30, 760, '#24184028', '#142a3a14'), ...starfield(130, index + 81, COSMOS.cyan))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'Lean 4: Inside a Machine-Checked Proof',
    description: 'Episode 3 of Proofs for Real Systems: tail-recursive list reversal, generalized induction, and Lean’s kernel.',
    width: 1920,
    height: 1080,
    fps: 30,
    background: COSMOS.bg,
    bloom: 0.22,
    bleed: true,
    intro: false,
    firstSceneTransition: 'cut',
    timing,
    scenes: Object.fromEntries(timing.scenes.map((scene, index) => [scene.id, chapter(index)])),
})

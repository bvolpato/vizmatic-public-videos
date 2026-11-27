import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    HALT_MATRIX,
    SAMPLE_EXPONENTS,
    SAMPLE_GODEL_NUMBER,
    decodeGodel,
    encodeGodel,
    verifyDiagonalContradiction,
} from './math'
import { hook } from './scenes/hook'
import { godelnumber } from './scenes/godelnumber'
import { diagonal } from './scenes/diagonal'
import { horizon3d } from './scenes/horizon3d'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

assertEqual(encodeGodel([2, 1, 3]), 1500n, '2^2 * 3^1 * 5^3 equals 1500')
assertEqual(
    JSON.stringify(decodeGodel(SAMPLE_GODEL_NUMBER)),
    JSON.stringify(SAMPLE_EXPONENTS),
    'Unique prime factorization recovers exact Gödel symbol sequence',
)
assertEqual(
    verifyDiagonalContradiction(HALT_MATRIX),
    true,
    'Diagonal rebel machine D disagrees with every row i at column i',
)

const chapters: Record<string, SceneFunction> = { hook, godelnumber, diagonal, horizon3d, finale }

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
        stage.add(nebula(0, -40, 760, '#1e275228', '#17143314'), ...starfield(140, index + 11))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'Gödel & the Halting Problem: Why No AI Can Prove Every Truth',
    description: 'A visual journey through Gödel incompleteness, prime-power numbering, Turing halting diagonalization, and the expanding 3D horizon of unprovable truths.',
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

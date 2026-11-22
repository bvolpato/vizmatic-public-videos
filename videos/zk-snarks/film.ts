import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    BN254_FIELD_ORDER, CHALLENGE_GAP, FORGED_QAP, FORGED_WITNESS, GATE_ROOTS,
    HONEST_QAP, HONEST_WITNESS, WIRE_TRACE_POLY, evalPoly, evaluateR1CS, schwartzZippelBound,
} from './math'
import { intro } from './scenes/intro'
import { hook } from './scenes/hook'
import { circuit } from './scenes/circuit'
import { poly3d } from './scenes/poly3d'
import { commitment } from './scenes/commitment'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

assertEqual(evaluateR1CS(HONEST_WITNESS).unsatisfiedCount, 0, 'Honest witness x=3 satisfies all 4 R1CS gates')
assertEqual(evaluateR1CS(FORGED_WITNESS).unsatisfiedCount > 0, true, 'Forged witness fails R1CS verification')
assertEqual(
    GATE_ROOTS.every((r, i) => Math.abs(evalPoly(WIRE_TRACE_POLY, r) - [9, 27, 30, 35][i]!) < 1e-9),
    true,
    'Lagrange polynomial interpolates exact gate wire outputs',
)
assertEqual(HONEST_QAP.maxRemainder < 1e-9, true, 'Honest P(t) = H(t) * Z(t) has zero remainder on all gate roots')
assertEqual(FORGED_QAP.maxRemainder > 1, true, 'Forged P(t) fails QAP divisibility by Z(t)')
assertEqual(schwartzZippelBound(1e6, BN254_FIELD_ORDER) < 1e-70, true, 'Schwartz-Zippel error < 10^-70 over BN254')
assertEqual(CHALLENGE_GAP > 0.3, true, 'Random challenge point cleanly exposes the honest vs forged gap')

const chapters: Record<string, SceneFunction> = { hook, circuit, poly3d, commitment, finale }

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
    title: 'Zero-Knowledge Proofs: Proving a Secret Without Showing a Bit',
    description: 'A cinematic visual journey inside zk-SNARKs: R1CS gates, Lagrange polynomials, 3D Schwartz-Zippel surfaces, and homomorphic blinding.',
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

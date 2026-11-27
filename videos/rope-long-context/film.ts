import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    PROOF_FREQS, PROOF_K, PROOF_Q, ROPE_DEFAULT_BASE, ROPE_DEMO_DIM,
    applyRoPE, dot, ntkScaledBase, relativePositionError, ropeKernel,
} from './math'
import { hook } from './scenes/hook'
import { clocks } from './scenes/clocks'
import { helix3d } from './scenes/helix3d'
import { longcontext } from './scenes/longcontext'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

// Build-time mathematical proofs for RoPE relative-position invariance and NTK scaling
assertEqual(
    relativePositionError(PROOF_Q, PROOF_K, 47, 19, PROOF_FREQS) < 1e-12,
    true,
    'dot(R(m)q, R(n)k) === dot(R(m-n)q, k) and complex Hermitian form to < 1e-12',
)
assertEqual(
    Math.abs(dot(applyRoPE(PROOF_Q, 128, PROOF_FREQS), applyRoPE(PROOF_K, 100, PROOF_FREQS))
        - dot(applyRoPE(PROOF_Q, 28, PROOF_FREQS), PROOF_K)) < 1e-12,
    true,
    'RoPE inner product depends strictly on relative distance m - n = 28',
)
assertEqual(
    Math.abs(ropeKernel(0, PROOF_FREQS) - 1) < 1e-12,
    true,
    'Multi-frequency cosine kernel peaks at exactly 1.0 when delta = 0',
)
assertEqual(
    ntkScaledBase(ROPE_DEFAULT_BASE, 8, ROPE_DEMO_DIM) > ROPE_DEFAULT_BASE * 8,
    true,
    'NTK scaled base stretches faster than linear scale factor s^(d/(d-2))',
)

const chapters: Record<string, SceneFunction> = { hook, clocks, helix3d, longcontext, finale }

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
        stage.add(nebula(0, -40, 780, '#1e275228', '#17143314'), ...starfield(140, index + 1))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'RoPE: Why LLMs Spin Clocks to Remember Long Context',
    description: 'A cinematic visual journey through Rotary Positional Embeddings: harmonic clockwork, exact relative-distance geometry, 3D helices, and NTK/YaRN long-context scaling.',
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

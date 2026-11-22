import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    DEMO_EXACT, DEMO_LOGITS, DEMO_ONLINE, H100, H100_RIDGE_AI,
    flashHbmBytes, naiveAttention1D, naiveHbmBytes, tiledAttention1D,
} from './math'
import { intro } from './scenes/intro'
import { hook } from './scenes/hook'
import { memorywall } from './scenes/memorywall'
import { tiling } from './scenes/tiling'
import { onlinesoftmax } from './scenes/onlinesoftmax'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

// Build-time mathematical verification: exact numerical equivalence of online softmax & tiled attention
const maxSoftmaxDiff = Math.max(...DEMO_ONLINE.probs.map((p, i) => Math.abs(p - DEMO_EXACT[i]!)))
assertEqual(maxSoftmaxDiff < 1e-12, true, `Online softmax must match naive softmax to < 1e-12 (got ${maxSoftmaxDiff})`)

const probSum = DEMO_ONLINE.probs.reduce((a, b) => a + b, 0)
assertEqual(Math.abs(probSum - 1) < 1e-12, true, 'Online softmax probabilities must sum to 1')

const qTest = [0.6, -0.4, 1.1, 0.25]
const kTest = Array.from({ length: 12 }, (_, i) => [Math.sin(i + 1), Math.cos(i * 0.7), (i % 4) * 0.35 - 0.5, Math.sin(i * 1.9)])
const vTest = Array.from({ length: 12 }, (_, i) => [Math.cos(i * 0.5), Math.sin(i * 1.3), 0.2 * i - 1.0, Math.cos(i * 2.1)])
const naiveOut = naiveAttention1D(qTest, kTest, vTest)
const tiledOut = tiledAttention1D(qTest, kTest, vTest, 4)
const maxAttnDiff = Math.max(...naiveOut.map((v, i) => Math.abs(v - tiledOut[i]!)))
assertEqual(maxAttnDiff < 1e-12, true, `Tiled FlashAttention must match naive attention to < 1e-12 (got ${maxAttnDiff})`)
assertEqual(Math.round(H100_RIDGE_AI), 295, 'H100 FP16/HBM3 ridge point equals 295 FLOP/byte')
assertEqual(flashHbmBytes(16384, 64) < naiveHbmBytes(16384, 64) / 10, true, 'FlashAttention cuts HBM traffic by > 10x at N=16384, d=64')
assertEqual(H100.smCount, 132, 'H100 SXM5 has 132 Streaming Multiprocessors')

const chapters: Record<string, SceneFunction> = { hook, memorywall, tiling, onlinesoftmax, finale }

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
        stage.add(nebula(0, -40, 780, '#18244d2a', '#11163314'), ...starfield(135, index + 11, COSMOS.cyan))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'FlashAttention: Why GPUs Spend 90% of Their Time Waiting',
    description: 'A cinematic visual breakdown of the GPU memory wall, H100 roofline, 3D SRAM tiling, and exact online softmax.',
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

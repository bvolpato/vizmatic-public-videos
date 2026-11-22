import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    DEMO_SPEC, DEMO_TARGET_P, LLAMA_70B_SPEC,
    decodeArithmeticIntensity, expectedTokensPerVerify, hardwareRidgePoint,
    kvBytesPerToken, pagedWasteComparison, speculativeSamplingDistribution,
} from './math'
import { intro } from './scenes/intro'
import { hook } from './scenes/hook'
import { kvcache } from './scenes/kvcache'
import { paged } from './scenes/paged'
import { speculative } from './scenes/speculative'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

// Build-time mathematical proofs: exact speculative decoding distribution & memory models
assertEqual(
    DEMO_SPEC.maxErr < 1e-12,
    true,
    'Speculative decoding induced distribution P_spec(x) === p(x) to < 1e-12 for every token x',
)
for (let i = 0; i < DEMO_TARGET_P.length; i++) {
    assertEqual(
        Math.abs(DEMO_SPEC.induced[i]! - DEMO_TARGET_P[i]!) < 1e-12,
        true,
        `Exact marginal equality P_spec(x_${i}) === p(x_${i})`,
    )
}
const stressSpec = speculativeSamplingDistribution([0.55, 0.25, 0.12, 0.08], [0.15, 0.45, 0.30, 0.10])
assertEqual(stressSpec.maxErr < 1e-12, true, 'Exactness holds for arbitrary skewed target/draft pairs')
assertEqual(kvBytesPerToken(LLAMA_70B_SPEC), 327_680, '70B GQA-8 FP16 KV footprint is 320 KiB/token')
assertEqual(
    decodeArithmeticIntensity(1, 4096, LLAMA_70B_SPEC) < 1.2 && hardwareRidgePoint(LLAMA_70B_SPEC) > 250,
    true,
    'Batch-1 decode is deeply HBM memory-bandwidth bound (~1 FLOP/byte vs ~295 ridge)',
)
const wasteCheck = pagedWasteComparison([310, 620, 480, 140], 1024, 16)
assertEqual(
    wasteCheck.contiguousWasteRatio > 0.6 && wasteCheck.pagedWasteRatio < 0.04,
    true,
    'Contiguous slabs waste >60% VRAM while PagedAttention collapses waste below 4%',
)
assertEqual(
    expectedTokensPerVerify(5, 0.85) > 4.0,
    true,
    '5-token draft streak at 85% acceptance yields >4 expected tokens per target verify pass',
)

const chapters: Record<string, SceneFunction> = { hook, kvcache, paged, speculative, finale }

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
        stage.add(nebula(0, -40, 780, '#1e275228', '#17143314'), ...starfield(140, index + 11))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'KV Cache & Speculative Decoding: How LLMs Hit 1,000 Tokens/sec',
    description: 'A cinematic breakdown of KV caching, GPU HBM memory bandwidth limits, orbiting 3D PagedAttention blocks, and mathematically exact speculative decoding.',
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

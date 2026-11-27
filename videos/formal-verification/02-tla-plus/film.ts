import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../../factory/style'
import { protocol } from './scenes/protocol'
import { graph } from './scenes/graph'
import { fairness } from './scenes/fairness'
import script from './script.json'
import timing from './timing.json'

// Verify 5-step retry protocol counterexample vs atomic idempotency receipts
function simulateOrder(withReceipts: boolean): number {
    let shipped = 0
    const receipts = new Set<string>()
    const deliver = (id: string) => {
        if (withReceipts && receipts.has(id)) return
        shipped += 1
        receipts.add(id)
    }
    deliver('order#1') // Step 1-2: Send -> Ship (ACK dropped at Step 3)
    deliver('order#1') // Step 4-5: Retry -> Ship again unless receipt checked
    return shipped
}
assertEqual(simulateOrder(false), 2, 'Unprotected retry ships duplicate order in 5 steps')
assertEqual(simulateOrder(true), 1, 'Atomic receipt table preserves shipped <= 1 invariant')

const chapters: Record<string, SceneFunction> = { protocol, graph, fairness }

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
        stage.add(nebula(0, -30, 760, '#142a3a28', '#2a1c1814'), ...starfield(130, index + 71, COSMOS.gold))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'TLA+ & the Five-Step Bug',
    description: 'Episode 2 of Proofs for Real Systems: distributed retry protocol, TLC counterexample, and fairness.',
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

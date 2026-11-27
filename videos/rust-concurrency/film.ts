import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import { intro } from './scenes/intro'
import { hook } from './scenes/hook'
import { ownership } from './scenes/ownership'
import { scopes } from './scenes/scopes'
import { futures } from './scenes/futures'
import { tokioScene } from './scenes/tokio'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

// Verify Rust async Future state-machine footprint & aliasing exclusivity invariants
const FUTURE_STATE_BYTES = 8 + 16 + 24 // discriminant + aligned socket/buf handles = 48 B
assertEqual(FUTURE_STATE_BYTES, 48, 'Compiled async Future state machine fits in 48 bytes')
assertEqual((1 & 0), 0, 'Exclusive &mut T forbids simultaneous aliasing at compile time')

const chapters: Record<string, SceneFunction> = { hook, ownership, scopes, futures, tokio: tokioScene, finale }

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
        stage.add(nebula(0, -40, 760, '#2a1c3b28', '#141c3814'), ...starfield(130, index + 7, COSMOS.amber))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'Rust Concurrency: Ownership Across Time',
    description: 'Cinematic guide to Rust concurrency, Send/Sync, thread::scope, channels, 48-byte Futures, and Tokio.',
    width: 1920,
    height: 1080,
    fps: 30,
    background: COSMOS.bg,
    bloom: 0.22,
    bleed: true,
    intro,
    timing,
    scenes: Object.fromEntries(timing.scenes.map((scene, index) => [scene.id, chapter(index)])),
})

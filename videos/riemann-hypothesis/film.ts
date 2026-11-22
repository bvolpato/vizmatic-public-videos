import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import { ZETA_ZEROS, primePi, zeta } from './math'
import { intro } from './scenes/intro'
import { hook } from './scenes/hook'
import { primes } from './scenes/primes'
import { landscape } from './scenes/landscape'
import { spiral } from './scenes/spiral'
import { music } from './scenes/music'
import { stakes } from './scenes/stakes'
import script from './script.json'
import timing from './timing.json'

assertEqual(primePi(100), 25, 'There are exactly 25 primes up to 100')
assertEqual(Math.abs(zeta(2, 0)[0] - (Math.PI * Math.PI) / 6) < 1e-10, true, 'zeta(2) equals pi^2 / 6')
assertEqual(Math.hypot(...zeta(0.5, ZETA_ZEROS[0]!)) < 1e-10, true, 'First zero lies at t = 14.134725...')

const chapters: Record<string, SceneFunction> = { hook, primes, landscape, spiral, music, stakes }

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
        stage.add(nebula(0, -40, 760, '#1e275228', '#17143314'), ...starfield(140, index + 1))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'The Riemann Hypothesis: Music of the Primes',
    description: 'A fast, cinematic 2:50 visual journey through the Riemann Hypothesis.',
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

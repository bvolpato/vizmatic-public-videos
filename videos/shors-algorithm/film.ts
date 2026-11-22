import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    QFT_32,
    QFT_PROB_SUM,
    SHOR_A,
    SHOR_N,
    SHOR_PERIOD,
    gcd,
    modPow,
} from './math'
import { intro } from './scenes/intro'
import { hook } from './scenes/hook'
import { bloch3d } from './scenes/bloch3d'
import { period } from './scenes/period'
import { qft } from './scenes/qft'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

assertEqual(SHOR_PERIOD, 4, 'Period of 7^x mod 15 is r = 4')
assertEqual(gcd(modPow(SHOR_A, SHOR_PERIOD / 2, 1000) - 1, SHOR_N), 3, 'gcd(7^2 - 1, 15) === 3')
assertEqual(gcd(modPow(SHOR_A, SHOR_PERIOD / 2, 1000) + 1, SHOR_N), 5, 'gcd(7^2 + 1, 15) === 5')
assertEqual(Math.abs(QFT_PROB_SUM - 1) < 1e-12, true, 'QFT probability distribution sums to 1')
assertEqual(Math.abs(QFT_32[8]!.prob - 0.25) < 1e-12, true, 'QFT peak at k = M/4 = 8 carries probability 1/4')
assertEqual(QFT_32[5]!.prob < 1e-12, true, 'Non-harmonic frequency k = 5 cancels identically to 0')

const chapters: Record<string, SceneFunction> = { hook, bloch3d, period, qft, finale }

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
        stage.add(nebula(0, -40, 760, '#16284c28', '#1f123816'), ...starfield(140, index + 37, COSMOS.cyan))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: "Quantum Computing Without the Hype: Shor's Algorithm & Interference",
    description: "A visual demystification of quantum computing through phase interference, an orbiting 3D Bloch sphere, modular period finding for N = 15, and exact Quantum Fourier Transform peaks.",
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

import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    BLOOM_FPR_10BIT, BLOOM_MISS_BYPASS_PCT, BLOOM_OPTIMAL_K, BTREE_REAL_WA,
    PAGES_PER_ERASE_BLOCK, RANDOM_SSD_FTL_WA, SEQ_SSD_FTL_WA,
} from './math'
import { hook } from './scenes/hook'
import { flashphysics } from './scenes/flashphysics'
import { btreewall } from './scenes/btreewall'
import { lsm3d } from './scenes/lsm3d'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

assertEqual(PAGES_PER_ERASE_BLOCK, 1024, 'A 4 MB flash erase block packs exactly 1,024 four-KB pages')
assertEqual(BLOOM_OPTIMAL_K, 7, 'Optimal Bloom hash count at 10 bits/key is round(10 ln 2) = 7')
assertEqual(BLOOM_FPR_10BIT < 0.01, true, '10-bit Bloom filter false-positive rate is strictly under 1%')
assertEqual(BLOOM_MISS_BYPASS_PCT > 99, true, '10-bit Bloom filter short-circuits over 99% of miss lookups')
assertEqual(BTREE_REAL_WA > 20, true, 'Random B-Tree page writes + FTL amplify disk writes past 20x')
assertEqual(SEQ_SSD_FTL_WA < RANDOM_SSD_FTL_WA, true, 'Sequential LSM streams slash SSD FTL write amplification')

const chapters: Record<string, SceneFunction> = { hook, flashphysics, btreewall, lsm3d, finale }

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
        stage.add(nebula(0, -40, 760, '#1e275228', '#17143314'), ...starfield(140, index + 31))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'Inside an SSD: B-Trees vs LSM-Trees and the Write-Amplification Wall',
    description: 'A cinematic journey inside NVMe flash silicon: erase blocks, B-Tree write amplification, 3D leveled LSM-trees, and Bloom filter gates.',
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

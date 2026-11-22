import { assertEqual, narrated, type SceneFunction } from 'vizmatic/stage'
import { retimeBeatCaptions } from '../../factory/caption-alignment'
import { COSMOS, nebula, starfield } from '../../factory/style'
import {
    ALL_3_OF_5_QUORUMS, CLUSTER_SIZE, MAJORITY_QUORUM, MIN_OVERLAP_5, SPLIT_BRAIN_SIM,
} from './math'
import { intro } from './scenes/intro'
import { hook } from './scenes/hook'
import { election } from './scenes/election'
import { partition } from './scenes/partition'
import { quorum3d } from './scenes/quorum3d'
import { finale } from './scenes/finale'
import script from './script.json'
import timing from './timing.json'

assertEqual(ALL_3_OF_5_QUORUMS.length, 10, 'Exactly C(5,3) = 10 three-node majorities exist')
assertEqual(2 * MAJORITY_QUORUM - CLUSTER_SIZE, 1, 'Pigeonhole overlap formula 2q - N = 1')
assertEqual(MIN_OVERLAP_5, 1, 'Every pair of majority subsets of N=5 shares at least 1 witness node')
assertEqual(SPLIT_BRAIN_SIM.duringPartitionMinorityCommitted, false, 'Minority 2/5 write cannot commit')
assertEqual(SPLIT_BRAIN_SIM.duringPartitionMajorityCommitted, true, 'Majority 3/5 write commits cleanly')
assertEqual(SPLIT_BRAIN_SIM.allAgreeOnTerm2, true, 'All 5 nodes converge on Term 2 after heal')
assertEqual(SPLIT_BRAIN_SIM.allCommittedX42, true, 'All 5 nodes replicate committed x = 42')
assertEqual(SPLIT_BRAIN_SIM.ghostEntriesRemaining, 0, 'Uncommitted minority ghost write x = 9 is rolled back')

const chapters: Record<string, SceneFunction> = { hook, election, partition, quorum3d, finale }

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
        stage.add(nebula(0, -40, 760, '#1e275228', '#17143314'), ...starfield(140, index + 21))
        chapters[scene.id]!(stage, cue, clock)
    }
}

export default narrated({
    title: 'Raft Consensus & Split-Brain: Why Distributed Systems Survive Partitions',
    description: 'A cinematic visual breakdown of Raft consensus: elections, split-brain partition recovery, and 3D quorum intersection geometry.',
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

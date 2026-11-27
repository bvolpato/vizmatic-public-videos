import {
    Node, circle, dot, dynamic, group, line, linear, radialGradient, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { DEMO_3SAT, DEMO_WITNESS } from '../math'

// Clean 4-level binary search tree on the left half
interface SearchNode {
    readonly pos: Vec
    readonly parent: Vec | null
    readonly isKey: boolean
    readonly depth: number
}
const SEARCH_NODES: SearchNode[] = []
function buildSearch(x: number, y: number, depth: number, dx: number, parent: Vec | null, isKey: boolean) {
    const pos: Vec = [x, y]
    SEARCH_NODES.push({ pos, parent, isKey, depth })
    if (depth >= 4) return
    const ny = y + 78
    const leftKey = isKey && (depth === 0 || depth === 1)
    const rightKey = isKey && (depth === 2 || depth === 3)
    buildSearch(x - dx, ny, depth + 1, dx * 0.5, pos, leftKey)
    buildSearch(x + dx, ny, depth + 1, dx * 0.5, pos, rightKey)
}
buildSearch(-475, -182, 0, 178, null, true)

export const hook: SceneFunction = (s, c) => {
    const searchProg = s.value(0)
    const verifyProg = s.value(0)

    const header = group(
        txt('Impossible to find — effortless to check', 0, -372, 60, COSMOS.ink, 'serif').glow(6, '#38bdf8'),
        line([0, -275], [0, 345], { stroke: '#29385d', width: 2.2 }),
    )

    const liveEngine = dynamic(() => {
        const sp = searchProg.value
        const vp = verifyProg.value
        const nodes: Node[] = []

        // ── LEFT: FINDING (Exponential 2^n Search Tree -> > 10B x atoms in the universe!) ──
        nodes.push(
            txt('FINDING  (NP · BRUTE SEARCH)', -475, -248, 27, COSMOS.rose, 'mono').glow(6, COSMOS.rose),
        )
        const probeIdx = Math.floor((sp * 24) % SEARCH_NODES.length)
        for (let i = 0; i < SEARCH_NODES.length; i++) {
            const sn = SEARCH_NODES[i]!
            const active = i === probeIdx
            const keyLit = sn.isKey && vp > 0.05
            if (sn.parent) {
                nodes.push(
                    line(sn.parent, sn.pos, {
                        stroke: keyLit ? COSMOS.gold : active ? COSMOS.rose : '#4d2b45',
                        width: keyLit ? 3.8 : active ? 2.6 : 1.5,
                        opacity: keyLit ? 0.98 : active ? 0.9 : 0.65,
                    }).glow(keyLit ? 12 : 3, keyLit ? COSMOS.gold : COSMOS.rose).set('blend', 'screen'),
                )
            }
            nodes.push(
                dot(keyLit ? 7.5 : active ? 6.2 : 4.0, keyLit ? COSMOS.gold : active ? '#ffffff' : COSMOS.rose)
                    .at(sn.pos[0], sn.pos[1])
                    .glow(keyLit ? 16 : active ? 12 : 4, keyLit ? COSMOS.gold : COSMOS.rose)
                    .set('blend', 'screen'),
            )
        }

        // Racing exponential counter scaling up to n = 300 (> 10 billion x atoms in the observable universe!)
        const curN = Math.min(300, Math.max(10, Math.round(10 + Math.min(1, sp * 1.9) * 290)))
        const expPow = Math.round(curN * Math.LOG10E * Math.LN2)
        const scaleLabel =
            curN >= 270
                ? '10 BILLION× MORE THAN ATOMS IN THE UNIVERSE'
                : curN >= 140
                    ? `10^${expPow} paths  (exceeding galactic scale)`
                    : `2^${curN} combinations`
        nodes.push(
            txt(`n = ${curN} variables   →   2^${curN} ≈ 10^${expPow}`, -475, 224, 28, COSMOS.rose, 'mono'),
            txt(scaleLabel, -475, 282, curN >= 270 ? 26 : 28, COSMOS.amber, 'mono').glow(6, COSMOS.amber),
            txt('Observable universe ≈ 10⁸⁰ atoms', -475, 336, 26, COSMOS.muted, 'sans'),
        )

        // ── RIGHT: CHECKING (Linear 3-SAT Circuit Verifier) ──
        nodes.push(
            txt('CHECKING  (P · VERIFIER)', 475, -248, 27, COSMOS.emerald, 'mono').glow(6, COSMOS.emerald),
            rect(560, 56, { fill: '#1a1826', stroke: COSMOS.gold, width: 2.4, radius: 12 }).at(475, -172)
                .glow(vp > 0.05 ? 10 : 3, COSMOS.gold),
            txt(`KEY:  x = (${DEMO_WITNESS.map((b) => (b ? 'T' : 'F')).join(', ')})`, 475, -172, 27, COSMOS.gold, 'mono'),
        )

        for (let i = 0; i < DEMO_3SAT.length; i++) {
            const cl = DEMO_3SAT[i]!
            const cy = -82 + i * 74
            const checked = vp > (i + 0.35) / 5
            const col = checked ? COSMOS.emerald : '#3f5075'
            nodes.push(
                rect(560, 56, { fill: checked ? '#0e2424' : '#101626', stroke: col, width: checked ? 2.8 : 1.6, radius: 10 })
                    .at(475, cy).glow(checked ? 10 : 2, col),
                txt(cl.label, 232, cy, 27, checked ? COSMOS.ink : COSMOS.muted, 'mono', 'left'),
                txt(checked ? '✓  TRUE' : '···', 718, cy, 26, checked ? COSMOS.emerald : COSMOS.dim, 'mono', 'right'),
            )
        }

        if (vp > 0.85) {
            const okOp = Math.min(1, (vp - 0.85) / 0.15)
            nodes.push(
                circle(260, {
                    fill: radialGradient([0, 0], 260, [
                        [0, '#6ee7b72a'],
                        [0.6, '#07091000'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                }).at(475, 255).opacity(okOp).set('blend', 'screen'),
                rect(560, 68, { fill: '#0e2624', stroke: COSMOS.emerald, width: 3.2, radius: 14 })
                    .at(475, 255).glow(14, COSMOS.emerald).opacity(okOp),
                txt('VERIFIED IN MICROSECONDS', 475, 255, 29, COSMOS.emerald, 'mono').glow(6, COSMOS.emerald).opacity(okOp),
            )
        } else {
            nodes.push(
                txt('One straight pass checks every rule', 475, 255, 27, COSMOS.muted, 'sans'),
            )
        }

        return group(...nodes)
    })

    s.add(header, liveEngine)
    const sceneDur = Math.max(6, c.end - c.start - 0.5)
    c.at(0.1, () => s.play(searchProg.to(1, { duration: sceneDur, ease: linear })))
    const checkRel = Math.max(2.0, c.cue('Hand me one').start - c.start)
    c.at(checkRel, () => s.play(verifyProg.to(1, { duration: Math.max(1.8, c.cue('microseconds').start - c.cue('Hand me one').start + 0.45) })))
}

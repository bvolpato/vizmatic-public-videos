import {
    Node, delay, dot, dynamic, group, line, linear, linearGradient, par, polyPath, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'
import { DEMO_3SAT, DEMO_WITNESS, UNIVERSE_EXPONENT } from '../math'

// ── Shot 1: Narrated P vs NP Opening Hero Visual (held smoothly through Beat 0, zero flash!) ──
const POLY_STREAMS: Vec[][] = [-210, -125, -40, 45, 130, 215].map((y0, idx) => {
    const pts: Vec[] = []
    for (let i = 0; i <= 32; i++) {
        const u = i / 32
        const x = -940 + u * 645
        const converge = y0 * (1 - u * 0.58)
        const wave = Math.sin(u * Math.PI * 2 + idx * 0.7) * 14 * (1 - u * 0.4)
        pts.push([x, converge + wave])
    }
    return pts
})

interface HeroEdge {
    readonly from: Vec
    readonly to: Vec
    readonly depth: number
    readonly isKey: boolean
}
const HERO_EDGES: HeroEdge[] = []
const HERO_NODES: { readonly pos: Vec; readonly isKey: boolean; readonly depth: number }[] = []
function buildHeroTree(x: number, y: number, depth: number, spreadY: number, isKeyPath: boolean) {
    HERO_NODES.push({ pos: [x, y], isKey: isKeyPath, depth })
    if (depth >= 4) return
    const nextX = x + 148
    const upY = y - spreadY
    const dnY = y + spreadY
    const goUpKey = isKeyPath && depth % 2 === 0
    const goDnKey = isKeyPath && depth % 2 === 1
    HERO_EDGES.push({ from: [x, y], to: [nextX, upY], depth, isKey: goUpKey })
    HERO_EDGES.push({ from: [x, y], to: [nextX, dnY], depth, isKey: goDnKey })
    buildHeroTree(nextX, upY, depth + 1, spreadY * 0.52, goUpKey)
    buildHeroTree(nextX, dnY, depth + 1, spreadY * 0.52, goDnKey)
}
buildHeroTree(325, 0, 0, 178, true)

// ── Shot 2: Clean 4-level binary search tree on the left half ──
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
    const showIntro = s.value(1)
    const introProg = s.value(0)
    const showEngine = s.value(0)
    const searchProg = s.value(0)
    const verifyProg = s.value(0)

    const polyGrad = linearGradient([-940, 0], [-295, 0], ['#1d4ed844', COSMOS.cyan, COSMOS.emerald])

    const introCopy = group(
        nebula(-580, 0, 540, '#5ce1e626', '#1d4ed814').set('blend', 'screen'),
        nebula(610, 0, 580, '#ff6b8b26', '#a78bfa1a').set('blend', 'screen'),
        txt('P  ·  FAST TO CHECK  O(n²)', -615, -396, 26, COSMOS.cyan, 'mono'),
        txt('NP  ·  EXPONENTIAL  2ⁿ', 620, -396, 26, COSMOS.rose, 'mono'),
        txt('$1,000,000  MILLENNIUM PROBLEM', 0, -238, 26, COSMOS.gold, 'mono'),
        txt('P vs NP', 0, -78, 148, COSMOS.ink, 'serif').glow(10, '#60a5fa'),
        txt('Finding vs. Checking', 0, 74, 46, COSMOS.gold, 'serif').glow(8, COSMOS.gold),
    )

    const liveIntro = dynamic(() => {
        const a = showIntro.value
        if (a < 0.02) return []
        const p = introProg.value
        const nodes: Node[] = []

        for (let sIdx = 0; sIdx < POLY_STREAMS.length; sIdx++) {
            const pts = POLY_STREAMS[sIdx]!
            nodes.push(
                new Node(polyPath(pts)).stroke(polyGrad, 2.8, 0.72 * a).glow(8, COSMOS.cyan).set('blend', 'screen'),
            )
            const idx = Math.min(pts.length - 1, Math.floor(((p * 1.6 + sIdx * 0.17) % 1) * (pts.length - 1)))
            const pt = pts[idx]!
            nodes.push(dot(5.8, '#ffffff').at(pt[0], pt[1]).glow(14, COSMOS.cyan).opacity(a).set('blend', 'screen'))
        }

        for (const e of HERO_EDGES) {
            nodes.push(
                line(e.from, e.to, {
                    stroke: e.isKey ? COSMOS.gold : e.depth < 2 ? COSMOS.violet : COSMOS.rose,
                    width: e.isKey ? 4.4 : 1.8,
                    opacity: (e.isKey ? 0.98 : 0.42) * a,
                }).glow(e.isKey ? 14 : 4, e.isKey ? COSMOS.gold : COSMOS.rose).set('blend', 'screen'),
            )
            if (e.isKey) {
                const t = (p * 2.2) % 1
                const px = e.from[0] + (e.to[0] - e.from[0]) * t
                const py = e.from[1] + (e.to[1] - e.from[1]) * t
                nodes.push(dot(6.2, '#ffffff').at(px, py).glow(14, COSMOS.gold).opacity(a).set('blend', 'screen'))
            }
        }
        for (const n of HERO_NODES) {
            nodes.push(
                dot(n.isKey ? 7.0 : 3.6, n.isKey ? COSMOS.gold : COSMOS.rose)
                    .at(n.pos[0], n.pos[1])
                    .glow(n.isKey ? 14 : 4, n.isKey ? COSMOS.gold : COSMOS.rose)
                    .opacity((n.isKey ? 1 : 0.65) * a)
                    .set('blend', 'screen'),
            )
        }

        return group(...nodes)
    })

    const engineHeader = group(
        txt('Effortless to check — impossible to find', 0, -372, 60, COSMOS.ink, 'serif').glow(6, '#38bdf8'),
        line([0, -275], [0, 345], { stroke: '#29385d', width: 2.2 }),
    )

    const liveEngine = dynamic(() => {
        const a = showEngine.value
        if (a < 0.02) return []
        const sp = searchProg.value
        const vp = verifyProg.value
        const nodes: Node[] = []

        // ── LEFT: FINDING (Exponential 2^n Search Tree -> 2^266 ≈ 10^80 atoms in the universe) ──
        nodes.push(
            txt('FINDING  (NP · BRUTE SEARCH)', -475, -248, 27, COSMOS.rose, 'mono').glow(6, COSMOS.rose).opacity(a),
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
                        opacity: (keyLit ? 0.98 : active ? 0.9 : 0.65) * a,
                    }).glow(keyLit ? 12 : 3, keyLit ? COSMOS.gold : COSMOS.rose).set('blend', 'screen'),
                )
            }
            nodes.push(
                dot(keyLit ? 7.5 : active ? 6.2 : 4.0, keyLit ? COSMOS.gold : active ? '#ffffff' : COSMOS.rose)
                    .at(sn.pos[0], sn.pos[1])
                    .glow(keyLit ? 16 : active ? 12 : 4, keyLit ? COSMOS.gold : COSMOS.rose)
                    .opacity(a)
                    .set('blend', 'screen'),
            )
        }

        // Racing exponential counter scaling cleanly to n = 266 (2^266 ≈ 10^80 ≈ atoms in the observable universe!)
        const curN = Math.min(
            UNIVERSE_EXPONENT,
            Math.max(10, Math.round(10 + Math.min(1, sp * 1.95) * (UNIVERSE_EXPONENT - 10))),
        )
        const expPow = Math.round(curN * Math.LOG10E * Math.LN2)
        const scaleLabel =
            curN >= 264
                ? '≈ EVERY ATOM IN THE OBSERVABLE UNIVERSE'
                : curN >= 140
                    ? `10^${expPow} paths  (past galactic scale)`
                    : `2^${curN} combinations`
        nodes.push(
            txt(`n = ${curN} variables   →   2^${curN} ≈ 10^${expPow}`, -475, 224, 28, COSMOS.rose, 'mono').opacity(a),
            txt(scaleLabel, -475, 282, curN >= 264 ? 26 : 28, COSMOS.amber, 'mono').glow(6, COSMOS.amber).opacity(a),
            txt('Observable universe ≈ 10⁸⁰ atoms', -475, 336, 26, COSMOS.muted, 'sans').opacity(a),
        )

        // ── RIGHT: CHECKING (Linear 3-SAT Circuit Verifier) ──
        nodes.push(
            txt('CHECKING  (P · VERIFIER)', 475, -248, 27, COSMOS.emerald, 'mono').glow(6, COSMOS.emerald).opacity(a),
            rect(560, 56, { fill: '#1a1826', stroke: COSMOS.gold, width: 2.4, radius: 12 }).at(475, -172)
                .glow(vp > 0.05 ? 10 : 3, COSMOS.gold).opacity(a),
            txt(`KEY:  x = (${DEMO_WITNESS.map((b) => (b ? 'T' : 'F')).join(', ')})`, 475, -172, 27, COSMOS.gold, 'mono').opacity(a),
        )

        for (let i = 0; i < DEMO_3SAT.length; i++) {
            const cl = DEMO_3SAT[i]!
            const cy = -82 + i * 74
            const checked = vp > (i + 0.35) / 5
            const col = checked ? COSMOS.emerald : '#3f5075'
            nodes.push(
                rect(560, 56, { fill: checked ? '#0e2424' : '#101626', stroke: col, width: checked ? 2.8 : 1.6, radius: 10 })
                    .at(475, cy).glow(checked ? 10 : 2, col).opacity(a),
                txt(cl.label, 232, cy, 27, checked ? COSMOS.ink : COSMOS.muted, 'mono', 'left').opacity(a),
                txt(checked ? '✓  TRUE' : '···', 718, cy, 26, checked ? COSMOS.emerald : COSMOS.dim, 'mono', 'right').opacity(a),
            )
        }

        if (vp > 0.85) {
            const okOp = Math.min(1, (vp - 0.85) / 0.15) * a
            nodes.push(
                nebula(475, 255, 260, '#6ee7b72a').opacity(okOp).set('blend', 'screen'),
                rect(560, 68, { fill: '#0e2624', stroke: COSMOS.emerald, width: 3.2, radius: 14 })
                    .at(475, 255).glow(14, COSMOS.emerald).opacity(okOp),
                txt('VERIFIED IN MICROSECONDS', 475, 255, 29, COSMOS.emerald, 'mono').glow(6, COSMOS.emerald).opacity(okOp),
            )
        } else {
            nodes.push(
                txt('One straight pass checks every rule', 475, 255, 27, COSMOS.muted, 'sans').opacity(a),
            )
        }

        return group(...nodes)
    })

    s.add(introCopy, liveIntro, liveEngine)

    const engineRel = Math.max(2.0, c.cue('Some problems look').start - c.start)
    const engineDur = Math.max(4.0, c.end - c.cue('Some problems look').start - 0.45)
    const checkRel = Math.max(engineRel + 2.0, c.cue('Yet hand me one').start - c.start)

    c.at(0.05, () => s.play(introProg.to(1, { duration: Math.max(2.0, engineRel + 0.1), ease: linear })))
    c.swap('Some problems look', introCopy, engineHeader)
    c.at(engineRel, () => {
        s.play(par(
            showIntro.to(0, { duration: 0.18 }),
            delay(showEngine.to(1, { duration: 0.28 }), 0.22),
            delay(searchProg.to(1, { duration: Math.max(2.0, engineDur - 0.25), ease: linear }), 0.22),
        ))
    })
    c.at(checkRel, () => {
        s.play(verifyProg.to(1, { duration: Math.max(1.6, c.cue('microseconds').start - c.cue('Yet hand me one').start + 0.45) }))
    })
}

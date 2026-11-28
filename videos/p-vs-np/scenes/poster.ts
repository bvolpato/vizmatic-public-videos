import {
    Node, dot, dynamic, group, line, linear, linearGradient, polyPath,
    type IntroFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

// Dramatic Dual-World Split Poster:
// Left: calm cyan polynomial highway (P, n^2). Right: exploding rose/violet exponential tree (NP, 2^n) with ONE golden key path.
// Center dark cosmic aisle holds the monumental "P vs NP" display title with zero stroke crossings!

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

interface TreeEdge {
    readonly from: Vec
    readonly to: Vec
    readonly depth: number
    readonly isKey: boolean
}

const EXP_EDGES: TreeEdge[] = []
const EXP_NODES: { readonly pos: Vec; readonly isKey: boolean; readonly depth: number }[] = []

function buildExpTree(x: number, y: number, depth: number, spreadY: number, isKeyPath: boolean) {
    EXP_NODES.push({ pos: [x, y], isKey: isKeyPath, depth })
    if (depth >= 4) return
    const nextX = x + 148
    const upY = y - spreadY
    const dnY = y + spreadY
    const goUpKey = isKeyPath && depth % 2 === 0
    const goDnKey = isKeyPath && depth % 2 === 1
    EXP_EDGES.push({ from: [x, y], to: [nextX, upY], depth, isKey: goUpKey })
    EXP_EDGES.push({ from: [x, y], to: [nextX, dnY], depth, isKey: goDnKey })
    buildExpTree(nextX, upY, depth + 1, spreadY * 0.52, goUpKey)
    buildExpTree(nextX, dnY, depth + 1, spreadY * 0.52, goDnKey)
}
buildExpTree(325, 0, 0, 178, true)

export const poster: IntroFunction = (stage, clock) => {
    const prog = stage.value(0.25)
    const polyGrad = linearGradient([-940, 0], [-295, 0], ['#1d4ed844', COSMOS.cyan, COSMOS.emerald])

    stage.add(
        // Left cool cyan aura + Right warm rose/gold aura (smooth 9-stop nebula, zero banding)
        nebula(-580, 0, 540, '#5ce1e626', '#1d4ed814').set('blend', 'screen'),
        nebula(610, 0, 580, '#ff6b8b26', '#a78bfa1a').set('blend', 'screen'),
        // Dynamic left polynomial streams + right exponential tree + golden solution bolt
        dynamic(() => {
            const p = prog.value
            const nodes: Node[] = []

            // Left: Smooth polynomial highways (x in -940..-295, cleanly clear of center title!)
            for (let sIdx = 0; sIdx < POLY_STREAMS.length; sIdx++) {
                const pts = POLY_STREAMS[sIdx]!
                nodes.push(
                    new Node(polyPath(pts)).stroke(polyGrad, 2.8, 0.72).glow(8, COSMOS.cyan).set('blend', 'screen'),
                )
                const idx = Math.min(pts.length - 1, Math.floor(((p + sIdx * 0.17) % 1) * (pts.length - 1)))
                const pt = pts[idx]!
                nodes.push(dot(5.8, '#ffffff').at(pt[0], pt[1]).glow(14, COSMOS.cyan).set('blend', 'screen'))
            }

            // Right: Exponential 2^n branching tree (x in +325..+917, cleanly clear of center title!)
            for (const e of EXP_EDGES) {
                nodes.push(
                    line(e.from, e.to, {
                        stroke: e.isKey ? COSMOS.gold : e.depth < 2 ? COSMOS.violet : COSMOS.rose,
                        width: e.isKey ? 4.4 : 1.8,
                        opacity: e.isKey ? 0.98 : 0.42,
                    }).glow(e.isKey ? 14 : 4, e.isKey ? COSMOS.gold : COSMOS.rose).set('blend', 'screen'),
                )
                if (e.isKey) {
                    const t = (p * 1.4) % 1
                    const px = e.from[0] + (e.to[0] - e.from[0]) * t
                    const py = e.from[1] + (e.to[1] - e.from[1]) * t
                    nodes.push(dot(6.2, '#ffffff').at(px, py).glow(14, COSMOS.gold).set('blend', 'screen'))
                }
            }
            for (const n of EXP_NODES) {
                nodes.push(
                    dot(n.isKey ? 7.0 : 3.6, n.isKey ? COSMOS.gold : COSMOS.rose)
                        .at(n.pos[0], n.pos[1])
                        .glow(n.isKey ? 14 : 4, n.isKey ? COSMOS.gold : COSMOS.rose)
                        .opacity(n.isKey ? 1 : 0.65)
                        .set('blend', 'screen'),
                )
            }

            return group(...nodes)
        }),
        // Side world tags cleanly above the streams/tree
        txt('P  ·  POLYNOMIAL  O(n²)', -615, -396, 26, COSMOS.cyan, 'mono'),
        txt('NP  ·  EXPONENTIAL  2ⁿ', 620, -396, 26, COSMOS.rose, 'mono'),
        // Monumental centered title inside the open dark rift (-275..+275)
        txt('$1,000,000  UNSOLVED PROBLEM', 0, -238, 26, COSMOS.gold, 'mono'),
        txt('P vs NP', 0, -78, 148, COSMOS.ink, 'serif').glow(10, '#60a5fa'),
        txt('Finding vs. Checking', 0, 74, 46, COSMOS.gold, 'serif').glow(8, COSMOS.gold),
        txt('What breaks, three proof walls, and the live AI fleet at pequalnp.com', 0, 412, 29, '#cbd5e8', 'sans'),
    )

    stage.at(0.02, () => stage.play(prog.to(1.25, { duration: Math.max(0.4, clock.intro - 0.08), ease: linear })))
}

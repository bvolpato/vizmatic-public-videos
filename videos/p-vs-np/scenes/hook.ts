import {
    Node, delay, dot, dynamic, group, line, linear, par, polyPath, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { DEMO_3SAT, DEMO_WITNESS, UNIVERSE_EXPONENT } from '../math'
import { buildVennNodes, vennTitleGroup } from './venn'

// Clean 4-level binary search tree on the left half of Shot 2
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
    const ny = y + 66
    const leftKey = isKey && (depth === 0 || depth === 1)
    const rightKey = isKey && (depth === 2 || depth === 3)
    buildSearch(x - dx, ny, depth + 1, dx * 0.5, pos, leftKey)
    buildSearch(x + dx, ny, depth + 1, dx * 0.5, pos, rightKey)
}
buildSearch(-475, -138, 0, 178, null, true)

export const hook: SceneFunction = (s, c) => {
    const showIntro = s.value(1)
    const introProg = s.value(0)
    const showEngine = s.value(0)
    const searchProg = s.value(0)
    const verifyProg = s.value(0)

    // ── Shot 1: Full Narrated P vs NP Opening with Complexity Classes Venn Diagram (~7.8s) ──
    const introCopy = vennTitleGroup('Easy to check. Hard to find?')
    const liveIntro = dynamic(() => {
        const a = showIntro.value
        if (a < 0.02) return []
        return group(...buildVennNodes(introProg.value, a))
    })

    // ── Shot 2: Live CPU Brute-Force Register + Search Tree vs. Hardware 3-SAT Logic Verifier ──
    const engineHeader = group(
        txt('Effortless to check, impossible to find', 0, -378, 58, COSMOS.ink, 'serif'),
        line([0, -284], [0, 358], { stroke: '#29385d', width: 2.2 }),
    )

    const liveEngine = dynamic(() => {
        const a = showEngine.value
        if (a < 0.02) return []
        const sp = searchProg.value
        const vp = verifyProg.value
        const nodes: Node[] = []

        // ── LEFT: FINDING (Live Racing Binary Bit-Register + Exponential 2^n Search Tree) ──
        nodes.push(
            txt('FINDING  (NP · BRUTE-FORCE CPU)', -475, -264, 26, COSMOS.rose, 'mono').opacity(a),
        )

        // Live 8-bit racing hardware register flipping 0/1 states rapidly as the CPU tries keys
        const bitStep = Math.floor(sp * 190)
        const bitY = -202
        for (let b = 0; b < 8; b++) {
            const bx = -700 + b * 64
            const bitVal = ((bitStep >> (7 - b)) ^ (b * 3)) & 1
            const isHi = bitVal === 1
            nodes.push(
                rect(50, 44, {
                    fill: isHi ? '#2a1222' : '#101524',
                    stroke: isHi ? COSMOS.rose : '#3a4668',
                    width: isHi ? 2.2 : 1.4,
                    radius: 8,
                }).at(bx, bitY).glow(isHi ? 6 : 0, COSMOS.rose).opacity(a),
                txt(String(bitVal), bx, bitY, 26, isHi ? COSMOS.rose : COSMOS.dim, 'mono').opacity(a),
            )
        }

        // Exponential 2^n search tree with traveling probe & golden key highlight
        const probeIdx = Math.floor((sp * 28) % SEARCH_NODES.length)
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
                    }).glow(keyLit ? 10 : 3, keyLit ? COSMOS.gold : COSMOS.rose).set('blend', 'screen'),
                )
            }
            nodes.push(
                dot(keyLit ? 7.5 : active ? 6.2 : 4.0, keyLit ? COSMOS.gold : active ? '#ffffff' : COSMOS.rose)
                    .at(sn.pos[0], sn.pos[1])
                    .glow(keyLit ? 14 : active ? 10 : 4, keyLit ? COSMOS.gold : COSMOS.rose)
                    .opacity(a)
                    .set('blend', 'screen'),
            )
        }

        // Racing exponential counter scaling cleanly to n = 266 (2^266 ≈ 10^80 ≈ atoms in the observable universe)
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
            txt(`n = ${curN} bits   →   2^${curN} ≈ 10^${expPow}`, -475, 224, 28, COSMOS.rose, 'mono').opacity(a),
            txt(scaleLabel, -475, 282, curN >= 264 ? 26 : 28, COSMOS.amber, 'mono').opacity(a),
            txt('Observable universe ≈ 10⁸⁰ atoms', -475, 336, 26, COSMOS.muted, 'sans').opacity(a),
        )

        // ── RIGHT: CHECKING (Hardware Signal Bus + Live 3-SAT Logic Gate Verifier) ──
        nodes.push(
            txt('CHECKING  (P · LOGIC VERIFIER)', 475, -264, 26, COSMOS.emerald, 'mono').opacity(a),
        )

        // Input Witness Key register with 4 bit pins
        const keyY = -196
        nodes.push(
            rect(560, 56, { fill: '#1a1826', stroke: COSMOS.gold, width: 2.4, radius: 12 }).at(475, keyY)
                .glow(vp > 0.05 ? 8 : 3, COSMOS.gold).opacity(a),
            txt(`KEY:  x = (${DEMO_WITNESS.map((b) => (b ? 'T' : 'F')).join(', ')})`, 475, keyY, 27, COSMOS.gold, 'mono').opacity(a),
        )

        // Vertical input signal bus on the left side of the gate stack (x = 148, strictly clear of text!)
        const busX = 148
        const outBusX = 804
        const busProgressY = keyY + 28 + Math.min(1, vp * 1.15) * 412
        nodes.push(
            line([busX, keyY + 28], [busX, 255], { stroke: '#2c3a5e', width: 2.6 }).opacity(a),
            line([outBusX, -98], [outBusX, 255], { stroke: '#2c3a5e', width: 2.6 }).opacity(a),
        )
        if (vp > 0.02) {
            nodes.push(
                line([busX, keyY + 28], [busX, Math.min(144, busProgressY)], { stroke: COSMOS.gold, width: 3.4 })
                    .glow(10, COSMOS.gold).opacity(a).set('blend', 'screen'),
                dot(6.0, '#ffffff').at(busX, Math.min(144, busProgressY)).glow(12, COSMOS.gold).opacity(a).set('blend', 'screen'),
            )
        }

        // 4 hardware OR-clause gate units fed from input bus -> feeding right output AND-bus
        for (let i = 0; i < DEMO_3SAT.length; i++) {
            const cl = DEMO_3SAT[i]!
            const cy = -98 + i * 78
            const checked = vp > (i + 0.35) / 5
            const col = checked ? COSMOS.emerald : '#3f5075'
            nodes.push(
                // Left wire tap from input bus into clause gate
                line([busX, cy], [195, cy], { stroke: checked ? COSMOS.gold : '#324163', width: checked ? 2.8 : 1.8 })
                    .glow(checked ? 6 : 0, COSMOS.gold).opacity(a),
                // Right wire tap from clause gate into output AND-bus
                line([755, cy], [outBusX, cy], { stroke: checked ? COSMOS.emerald : '#324163', width: checked ? 2.8 : 1.8 })
                    .glow(checked ? 8 : 0, COSMOS.emerald).opacity(a),
                dot(4.5, checked ? COSMOS.emerald : '#4a5a80').at(outBusX, cy).opacity(a),
                // Gate chip housing
                rect(560, 56, { fill: checked ? '#0e2424' : '#101626', stroke: col, width: checked ? 2.8 : 1.6, radius: 10 })
                    .at(475, cy).glow(checked ? 8 : 2, col).opacity(a),
                txt(cl.label, 232, cy, 27, checked ? COSMOS.ink : COSMOS.muted, 'mono', 'left').opacity(a),
                txt(checked ? '✓  1' : '···', 718, cy, 26, checked ? COSMOS.emerald : COSMOS.dim, 'mono', 'right').opacity(a),
            )
        }

        // Lit emerald output bus down to final AND verification banner
        if (vp > 0.25) {
            const outY = -98 + Math.min(1, (vp - 0.15) / 0.75) * 353
            nodes.push(
                line([outBusX, -98], [outBusX, outY], { stroke: COSMOS.emerald, width: 3.4 })
                    .glow(10, COSMOS.emerald).opacity(a).set('blend', 'screen'),
                new Node(polyPath([[outBusX, 255], [755, 255]])).stroke(COSMOS.emerald, 3.0, vp > 0.85 ? a : 0.2 * a),
            )
        }

        if (vp > 0.85) {
            const okOp = Math.min(1, (vp - 0.85) / 0.15) * a
            nodes.push(
                rect(560, 68, { fill: '#0e2624', stroke: COSMOS.emerald, width: 3.2, radius: 14 })
                    .at(475, 255).glow(12, COSMOS.emerald).opacity(okOp),
                txt('AND = 1  ·  VERIFIED IN µs', 475, 255, 28, COSMOS.emerald, 'mono').opacity(okOp),
            )
        } else {
            nodes.push(
                txt('One linear hardware pass checks every gate', 475, 255, 26, COSMOS.muted, 'sans').opacity(a),
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
            showIntro.to(0, { duration: 0.22 }),
            delay(showEngine.to(1, { duration: 0.3 }), 0.26),
            delay(searchProg.to(1, { duration: Math.max(2.0, engineDur - 0.28), ease: linear }), 0.26),
        ))
    })
    c.at(checkRel, () => {
        s.play(verifyProg.to(1, { duration: Math.max(1.6, c.cue('microseconds').start - c.cue('Yet hand me one').start + 0.45) }))
    })
}

import {
    Node, circle, delay, dot, dynamic, group, line, linear, par, polyPath, radialGradient, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { PEQUALNP_FRONTS } from '../math'

/** Clean Bezier arrow with optional animated photon (routed strictly inside open corridors). */
function flowArrow(from: Vec, to: Vec, ctrl: Vec, color: string, width: number, opacity: number, photonU?: number): Node[] {
    const pts: Vec[] = []
    for (let i = 0; i <= 18; i++) {
        const t = i / 18
        const u = 1 - t
        pts.push([
            u * u * from[0] + 2 * u * t * ctrl[0] + t * t * to[0],
            u * u * from[1] + 2 * u * t * ctrl[1] + t * t * to[1],
        ])
    }
    const dx = to[0] - ctrl[0]
    const dy = to[1] - ctrl[1]
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const tip = to
    const left: Vec = [tip[0] - ux * 11 - uy * 5.5, tip[1] - uy * 11 + ux * 5.5]
    const right: Vec = [tip[0] - ux * 11 + uy * 5.5, tip[1] - uy * 11 - ux * 5.5]
    const out: Node[] = [
        new Node(polyPath(pts)).stroke(color, width, opacity).glow(8, color).set('blend', 'screen'),
        new Node(polyPath([left, tip, right])).stroke(color, Math.max(1.8, width * 0.85), opacity).set('blend', 'screen'),
    ]
    if (photonU !== undefined) {
        const t = photonU % 1
        const u = 1 - t
        const px = u * u * from[0] + 2 * u * t * ctrl[0] + t * t * to[0]
        const py = u * u * from[1] + 2 * u * t * ctrl[1] + t * t * to[1]
        out.push(dot(5.5, '#ffffff').at(px, py).glow(14, color).opacity(opacity).set('blend', 'screen'))
    }
    return out
}

const DAG_LAYERS: readonly (readonly Vec[])[] = [
    [[-340, 260], [-170, 260], [0, 260], [170, 260], [340, 260]],
    [[-260, 155], [-85, 155], [85, 155], [260, 155]],
    [[-165, 50], [0, 50], [165, 50]],
]

export const pequalnp: SceneFunction = (s, c) => {
    const showPipe = s.value(1)
    const pipeProg = s.value(0)
    const photonT = s.value(0)
    const showStatus = s.value(0)
    const dagProg = s.value(0)

    // ── Shot 1: Live pequalnp.com Architecture (clean, zero clutter) ──
    const pipeHeader = group(
        txt('PEQUALNP.COM  ·  LIVE OPEN AI LAB', -855, -424, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Thousands of AI agents — one ruthless Lean 4 judge', -855, -356, 50, COSMOS.ink, 'serif', 'left')
            .glow(5, '#38bdf8'),
    )

    const livePipe = dynamic(() => {
        const a = showPipe.value
        if (a < 0.02) return []
        const p = pipeProg.value
        const ph = photonT.value
        const nodes: Node[] = []

        // 1. LEFT: 5 Active Research Fronts
        nodes.push(
            txt('5 ACTIVE FRONTS', -675, -264, 26, COSMOS.cyan, 'mono').opacity(a),
        )
        for (let i = 0; i < PEQUALNP_FRONTS.length; i++) {
            const f = PEQUALNP_FRONTS[i]!
            const fy = -182 + i * 94
            const vis = Math.max(0.25, Math.min(1, p * 4.5 - i * 0.18))
            nodes.push(
                rect(368, 68, { fill: '#101627', stroke: f.col, width: 2.2, radius: 12 })
                    .at(-675, fy).glow(6, f.col).opacity(vis * a),
                txt(f.name, -675, fy - 11, 26, f.col, 'mono').opacity(vis * a),
                txt(f.tag, -675, fy + 19, 26, COSMOS.muted, 'sans').opacity(vis * a),
                ...flowArrow([-486, fy], [-200, (i - 2) * 28], [-344, fy * 0.65], f.col, 2.8, vis * a, (ph * 1.1 + i * 0.2) % 1),
            )
        }

        // 2. CENTER: Crowdsourced AI Fleet Hub
        const fleetVis = Math.max(0.2, Math.min(1, p * 2.5 - 0.15))
        nodes.push(
            circle(154, {
                fill: radialGradient([0, 0], 154, [
                    [0, '#5ce1e634'],
                    [0.65, '#4c2f8a1e'],
                    [1, '#07091000'],
                ]),
                stroke: COSMOS.cyan,
                width: 3.4,
            }).at(-40, 6).glow(16, COSMOS.cyan).opacity(fleetVis * a),
            txt('OPEN AI FLEET', -40, -52, 26, COSMOS.cyan, 'mono').opacity(fleetVis * a),
            txt('42,500+ PRs', -40, 2, 38, COSMOS.gold, 'mono').glow(8, COSMOS.gold).opacity(fleetVis * a),
            txt('Prove · Refute · Split', -40, 56, 26, COSMOS.ink, 'sans').opacity(fleetVis * a),
            txt('Claude · Codex · Cursor · Gemini', -40, 214, 26, COSMOS.muted, 'mono').opacity(fleetVis * a),
        )

        // 3. RIGHT: One Strict Lean 4 Judge -> Verified Map / Graveyard
        const judgeVis = Math.max(0, Math.min(1, p * 2.6 - 0.65))
        if (judgeVis > 0.02) {
            const jOp = judgeVis * a
            nodes.push(
                ...flowArrow([118, 6], [326, 6], [222, 6], COSMOS.gold, 4.2, jOp, (ph * 1.5) % 1),
                rect(510, 148, { fill: '#181524', stroke: COSMOS.gold, width: 3.2, radius: 16 })
                    .at(590, 6).glow(14, COSMOS.gold).opacity(jOp),
                txt('LEAN 4 JUDGE', 590, -26, 30, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(jOp),
                txt('Zero shortcuts · Zero fake proofs', 590, 24, 26, COSMOS.ink, 'sans').opacity(jOp),
                ...flowArrow([590, -72], [590, -162], [590, -118], COSMOS.emerald, 3.6, jOp, (ph * 1.6) % 1),
                rect(440, 68, { fill: '#0e2422', stroke: COSMOS.emerald, width: 2.6, radius: 12 })
                    .at(590, -204).glow(10, COSMOS.emerald).opacity(jOp),
                txt('ACCEPTED → VERIFIED MAP', 590, -204, 26, COSMOS.emerald, 'mono').opacity(jOp),
                ...flowArrow([590, 84], [590, 174], [590, 130], COSMOS.rose, 3.4, jOp, (ph * 1.6 + 0.5) % 1),
                rect(440, 68, { fill: '#22101c', stroke: COSMOS.rose, width: 2.4, radius: 12 })
                    .at(590, 216).glow(8, COSMOS.rose).opacity(jOp),
                txt('DEAD ENDS → GRAVEYARD', 590, 216, 26, COSMOS.rose, 'mono').opacity(jOp),
            )
        }

        return group(...nodes)
    })

    // ── Shot 2: Real Progress vs. The Unbridged Chasm ──
    const statusHeader = group(
        txt('IS THERE REAL PROGRESS?', 0, -418, 26, COSMOS.gold, 'mono'),
        txt('P vs NP is still unsolved — yet real theorems are falling', 0, -348, 50, COSMOS.ink, 'serif')
            .glow(6, COSMOS.gold),
    )

    const liveStatus = dynamic(() => {
        const a = showStatus.value
        if (a < 0.02) return []
        const dp = dagProg.value
        const ph = photonT.value
        const nodes: Node[] = []

        nodes.push(
            circle(260, {
                fill: radialGradient([0, 0], 260, [
                    [0, '#ffd1662c'],
                    [0.55, '#07091000'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, -210).opacity(a).set('blend', 'screen'),
            rect(340, 74, { fill: '#1b1624', stroke: COSMOS.gold, width: 3.4, radius: 16 })
                .at(0, -210).glow(16, COSMOS.gold).opacity(a),
            txt('P ≠ NP ?  (SUMMIT)', 0, -210, 30, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(a),
            line([-360, -82], [360, -82], { stroke: COSMOS.rose, width: 2.2, dash: [10, 10] }).opacity(0.8 * a),
            txt('UNBRIDGED CHASM  (STILL OPEN)', 0, -114, 26, COSMOS.rose, 'mono').opacity(a),
        )

        for (let l = 0; l < DAG_LAYERS.length - 1; l++) {
            const lower = DAG_LAYERS[l]!
            const upper = DAG_LAYERS[l + 1]!
            const layerVis = Math.max(0, Math.min(1, dp * 2.5 - l * 0.45))
            if (layerVis < 0.02) continue
            for (let i = 0; i < upper.length; i++) {
                const uPos = upper[i]!
                for (const j of [i, i + 1]) {
                    if (j < lower.length) {
                        const lPos = lower[j]!
                        nodes.push(
                            line(lPos, uPos, { stroke: COSMOS.emerald, width: 2.4, opacity: 0.72 * layerVis * a })
                                .glow(6, COSMOS.emerald).set('blend', 'screen'),
                        )
                    }
                }
            }
        }
        for (let l = 0; l < DAG_LAYERS.length; l++) {
            const row = DAG_LAYERS[l]!
            const layerVis = Math.max(0, Math.min(1, dp * 2.8 - l * 0.35))
            if (layerVis < 0.02) continue
            for (let i = 0; i < row.length; i++) {
                const pos = row[i]!
                const pulse = 0.65 + 0.35 * Math.sin(ph * 4 + i + l)
                nodes.push(
                    circle(18, { fill: '#0e2824', stroke: COSMOS.emerald, width: 2.6 })
                        .at(pos[0], pos[1]).glow(10 * pulse, COSMOS.emerald).opacity(layerVis * a),
                    dot(5.5, '#ffffff').at(pos[0], pos[1]).opacity(layerVis * a),
                )
            }
        }

        nodes.push(
            txt('PROVED IN LEAN 4', -665, -38, 27, COSMOS.emerald, 'mono').opacity(a),
            txt('Time Hierarchy Theorem', -665, 16, 27, COSMOS.ink, 'sans').opacity(a),
            txt('3-SAT width lower bounds', -665, 62, 27, COSMOS.ink, 'sans').opacity(a),
            txt('Dead-end refutations', -665, 108, 27, COSMOS.muted, 'sans').opacity(a),

            txt('THE BREAKTHROUGH', 665, -38, 27, COSMOS.cyan, 'mono').opacity(a),
            txt('4,200+ forks · 42,500+ PRs', 665, 16, 27, COSMOS.ink, 'sans').opacity(a),
            txt('Zero hallucinated proofs', 665, 62, 27, COSMOS.ink, 'sans').opacity(a),
            txt('Open AI + Lean 4 works', 665, 108, 27, COSMOS.gold, 'mono').opacity(a),
        )

        return group(...nodes)
    })

    s.add(pipeHeader, livePipe, liveStatus)
    const sceneDur = Math.max(8, c.end - c.start - 0.5)
    const statusRel = c.cue('So is there real progress').start - c.start
    const statusDur = Math.max(3.5, c.end - c.cue('So is there real progress').start - 0.5)

    c.at(0.1, () => {
        s.play(par(
            photonT.to(6.0, { duration: sceneDur, ease: linear }),
            pipeProg.to(1, { duration: Math.max(4.0, statusRel - 0.5), ease: linear }),
        ))
    })

    c.swap('So is there real progress', pipeHeader, statusHeader)
    c.at(statusRel, () => {
        s.play(par(
            showPipe.to(0, { duration: 0.16 }),
            delay(showStatus.to(1, { duration: 0.28 }), 0.2),
            delay(dagProg.to(1, { duration: Math.min(2.8, statusDur * 0.55) }), 0.25),
        ))
    })
}

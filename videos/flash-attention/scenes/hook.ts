import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, par, radialGradient, rect,
    type SceneFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const COLS = 12
const ROWS = 11
const DIE_X = 435
const DIE_Y = 30
const SX = 40
const SY = 36

// Deterministic starving-core flicker pattern
const CORE_PHASE = Array.from({ length: COLS * ROWS }, (_, i) => ((i * 37 + 13) % 100) / 100)

export const hook: SceneFunction = (s, c) => {
    const busFlow = s.value(0)
    const showStarve = s.value(1)
    const showBlaze = s.value(0)
    const blazePhase = s.value(0)

    const busGrad = linearGradient([-430, 185], [140, 185], [COSMOS.rose, COSMOS.amber, COSMOS.rose])

    // Shot 1: 132 starving SM cores in amber/rose waiting on a narrow crawling HBM bus carrying a giant N x N matrix
    const shot1Copy = group(
        txt('90% IDLE', -845, -340, 86, COSMOS.rose, 'mono', 'left').glow(10, COSMOS.rose),
        txt('Starving for Memory', -848, -220, 74, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.amber),
        txt('132 streaming multiprocessors waiting on off-chip HBM', -845, -138, 30, COSMOS.muted, 'sans', 'left'),
    )

    const liveStarve = dynamic(() => {
        if (showStarve.value < 0.02) return []
        const a = showStarve.value
        const t = busFlow.value
        const nodes: Node[] = [
            // Dim crimson/amber glow behind starving GPU die
            circle(410, {
                fill: radialGradient([0, 0], 410, [
                    [0, '#ff6b8b20'],
                    [0.55, '#fb923c10'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(DIE_X, DIE_Y).opacity(a),
            // HBM3 off-chip bank rails on lower-left (clean neon rails, zero boxy card)
            txt('HBM3  ·  3.35 TB/s', -845, 58, 28, COSMOS.rose, 'mono', 'left').opacity(a),
            txt('Giant N × N score matrix', -845, 342, 28, COSMOS.amber, 'sans', 'left').opacity(a),
        ]

        // Glowing HBM memory strips
        for (let row = 0; row < 5; row++) {
            const ry = 112 + row * 40
            const pulse = 0.35 + 0.35 * Math.sin(t * 2.2 + row * 0.9)
            nodes.push(
                rect(310, 16, { fill: COSMOS.rose, stroke: null, radius: 4 }).at(-690, ry).opacity(pulse * a),
                line([-845, ry], [-535, ry], { stroke: COSMOS.amber, width: 1.4 }).opacity(0.32 * a),
            )
        }

        // Narrow congested HBM bus pipe carrying slow N x N matrix packets
        nodes.push(
            line([-510, 174], [140, 174], { stroke: '#3a2232', width: 2 }).opacity(0.85 * a),
            line([-510, 210], [140, 210], { stroke: '#3a2232', width: 2 }).opacity(0.85 * a),
            line([-510, 192], [140, 192], { stroke: busGrad, width: 6 }).opacity(0.32 * a).glow(6, COSMOS.rose),
            txt('narrow HBM bus', -185, 134, 26, COSMOS.amber, 'mono').opacity(0.9 * a),
        )

        // Slow crawling N x N matrix packets along the narrow bus
        for (let k = 0; k < 4; k++) {
            const u = ((t * 0.22 + k * 0.25) % 1)
            const px = -495 + u * 605
            nodes.push(
                rect(54, 24, { fill: COSMOS.amber, stroke: COSMOS.rose, width: 1.5, radius: 4 })
                    .at(px, 192)
                    .opacity(0.9 * a)
                    .glow(6, COSMOS.amber),
            )
            // Mini 3x3 matrix dots inside packet
            for (let mr = -1; mr <= 1; mr++) {
                for (let mc = -1; mc <= 1; mc++) {
                    nodes.push(dot(1.6, '#fff5eb').at(px + mc * 12, 192 + mr * 6).opacity(0.8 * a))
                }
            }
        }

        // 132 SM cores (12 x 11) starving in amber/rose — only ~10% active at any instant
        for (let r = 0; r < ROWS; r++) {
            for (let col = 0; col < COLS; col++) {
                const idx = r * COLS + col
                const x = DIE_X + (col - (COLS - 1) / 2) * SX
                const y = DIE_Y + (r - (ROWS - 1) / 2) * SY
                const ph = CORE_PHASE[idx]!
                const active = Math.sin(t * 2.8 + ph * Math.PI * 2) > 0.84
                const fill = active ? COSMOS.amber : '#2b1925'
                const stroke = active ? COSMOS.rose : '#542636'
                nodes.push(
                    rect(28, 22, { fill, stroke, width: 1.2, radius: 4 })
                        .at(x, y)
                        .opacity((active ? 0.95 : 0.65) * a),
                )
            }
        }

        const util = Math.round(8.5 + Math.sin(t * 3.1) * 1.4)
        nodes.push(
            txt(`132 SM CORES  ·  UTILIZATION ~${util}%`, DIE_X, 286, 28, COSMOS.rose, 'mono').glow(6, COSMOS.rose).opacity(a),
        )
        return group(...nodes)
    })

    // Shot 2: Shockwave eruption! 132 SM cores snap into blazing cyan/gold on-chip SRAM tiles
    const shot2Caption = group(
        txt('FlashAttention', 0, -405, 82, COSMOS.gold, 'serif').glow(10, COSMOS.gold),
        txt('Fused inside blazing on-chip SRAM  ·  exact math, zero approximation', 0, 412, 32, COSMOS.cyan, 'sans'),
    )

    const liveBlaze = dynamic(() => {
        if (showBlaze.value < 0.02) return []
        const a = showBlaze.value
        const p = blazePhase.value
        const shockR = 70 + Math.min(1, p * 0.72) * 235
        const shockOp = Math.max(0, 1 - p * 0.72) * 0.85 * a
        const shockR2 = 55 + ((p * 0.55) % 1) * 235
        const shockOp2 = (1 - ((p * 0.55) % 1)) * 0.55 * a
        const cx = 0
        const cy = -8

        const nodes: Node[] = [
            circle(500, {
                fill: radialGradient([0, 0], 500, [
                    [0, '#5ce1e630'],
                    [0.45, '#ffd16618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(cx, cy).opacity(a),
            circle(shockR, { fill: null, stroke: COSMOS.gold, width: 4.5 }).at(cx, cy).opacity(shockOp).glow(14, COSMOS.gold),
            circle(shockR2, { fill: null, stroke: COSMOS.cyan, width: 2.4 }).at(cx, cy).opacity(shockOp2).glow(10, COSMOS.cyan),
            circle(285, { fill: null, stroke: COSMOS.cyan, width: 2, dash: [16, 12] }).at(cx, cy).opacity(0.45 * a),
        ]

        // Orbiting SRAM tile photons
        for (let k = 0; k < 6; k++) {
            const ang = p * 1.4 + (k * Math.PI) / 3
            const px = cx + Math.cos(ang) * 285
            const py = cy + Math.sin(ang) * 285
            const col = k % 2 === 0 ? COSMOS.gold : COSMOS.cyan
            nodes.push(dot(6, '#ffffff').at(px, py).glow(12, col).opacity(a))
        }

        // All 132 SM cores blazing in synchronized cyan/gold SRAM tile waves
        for (let r = 0; r < ROWS; r++) {
            for (let col = 0; col < COLS; col++) {
                const x = cx + (col - (COLS - 1) / 2) * 40
                const y = cy + (r - (ROWS - 1) / 2) * 34
                const tileId = Math.floor(r / 3) * 4 + Math.floor(col / 3)
                const wave = 0.55 + 0.45 * Math.sin(p * 3.8 + tileId * 0.85)
                const isGold = (Math.floor(r / 3) + Math.floor(col / 3)) % 2 === 0
                const fill = isGold ? COSMOS.gold : COSMOS.cyan
                nodes.push(
                    rect(28, 22, { fill, stroke: '#ffffff', width: 0.8, radius: 5 })
                        .at(x, y)
                        .opacity((0.45 + wave * 0.52) * a),
                )
            }
        }

        // Highlighted active SRAM tile brackets sweeping across the chip
        const activeTileC = Math.floor((p * 1.8) % 4)
        const activeTileR = Math.floor((p * 0.7) % 3)
        const tx = cx + (activeTileC * 3 + 1 - 5.5) * 40
        const ty = cy + (activeTileR * 3 + 1 - 5) * 34
        nodes.push(
            rect(40 * 3 + 8, 34 * 3 + 8, { fill: null, stroke: '#ffffff', width: 3.2, radius: 8 })
                .at(tx, ty)
                .opacity(0.95 * a)
                .glow(12, COSMOS.gold),
            txt('ON-CHIP SRAM TILES  ·  92% UTIL', 0, 336, 28, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(a),
        )
        return group(...nodes)
    })

    s.add(liveStarve, shot1Copy, liveBlaze)
    c.at(0.05, () => s.play(busFlow.to(6.5, { duration: 11.5, ease: linear })))

    c.on('shatters that memory wall', () => {
        s.play(par(
            showStarve.to(0, { duration: 0.28 }),
            showBlaze.to(1, { duration: 0.35 }),
            blazePhase.to(3.0, { duration: 4.0, ease: linear }),
        ))
    })
    c.swap('shatters that memory wall', shot1Copy, shot2Caption)
}

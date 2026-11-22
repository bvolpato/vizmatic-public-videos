import {
    Node, arrow, circle, dot, dynamic, group, line, linear, linearGradient, par, radialGradient, rect, scalarField,
    type SceneFunction,
} from 'vizmatic/stage'
import { attentionScoreHeight } from '../math'
import { COSMOS, txt } from '../../../factory/style'

const COLS = 12
const ROWS = 11
const DIE_X = 465
const DIE_Y = 30
const SX = 38
const SY = 34

// Deterministic starving-core flicker pattern
const CORE_PHASE = Array.from({ length: COLS * ROWS }, (_, i) => ((i * 37 + 13) % 100) / 100)

// HBM N x N matrix layout on lower-left of Shot 1
const MAT_CX = -685
const MAT_CY = 165
const MAT_SIZE = 264

// Shot 2: Zoomed-in Fused On-Chip SRAM Kernel Chamber
const SRAM_CX = 0
const SRAM_CY = -6
const SRAM_W = 470
const SRAM_H = 316

export const hook: SceneFunction = (s, c) => {
    const busFlow = s.value(0)
    const showStarve = s.value(1)
    const showBlaze = s.value(0)
    const blazePhase = s.value(0)

    const busGrad = linearGradient([-470, 165], [170, 165], [COSMOS.rose, COSMOS.amber, COSMOS.rose])

    // Shot 1: Actual glowing N x N scalarField attention-score matrix in HBM3!
    const hbmMatrixField = scalarField(
        (u, v) => {
            const base = attentionScoreHeight(u, 1 - v)
            const pulse = 0.92 + 0.08 * Math.sin(busFlow.value * 2.4 + (u + v) * 8)
            return base * pulse
        },
        {
            x: [0, 1],
            y: [0, 1],
            domain: [0.1, 2.55],
            colors: ['#0c0818', '#3c1030', '#9e2348', '#e85d56', '#fb923c', '#ffd166'],
            width: MAT_SIZE,
            height: MAT_SIZE,
            resolution: 72,
        },
    ).at(MAT_CX, MAT_CY)

    // Shot 2: Live sliding Br x Bc local score matrix inside the zoomed-in SRAM chamber
    const sramTileField = scalarField(
        (u, v) => {
            const p = blazePhase.value
            const tileC = Math.floor((p * 1.45) % 4)
            const tileR = Math.floor((p * 0.55) % 4)
            const gu = (tileC + u) / 4
            const gv = (tileR + (1 - v)) / 4
            const score = attentionScoreHeight(gu, gv)
            // Live diagonal multiply-accumulate light wave sweeping across the active tile!
            const wavePhase = (p * 2.2) % 1.6
            const diagDist = Math.abs((u + (1 - v)) * 0.5 - wavePhase * 0.72)
            const macWave = Math.exp(-Math.pow(diagDist / 0.14, 2)) * 1.15
            return score + macWave
        },
        {
            x: [0, 1],
            y: [0, 1],
            domain: [0.15, 2.9],
            colors: ['#071226', '#10315c', '#1b6aa8', '#5ce1e6', '#ffd166', '#fff7d6'],
            width: 280,
            height: 224,
            resolution: 64,
        },
    ).at(SRAM_CX - 18, SRAM_CY)

    const shot1Copy = group(
        txt('90% IDLE', -845, -355, 86, COSMOS.rose, 'mono', 'left').glow(10, COSMOS.rose),
        txt('Starving for Memory', -848, -238, 72, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.amber),
        txt('132 streaming multiprocessors waiting on off-chip HBM', -845, -158, 30, COSMOS.muted, 'sans', 'left'),
    )

    const liveStarve = dynamic(() => {
        if (showStarve.value < 0.02) return []
        const a = showStarve.value
        const t = busFlow.value
        const matLeft = MAT_CX - MAT_SIZE / 2
        const matRight = MAT_CX + MAT_SIZE / 2
        const matTop = MAT_CY - MAT_SIZE / 2
        const matBot = MAT_CY + MAT_SIZE / 2

        const nodes: Node[] = [
            // Dim crimson/amber glow behind starving GPU die
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#ff6b8b24'],
                    [0.55, '#fb923c12'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(DIE_X, DIE_Y).opacity(a).set('blend', 'screen'),
            // Crimson aura behind the giant HBM N x N matrix
            circle(240, {
                fill: radialGradient([0, 0], 240, [
                    [0, '#ff6b8b30'],
                    [0.6, '#fb923c14'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(MAT_CX, MAT_CY).opacity(a).set('blend', 'screen'),
            // Actual N x N score matrix scalarField inside HBM3!
            hbmMatrixField.opacity(0.95 * a),
            rect(MAT_SIZE, MAT_SIZE, { fill: null, stroke: COSMOS.rose, width: 2.6, radius: 6 })
                .at(MAT_CX, MAT_CY)
                .glow(8, COSMOS.rose)
                .opacity(a),
            txt('HBM3  ·  3.35 TB/s', -818, matTop - 28, 26, COSMOS.rose, 'mono', 'left').opacity(a),
            txt('Giant N × N score matrix', -818, matBot + 36, 26, COSMOS.amber, 'sans', 'left').opacity(a),
        ]

        // Crisp subtle matrix grid lines over the N x N scalarField
        for (let g = 1; g < 4; g++) {
            const gx = matLeft + (MAT_SIZE * g) / 4
            const gy = matTop + (MAT_SIZE * g) / 4
            nodes.push(
                line([gx, matTop], [gx, matBot], { stroke: '#ffd166', width: 1 }).opacity(0.24 * a),
                line([matLeft, gy], [matRight, gy], { stroke: '#ffd166', width: 1 }).opacity(0.24 * a),
            )
        }

        // Funnel choke walls tapering from the giant N x N matrix into the narrow HBM bus!
        const chokeX = -465
        const busEndX = 185
        nodes.push(
            line([matRight + 4, matTop + 18], [chokeX, MAT_CY - 18], { stroke: COSMOS.rose, width: 2.4 }).opacity(0.75 * a),
            line([matRight + 4, matBot - 18], [chokeX, MAT_CY + 18], { stroke: COSMOS.rose, width: 2.4 }).opacity(0.75 * a),
            // Narrow congested HBM bus pipe walls
            line([chokeX, MAT_CY - 18], [busEndX, MAT_CY - 18], { stroke: '#6c2b40', width: 2.4 }).opacity(0.9 * a),
            line([chokeX, MAT_CY + 18], [busEndX, MAT_CY + 18], { stroke: '#6c2b40', width: 2.4 }).opacity(0.9 * a),
            line([chokeX, MAT_CY], [busEndX, MAT_CY], { stroke: busGrad, width: 7 }).opacity(0.45 * a).glow(8, COSMOS.rose).set('blend', 'screen'),
            // Congestion heat flare right at the funnel bottleneck!
            circle(54, {
                fill: radialGradient([0, 0], 54, [
                    [0, '#ff6b8b66'],
                    [0.5, '#fb923c28'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(chokeX + 8, MAT_CY).opacity((0.7 + 0.3 * Math.sin(t * 5.2)) * a).set('blend', 'screen'),
            txt('NARROW HBM BOTTLENECK', (chokeX + busEndX) / 2, MAT_CY - 52, 26, COSMOS.amber, 'mono').opacity(0.95 * a),
            txt('queued N² reads/writes', (chokeX + busEndX) / 2, MAT_CY + 54, 26, COSMOS.rose, 'sans').opacity(0.86 * a),
        )

        // Queued packet congestion piling up inside the funnel entrance!
        for (let q = 0; q < 6; q++) {
            const col = Math.floor(q / 2)
            const row = q % 2
            const wobble = Math.sin(t * 4.5 + q * 1.3) * 3.5
            const qx = matRight + 24 + col * 24 + wobble
            const qy = MAT_CY + (row === 0 ? -15 : 15) * (1 - col * 0.22)
            nodes.push(
                rect(18, 13, { fill: COSMOS.rose, stroke: COSMOS.gold, width: 1.1, radius: 3 })
                    .at(qx, qy)
                    .opacity(0.86 * a)
                    .glow(5, COSMOS.rose),
            )
        }

        // Slow crawling N x N matrix packets squeezing through the narrow bus
        for (let k = 0; k < 5; k++) {
            const u = (t * 0.2 + k * 0.2) % 1
            const px = chokeX + 26 + u * (busEndX - chokeX - 54)
            nodes.push(
                rect(50, 22, { fill: COSMOS.amber, stroke: COSMOS.rose, width: 1.5, radius: 4 })
                    .at(px, MAT_CY)
                    .opacity(0.92 * a)
                    .glow(7, COSMOS.amber),
            )
            for (let mr = -1; mr <= 1; mr++) {
                for (let mc = -1; mc <= 1; mc++) {
                    nodes.push(dot(1.5, '#fff7ed').at(px + mc * 11, MAT_CY + mr * 5.5).opacity(0.82 * a))
                }
            }
        }

        // 132 SM cores (12 x 11) starving in amber/rose — only ~10% active, with glowing screen-blended sparks!
        const sparkNodes: Node[] = []
        for (let r = 0; r < ROWS; r++) {
            for (let col = 0; col < COLS; col++) {
                const idx = r * COLS + col
                const x = DIE_X + (col - (COLS - 1) / 2) * SX
                const y = DIE_Y + (r - (ROWS - 1) / 2) * SY
                const ph = CORE_PHASE[idx]!
                const active = Math.sin(t * 2.8 + ph * Math.PI * 2) > 0.84
                const fill = active ? COSMOS.amber : '#241522'
                const stroke = active ? COSMOS.gold : '#4a2132'
                nodes.push(
                    rect(26, 20, { fill, stroke, width: 1.2, radius: 4 })
                        .at(x, y)
                        .opacity((active ? 0.96 : 0.62) * a),
                )
                if (active) {
                    sparkNodes.push(
                        circle(20, {
                            fill: radialGradient([0, 0], 20, [
                                [0, '#ffd16688'],
                                [0.5, '#fb923c36'],
                                [1, '#07091000'],
                            ]),
                            stroke: null,
                        }).at(x, y).opacity(a),
                        dot(3.6, '#ffffff').at(x, y).glow(8, COSMOS.gold).opacity(0.92 * a),
                    )
                }
            }
        }
        if (sparkNodes.length > 0) {
            nodes.push(group(...sparkNodes).set('blend', 'screen'))
        }

        const util = Math.round(8.5 + Math.sin(t * 3.1) * 1.4)
        nodes.push(
            txt(`132 SM CORES  ·  UTILIZATION ~${util}%`, DIE_X, 276, 28, COSMOS.rose, 'mono').glow(6, COSMOS.rose).opacity(a),
        )
        return group(...nodes)
    })

    // Shot 2: Zoomed-in Fused On-Chip SRAM Tile Chamber (zero recycled square grid!)
    const shot2Caption = group(
        txt('FlashAttention', 0, -425, 80, COSMOS.gold, 'serif').glow(10, COSMOS.gold),
        txt('Fused inside blazing on-chip SRAM  ·  exact math, zero approximation', 0, 425, 30, COSMOS.cyan, 'sans'),
    )

    const liveBlaze = dynamic(() => {
        if (showBlaze.value < 0.02) return []
        const a = showBlaze.value
        const p = blazePhase.value
        const tileC = Math.floor((p * 1.45) % 4) + 1
        const tileR = Math.floor((p * 0.55) % 4) + 1

        // Radial bandwidth waves erupting from the on-chip SRAM kernel
        const wave1 = (p * 0.62) % 1
        const wave2 = (p * 0.62 + 0.5) % 1
        const r1 = 175 + wave1 * 320
        const r2 = 175 + wave2 * 320

        const chamberLeft = SRAM_CX - SRAM_W / 2
        const chamberRight = SRAM_CX + SRAM_W / 2
        const chamberTop = SRAM_CY - SRAM_H / 2
        const chamberBot = SRAM_CY + SRAM_H / 2

        const tileLeft = SRAM_CX - 18 - 140
        const tileRight = SRAM_CX - 18 + 140
        const tileTop = SRAM_CY - 112
        const tileBot = SRAM_CY + 112

        const lightNodes: Node[] = [
            // Soft radial fusion glow
            circle(540, {
                fill: radialGradient([0, 0], 540, [
                    [0, '#5ce1e634'],
                    [0.44, '#ffd1661c'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(SRAM_CX, SRAM_CY).opacity(a),
            // Concentric radial bandwidth waves (19 TB/s!)
            circle(r1, { fill: null, stroke: COSMOS.gold, width: 3.6 }).at(SRAM_CX, SRAM_CY).opacity((1 - wave1) * 0.78 * a).glow(12, COSMOS.gold),
            circle(r2, { fill: null, stroke: COSMOS.cyan, width: 2.6 }).at(SRAM_CX, SRAM_CY).opacity((1 - wave2) * 0.62 * a).glow(10, COSMOS.cyan),
        ]

        // Live fused Q -> K^T -> Softmax -> V -> O multiply-accumulate wave beams inside the tile!
        const macProg = (p * 2.2) % 1.35
        for (let lane = 0; lane < 4; lane++) {
            const ly = tileTop + 28 + lane * 56
            const lx = tileLeft + 35 + lane * 70
            // Horizontal Q_i wave pulse firing from left Q-register into SRAM tile
            const qx = tileLeft + Math.min(1, Math.max(0, macProg - lane * 0.08)) * 280
            lightNodes.push(
                line([tileLeft - 190, ly], [tileLeft, ly], { stroke: COSMOS.gold, width: 3.4 }).opacity(0.75 * a).glow(8, COSMOS.gold),
                line([tileLeft, ly], [qx, ly], { stroke: COSMOS.gold, width: 3.0 }).opacity(0.85 * a).glow(8, COSMOS.gold),
                dot(5.2, '#ffffff').at(qx, ly).glow(12, COSMOS.gold).opacity(0.95 * a),
            )
            // Vertical K_j / V_j wave pulse firing from top K/V-stream down through SRAM tile
            const ky = tileTop + Math.min(1, Math.max(0, macProg - lane * 0.08)) * 224
            lightNodes.push(
                line([lx, tileTop - 95], [lx, tileTop], { stroke: COSMOS.cyan, width: 3.0 }).opacity(0.75 * a).glow(8, COSMOS.cyan),
                line([lx, tileTop], [lx, ky], { stroke: COSMOS.cyan, width: 2.6 }).opacity(0.82 * a).glow(8, COSMOS.cyan),
                dot(4.8, '#ffffff').at(lx, ky).glow(12, COSMOS.cyan).opacity(0.92 * a),
            )
            // Bright MAC intersection flash sparks
            if (qx > lx - 24 && ky > ly - 24) {
                lightNodes.push(dot(5.5, '#fff7d6').at(lx, ly).glow(14, COSMOS.gold).opacity(0.88 * a))
            }
        }

        // Fused output O_i accumulator beam exiting rightward on-chip!
        const oPulse = 0.6 + 0.4 * Math.sin(p * 6.5)
        lightNodes.push(
            arrow([tileRight + 10, SRAM_CY], [chamberRight + 170, SRAM_CY], {
                stroke: COSMOS.emerald,
                width: 5.0,
                tip: 18,
            }).glow(12, COSMOS.emerald).opacity(0.92 * a),
            dot(7, '#ffffff').at(tileRight + 20 + ((p * 2.1) % 1) * 145, SRAM_CY).glow(14, COSMOS.emerald).opacity(a),
        )

        const nodes: Node[] = [
            group(...lightNodes).set('blend', 'screen'),
            // Outer On-Chip SRAM Chamber border
            rect(SRAM_W, SRAM_H, { fill: '#0b1224', stroke: COSMOS.gold, width: 3.4, radius: 14 })
                .at(SRAM_CX, SRAM_CY)
                .opacity(0.88 * a)
                .glow(10, COSMOS.gold),
            // Live Br x Bc attention score heatmap firing inside the sliding SRAM tile
            sramTileField.opacity(0.96 * a),
            rect(280, 224, { fill: null, stroke: '#ffffff', width: 2.2, radius: 6 })
                .at(SRAM_CX - 18, SRAM_CY)
                .opacity(0.88 * a)
                .glow(8, COSMOS.cyan),
            // Left Q_i pinned register block
            rect(136, 224, { fill: '#1f1b14', stroke: COSMOS.gold, width: 2.8, radius: 10 })
                .at(tileLeft - 245, SRAM_CY)
                .opacity(0.92 * a)
                .glow(8, COSMOS.gold),
            txt(`Q${tileR}`, tileLeft - 245, SRAM_CY - 20, 44, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(a),
            txt('pinned', tileLeft - 245, SRAM_CY + 28, 26, COSMOS.muted, 'sans').opacity(a),
            // Top streaming K_j, V_j block
            rect(280, 62, { fill: '#101d2e', stroke: COSMOS.cyan, width: 2.8, radius: 10 })
                .at(SRAM_CX - 18, tileTop - 115)
                .opacity(0.92 * a)
                .glow(8, COSMOS.cyan),
            txt(`K${tileC}, V${tileC}  stream`, SRAM_CX - 18, tileTop - 115, 28, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan).opacity(a),
            // Right O_i fused output accumulator block
            rect(152, 224, { fill: '#0e2022', stroke: COSMOS.emerald, width: 2.8, radius: 10 })
                .at(chamberRight + 240, SRAM_CY)
                .opacity((0.82 + 0.16 * oPulse) * a)
                .glow(10, COSMOS.emerald),
            txt(`O${tileR}`, chamberRight + 240, SRAM_CY - 22, 44, COSMOS.emerald, 'mono').glow(6, COSMOS.emerald).opacity(a),
            txt('fused sum', chamberRight + 240, SRAM_CY + 28, 26, COSMOS.muted, 'sans').opacity(a),
            // Live on-chip stage label + live tile-index counters!
            txt('Q·Kᵀ → Softmax → ×V', SRAM_CX - 18, chamberBot + 36, 28, COSMOS.ink, 'mono').opacity(0.94 * a),
            txt(`ACTIVE TILE (Q${tileR}, K${tileC})   ·   19 TB/s SRAM   ·   92% UTIL   ·   0 HBM WRITES`, 0, 355, 26, COSMOS.gold, 'mono')
                .glow(6, COSMOS.gold)
                .opacity(a),
        ]

        // Mini 4x4 active tile index matrix indicator on the right edge of SRAM chamber
        const miniX = tileRight + 60
        const miniY = SRAM_CY - 30
        for (let r = 0; r < 4; r++) {
            for (let col = 0; col < 4; col++) {
                const isAct = r + 1 === tileR && col + 1 === tileC
                const isDone = r + 1 < tileR || (r + 1 === tileR && col + 1 < tileC)
                nodes.push(
                    rect(14, 14, {
                        fill: isAct ? COSMOS.gold : isDone ? COSMOS.cyan : '#1c2844',
                        stroke: isAct ? '#ffffff' : null,
                        width: 1.2,
                        radius: 2.5,
                    }).at(miniX + (col - 1.5) * 18, miniY + (r - 1.5) * 18).opacity((isAct ? 1 : isDone ? 0.65 : 0.45) * a),
                )
            }
        }
        nodes.push(txt('Br×Bc', miniX, miniY + 56, 26, COSMOS.cyan, 'mono').opacity(0.9 * a))

        return group(...nodes)
    })

    s.add(liveStarve, shot1Copy, liveBlaze)
    c.at(0.05, () => s.play(busFlow.to(6.5, { duration: 11.5, ease: linear })))

    c.on('shatters that memory wall', () => {
        s.play(par(
            showStarve.to(0, { duration: 0.28 }),
            showBlaze.to(1, { duration: 0.35 }),
            blazePhase.to(3.2, { duration: 4.0, ease: linear }),
        ))
    })
    c.swap('shatters that memory wall', shot1Copy, shot2Caption)
}

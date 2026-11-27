import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, radialGradient, rect,
    type SceneFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const TRACK_LEFT = -830
const TRACK_RIGHT = 520
const TOP_Y = -175
const BUS_Y = 18
const BOT_Y = 205
const TOK_SPACING = 114
const TOK_W = 100
const TOK_H = 56

// Real readable sentence tokens instead of generic w1..w10 boxes
const TOKENS = [
    'The', 'quick', 'brown', 'fox', 'jumps',
    'over', 'the', 'lazy', 'dog', '.',
    'Fast', 'AI', 'reads', 'in', 'bursts',
] as const

export const hook: SceneFunction = (s, c) => {
    const race = s.value(0)

    const headline = group(
        txt('KV CACHE & SPECULATIVE DECODING', 0, -430, 26, COSMOS.gold, 'mono'),
        txt('One token per memory pass  vs  five verified in one flash', 0, -362, 52, COSMOS.ink, 'serif').glow(5, '#90b4ff'),
    )

    const liveRace = dynamic(() => {
        const t = race.value // runs 0 -> 2.85 cycles
        const nodes: Node[] = []

        // ── TOP LANE: Standard Autoregressive Decoding (1 slow heavy 140 GB HBM pass per token) ──
        const autoCount = Math.min(4, Math.floor(t * 1.15) + 1)
        const autoPhase = (t * 1.15) % 1
        const autoWaveX = TRACK_LEFT + autoPhase * (TRACK_RIGHT - TRACK_LEFT)

        nodes.push(
            txt('AUTOREGRESSIVE  (70B Target Only)', TRACK_LEFT, TOP_Y - 82, 28, COSMOS.amber, 'mono', 'left'),
            txt(`Pass #${autoCount}  →  1 token / HBM read`, 845, TOP_Y - 82, 26, COSMOS.muted, 'sans', 'right'),
            // Lane rail + glowing crimson/amber HBM weight-streaming wave band
            rect(TRACK_RIGHT - TRACK_LEFT, 74, {
                fill: '#140f1d',
                stroke: '#2e2742',
                width: 1.6,
                radius: 14,
            }).at((TRACK_LEFT + TRACK_RIGHT) * 0.5, TOP_Y),
            // Heavy HBM weight-streaming wave crest sweeping across the top lane
            rect(180, 68, {
                fill: linearGradient([autoWaveX - 90, TOP_Y], [autoWaveX + 90, TOP_Y], ['#fb923c00', '#fb923c55', '#ff6b8b88', '#fb923c00']),
                stroke: null,
                radius: 12,
            }).at(autoWaveX, TOP_Y).opacity(0.85).set('blend', 'screen'),
            line([autoWaveX, TOP_Y - 40], [autoWaveX, TOP_Y + 40], { stroke: COSMOS.amber, width: 3.6 })
                .glow(12, COSMOS.amber).opacity(0.8).set('blend', 'screen'),
        )

        for (let i = 0; i < autoCount; i++) {
            const tx = TRACK_LEFT + 58 + i * TOK_SPACING
            const isActive = i === autoCount - 1
            const op = isActive ? Math.min(1, autoPhase * 2.2) : 0.92
            nodes.push(
                rect(TOK_W, TOK_H, { fill: '#1b1628', stroke: COSMOS.amber, width: isActive ? 3.6 : 2.2, radius: 12 })
                    .at(tx, TOP_Y).opacity(op).glow(isActive ? 12 : 4, COSMOS.amber),
                txt(TOKENS[i]!, tx, TOP_Y, 27, COSMOS.amber, 'mono').opacity(op),
            )
        }
        const autoHeadX = TRACK_LEFT + 58 + (autoCount - 1) * TOK_SPACING
        nodes.push(
            circle(22 + autoPhase * 54, { fill: null, stroke: COSMOS.amber, width: 2.2 })
                .at(autoHeadX, TOP_Y).opacity((1 - autoPhase) * 0.65).set('blend', 'screen'),
            txt(`${Math.round(45 + t * 8)} tok/s`, 845, TOP_Y, 46, COSMOS.amber, 'mono', 'right')
                .glow(6, COSMOS.amber),
            txt('140 GB streamed for 1 word', TRACK_LEFT, TOP_Y + 62, 26, COSMOS.rose, 'sans', 'left'),
        )

        // ── MIDDLE SHARED HBM WEIGHT-STREAMING BUS (eliminates empty middle canyon!) ──
        const busPulse = (t * 0.85) % 1
        nodes.push(
            rect(1675, 58, {
                fill: '#0e1426',
                stroke: '#2b3b62',
                width: 1.8,
                radius: 14,
            }).at(8, BUS_Y),
            txt('HBM WEIGHT STREAM  ·  140 GB (70B FP16)  =  SAME MEMORY COST PER PASS', 8, BUS_Y, 26, COSMOS.gold, 'mono')
                .glow(4, COSMOS.gold),
        )
        // Animated HBM data packets flowing along top & bottom edges of the bus
        for (let k = 0; k < 8; k++) {
            const u = (busPulse + k / 8) % 1
            const px = -800 + u * 1615
            nodes.push(
                dot(4.5, k % 2 === 0 ? COSMOS.cyan : COSMOS.gold)
                    .at(px, BUS_Y + (k % 2 === 0 ? 27 : -27))
                    .glow(9, k % 2 === 0 ? COSMOS.cyan : COSMOS.gold)
                    .set('blend', 'screen'),
            )
        }

        // ── BOTTOM LANE: Speculative Decoding (5 cyan draft bursts -> 1 golden parallel verify shockwave!) ──
        const cycleIdx = Math.min(1, Math.floor(t * 0.72))
        const cycFrac = Math.min(0.999, (t * 0.72) - Math.floor(t * 0.72))
        const committedBefore = cycleIdx * 5
        // Three cleanly separated phases so caption NEVER disagrees with token colors:
        //   0.00 .. 0.48 : Drafting 5 cyan candidates (7B draft model)
        //   0.48 .. 0.84 : Parallel 70B golden HBM shockwave verifying all 5 simultaneously
        //   0.84 .. 1.00 : All 5 committed in emerald
        const isDrafting = cycFrac < 0.48
        const isVerifying = cycFrac >= 0.48 && cycFrac < 0.84
        const draftVisible = isDrafting ? Math.min(5, Math.floor((cycFrac / 0.48) * 5) + 1) : 5
        const verifyProg = isVerifying ? (cycFrac - 0.48) / 0.36 : cycFrac >= 0.84 ? 1 : 0
        const verifiedInBurst = isVerifying ? Math.floor(verifyProg * 5 + 0.3) : cycFrac >= 0.84 ? 5 : 0
        const totalOut = committedBefore + verifiedInBurst

        const burstStartX = TRACK_LEFT + 58 + committedBefore * TOK_SPACING
        const burstEndX = burstStartX + 4 * TOK_SPACING
        const scanX = burstStartX - 50 + verifyProg * (4 * TOK_SPACING + 100)

        nodes.push(
            circle(440, {
                fill: radialGradient([0, 0], 440, [
                    [0, isVerifying ? '#ffd16634' : '#5ce1e622'],
                    [0.55, '#07091000'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at((burstStartX + burstEndX) * 0.5, BOT_Y).set('blend', 'screen'),
            txt('SPECULATIVE DECODING  (Draft 7B + Parallel Target 70B)', TRACK_LEFT, BOT_Y - 82, 28, COSMOS.cyan, 'mono', 'left'),
            txt(`Pass #${cycleIdx + (verifyProg > 0.1 ? 1 : 0)}  →  5 tokens / HBM read`, 845, BOT_Y - 82, 26, COSMOS.emerald, 'sans', 'right'),
            rect(TRACK_RIGHT - TRACK_LEFT, 74, {
                fill: '#0e1726',
                stroke: '#284064',
                width: 1.6,
                radius: 14,
            }).at((TRACK_LEFT + TRACK_RIGHT) * 0.5, BOT_Y),
        )

        // Already committed tokens from previous cycle (glowing emerald)
        for (let i = 0; i < committedBefore; i++) {
            const tx = TRACK_LEFT + 58 + i * TOK_SPACING
            nodes.push(
                rect(TOK_W, TOK_H, { fill: '#102428', stroke: COSMOS.emerald, width: 2.5, radius: 12 })
                    .at(tx, BOT_Y).glow(6, COSMOS.emerald),
                txt(TOKENS[i]!, tx, BOT_Y, 27, COSMOS.emerald, 'mono'),
            )
        }

        // Active 5-token draft burst
        for (let j = 0; j < draftVisible; j++) {
            const idx = committedBefore + j
            const tx = TRACK_LEFT + 58 + idx * TOK_SPACING
            const verified = !isDrafting && (cycFrac >= 0.84 || scanX >= tx)
            const col = verified ? COSMOS.emerald : COSMOS.cyan
            nodes.push(
                rect(TOK_W, TOK_H, { fill: verified ? '#10262a' : '#101d32', stroke: col, width: verified ? 3.6 : 2.8, radius: 12 })
                    .at(tx, BOT_Y).glow(verified ? 13 : 8, col),
                txt(TOKENS[idx]!, tx, BOT_Y, 27, col, 'mono'),
            )
            // Radiant impact ring on each token as the golden verification wave crosses it
            if (isVerifying && Math.abs(scanX - tx) < 75) {
                const hit = 1 - Math.abs(scanX - tx) / 75
                nodes.push(
                    circle(26 + (1 - hit) * 44, { fill: null, stroke: COSMOS.gold, width: 3.0 })
                        .at(tx, BOT_Y).opacity(hit * 0.9).glow(12, COSMOS.gold).set('blend', 'screen'),
                )
            }
        }

        // Massive golden parallel verification shockwave sweeping all 5 candidate tokens at once!
        if (isVerifying) {
            const flashOp = Math.sin(verifyProg * Math.PI)
            nodes.push(
                rect(220, 88, {
                    fill: linearGradient([scanX - 110, BOT_Y], [scanX + 110, BOT_Y], ['#ffd16600', '#ffd16677', '#ffffff99', '#ffd16600']),
                    stroke: null,
                    radius: 16,
                }).at(scanX, BOT_Y).opacity(flashOp * 0.92).set('blend', 'screen'),
                line([scanX, BOT_Y - 54], [scanX, BOT_Y + 54], { stroke: COSMOS.gold, width: 6.5 })
                    .glow(18, COSMOS.gold).opacity(flashOp).set('blend', 'screen'),
                dot(10, '#ffffff').at(scanX, BOT_Y).glow(20, COSMOS.gold).opacity(flashOp).set('blend', 'screen'),
                txt('70B VERIFY  ×5', TRACK_LEFT, BOT_Y + 78, 28, COSMOS.gold, 'mono', 'left')
                    .glow(8, COSMOS.gold),
            )
        } else if (isDrafting) {
            nodes.push(
                txt('7B DRAFT  ×5', TRACK_LEFT, BOT_Y + 78, 28, COSMOS.cyan, 'mono', 'left')
                    .glow(5, COSMOS.cyan),
            )
        } else {
            nodes.push(
                txt('5 ACCEPTED  ·  1 PASS', TRACK_LEFT, BOT_Y + 78, 28, COSMOS.emerald, 'mono', 'left')
                    .glow(6, COSMOS.emerald),
            )
        }

        const speedNum = Math.min(1040, Math.round(220 + t * 290))
        nodes.push(
            txt(`${speedNum.toLocaleString('en-US')} tok/s`, 845, BOT_Y, 48, COSMOS.gold, 'mono', 'right')
                .glow(10, COSMOS.gold),
            txt(`${Math.max(1, totalOut)} tokens verified  ·  4× faster  ·  exact 70B output`, 0, 388, 32, COSMOS.emerald, 'sans').glow(5, COSMOS.emerald),
        )

        return group(...nodes)
    })

    s.add(headline, liveRace)
    const raceDur = Math.max(4.0, c.end - c.start - 0.5)
    c.at(0.1, () => s.play(race.to(2.85, { duration: raceDur, ease: linear })))
}

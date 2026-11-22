import {
    Node, circle, dot, dynamic, group, line, linear, radialGradient, rect,
    type SceneFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

const TRACK_LEFT = -810
const TRACK_RIGHT = 430
const TOP_Y = -145
const BOT_Y = 185
const TOK_SPACING = 76

export const hook: SceneFunction = (s, c) => {
    const race = s.value(0)

    const headline = group(
        txt('KV CACHE & SPECULATIVE DECODING', 0, -420, 26, COSMOS.gold, 'mono'),
        txt('One token per pass  vs  five verified in a single flash', 0, -352, 54, COSMOS.ink, 'serif').glow(5, '#90b4ff'),
    )

    const liveRace = dynamic(() => {
        const t = race.value // runs 0 -> 3.0 cycles
        const nodes: Node[] = []

        // ── TOP LANE: Standard Autoregressive Decoding (1 slow gold token per cycle) ──
        const autoCount = Math.min(4, Math.floor(t * 1.15) + 1)
        const autoPhase = (t * 1.15) % 1
        nodes.push(
            txt('AUTOREGRESSIVE  (70B Target Only)', TRACK_LEFT, TOP_Y - 82, 28, COSMOS.amber, 'mono', 'left'),
            txt('1 token / memory pass', 835, TOP_Y - 82, 26, COSMOS.muted, 'sans', 'right'),
            line([TRACK_LEFT, TOP_Y + 42], [TRACK_RIGHT, TOP_Y + 42], { stroke: '#273454', width: 2.4 }),
        )

        for (let i = 0; i < autoCount; i++) {
            const tx = TRACK_LEFT + 38 + i * TOK_SPACING
            const isActive = i === autoCount - 1
            const op = isActive ? Math.min(1, autoPhase * 2.2) : 0.85
            nodes.push(
                rect(64, 54, { fill: '#171d32', stroke: COSMOS.amber, width: isActive ? 3.4 : 2.2, radius: 12 })
                    .at(tx, TOP_Y).opacity(op).glow(isActive ? 10 : 4, COSMOS.amber),
                txt(`w${i + 1}`, tx, TOP_Y, 26, COSMOS.amber, 'mono').opacity(op),
            )
        }
        const autoHeadX = TRACK_LEFT + 38 + (autoCount - 1) * TOK_SPACING
        nodes.push(
            circle(22 + autoPhase * 52, { fill: null, stroke: COSMOS.amber, width: 2 })
                .at(autoHeadX, TOP_Y).opacity((1 - autoPhase) * 0.55),
            txt(`${Math.round(45 + t * 8)} tok/s`, 835, TOP_Y, 44, COSMOS.amber, 'mono', 'right')
                .glow(5, COSMOS.amber),
        )

        // ── BOTTOM LANE: Speculative Decoding (5 cyan draft bursts -> 1 gold parallel verify flash!) ──
        const cycleIdx = Math.min(2, Math.floor(t))
        const cycFrac = Math.min(0.999, t - Math.floor(t))
        const committedBefore = cycleIdx * 5
        // First 55% of each cycle: nimble cyan draft fires 5 tokens rapidly;
        // 55%..100%: massive gold target sweeps all 5 in ONE parallel flash!
        const draftVisible = Math.min(5, Math.floor((cycFrac / 0.55) * 5) + 1)
        const verifyProg = Math.max(0, Math.min(1, (cycFrac - 0.52) / 0.34))
        const totalOut = committedBefore + (verifyProg > 0.7 ? 5 : 0)

        nodes.push(
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, verifyProg > 0.05 ? '#ffd1662c' : '#5ce1e61c'],
                    [0.55, '#07091000'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(TRACK_LEFT + (committedBefore + 2.5) * TOK_SPACING, BOT_Y),
            txt('SPECULATIVE DECODING  (Draft 7B + Parallel Target 70B)', TRACK_LEFT, BOT_Y - 86, 28, COSMOS.cyan, 'mono', 'left'),
            txt('5 tokens / memory pass', 835, BOT_Y - 86, 26, COSMOS.emerald, 'sans', 'right'),
            line([TRACK_LEFT, BOT_Y + 42], [TRACK_RIGHT, BOT_Y + 42], { stroke: '#273454', width: 2.4 }),
        )

        // Already committed bursts from previous cycles (glowing emerald)
        for (let i = 0; i < committedBefore; i++) {
            const tx = TRACK_LEFT + 38 + i * TOK_SPACING
            nodes.push(
                rect(64, 54, { fill: '#111d28', stroke: COSMOS.emerald, width: 2.4, radius: 12 })
                    .at(tx, BOT_Y).glow(5, COSMOS.emerald),
                txt(`w${i + 1}`, tx, BOT_Y, 26, COSMOS.emerald, 'mono'),
            )
        }

        // Active 5-token draft burst
        const burstStartX = TRACK_LEFT + 38 + committedBefore * TOK_SPACING
        const burstEndX = burstStartX + 4 * TOK_SPACING
        const scanX = burstStartX - 34 + verifyProg * (4 * TOK_SPACING + 68)

        for (let j = 0; j < draftVisible; j++) {
            const idx = committedBefore + j
            const tx = TRACK_LEFT + 38 + idx * TOK_SPACING
            const verified = verifyProg > 0.05 && scanX >= tx
            const col = verified ? COSMOS.emerald : COSMOS.cyan
            nodes.push(
                rect(64, 54, { fill: '#111626', stroke: col, width: verified ? 3.5 : 2.8, radius: 12 })
                    .at(tx, BOT_Y).glow(verified ? 12 : 7, col),
                txt(`w${idx + 1}`, tx, BOT_Y, 26, col, 'mono'),
            )
        }

        // Golden parallel verification laser flash sweeping all 5 candidate tokens at once!
        if (verifyProg > 0.02 && verifyProg < 0.98) {
            const flashOp = Math.sin(verifyProg * Math.PI)
            nodes.push(
                line([scanX, BOT_Y - 96], [scanX, BOT_Y + 96], { stroke: COSMOS.gold, width: 6 })
                    .glow(16, COSMOS.gold).opacity(flashOp),
                dot(9, '#ffffff').at(scanX, BOT_Y).glow(18, COSMOS.gold).opacity(flashOp),
                txt('PARALLEL VERIFY  ×5', (burstStartX + burstEndX) * 0.5, BOT_Y + 86, 28, COSMOS.gold, 'mono')
                    .glow(8, COSMOS.gold).opacity(flashOp),
            )
        } else {
            nodes.push(
                txt('Nimble draft firing 5 candidates...', Math.min(200, burstStartX + 150), BOT_Y + 86, 28, COSMOS.cyan, 'sans'),
            )
        }

        const speedNum = Math.min(1040, Math.round(180 + t * 290))
        nodes.push(
            txt(`${speedNum.toLocaleString('en-US')} tok/s`, 835, BOT_Y, 48, COSMOS.gold, 'mono', 'right')
                .glow(10, COSMOS.gold),
            txt(`${totalOut} tokens verified  ·  4× faster`, 0, 395, 34, COSMOS.emerald, 'sans').glow(5, COSMOS.emerald),
        )

        return group(...nodes)
    })

    s.add(headline, liveRace)
    const raceDur = Math.max(4.0, c.end - c.start - 0.5)
    c.at(0.1, () => s.play(race.to(2.95, { duration: raceDur, ease: linear })))
}

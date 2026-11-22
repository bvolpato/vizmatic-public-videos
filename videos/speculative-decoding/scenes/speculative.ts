import {
    Node, circle, dot, dynamic, group, line, linear, par, radialGradient, rect, tex,
    type SceneFunction,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { DEMO_DRAFT_Q, DEMO_TARGET_P, DEMO_VOCAB } from '../math'

// 5-token speculative burst: 4 accepted in emerald, 5th rejected in rose -> bonus token resampled!
const STREAK_TOKENS = [
    { word: '"the"', p: 0.42, q: 0.38, accept: true },
    { word: '"fast"', p: 0.51, q: 0.46, accept: true },
    { word: '"clock"', p: 0.39, q: 0.41, accept: true },
    { word: '"spins"', p: 0.48, q: 0.44, accept: true },
    { word: '"wave"', p: 0.06, q: 0.22, accept: false },
] as const

// Discrete vertical probability bar/stem chart layout over the 8-token vocabulary
const CHART_LEFT = -740
const CHART_RIGHT = 740
const CHART_BASE_Y = 235
const CHART_SCALE = 1120 // 0.31 -> 347 px tall (peaks cleanly around y = -112)
const BAR_W = 86

export const speculative: SceneFunction = (s, c) => {
    const streakProg = s.value(0)
    const showStreak = s.value(1)
    const showMath = s.value(0)
    const sampleProg = s.value(0)

    // ── Shot 1: 5-token draft burst + single parallel target verify (4 accepted + 1 resampled!) ──
    const streakTitle = group(
        txt('FREE PARALLEL VERIFICATION', 0, -415, 26, COSMOS.cyan, 'mono'),
        txt('Draft 5 candidates — verify all 5 in ONE forward pass', 0, -348, 54, COSMOS.ink, 'serif').glow(5, '#38bdf8'),
    )

    const liveStreak = dynamic(() => {
        if (showStreak.value < 0.02) return []
        const a = showStreak.value
        const prog = streakProg.value
        const nodes: Node[] = []
        const x0 = -600
        const step = 300
        const cy = -45

        const draftCount = Math.min(5, Math.floor((prog / 0.42) * 5) + 1)
        const verifyU = Math.max(0, Math.min(1, (prog - 0.44) / 0.36))
        const scanX = x0 - 110 + verifyU * (4 * step + 220)
        const bonusU = Math.max(0, Math.min(1, (prog - 0.82) / 0.16))

        nodes.push(
            line([x0 - 120, cy], [x0 + 4 * step + 120, cy], { stroke: '#25314f', width: 2.2 }).opacity(a),
        )

        for (let i = 0; i < draftCount; i++) {
            const tok = STREAK_TOKENS[i]!
            const tx = x0 + i * step
            const checked = verifyU > 0.02 && scanX >= tx
            const col = !checked ? COSMOS.cyan : tok.accept ? COSMOS.emerald : COSMOS.rose
            const status = !checked ? `q=${tok.q.toFixed(2)}` : tok.accept ? 'ACCEPT' : 'REJECT'

            nodes.push(
                rect(224, 108, { fill: '#111626', stroke: col, width: checked ? 3.8 : 2.6, radius: 16 })
                    .at(tx, cy).opacity(a).glow(checked ? 12 : 6, col),
                txt(tok.word, tx, cy - 12, 34, COSMOS.ink, 'mono').opacity(a),
                txt(status, tx, cy + 30, 26, col, 'mono').opacity(a),
                txt(`t+${i + 1}`, tx, cy - 86, 26, COSMOS.muted, 'mono').opacity(a),
            )
        }

        if (verifyU > 0.02 && verifyU < 0.98) {
            const op = Math.sin(verifyU * Math.PI) * a
            nodes.push(
                line([scanX, cy - 175], [scanX, cy + 175], { stroke: COSMOS.gold, width: 6.5 })
                    .glow(18, COSMOS.gold).opacity(op).set('blend', 'screen'),
                dot(10, '#ffffff').at(scanX, cy).glow(20, COSMOS.gold).opacity(op).set('blend', 'screen'),
            )
        }

        if (bonusU >= 0.02) {
            const bx = x0 + 4 * step
            const by = cy + 195
            nodes.push(
                line([bx, cy + 56], [bx, by - 56], { stroke: COSMOS.gold, width: 3.4 })
                    .glow(8, COSMOS.gold).opacity(bonusU * a).set('blend', 'screen'),
                rect(236, 98, { fill: '#1a152c', stroke: COSMOS.gold, width: 3.8, radius: 16 })
                    .at(bx, by).opacity(bonusU * a).glow(14, COSMOS.gold),
                txt('"speed"', bx, by - 12, 34, COSMOS.gold, 'mono').opacity(bonusU * a),
                txt('+ BONUS TOKEN', bx, by + 28, 26, COSMOS.violet, 'mono').opacity(bonusU * a),
                txt('4 accepted + 1 exact bonus = 5 tokens in ONE target pass!', -240, by, 32, COSMOS.emerald, 'sans')
                    .glow(5, COSMOS.emerald).opacity(bonusU * a),
            )
        } else {
            nodes.push(
                txt('Same HBM bandwidth cost as verifying 1 single token', 0, 225, 32, COSMOS.muted, 'sans').opacity(a),
            )
        }

        return group(...nodes)
    })

    // ── Shot 2: Exact Mathematical Rejection Sampling — Discrete Probability Bars & Residual Stems ──
    const mathHeader = group(
        txt('EXACT REJECTION SAMPLING PROOF', -855, -432, 26, COSMOS.gold, 'mono', 'left'),
        tex(String.raw`\alpha(x) = \min\!\left(1,\; \frac{p(x)}{q(x)}\right)`, { size: 36, color: COSMOS.cyan })
            .at(-585, -332).glow(6, COSMOS.cyan),
        tex(String.raw`P_{\text{spec}}(x) = q(x)\alpha(x) + (1-\beta)\,\mathrm{norm}\!\left(\max(0, p-q)\right) \equiv p(x)`, {
            size: 31,
            color: COSMOS.gold,
        }).at(285, -332).glow(7, COSMOS.gold),
        // Crisp LaTeX verified proof footer (eliminates raw P_spec underscore bug!)
        txt('Verified across vocab:', -455, 376, 28, COSMOS.muted, 'sans', 'right'),
        tex(String.raw`\max_x \left|P_{\text{spec}}(x) - p(x)\right| < 10^{-12}`, {
            size: 34,
            color: COSMOS.emerald,
        }).at(10, 376).glow(6, COSMOS.emerald),
        txt('(exact!)', 475, 376, 28, COSMOS.gold, 'mono', 'left').glow(5, COSMOS.gold),
    )

    const liveBars = dynamic(() => {
        if (showMath.value < 0.02) return []
        const a = showMath.value
        const sp = sampleProg.value
        const bonusIdx = 2 // "speed": p = 0.31, q = 0.18 -> largest residual max(0, p - q) = +0.13!
        const bonusX = CHART_LEFT + (bonusIdx / (DEMO_VOCAB.length - 1)) * (CHART_RIGHT - CHART_LEFT)
        const bonusTopY = CHART_BASE_Y - DEMO_TARGET_P[bonusIdx]! * CHART_SCALE
        const pulse = (sp * 2.5) % 1
        const residReveal = Math.min(1, sp * 1.9)

        const nodes: Node[] = [
            // Soft violet-gold aura behind the bonus residual column
            circle(360, {
                fill: radialGradient([0, 0], 360, [
                    [0, '#a78bfa2c'],
                    [0.5, '#ffd16616'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(bonusX, bonusTopY + 70).opacity(a).set('blend', 'screen'),
            // Subtle horizontal probability gridlines (0.10, 0.20, 0.30)
            ...[0.1, 0.2, 0.3].flatMap((pTick) => {
                const gy = CHART_BASE_Y - pTick * CHART_SCALE
                return [
                    line([CHART_LEFT - 68, gy], [CHART_RIGHT + 68, gy], { stroke: '#1d2948', width: 1.4, dash: [5, 7] }).opacity(0.8 * a),
                    txt(pTick.toFixed(2), CHART_LEFT - 86, gy, 26, COSMOS.dim, 'mono', 'right').opacity(a),
                ]
            }),
            // Baseline
            line([CHART_LEFT - 68, CHART_BASE_Y], [CHART_RIGHT + 68, CHART_BASE_Y], { stroke: '#445784', width: 2.4 }).opacity(a),
            // Color-matched legend cleanly floating on upper right
            line([405, -182], [445, -182], { stroke: COSMOS.gold, width: 4.5 }).glow(8, COSMOS.gold).opacity(a),
            txt('Target p(x) (70B)', 462, -182, 26, COSMOS.gold, 'mono', 'left').opacity(a),
            line([405, -142], [445, -142], { stroke: COSMOS.cyan, width: 4.0 }).glow(6, COSMOS.cyan).opacity(a),
            txt('Draft q(x) (7B)', 462, -142, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
            rect(26, 20, { fill: '#6ee7b744', stroke: COSMOS.emerald, width: 2.2, radius: 4 }).at(425, -102).opacity(a),
            txt('Accepted min(p, q)', 462, -102, 26, COSMOS.emerald, 'mono', 'left').opacity(a),
            rect(26, 20, { fill: '#a78bfa66', stroke: COSMOS.violet, width: 2.2, radius: 4 }).at(425, -62).opacity(a),
            txt('Residual max(0, p−q)', 462, -62, 26, COSMOS.violet, 'mono', 'left').opacity(a),
        ]

        // Render discrete vertical probability bars/stems for EVERY vocabulary token
        for (let i = 0; i < DEMO_VOCAB.length; i++) {
            const u = i / (DEMO_VOCAB.length - 1)
            const x = CHART_LEFT + u * (CHART_RIGHT - CHART_LEFT)
            const pVal = DEMO_TARGET_P[i]!
            const qVal = DEMO_DRAFT_Q[i]!
            const accVal = Math.min(pVal, qVal)
            const resVal = Math.max(0, pVal - qVal)
            const overQ = Math.max(0, qVal - pVal)

            const pY = CHART_BASE_Y - pVal * CHART_SCALE
            const qY = CHART_BASE_Y - qVal * CHART_SCALE
            const accH = accVal * CHART_SCALE
            const resH = resVal * CHART_SCALE
            const overH = overQ * CHART_SCALE
            const isBonus = i === bonusIdx

            // 1. Shaded emerald accepted overlap bar: [0 .. min(p, q)]
            if (accH > 2) {
                nodes.push(
                    rect(BAR_W, accH, {
                        fill: '#6ee7b738',
                        stroke: COSMOS.emerald,
                        width: 2.2,
                        radius: 6,
                    }).at(x, CHART_BASE_Y - accH * 0.5).opacity(0.95 * a).glow(6, COSMOS.emerald),
                )
            }

            // 2. Luminous violet residual bar when p(x) > q(x): [q .. p]
            if (resH > 2) {
                const effResH = resH * residReveal
                nodes.push(
                    rect(BAR_W, effResH, {
                        fill: isBonus ? '#a78bfa78' : '#a78bfa48',
                        stroke: COSMOS.violet,
                        width: isBonus ? 3.2 : 2.2,
                        radius: 6,
                    }).at(x, qY - effResH * 0.5).opacity(a).glow(isBonus ? 14 : 8, COSMOS.violet).set('blend', 'screen'),
                )
            }

            // 3. Subtle translucent cyan draft-overshoot cap when q(x) > p(x): [p .. q]
            if (overH > 2) {
                nodes.push(
                    rect(BAR_W, overH, {
                        fill: '#5ce1e61c',
                        stroke: COSMOS.cyan,
                        width: 1.8,
                        dash: [5, 5],
                        radius: 6,
                    }).at(x, pY - overH * 0.5).opacity(0.82 * a),
                )
            }

            // 4. Crisp vertical stem centerline + golden p(x) top cap + cyan q(x) marker
            nodes.push(
                line([x - BAR_W * 0.56, pY], [x + BAR_W * 0.56, pY], {
                    stroke: COSMOS.gold,
                    width: isBonus ? 4.8 : 3.6,
                }).glow(isBonus ? 12 : 7, COSMOS.gold).opacity(a).set('blend', 'screen'),
                dot(isBonus ? 8.5 : 5.5, isBonus ? '#ffffff' : COSMOS.gold)
                    .at(x, pY).glow(isBonus ? 16 : 8, COSMOS.gold).opacity(a).set('blend', 'screen'),
                line([x - BAR_W * 0.44, qY], [x + BAR_W * 0.44, qY], {
                    stroke: COSMOS.cyan,
                    width: 2.8,
                }).glow(6, COSMOS.cyan).opacity(0.92 * a),
                dot(4.8, COSMOS.cyan).at(x, qY).glow(6, COSMOS.cyan).opacity(a),
                // Token vocabulary label below axis
                txt(DEMO_VOCAB[i]!, x, CHART_BASE_Y + 38, 26, isBonus ? COSMOS.gold : COSMOS.muted, 'mono').opacity(a),
            )
        }

        // Highlight the resampled bonus token peak ("speed") cleanly above its bar
        if (sp > 0.25) {
            const bOp = Math.min(1, (sp - 0.25) * 2.5) * a
            nodes.push(
                circle(18 + pulse * 58, { fill: null, stroke: COSMOS.gold, width: 2.8 })
                    .at(bonusX, bonusTopY).opacity((1 - pulse) * 0.88 * bOp).glow(10, COSMOS.gold).set('blend', 'screen'),
                txt('Bonus draw (+0.13 residual)', bonusX, bonusTopY - 62, 27, COSMOS.violet, 'sans')
                    .glow(6, COSMOS.violet).opacity(bOp),
            )
        }

        return group(...nodes)
    })

    s.add(liveStreak, streakTitle)
    const streakDur = Math.max(4.0, c.cue('mathematical proof').start - c.start - 0.45)
    c.at(0.15, () => s.play(streakProg.to(1, { duration: streakDur, ease: linear })))

    const mathDur = Math.max(4.0, c.end - c.cue('mathematical proof').start - 0.6)
    c.on('mathematical proof', () => {
        s.play(par(
            showStreak.to(0, { duration: 0.25 }),
            showMath.to(1, { duration: 0.35 }),
            sampleProg.to(1, { duration: mathDur, ease: linear }),
        ))
    })
    c.swap('mathematical proof', streakTitle, mathHeader)
    s.add(liveBars)
}

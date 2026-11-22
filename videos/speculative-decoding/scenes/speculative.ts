import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, par, polyPath, polygon, radialGradient, rect, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { DEMO_DRAFT_Q, DEMO_SPEC, DEMO_TARGET_P, DEMO_VOCAB } from '../math'

// 5-token speculative burst: 4 accepted in emerald, 5th rejected in rose -> bonus token resampled!
const STREAK_TOKENS = [
    { word: '"the"', p: 0.42, q: 0.38, accept: true },
    { word: '"fast"', p: 0.51, q: 0.46, accept: true },
    { word: '"clock"', p: 0.39, q: 0.41, accept: true },
    { word: '"spins"', p: 0.48, q: 0.44, accept: true },
    { word: '"wave"', p: 0.06, q: 0.22, accept: false },
] as const

// Smooth probability wave sampler over the 8-token vocabulary (Catmull-like cosine interpolation)
const WAVE_LEFT = -760
const WAVE_RIGHT = 760
const WAVE_BASE_Y = 230
const WAVE_HEIGHT = 760
const WAVE_PTS_N = 140

function evalDistWave(arr: readonly number[], u: number): number {
    const pos = u * (arr.length - 1)
    const i0 = Math.max(0, Math.min(arr.length - 2, Math.floor(pos)))
    const f = pos - i0
    const s = 0.5 - 0.5 * Math.cos(f * Math.PI)
    return arr[i0]! * (1 - s) + arr[i0 + 1]! * s
}

const TARGET_WAVE: Vec[] = Array.from({ length: WAVE_PTS_N }, (_, i) => {
    const u = i / (WAVE_PTS_N - 1)
    return [WAVE_LEFT + u * (WAVE_RIGHT - WAVE_LEFT), WAVE_BASE_Y - evalDistWave(DEMO_TARGET_P, u) * WAVE_HEIGHT]
})
const DRAFT_WAVE: Vec[] = Array.from({ length: WAVE_PTS_N }, (_, i) => {
    const u = i / (WAVE_PTS_N - 1)
    return [WAVE_LEFT + u * (WAVE_RIGHT - WAVE_LEFT), WAVE_BASE_Y - evalDistWave(DEMO_DRAFT_Q, u) * WAVE_HEIGHT]
})

// Residual positive area polygon where p(x) > q(x)
const RESIDUAL_POLY: Vec[] = (() => {
    const upper: Vec[] = []
    const lower: Vec[] = []
    for (let i = 0; i < WAVE_PTS_N; i++) {
        const u = i / (WAVE_PTS_N - 1)
        const x = WAVE_LEFT + u * (WAVE_RIGHT - WAVE_LEFT)
        const pv = evalDistWave(DEMO_TARGET_P, u)
        const qv = evalDistWave(DEMO_DRAFT_Q, u)
        upper.push([x, WAVE_BASE_Y - Math.max(pv, qv) * WAVE_HEIGHT])
        lower.push([x, WAVE_BASE_Y - qv * WAVE_HEIGHT])
    }
    return [...upper, ...lower.reverse()]
})()

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
        const prog = streakProg.value // 0..1: 0..0.45 draft arrives, 0.45..0.82 verify sweeps, 0.82..1.0 bonus token
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

        // Parallel golden verification beam sweeping across all 5 tokens simultaneously
        if (verifyU > 0.02 && verifyU < 0.98) {
            const op = Math.sin(verifyU * Math.PI) * a
            nodes.push(
                line([scanX, cy - 175], [scanX, cy + 175], { stroke: COSMOS.gold, width: 6 })
                    .glow(16, COSMOS.gold).opacity(op),
                dot(10, '#ffffff').at(scanX, cy).glow(18, COSMOS.gold).opacity(op),
            )
        }

        // Bonus token resampled cleanly from residual norm(max(0, p - q)) on slot 5!
        if (bonusU >= 0.02) {
            const bx = x0 + 4 * step
            const by = cy + 195
            nodes.push(
                line([bx, cy + 56], [bx, by - 56], { stroke: COSMOS.gold, width: 3.4 }).glow(8, COSMOS.gold).opacity(bonusU * a),
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

    // ── Shot 2: Exact Mathematical Rejection Sampling Waves p(x), q(x), and Residual norm(max(0, p-q)) ──
    const mathHeader = group(
        txt('EXACT REJECTION SAMPLING PROOF', -850, -430, 26, COSMOS.gold, 'mono', 'left'),
        tex(String.raw`\alpha(x) = \min\!\left(1,\; \frac{p(x)}{q(x)}\right)`, { size: 38, color: COSMOS.cyan })
            .at(-585, -325).glow(6, COSMOS.cyan),
        tex(String.raw`P_{\text{spec}}(x) = q(x)\alpha(x) + (1-\beta)\,\mathrm{norm}\!\left(\max(0, p-q)\right) \equiv p(x)`, {
            size: 32,
            color: COSMOS.gold,
        }).at(285, -325).glow(7, COSMOS.gold),
    )

    const liveWaves = dynamic(() => {
        if (showMath.value < 0.02) return []
        const a = showMath.value
        const sp = sampleProg.value
        const bonusIdx = 2 // "speed": highest residual p(x) - q(x) = 0.31 - 0.18 = +0.13!
        const bonusU = bonusIdx / (DEMO_VOCAB.length - 1)
        const bonusX = WAVE_LEFT + bonusU * (WAVE_RIGHT - WAVE_LEFT)
        const bonusY = WAVE_BASE_Y - DEMO_TARGET_P[bonusIdx]! * WAVE_HEIGHT
        const pulse = (sp * 2.5) % 1

        const nodes: Node[] = [
            circle(440, {
                fill: radialGradient([0, 0], 440, [
                    [0, '#a78bfa28'],
                    [0.5, '#ffd16614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(bonusX, bonusY + 40).opacity(a),
            line([WAVE_LEFT - 30, WAVE_BASE_Y], [WAVE_RIGHT + 30, WAVE_BASE_Y], { stroke: '#324268', width: 2.2 }).opacity(a),
            // Shaded glowing residual lobe max(0, p - q)
            polygon(RESIDUAL_POLY, {
                fill: linearGradient([WAVE_LEFT, WAVE_BASE_Y - 260], [WAVE_RIGHT, WAVE_BASE_Y], ['#a78bfa55', '#ffd16655']),
                stroke: null,
            }).opacity(Math.min(1, sp * 1.8) * a),
            // Draft wave q(x) in luminous cyan
            new Node(polyPath(DRAFT_WAVE)).stroke(COSMOS.cyan, 4.4, 0.92 * a).glow(8, COSMOS.cyan),
            // Target wave p(x) in blazing gold
            new Node(polyPath(TARGET_WAVE)).stroke(COSMOS.gold, 5.0, 0.98 * a).glow(10, COSMOS.gold),
            new Node(polyPath(TARGET_WAVE)).stroke('#ffffff', 1.3, 0.38 * a),
            // Legend floating cleanly above right side of curves
            txt('— Target p(x) (70B)', 560, -145, 28, COSMOS.gold, 'mono'),
            txt('— Draft q(x) (7B)', 560, -100, 28, COSMOS.cyan, 'mono'),
            txt('■ Residual max(0, p−q)', 560, -55, 28, COSMOS.violet, 'mono'),
        ]

        // Vocabulary tick labels + exact probability dots along x-axis
        for (let i = 0; i < DEMO_VOCAB.length; i++) {
            const u = i / (DEMO_VOCAB.length - 1)
            const x = WAVE_LEFT + u * (WAVE_RIGHT - WAVE_LEFT)
            const py = WAVE_BASE_Y - DEMO_TARGET_P[i]! * WAVE_HEIGHT
            const qy = WAVE_BASE_Y - DEMO_DRAFT_Q[i]! * WAVE_HEIGHT
            const isBonus = i === bonusIdx
            nodes.push(
                dot(isBonus ? 8 : 5, isBonus ? '#ffffff' : COSMOS.gold).at(x, py).glow(isBonus ? 14 : 6, COSMOS.gold).opacity(a),
                dot(5, COSMOS.cyan).at(x, qy).glow(6, COSMOS.cyan).opacity(a),
                txt(DEMO_VOCAB[i]!, x, WAVE_BASE_Y + 38, 26, isBonus ? COSMOS.gold : COSMOS.muted, 'mono').opacity(a),
            )
        }

        // Highlight the resampled bonus token peak & exact proof error readout!
        if (sp > 0.25) {
            const bOp = Math.min(1, (sp - 0.25) * 2.5) * a
            nodes.push(
                circle(18 + pulse * 62, { fill: null, stroke: COSMOS.gold, width: 2.6 })
                    .at(bonusX, bonusY).opacity((1 - pulse) * 0.85 * bOp).glow(10, COSMOS.gold),
                txt('Bonus draw from residual', bonusX, bonusY - 82, 28, COSMOS.violet, 'sans')
                    .glow(6, COSMOS.violet).opacity(bOp),
            )
        }

        nodes.push(
            txt(
                `Verified across vocab: max |P_spec(x) − p(x)| = ${DEMO_SPEC.maxErr.toExponential(1)}  (exact!)`,
                0,
                372,
                32,
                COSMOS.emerald,
                'mono',
            ).glow(6, COSMOS.emerald).opacity(a),
        )

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
    s.add(liveWaves)
}

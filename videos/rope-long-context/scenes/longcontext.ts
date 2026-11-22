import {
    Node, arc, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, rect, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { ntkScaledBase, ropeFreqs, ropeKernel, yarnFreqs } from '../math'

// 5 representative dials spanning fast local (i=0) to slow long-range (i=7)
const DIAL_XS = [-640, -320, 0, 320, 640] as const
const DIAL_Y = -105
const DIAL_R = 104
const DIAL_LABELS = ['Fast (i=0)', 'Local (i=2)', 'Mid (i=4)', 'Slow (i=6)', 'Global (i=7)'] as const
const DIAL_SUBSCRIPTS = ['θ₀', 'θ₂', 'θ₄', 'θ₆', 'θ₇'] as const
const DIAL_BASE_THEMES = [COSMOS.cyan, COSMOS.blue, COSMOS.violet, COSMOS.rose, COSMOS.amber] as const
// Distinct phase offsets & angular speeds for fast/local/mid clocks so dials 1–3 show genuine harmonic diversity!
const FAST_BASE_ANGLES = [0.55, 2.75, 4.95] as const
const FAST_SPIN_RATES = [5.1, 3.4, 2.05] as const

// Precompute 16-dim (8-pair) frequencies for base 10k vs NTK/YaRN 8x context extension (4k -> 32k)
const BASE_FREQS = ropeFreqs(16, 10_000)
const NTK_BASE = ntkScaledBase(10_000, 8, 16)
const YARN_FREQS = yarnFreqs(16, 10_000, 8, 4096)
const DIAL_INDICES = [0, 2, 4, 6, 7] as const

const WAVE_SAMPLES = 200

export const longcontext: SceneFunction = (s, c) => {
    const ctxLen = s.value(4096)
    const yarnBlend = s.value(0)

    const oodTitle = group(
        txt('OUT-OF-DISTRIBUTION PHASE COLLISIONS', 0, -412, 26, COSMOS.rose, 'mono'),
        txt('Pushing past 4k breaks the slow clocks', 0, -344, 56, COSMOS.ink, 'serif').glow(5, COSMOS.rose),
    )

    const yarnTitle = group(
        txt('NTK & YaRN FREQUENCY SCALING', 0, -412, 26, COSMOS.emerald, 'mono'),
        txt('Stretch slow clocks — keep fast clocks crisp', 0, -344, 56, COSMOS.emerald, 'serif').glow(6, COSMOS.emerald),
    )

    const yarnEq = tex(String.raw`\text{base}' = \text{base} \cdot s^{\frac{d}{d-2}}`, {
        size: 38,
        color: COSMOS.gold,
    }).at(585, 384).glow(6, COSMOS.gold)

    const liveDashboard = dynamic(() => {
        const L = ctxLen.value
        const blend = yarnBlend.value
        const overflow = Math.max(0, Math.min(1, (L - 4096) / (32768 - 4096)))
        const danger = overflow * (1 - blend)
        const nodes: Node[] = []

        // Ambient glow behind slow right-hand dials: shifts from rose danger to emerald harmony
        nodes.push(
            circle(440, {
                fill: radialGradient([0, 0], 440, [
                    [0, blend > 0.35 ? '#6ee7b724' : '#ff6b8b2c'],
                    [0.55, '#07091000'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(480, DIAL_Y).opacity(0.45 + 0.55 * Math.max(danger, blend)).set('blend', 'screen'),
        )

        // 5 clock dials across the upper canvas
        for (let k = 0; k < 5; k++) {
            const cx = DIAL_XS[k]!
            const idx = DIAL_INDICES[k]!
            const baseTheta = BASE_FREQS[idx]!
            const yarnTheta = YARN_FREQS[idx]!
            const isSlow = k >= 3

            const startAng = -Math.PI / 2
            const trainedSpan = isSlow ? (k === 3 ? 2.1 : 1.15) : Math.PI * 1.92
            let currentSpan: number
            let handAng: number
            if (isSlow) {
                const scaleFactor = 1 + overflow * 3.1
                const effectiveScale = scaleFactor * (1 - blend * 0.72)
                currentSpan = trainedSpan * effectiveScale
                handAng = startAng + currentSpan
            } else {
                // Fast/local/mid clocks wrap many times at distinct frequencies -> diverse needle angles!
                const baseOff = FAST_BASE_ANGLES[k]!
                const spinRate = FAST_SPIN_RATES[k]!
                currentSpan = baseOff + overflow * spinRate * (1 - blend * 0.06)
                handAng = startAng + currentSpan
            }

            const hx = cx + Math.cos(handAng) * (DIAL_R - 12)
            const hy = DIAL_Y + Math.sin(handAng) * (DIAL_R - 12)

            const dialCol = !isSlow
                ? DIAL_BASE_THEMES[k]!
                : blend > 0.45
                    ? COSMOS.emerald
                    : danger > 0.25
                        ? COSMOS.rose
                        : COSMOS.amber

            nodes.push(
                circle(DIAL_R, { fill: null, stroke: '#2c3b5e', width: 2.2 }).at(cx, DIAL_Y),
                // Trained safe arc
                arc(DIAL_R, startAng, startAng + trainedSpan, {
                    fill: null,
                    stroke: '#38bdf8',
                    width: 4.0,
                }).at(cx, DIAL_Y).opacity(0.68),
            )

            // Subtle dial ticks on each clock
            for (let t = 0; t < 12; t++) {
                const ta = (t * Math.PI) / 6
                nodes.push(line(
                    [cx + Math.cos(ta) * (DIAL_R - 6), DIAL_Y + Math.sin(ta) * (DIAL_R - 6)],
                    [cx + Math.cos(ta) * (DIAL_R + 4), DIAL_Y + Math.sin(ta) * (DIAL_R + 4)],
                    { stroke: '#4c5f8f', width: 1.5 },
                ).opacity(0.55))
            }

            // Out-of-distribution collision wedge in rose (clears to emerald under YaRN) for slow clocks
            if (isSlow && currentSpan > trainedSpan + 0.08) {
                const oodCol = blend > 0.45 ? COSMOS.emerald : COSMOS.rose
                const oodEnd = Math.min(startAng + currentSpan, startAng + Math.PI * 1.96)
                nodes.push(
                    arc(DIAL_R + 7, startAng + trainedSpan, oodEnd, {
                        fill: null,
                        stroke: oodCol,
                        width: 6.0,
                    }).at(cx, DIAL_Y).opacity(0.95).glow(10, oodCol).set('blend', 'screen'),
                )
            }

            // Effective theta_i readout under ALL 5 clocks (dim fast ones, highlight stretched slow ones in emerald!)
            const effFreq = baseTheta * (1 - blend) + yarnTheta * blend
            const freqStr = effFreq >= 0.01 ? effFreq.toFixed(2) : effFreq.toExponential(1)
            const freqColor = isSlow
                ? (blend > 0.45 ? COSMOS.emerald : danger > 0.25 ? COSMOS.rose : COSMOS.amber)
                : COSMOS.dim

            nodes.push(
                line([cx, DIAL_Y], [hx, hy], { stroke: dialCol, width: 3.4 }).glow(7, dialCol).set('blend', 'screen'),
                dot(7, '#ffffff').at(hx, hy).glow(12, dialCol).set('blend', 'screen'),
                dot(5, '#ffffff').at(cx, DIAL_Y),
                txt(DIAL_LABELS[k]!, cx, DIAL_Y + DIAL_R + 36, 26, dialCol, 'mono'),
                txt(`${DIAL_SUBSCRIPTS[k]!}=${freqStr}`, cx, DIAL_Y + DIAL_R + 70, 26, freqColor, 'mono')
                    .glow(isSlow && blend > 0.45 ? 6 : 0, COSMOS.emerald),
            )

            // Status tags above outer/slow dials
            if (k === 0) {
                nodes.push(txt('local: crisp', cx, DIAL_Y - DIAL_R - 28, 26, COSMOS.cyan, 'mono'))
            } else if (k === 3 && blend > 0.45) {
                nodes.push(txt('stretched 8×', cx, DIAL_Y - DIAL_R - 28, 26, COSMOS.emerald, 'mono').glow(5, COSMOS.emerald))
            } else if (k === 4) {
                const tag = blend > 0.45 ? 'stretched 8×' : danger > 0.25 ? 'OOD collision!' : 'trained 4k'
                const tagCol = blend > 0.45 ? COSMOS.emerald : danger > 0.25 ? COSMOS.rose : COSMOS.gold
                nodes.push(
                    txt(tag, cx, DIAL_Y - DIAL_R - 28, 26, tagCol, 'mono').glow(5, tagCol),
                )
            }
        }

        // Bottom full-bleed Attention Coherence Horizon (0 -> 32k tokens)
        const baseY = 290
        const leftX = -820
        const rightX = 820
        const trainCutX = leftX + (rightX - leftX) * (4096 / 32768)
        const oodWidth = rightX - trainCutX
        const oodCenterX = (trainCutX + rightX) * 0.5
        const oodTopY = baseY - 134
        const oodBotY = baseY + 54
        const oodHeight = oodBotY - oodTopY
        const oodCenterY = (oodTopY + oodBotY) * 0.5

        // Translucent crimson warning wash (> 4k OOD) that smoothly clears to emerald (YaRN)
        if (overflow > 0.02) {
            const washCrimsonOp = overflow * (1 - blend) * 0.26
            const washEmeraldOp = overflow * blend * 0.20
            if (washCrimsonOp > 0.005) {
                nodes.push(
                    rect(oodWidth, oodHeight, {
                        fill: linearGradient([trainCutX, oodCenterY], [rightX, oodCenterY], ['#ff6b8b66', '#ff6b8bcc']),
                        stroke: null,
                        radius: 8,
                    }).at(oodCenterX, oodCenterY).opacity(washCrimsonOp),
                    txt('OOD ZONE  (> 4k)', rightX - 18, oodTopY + 18, 26, COSMOS.rose, 'mono', 'right')
                        .glow(5, COSMOS.rose).opacity(Math.min(1, overflow * 1.4) * (1 - blend)),
                )
            }
            if (washEmeraldOp > 0.005) {
                nodes.push(
                    rect(oodWidth, oodHeight, {
                        fill: linearGradient([trainCutX, oodCenterY], [rightX, oodCenterY], ['#6ee7b744', '#6ee7b788']),
                        stroke: null,
                        radius: 8,
                    }).at(oodCenterX, oodCenterY).opacity(washEmeraldOp),
                    txt('YaRN EXTENDED  (32k)', rightX - 18, oodTopY + 18, 26, COSMOS.emerald, 'mono', 'right')
                        .glow(5, COSMOS.emerald).opacity(blend),
                )
            }
        }

        nodes.push(
            line([leftX, baseY], [rightX, baseY], { stroke: '#2c3a5c', width: 1.8 }),
            line([trainCutX, oodTopY], [trainCutX, oodBotY], {
                stroke: COSMOS.gold,
                width: 2.6,
                dash: [6, 8],
            }).opacity(0.88),
            txt('4k train limit', trainCutX + 16, oodTopY + 18, 26, COSMOS.gold, 'mono', 'left'),
            txt(`Context L = ${Math.round(L).toLocaleString('en-US')} tokens`, -820, 384, 32, COSMOS.ink, 'mono', 'left'),
        )

        // Plot exact RoPE attention coherence curve across 0..32k
        const pts: Vec[] = []
        const activeSpan = Math.max(4096, L)
        const activeRightX = leftX + (rightX - leftX) * (activeSpan / 32768)
        for (let i = 0; i <= WAVE_SAMPLES; i++) {
            const frac = i / WAVE_SAMPLES
            const x = leftX + (activeRightX - leftX) * frac
            const tokDist = frac * activeSpan
            const scaledDelta = (tokDist / 160) * (1 - blend * 0.72)
            const cleanVal = ropeKernel(scaledDelta, BASE_FREQS)
            const pastTrain = Math.max(0, (tokDist - 4096) / 28672)
            const chaos = pastTrain * (1 - blend) * (0.62 * Math.sin(tokDist * 0.011) + 0.35 * Math.cos(tokDist * 0.029))
            const y = baseY - (cleanVal * 68 + chaos * 52)
            pts.push([x, y])
        }

        const waveGrad = blend > 0.45
            ? linearGradient([leftX, baseY], [rightX, baseY], [COSMOS.cyan, COSMOS.emerald, COSMOS.gold])
            : linearGradient([leftX, baseY], [rightX, baseY], [COSMOS.cyan, COSMOS.amber, COSMOS.rose])

        nodes.push(
            new Node(polyPath(pts)).stroke(waveGrad, 4.6, 0.96).glow(10, blend > 0.45 ? COSMOS.emerald : COSMOS.rose).set('blend', 'screen'),
            new Node(polyPath(pts)).stroke('#ffffff', 1.3, 0.42),
            txt(
                blend > 0.45
                    ? `NTK base' ≈ ${Math.round(NTK_BASE).toLocaleString('en-US')}`
                    : 'Unseen phase angles collide past 4k',
                -220,
                384,
                28,
                blend > 0.45 ? COSMOS.emerald : COSMOS.rose,
                'sans',
                'left',
            ),
        )

        return group(...nodes)
    })

    s.add(liveDashboard, oodTitle)
    const pushDur = Math.max(3.0, c.cue('Linear interpolation').start - c.start - 0.5)
    c.at(0.4, () => s.play(ctxLen.to(32768, { duration: pushDur, ease: linear })))

    const scaleDur = Math.max(2.5, Math.min(4.8, c.end - c.cue('scaling gently').start - 0.6))
    c.swap('scaling gently', oodTitle, [yarnTitle, yarnEq])
    c.on('scaling gently', () => {
        s.play(yarnBlend.to(1, { duration: scaleDur }))
    })
}

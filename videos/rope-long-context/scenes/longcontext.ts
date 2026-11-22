import {
    Node, arc, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { ntkScaledBase, ropeFreqs, ropeKernel, yarnFreqs } from '../math'

// 5 representative dials spanning fast local (i=0) to slow long-range (i=4)
const DIAL_XS = [-640, -320, 0, 320, 640] as const
const DIAL_Y = -95
const DIAL_R = 112
const DIAL_LABELS = ['Fast (i=0)', 'Local (i=2)', 'Mid (i=4)', 'Slow (i=6)', 'Global (i=7)'] as const
const DIAL_BASE_THEMES = [COSMOS.cyan, COSMOS.blue, COSMOS.violet, COSMOS.rose, COSMOS.amber] as const

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
        txt('OUT-OF-DISTRIBUTION PHASE COLLISIONS', 0, -405, 26, COSMOS.rose, 'mono'),
        txt('Pushing past 4k breaks the slow clocks', 0, -335, 58, COSMOS.ink, 'serif').glow(5, COSMOS.rose),
    )

    const yarnTitle = group(
        txt('NTK & YaRN FREQUENCY SCALING', 0, -405, 26, COSMOS.emerald, 'mono'),
        txt('Stretch slow clocks — keep fast clocks crisp', 0, -335, 58, COSMOS.emerald, 'serif').glow(6, COSMOS.emerald),
    )

    const yarnEq = tex(String.raw`\text{base}' = \text{base} \cdot s^{\frac{d}{d-2}}`, {
        size: 40,
        color: COSMOS.gold,
    }).at(570, 372).glow(6, COSMOS.gold)

    const liveDashboard = dynamic(() => {
        const L = ctxLen.value
        const blend = yarnBlend.value
        const overflow = Math.max(0, Math.min(1, (L - 4096) / (32768 - 4096)))
        const danger = overflow * (1 - blend)
        const nodes: Node[] = []

        // Ambient glow behind slow right-hand dials: shifts from rose danger to emerald/gold harmony!
        nodes.push(
            circle(440, {
                fill: radialGradient([0, 0], 440, [
                    [0, blend > 0.35 ? '#6ee7b722' : '#ff6b8b28'],
                    [0.55, '#07091000'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(480, DIAL_Y).opacity(0.4 + 0.6 * Math.max(danger, blend)),
        )

        // 5 clock dials across the upper canvas
        for (let k = 0; k < 5; k++) {
            const cx = DIAL_XS[k]!
            const idx = DIAL_INDICES[k]!
            const baseTheta = BASE_FREQS[idx]!
            const yarnTheta = YARN_FREQS[idx]!
            const isSlow = k >= 3

            // Trained arc angle for slow clocks (4096 tokens): visualize as 115 degrees safe wedge
            const trainedSpan = isSlow ? (k === 3 ? 2.1 : 1.15) : Math.PI * 1.85
            // Raw angle grows 8x as context extends 4k -> 32k; YaRN unwinds slow clocks back into safe zone!
            const scaleFactor = 1 + overflow * 3.1
            const effectiveScale = isSlow ? scaleFactor * (1 - blend * 0.72) : scaleFactor * (1 - blend * 0.08)
            const currentSpan = trainedSpan * effectiveScale

            const startAng = -Math.PI / 2
            const handAng = startAng + currentSpan
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
                circle(DIAL_R, { fill: null, stroke: '#273454', width: 2.2 }).at(cx, DIAL_Y),
                // Trained safe arc
                arc(DIAL_R, startAng, startAng + trainedSpan, {
                    fill: null,
                    stroke: '#38bdf8',
                    width: 4.0,
                }).at(cx, DIAL_Y).opacity(0.65),
            )

            // Out-of-distribution collision wedge in rose/amber for slow clocks when danger > 0
            if (isSlow && currentSpan > trainedSpan + 0.08) {
                const oodCol = blend > 0.45 ? COSMOS.emerald : COSMOS.rose
                const oodEnd = Math.min(startAng + currentSpan, startAng + Math.PI * 1.96)
                nodes.push(
                    arc(DIAL_R + 7, startAng + trainedSpan, oodEnd, {
                        fill: null,
                        stroke: oodCol,
                        width: 6.0,
                    }).at(cx, DIAL_Y).opacity(0.95).glow(10, oodCol),
                )
            }

            nodes.push(
                line([cx, DIAL_Y], [hx, hy], { stroke: dialCol, width: 3.4 }).glow(6, dialCol),
                dot(7, '#ffffff').at(hx, hy).glow(12, dialCol),
                dot(5, '#ffffff').at(cx, DIAL_Y),
                txt(DIAL_LABELS[k]!, cx, DIAL_Y + DIAL_R + 40, 26, dialCol, 'mono'),
            )

            // Effective frequency comparison readout under outer dials
            if (k === 0) {
                nodes.push(txt('local: crisp', cx, DIAL_Y - DIAL_R - 30, 26, COSMOS.cyan, 'mono'))
            } else if (k === 4) {
                const effFreq = baseTheta * (1 - blend) + yarnTheta * blend
                const tag = blend > 0.45 ? 'stretched 8×' : danger > 0.25 ? 'OOD collision!' : 'trained 4k'
                const tagCol = blend > 0.45 ? COSMOS.emerald : danger > 0.25 ? COSMOS.rose : COSMOS.gold
                nodes.push(
                    txt(tag, cx, DIAL_Y - DIAL_R - 30, 26, tagCol, 'mono').glow(5, tagCol),
                    txt(`θ₇=${effFreq.toExponential(1)}`, cx, DIAL_Y + DIAL_R + 76, 26, COSMOS.dim, 'mono'),
                )
            }
        }

        // Bottom full-bleed Attention Coherence Horizon (0 -> 32k tokens)
        const baseY = 275
        const leftX = -820
        const rightX = 820
        const trainCutX = leftX + (rightX - leftX) * (4096 / 32768)

        nodes.push(
            line([leftX, baseY], [rightX, baseY], { stroke: '#25314f', width: 1.8 }),
            line([trainCutX, baseY - 125], [trainCutX, baseY + 55], {
                stroke: COSMOS.gold,
                width: 2.4,
                dash: [6, 8],
            }).opacity(0.8),
            txt('4k train limit', trainCutX + 16, baseY - 110, 26, COSMOS.gold, 'mono', 'left'),
            txt(`Context L = ${Math.round(L).toLocaleString('en-US')} tokens`, -820, 372, 32, COSMOS.ink, 'mono', 'left'),
        )

        // Plot exact RoPE attention coherence curve across 0..32k:
        // Without scaling: high-frequency phase collision noise past 4k; with YaRN/NTK: smooth glowing emerald decay!
        const pts: Vec[] = []
        const activeSpan = Math.max(4096, L)
        const activeRightX = leftX + (rightX - leftX) * (activeSpan / 32768)
        for (let i = 0; i <= WAVE_SAMPLES; i++) {
            const frac = i / WAVE_SAMPLES
            const x = leftX + (activeRightX - leftX) * frac
            const tokDist = frac * activeSpan
            const scaledDelta = (tokDist / 160) * (1 - blend * 0.72)
            const cleanVal = ropeKernel(scaledDelta, BASE_FREQS)
            // Unseen phase collision spikes past 4096 when unscaled
            const pastTrain = Math.max(0, (tokDist - 4096) / 28672)
            const chaos = pastTrain * (1 - blend) * (0.62 * Math.sin(tokDist * 0.011) + 0.35 * Math.cos(tokDist * 0.029))
            const y = baseY - (cleanVal * 92 + chaos * 78)
            pts.push([x, y])
        }

        const waveGrad = blend > 0.45
            ? linearGradient([leftX, baseY], [rightX, baseY], [COSMOS.cyan, COSMOS.emerald, COSMOS.gold])
            : linearGradient([leftX, baseY], [rightX, baseY], [COSMOS.cyan, COSMOS.amber, COSMOS.rose])

        nodes.push(
            new Node(polyPath(pts)).stroke(waveGrad, 4.4, 0.96).glow(8, blend > 0.45 ? COSMOS.emerald : COSMOS.rose),
            new Node(polyPath(pts)).stroke('#ffffff', 1.2, 0.36),
            txt(
                blend > 0.45
                    ? `NTK base' ≈ ${Math.round(NTK_BASE).toLocaleString('en-US')}`
                    : 'Unseen phase angles collide past 4k',
                -230,
                372,
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

import {
    Node, arrow, dot, dynamic, group, line, rect, tex,
    type SceneFunction,
} from 'vizmatic/stage'
import { DEMO_EXACT, DEMO_LOGITS, DEMO_ONLINE } from '../math'
import { COSMOS, txt } from '../../../factory/style'

// 12 logit bars organized into 3 clean SRAM tiles of 4 elements
const BAR_BASE_Y = 308
const BAR_MAX_H = 315
const BAR_W = 86
const TILE_COLORS = [COSMOS.cyan, COSMOS.gold, COSMOS.violet] as const

function barX(index: number): number {
    const tile = Math.floor(index / 4)
    const local = index % 4
    // Tile centers at -520, 0, +520
    const tileCenter = (tile - 1) * 520
    return tileCenter + (local - 1.5) * 106
}

// Map running max m in [2.0, 4.4] cleanly onto the upper chart threshold band y in [-125, -45]
function runningMaxY(m: number): number {
    const frac = Math.max(0, Math.min(1, (m - 2.0) / 2.4))
    return -45 - frac * 78
}

// Precompute step probability arrays padded to length 12 for smooth interpolation
const STEP0 = Array.from({ length: 12 }, (_, i) => (i < 4 ? DEMO_ONLINE.steps[0]!.runningProbs[i]! : 0))
const STEP1 = Array.from({ length: 12 }, (_, i) => (i < 8 ? DEMO_ONLINE.steps[1]!.runningProbs[i]! : 0))
const STEP2 = Array.from({ length: 12 }, (_, i) => DEMO_ONLINE.steps[2]!.runningProbs[i]!)
const MAX_DIFF = Math.max(...DEMO_ONLINE.probs.map((p, i) => Math.abs(p - DEMO_EXACT[i]!)))

export const onlinesoftmax: SceneFunction = (s, c) => {
    const stepProg = s.value(0.25)
    const showExact = s.value(0)

    const title = txt('Online Softmax', -840, -425, 58, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.cyan)

    const eqMax = tex(String.raw`m_{\mathrm{new}} = \max(m,\;\tilde{m})`, {
        size: 50,
        color: COSMOS.gold,
    }).at(-430, -255).glow(6, COSMOS.gold)

    const eqDenom = tex(String.raw`\ell_{\mathrm{new}} = e^{m - m_{\mathrm{new}}}\ell \;+\; e^{\tilde{m} - m_{\mathrm{new}}}\tilde{\ell}`, {
        size: 46,
        color: COSMOS.cyan,
    }).at(285, -255).glow(6, COSMOS.cyan)

    const tileLabels = group(
        // Subtle background reference grid rails across the chart band so upper space feels grounded
        line([-760, BAR_BASE_Y - BAR_MAX_H * 0.25], [760, BAR_BASE_Y - BAR_MAX_H * 0.25], { stroke: '#1b2540', width: 1.2 }),
        line([-760, BAR_BASE_Y - BAR_MAX_H * 0.5], [760, BAR_BASE_Y - BAR_MAX_H * 0.5], { stroke: '#1b2540', width: 1.2 }),
        line([-760, BAR_BASE_Y - BAR_MAX_H * 0.75], [760, BAR_BASE_Y - BAR_MAX_H * 0.75], { stroke: '#1b2540', width: 1.2 }),
        line([-760, BAR_BASE_Y - BAR_MAX_H], [760, BAR_BASE_Y - BAR_MAX_H], { stroke: '#1b2540', width: 1.2 }),
        line([-760, BAR_BASE_Y], [760, BAR_BASE_Y], { stroke: '#3c4c74', width: 2.5 }),
        txt('Tile 1  (m = 2.3)', -520, BAR_BASE_Y + 46, 28, COSMOS.cyan, 'mono'),
        txt('Tile 2  (m = 3.6)', 0, BAR_BASE_Y + 46, 28, COSMOS.gold, 'mono'),
        txt('Tile 3  (m = 4.1)', 520, BAR_BASE_Y + 46, 28, COSMOS.violet, 'mono'),
    )

    const liveBars = dynamic(() => {
        const p = stepProg.value
        let vals: number[]
        let prevVals: number[] | null = null
        let ghostCount = 0
        let rescaleT = 0
        let mCur: number
        let status: string
        let statusCol: string = COSMOS.cyan
        let rescaleNote = ''
        let rescaleHeroIdx = -1

        if (p <= 1) {
            const t = Math.max(0, Math.min(1, p))
            vals = STEP0.map((v) => v * t)
            mCur = DEMO_ONLINE.steps[0]!.mNew
            status = 'Tile 1 loaded  ·  m = 2.30'
            statusCol = COSMOS.cyan
        } else if (p <= 2) {
            const t = p - 1
            rescaleT = t
            prevVals = STEP0
            ghostCount = 4
            vals = STEP0.map((v, i) => v + (STEP1[i]! - v) * t)
            mCur = DEMO_ONLINE.steps[0]!.mNew + (DEMO_ONLINE.steps[1]!.mNew - DEMO_ONLINE.steps[0]!.mNew) * t
            status = 'Tile 2 overtakes max  ·  rescale Tile 1 by exp(2.3 - 3.6) = 0.27'
            statusCol = COSMOS.gold
            rescaleNote = '× 0.273'
            rescaleHeroIdx = 1 // Tile 1 peak bar (logit 2.3)
        } else {
            const t = Math.min(1, p - 2)
            rescaleT = t
            prevVals = STEP1
            ghostCount = 8
            vals = STEP1.map((v, i) => v + (STEP2[i]! - v) * t)
            mCur = DEMO_ONLINE.steps[1]!.mNew + (DEMO_ONLINE.steps[2]!.mNew - DEMO_ONLINE.steps[1]!.mNew) * t
            status = 'Tile 3 final rescale  ·  exp(3.6 - 4.1) = 0.61'
            statusCol = COSMOS.emerald
            rescaleNote = '× 0.607'
            rescaleHeroIdx = 5 // Tile 2 peak bar (logit 3.6)
        }

        const mLineY = runningMaxY(mCur)
        const nodes: Node[] = [
            txt(status, 840, -422, 28, statusCol, 'mono', 'right'),
            // Glowing horizontal running-max threshold beam spanning ALL 3 tiles!
            line([-760, mLineY], [760, mLineY], { stroke: COSMOS.gold, width: 5.5, dash: [16, 10] })
                .opacity(0.32)
                .glow(12, COSMOS.gold)
                .set('blend', 'screen'),
            line([-760, mLineY], [760, mLineY], { stroke: COSMOS.gold, width: 2.6, dash: [14, 9] })
                .opacity(0.92)
                .glow(8, COSMOS.gold),
            // Anchor nodes along the running-max beam over each tile center
            dot(5.5, COSMOS.cyan).at(-520, mLineY).glow(8, COSMOS.cyan),
            dot(5.5, COSMOS.gold).at(0, mLineY).glow(8, COSMOS.gold).opacity(p > 1.05 ? 1 : 0.35),
            dot(5.5, COSMOS.violet).at(520, mLineY).glow(8, COSMOS.violet).opacity(p > 2.05 ? 1 : 0.35),
            // Running-max label perched crisply above the left end of the threshold beam
            txt(`running max  m = ${mCur.toFixed(2)}`, -760, mLineY - 26, 26, COSMOS.gold, 'mono', 'left').glow(5, COSMOS.gold),
        ]

        // Rescale callout badge cleanly right-aligned above the threshold beam
        if (rescaleNote && p > 1.08) {
            nodes.push(
                txt(`prior tiles rescaled  ${rescaleNote}`, 760, mLineY - 26, 26, COSMOS.amber, 'mono', 'right').glow(6, COSMOS.amber),
            )
        }

        // Translucent wireframe "before rescaling" ghost bars + animated downward contraction arrows!
        if (prevVals && rescaleT > 0.04) {
            const ghostFade = Math.min(1, rescaleT * 2.5) * 0.72
            for (let i = 0; i < ghostCount; i++) {
                const x = barX(i)
                const tile = Math.floor(i / 4)
                const col = TILE_COLORS[tile]!
                const prevVal = prevVals[i]!
                const curVal = vals[i]!
                const prevH = Math.max(0, (prevVal / 0.56) * BAR_MAX_H)
                const curH = Math.max(0, (curVal / 0.56) * BAR_MAX_H)

                if (prevH > curH + 4) {
                    // Translucent wireframe ghost outline of pre-rescale height!
                    nodes.push(
                        rect(BAR_W, prevH, { fill: col, stroke: null, radius: 6 })
                            .at(x, BAR_BASE_Y - prevH / 2)
                            .opacity(0.10 * ghostFade),
                        rect(BAR_W, prevH, { fill: null, stroke: col, width: 2.0, dash: [7, 5], radius: 6 })
                            .at(x, BAR_BASE_Y - prevH / 2)
                            .opacity(0.75 * ghostFade),
                    )
                }

                // Animated downward contraction arrow inside tall shrinking bars!
                if (prevH - curH > 32) {
                    const topY = BAR_BASE_Y - prevH + 6
                    const botY = BAR_BASE_Y - curH - 12
                    const curTipY = topY + (botY - topY) * Math.min(1, rescaleT * 1.15)
                    if (curTipY - topY > 14) {
                        nodes.push(
                            arrow([x, topY], [x, curTipY], {
                                stroke: COSMOS.amber,
                                width: 3.4,
                                tip: 12,
                            }).glow(8, COSMOS.amber).opacity(0.95 * ghostFade).set('blend', 'screen'),
                        )
                    }
                    // Show crisp multiplier badge next to the hero shrinking bar!
                    if (i === rescaleHeroIdx) {
                        nodes.push(
                            txt(rescaleNote, x + BAR_W * 0.65, (topY + botY) / 2 - 4, 26, COSMOS.amber, 'mono', 'left')
                                .glow(6, COSMOS.amber)
                                .opacity(ghostFade),
                        )
                    }
                }
            }
        }

        // Render all 12 glowing softmax bars
        for (let i = 0; i < 12; i++) {
            const x = barX(i)
            const tile = Math.floor(i / 4)
            const col = TILE_COLORS[tile]!
            const val = vals[i]!
            const h = Math.max(0, (val / 0.56) * BAR_MAX_H)
            if (h > 1.5) {
                nodes.push(
                    rect(BAR_W, h, { fill: col, stroke: '#ffffff', width: 1, radius: 6 })
                        .at(x, BAR_BASE_Y - h / 2)
                        .opacity(0.86)
                        .glow(7, col),
                )
            }
            // Place value cleanly above the tallest of (current bar, ghost bar) so dashed wireframes never cross text!
            if (val > 0.004) {
                const ghostH = prevVals && i < ghostCount ? Math.max(h, (prevVals[i]! / 0.56) * BAR_MAX_H) : h
                const labelY = BAR_BASE_Y - ghostH - 26
                nodes.push(
                    txt(val.toFixed(2), x, labelY, 26, COSMOS.ink, 'mono').opacity(0.94),
                )
            } else {
                nodes.push(
                    txt(DEMO_LOGITS[i]!.toFixed(1), x, BAR_BASE_Y - 24, 26, '#506086', 'mono').opacity(0.65),
                )
            }
        }

        // Exact full-row softmax verification crown overlay!
        if (showExact.value > 0.02) {
            const ea = showExact.value
            for (let i = 0; i < 12; i++) {
                const x = barX(i)
                const eh = (DEMO_EXACT[i]! / 0.56) * BAR_MAX_H
                const ey = BAR_BASE_Y - eh
                nodes.push(
                    line([x - BAR_W * 0.54, ey], [x + BAR_W * 0.54, ey], { stroke: COSMOS.emerald, width: 4.5 })
                        .glow(8, COSMOS.emerald)
                        .opacity(ea),
                    dot(4.5, '#ffffff').at(x, ey).opacity(ea),
                )
            }
            nodes.push(
                txt(`max |online - exact| = ${MAX_DIFF.toExponential(1)}   (< 1e-12  ·  zero approximation)`, 0, 422, 30, COSMOS.emerald, 'mono')
                    .glow(8, COSMOS.emerald)
                    .opacity(ea),
            )
        }

        return group(...nodes)
    })

    s.add(title, tileLabels, liveBars)
    c.at(0.15, () => s.play(stepProg.to(1.0, { duration: 3.5 })))
    c.show('track the running maximum', eqMax)
    c.show('exponential correction factor', eqDenom)
    c.on('Whenever a larger score appears', () => {
        s.play(stepProg.to(2.0, { duration: 2.2 }))
    })
    c.on('By the final tile', () => {
        s.play(stepProg.to(3.0, { duration: 1.8 }))
    })
    c.on('machine precision', () => {
        s.play(showExact.to(1, { duration: 0.6 }))
    })
}

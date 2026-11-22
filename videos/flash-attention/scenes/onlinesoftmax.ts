import {
    Node, dot, dynamic, group, line, rect, tex,
    type SceneFunction,
} from 'vizmatic/stage'
import { DEMO_EXACT, DEMO_LOGITS, DEMO_ONLINE } from '../math'
import { COSMOS, txt } from '../../../factory/style'

// 12 logit bars organized into 3 clean SRAM tiles of 4 elements
const BAR_BASE_Y = 305
const BAR_MAX_H = 320
const BAR_W = 86
const TILE_COLORS = [COSMOS.cyan, COSMOS.gold, COSMOS.violet] as const

function barX(index: number): number {
    const tile = Math.floor(index / 4)
    const local = index % 4
    // Tile centers at -520, 0, +520
    const tileCenter = (tile - 1) * 520
    return tileCenter + (local - 1.5) * 106
}

// Precompute step probability arrays padded to length 12 for smooth interpolation
const STEP0 = Array.from({ length: 12 }, (_, i) => (i < 4 ? DEMO_ONLINE.steps[0]!.runningProbs[i]! : 0))
const STEP1 = Array.from({ length: 12 }, (_, i) => (i < 8 ? DEMO_ONLINE.steps[1]!.runningProbs[i]! : 0))
const STEP2 = Array.from({ length: 12 }, (_, i) => DEMO_ONLINE.steps[2]!.runningProbs[i]!)
const MAX_DIFF = Math.max(...DEMO_ONLINE.probs.map((p, i) => Math.abs(p - DEMO_EXACT[i]!)))

export const onlinesoftmax: SceneFunction = (s, c) => {
    const stepProg = s.value(0.25)
    const showExact = s.value(0)

    const title = txt('Online Softmax', -840, -420, 58, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.cyan)

    const eqMax = tex(String.raw`m_{\mathrm{new}} = \max(m,\;\tilde{m})`, {
        size: 50,
        color: COSMOS.gold,
    }).at(-430, -245).glow(6, COSMOS.gold)

    const eqDenom = tex(String.raw`\ell_{\mathrm{new}} = e^{m - m_{\mathrm{new}}}\ell \;+\; e^{\tilde{m} - m_{\mathrm{new}}}\tilde{\ell}`, {
        size: 46,
        color: COSMOS.cyan,
    }).at(285, -245).glow(6, COSMOS.cyan)

    const tileLabels = group(
        line([-760, BAR_BASE_Y], [760, BAR_BASE_Y], { stroke: '#344163', width: 2.5 }),
        txt('Tile 1  (m = 2.3)', -520, BAR_BASE_Y + 46, 28, COSMOS.cyan, 'mono'),
        txt('Tile 2  (m = 3.6)', 0, BAR_BASE_Y + 46, 28, COSMOS.gold, 'mono'),
        txt('Tile 3  (m = 4.1)', 520, BAR_BASE_Y + 46, 28, COSMOS.violet, 'mono'),
    )

    const liveBars = dynamic(() => {
        const p = stepProg.value
        let vals: number[]
        let mCur: number
        let status: string
        let statusCol: string = COSMOS.cyan
        let rescaleNote = ''

        if (p <= 1) {
            const t = Math.max(0, Math.min(1, p))
            vals = STEP0.map((v) => v * t)
            mCur = DEMO_ONLINE.steps[0]!.mNew
            status = 'Tile 1 loaded  ·  m = 2.30'
            statusCol = COSMOS.cyan
        } else if (p <= 2) {
            const t = p - 1
            vals = STEP0.map((v, i) => v + (STEP1[i]! - v) * t)
            mCur = DEMO_ONLINE.steps[0]!.mNew + (DEMO_ONLINE.steps[1]!.mNew - DEMO_ONLINE.steps[0]!.mNew) * t
            status = 'Tile 2 overtakes max  ·  rescale Tile 1 by exp(2.3 - 3.6) = 0.27'
            statusCol = COSMOS.gold
            rescaleNote = '× 0.273'
        } else {
            const t = Math.min(1, p - 2)
            vals = STEP1.map((v, i) => v + (STEP2[i]! - v) * t)
            mCur = DEMO_ONLINE.steps[1]!.mNew + (DEMO_ONLINE.steps[2]!.mNew - DEMO_ONLINE.steps[1]!.mNew) * t
            status = 'Tile 3 final rescale  ·  exp(3.6 - 4.1) = 0.61'
            statusCol = COSMOS.emerald
            rescaleNote = '× 0.607'
        }

        const nodes: Node[] = [
            txt(status, 840, -418, 28, statusCol, 'mono', 'right'),
            txt(`running m = ${mCur.toFixed(2)}`, -840, -112, 28, COSMOS.gold, 'mono', 'left').glow(4, COSMOS.gold),
        ]

        // Rescale callout badge cleanly right-aligned so it never overlaps running m on the left
        if (rescaleNote && p > 1.15) {
            nodes.push(
                txt(`prior tiles rescaled ${rescaleNote}`, 840, -112, 28, COSMOS.amber, 'mono', 'right').glow(6, COSMOS.amber),
            )
        }

        // Render all 12 glowing softmax bars
        for (let i = 0; i < 12; i++) {
            const x = barX(i)
            const tile = Math.floor(i / 4)
            const col = TILE_COLORS[tile]!
            const val = vals[i]!
            // Normalize bar height relative to max possible (~0.55) so bars look bold and dramatic
            const h = Math.max(0, (val / 0.56) * BAR_MAX_H)
            if (h > 1.5) {
                nodes.push(
                    rect(BAR_W, h, { fill: col, stroke: '#ffffff', width: 1, radius: 6 })
                        .at(x, BAR_BASE_Y - h / 2)
                        .opacity(0.84)
                        .glow(7, col),
                )
            }
            // Show probability value above every visible bar
            if (val > 0.004) {
                nodes.push(
                    txt(val.toFixed(2), x, BAR_BASE_Y - h - 22, 26, COSMOS.ink, 'mono').opacity(0.92),
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

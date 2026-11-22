import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, rect, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { MOD_SEQUENCE } from '../math'
import { txt } from '../../../factory/style'

const COUNT = 16
const BASE_Y = 210
const LEFT_X = -750
const STEP_X = 100

const RES_COLOR: Record<number, string> = {
    1: '#ffd166',
    7: '#5ce1e6',
    4: '#a78bfa',
    13: '#ff6b8b',
}

/** Smooth periodic harmonic envelope passing cleanly over the 4-cycle [1, 7, 4, 13] heights. */
function harmonicHeight(u: number): number {
    // Exact 4-point DFT trigonometric interpolant of [1, 7, 4, 13]:
    // a0 = 6.25, a1 = -1.5, b1 = -3.0, a2 = -3.75
    const th = (Math.PI / 2) * u
    const val = 6.25 - 1.5 * Math.cos(th) - 3.0 * Math.sin(th) - 3.75 * Math.cos(2 * th)
    return Math.max(0.4, val)
}

export const period: SceneFunction = (s, c) => {
    const pillarProg = s.value(0.06)
    const arcProg = s.value(0)
    const showPillars = s.value(1)
    const showGcd = s.value(0)
    const branchProg = s.value(0)
    const mergeProg = s.value(0)
    const flowPhase = s.value(0)

    const topTag = txt("SHOR'S REDUCTION · N = 15, a = 7", 0, -408, 26, '#ffd166', 'mono')
    const modEq = tex(String.raw`f(x) = 7^x \bmod 15`, { size: 54, color: '#f8f4ec' })
        .at(0, -326)
        .glow(6, '#7c8cff')

    const livePillars = dynamic(() => {
        if (showPillars.value < 0.02) return []
        const a = showPillars.value
        const pp = pillarProg.value
        const ap = arcProg.value
        const envGrad = linearGradient([LEFT_X, BASE_Y - 120], [LEFT_X + (COUNT - 1) * STEP_X, BASE_Y - 120], [
            '#ffd166',
            '#5ce1e6',
            '#a78bfa',
            '#ff6b8b',
            '#ffd166',
        ])
        const nodes: Node[] = [
            line([LEFT_X - 55, BASE_Y], [LEFT_X + (COUNT - 1) * STEP_X + 55, BASE_Y], {
                stroke: '#384b78',
                width: 2.2,
            }).opacity(a),
        ]

        // Translucent harmonic wave envelope connecting the periodic pillars
        if (pp > 0.15) {
            const envOp = Math.min(1, (pp - 0.15) * 1.4) * a
            const envPts: Vec[] = Array.from({ length: 180 }, (_, j) => {
                const u = (j / 179) * (COUNT - 1)
                const x = LEFT_X + u * STEP_X
                const h = (harmonicHeight(u) / 13) * 268 * pp
                return [x, BASE_Y - h] as Vec
            })
            const fillPts: Vec[] = [
                [LEFT_X, BASE_Y],
                ...envPts,
                [LEFT_X + (COUNT - 1) * STEP_X, BASE_Y],
            ]
            nodes.push(
                new Node(polyPath(fillPts)).fill('#5ce1e614', envOp).stroke(null),
                new Node(polyPath(envPts)).stroke(envGrad, 3.0, 0.72 * envOp).glow(8, '#5ce1e6').set('blend', 'screen'),
            )
        }

        for (let i = 0; i < COUNT; i++) {
            const val = MOD_SEQUENCE[i]!
            const col = RES_COLOR[val] ?? '#5ce1e6'
            const x = LEFT_X + i * STEP_X
            const local = Math.max(0, Math.min(1, pp * 1.5 - i * 0.032))
            const h = Math.max(14, (val / 13) * 268 * local)
            const topY = BASE_Y - h
            const grad = linearGradient([x, BASE_Y], [x, topY], ['#141c38', col])
            const isPeriodTick = i % 4 === 0
            nodes.push(
                // Crisp x tick marks along the baseline
                line([x, BASE_Y - 2], [x, BASE_Y + (isPeriodTick ? 16 : 9)], {
                    stroke: isPeriodTick ? '#ffd166' : '#6c82b0',
                    width: isPeriodTick ? 2.6 : 1.6,
                }).opacity(a),
                rect(46, h, { fill: grad, stroke: col, width: 2.2, radius: 7 })
                    .at(x, BASE_Y - h / 2)
                    .opacity(0.92 * a),
                dot(5.6, '#ffffff').at(x, topY).glow(10, col).opacity(a * local).set('blend', 'screen'),
                txt(`${val}`, x, topY - 28, 26, col, 'mono').glow(4, col).opacity(a * local),
            )
            if (isPeriodTick) {
                nodes.push(txt(`x=${i}`, x, BASE_Y + 46, 26, '#ffd166', 'mono').glow(4, '#ffd166').opacity(a))
            }
        }

        // Glowing golden period-bracket arcs (r = 4) jumping cleanly between x = 0 -> 4 -> 8 -> 12
        if (ap > 0.02) {
            const archBaseY = BASE_Y - 275
            const archLift = 112
            for (let k = 0; k < 3; k++) {
                const seg = Math.max(0, Math.min(1, ap * 2.2 - k * 0.42))
                if (seg < 0.02) continue
                const x0 = LEFT_X + k * 4 * STEP_X
                const x1 = LEFT_X + (k + 1) * 4 * STEP_X
                const steps = Math.max(2, Math.floor(36 * seg))
                const pts: Vec[] = Array.from({ length: steps }, (_, j) => {
                    const u = j / 35
                    const px = x0 + (x1 - x0) * u
                    const py = archBaseY - Math.sin(u * Math.PI) * archLift
                    return [px, py] as Vec
                })
                nodes.push(
                    // Vertical bracket anchor drops stopping cleanly above the "1" pillar labels
                    line([x0, BASE_Y - 76], [x0, archBaseY], { stroke: '#ffd166', width: 1.8 })
                        .dash([6, 6])
                        .opacity(0.5 * seg * a),
                    line([x1, BASE_Y - 76], [x1, archBaseY], { stroke: '#ffd166', width: 1.8 })
                        .dash([6, 6])
                        .opacity(0.5 * seg * a),
                    new Node(polyPath(pts))
                        .stroke('#ffd166', 4.0, 0.94 * a)
                        .glow(10, '#ffd166')
                        .set('blend', 'screen'),
                    dot(6, '#ffffff').at(x0, archBaseY).glow(10, '#ffd166').opacity(seg * a).set('blend', 'screen'),
                )
                if (seg > 0.55) {
                    const lblOp = a * Math.min(1, (seg - 0.55) * 2.5)
                    nodes.push(
                        dot(6, '#ffffff').at(x1, archBaseY).glow(10, '#ffd166').opacity(lblOp).set('blend', 'screen'),
                        txt('r = 4', (x0 + x1) / 2, archBaseY - archLift - 26, 28, '#fff3c4', 'mono')
                            .glow(8, '#ffd166')
                            .opacity(lblOp),
                    )
                }
            }
        }

        return group(...nodes)
    })

    const periodNote = txt('Sequence 1, 7, 4, 13 repeats cleanly with period r = 4', 0, 358, 32, '#cbd5e8', 'sans')

    // Beat 1: Classical arithmetic finishes the factorization (ZERO orphan lines!)
    const gcdVisuals = dynamic(() => {
        if (showGcd.value < 0.02) return []
        const a = showGcd.value
        const bp = branchProg.value
        const mp = mergeProg.value
        const ph = flowPhase.value
        const nodes: Node[] = [
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, '#ffd16628'],
                    [0.5, '#5ce1e618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            })
                .at(0, 75)
                .opacity(a)
                .set('blend', 'screen'),
        ]

        // Upper diverging diagonal beams (49 -> 48 left, 49 -> 50 right) + streaming blend('screen') particles
        if (bp > 0.02) {
            const topStart: Vec = [0, -184]
            const leftMid: Vec = [-430, -82]
            const rightMid: Vec = [430, -82]
            const lx = topStart[0] + (leftMid[0] - topStart[0]) * bp
            const ly = topStart[1] + (leftMid[1] - topStart[1]) * bp
            const rx = topStart[0] + (rightMid[0] - topStart[0]) * bp
            const ry = topStart[1] + (rightMid[1] - topStart[1]) * bp
            nodes.push(
                line(topStart, [lx, ly], { stroke: '#5ce1e6', width: 3.8 }).glow(10, '#38bdf8').opacity(0.92 * a).set('blend', 'screen'),
                line(topStart, [rx, ry], { stroke: '#ff8fab', width: 3.8 }).glow(10, '#ff6b8b').opacity(0.92 * a).set('blend', 'screen'),
            )
            for (let k = 0; k < 3; k++) {
                const u = ((ph * 0.75 + k / 3) % 1) * bp
                const pxL = topStart[0] + (leftMid[0] - topStart[0]) * u
                const pyL = topStart[1] + (leftMid[1] - topStart[1]) * u
                const pxR = topStart[0] + (rightMid[0] - topStart[0]) * u
                const pyR = topStart[1] + (rightMid[1] - topStart[1]) * u
                nodes.push(
                    dot(5.2, '#ffffff').at(pxL, pyL).glow(10, '#5ce1e6').opacity(Math.sin(u * Math.PI) * a).set('blend', 'screen'),
                    dot(5.2, '#ffffff').at(pxR, pyR).glow(10, '#ff6b8b').opacity(Math.sin(u * Math.PI) * a).set('blend', 'screen'),
                )
            }
        }

        // Bottom converging beams + glowing factor lock crystal drawn SIMULTANEOUSLY (never orphan lines!)
        if (mp > 0.02) {
            const leftBot: Vec = [-430, 148]
            const rightBot: Vec = [430, 148]
            const leftTarget: Vec = [-224, 264]
            const rightTarget: Vec = [224, 264]
            const lx = leftBot[0] + (leftTarget[0] - leftBot[0]) * mp
            const ly = leftBot[1] + (leftTarget[1] - leftBot[1]) * mp
            const rx = rightBot[0] + (rightTarget[0] - rightBot[0]) * mp
            const ry = rightBot[1] + (rightTarget[1] - rightBot[1]) * mp
            const lockPulse = 1 + 0.03 * Math.sin(ph * 3.0)
            nodes.push(
                line(leftBot, [lx, ly], { stroke: '#5ce1e6', width: 3.8 }).glow(10, '#38bdf8').opacity(0.92 * a).set('blend', 'screen'),
                line(rightBot, [rx, ry], { stroke: '#ff8fab', width: 3.8 }).glow(10, '#ff6b8b').opacity(0.92 * a).set('blend', 'screen'),
                // Glowing bottom factor lock / crystal revealed simultaneously with the diagonal beams!
                circle(190, {
                    fill: radialGradient([0, 0], 190, [
                        [0, '#ffd16644'],
                        [0.5, '#5ce1e622'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                })
                    .at(0, 266)
                    .opacity(mp * a)
                    .set('blend', 'screen'),
                rect(448 * lockPulse, 114 * lockPulse, {
                    fill: '#131b34cc',
                    stroke: '#ffd166',
                    width: 3.0,
                    radius: 26,
                })
                    .at(0, 266)
                    .glow(14, '#ffd166')
                    .opacity(mp * a),
                dot(6.5, '#5ce1e6').at(leftTarget[0], leftTarget[1]).glow(12, '#5ce1e6').opacity(mp * a).set('blend', 'screen'),
                dot(6.5, '#ff8fab').at(rightTarget[0], rightTarget[1]).glow(12, '#ff6b8b').opacity(mp * a).set('blend', 'screen'),
            )
            // Streaming glowing blend('screen') particles along both bottom branches into the lock crystal
            for (let k = 0; k < 3; k++) {
                const u = ((ph * 0.8 + k / 3 + 0.15) % 1) * mp
                const pxL = leftBot[0] + (leftTarget[0] - leftBot[0]) * u
                const pyL = leftBot[1] + (leftTarget[1] - leftBot[1]) * u
                const pxR = rightBot[0] + (rightTarget[0] - rightBot[0]) * u
                const pyR = rightBot[1] + (rightTarget[1] - rightBot[1]) * u
                nodes.push(
                    dot(5.4, '#ffffff').at(pxL, pyL).glow(12, '#5ce1e6').opacity(Math.sin(u * Math.PI) * a).set('blend', 'screen'),
                    dot(5.4, '#ffffff').at(pxR, pyR).glow(12, '#ff6b8b').opacity(Math.sin(u * Math.PI) * a).set('blend', 'screen'),
                )
            }
        }
        return group(...nodes)
    })

    const gcdTop = group(
        txt('PERIOD r = 4 UNLOCKS THE FACTORS', 0, -395, 26, '#ffd166', 'mono'),
        tex(String.raw`a^{r/2} \;=\; 7^{4/2} \;=\; 7^2 \;=\; 49`, { size: 58, color: '#f8f4ec' })
            .at(0, -264)
            .glow(6, '#7c8cff'),
    )

    const gcdLeft = group(
        txt('49 − 1 = 48', -430, -44, 36, '#5ce1e6', 'mono'),
        rect(252, 46, { fill: '#5ce1e61c', stroke: '#5ce1e6', width: 2.0, radius: 23 }).at(-430, 14).glow(6, '#38bdf8'),
        txt('48 = 3 × 16', -430, 16, 26, '#d9fbff', 'mono'),
        tex(String.raw`\gcd(48,\; 15) = 3`, { size: 48, color: '#5ce1e6' }).at(-430, 96).glow(8, '#38bdf8'),
    )

    const gcdRight = group(
        txt('49 + 1 = 50', 430, -44, 36, '#ff8fab', 'mono'),
        rect(252, 46, { fill: '#ff6b8b1c', stroke: '#ff8fab', width: 2.0, radius: 23 }).at(430, 14).glow(6, '#ff6b8b'),
        txt('50 = 5 × 10', 430, 16, 26, '#ffe0e9', 'mono'),
        tex(String.raw`\gcd(50,\; 15) = 5`, { size: 48, color: '#ff8fab' }).at(430, 96).glow(8, '#ff6b8b'),
    )

    const gcdResult = group(
        tex(String.raw`3 \times 5 \;=\; 15`, { size: 68, color: '#ffd166' }).at(0, 266).glow(10, '#ffd166'),
        txt('Factoring collapses into finding one hidden period', 0, 384, 30, '#cbd5e8', 'sans'),
    )

    s.add(livePillars, topTag, modEq, periodNote, gcdVisuals)
    c.on('Compute powers', () => s.play(pillarProg.to(1, { duration: 4.2 })))
    c.on('then one', () => s.play(arcProg.to(1, { duration: 1.9 })))

    c.on('ordinary arithmetic', () => {
        s.play(showPillars.to(0, { duration: 0.3 }))
        s.play(showGcd.to(1, { duration: 0.35 }))
    })
    c.on('ordinary arithmetic', () => s.play(flowPhase.to(9.0, { duration: 15.5, ease: linear })))
    c.swap('ordinary arithmetic', [topTag, modEq, periodNote], gcdTop)
    c.on('forty-eight', () => s.play(branchProg.to(1, { duration: 1.0 })))
    c.show('forty-eight', gcdLeft)
    c.show('fifty', gcdRight)
    // Reveal bottom diagonal beams + glowing 3 x 5 = 15 factor lock simultaneously (ZERO orphan lines!)
    c.on('greatest common', () => s.play(mergeProg.to(1, { duration: 1.1 })))
    c.show('greatest common', gcdResult)
}

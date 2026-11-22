import {
    Node, circle, dot, dynamic, group, line, linearGradient, radialGradient, rect, tex,
    type IntroFunction,
} from 'vizmatic/stage'
import { HALT_MATRIX } from '../math'
import { txt } from '../../../factory/style'

const GRID = 7
const PITCH = 68
const GX = 425
const GY = 16
const HALF = ((GRID - 1) * PITCH) / 2

export const intro: IntroFunction = (stage, clock) => {
    const beam = stage.value(0.76)
    const beamGrad = linearGradient([GX - HALF, GY - HALF], [GX + HALF, GY + HALF], ['#ff6b8b', '#ffd166', '#ffffff'])

    const headers = group(
        ...Array.from({ length: GRID }, (_, i) =>
            txt(`${i + 1}`, GX - HALF + i * PITCH, GY - HALF - 52, 26, '#8ea6cf', 'mono').opacity(0.78),
        ),
        ...Array.from({ length: GRID }, (_, r) =>
            txt(`P${r + 1}`, GX - HALF - 62, GY - HALF + r * PITCH + 2, 26, '#8ea6cf', 'mono').opacity(0.78),
        ),
    )

    const formulaAccent = tex(String.raw`G \;\Longleftrightarrow\; \neg\,\mathrm{Prov}_F(\ulcorner G \urcorner)`, {
        size: 34,
        color: '#ffd166',
    })
        .at(-612, 264)
        .glow(6, '#ffd166')
        .opacity(0.92)

    stage.add(
        circle(560, {
            fill: radialGradient([0, 0], 560, [
                [0, '#ff6b8b34'],
                [0.42, '#5ce1e61e'],
                [0.72, '#4c2f8a16'],
                [1, '#07091000'],
            ]),
            stroke: null,
        })
            .at(GX, GY)
            .set('blend', 'screen'),
        txt('1931 · 1936 · LIMITS OF LOGIC', -840, -214, 26, '#ffd166', 'mono', 'left').glow(4, '#ffd166'),
        txt('Gödel & the', -848, -90, 114, '#f8f4ec', 'serif', 'left').glow(8, '#90b4ff'),
        txt('Halting Problem', -848, 38, 114, '#5ce1e6', 'serif', 'left').glow(10, '#38bdf8'),
        txt('Why no AI can prove every truth', -840, 162, 34, '#cbd5e8', 'sans', 'left'),
        formulaAccent,
        headers,
        dynamic(() => {
            const p = beam.value
            const nodes: Node[] = []
            for (let r = 0; r < GRID; r++) {
                for (let c = 0; c < GRID; c++) {
                    const x = GX - HALF + c * PITCH
                    const y = GY - HALF + r * PITCH
                    const isDiag = r === c
                    const flipped = isDiag && r / (GRID - 1) <= p
                    const truth = HALT_MATRIX[r]![c]!
                    const upperLogic = c > r
                    const glyph = flipped
                        ? truth
                            ? '∞'
                            : 'H'
                        : upperLogic
                          ? truth
                              ? '⊢'
                              : '⊬'
                          : truth
                            ? 'H'
                            : '∞'
                    const stroke = flipped ? '#ffd166' : truth ? '#3b5c8a' : '#2a375c'
                    const fill = flipped ? '#ff6b8b44' : truth ? '#122645a8' : '#0e1529a8'
                    const glyphColor = flipped
                        ? '#fff3c4'
                        : upperLogic
                          ? truth
                              ? '#6ee7e7'
                              : '#a8b5e8'
                          : truth
                            ? '#5ce1e6'
                            : '#b4a5ff'
                    nodes.push(
                        rect(54, 54, { fill, stroke, width: flipped ? 2.6 : 1.2, radius: 10 }).at(x, y),
                        txt(glyph, x, y + 2, 26, glyphColor, 'mono')
                            .opacity(flipped ? 1 : 0.78)
                            .glow(flipped ? 8 : 0, '#ffd166'),
                    )

                    if (flipped) {
                        // Additive inversion sparks radiating from each flipped diagonal cell
                        const sparkAngles = [-2.35, -0.78, 0.78, 2.35]
                        for (let s = 0; s < sparkAngles.length; s++) {
                            const ang = sparkAngles[s]! + r * 0.14
                            const r0 = 20
                            const r1 = 38 + ((r + s) % 2) * 10
                            nodes.push(
                                line(
                                    [x + Math.cos(ang) * r0, y + Math.sin(ang) * r0],
                                    [x + Math.cos(ang) * r1, y + Math.sin(ang) * r1],
                                    { stroke: s % 2 === 0 ? '#ffd166' : '#ff6b8b', width: 2.2 },
                                )
                                    .opacity(0.85)
                                    .glow(8, '#ffd166')
                                    .set('blend', 'screen'),
                            )
                        }
                        nodes.push(
                            circle(32, {
                                fill: radialGradient([0, 0], 32, [
                                    [0, '#ffd16666'],
                                    [0.6, '#ff6b8b22'],
                                    [1, '#07091000'],
                                ]),
                                stroke: null,
                            })
                                .at(x, y)
                                .set('blend', 'screen'),
                        )
                    }
                }
            }
            const x0 = GX - HALF - 26
            const y0 = GY - HALF - 26
            const x1 = x0 + (HALF * 2 + 52) * p
            const y1 = y0 + (HALF * 2 + 52) * p
            nodes.push(
                line([x0, y0], [x1, y1], { stroke: beamGrad, width: 10 })
                    .opacity(0.45)
                    .glow(18, '#ff6b8b')
                    .set('blend', 'screen'),
                line([x0, y0], [x1, y1], { stroke: beamGrad, width: 5.2 }).glow(12, '#ffd166'),
                line([x0, y0], [x1, y1], { stroke: '#ffffff', width: 1.8, opacity: 0.88 }).set('blend', 'screen'),
                circle(44, { fill: null, stroke: '#ffd166', width: 2.4 })
                    .at(x1, y1)
                    .opacity(0.72)
                    .glow(10, '#ffd166')
                    .set('blend', 'screen'),
                dot(9, '#ffffff').at(x1, y1).glow(18, '#ffd166').set('blend', 'screen'),
            )
            return group(...nodes)
        }),
    )

    stage.at(0.02, () => stage.play(beam.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

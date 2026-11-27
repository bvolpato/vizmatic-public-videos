import {
    Node, circle, dot, dynamic, group, line, linearGradient, radialGradient, rect, tex,
    type IntroFunction,
} from 'vizmatic/stage'
import { HALT_MATRIX } from '../math'
import { txt } from '../../../factory/style'

// Mirrored layout: Giant Paradox Matrix on LEFT (diagonal beam drawn BEHIND crisp legible glyphs!), Right-Aligned Editorial on RIGHT
const GRID = 7
const PITCH = 72
const GX = -395
const GY = 18
const HALF = ((GRID - 1) * PITCH) / 2

export const intro: IntroFunction = (stage, clock) => {
    const beam = stage.value(0.76)
    const beamGrad = linearGradient([GX - HALF, GY - HALF], [GX + HALF, GY + HALF], ['#ff6b8b', '#ffd166', '#ffffff'])

    const headers = group(
        ...Array.from({ length: GRID }, (_, i) =>
            txt(`${i + 1}`, GX - HALF + i * PITCH, GY - HALF - 56, 26, '#8ea6cf', 'mono').opacity(0.84),
        ),
        ...Array.from({ length: GRID }, (_, r) =>
            txt(`P${r + 1}`, GX - HALF - 64, GY - HALF + r * PITCH + 2, 26, '#8ea6cf', 'mono').opacity(0.84),
        ),
    )

    const formulaAccent = tex(String.raw`G \;\Longleftrightarrow\; \neg\,\mathrm{Prov}_F(\ulcorner G \urcorner)`, {
        size: 36,
        color: '#ffd166',
    })
        .at(612, 268)
        .glow(6, '#ffd166')
        .opacity(0.95)

    stage.add(
        circle(580, {
            fill: radialGradient([0, 0], 580, [
                [0, '#ff6b8b38'],
                [0.42, '#5ce1e620'],
                [0.72, '#4c2f8a18'],
                [1, '#07091000'],
            ]),
            stroke: null,
        })
            .at(GX, GY)
            .set('blend', 'screen'),
        txt('1931 · 1936 · LIMITS OF LOGIC', 852, -214, 26, '#ffd166', 'mono', 'right').glow(4, '#ffd166'),
        txt('Gödel & the', 858, -90, 114, '#f8f4ec', 'serif', 'right').glow(8, '#90b4ff'),
        txt('Halting Problem', 858, 38, 114, '#5ce1e6', 'serif', 'right').glow(10, '#38bdf8'),
        txt('Why no AI can prove every truth', 852, 162, 34, '#cbd5e8', 'sans', 'right'),
        formulaAccent,
        headers,
        dynamic(() => {
            const p = beam.value
            const backNodes: Node[] = []
            const cellNodes: Node[] = []
            const frontNodes: Node[] = []

            // Blazing diagonal laser slash drawn BEHIND cell interiors so every flipped H / ∞ glyph reads razor-sharp!
            const x0 = GX - HALF - 42
            const y0 = GY - HALF - 42
            const x1 = x0 + (HALF * 2 + 84) * p
            const y1 = y0 + (HALF * 2 + 84) * p
            backNodes.push(
                line([x0, y0], [x1, y1], { stroke: beamGrad, width: 16 })
                    .opacity(0.45)
                    .glow(20, '#ff6b8b')
                    .set('blend', 'screen'),
                line([x0, y0], [x1, y1], { stroke: beamGrad, width: 6.5 }).glow(14, '#ffd166'),
            )

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
                    // Opaque deep-crimson glass interior on flipped diagonal cells so the beam behind never blurs the glyph!
                    const fill = flipped ? '#2b1024f2' : truth ? '#122645d0' : '#0e1529d0'
                    const glyphColor = flipped
                        ? '#fff7d6'
                        : upperLogic
                          ? truth
                              ? '#6ee7e7'
                              : '#a8b5e8'
                          : truth
                            ? '#5ce1e6'
                            : '#b4a5ff'

                    if (flipped) {
                        const sparkAngles = [-2.35, -0.78, 0.78, 2.35]
                        for (let s = 0; s < sparkAngles.length; s++) {
                            const ang = sparkAngles[s]! + r * 0.12
                            const r0 = 32
                            const r1 = 44 + ((r + s) % 2) * 8
                            backNodes.push(
                                line(
                                    [x + Math.cos(ang) * r0, y + Math.sin(ang) * r0],
                                    [x + Math.cos(ang) * r1, y + Math.sin(ang) * r1],
                                    { stroke: s % 2 === 0 ? '#ffd166' : '#ff6b8b', width: 2.2 },
                                )
                                    .opacity(0.82)
                                    .glow(8, '#ffd166')
                                    .set('blend', 'screen'),
                            )
                        }
                    }

                    cellNodes.push(
                        rect(56, 56, { fill, stroke, width: flipped ? 3.0 : 1.3, radius: 11 })
                            .at(x, y)
                            .glow(flipped ? 10 : 0, '#ffd166'),
                        txt(glyph, x, y + 2, 28, glyphColor, 'mono')
                            .opacity(flipped ? 1 : 0.82)
                            .glow(flipped ? 6 : 0, '#ffd166'),
                    )
                }
            }

            // Leading-edge inversion ring drawn BEHIND cell faces so (P7,7) H stays 100% crisp and unobstructed!
            const tipX = GX - HALF + (HALF * 2) * p + 42
            const tipY = GY - HALF + (HALF * 2) * p + 42
            backNodes.push(
                circle(28, { fill: null, stroke: '#ffd166', width: 2.4 })
                    .at(tipX, tipY)
                    .opacity(0.75)
                    .glow(10, '#ffd166')
                    .set('blend', 'screen'),
                dot(8, '#ffffff').at(tipX, tipY).glow(16, '#ffd166').set('blend', 'screen'),
            )
            return group(...backNodes, ...cellNodes, ...frontNodes)
        }),
    )

    stage.at(0.02, () => stage.play(beam.to(1, { duration: Math.max(0.4, clock.intro - 0.08) })))
}

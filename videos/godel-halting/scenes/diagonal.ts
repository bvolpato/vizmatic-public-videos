import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, radialGradient, rect, tex,
    type SceneFunction,
} from 'vizmatic/stage'
import { HALT_MATRIX, REBEL_ROW } from '../math'
import { txt } from '../../../factory/style'

const N = 8
const PITCH = 72
const MX = -340
const MY = 32
const HALF = ((N - 1) * PITCH) / 2
const REBEL_X = 76

export const diagonal: SceneFunction = (s, c) => {
    const diagProg = s.value(0)
    const rebelProg = s.value(0)
    const shatterProg = s.value(0)

    const diagGrad = linearGradient([MX - HALF, MY - HALF], [MX + HALF, MY + HALF], ['#ffd166', '#ff6b8b'])

    const matrixHeaders = group(
        txt('Inputs j', MX, MY - HALF - 86, 26, '#9aa8c4', 'mono'),
        ...Array.from({ length: N }, (_, j) =>
            txt(`${j + 1}`, MX - HALF + j * PITCH, MY - HALF - 48, 26, '#cbd5e8', 'mono'),
        ),
        ...Array.from({ length: N }, (_, i) =>
            txt(`P${i + 1}`, MX - HALF - 58, MY - HALF + i * PITCH, 26, '#cbd5e8', 'mono'),
        ),
    )

    const liveMatrix = dynamic(() => {
        const dp = diagProg.value
        const rp = rebelProg.value
        const sp = shatterProg.value
        const nodes: Node[] = []

        for (let r = 0; r < N; r++) {
            for (let col = 0; col < N; col++) {
                const x = MX - HALF + col * PITCH
                const y = MY - HALF + r * PITCH
                const halts = HALT_MATRIX[r]![col]!
                const isDiag = r === col
                const litDiag = isDiag && dp > r / N + 0.01
                const stroke = litDiag ? '#ffd166' : halts ? '#38bdf866' : '#313d63'
                const fill = litDiag ? '#ffd16626' : halts ? '#5ce1e614' : '#0f162999'
                nodes.push(
                    rect(58, 58, { fill, stroke, width: litDiag ? 2.6 : 1.2, radius: 9 }).at(x, y),
                    txt(halts ? 'H' : '∞', x, y + 2, 28, litDiag ? '#ffd166' : halts ? '#5ce1e6' : '#818cf8', 'mono'),
                )
            }
        }

        if (dp > 0.01) {
            // Connect diagonal cell corners without ever crossing the centered glyphs
            const litCount = Math.min(N, Math.floor(dp * N + 0.35))
            for (let k = 0; k < litCount - 1; k++) {
                const xA = MX - HALF + k * PITCH + 29
                const yA = MY - HALF + k * PITCH + 29
                const xB = MX - HALF + (k + 1) * PITCH - 29
                const yB = MY - HALF + (k + 1) * PITCH - 29
                nodes.push(
                    line([xA, yA], [xB, yB], { stroke: diagGrad, width: 4.5, opacity: 0.95 }).glow(10, '#ffd166'),
                )
            }
            const headIdx = Math.max(0, Math.min(N - 1, Math.floor(dp * (N - 1))))
            const hx = MX - HALF + headIdx * PITCH + 30
            const hy = MY - HALF + headIdx * PITCH + 30
            nodes.push(dot(7, '#ffffff').at(hx, hy).glow(14, '#ffd166'))
        }

        if (rp > 0.02) {
            nodes.push(txt('D', REBEL_X, MY - HALF - 48, 30, '#ff6b8b', 'mono').glow(6, '#ff6b8b').opacity(rp))
            for (let i = 0; i < N; i++) {
                const y = MY - HALF + i * PITCH
                const local = Math.max(0, Math.min(1, rp * 1.4 - i * 0.07))
                if (local < 0.05) continue
                const dHalts = REBEL_ROW[i]!
                const edgeX = MX + HALF + 36
                nodes.push(
                    line([edgeX, y], [REBEL_X - 34, y], { stroke: '#ff6b8b', width: 2.2 })
                        .opacity(0.62 * local),
                    rect(58, 58, { fill: '#ff6b8b2c', stroke: '#ff6b8b', width: 2.2, radius: 9 })
                        .at(REBEL_X, y)
                        .opacity(local),
                    txt(dHalts ? 'H' : '∞', REBEL_X, y + 2, 28, dHalts ? '#ffd166' : '#ff6b8b', 'mono')
                        .opacity(local),
                )
            }
        }

        if (sp > 0.02) {
            const cx = REBEL_X
            const cy = MY + HALF + 78
            for (let k = 0; k < 3; k++) {
                const phase = (sp * 1.6 + k * 0.33) % 1
                const rad = 14 + phase * 34
                const op = (1 - phase) * 0.85
                nodes.push(
                    circle(rad, { fill: null, stroke: k % 2 === 0 ? '#ff6b8b' : '#ffd166', width: 3 })
                        .at(cx, cy)
                        .opacity(op)
                        .glow(10, '#ff6b8b'),
                )
            }
            nodes.push(
                circle(54, {
                    fill: radialGradient([0, 0], 54, [
                        [0, '#ff6b8b60'],
                        [0.5, '#ffd16626'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                }).at(cx, cy),
                dot(9.5, '#ffffff').at(cx, cy).glow(18, '#ff6b8b'),
                txt('D(D) ?', cx - 102, cy + 4, 28, '#ffd166', 'mono').glow(6, '#ff6b8b'),
            )
        }

        return group(...nodes)
    })

    const rightIntro = group(
        txt('1936 · ALAN TURING', 210, -345, 26, '#ffd166', 'mono', 'left'),
        txt('The Halting', 205, -268, 66, '#f8f4ec', 'serif', 'left'),
        txt('Matrix', 205, -196, 66, '#5ce1e6', 'serif', 'left').glow(6, '#38bdf8'),
        txt('H  =  program halts', 210, -110, 28, '#5ce1e6', 'mono', 'left'),
        txt('∞  =  loops forever', 210, -64, 28, '#818cf8', 'mono', 'left'),
    )

    const rebelRules = group(
        txt('Rebel Machine D(P)', 210, 22, 40, '#ff6b8b', 'serif', 'left').glow(6, '#ff6b8b'),
        txt('P(P) halts  →  D loops', 210, 82, 28, '#f8f4ec', 'sans', 'left'),
        txt('P(P) loops  →  D halts', 210, 128, 28, '#ffd166', 'sans', 'left'),
    )

    const paradoxPunch = group(
        tex(String.raw`D(D)\text{ halts} \iff D(D)\text{ loops}`, {
            size: 40,
            color: '#ffd166',
        }).at(515, 232).glow(8, '#ff6b8b'),
        txt('CONTRADICTION — NO ORACLE EXISTS', 210, 315, 28, '#ff6b8b', 'mono', 'left').glow(6, '#ff6b8b'),
    )

    s.add(matrixHeaders, liveMatrix, rightIntro)
    c.on('glowing diagonal', () => s.play(diagProg.to(1, { duration: 2.2 })))
    c.on('rebel machine', () => s.play(rebelProg.to(1, { duration: 2.4 })))
    c.show('rebel machine', rebelRules)
    c.on('feed D its own', () => s.play(shatterProg.to(3.0, { duration: 7.5, ease: linear })))
    c.show('shatters the table', paradoxPunch)
}

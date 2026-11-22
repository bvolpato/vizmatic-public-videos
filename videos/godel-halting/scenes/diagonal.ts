import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, rect, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { HALT_MATRIX, REBEL_ROW } from '../math'
import { txt } from '../../../factory/style'

const N = 8
const PITCH = 72
const MX = -345
const MY = 32
const HALF = ((N - 1) * PITCH) / 2
const REBEL_X = 78

export const diagonal: SceneFunction = (s, c) => {
    const diagProg = s.value(0)
    const rebelProg = s.value(0)
    const shatterProg = s.value(0)

    const diagGrad = linearGradient([MX - HALF, MY - HALF], [MX + HALF, MY + HALF], ['#ffd166', '#ff6b8b'])

    const matrixHeaders = group(
        txt('Inputs j', MX, MY - HALF - 86, 26, '#a9bad8', 'mono'),
        ...Array.from({ length: N }, (_, j) =>
            txt(`${j + 1}`, MX - HALF + j * PITCH, MY - HALF - 48, 26, '#d6e1f5', 'mono'),
        ),
        ...Array.from({ length: N }, (_, i) =>
            txt(`P${i + 1}`, MX - HALF - 58, MY - HALF + i * PITCH, 26, '#d6e1f5', 'mono'),
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
                const stroke = litDiag ? '#ffd166' : halts ? '#4ad4ee88' : '#4a5c94'
                const fill = litDiag ? '#ffd1662c' : halts ? '#5ce1e61a' : '#141e38bb'
                const glyphColor = litDiag ? '#ffd166' : halts ? '#6ef0f5' : '#c4b5fd'
                nodes.push(
                    rect(58, 58, { fill, stroke, width: litDiag ? 2.8 : 1.4, radius: 9 }).at(x, y),
                    txt(halts ? 'H' : '∞', x, y + 2, 28, glyphColor, 'mono').glow(litDiag ? 6 : halts ? 2 : 3, glyphColor),
                )
            }
        }

        if (dp > 0.01) {
            // Connect diagonal cell corners without crossing centered glyphs
            const litCount = Math.min(N, Math.floor(dp * N + 0.35))
            for (let k = 0; k < litCount - 1; k++) {
                const xA = MX - HALF + k * PITCH + 29
                const yA = MY - HALF + k * PITCH + 29
                const xB = MX - HALF + (k + 1) * PITCH - 29
                const yB = MY - HALF + (k + 1) * PITCH - 29
                nodes.push(
                    line([xA, yA], [xB, yB], { stroke: diagGrad, width: 5, opacity: 0.96 })
                        .glow(10, '#ffd166')
                        .set('blend', 'screen'),
                )
            }
            const headIdx = Math.max(0, Math.min(N - 1, Math.floor(dp * (N - 1))))
            const hx = MX - HALF + headIdx * PITCH + 30
            const hy = MY - HALF + headIdx * PITCH + 30
            nodes.push(dot(7.5, '#ffffff').at(hx, hy).glow(16, '#ffd166').set('blend', 'screen'))
        }

        if (rp > 0.02) {
            nodes.push(txt('D', REBEL_X, MY - HALF - 48, 32, '#ff8fab', 'mono').glow(8, '#ff6b8b').opacity(rp))
            for (let i = 0; i < N; i++) {
                const y = MY - HALF + i * PITCH
                const local = Math.max(0, Math.min(1, rp * 1.4 - i * 0.07))
                if (local < 0.05) continue
                const dHalts = REBEL_ROW[i]!
                const xStart = MX + HALF + 32
                const xEnd = REBEL_X - 33
                const archLift = -14 - (i % 2) * 4
                const arcPts: Vec[] = Array.from({ length: 18 }, (_, j) => {
                    const u = j / 17
                    const ax = xStart + (xEnd - xStart) * u
                    const ay = y + Math.sin(u * Math.PI) * archLift
                    return [ax, ay] as Vec
                })
                nodes.push(
                    new Node(polyPath(arcPts))
                        .stroke('#ff6b8b', 3.4, 0.88 * local)
                        .glow(8, '#ff6b8b')
                        .set('blend', 'screen'),
                    dot(3.8, '#ffd166').at(xEnd - 2, y - 1).glow(8, '#ff6b8b').opacity(0.9 * local).set('blend', 'screen'),
                    rect(58, 58, { fill: '#ff6b8b34', stroke: '#ff8fab', width: 2.5, radius: 9 })
                        .at(REBEL_X, y)
                        .opacity(local),
                    txt(dHalts ? 'H' : '∞', REBEL_X, y + 2, 28, dHalts ? '#ffd166' : '#ff99b8', 'mono')
                        .glow(5, dHalts ? '#ffd166' : '#ff6b8b')
                        .opacity(local),
                )
            }
        }

        if (sp > 0.02) {
            const cx = REBEL_X
            const cy = MY + HALF + 78
            const pillVis = Math.min(1, sp * 2.2)
            for (let k = 0; k < 3; k++) {
                const phase = (sp * 1.6 + k * 0.33) % 1
                const rad = 14 + phase * 38
                const op = (1 - phase) * 0.9
                nodes.push(
                    circle(rad, { fill: null, stroke: k % 2 === 0 ? '#ff6b8b' : '#ffd166', width: 3.2 })
                        .at(cx, cy)
                        .opacity(op)
                        .glow(12, '#ff6b8b')
                        .set('blend', 'screen'),
                )
            }
            nodes.push(
                circle(60, {
                    fill: radialGradient([0, 0], 60, [
                        [0, '#ff6b8b70'],
                        [0.5, '#ffd16632'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                })
                    .at(cx, cy)
                    .set('blend', 'screen'),
                dot(9.5, '#ffffff').at(cx, cy).glow(18, '#ff6b8b').set('blend', 'screen'),
                txt('D(D) ?', cx - 106, cy + 4, 28, '#ffd166', 'mono').glow(6, '#ff6b8b'),
                // Crisp glowing contradiction pill badge filling bottom-right when D(D) fires!
                rect(468, 66, { fill: '#ff6b8b28', stroke: '#ff8fab', width: 2.8, radius: 33 })
                    .at(444, 214)
                    .glow(12, '#ff6b8b')
                    .opacity(pillVis),
                txt('H ↔ ∞   CONTRADICTION', 444, 216, 30, '#fff3c4', 'mono')
                    .glow(8, '#ff6b8b')
                    .opacity(pillVis),
            )
        }

        return group(...nodes)
    })

    const rightIntro = group(
        txt('1936 · ALAN TURING', 210, -345, 26, '#ffd166', 'mono', 'left'),
        txt('The Halting', 205, -268, 66, '#f8f4ec', 'serif', 'left'),
        txt('Matrix', 205, -196, 66, '#5ce1e6', 'serif', 'left').glow(6, '#38bdf8'),
        txt('H  =  program halts', 210, -110, 28, '#6ef0f5', 'mono', 'left'),
        txt('∞  =  loops forever', 210, -64, 28, '#c4b5fd', 'mono', 'left'),
    )

    const rebelRules = group(
        txt('Rebel Machine D(P)', 210, 20, 40, '#ff8fab', 'serif', 'left').glow(6, '#ff6b8b'),
        txt('P(P) halts  →  D loops', 210, 80, 28, '#f8f4ec', 'sans', 'left'),
        txt('P(P) loops  →  D halts', 210, 126, 28, '#ffd166', 'sans', 'left'),
    )

    const paradoxPunch = group(
        tex(String.raw`D(D)\text{ halts} \iff D(D)\text{ loops}`, {
            size: 38,
            color: '#ffd166',
        })
            .at(465, 308)
            .glow(8, '#ff6b8b'),
        txt('NO HALTING ORACLE CAN EXIST', 210, 376, 28, '#ff8fab', 'mono', 'left').glow(6, '#ff6b8b'),
    )

    s.add(matrixHeaders, liveMatrix, rightIntro)
    c.on('glowing diagonal', () => s.play(diagProg.to(1, { duration: 2.2 })))
    c.on('rebel machine', () => s.play(rebelProg.to(1, { duration: 2.4 })))
    c.show('rebel machine', rebelRules)
    c.on('feed D its own', () => s.play(shatterProg.to(3.0, { duration: 7.5, ease: linear })))
    c.show('shatters the table', paradoxPunch)
}

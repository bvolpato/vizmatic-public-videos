import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, rect,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { HALT_MATRIX } from '../math'
import { txt } from '../../../factory/style'

const N = 8
const PITCH = 68
const GX = 385
const GY = 10
const HALF = ((N - 1) * PITCH) / 2

export const hook: SceneFunction = (s, c) => {
    const pulse = s.value(0)
    const beamProg = s.value(0)
    const showLattice = s.value(1)
    const showPillars = s.value(0)
    const pillarPhase = s.value(0)

    const beamGrad = linearGradient([GX - HALF, GY - HALF], [GX + HALF, GY + HALF], ['#ff6b8b', '#ffd166', '#ffffff'])

    const shot1Title = group(
        txt('INFINITE COMPUTE?', -840, -215, 36, '#ffd166', 'mono', 'left').glow(6, '#ffd166'),
        txt('Every formal', -848, -90, 102, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('system has a', -848, 22, 102, '#f8f4ec', 'serif', 'left'),
        txt('blind spot.', -848, 134, 102, '#ff6b8b', 'serif', 'left').glow(10, '#ff6b8b'),
        txt('Proved mathematically in the 1930s', -840, 248, 32, '#b8c5df', 'sans', 'left'),
    )

    const liveLattice = dynamic(() => {
        if (showLattice.value < 0.02) return []
        const a = showLattice.value
        const t = pulse.value
        const bp = beamProg.value
        const nodes: Node[] = [
            circle(490, {
                fill: radialGradient([0, 0], 490, [
                    [0, bp > 0.1 ? '#ff6b8b28' : '#5ce1e622'],
                    [0.5, '#4c2f8a16'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(GX, GY).opacity(a),
        ]

        for (let r = 0; r < N; r++) {
            for (let col = 0; col < N; col++) {
                const x = GX - HALF + col * PITCH
                const y = GY - HALF + r * PITCH
                const isDiag = r === col
                const diagPos = r / (N - 1)
                const flipped = isDiag && bp > diagPos + 0.02
                const truth = HALT_MATRIX[r]![col]!
                const shimmer = 0.65 + 0.35 * Math.sin(t * 2.4 + r * 0.7 + col * 0.5)
                const stroke = flipped ? '#ffd166' : truth ? '#38bdf8' : '#334168'
                const fill = flipped ? '#ff6b8b40' : truth ? '#5ce1e61c' : '#10172c99'
                nodes.push(
                    rect(54, 54, { fill, stroke, width: flipped ? 2.6 : 1.3, radius: 10 })
                        .at(x, y)
                        .opacity(a * (flipped ? 1 : 0.85)),
                    dot(flipped ? 7.5 : truth ? 4.8 : 3.2, flipped ? '#ffd166' : truth ? '#5ce1e6' : '#6e7c9e')
                        .at(x, y)
                        .opacity(a * (flipped ? 1 : shimmer)),
                )
            }
        }

        if (bp > 0.01) {
            const x0 = GX - HALF - 22
            const y0 = GY - HALF - 22
            const x1 = x0 + (HALF * 2 + 44) * bp
            const y1 = y0 + (HALF * 2 + 44) * bp
            const ringR = 18 + ((bp * 5) % 1) * 95
            const ringOp = (1 - ((bp * 5) % 1)) * 0.7 * a
            nodes.push(
                line([x0, y0], [x1, y1], { stroke: beamGrad, width: 6 }).glow(14, '#ff6b8b').opacity(a),
                line([x0, y0], [x1, y1], { stroke: '#ffffff', width: 1.8 }).opacity(0.75 * a),
                circle(ringR, { fill: null, stroke: '#ffd166', width: 2.4 }).at(x1, y1).opacity(ringOp).glow(8, '#ffd166'),
                dot(9, '#ffffff').at(x1, y1).glow(16, '#ffd166').opacity(a),
            )
        }
        return group(...nodes)
    })

    const shot2Copy = group(
        txt('Two proofs. One diagonal trap.', 0, -345, 66, '#ffd166', 'serif').glow(8, '#ffd166'),
        txt('1931 · Kurt Gödel', -465, -135, 44, '#5ce1e6', 'serif').glow(6, '#38bdf8'),
        txt('Incompleteness', -465, -70, 34, '#f8f4ec', 'sans'),
        txt('Truth outruns proof', -465, -15, 28, '#9aa8c4', 'sans'),
        txt('1936 · Alan Turing', 465, -135, 44, '#ff6b8b', 'serif').glow(6, '#ff6b8b'),
        txt('Halting Problem', 465, -70, 34, '#f8f4ec', 'sans'),
        txt('Logic turns on itself', 465, -15, 28, '#9aa8c4', 'sans'),
        txt('Every formal system and algorithm hits the same boundary', 0, 345, 32, '#cbd5e8', 'sans'),
    )

    const livePillars = dynamic(() => {
        if (showPillars.value < 0.02) return []
        const a = showPillars.value
        const ph = pillarPhase.value
        const bridgeGrad = linearGradient([-320, 120], [320, -120], ['#5ce1e6', '#a78bfa', '#ff6b8b', '#ffd166'])
        const pts: Vec[] = Array.from({ length: 80 }, (_, i) => {
            const u = -1 + (2 * i) / 79
            const x = u * 310
            const y = 75 + Math.sin(u * Math.PI * 1.5 + ph * 2.2) * 58 * (1 - 0.35 * Math.abs(u))
            return [x, y] as Vec
        })
        const waveR = 26 + ((ph * 0.7) % 1) * 190
        const waveOp = (1 - ((ph * 0.7) % 1)) * 0.55 * a
        return group(
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#ffd16622'],
                    [0.5, '#5ce1e610'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, 75).opacity(a),
            line([-465, 55], [-465, 255], { stroke: '#5ce1e6', width: 4 }).glow(10, '#5ce1e6').opacity(0.85 * a),
            line([465, 55], [465, 255], { stroke: '#ff6b8b', width: 4 }).glow(10, '#ff6b8b').opacity(0.85 * a),
            new Node(polyPath(pts)).stroke(bridgeGrad, 4.5, 0.92 * a).glow(10, '#ffd166'),
            new Node(polyPath(pts)).stroke('#ffffff', 1.3, 0.38 * a),
            circle(waveR, { fill: null, stroke: '#ffd166', width: 2.2 }).at(0, 75).opacity(waveOp).glow(8, '#ffd166'),
            dot(8, '#ffffff').at(0, 75).glow(14, '#ffd166').opacity(a),
        )
    })

    s.add(liveLattice, shot1Title, livePillars)
    c.at(0.05, () => s.play(pulse.to(6.0, { duration: 10.0, ease: linear })))
    c.on('answer is no', () => s.play(beamProg.to(1, { duration: 2.4 })))
    c.on('diagonal paradox', () => {
        s.play(showLattice.to(0, { duration: 0.25 }))
        s.play(showPillars.to(1, { duration: 0.3 }))
        s.play(pillarPhase.to(4.2, { duration: 4.0, ease: linear }))
    })
    c.swap('diagonal paradox', shot1Title, shot2Copy)
}

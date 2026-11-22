import {
    Node, circle, dot, dynamic, group, line, linearGradient, polyPath, radialGradient, rect, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { MOD_SEQUENCE } from '../math'
import { txt } from '../../../factory/style'

const COUNT = 16
const BASE_Y = 205
const LEFT_X = -750
const STEP_X = 100

const RES_COLOR: Record<number, string> = {
    1: '#ffd166',
    7: '#5ce1e6',
    4: '#a78bfa',
    13: '#ff6b8b',
}

export const period: SceneFunction = (s, c) => {
    const pillarProg = s.value(0.06)
    const arcProg = s.value(0)
    const showPillars = s.value(1)
    const showGcd = s.value(0)

    const topTag = txt("SHOR'S REDUCTION · N = 15, a = 7", 0, -395, 26, '#ffd166', 'mono')
    const modEq = tex(String.raw`f(x) = 7^x \bmod 15`, { size: 54, color: '#f8f4ec' })
        .at(0, -310)
        .glow(6, '#7c8cff')

    const livePillars = dynamic(() => {
        if (showPillars.value < 0.02) return []
        const a = showPillars.value
        const pp = pillarProg.value
        const ap = arcProg.value
        const nodes: Node[] = [
            line([LEFT_X - 55, BASE_Y], [LEFT_X + (COUNT - 1) * STEP_X + 55, BASE_Y], { stroke: '#29375a', width: 2 })
                .opacity(a),
        ]

        for (let i = 0; i < COUNT; i++) {
            const val = MOD_SEQUENCE[i]!
            const col = RES_COLOR[val] ?? '#5ce1e6'
            const x = LEFT_X + i * STEP_X
            const local = Math.max(0, Math.min(1, pp * 1.5 - i * 0.032))
            const h = Math.max(12, (val / 13) * 285 * local)
            const topY = BASE_Y - h
            const grad = linearGradient([x, BASE_Y], [x, topY], ['#141c38', col])
            nodes.push(
                rect(46, h, { fill: grad, stroke: col, width: 2, radius: 7 })
                    .at(x, BASE_Y - h / 2)
                    .opacity(0.9 * a),
                dot(5.2, '#ffffff').at(x, topY).glow(8, col).opacity(a * local),
                txt(`${val}`, x, topY - 30, 26, col, 'mono').opacity(a * local),
            )
            if (i % 4 === 0) {
                nodes.push(txt(`x=${i}`, x, BASE_Y + 42, 26, '#ffd166', 'mono').opacity(a))
            }
        }

        // Glowing golden period arches linking x = 0 -> 4 -> 8 -> 12 (r = 4)
        if (ap > 0.02) {
            const archTopY = BASE_Y - 352
            for (let k = 0; k < 3; k++) {
                const seg = Math.max(0, Math.min(1, ap * 3 - k))
                if (seg < 0.02) continue
                const x0 = LEFT_X + k * 4 * STEP_X
                const x1 = LEFT_X + (k + 1) * 4 * STEP_X
                const steps = Math.max(2, Math.floor(32 * seg))
                const pts: Vec[] = Array.from({ length: steps }, (_, j) => {
                    const u = j / 31
                    const px = x0 + (x1 - x0) * u
                    const py = BASE_Y - 92 - Math.sin(u * Math.PI) * 260
                    return [px, py] as Vec
                })
                nodes.push(
                    new Node(polyPath(pts)).stroke('#ffd166', 3.4, 0.9 * a).glow(8, '#ffd166'),
                )
                if (seg > 0.7) {
                    nodes.push(
                        txt('r = 4', (x0 + x1) / 2, archTopY - 28, 28, '#ffd166', 'mono')
                            .glow(6, '#ffd166')
                            .opacity(a * Math.min(1, (seg - 0.7) * 3.3)),
                    )
                }
            }
        }

        return group(...nodes)
    })

    const periodNote = txt('Sequence 1, 7, 4, 13 repeats cleanly with period r = 4', 0, 355, 32, '#cbd5e8', 'sans')

    // Beat 1: Classical arithmetic finishes the factorization
    const gcdAura = dynamic(() => {
        if (showGcd.value < 0.02) return []
        const a = showGcd.value
        return group(
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ffd16622'],
                    [0.5, '#5ce1e614'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, 60).opacity(a),
            line([0, -172], [-420, -68], { stroke: '#5ce1e6', width: 3.2 }).glow(6, '#38bdf8').opacity(0.85 * a),
            line([0, -172], [420, -68], { stroke: '#ff6b8b', width: 3.2 }).glow(6, '#ff6b8b').opacity(0.85 * a),
            line([-420, 146], [-115, 245], { stroke: '#5ce1e6', width: 2.8 }).opacity(0.7 * a),
            line([420, 146], [115, 245], { stroke: '#ff6b8b', width: 2.8 }).opacity(0.7 * a),
        )
    })

    const gcdTop = group(
        txt('PERIOD r = 4 UNLOCKS THE FACTORS', 0, -375, 26, '#ffd166', 'mono'),
        tex(String.raw`a^{r/2} \;=\; 7^{4/2} \;=\; 7^2 \;=\; 49`, { size: 58, color: '#f8f4ec' })
            .at(0, -248)
            .glow(6, '#7c8cff'),
    )

    const gcdLeft = group(
        txt('49 − 1 = 48', -420, -18, 38, '#5ce1e6', 'mono'),
        tex(String.raw`\gcd(48,\; 15) = 3`, { size: 50, color: '#5ce1e6' }).at(-420, 82).glow(8, '#38bdf8'),
    )

    const gcdRight = group(
        txt('49 + 1 = 50', 420, -18, 38, '#ff6b8b', 'mono'),
        tex(String.raw`\gcd(50,\; 15) = 5`, { size: 50, color: '#ff6b8b' }).at(420, 82).glow(8, '#ff6b8b'),
    )

    const gcdResult = group(
        tex(String.raw`15 \;=\; 3 \times 5`, { size: 74, color: '#ffd166' }).at(0, 268).glow(10, '#ffd166'),
        txt('Factoring collapses into finding one hidden period', 0, 376, 30, '#b5c1d8', 'sans'),
    )

    s.add(livePillars, topTag, modEq, periodNote, gcdAura)
    c.on('Compute powers', () => s.play(pillarProg.to(1, { duration: 4.5 })))
    c.on('repeats with period four', () => s.play(arcProg.to(1, { duration: 2.0 })))

    c.on('ordinary arithmetic', () => {
        s.play(showPillars.to(0, { duration: 0.3 }))
        s.play(showGcd.to(1, { duration: 0.35 }))
    })
    c.swap('ordinary arithmetic', [topTag, modEq, periodNote], gcdTop)
    c.show('forty-eight', gcdLeft)
    c.show('fifty', gcdRight)
    c.show('three and five', gcdResult)
}

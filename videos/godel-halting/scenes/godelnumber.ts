import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, rect, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { PRIMES, SAMPLE_EXPONENTS, SAMPLE_GODEL_NUMBER, SAMPLE_SYMBOLS } from '../math'
import { txt } from '../../../factory/style'

const TOWER_XS = [-540, -270, 0, 270, 540] as const
const TOWER_COLS = ['#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'] as const
const BASE_Y = 200
const FLOOR_H = 44

export const godelnumber: SceneFunction = (s, c) => {
    const towerGrow = s.value(0.08)
    const showTowers = s.value(1)
    const showMirror = s.value(0)
    const loopPhase = s.value(0)

    const headerTag = txt('GÖDEL NUMBERING · 1931', 0, -395, 26, '#ffd166', 'mono')
    const encodeFormula = tex(
        String.raw`g(\Phi) = 2^{s_1} \cdot 3^{s_2} \cdot 5^{s_3} \cdot 7^{s_4} \cdot 11^{s_5}`,
        { size: 54, color: '#f8f4ec' },
    ).at(0, -305).glow(6, '#7c8cff')

    const liveTowers = dynamic(() => {
        if (showTowers.value < 0.02) return []
        const a = showTowers.value
        const g = towerGrow.value
        const nodes: Node[] = [
            line([-720, BASE_Y], [720, BASE_Y], { stroke: '#2c3b5e', width: 2 }).opacity(0.9 * a),
        ]

        for (let i = 0; i < SAMPLE_EXPONENTS.length; i++) {
            const x = TOWER_XS[i]!
            const exp = SAMPLE_EXPONENTS[i]!
            const prime = PRIMES[i]!
            const sym = SAMPLE_SYMBOLS[i]!
            const col = TOWER_COLS[i]!
            const localP = Math.max(0, Math.min(1, (g * 1.45) - i * 0.11))
            const h = Math.max(12, exp * FLOOR_H * localP)
            const topY = BASE_Y - h

            const grad = linearGradient([x, BASE_Y], [x, topY], ['#141c38', col])
            nodes.push(
                rect(112, h, { fill: grad, stroke: col, width: 2.2, radius: 10 })
                    .at(x, BASE_Y - h / 2)
                    .opacity(0.88 * a),
            )

            // Illuminated floor ticks equal to the prime exponent
            for (let f = 1; f < exp; f++) {
                const fy = BASE_Y - f * FLOOR_H * localP
                nodes.push(
                    line([x - 42, fy], [x + 42, fy], { stroke: '#ffffff', width: 1.3 })
                        .opacity(0.32 * a * localP),
                )
            }

            nodes.push(
                dot(6, '#ffffff').at(x, topY).glow(10, col).opacity(a * localP),
                txt(sym, x, topY - 46, 42, '#f8f4ec', 'mono').glow(6, col).opacity(a),
                txt(`code ${exp}`, x, topY - 94, 26, '#9aa8c4', 'mono').opacity(a * localP),
                txt(`${prime}^${exp}`, x, BASE_Y + 46, 32, col, 'mono').glow(5, col).opacity(a),
            )
        }
        return group(...nodes)
    })

    const uniqueProduct = group(
        txt(
            `Unique integer = ${SAMPLE_GODEL_NUMBER.toLocaleString('en-US')}`,
            0,
            345,
            38,
            '#5ce1e6',
            'mono',
        ).glow(6, '#38bdf8'),
        txt('Unique prime factorization decodes every symbol back cleanly', 0, 402, 28, '#b5c1d8', 'sans'),
    )

    // Beat 1: Self-reference mirror & Gödel sentence G
    const liveMirror = dynamic(() => {
        if (showMirror.value < 0.02) return []
        const a = showMirror.value
        const ph = loopPhase.value
        const loopGrad = linearGradient([-520, 340], [520, 340], ['#5ce1e6', '#a78bfa', '#ffd166', '#ff6b8b'])
        const pts: Vec[] = Array.from({ length: 140 }, (_, i) => {
            const u = (2 * Math.PI * i) / 139
            const rx = 500
            const ry = 54
            const x = rx * Math.sin(u + ph * 0.25)
            const y = 340 + ry * Math.sin(u + ph * 0.25) * Math.cos(u + ph * 0.25) * 1.45
            return [x, y] as Vec
        })
        const sparkIdx = Math.floor(((ph * 22) % 139 + 139) % 139)
        const spark = pts[sparkIdx]!
        return group(
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#ffd16620'],
                    [0.5, '#7c8cff12'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, -160).opacity(a),
            new Node(polyPath(pts)).stroke(loopGrad, 3.6, 0.72 * a).glow(8, '#ffd166'),
            dot(7, '#ffffff').at(spark[0], spark[1]).glow(14, '#ffd166').opacity(0.95 * a),
        )
    })

    const selfRefCore = group(
        txt('ARITHMETIC SPEAKS ABOUT ITSELF', 0, -355, 26, '#ffd166', 'mono'),
        tex(String.raw`G \;\Longleftrightarrow\; \neg\,\mathrm{Prov}_F(\ulcorner G \urcorner)`, {
            size: 64,
            color: '#ffd166',
        }).at(0, -195).glow(8, '#ffd166'),
        txt('“I am not provable in formal system F.”', 0, -78, 40, '#f8f4ec', 'serif'),
    )

    const branchFalse = group(
        line([-680, 68], [-680, 240], { stroke: '#ff6b8b', width: 4.5 }).glow(8, '#ff6b8b'),
        txt('IF G WERE FALSE', -640, 92, 32, '#ff6b8b', 'mono', 'left').glow(5, '#ff6b8b'),
        txt('Then F proves a false statement.', -640, 152, 30, '#f8f4ec', 'sans', 'left'),
        txt('System F collapses into contradiction.', -640, 206, 28, '#cbd5e8', 'sans', 'left'),
    )

    const branchTrue = group(
        line([85, 68], [85, 240], { stroke: '#5ce1e6', width: 4.5 }).glow(8, '#5ce1e6'),
        txt('SO G MUST BE TRUE', 125, 92, 32, '#5ce1e6', 'mono', 'left').glow(5, '#38bdf8'),
        txt('Yet no finite proof in F reaches it.', 125, 152, 30, '#f8f4ec', 'sans', 'left'),
        txt('Every consistent system is incomplete.', 125, 206, 28, '#ffd166', 'sans', 'left'),
    )

    s.add(liveTowers, headerTag, encodeFormula, liveMirror)
    c.on('raise consecutive primes', () => s.play(towerGrow.to(1, { duration: 4.2 })))
    c.show('unique skyscraper', uniqueProduct)

    c.on('talk about its own proofs', () => {
        s.play(showTowers.to(0, { duration: 0.3 }))
        s.play(showMirror.to(1, { duration: 0.35 }))
        s.play(loopPhase.to(6.0, { duration: 12.0, ease: linear }))
    })
    c.swap('talk about its own proofs', [headerTag, encodeFormula, uniqueProduct], selfRefCore)
    c.show('G were false', branchFalse)
    c.show('G must be true', branchTrue)
}

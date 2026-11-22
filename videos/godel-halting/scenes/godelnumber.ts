import {
    Node, circle, curve3d, dot, dynamic, group, line, linear, linearGradient, parametricSurface, point3d, polyPath,
    radialGradient, rect, scene3d, tex,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { PRIMES, SAMPLE_EXPONENTS, SAMPLE_GODEL_NUMBER, SAMPLE_SYMBOLS } from '../math'
import { txt } from '../../../factory/style'

const TOWER_XS = [-560, -280, 0, 280, 560] as const
const TOWER_COLS = ['#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'] as const
const BASE_Y = 104
const FLOOR_H = 38
const CRYSTAL_Y = 304

function torusKnotPoint(u: number, phase = 0): Vec3 {
    const t = u + phase
    const R = 1.68
    const r = 0.56
    const p = 2
    const q = 3
    const rad = R + r * Math.cos(q * t)
    return [rad * Math.cos(p * t), rad * Math.sin(p * t), r * Math.sin(q * t) * 1.35]
}

export const godelnumber: SceneFunction = (s, c) => {
    const towerGrow = s.value(0.08)
    const productProg = s.value(0)
    const particlePhase = s.value(0)
    const showTowers = s.value(1)
    const showMirror = s.value(0)
    const rightHighlight = s.value(0.55)

    const headerTag = txt('GÖDEL NUMBERING · 1931', 0, -424, 26, '#ffd166', 'mono')
    const encodeFormula = tex(
        String.raw`g(\Phi) = 2^{s_1} \cdot 3^{s_2} \cdot 5^{s_3} \cdot 7^{s_4} \cdot 11^{s_5}`,
        { size: 52, color: '#f8f4ec' },
    )
        .at(0, -342)
        .glow(6, '#7c8cff')

    // Proper LaTeX prime-power labels & glowing multiplication signs below the baseline
    const primePowerRow = group(
        ...SAMPLE_EXPONENTS.map((exp, i) =>
            tex(String.raw`${PRIMES[i]!}^{${exp}}`, { size: 38, color: TOWER_COLS[i]! })
                .at(TOWER_XS[i]!, BASE_Y + 54)
                .glow(6, TOWER_COLS[i]!),
        ),
        ...TOWER_XS.slice(0, -1).map((x, i) =>
            txt('×', (x + TOWER_XS[i + 1]!) / 2, BASE_Y + 54, 34, '#ffd166', 'mono')
                .glow(8, '#ffd166')
                .set('blend', 'screen'),
        ),
    )

    const liveTowers = dynamic(() => {
        if (showTowers.value < 0.02) return []
        const a = showTowers.value
        const g = towerGrow.value
        const pp = productProg.value
        const ph = particlePhase.value
        const nodes: Node[] = [
            line([-740, BASE_Y], [740, BASE_Y], { stroke: '#344872', width: 2.2 }).opacity(0.92 * a),
        ]

        for (let i = 0; i < SAMPLE_EXPONENTS.length; i++) {
            const x = TOWER_XS[i]!
            const exp = SAMPLE_EXPONENTS[i]!
            const sym = SAMPLE_SYMBOLS[i]!
            const col = TOWER_COLS[i]!
            const localP = Math.max(0, Math.min(1, g * 1.45 - i * 0.1))
            const h = Math.max(14, exp * FLOOR_H * localP)
            const topY = BASE_Y - h

            const grad = linearGradient([x, BASE_Y], [x, topY], ['#141c38', col])
            nodes.push(
                rect(112, h, { fill: grad, stroke: col, width: 2.4, radius: 10 })
                    .at(x, BASE_Y - h / 2)
                    .opacity(0.9 * a),
            )

            // Illuminated floor ticks equal to the prime exponent
            for (let f = 1; f < exp; f++) {
                const fy = BASE_Y - f * FLOOR_H * localP
                nodes.push(
                    line([x - 42, fy], [x + 42, fy], { stroke: '#ffffff', width: 1.4 }).opacity(0.36 * a * localP),
                )
            }

            nodes.push(
                dot(6.5, '#ffffff').at(x, topY).glow(12, col).opacity(a * localP).set('blend', 'screen'),
                txt(sym, x, topY - 40, 40, '#f8f4ec', 'mono').glow(6, col).opacity(a),
                txt(`code ${exp}`, x, topY - 84, 26, '#b8c7e2', 'mono').opacity(a * localP),
            )

            // Merging particle streams flowing downward into the radiant integer crystal
            if (pp > 0.02) {
                const startY = BASE_Y + 92
                const endY = CRYSTAL_Y - 38
                const streamPts: Vec[] = Array.from({ length: 28 }, (_, j) => {
                    const u = j / 27
                    const sx = x * (1 - u) * (1 - 0.15 * u)
                    const sy = startY + (endY - startY) * (u * u * (3 - 2 * u))
                    return [sx, sy] as Vec
                })
                nodes.push(
                    new Node(polyPath(streamPts))
                        .stroke(col, 2.4, 0.56 * pp * a)
                        .glow(8, col)
                        .set('blend', 'screen'),
                )
                for (let k = 0; k < 3; k++) {
                    const u = (ph * 0.85 + i * 0.19 + k / 3) % 1
                    const px = x * (1 - u) * (1 - 0.15 * u)
                    const py = startY + (endY - startY) * (u * u * (3 - 2 * u))
                    nodes.push(
                        dot(4.8, '#ffffff')
                            .at(px, py)
                            .glow(10, col)
                            .opacity(Math.sin(u * Math.PI) * pp * a)
                            .set('blend', 'screen'),
                    )
                }
            }
        }

        // Radiant integer crystal & glowing multiplied product below the baseline
        if (pp > 0.02) {
            const crystalPulse = 1 + 0.08 * Math.sin(ph * 3.2)
            const crystalPts: Vec[] = [
                [0, CRYSTAL_Y - 34 * crystalPulse],
                [28 * crystalPulse, CRYSTAL_Y],
                [0, CRYSTAL_Y + 34 * crystalPulse],
                [-28 * crystalPulse, CRYSTAL_Y],
                [0, CRYSTAL_Y - 34 * crystalPulse],
            ]
            nodes.push(
                circle(185, {
                    fill: radialGradient([0, 0], 185, [
                        [0, '#ffd16638'],
                        [0.45, '#5ce1e622'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                })
                    .at(0, CRYSTAL_Y + 18)
                    .opacity(pp * a)
                    .set('blend', 'screen'),
                new Node(polyPath(crystalPts))
                    .fill('#ffd16632', pp * a)
                    .stroke('#ffd166', 2.8, pp * a)
                    .glow(12, '#ffd166')
                    .set('blend', 'screen'),
                dot(6.5, '#ffffff').at(0, CRYSTAL_Y).glow(14, '#5ce1e6').opacity(pp * a).set('blend', 'screen'),
                txt(
                    `${SAMPLE_GODEL_NUMBER.toLocaleString('en-US')}  ·  unique prime fingerprint`,
                    0,
                    CRYSTAL_Y + 72,
                    36,
                    '#ffe082',
                    'mono',
                )
                    .glow(10, '#ffd166')
                    .opacity(pp * a),
                txt('Unique prime factorization decodes every symbol back cleanly', 0, CRYSTAL_Y + 122, 26, '#d6e2f5', 'sans')
                    .opacity(pp * a),
            )
        }
        return group(...nodes)
    })

    // Beat 1: Self-reference mirror, balanced paradox branches, & glowing 3D torus knot / Möbius loop
    const selfRefCore = group(
        txt('ARITHMETIC SPEAKS ABOUT ITSELF', 0, -408, 26, '#ffd166', 'mono').glow(4, '#ffd166'),
        tex(String.raw`G \;\Longleftrightarrow\; \neg\,\mathrm{Prov}_F(\ulcorner G \urcorner)`, {
            size: 62,
            color: '#ffd166',
        })
            .at(0, -308)
            .glow(8, '#ffd166'),
        txt('“I am not provable in formal system F.”', 0, -214, 38, '#f8f4ec', 'serif'),
    )

    // Symmetrical left & right paradox branches directly below G <=> !Prov_F(G)
    const balancedBranches = dynamic(() => {
        if (showMirror.value < 0.02) return []
        const a = showMirror.value
        const rh = rightHighlight.value
        const cardW = 680
        const cardH = 196
        const cardY = -28
        const leftX = -405
        const rightX = 405

        return group(
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, '#ffd16626'],
                    [0.45, '#7c8cff18'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            })
                .at(0, 220)
                .opacity(a)
                .set('blend', 'screen'),
            // Left paradox branch card: IF G WERE FALSE
            rect(cardW, cardH, { fill: '#171226cc', stroke: '#ff6b8b', width: 2.2, radius: 14 })
                .at(leftX, cardY)
                .opacity(0.92 * a),
            line([leftX - cardW / 2 + 24, cardY - 66], [leftX - cardW / 2 + 24, cardY + 66], {
                stroke: '#ff6b8b',
                width: 4.5,
            })
                .glow(10, '#ff6b8b')
                .opacity(a),
            txt('IF G WERE FALSE', leftX - cardW / 2 + 52, cardY - 46, 30, '#ff8fab', 'mono', 'left')
                .glow(6, '#ff6b8b')
                .opacity(a),
            txt('Then F proves a false statement.', leftX - cardW / 2 + 52, cardY + 6, 28, '#f8f4ec', 'sans', 'left').opacity(
                a,
            ),
            txt('System F collapses into contradiction.', leftX - cardW / 2 + 52, cardY + 52, 26, '#d0daf0', 'sans', 'left')
                .opacity(a),

            // Right paradox branch card: IF G WERE TRUE
            rect(cardW, cardH, { fill: '#0f1c32cc', stroke: '#5ce1e6', width: 2.2 + rh * 0.8, radius: 14 })
                .at(rightX, cardY)
                .opacity((0.68 + 0.28 * rh) * a),
            line([rightX - cardW / 2 + 24, cardY - 66], [rightX - cardW / 2 + 24, cardY + 66], {
                stroke: '#5ce1e6',
                width: 4.5,
            })
                .glow(10, '#5ce1e6')
                .opacity((0.75 + 0.25 * rh) * a),
            txt('IF G WERE TRUE', rightX - cardW / 2 + 52, cardY - 46, 30, '#5ce1e6', 'mono', 'left')
                .glow(6, '#38bdf8')
                .opacity((0.8 + 0.2 * rh) * a),
            txt('No finite proof in F can reach it.', rightX - cardW / 2 + 52, cardY + 6, 28, '#f8f4ec', 'sans', 'left')
                .opacity((0.78 + 0.22 * rh) * a),
            txt('Every consistent system is incomplete.', rightX - cardW / 2 + 52, cardY + 52, 26, '#ffd166', 'sans', 'left')
                .glow(rh > 0.7 ? 5 : 0, '#ffd166')
                .opacity((0.78 + 0.22 * rh) * a),

            // Glowing connector bridge between the two branches
            txt('⇔', 0, cardY, 42, '#ffd166', 'mono').glow(8, '#ffd166').opacity(0.9 * a),
        )
    })

    // Glowing 3D twisted Möbius / self-reference torus-knot below the balanced branches
    const knot3d = scene3d({
        theta: -0.45,
        phi: 1.06,
        distance: 8.4,
        unit: 138,
        perspective: true,
        ambient: 0.44,
        shine: 0.36,
        brightness: 1.12,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(0, 265)

    const mobiusRibbon = parametricSurface(
        (u, v) => {
            const R = 1.65
            const halfW = 0.34
            const x = (R + v * halfW * Math.cos(u / 2)) * Math.cos(u)
            const y = (R + v * halfW * Math.cos(u / 2)) * Math.sin(u)
            const z = v * halfW * Math.sin(u / 2) * 1.45
            return [x, y, z]
        },
        [0, Math.PI * 2],
        [-1, 1],
        {
            resolution: [64, 8],
            color: '#28366e',
            opacity: 0.28,
            mesh: '#a78bfa',
            meshOpacity: 0.3,
            meshWidth: 0.8,
        },
    )

    const torusKnotMain = curve3d(
        (u, t) => torusKnotPoint(u, t * 0.22),
        0,
        Math.PI * 2,
        {
            samples: 180,
            colors: ['#5ce1e6', '#a78bfa', '#ffd166', '#ff6b8b', '#5ce1e6'],
            width: 5.0,
            glow: 10,
            blend: 'screen',
            opacity: 0.96,
            animate: true,
        },
    )

    const torusKnotEdge = curve3d(
        (u, t) => {
            const [x, y, z] = torusKnotPoint(u, t * 0.22 + 0.14)
            return [x * 0.96, y * 0.96, z * 1.04]
        },
        0,
        Math.PI * 2,
        {
            samples: 140,
            color: '#ffffff',
            width: 1.5,
            glow: 6,
            blend: 'screen',
            opacity: 0.45,
            animate: true,
        },
    )

    const knotTime = s.value(0)
    knot3d.add(
        mobiusRibbon,
        torusKnotMain,
        torusKnotEdge,
        point3d(() => torusKnotPoint(knotTime.value * 1.35, 0), {
            color: '#ffffff',
            radius: 8,
            glow: 14,
            blend: 'screen',
            onTop: true,
        }),
        point3d(() => torusKnotPoint(knotTime.value * 1.35 + Math.PI, 0), {
            color: '#ffd166',
            radius: 7,
            glow: 12,
            blend: 'screen',
            onTop: true,
        }),
    )

    s.add(liveTowers, headerTag, encodeFormula, primePowerRow, balancedBranches)

    c.on('raise consecutive primes', () => s.play(towerGrow.to(1, { duration: 3.4 })))
    c.on('multiply', () => s.play(productProg.to(1, { duration: 0.85 })))
    c.on('multiply', () => s.play(particlePhase.to(8.0, { duration: 9.5, ease: linear })))

    c.on('talk about its own proofs', () => {
        s.play(showTowers.to(0, { duration: 0.3 }))
        s.play(showMirror.to(1, { duration: 0.4 }))
    })
    c.on('talk about its own proofs', () => s.play(knot3d.orbit({ theta: 1.15, phi: 0.95 }), { duration: 13.5 }))
    c.on('talk about its own proofs', () => s.play(knotTime.to(10.0, { duration: 13.5, ease: linear })))
    c.swap('talk about its own proofs', [headerTag, encodeFormula, primePowerRow], [selfRefCore, knot3d])
    c.on('G must be true', () => s.play(rightHighlight.to(1, { duration: 0.8 })))
}

import {
    Node, circle, dot, dynamic, group, line, line3d, linear, linearGradient, point3d, polyPath,
    radialGradient, scene3d,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { zeta } from '../math'
import { txt } from '../../../factory/style'

const TUNNEL_ZEROS = Array.from({ length: 42 }, (_, i) => ({
    idx: i,
    baseY: 1.5 + i * 0.72,
    col: i % 4 === 0 ? '#5ce1e6' : '#ffd166',
}))

// Precompute full 5-loop zeta spiral to bloom behind the viral finale!
const FINALE_N = 640
const FINALE_SPIRAL: Vec[] = Array.from({ length: FINALE_N }, (_, i) => {
    const t = 0.5 + (33.5 * i) / (FINALE_N - 1)
    const [re, im] = zeta(0.5, t)
    return [-40 + re * 135, -140 - im * 115] as Vec
})

export const stakes: SceneFunction = (s, c) => {
    const travel = s.value(0)
    const countExp = s.value(2)
    const showTunnel = s.value(1)
    const finaleProg = s.value(0)
    const showClosing = s.value(0)

    const liveTunnel = dynamic(() => {
        if (showTunnel.value < 0.02) return []
        const a = showTunnel.value
        const shift = travel.value
        const view = scene3d({
            theta: -Math.PI / 2 + Math.sin(shift * 0.18) * 0.12,
            phi: 1.38,
            distance: 11.5,
            unit: 170,
            perspective: true,
            fog: 0.28,
            focus: [0, 3.5, 0],
        }).at(0, 35).opacity(a)

        view.add(
            line3d([-2.4, 1.5, 0], [-2.4, 30, 0], { color: '#3b4a73', width: 1.8, opacity: 0.5 }),
            line3d([2.4, 1.5, 0], [2.4, 30, 0], { color: '#3b4a73', width: 1.8, opacity: 0.5 }),
            line3d([0, 1.5, 0], [0, 30, 0], { color: '#ffd166', width: 4.2, glow: 8, opacity: 1 }),
        )

        for (const z of TUNNEL_ZEROS) {
            let y = z.baseY - shift
            while (y < 1.5) y += 29.5
            while (y > 31) y -= 29.5
            view.add(point3d([0, y, 0.04], { color: z.col, radius: 5.5, halo: 0 }))
        }
        return view
    })

    const odometer = dynamic(() => {
        if (showTunnel.value < 0.02) return []
        const val = Math.round(Math.pow(10, countExp.value))
        const formatted = countExp.value > 12.85 ? '10,000,000,000,000+' : val.toLocaleString('en-US')
        return group(
            txt(formatted, 0, -375, 76, '#5ce1e6', 'mono').glow(8, '#38bdf8').opacity(showTunnel.value),
            txt('zeros verified on Re(s) = 1/2  —  and infinity still ahead', 0, -290, 32, '#cbd5e8', 'serif').opacity(showTunnel.value),
        )
    })

    const prizeWhisper = group(
        txt('$1,000,000  Clay Millennium Prize', 0, 345, 44, '#ffd166', 'serif').glow(6, '#ffd166'),
        txt('Every viral proof claim must survive rigorous peer review', 0, 412, 28, '#9aa8c4', 'sans'),
    )

    const finaleGrad = linearGradient([-260, -20], [320, -280], ['#5ce1e6', '#7c8cff', '#c084fc', '#ff6b8b', '#ffd166'])

    // Viral Finale: golden critical line + blooming 5-loop bioluminescent spiral + expanding shockwave!
    const liveClosing = dynamic(() => {
        if (showClosing.value < 0.02) return []
        const a = showClosing.value
        const p = finaleProg.value
        const count = Math.max(2, Math.floor(Math.min(1, p * 1.15) * FINALE_N))
        const pts = FINALE_SPIRAL.slice(0, count)
        const tip = pts[pts.length - 1]!
        const waveR = 30 + ((p * 2.2) % 1) * 260
        const waveOp = (1 - ((p * 2.2) % 1)) * 0.55 * a
        const nodes: Node[] = [
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ffd1662c'],
                    [0.45, '#7c8cff16'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, -140).opacity(a),
            circle(waveR, { fill: null, stroke: '#ffd166', width: 2.2 }).at(-40, -140).opacity(waveOp).glow(8, '#ffd166'),
            new Node(polyPath(pts)).stroke(finaleGrad, 4.2, 0.85 * a).glow(9, '#a78bfa'),
            new Node(polyPath(pts)).stroke('#ffffff', 1.1, 0.32 * a),
            line([0, -355], [0, -10], { stroke: '#ffd166', width: 4 }).glow(10, '#ffd166').opacity(a),
            dot(6.5, '#ffffff').at(tip[0], tip[1]).glow(14, '#ffd166').opacity(a),
        ]
        for (let i = 0; i < 4; i++) {
            const y = -295 + i * 74
            const col = i % 2 === 0 ? '#ffd166' : '#5ce1e6'
            nodes.push(
                circle(13, { fill: null, stroke: col, width: 2.4 }).at(0, y).opacity(0.95 * a).glow(6, col),
                dot(5.2, '#ffffff').at(0, y).opacity(a).glow(10, col),
            )
        }
        return group(...nodes)
    })

    const closingWords = group(
        txt('One line. Infinitely many zeros.', 0, 118, 74, '#f8f4ec', 'serif').glow(6, '#90b4ff'),
        txt('The hidden harmony of the primes.', 0, 208, 48, '#ffd166', 'serif').glow(8, '#ffd166'),
        txt('Bernhard Riemann  ·  1859   ·   Re(s) = 1/2', 0, 306, 28, '#8b99b8', 'mono'),
    )

    s.add(liveTunnel, odometer)
    c.at(0.1, () => s.play(travel.to(14, { duration: 15, ease: linear })))
    c.at(0.1, () => s.play(countExp.to(13, { duration: 3.5 })))
    c.show('Clay Millennium Prize', prizeWhisper)

    c.on('One line', () => {
        s.play(showTunnel.to(0, { duration: 0.3 }))
        s.play(showClosing.to(1, { duration: 0.35 }))
        s.play(finaleProg.to(1, { duration: 3.6, ease: linear }))
    })
    c.swap('One line', prizeWhisper, closingWords)
    s.add(liveClosing)
}

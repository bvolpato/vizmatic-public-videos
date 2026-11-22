import {
    Node, circle, curve3d, dot, dynamic, group, line, line3d, linear, linearGradient, point3d,
    polyPath, radialGradient, scene3d, surface,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { zeta } from '../math'
import { txt } from '../../../factory/style'

const TUNNEL_ZEROS = Array.from({ length: 42 }, (_, i) => ({
    idx: i,
    baseY: 1.5 + i * 0.72,
    col: i % 4 === 0 ? '#5ce1e6' : '#ffd166',
}))

// Deterministic starlight speedlines streaming past the viewer along the critical-strip tunnel walls
const SPEEDLINES = Array.from({ length: 24 }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1
    const lane = Math.floor(i / 2)
    return {
        x: side * (2.65 + (lane % 4) * 0.58),
        z: 0.22 + ((lane * 7) % 10) * 0.14,
        baseY: 1.5 + ((i * 2.3) % 28.5),
        len: 1.3 + (i % 3) * 0.55,
        col: i % 3 === 0 ? '#ffd166' : i % 3 === 1 ? '#5ce1e6' : '#a78bfa',
    }
})

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
            phi: 1.4,
            distance: 12.2,
            unit: 162,
            perspective: true,
            fog: 0.24,
            focus: [0, 4.0, 0.2],
        }).at(0, 82).opacity(a)

        // Translucent dark-gold critical-strip floor surface
        const floor = surface(() => 0, {
            x: [-2.4, 2.4],
            y: [1.5, 30],
            resolution: [10, 32],
            color: '#1b162a',
            mesh: '#ffd166',
            meshOpacity: 0.24,
            meshWidth: 0.85,
            opacity: 0.58,
            shaded: false,
        })

        view.add(
            floor,
            line3d([-2.4, 1.5, 0.02], [-2.4, 30, 0.02], { color: '#5ce1e6', width: 2.2, glow: 8, blend: 'screen', opacity: 0.7 }),
            line3d([2.4, 1.5, 0.02], [2.4, 30, 0.02], { color: '#5ce1e6', width: 2.2, glow: 8, blend: 'screen', opacity: 0.7 }),
            line3d([0, 1.5, 0.04], [0, 30, 0.04], { color: '#ffd166', width: 5.0, glow: 14, blend: 'screen', opacity: 1 }),
        )

        // Repeating 3D golden tunnel arches/ribs rushing toward the camera
        const archSpacing = 2.6
        const archCount = 11
        for (let k = 0; k < archCount; k++) {
            let ay = 1.8 + k * archSpacing - (shift % archSpacing)
            while (ay < 1.5) ay += archCount * archSpacing
            if (ay > 30) continue
            const isGold = k % 2 === 0
            const yArch = ay
            view.add(
                curve3d(
                    (u): Vec3 => {
                        const ang = Math.PI * u
                        return [-2.45 * Math.cos(ang), yArch, 1.38 * Math.sin(ang)]
                    },
                    0,
                    1,
                    {
                        color: isGold ? '#ffd166' : '#5ce1e6',
                        width: isGold ? 2.4 : 1.7,
                        glow: 10,
                        blend: 'screen',
                        opacity: isGold ? 0.62 : 0.42,
                        samples: 28,
                    },
                ),
            )
        }

        // Streaming starlight speedlines along the tunnel walls
        for (const sl of SPEEDLINES) {
            let sy = sl.baseY - shift * 1.45
            while (sy < 1.5) sy += 28.5
            while (sy > 30) sy -= 28.5
            view.add(
                line3d([sl.x, sy, sl.z], [sl.x, sy + sl.len, sl.z], {
                    color: sl.col,
                    width: 2.0,
                    glow: 8,
                    blend: 'screen',
                    opacity: 0.68,
                }),
            )
        }

        // Glowing zero beacons marching to infinity along Re(s) = 1/2
        for (const z of TUNNEL_ZEROS) {
            let y = z.baseY - shift
            while (y < 1.5) y += 29.5
            while (y > 31) y -= 29.5
            view.add(
                point3d([0, y, 0.07], { color: z.col, radius: 6.5, glow: 14, blend: 'screen', halo: 0 }),
            )
            if (y < 14) {
                view.add(
                    line3d([0, y, 0.07], [0, y, 0.55], { color: z.col, width: 2.0, glow: 10, blend: 'screen', opacity: 0.72 }),
                    point3d([0, y, 0.58], { color: '#ffffff', radius: 3.4, glow: 12, blend: 'screen', halo: 0 }),
                )
            }
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
        const waveOp = (1 - ((p * 2.2) % 1)) * 0.65 * a
        const nodes: Node[] = [
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ffd16634'],
                    [0.45, '#7c8cff1c'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, -140).set('blend', 'screen').opacity(a),
            circle(waveR, { fill: null, stroke: '#ffd166', width: 2.5 }).at(-40, -140).opacity(waveOp).glow(10, '#ffd166').set('blend', 'screen'),
            new Node(polyPath(pts)).stroke(finaleGrad, 4.6, 0.92 * a).glow(11, '#a78bfa').set('blend', 'screen'),
            new Node(polyPath(pts)).stroke('#ffffff', 1.2, 0.36 * a),
            line([0, -355], [0, -10], { stroke: '#ffd166', width: 4.5 }).glow(12, '#ffd166').set('blend', 'screen').opacity(a),
            dot(7, '#ffffff').at(tip[0], tip[1]).glow(16, '#ffd166').set('blend', 'screen').opacity(a),
        ]
        for (let i = 0; i < 4; i++) {
            const y = -295 + i * 74
            const col = i % 2 === 0 ? '#ffd166' : '#5ce1e6'
            nodes.push(
                circle(13, { fill: null, stroke: col, width: 2.4 }).at(0, y).opacity(0.95 * a).glow(8, col).set('blend', 'screen'),
                dot(5.5, '#ffffff').at(0, y).opacity(a).glow(12, col).set('blend', 'screen'),
            )
        }
        return group(...nodes)
    })

    const closingWords = group(
        txt('One line. Infinitely many zeros.', 0, 118, 74, '#f8f4ec', 'serif').glow(6, '#90b4ff'),
        txt('The hidden harmony of the primes.', 0, 208, 48, '#ffd166', 'serif').glow(8, '#ffd166'),
        txt('Bernhard Riemann  ·  1859   ·   Re(s) = 1/2', 0, 306, 28, '#a8b8d8', 'mono'),
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

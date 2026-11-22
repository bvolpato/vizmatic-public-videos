import {
    Node, circle, dot, dynamic, group, linear, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { type Vortex, traceStreamline } from '../math'
import { txt } from '../../../factory/style'

// Precompute serene single-eye Lamb-Oseen spiral ribbons for the closing centerpiece
const EYE_VORTEX: readonly Vortex[] = [{ x: 0, y: 0, gamma: 6.0, core: 0.52 }]

const EYE_CX = 0
const EYE_CY = -165
const EYE_SCALE = 112

const EYE_ARMS: Vec[][] = Array.from({ length: 8 }, (_, k) => {
    const ang0 = (2 * Math.PI * k) / 8
    const r0 = 0.45 + (k % 2) * 0.35
    const raw = traceStreamline(r0 * Math.cos(ang0), r0 * Math.sin(ang0), 90, 0.055, EYE_VORTEX, 0)
    // Add gentle outward spiral flare so it reads immediately as a calm luminous vortex eye
    return raw.map(([px, py], i) => {
        const grow = 1 + 0.013 * i
        return [EYE_CX + px * grow * EYE_SCALE, EYE_CY - py * grow * EYE_SCALE] as Vec
    })
})

export const finale: SceneFunction = (s, c) => {
    const sceneLen = Math.max(8, c.beats[c.beats.length - 1]!.until - c.beats[0]!.start)
    const rot = s.value(0)
    const showEq = s.value(1)
    const showClosing = s.value(0)
    const pulse = s.value(0)

    const eyeGrad = linearGradient([-260, EYE_CY + 220], [260, EYE_CY - 220], ['#5ce1e6', '#7c8cff', '#ff6b8b', '#ffd166'])

    const liveBackdrop = dynamic(() => {
        if (showEq.value < 0.02) return []
        const a = showEq.value
        const th = rot.value
        const cTh = Math.cos(th)
        const sTh = Math.sin(th)
        const nodes: Node[] = [
            circle(520, {
                fill: radialGradient([0, 0], 520, [
                    [0, '#ffd16622'],
                    [0.5, '#4c2f8a18'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, -25).opacity(a),
        ]
        for (const side of [-715, 715]) {
            for (let k = 0; k < EYE_ARMS.length; k++) {
                const pts: Vec[] = EYE_ARMS[k]!.map(([x, y]) => {
                    const dx = (x - EYE_CX) * 0.72
                    const dy = (y - EYE_CY) * 0.72
                    return [side + dx * cTh - dy * sTh, -25 + dx * sTh + dy * cTh] as Vec
                })
                nodes.push(new Node(polyPath(pts)).stroke(k % 2 === 0 ? '#5ce1e6' : '#a78bfa', 2.4, 0.42 * a).glow(6, '#38bdf8'))
            }
        }
        return group(...nodes)
    })

    const eqHero = group(
        txt('MILLENNIUM PRIZE PROBLEM #2', 0, -240, 26, '#ffd166', 'mono'),
        tex(String.raw`\partial_t \mathbf{u} + (\mathbf{u}\cdot\nabla)\mathbf{u} = -\frac{1}{\rho}\nabla p + \nu\,\Delta\mathbf{u}`, {
            size: 58,
            color: '#f8f4ec',
        }).at(0, -60).glow(7, '#90b4ff'),
        tex(String.raw`\nabla \cdot \mathbf{u} = 0`, { size: 48, color: '#5ce1e6' }).at(0, 70).glow(7, '#38bdf8'),
        txt('Aviation   ·   Weather   ·   Oceans   ·   Blood Flow', 0, 200, 30, '#cbd5e8', 'sans'),
    )

    const liveClosingEye = dynamic(() => {
        if (showClosing.value < 0.02) return []
        const a = showClosing.value
        const th = rot.value * 1.25
        const p = pulse.value
        const cTh = Math.cos(th)
        const sTh = Math.sin(th)
        const ringR = 24 + ((p * 1.8) % 1) * 190
        const ringOp = (1 - ((p * 1.8) % 1)) * 0.55 * a
        const nodes: Node[] = [
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#ffd1662c'],
                    [0.45, '#ff6b8b16'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(EYE_CX, EYE_CY).opacity(a),
            circle(ringR, { fill: null, stroke: '#ffd166', width: 2.4 }).at(EYE_CX, EYE_CY).opacity(ringOp).glow(8, '#ffd166'),
        ]
        for (let k = 0; k < EYE_ARMS.length; k++) {
            const pts: Vec[] = EYE_ARMS[k]!.map(([x, y]) => {
                const dx = x - EYE_CX
                const dy = y - EYE_CY
                return [EYE_CX + dx * cTh - dy * sTh, EYE_CY + dx * sTh + dy * cTh] as Vec
            })
            nodes.push(
                new Node(polyPath(pts)).stroke(eyeGrad, 3.6, 0.88 * a).glow(8, '#ff6b8b'),
                new Node(polyPath(pts)).stroke('#ffffff', 1.0, 0.28 * a),
            )
        }
        nodes.push(
            circle(16, { fill: null, stroke: '#ffd166', width: 2.6 }).at(EYE_CX, EYE_CY).opacity(0.95 * a).glow(8, '#ffd166'),
            dot(6.5, '#ffffff').at(EYE_CX, EYE_CY).glow(14, '#ffd166').opacity(a),
        )
        return group(...nodes)
    })

    const closingWords = group(
        txt('Smooth forever — or infinite velocity in finite time?', 0, 122, 54, '#f8f4ec', 'serif').glow(6, '#90b4ff'),
        txt('$1,000,000  Clay Millennium Prize', 0, 212, 48, '#ffd166', 'serif').glow(8, '#ffd166'),
        txt('Claude-Louis Navier  ·  George Gabriel Stokes', 0, 304, 28, '#8b99b8', 'mono'),
    )

    s.add(liveBackdrop, eqHero)
    c.at(0.1, () => s.play(rot.to(3.8, { duration: Math.max(5, sceneLen - 0.5), ease: linear })))

    c.on('Smooth forever', () => {
        s.play(showEq.to(0, { duration: 0.3 }), showClosing.to(1, { duration: 0.35 }))
    })
    c.on('Smooth forever', () => {
        s.play(pulse.to(2.5, { duration: 4.5, ease: linear }))
    })
    c.swap('Smooth forever', eqHero, closingWords)
    s.add(liveClosingEye)
}

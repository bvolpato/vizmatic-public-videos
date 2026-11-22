import {
    Node, circle, contourPaths, dot, dynamic, group, linear, linearGradient, polyPath,
    radialGradient, scalarField, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { type Vortex, traceStreamline, vortexStreamfunction, vortexVorticity } from '../math'
import { txt } from '../../../factory/style'

// Lush multi-vortex fluid nebula spanning the entire 1920x1080 closing frame!
const NEBULA_VORTICES: readonly Vortex[] = [
    { x: 0, y: 0.72, gamma: 6.4, core: 0.88 },
    { x: -3.15, y: 0.25, gamma: -4.2, core: 0.95 },
    { x: 3.15, y: 0.25, gamma: -4.2, core: 0.95 },
    { x: -1.9, y: -1.45, gamma: 3.1, core: 0.85 },
    { x: 1.9, y: -1.45, gamma: 3.1, core: 0.85 },
]

const EYE_VORTEX: readonly Vortex[] = [{ x: 0, y: 0, gamma: 6.0, core: 0.56 }]
const EYE_CX = 0
const EYE_CY = -205
const EYE_SCALE = 118

// Smoothly proportioned vortex arms that sit organically above the closing headline without hard box clips!
const EYE_ARMS: Vec[][] = Array.from({ length: 12 }, (_, k) => {
    const ang0 = (2 * Math.PI * k) / 12
    const r0 = 0.34 + (k % 3) * 0.22
    const raw = traceStreamline(r0 * Math.cos(ang0), r0 * Math.sin(ang0), 96, 0.052, EYE_VORTEX, 0)
    return raw.map(([px, py], i) => {
        const grow = 1 + 0.015 * i
        return [EYE_CX + px * grow * EYE_SCALE, EYE_CY - py * grow * EYE_SCALE] as Vec
    })
})

const NB_X = 5.4
const NB_Y = 3.05
const NB_SX = 1920 / (2 * NB_X)
const NB_SY = 1080 / (2 * NB_Y)

function nebulaVorticity(x: number, y: number): number {
    const nx = x / NB_X
    const ny = y / NB_Y
    const edge = Math.max(0, 1 - Math.pow(nx * nx * 0.75 + ny * ny * 0.75, 1.5))
    return vortexVorticity(x, y, NEBULA_VORTICES, 0) * edge
}

const NEBULA_CONTOURS = contourPaths(
    (x, y) => vortexStreamfunction(x, y, NEBULA_VORTICES, 0),
    {
        x: [-NB_X, NB_X],
        y: [-NB_Y, NB_Y],
        levels: [-1.15, -0.78, -0.45, -0.18, 0.05, 0.28, 0.55, 0.88],
        resolution: [84, 52],
    },
)

/** Split a polyline cleanly around a rectangular text-safe exclusion box so strokes frame text without crossing it. */
function splitOutsideBox(pts: readonly Vec[], xMin: number, xMax: number, yMin: number, yMax: number): Vec[][] {
    const out: Vec[][] = []
    let cur: Vec[] = []
    for (const pt of pts) {
        const blocked = pt[0] >= xMin && pt[0] <= xMax && pt[1] >= yMin && pt[1] <= yMax
        if (blocked) {
            if (cur.length >= 2) out.push(cur)
            cur = []
        } else {
            cur.push(pt)
        }
    }
    if (cur.length >= 2) out.push(cur)
    return out
}

function buildMaskedContours(xMin: number, xMax: number, yMin: number, yMax: number) {
    return group(
        ...NEBULA_CONTOURS.flatMap((lvl, li) => {
            const col = li % 3 === 0 ? '#5ce1e6' : li % 3 === 1 ? '#a78bfa' : '#ffd166'
            return lvl.paths.flatMap((poly) => {
                if (poly.length < 2) return []
                const pts: Vec[] = poly.map(([x, y]) => [x * NB_SX, -y * NB_SY] as Vec)
                return splitOutsideBox(pts, xMin, xMax, yMin, yMax).map((seg) =>
                    new Node(polyPath(seg)).stroke(col, 1.45, 0.25).set('blend', 'screen'),
                )
            })
        }),
    )
}

export const finale: SceneFunction = (s, c) => {
    const sceneLen = Math.max(8, c.beats[c.beats.length - 1]!.until - c.beats[0]!.start)
    const rot = s.value(0)
    const showEq = s.value(1)
    const showClosing = s.value(0)
    const pulse = s.value(0)

    const eyeGrad = linearGradient([-580, EYE_CY + 340], [580, EYE_CY - 340], ['#5ce1e6', '#7c8cff', '#ff6b8b', '#ffd166'])

    // Full-frame swirling scalarField fluid nebula framing the entire 16:9 finale!
    const nebulaField = scalarField(
        (x, y) => {
            const ang = rot.value * 0.12
            const ca = Math.cos(ang)
            const sa = Math.sin(ang)
            return nebulaVorticity(x * ca + y * sa, -x * sa + y * ca)
        },
        {
            x: [-NB_X, NB_X],
            y: [-NB_Y, NB_Y],
            domain: [-2.0, 2.0],
            colors: ['#5ce1e6cc', '#2563ebaa', '#1f1e5652', '#07091000', '#581c5e56', '#ff4d8dcc', '#ffd166dd'],
            width: 1920,
            height: 1080,
            resolution: [112, 68],
        },
    ).at(0, 0).set('blend', 'screen').opacity(0.9)

    // Contour backdrops cleanly framing the text zones of Shot 1 and Shot 2
    const nebulaContoursEq = buildMaskedContours(-540, 540, -285, 240)
    const nebulaContoursClosing = buildMaskedContours(-665, 665, 65, 345)

    const liveBackdrop = dynamic(() => {
        if (showEq.value < 0.02) return []
        const a = showEq.value
        const th = rot.value
        const cTh = Math.cos(th)
        const sTh = Math.sin(th)
        const nodes: Node[] = [
            circle(580, {
                fill: radialGradient([0, 0], 580, [
                    [0, '#ffd1662c'],
                    [0.5, '#4c2f8a1e'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, -25).set('blend', 'screen').opacity(a),
        ]
        for (const side of [-755, 755]) {
            for (let k = 0; k < EYE_ARMS.length; k += 2) {
                const pts: Vec[] = EYE_ARMS[k]!.map(([x, y]) => {
                    const dx = (x - EYE_CX) * 0.42
                    const dy = (y - EYE_CY) * 0.42
                    return [side + dx * cTh - dy * sTh, -25 + dx * sTh + dy * cTh] as Vec
                })
                for (const seg of splitOutsideBox(pts, -540, 540, -285, 240)) {
                    nodes.push(
                        new Node(polyPath(seg))
                            .stroke(k % 4 === 0 ? '#5ce1e6' : '#a78bfa', 2.4, 0.46 * a)
                            .glow(7, '#38bdf8')
                            .set('blend', 'screen'),
                    )
                }
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
        const th = rot.value * 1.15
        const p = pulse.value
        const cTh = Math.cos(th)
        const sTh = Math.sin(th)
        const ringR1 = 28 + ((p * 1.5) % 1) * 215
        const ringOp1 = (1 - ((p * 1.5) % 1)) * 0.65 * a
        const ringR2 = 28 + ((p * 1.5 + 0.5) % 1) * 245
        const ringOp2 = (1 - ((p * 1.5 + 0.5) % 1)) * 0.45 * a
        const nodes: Node[] = [
            circle(620, {
                fill: radialGradient([0, 0], 620, [
                    [0, '#ffd16638'],
                    [0.48, '#ff6b8b20'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(EYE_CX, EYE_CY).set('blend', 'screen').opacity(a),
            circle(ringR1, { fill: null, stroke: '#ffd166', width: 2.6 }).at(EYE_CX, EYE_CY).opacity(ringOp1).glow(10, '#ffd166').set('blend', 'screen'),
            circle(ringR2, { fill: null, stroke: '#5ce1e6', width: 2.0 }).at(EYE_CX, EYE_CY).opacity(ringOp2).glow(8, '#5ce1e6').set('blend', 'screen'),
        ]
        // Natural elliptical central vortex eye floating cleanly above the closing headline (ZERO clipped ends!)
        for (let k = 0; k < EYE_ARMS.length; k++) {
            const pts: Vec[] = EYE_ARMS[k]!.map(([x, y]) => {
                const dx = (x - EYE_CX) * 1.15
                const dy = (y - EYE_CY) * 0.74
                return [EYE_CX + dx * cTh - dy * sTh, EYE_CY + dx * sTh + dy * cTh] as Vec
            })
            const isMajor = k % 2 === 0
            nodes.push(
                new Node(polyPath(pts))
                    .stroke(eyeGrad, isMajor ? 3.8 : 2.2, (isMajor ? 0.9 : 0.54) * a)
                    .glow(isMajor ? 10 : 6, isMajor ? '#ff6b8b' : '#5ce1e6')
                    .set('blend', 'screen'),
            )
            if (isMajor) {
                nodes.push(new Node(polyPath(pts)).stroke('#ffffff', 1.0, 0.3 * a))
            }
        }
        // Flanking companion swirls in the left & right wings framing the 16:9 nebula cleanly!
        for (const side of [-760, 760]) {
            const cS = Math.cos(-th * 0.85)
            const sS = Math.sin(-th * 0.85)
            for (let k = 0; k < EYE_ARMS.length; k += 2) {
                const pts: Vec[] = EYE_ARMS[k]!.map(([x, y]) => {
                    const dx = (x - EYE_CX) * 0.44
                    const dy = (y - EYE_CY) * 0.44
                    return [side + dx * cS - dy * sS, -40 + dx * sS + dy * cS] as Vec
                })
                nodes.push(
                    new Node(polyPath(pts))
                        .stroke(k % 4 === 0 ? '#5ce1e6' : '#a78bfa', 2.2, 0.42 * a)
                        .glow(7, '#5ce1e6')
                        .set('blend', 'screen'),
                )
            }
            nodes.push(dot(5, '#5ce1e6').at(side, -40).glow(12, '#5ce1e6').set('blend', 'screen').opacity(0.8 * a))
        }
        nodes.push(
            circle(18, { fill: null, stroke: '#ffd166', width: 2.8 }).at(EYE_CX, EYE_CY).opacity(0.95 * a).glow(10, '#ffd166').set('blend', 'screen'),
            dot(7, '#ffffff').at(EYE_CX, EYE_CY).glow(16, '#ffd166').set('blend', 'screen').opacity(a),
        )
        return group(...nodes)
    })

    const closingWords = group(
        txt('Smooth forever — or infinite velocity in finite time?', 0, 122, 54, '#f8f4ec', 'serif').glow(6, '#90b4ff'),
        txt('$1,000,000  Clay Millennium Prize', 0, 212, 48, '#ffd166', 'serif').glow(8, '#ffd166'),
        txt('Claude-Louis Navier  ·  George Gabriel Stokes', 0, 304, 28, '#a8b8d8', 'mono'),
    )

    s.add(nebulaField, nebulaContoursEq, liveBackdrop, eqHero)
    c.at(0.1, () => s.play(rot.to(3.8, { duration: Math.max(5, sceneLen - 0.5), ease: linear })))

    c.on('Smooth forever', () => {
        s.play(showEq.to(0, { duration: 0.3 }), showClosing.to(1, { duration: 0.35 }))
    })
    c.on('Smooth forever', () => {
        s.play(pulse.to(2.5, { duration: 4.5, ease: linear }))
    })
    c.swap('Smooth forever', [eqHero, nebulaContoursEq], [nebulaContoursClosing, closingWords])
    s.add(liveClosingEye)
}

import {
    Node, circle, curve3d, dot, dynamic, group, line, line3d, linear, parametricSurface,
    point3d, polyPath, radialGradient, scene3d, type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

// Log10 mapping from 5 ms .. 3,000 ms onto chart X in [-560, 620]
const logX = (ms: number): number => {
    const lo = Math.log10(5)
    const hi = Math.log10(3000)
    const t = (Math.log10(ms) - lo) / (hi - lo)
    return -560 + t * 1180
}

interface IsoPoint {
    readonly name: string
    readonly sub: string
    readonly ms: number
    readonly isoY: number // higher isolation = more negative stage Y
    readonly col: string
    readonly rings: number
    readonly labelDx: number
    readonly labelDy: number
    readonly anchor: 'left' | 'center' | 'right'
}

const POINTS: readonly IsoPoint[] = [
    { name: 'Containers', sub: '~15 ms · shared kernel', ms: 15, isoY: 165, col: COSMOS.blue, rings: 1, labelDx: 68, labelDy: -4, anchor: 'left' },
    { name: 'gVisor', sub: '~60 ms · user-space sentry', ms: 60, isoY: 35, col: COSMOS.violet, rings: 2, labelDx: 76, labelDy: 8, anchor: 'left' },
    { name: 'Firecracker', sub: '~125 ms (5 ms snap) · KVM', ms: 125, isoY: -155, col: COSMOS.gold, rings: 3, labelDx: -84, labelDy: -52, anchor: 'right' },
    { name: 'Full QEMU', sub: '~2,500 ms · legacy devices', ms: 2500, isoY: -165, col: COSMOS.muted, rings: 3, labelDx: -78, labelDy: 68, anchor: 'right' },
]

export const finale: SceneFunction = (s, c) => {
    const showPlot = s.value(1)
    const highlight = s.value(0)
    const phase = s.value(0)
    const showEnd = s.value(0)

    const plotCopy = group(
        txt('ISOLATION VS STARTUP LATENCY  (LOG SCALE)', -855, -425, 26, COSMOS.gold, 'mono', 'left'),
        txt('The Hardware-Isolation Pareto Frontier', -855, -360, 56, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.cyan),
    )

    const livePlot = dynamic(() => {
        if (showPlot.value < 0.04) return []
        const a = showPlot.value
        const ph = phase.value
        const hl = highlight.value

        const yBot = 255
        const yTop = -235
        const xL = -560
        const xR = 660

        const nodes: Node[] = [
            nebula(logX(125), -155, 340, '#ffd16628', '#5ce1e614').opacity(a),
            // Axes
            line([xL, yBot], [xR, yBot], { stroke: '#3a4c78', width: 3 }).opacity(a),
            line([xL, yBot], [xL, yTop], { stroke: '#3a4c78', width: 3 }).opacity(a),
            txt('STARTUP LATENCY  (log scale: 5 ms -> 3,000 ms)', 50, 355, 26, COSMOS.muted, 'mono').opacity(a),
            txt('ISOLATION', -745, -205, 26, COSMOS.cyan, 'mono').opacity(a),
            txt('STRENGTH', -745, -168, 26, COSMOS.cyan, 'mono').opacity(a),
            txt('Dedicated', -745, -80, 26, COSMOS.emerald, 'sans').opacity(a),
            txt('kernel', -745, -44, 26, COSMOS.emerald, 'sans').opacity(a),
            txt('Shared', -745, 145, 26, COSMOS.blue, 'sans').opacity(a),
            txt('kernel', -745, 181, 26, COSMOS.blue, 'sans').opacity(a),
        ]

        // Log-scale X-axis ticks (clean axis marks so vertical lines never slice through data labels)
        for (const tickMs of [5, 20, 100, 500, 3000]) {
            const tx = logX(tickMs)
            nodes.push(
                line([tx, yBot - 10], [tx, yBot + 10], { stroke: COSMOS.muted, width: 2.5 }).opacity(a),
                txt(tickMs >= 1000 ? `${tickMs / 1000} s` : `${tickMs} ms`, tx, yBot + 42, 26, COSMOS.muted, 'mono').opacity(a),
            )
        }

        // Smooth Pareto frontier curve through Containers -> gVisor -> Firecracker -> QEMU
        const curvePts: Vec[] = [
            [logX(15), 165],
            [logX(32), 105],
            [logX(60), 35],
            [logX(85), -65],
            [logX(125), -155],
            [logX(600), -162],
            [logX(2500), -165],
        ]
        nodes.push(
            new Node(polyPath(curvePts)).stroke(COSMOS.cyan, 4, 0.78 * a).glow(10, COSMOS.cyan),
        )

        // 4 plotted runtime platforms with concentric glowing isolation-ring halos!
        for (let i = 0; i < POINTS.length; i++) {
            const pt = POINTS[i]!
            const px = logX(pt.ms)
            const py = pt.isoY
            const isHero = pt.name === 'Firecracker'
            const emphasis = Math.max(0.45, Math.min(1, hl - i * 0.7 + 1))
            const pulseR = Math.sin(ph * 2.5 + i) * 5

            for (let r = 0; r < pt.rings; r++) {
                const rad = 24 + r * 18 + (isHero ? pulseR : 0)
                nodes.push(
                    circle(rad, { fill: null, stroke: pt.col, width: isHero ? 3.2 : 2.2 })
                        .at(px, py)
                        .glow(isHero ? 12 : 6, pt.col)
                        .opacity((0.9 - r * 0.22) * emphasis * a)
                        ,
                )
            }
            nodes.push(
                dot(isHero ? 12 : 9, '#ffffff').at(px, py).glow(14, pt.col).opacity(a),
                txt(pt.name, px + pt.labelDx, py + pt.labelDy, isHero ? 34 : 28, pt.col, 'mono', pt.anchor)
                    .glow(isHero ? 8 : 0, pt.col)
                    .opacity(a),
                txt(pt.sub, px + pt.labelDx, py + pt.labelDy + 36, 26, COSMOS.muted, 'sans', pt.anchor).opacity(a),
            )
        }

        return group(...nodes)
    })

    // ── Closing 3D Hexagonal MicroVM Crystal Emblem ──
    const endAura = circle(520, {
        fill: radialGradient([0, 0], 520, [
            [0, '#5ce1e630'],
            [0.45, '#ffd1661c'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(0, -145)

    const endView = scene3d({
        theta: -0.6,
        phi: 1.02,
        distance: 13.8,
        unit: 112,
        perspective: true,
        ambient: 0.45,
        shine: 0.4,
        brightness: 1.15,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(0, -140)

    const hr = 1.4
    const hh = 0.85
    for (let i = 0; i < 6; i++) {
        const a0 = (i * Math.PI) / 3
        const a1 = ((i + 1) * Math.PI) / 3
        const b0: Vec3 = [Math.cos(a0) * hr, Math.sin(a0) * hr, -hh]
        const b1: Vec3 = [Math.cos(a1) * hr, Math.sin(a1) * hr, -hh]
        const t0: Vec3 = [Math.cos(a0) * hr, Math.sin(a0) * hr, hh]
        const t1: Vec3 = [Math.cos(a1) * hr, Math.sin(a1) * hr, hh]
        endView.add(
            parametricSurface(
                (u, v): Vec3 => [
                    (1 - u) * b0[0] + u * b1[0],
                    (1 - u) * b0[1] + u * b1[1],
                    -hh + v * (2 * hh),
                ],
                [0, 1],
                [0, 1],
                { resolution: [1, 1], color: COSMOS.cyan, opacity: 0.28, mesh: false, shaded: true },
            ),
            line3d(b0, b1, { color: COSMOS.cyan, width: 3.0, glow: 9, blend: 'screen' }),
            line3d(t0, t1, { color: COSMOS.gold, width: 3.4, glow: 10, blend: 'screen' }),
            line3d(b0, t0, { color: COSMOS.emerald, width: 2.6, glow: 8, blend: 'screen' }),
        )
    }
    endView.add(
        curve3d(
            (t): Vec3 => [Math.cos(t) * 2.35, Math.sin(t) * 2.35, Math.sin(t * 3 + phase.value) * 0.35],
            0,
            Math.PI * 2,
            { color: COSMOS.gold, width: 3.6, glow: 10, blend: 'screen', samples: 64, animate: true },
        ),
        point3d([0, 0, 0], { color: '#ffffff', radius: 11, glow: 16, blend: 'screen', onTop: true }),
    )

    const closingWords = group(
        txt('Hardware isolation at container speed.', 0, 148, 66, COSMOS.ink, 'serif').glow(6, COSMOS.cyan),
        txt('Linux KVM  ·  Rust VMM  ·  seccomp  ·  Copy-on-Write', 0, 240, 28, COSMOS.gold, 'mono'),
    )

    s.add(plotCopy, livePlot)

    const fullDur = Math.max(8, c.end - c.start - 0.15)
    c.at(0.05, () => {
        s.play(
            phase.to(fullDur * 1.1, { duration: fullDur, ease: linear }),
            highlight.to(4, { duration: 10 }),
        )
    })
    const endDur = Math.max(2.0, c.end - c.cue('Hardware isolation').start - 0.15)
    c.swap('Hardware isolation', plotCopy, [endAura, endView, closingWords])
    c.on('Hardware isolation', () => {
        s.play(
            showPlot.to(0, { duration: 0.3 }),
            showEnd.to(1, { duration: 0.4 }),
            endView.orbit({ theta: 0.85, phi: 0.94 }, { duration: endDur }),
        )
    })
}

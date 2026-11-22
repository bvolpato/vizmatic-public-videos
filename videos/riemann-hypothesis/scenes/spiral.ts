import {
    Node, circle, dot, dynamic, group, line, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { ZETA_ZEROS, zeta } from '../math'
import { txt } from '../../../factory/style'

const GRID_STEPS = 44
interface GridStrand {
    src: Vec[]
    dst: Vec[]
    color: string
    width: number
    crit: boolean
}

const WARP_CX = 170
const WARP_CY = 10
const WARP_SRC_SCALE_X = 280
const WARP_SRC_SCALE_Y = 36
const WARP_DST_SCALE = 155

const WARP_STRANDS: GridStrand[] = (() => {
    const out: GridStrand[] = []
    for (const sig of [0.2, 0.35, 0.5, 0.65, 0.8, 0.95]) {
        const src: Vec[] = []
        const dst: Vec[] = []
        for (let j = 0; j <= GRID_STEPS; j++) {
            const im = 2.0 + (15.5 * j) / GRID_STEPS
            src.push([WARP_CX + (sig - 0.5) * WARP_SRC_SCALE_X, WARP_CY + 290 - (im - 2) * WARP_SRC_SCALE_Y])
            const [zr, zi] = zeta(sig, im)
            dst.push([WARP_CX + zr * WARP_DST_SCALE, WARP_CY - zi * WARP_DST_SCALE])
        }
        const crit = Math.abs(sig - 0.5) < 1e-6
        out.push({ src, dst, color: crit ? '#ffd166' : '#38bdf8', width: crit ? 4.2 : 1.7, crit })
    }
    for (const im of [4, 7, 10, 13, 14.134725, 17]) {
        const src: Vec[] = []
        const dst: Vec[] = []
        for (let i = 0; i <= 24; i++) {
            const sig = 0.2 + (0.75 * i) / 24
            src.push([WARP_CX + (sig - 0.5) * WARP_SRC_SCALE_X, WARP_CY + 290 - (im - 2) * WARP_SRC_SCALE_Y])
            const [zr, zi] = zeta(sig, im)
            dst.push([WARP_CX + zr * WARP_DST_SCALE, WARP_CY - zi * WARP_DST_SCALE])
        }
        const isZero = Math.abs(im - 14.134725) < 0.01
        out.push({ src, dst, color: isZero ? '#ff6b8b' : '#a78bfa', width: isZero ? 3.2 : 1.5, crit: false })
    }
    return out
})()

const N_PTS = 1200
const T0 = 0.5
const T1 = 34.8
const OUT_CX = 210
const OUT_CY = -10
const OUT_SCALE = 152

const ZETA_TRAIL: { t: number; pt: Vec }[] = Array.from({ length: N_PTS }, (_, i) => {
    const t = T0 + ((T1 - T0) * i) / (N_PTS - 1)
    const [re, im] = zeta(0.5, t)
    return { t, pt: [OUT_CX + re * OUT_SCALE, OUT_CY - im * OUT_SCALE] as Vec }
})

const LINE_X = -650
const LINE_BOT = 310
const LINE_TOP = -310
const mapT = (t: number) => LINE_BOT - ((t - T0) / (T1 - T0)) * (LINE_BOT - LINE_TOP)

export const spiral: SceneFunction = (s, c) => {
    const warpU = s.value(0)
    const showWarp = s.value(1)
    const showSpiral = s.value(0)
    const tVal = s.value(T0)

    const warpOverlay = group(
        txt('Warping Space', -840, -390, 62, '#f8f4ec', 'serif', 'left'),
        txt('The complex plane folds under ζ(s)', -840, -320, 30, '#5ce1e6', 'sans', 'left'),
        txt('Golden strand = Re(s) = 1/2', -840, 340, 28, '#ffd166', 'mono', 'left'),
    )

    const liveWarp = dynamic(() => {
        if (showWarp.value < 0.02) return []
        const a = showWarp.value
        const u = warpU.value
        const nodes: Node[] = [
            circle(52, {
                fill: radialGradient([0, 0], 52, [
                    [0, '#ffd16655'],
                    [1, '#ffd16600'],
                ]),
                stroke: null,
            }).at(WARP_CX, WARP_CY).opacity(a * u),
            dot(5, '#ffd166').at(WARP_CX, WARP_CY).opacity(a * u),
        ]
        for (const st of WARP_STRANDS) {
            const pts: Vec[] = st.src.map((p, i) => {
                const q = st.dst[i]!
                return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u] as Vec
            })
            const node = new Node(polyPath(pts)).stroke(st.color, st.width, (st.crit ? 0.98 : 0.45) * a)
            nodes.push(st.crit ? node.glow(8, '#ffd166') : node)
        }
        return group(...nodes)
    })

    const spiralBackdrop = group(
        line([LINE_X, LINE_BOT], [LINE_X, LINE_TOP], { stroke: '#ffd166', width: 3.5 }).glow(6, '#ffd166'),
        txt('Re(s) = 1/2', LINE_X, LINE_TOP - 46, 28, '#ffd166', 'mono'),
        txt('t = 0', LINE_X - 36, LINE_BOT, 26, '#6e7c9e', 'mono', 'right'),
        txt('t = 35', LINE_X - 36, LINE_TOP, 26, '#6e7c9e', 'mono', 'right'),

        circle(OUT_SCALE, { fill: null, stroke: '#1d253d', width: 1.4, dash: [5, 9] }).at(OUT_CX, OUT_CY),
        circle(OUT_SCALE * 2, { fill: null, stroke: '#171d32', width: 1.2, dash: [5, 9] }).at(OUT_CX, OUT_CY),
        line([OUT_CX - 430, OUT_CY], [OUT_CX + 560, OUT_CY], { stroke: '#1b2238', width: 1.4 }),
        line([OUT_CX, OUT_CY - 390], [OUT_CX, OUT_CY + 390], { stroke: '#1b2238', width: 1.4 }),
        circle(56, {
            fill: radialGradient([0, 0], 56, [
                [0, '#ffd16670'],
                [0.45, '#ffd1661c'],
                [1, '#ffd16600'],
            ]),
            stroke: null,
        }).at(OUT_CX, OUT_CY),
        circle(14, { fill: null, stroke: '#ffd166', width: 2.5 }).at(OUT_CX, OUT_CY),
        dot(5, '#ffffff').at(OUT_CX, OUT_CY).glow(10, '#ffd166'),
    )

    const trailGrad = linearGradient([OUT_CX - 280, OUT_CY + 320], [OUT_CX + 460, OUT_CY - 320], ['#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'])

    const liveSpiral = dynamic(() => {
        if (showSpiral.value < 0.02) return []
        const a = showSpiral.value
        const curT = tVal.value
        const frac = Math.max(0, Math.min(1, (curT - T0) / (T1 - T0)))
        const count = Math.max(2, Math.floor(frac * N_PTS))
        const pts = ZETA_TRAIL.slice(0, count).map((e) => e.pt)
        const tip = pts[pts.length - 1]!
        const beadY = mapT(curT)

        let minDist = 99
        const zeroNodes: Node[] = []
        for (const g of ZETA_ZEROS.slice(0, 5)) {
            minDist = Math.min(minDist, Math.abs(curT - g))
            if (curT >= g - 0.12) {
                const zy = mapT(g)
                zeroNodes.push(
                    circle(12, { fill: null, stroke: '#ffd166', width: 2.5 }).at(LINE_X, zy).opacity(a),
                    dot(5, '#ffffff').at(LINE_X, zy).glow(8, '#ffd166').opacity(a),
                    txt(g.toFixed(2), LINE_X + 30, zy, 28, '#ffd166', 'mono', 'left').opacity(a),
                )
            }
        }

        const shockwave: Node[] = []
        if (minDist < 0.9) {
            const p = 1 - minDist / 0.9
            shockwave.push(
                circle(20 + p * 95, { fill: null, stroke: '#ffd166', width: 3.5 * (1 - p * 0.6) }).at(OUT_CX, OUT_CY).opacity((1 - p * 0.7) * a).glow(10, '#ffd166'),
                circle(16 + p * 155, { fill: null, stroke: '#5ce1e6', width: 2 * (1 - p * 0.7) }).at(OUT_CX, OUT_CY).opacity((1 - p * 0.8) * a),
            )
        }

        const glowRibbon = new Node(polyPath(pts)).stroke(trailGrad, 5.2, 0.92 * a).glow(9, '#a78bfa')
        const crispCore = new Node(polyPath(pts)).stroke('#ffffff', 1.3, 0.38 * a)
        const headHalo = circle(30, {
            fill: radialGradient([0, 0], 30, [
                [0, '#ffd166bb'],
                [0.45, '#ff6b8b33'],
                [1, '#ffd16600'],
            ]),
            stroke: null,
        }).at(tip[0], tip[1]).opacity(a)

        return group(
            ...zeroNodes,
            dot(9, '#5ce1e6').at(LINE_X, beadY).glow(12, '#5ce1e6').opacity(a),
            txt(`t = ${curT.toFixed(2)}`, 830, -415, 34, '#ffd166', 'mono', 'right').opacity(a),
            glowRibbon,
            crispCore,
            ...shockwave,
            headHalo,
            dot(7, '#ffffff').at(tip[0], tip[1]).glow(14, '#ffd166').opacity(a),
        )
    })

    const rhWhisper = group(
        txt('Every non-trivial zero lies on', 0, 392, 34, '#cbd5e8', 'serif'),
        tex(String.raw`\operatorname{Re}(s) = \tfrac{1}{2}`, { size: 42, color: '#ffd166' }).at(0, 452).glow(6, '#ffd166'),
    )

    s.add(liveWarp, warpOverlay)
    c.at(0.1, () => s.play(warpU.to(1, { duration: 3.2 })))

    c.on('climb straight up', () => {
        s.play(showWarp.to(0, { duration: 0.35 }))
        s.play(showSpiral.to(1, { duration: 0.25 }))
        s.play(tVal.to(12.2, { duration: 2.6 }))
    })
    c.swap('climb straight up', warpOverlay, spiralBackdrop)
    s.add(liveSpiral)

    c.on('fourteen point one three', () => s.play(tVal.to(14.1347, { duration: 1.5 })))
    c.on('zero two', () => s.play(tVal.to(21.022, { duration: 2.0 })))
    c.on('zero one', () => s.play(tVal.to(34.2, { duration: 4.8 })))
    c.show('breathtaking claim', rhWhisper)
}

import {
    Node, circle, dot, dynamic, group, line, linearGradient, polyPath, polygon, radialGradient,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { isPrime, liOffset, primePi } from '../math'
import { txt } from '../../../factory/style'

interface UlamNode {
    n: number
    gx: number
    gy: number
    prime: boolean
    smallDiv: number
}

function buildUlam(limit: number): UlamNode[] {
    const out: UlamNode[] = []
    let x = 0
    let y = 0
    let dx = 1
    let dy = 0
    let segLen = 1
    let segPassed = 0
    let turns = 0

    for (let n = 1; n <= limit; n++) {
        const p = isPrime(n)
        let smallDiv = 0
        if (!p && n > 1) {
            if (n % 2 === 0) smallDiv = 2
            else if (n % 3 === 0) smallDiv = 3
            else if (n % 5 === 0) smallDiv = 5
            else if (n % 7 === 0) smallDiv = 7
            else smallDiv = 11
        }
        out.push({ n, gx: x, gy: y, prime: p, smallDiv })
        x += dx
        y += dy
        segPassed++
        if (segPassed === segLen) {
            segPassed = 0
            const tmp = dx
            dx = -dy
            dy = tmp
            turns++
            if (turns % 2 === 0) segLen++
        }
    }
    return out
}

const ULAM_100 = buildUlam(100)
const ULAM_GALAXY = buildUlam(1681)

const CX0 = -810
const CX1 = 830
const CY0 = 320
const CY1 = -260
const mapX = (x: number) => CX0 + ((x - 2) / 198) * (CX1 - CX0)
const mapY = (y: number) => CY0 - (y / 54) * (CY0 - CY1)

const STAIR_PTS: Vec[] = (() => {
    const pts: Vec[] = [[mapX(2), mapY(0)]]
    let prev = 0
    for (let n = 2; n <= 200; n++) {
        const cur = primePi(n)
        if (cur !== prev) {
            pts.push([mapX(n), mapY(prev)], [mapX(n), mapY(cur)])
            prev = cur
        }
    }
    pts.push([mapX(200), mapY(prev)])
    return pts
})()

const LI_SAMPLES = 220
const LI_PTS: Vec[] = Array.from({ length: LI_SAMPLES }, (_, i) => {
    const x = 2 + (198 * i) / (LI_SAMPLES - 1)
    return [mapX(x), mapY(liOffset(x))] as Vec
})

const WOBBLE_POLY: Vec[] = [...LI_PTS, ...[...STAIR_PTS].reverse()]

export const primes: SceneFunction = (s, c) => {
    const sieve = s.value(0)
    const galaxyZoom = s.value(0)
    const showGalaxy = s.value(1)
    const showStair = s.value(0)
    const stairProg = s.value(0)
    const liProg = s.value(0)
    const wobbleAlpha = s.value(0)

    const captionGalaxy = group(
        txt('1 to 100', -840, -390, 64, '#f8f4ec', 'serif', 'left'),
        txt('25 primes shining in the dark', -840, -320, 30, '#ffd166', 'sans', 'left'),
    )
    const captionFilaments = group(
        txt('1,681 numbers', -840, -390, 64, '#f8f4ec', 'serif', 'left'),
        txt('Primes align along mysterious diagonals', -840, -320, 30, '#5ce1e6', 'sans', 'left'),
    )

    const UX = 175
    const UY = 10

    const liveSpiral = dynamic(() => {
        if (showGalaxy.value < 0.02) return []
        const alpha = showGalaxy.value
        const z = galaxyZoom.value
        const sv = sieve.value
        const nodes: Node[] = []

        if (z < 0.45) {
            const step = 84 * (1 - 0.52 * (z / 0.45))
            const fade = alpha * (1 - Math.max(0, (z - 0.25) / 0.2))
            const threadPts: Vec[] = ULAM_100.map((u) => [UX + u.gx * step, UY - u.gy * step] as Vec)
            nodes.push(new Node(polyPath(threadPts)).stroke('#283452', 1.6, 0.45 * fade * (1 - 0.5 * sv)))

            for (const u of ULAM_100) {
                const px = UX + u.gx * step
                const py = UY - u.gy * step
                if (u.prime) {
                    const r = 13 + 5 * sv
                    nodes.push(
                        circle(r * 1.9, {
                            fill: radialGradient([0, 0], r * 1.9, [
                                [0, '#ffd16666'],
                                [0.5, '#ffd16618'],
                                [1, '#ffd16600'],
                            ]),
                            stroke: null,
                        }).at(px, py).opacity(fade * (0.4 + 0.6 * sv)),
                        dot(r * 0.48, '#ffd166').at(px, py).opacity(fade),
                    )
                    if (step > 52) {
                        nodes.push(txt(String(u.n), px, py - 24, 26, '#f8f4ec', 'mono').opacity(fade * (0.65 + 0.35 * sv)))
                    }
                } else {
                    const threshold = u.smallDiv === 2 ? 0.25 : u.smallDiv === 3 ? 0.5 : u.smallDiv === 5 ? 0.72 : 0.9
                    const compOp = Math.max(0.08, 1 - Math.max(0, (sv - (threshold - 0.25)) / 0.25) * 0.9)
                    nodes.push(dot(3.8, '#5a6b8c').at(px, py).opacity(fade * compOp * 0.75))
                }
            }
        }

        if (z > 0.2) {
            const gFade = alpha * Math.min(1, (z - 0.2) / 0.35)
            const step = 21 + 10 * (1 - z)
            for (const u of ULAM_GALAXY) {
                const px = UX + u.gx * step
                const py = UY - u.gy * step
                if (px < -920 || px > 920 || py < -500 || py > 500) continue
                if (u.prime) {
                    const dist = Math.hypot(u.gx, u.gy)
                    const col = dist < 8 ? '#ffd166' : dist < 15 ? '#5ce1e6' : '#a78bfa'
                    nodes.push(dot(4.2, col).at(px, py).opacity(gFade * 0.95).glow(5, col))
                } else if (u.n % 2 === 1) {
                    nodes.push(dot(1.1, '#26324f').at(px, py).opacity(gFade * 0.4))
                }
            }
        }
        return group(...nodes)
    })

    const stairAxes = group(
        line([CX0, CY0], [CX1, CY0], { stroke: '#2c3754', width: 2 }),
        line([CX0, CY0], [CX0, CY1 - 20], { stroke: '#2c3754', width: 2 }),
        ...[50, 100, 150, 200].map((v) =>
            group(
                line([mapX(v), CY0], [mapX(v), CY1], { stroke: '#131929', width: 1.2 }),
                txt(String(v), mapX(v), CY0 + 36, 26, '#7a88a8', 'mono'),
            ),
        ),
        ...[15, 30, 45].map((v) =>
            group(
                line([CX0, mapY(v)], [CX1, mapY(v)], { stroke: '#131929', width: 1.2 }),
                txt(String(v), CX0 - 30, mapY(v), 26, '#7a88a8', 'mono', 'right'),
            ),
        ),
        txt('The Prime Staircase', -810, -405, 62, '#f8f4ec', 'serif', 'left'),
        txt('Exact prime count π(x)  vs  Gauss’s smooth curve Li(x)', -810, -335, 30, '#9fb0cf', 'sans', 'left'),
    )

    const stairGrad = linearGradient([CX0, CY0], [CX1, CY1], ['#ffd166', '#ff8c66', '#ff6b8b'])
    const liveStair = dynamic(() => {
        if (showStair.value < 0.02) return []
        const a = showStair.value
        const nodes: Node[] = []
        if (wobbleAlpha.value > 0.01) {
            nodes.push(polygon(WOBBLE_POLY, { fill: '#5ce1e6', stroke: null }).opacity(0.11 * wobbleAlpha.value * a))
        }
        if (stairProg.value > 0.01) {
            const sc = Math.max(2, Math.floor(stairProg.value * STAIR_PTS.length))
            const pts = STAIR_PTS.slice(0, sc)
            const tip = pts[pts.length - 1]!
            nodes.push(
                new Node(polyPath(pts)).stroke(stairGrad, 4.5, a).glow(8, '#ffd166'),
                dot(7.5, '#ffffff').at(tip[0], tip[1]).glow(14, '#ffd166').opacity(a),
            )
        }
        if (liProg.value > 0.01) {
            const lc = Math.max(2, Math.floor(liProg.value * LI_PTS.length))
            const lpts = LI_PTS.slice(0, lc)
            const ltip = lpts[lpts.length - 1]!
            nodes.push(
                new Node(polyPath(lpts)).stroke('#5ce1e6', 3.6, 0.95 * a).glow(7, '#5ce1e6'),
                dot(6, '#5ce1e6').at(ltip[0], ltip[1]).glow(10, '#5ce1e6').opacity(a),
            )
        }
        return group(...nodes)
    })

    const wobbleCallout = txt('What hidden rhythm drives the wobble?', 0, 425, 38, '#ffd166', 'serif')

    s.add(liveSpiral, captionGalaxy)
    c.on('Cross out every composite', () => s.play(sieve.to(1, { duration: 1.8 })))
    c.on('sixteen hundred numbers', () => s.play(galaxyZoom.to(1, { duration: 2.2 })))
    c.swap('sixteen hundred numbers', captionGalaxy, captionFilaments)

    c.on('stepping up by one', () => {
        s.play(showGalaxy.to(0, { duration: 0.3 }))
        s.play(showStair.to(1, { duration: 0.25 }))
        s.play(stairProg.to(1, { duration: 3.0 }))
    })
    c.swap('stepping up by one', captionFilaments, stairAxes)
    s.add(liveStair)
    c.on('smooth curve discovered', () => {
        s.play(liProg.to(1, { duration: 2.0 }))
        s.play(wobbleAlpha.to(1, { duration: 0.9 }))
    })
    c.show('what hidden rhythm', wobbleCallout)
}

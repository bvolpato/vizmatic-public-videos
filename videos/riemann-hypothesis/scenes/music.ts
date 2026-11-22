import { txt as text } from '../../../factory/style'
import {
    Node, dynamic, group, line, linear, linearGradient, polyPath,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { ZETA_ZEROS, chebyshevPsi, explicitPsi, isPrime } from '../math'

const X0 = -810
const X1 = 830
const BOT_Y0 = 335
const BOT_Y1 = -10
const mapX = (x: number) => X0 + ((x - 2) / 30) * (X1 - X0)
const mapY = (y: number) => BOT_Y0 - (y / 38) * (BOT_Y0 - BOT_Y1)

const EXACT_PSI_PTS: Vec[] = (() => {
    const pts: Vec[] = [[mapX(2), mapY(0)]]
    let prev = 0
    for (let n = 2; n <= 32; n++) {
        const cur = chebyshevPsi(n)
        if (Math.abs(cur - prev) > 1e-6) {
            pts.push([mapX(n), mapY(prev)], [mapX(n), mapY(cur)])
            prev = cur
        }
    }
    pts.push([mapX(32), mapY(prev)])
    return pts
})()

const SAMPLES = 280
const XS = Array.from({ length: SAMPLES }, (_, i) => 2.02 + (29.98 * i) / (SAMPLES - 1))
const buildY = (n: number, sigma = 0.5) => XS.map((x) => Math.max(0, Math.min(37.5, explicitPsi(x, n, sigma))))

const C0 = buildY(0)
const C1 = buildY(1)
const C5 = buildY(5)
const C15 = buildY(15)
const C30 = buildY(30)
const C_ROGUE = buildY(9, 0.74)

const HARMONIC_COLORS = ['#5ce1e6', '#60a5fa', '#a78bfa', '#ff6b8b', '#ffd166'] as const
const PRIMES_32 = Array.from({ length: 31 }, (_, i) => i + 2).filter(isPrime)

export const music: SceneFunction = (s, c) => {
    const waveDrift = s.value(0)
    const stageVal = s.value(0)

    // Top half: 5 luminous vibrating harmonic harp strings (no boxes!)
    const harpTitle = text('The Music of the Zeros', -810, -415, 58, '#f8f4ec', 'serif', 'left')
    const harpStrings = dynamic(() => {
        const ph = waveDrift.value
        const nodes: Node[] = []
        for (let k = 0; k < 5; k++) {
            const g = ZETA_ZEROS[k]!
            const yc = -315 + k * 44
            const col = HARMONIC_COLORS[k]!
            const amp = 14 - k * 1.2
            const pts: Vec[] = XS.map((x) => [
                -530 + ((x - 2) / 30) * 1360,
                yc - amp * Math.cos(g * Math.log(x) - ph * (0.6 + k * 0.15)),
            ])
            nodes.push(
                text(`γ${k + 1} = ${g.toFixed(2)}`, -810, yc, 26, col, 'mono', 'left').opacity(0.9),
                new Node(polyPath(pts)).stroke(col, 2.8, 0.85).glow(6, col),
            )
        }
        return group(...nodes)
    })

    // Bottom stage: Subtle vertical prime light pillars + exact ghost staircase
    const pillars = group(
        line([X0, BOT_Y0], [X1, BOT_Y0], { stroke: '#2c3754', width: 2 }),
        ...PRIMES_32.map((p) => {
            const px = mapX(p)
            const showLabel = [2, 5, 11, 17, 23, 29].includes(p)
            return group(
                line([px, BOT_Y0], [px, BOT_Y1 + 15], { stroke: '#ffd166', width: 1.2 }).opacity(0.14),
                ...(showLabel ? [text(String(p), px, BOT_Y0 + 36, 26, '#ffd166', 'mono')] : []),
            )
        }),
        new Node(polyPath(EXACT_PSI_PTS)).stroke('#8c733a', 2.4, 0.75),
    )

    const synthGrad = linearGradient([X0, BOT_Y0], [X1, BOT_Y1], ['#5ce1e6', '#a78bfa', '#ffd166'])
    const interp = (a: number[], b: number[], t: number): Vec[] =>
        XS.map((x, i) => [mapX(x), mapY(a[i]! + (b[i]! - a[i]!) * t)] as Vec)

    const liveSynth = dynamic(() => {
        const v = stageVal.value
        let pts: Vec[]
        let readout: string
        let col = '#5ce1e6'
        if (v < 1) {
            pts = interp(C0, C1, v)
            readout = v < 0.2 ? '0 zeros — smooth baseline' : '1 zero wave'
        } else if (v < 2) {
            pts = interp(C1, C5, v - 1)
            readout = '5 zero waves'
        } else if (v < 3) {
            pts = interp(C5, C15, v - 2)
            readout = '15 zero waves'
            col = '#a78bfa'
        } else if (v <= 4.05) {
            pts = interp(C15, C30, Math.min(1, v - 3))
            readout = '30 zeros on Re(s) = 1/2 — pure harmony'
            col = '#ffd166'
        } else {
            pts = interp(C30, C_ROGUE, Math.min(1, v - 4))
            readout = 'Rogue zero at Re(s) = 0.74 — primes distorted!'
            col = '#ff6b8b'
        }
        const isRogue = v > 4.2
        return group(
            text(readout, 830, -412, 30, col, 'mono', 'right'),
            new Node(polyPath(pts)).stroke(isRogue ? '#ff6b8b' : synthGrad, 5.0, 0.95).glow(10, isRogue ? '#ff6b8b' : '#5ce1e6'),
            new Node(polyPath(pts)).stroke('#ffffff', 1.4, 0.45),
        )
    })

    const footWhisper = text('Horizontal position Re(s) = 1/2 keeps every prime wave balanced at √x', 0, 435, 30, '#cbd5e8', 'serif')

    s.add(harpTitle, harpStrings, pillars, liveSynth)
    c.at(0.1, () => s.play(waveDrift.to(12, { duration: 31, ease: linear })))
    c.on('one zero', () => s.play(stageVal.to(1, { duration: 1.0 })))
    c.on('five zeros', () => s.play(stageVal.to(2, { duration: 1.0 })))
    c.on('fifteen', () => s.play(stageVal.to(3, { duration: 1.0 })))
    c.on('thirty', () => s.play(stageVal.to(4, { duration: 1.4 })))
    c.show('secret of one half', footWhisper)
    c.on('rogue zero off the line', () => s.play(stageVal.to(5, { duration: 1.8 })))
}

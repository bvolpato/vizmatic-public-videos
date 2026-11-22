import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, polygon, radialGradient,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const CX = 340
const CY = -10

// Deterministic secret witness particles swirling inside the sealed vault
const WITNESS_PARTICLES = Array.from({ length: 56 }, (_, i) => ({
    angle: (i * 2.39996) % (Math.PI * 2),
    radius: 65 + (i * 193) % 210,
    speed: (i % 2 === 0 ? 1 : -1) * (0.6 + (i % 5) * 0.25),
    col: i % 3 === 0 ? '#5ce1e6' : i % 3 === 1 ? '#a78bfa' : '#60a5fa',
    size: 3 + (i % 3) * 1.4,
}))

function diamond(cx: number, cy: number, rx: number, ry: number): Vec[] {
    return [
        [cx, cy - ry],
        [cx + rx, cy],
        [cx, cy + ry],
        [cx - rx, cy],
    ]
}

export const hook: SceneFunction = (s, c) => {
    const vaultSpin = s.value(0)
    const compress = s.value(0)
    const showVault = s.value(1)
    const showLaser = s.value(0)
    const laserProg = s.value(0)

    const shot1Title = group(
        txt('192 BYTES', -840, -175, 86, '#ffd166', 'mono', 'left').glow(10, '#ffd166'),
        txt('Zero-Knowledge', -848, -32, 102, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Proofs', -848, 86, 106, '#5ce1e6', 'serif', 'left').glow(8, '#38bdf8'),
        txt('Million-step secret  ·  Zero bits revealed', -840, 206, 32, '#cbd5e8', 'sans', 'left'),
    )

    const liveVault = dynamic(() => {
        if (showVault.value < 0.02) return []
        const a = showVault.value
        const spin = vaultSpin.value
        const comp = compress.value
        const shellScale = 1 - comp * 0.62
        const gemScale = 0.45 + comp * 0.65

        const nodes: Node[] = [
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ffd16628'],
                    [0.45, '#a78bfa1e'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).opacity(a),
        ]

        // Swirling hidden computation particles pulled into the golden gem
        for (const p of WITNESS_PARTICLES) {
            const ang = p.angle + spin * p.speed
            const r = p.radius * (1 - comp * 0.88)
            const x = CX + Math.cos(ang) * r
            const y = CY + Math.sin(ang) * r
            nodes.push(dot(p.size, p.col).at(x, y).opacity((0.85 - comp * 0.35) * a).glow(6, p.col))
            if (comp > 0.15) {
                nodes.push(line([x, y], [CX, CY], { stroke: '#ffd166', width: 1.2, opacity: comp * 0.25 * a }))
            }
        }

        // Rotating vault seals
        const outerHex: Vec[] = Array.from({ length: 6 }, (_, i) => {
            const ang = spin * 0.4 + (i * Math.PI) / 3
            return [CX + Math.cos(ang) * 285 * shellScale, CY + Math.sin(ang) * 285 * shellScale] as Vec
        })
        const midHex: Vec[] = Array.from({ length: 6 }, (_, i) => {
            const ang = -spin * 0.65 + (i * Math.PI) / 3
            return [CX + Math.cos(ang) * 210 * shellScale, CY + Math.sin(ang) * 210 * shellScale] as Vec
        })
        nodes.push(
            circle(315 * shellScale, { fill: null, stroke: '#a78bfa', width: 2.2, dash: [12, 12] }).at(CX, CY).opacity(0.6 * a).glow(6, '#a78bfa'),
            polygon(outerHex, { fill: null, stroke: '#5ce1e6', width: 2.8 }).opacity(0.78 * a).glow(8, '#5ce1e6'),
            polygon(midHex, { fill: '#120e2860', stroke: '#a78bfa', width: 2.5 }).opacity(0.85 * a).glow(8, '#a78bfa'),
        )

        // Blazing 192-byte golden gem emerging at the center
        const gemPts = diamond(CX, CY, 62 * gemScale, 86 * gemScale)
        const pulseR = 70 + ((spin * 0.9) % 1) * 140
        const pulseOp = (1 - ((spin * 0.9) % 1)) * 0.65 * a
        nodes.push(
            circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.4 }).at(CX, CY).opacity(pulseOp).glow(8, '#ffd166'),
            polygon(gemPts, { fill: '#ffd16645', stroke: '#ffd166', width: 4.2 }).opacity(a).glow(14, '#ffd166'),
            line([CX, CY - 86 * gemScale], [CX, CY + 86 * gemScale], { stroke: '#fff7d6', width: 2, opacity: 0.75 * a }),
            line([CX - 62 * gemScale, CY], [CX + 62 * gemScale, CY], { stroke: '#fff7d6', width: 2, opacity: 0.75 * a }),
            dot(8, '#ffffff').at(CX, CY).opacity(a).glow(16, '#ffd166'),
            txt('SEALED WITNESS VAULT', CX, 355, 26, '#a78bfa', 'mono').opacity((1 - comp * 0.7) * a),
        )
        return group(...nodes)
    })

    // Shot 2: One random golden laser beam strikes the 192-byte gem -> 99.999999999% certainty
    const laserGrad = linearGradient([-580, -35], [220, -35], ['#ffd166', '#ffffff', '#6ee7b7'])

    const liveLaser = dynamic(() => {
        if (showLaser.value < 0.02) return []
        const a = showLaser.value
        const p = laserProg.value
        const beamEnd = -560 + Math.min(1, p * 2.2) * 780
        const hit = Math.max(0, (p - 0.42) / 0.58)
        const waveR = 45 + ((hit * 2.5) % 1) * 145
        const waveOp = hit > 0.01 ? (1 - ((hit * 2.5) % 1)) * 0.8 * a : 0

        const nodes: Node[] = [
            circle(460, {
                fill: radialGradient([0, 0], 460, [
                    [0, '#6ee7b726'],
                    [0.45, '#ffd16618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(220, -35).opacity(a),
            // Verifier Emitter on Left
            circle(54, { fill: '#121b33', stroke: '#5ce1e6', width: 3.5 }).at(-590, -35).opacity(a).glow(10, '#5ce1e6'),
            dot(14, '#ffd166').at(-590, -35).opacity(a).glow(12, '#ffd166'),
            txt('VERIFIER', -590, 62, 28, '#5ce1e6', 'mono').opacity(a),
            txt('1 random challenge', -590, 102, 26, '#9eb0d0', 'sans').opacity(a),
            // Golden laser challenge beam
            line([-560, -35], [beamEnd, -35], { stroke: laserGrad, width: 7, opacity: 0.96 * a }).glow(14, '#ffd166'),
            line([-560, -35], [beamEnd, -35], { stroke: '#ffffff', width: 2.2, opacity: 0.85 * a }),
            dot(10, '#ffffff').at(beamEnd, -35).opacity(a).glow(16, '#ffd166'),
            // Target 192-byte golden gem
            polygon(diamond(220, -35, 68, 96), { fill: '#ffd16642', stroke: '#ffd166', width: 4.5 }).opacity(a).glow(14, '#ffd166'),
            line([220, -131], [220, 61], { stroke: '#fff7d6', width: 2, opacity: 0.7 * a }),
            line([152, -35], [288, -35], { stroke: '#fff7d6', width: 2, opacity: 0.7 * a }),
            txt('192-BYTE PROOF', 220, 195, 28, '#ffd166', 'mono').opacity(a),
        ]

        if (hit > 0.01) {
            nodes.push(
                circle(waveR, { fill: null, stroke: '#6ee7b7', width: 3.2 }).at(220, -35).opacity(waveOp).glow(10, '#6ee7b7'),
                circle(waveR * 0.65, { fill: null, stroke: '#ffd166', width: 2.2 }).at(220, -35).opacity(waveOp * 0.8),
                new Node(polyPath([[510, -45], [542, -12], [612, -88]])).stroke('#6ee7b7', 8, Math.min(1, hit * 2) * a).glow(12, '#6ee7b7'),
                txt('VALID', 560, 48, 34, '#6ee7b7', 'mono').opacity(Math.min(1, hit * 2) * a).glow(8, '#6ee7b7'),
            )
        }

        nodes.push(
            txt('99.999999999%', 0, -295, 84, '#6ee7b7', 'mono').opacity(a).glow(10, '#6ee7b7'),
            txt('mathematical certainty  ·  0 secret bits revealed', 0, 295, 34, '#f8f4ec', 'sans').opacity(a),
        )
        return group(...nodes)
    })

    s.add(liveVault, shot1Title, liveLaser)
    c.at(0.05, () => {
        s.play(vaultSpin.to(5.5, { duration: 10, ease: linear }))
    })
    c.on('compress an entire', () => {
        s.play(compress.to(1, { duration: 2.4 }))
    })
    c.on('Fire one random', () => {
        s.play(showVault.to(0, { duration: 0.28 }))
        s.play(showLaser.to(1, { duration: 0.3 }))
        s.play(laserProg.to(1, { duration: 4.5, ease: linear }))
    })
    c.hide('Fire one random', shot1Title)
}

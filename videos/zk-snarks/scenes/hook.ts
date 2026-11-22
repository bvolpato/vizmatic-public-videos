import {
    Node, arc, circle, curve3d, dot, dynamic, group, line, line3d, linear, linearGradient,
    point3d, points3d, polyPath, polygon, radialGradient, rect, scene3d,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

const CX = 355
const CY = -10

function octaEdges(r: number, rotZ = 0): readonly (readonly [Vec3, Vec3])[] {
    const c = Math.cos(rotZ)
    const s = Math.sin(rotZ)
    const rot = (x: number, y: number, z: number): Vec3 => [x * c - y * s, x * s + y * c, z]
    const top = rot(0, 0, r * 1.18)
    const bot = rot(0, 0, -r * 1.18)
    const eq: Vec3[] = [
        rot(r, 0, 0),
        rot(0, r, 0),
        rot(-r, 0, 0),
        rot(0, -r, 0),
    ]
    const edges: [Vec3, Vec3][] = []
    for (let i = 0; i < 4; i++) {
        const a = eq[i]!
        const b = eq[(i + 1) % 4]!
        edges.push([top, a], [bot, a], [a, b])
    }
    return edges
}

// Deterministic secret witness particles swirling inside the sealed vault
const WITNESS_PARTICLES = Array.from({ length: 72 }, (_, i) => ({
    angle: (i * 2.39996) % (Math.PI * 2),
    radius: 62 + ((i * 193) % 215),
    speed: (i % 2 === 0 ? 1 : -1) * (0.6 + (i % 5) * 0.24),
    col: i % 3 === 0 ? '#5ce1e6' : i % 3 === 1 ? '#a78bfa' : '#60a5fa',
    size: 2.8 + (i % 3) * 1.3,
}))

// Dense compressed witness cloud for Shot 2 (96 nodes swirling inside cryptographic pairing rings)
const SHOT2_WITNESS = Array.from({ length: 96 }, (_, i) => {
    const golden = i * 2.399963
    const layer = i % 3
    const baseR = 54 + layer * 42 + ((i * 47) % 34)
    return {
        angle: golden % (Math.PI * 2),
        r: baseR,
        speed: (layer === 1 ? -1 : 1) * (0.75 + (i % 5) * 0.22),
        col: i % 4 === 0 ? '#ffd166' : i % 3 === 0 ? '#5ce1e6' : i % 3 === 1 ? '#a78bfa' : '#60a5fa',
        size: 2.5 + (i % 4) * 0.9,
        linkPrev: i % 3 === 0,
    }
})

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
    const shot2Loop = s.value(0)

    const shot1Title = group(
        txt('192 BYTES', -840, -175, 86, '#ffd166', 'mono', 'left').glow(10, '#ffd166'),
        txt('Zero-Knowledge', -848, -32, 102, '#f8f4ec', 'serif', 'left').glow(6, '#90b4ff'),
        txt('Proofs', -848, 86, 106, '#5ce1e6', 'serif', 'left').glow(8, '#38bdf8'),
        txt('Million-step secret  ·  Zero bits revealed', -840, 206, 32, '#d2dcf0', 'sans', 'left'),
    )

    // Orbiting glowing 3D faceted wireframe octahedron/vault surrounding the blazing 192-byte diamond
    const vault3d = scene3d({
        theta: -0.62,
        phi: 1.04,
        distance: 13.0,
        unit: 120,
        perspective: true,
        ambient: 0.44,
        brightness: 1.12,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(CX, CY)

    const outerBase = octaEdges(2.45, 0)
    const innerBase = octaEdges(1.58, Math.PI / 4)
    const coreBase = octaEdges(0.82, 0)

    const scalePt = (p: Vec3, k: number): Vec3 => [p[0] * k, p[1] * k, p[2] * k]
    for (const [a, b] of outerBase) {
        vault3d.add(
            line3d(
                () => scalePt(a, 1 - compress.value * 0.56),
                () => scalePt(b, 1 - compress.value * 0.56),
                { color: '#5ce1e6', width: 3.3, glow: 10, blend: 'screen', opacity: 0.92 },
            ),
        )
    }
    for (const [a, b] of innerBase) {
        vault3d.add(
            line3d(
                () => scalePt(a, 1 - compress.value * 0.52),
                () => scalePt(b, 1 - compress.value * 0.52),
                { color: '#a78bfa', width: 2.6, glow: 10, blend: 'screen', opacity: 0.88 },
            ),
        )
    }
    for (const [a, b] of coreBase) {
        vault3d.add(
            line3d(
                () => scalePt(a, 0.72 + compress.value * 0.46),
                () => scalePt(b, 0.72 + compress.value * 0.46),
                { color: '#ffd166', width: 3.8, glow: 12, blend: 'screen', opacity: 0.98, onTop: true },
            ),
        )
    }
    vault3d.add(
        curve3d(
            (t, time) => {
                const sc = 1 - compress.value * 0.54
                return [Math.cos(t + time * 0.4) * 2.65 * sc, Math.sin(t + time * 0.4) * 2.65 * sc, Math.sin(t * 2) * 0.25 * sc]
            },
            0,
            Math.PI * 2,
            { color: '#a78bfa', width: 2.2, glow: 10, blend: 'screen', opacity: 0.76, samples: 72, animate: true },
        ),
        curve3d(
            (t, time) => {
                const sc = 1 - compress.value * 0.54
                return [Math.cos(t - time * 0.5) * 2.2 * sc, Math.sin(t * 2) * 0.22 * sc, Math.sin(t - time * 0.5) * 2.2 * sc]
            },
            0,
            Math.PI * 2,
            { color: '#5ce1e6', width: 1.9, glow: 8, blend: 'screen', opacity: 0.62, samples: 72, animate: true },
        ),
        points3d(
            () => {
                const sc = 1 - compress.value * 0.56
                return [
                    [0, 0, 2.45 * 1.18 * sc],
                    [0, 0, -2.45 * 1.18 * sc],
                    [2.45 * sc, 0, 0],
                    [0, 2.45 * sc, 0],
                    [-2.45 * sc, 0, 0],
                    [0, -2.45 * sc, 0],
                ] as Vec3[]
            },
            { color: '#5ce1e6', radius: 6.5, glow: 12, blend: 'screen', onTop: true },
        ),
        point3d([0, 0, 0], { color: '#ffffff', radius: 9.5, glow: 16, blend: 'screen', onTop: true }),
    )

    const liveVault = dynamic(() => {
        if (showVault.value < 0.02) return []
        const a = showVault.value
        const spin = vaultSpin.value
        const comp = compress.value
        const shellScale = 1 - comp * 0.58
        const gemScale = 0.65 + comp * 0.45

        const nodes: Node[] = [
            circle(510, {
                fill: radialGradient([0, 0], 510, [
                    [0, '#ffd16634'],
                    [0.44, '#a78bfa22'],
                    [0.75, '#5ce1e610'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY).opacity(a),
        ]

        // Swirling hidden computation particles pulled into the golden gem
        for (const p of WITNESS_PARTICLES) {
            const ang = p.angle + spin * p.speed
            const r = p.radius * (1 - comp * 0.85)
            const x = CX + Math.cos(ang) * r
            const y = CY + Math.sin(ang) * r
            nodes.push(dot(p.size, p.col).at(x, y).opacity((0.88 - comp * 0.3) * a).glow(8, p.col).set('blend', 'screen'))
            if (comp > 0.15) {
                nodes.push(line([x, y], [CX, CY], { stroke: '#ffd166', width: 1.2, opacity: comp * 0.28 * a }).set('blend', 'screen'))
            }
        }

        // Blazing 192-byte golden gem emerging at the center + outer dashed seal ring
        const gemPts = diamond(CX, CY, 60 * gemScale, 84 * gemScale)
        const pulseR = 72 + ((spin * 0.9) % 1) * 155
        const pulseOp = (1 - ((spin * 0.9) % 1)) * 0.68 * a
        nodes.push(
            circle(325 * shellScale, { fill: null, stroke: '#a78bfa', width: 2.0, dash: [12, 12] })
                .at(CX, CY)
                .opacity(0.55 * a)
                .glow(8, '#a78bfa'),
            circle(pulseR, { fill: null, stroke: '#ffd166', width: 2.4 })
                .at(CX, CY)
                .opacity(pulseOp)
                .glow(10, '#ffd166')
                .set('blend', 'screen'),
            polygon(gemPts, { fill: '#ffd16648', stroke: '#ffd166', width: 4.4 })
                .opacity(a)
                .glow(16, '#ffd166')
                .set('blend', 'screen'),
            line([CX, CY - 84 * gemScale], [CX, CY + 84 * gemScale], { stroke: '#fff7d6', width: 2, opacity: 0.82 * a }).set('blend', 'screen'),
            line([CX - 60 * gemScale, CY], [CX + 60 * gemScale, CY], { stroke: '#fff7d6', width: 2, opacity: 0.82 * a }).set('blend', 'screen'),
            dot(9, '#ffffff').at(CX, CY).opacity(a).glow(18, '#ffd166').set('blend', 'screen'),
            txt('SEALED WITNESS VAULT', CX, 365, 28, '#d4c2ff', 'mono')
                .opacity((1 - comp * 0.65) * a)
                .glow(8, '#a78bfa'),
        )
        return group(...nodes)
    })

    // Shot 2: Rich 99.999999999% shot — dense witness cloud inside rotating cryptographic pairing rings
    // + glowing challenge scalar (r = 0x9c4e...) racing along the verification laser!
    const GEM2_X = 165
    const GEM2_Y = -20
    const VERIFIER_X = -610
    const laserGrad = linearGradient([VERIFIER_X + 55, GEM2_Y], [GEM2_X, GEM2_Y], ['#5ce1e6', '#ffd166', '#ffffff', '#6ee7b7'])

    const liveLaser = dynamic(() => {
        if (showLaser.value < 0.02) return []
        const a = showLaser.value
        const p = laserProg.value
        const loop = shot2Loop.value
        const beamSpan = GEM2_X - (VERIFIER_X + 55)
        const beamEnd = VERIFIER_X + 55 + Math.min(1, p * 2.2) * beamSpan
        const hit = Math.max(0, (p - 0.42) / 0.58)
        const wavePhase = (loop * 0.65) % 1
        const waveR = 56 + wavePhase * 175
        const waveOp = hit > 0.01 ? (1 - wavePhase) * 0.82 * a : 0

        const nodes: Node[] = [
            // Deep atmospheric halo behind the compressed witness + pairing rings
            circle(480, {
                fill: radialGradient([0, 0], 480, [
                    [0, '#ffd16630'],
                    [0.36, '#a78bfa22'],
                    [0.65, '#6ee7b716'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(GEM2_X, GEM2_Y).opacity(a),
        ]

        // Dense 96-node swirling cloud of secret-computation witness nodes compressed inside pairing rings
        const prevPos: Vec[] = []
        for (let i = 0; i < SHOT2_WITNESS.length; i++) {
            const w = SHOT2_WITNESS[i]!
            const ang = w.angle + loop * w.speed
            const wobble = 1 + Math.sin(loop * 2.2 + i) * 0.06
            const wx = GEM2_X + Math.cos(ang) * w.r * wobble
            const wy = GEM2_Y + Math.sin(ang) * w.r * wobble * 0.92
            prevPos.push([wx, wy])
            if (w.linkPrev && i > 0) {
                const prev = prevPos[i - 1]!
                nodes.push(
                    line(prev, [wx, wy], { stroke: w.col, width: 1.1, opacity: 0.28 * a }).set('blend', 'screen'),
                )
            }
            nodes.push(
                dot(w.size, w.col).at(wx, wy).opacity(0.88 * a).glow(7, w.col).set('blend', 'screen'),
            )
        }

        // Three counter-rotating cryptographic pairing rings (G1, G2, GT)
        const r1 = 152
        const r2 = 196
        const r3 = 236
        const a1 = loop * 0.75
        const a2 = -loop * 0.55
        const a3 = loop * 0.35
        nodes.push(
            circle(r1, { fill: null, stroke: '#ffd166', width: 2.2, dash: [14, 10] }).at(GEM2_X, GEM2_Y).opacity(0.62 * a),
            arc(r1, a1, a1 + Math.PI * 0.72, { stroke: '#ffd166', width: 4.0 }).at(GEM2_X, GEM2_Y).opacity(0.92 * a).glow(10, '#ffd166').set('blend', 'screen'),
            arc(r1, a1 + Math.PI, a1 + Math.PI * 1.68, { stroke: '#5ce1e6', width: 3.4 }).at(GEM2_X, GEM2_Y).opacity(0.85 * a).glow(10, '#5ce1e6').set('blend', 'screen'),
            circle(r2, { fill: null, stroke: '#a78bfa', width: 2.0, dash: [8, 12] }).at(GEM2_X, GEM2_Y).opacity(0.58 * a),
            arc(r2, a2, a2 + Math.PI * 0.85, { stroke: '#a78bfa', width: 4.2 }).at(GEM2_X, GEM2_Y).opacity(0.92 * a).glow(12, '#a78bfa').set('blend', 'screen'),
            arc(r2, a2 + Math.PI * 1.1, a2 + Math.PI * 1.85, { stroke: '#6ee7b7', width: 3.2 }).at(GEM2_X, GEM2_Y).opacity(0.85 * a).glow(10, '#6ee7b7').set('blend', 'screen'),
            circle(r3, { fill: null, stroke: '#5ce1e6', width: 1.8, dash: [4, 14] }).at(GEM2_X, GEM2_Y).opacity(0.46 * a),
            arc(r3, a3, a3 + Math.PI * 0.55, { stroke: '#5ce1e6', width: 3.0 }).at(GEM2_X, GEM2_Y).opacity(0.8 * a).glow(10, '#5ce1e6').set('blend', 'screen'),
            arc(r3, a3 + Math.PI, a3 + Math.PI * 1.55, { stroke: '#ffd166', width: 3.0 }).at(GEM2_X, GEM2_Y).opacity(0.76 * a).glow(10, '#ffd166').set('blend', 'screen'),
        )

        // Pairing group markers orbiting on the rings
        const ringTags: readonly [number, number, string, string][] = [
            [r2, a2 + 0.4, 'G₁', '#a78bfa'],
            [r2, a2 + Math.PI + 0.4, 'G₂', '#6ee7b7'],
            [r3, a3 + 0.25, 'Gₜ', '#5ce1e6'],
        ]
        for (const [rr, ang, lbl, col] of ringTags) {
            const tx = GEM2_X + Math.cos(ang) * rr
            const ty = GEM2_Y + Math.sin(ang) * rr
            nodes.push(
                dot(5.5, '#ffffff').at(tx, ty).opacity(a).glow(10, col).set('blend', 'screen'),
                txt(lbl, tx + Math.cos(ang) * 28, ty + Math.sin(ang) * 24, 26, col, 'mono').opacity(0.9 * a).glow(6, col),
            )
        }

        // Verifier Emitter on Left
        nodes.push(
            circle(86, { fill: null, stroke: '#5ce1e6', width: 1.8, dash: [8, 10] }).at(VERIFIER_X, GEM2_Y).opacity(0.55 * a),
            circle(60, { fill: '#101a32', stroke: '#5ce1e6', width: 3.8 }).at(VERIFIER_X, GEM2_Y).opacity(a).glow(12, '#5ce1e6'),
            dot(16, '#ffd166').at(VERIFIER_X, GEM2_Y).opacity(a).glow(16, '#ffd166').set('blend', 'screen'),
            txt('VERIFIER', VERIFIER_X, GEM2_Y + 112, 28, '#5ce1e6', 'mono').opacity(a),
            txt('1 random challenge', VERIFIER_X, GEM2_Y + 150, 26, '#c2d0ea', 'sans').opacity(a),
        )

        // Multi-layered additive verification laser beam
        nodes.push(
            line([VERIFIER_X + 58, GEM2_Y], [beamEnd, GEM2_Y], { stroke: laserGrad, width: 14, opacity: 0.38 * a })
                .glow(18, '#ffd166')
                .set('blend', 'screen'),
            line([VERIFIER_X + 58, GEM2_Y], [beamEnd, GEM2_Y], { stroke: laserGrad, width: 6.5, opacity: 0.96 * a })
                .glow(12, '#ffd166')
                .set('blend', 'screen'),
            line([VERIFIER_X + 58, GEM2_Y], [beamEnd, GEM2_Y], { stroke: '#ffffff', width: 2.2, opacity: 0.92 * a })
                .set('blend', 'screen'),
            dot(10, '#ffffff').at(beamEnd, GEM2_Y).opacity(a).glow(16, '#ffd166').set('blend', 'screen'),
        )

        // Glowing challenge scalar (r = 0x9c4e...) continuously racing along the verification laser!
        const scalarPhase = (loop * 0.42 + 0.34) % 1
        const scalarX = VERIFIER_X + 85 + scalarPhase * Math.max(40, beamEnd - (VERIFIER_X + 145))
        nodes.push(
            line([scalarX - 64, GEM2_Y], [scalarX, GEM2_Y], { stroke: '#ffd166', width: 8, opacity: 0.72 * a })
                .glow(14, '#ffd166')
                .set('blend', 'screen'),
            circle(16, { fill: '#ffd16655', stroke: '#ffffff', width: 2.5 })
                .at(scalarX, GEM2_Y)
                .opacity(a)
                .glow(16, '#ffd166')
                .set('blend', 'screen'),
            dot(7.5, '#ffffff').at(scalarX, GEM2_Y).opacity(a).glow(14, '#ffffff').set('blend', 'screen'),
            rect(240, 48, { fill: '#111626ee', stroke: '#ffd166', width: 2.6, radius: 24 })
                .at(scalarX, GEM2_Y - 58)
                .opacity(a)
                .glow(8, '#ffd166'),
            txt('r = 0x9c4e...', scalarX, GEM2_Y - 56, 26, '#ffd166', 'mono').opacity(a),
        )

        // Target 192-byte golden gem at the heart of the pairing rings
        nodes.push(
            polygon(diamond(GEM2_X, GEM2_Y, 64, 90), { fill: '#ffd1664c', stroke: '#ffd166', width: 4.5 })
                .opacity(a)
                .glow(16, '#ffd166')
                .set('blend', 'screen'),
            line([GEM2_X, GEM2_Y - 90], [GEM2_X, GEM2_Y + 90], { stroke: '#fff7d6', width: 2, opacity: 0.8 * a }).set('blend', 'screen'),
            line([GEM2_X - 64, GEM2_Y], [GEM2_X + 64, GEM2_Y], { stroke: '#fff7d6', width: 2, opacity: 0.8 * a }).set('blend', 'screen'),
            dot(9, '#ffffff').at(GEM2_X, GEM2_Y).opacity(a).glow(18, '#ffd166').set('blend', 'screen'),
            txt('192-BYTE PROOF', GEM2_X, 268, 28, '#ffd166', 'mono').opacity(a).glow(8, '#ffd166'),
        )

        if (hit > 0.01) {
            const validOp = Math.min(1, hit * 2) * a
            nodes.push(
                circle(waveR, { fill: null, stroke: '#6ee7b7', width: 3.2 })
                    .at(GEM2_X, GEM2_Y)
                    .opacity(waveOp)
                    .glow(12, '#6ee7b7')
                    .set('blend', 'screen'),
                circle(waveR * 0.68, { fill: null, stroke: '#ffd166', width: 2.2 })
                    .at(GEM2_X, GEM2_Y)
                    .opacity(waveOp * 0.8)
                    .set('blend', 'screen'),
                // Connecting verification pulse beam from gem -> VALID seal
                line([GEM2_X + 165, GEM2_Y], [510, GEM2_Y], { stroke: '#6ee7b7', width: 4.5, opacity: 0.85 * validOp })
                    .glow(12, '#6ee7b7')
                    .set('blend', 'screen'),
                circle(68, { fill: '#0d2620e8', stroke: '#6ee7b7', width: 3.8 }).at(595, GEM2_Y).opacity(validOp).glow(14, '#6ee7b7'),
                new Node(polyPath([[564, GEM2_Y - 2], [588, GEM2_Y + 24], [634, GEM2_Y - 28]]))
                    .stroke('#6ee7b7', 8, validOp)
                    .glow(12, '#6ee7b7'),
                txt('VALID', 595, GEM2_Y + 108, 34, '#6ee7b7', 'mono').opacity(validOp).glow(10, '#6ee7b7'),
                txt('BN254 · 4 ms', 595, GEM2_Y + 148, 26, '#a8e6cf', 'mono').opacity(validOp),
            )
        }

        nodes.push(
            txt('99.999999999%', 0, -335, 86, '#6ee7b7', 'mono').opacity(a).glow(12, '#6ee7b7'),
            txt('mathematical certainty  ·  0 secret bits revealed', 0, 345, 34, '#f8f4ec', 'sans').opacity(a),
        )
        return group(...nodes)
    })

    s.add(liveVault, vault3d, shot1Title, liveLaser)
    const sceneRem = Math.max(8.0, c.end - c.start - 0.2)
    const laserCue = c.cue('Fire one random')
    const shot2Rem = Math.max(2.0, c.end - laserCue.start - 0.15)
    c.at(0.05, () => {
        s.play(
            vaultSpin.to(5.5, { duration: Math.min(12.0, sceneRem), ease: linear }),
            vault3d.orbit({ theta: 1.85, phi: 0.94 }, { duration: Math.min(12.0, sceneRem), ease: linear }),
        )
    })
    c.on('compress an entire', () => {
        s.play(compress.to(1, { duration: 2.4 }))
    })
    c.on('Fire one random', () => {
        s.play(
            showVault.to(0, { duration: 0.28 }),
            showLaser.to(1, { duration: 0.3 }),
            laserProg.to(1, { duration: Math.min(3.5, shot2Rem), ease: linear }),
            shot2Loop.to(5.2, { duration: shot2Rem, ease: linear }),
        )
    })
    c.hide('Fire one random', shot1Title)
    c.hide('Fire one random', vault3d)
}

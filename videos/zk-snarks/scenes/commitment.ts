import {
    Node, circle, contourPaths, dot, dynamic, group, line, linear, linearGradient, polyPath,
    radialGradient, rect, tex, type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// Exact elliptic curve y^2 = x^3 + 7 extracted via Vizmatic marching-squares contourPaths!
const EC_CONTOURS = contourPaths((x, y) => y * y - (x * x * x + 7), {
    x: [-2.15, 3.1],
    y: [-5.4, 5.4],
    levels: [0],
    resolution: [96, 96],
})

// Map elliptic curve contours cleanly into the lower-left elliptic-curve panel
const EC_BOX_X = -465
const EC_BOX_Y = 335
const EC_W = 470
const EC_H = 165
const mapEcX = (x: number) => EC_BOX_X - EC_W / 2 + 42 + ((x + 2.15) / 5.25) * (EC_W - 84)
const mapEcY = (y: number) => EC_BOX_Y - (y / 5.4) * (EC_H / 2 - 18)

const EC_PATHS: Vec[][] = (EC_CONTOURS[0]?.paths ?? []).map((path) =>
    path.map(([x, y]) => [mapEcX(x), mapEcY(y)] as Vec),
)

function quadBezier(p0: Vec, p1: Vec, p2: Vec, t: number): Vec {
    const u = 1 - t
    return [
        u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
        u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]
}

function sampleQuad(p0: Vec, p1: Vec, p2: Vec, steps = 34): Vec[] {
    return Array.from({ length: steps }, (_, i) => quadBezier(p0, p1, p2, i / (steps - 1)))
}

const SHIELD_Y = 20

// Clean glowing directional CRS arcs (g^1, g^s, g^{s^2}, g^{s^3}) curving into the encrypted shield
const CRS_ARCS: readonly {
    readonly label: string
    readonly p0: Vec
    readonly p1: Vec
    readonly p2: Vec
    readonly pts: Vec[]
    readonly col: string
    readonly phase: number
    readonly labelPos: Vec
}[] = [
    {
        label: 'g¹',
        p0: [-575, SHIELD_Y - 34],
        p1: [-395, SHIELD_Y - 128],
        p2: [-202, SHIELD_Y - 62],
        pts: sampleQuad([-575, SHIELD_Y - 34], [-395, SHIELD_Y - 128], [-202, SHIELD_Y - 62]),
        col: '#5ce1e6',
        phase: 0.0,
        labelPos: [-395, SHIELD_Y - 108],
    },
    {
        label: 'gˢ',
        p0: [-570, SHIELD_Y - 10],
        p1: [-395, SHIELD_Y - 46],
        p2: [-210, SHIELD_Y - 18],
        pts: sampleQuad([-570, SHIELD_Y - 10], [-395, SHIELD_Y - 46], [-210, SHIELD_Y - 18]),
        col: '#60a5fa',
        phase: 0.25,
        labelPos: [-395, SHIELD_Y - 52],
    },
    {
        label: 'gˢ²',
        p0: [-570, SHIELD_Y + 14],
        p1: [-395, SHIELD_Y + 46],
        p2: [-210, SHIELD_Y + 20],
        pts: sampleQuad([-570, SHIELD_Y + 14], [-395, SHIELD_Y + 46], [-210, SHIELD_Y + 20]),
        col: '#a78bfa',
        phase: 0.5,
        labelPos: [-395, SHIELD_Y + 58],
    },
    {
        label: 'gˢ³',
        p0: [-575, SHIELD_Y + 38],
        p1: [-395, SHIELD_Y + 128],
        p2: [-202, SHIELD_Y + 64],
        pts: sampleQuad([-575, SHIELD_Y + 38], [-395, SHIELD_Y + 128], [-202, SHIELD_Y + 64]),
        col: '#ffd166',
        phase: 0.75,
        labelPos: [-395, SHIELD_Y + 112],
    },
]

// Clean outgoing encrypted proof arcs from Shield -> Verifier
const VERIFY_ARCS: readonly {
    readonly p0: Vec
    readonly p1: Vec
    readonly p2: Vec
    readonly pts: Vec[]
    readonly col: string
    readonly phase: number
}[] = [
    {
        p0: [208, SHIELD_Y - 36],
        p1: [395, SHIELD_Y - 72],
        p2: [572, SHIELD_Y - 22],
        pts: sampleQuad([208, SHIELD_Y - 36], [395, SHIELD_Y - 72], [572, SHIELD_Y - 22]),
        col: '#ffd166',
        phase: 0.12,
    },
    {
        p0: [212, SHIELD_Y],
        p1: [395, SHIELD_Y],
        p2: [572, SHIELD_Y],
        pts: sampleQuad([212, SHIELD_Y], [395, SHIELD_Y], [572, SHIELD_Y]),
        col: '#6ee7b7',
        phase: 0.45,
    },
    {
        p0: [208, SHIELD_Y + 36],
        p1: [395, SHIELD_Y + 72],
        p2: [572, SHIELD_Y + 22],
        pts: sampleQuad([208, SHIELD_Y + 36], [395, SHIELD_Y + 72], [572, SHIELD_Y + 22]),
        col: '#5ce1e6',
        phase: 0.78,
    },
]

export const commitment: SceneFunction = (s, c) => {
    const showCatch = s.value(1)
    const flexPhase = s.value(0)
    const showShield = s.value(0)
    const shieldFlow = s.value(0)
    const verifyHit = s.value(0)

    const catchTitle = group(
        txt('THE TWO-SIDED TRAP', 0, -370, 26, '#ff6b8b', 'mono'),
        txt('Know s in advance? Forge the curve.', -440, 250, 32, '#ff6b8b', 'sans'),
        txt('Send full P(t)? Leak secret x.', 440, 250, 32, '#d4c2ff', 'sans'),
    )

    const liveCatch = dynamic(() => {
        if (showCatch.value < 0.02) return []
        const a = showCatch.value
        const ph = flexPhase.value
        const pts: Vec[] = Array.from({ length: 100 }, (_, i) => {
            const x = -760 + (980 * i) / 99
            const distFromTrap = (x + 280) / 230
            const y = -20 + Math.sin(distFromTrap * 1.4 + ph) * 95 * (1 - Math.exp(-distFromTrap * distFromTrap * 1.6))
            return [x, y] as Vec
        })
        return group(
            line([-770, -20], [230, -20], { stroke: '#293556', width: 2, opacity: 0.7 * a }),
            new Node(polyPath(pts)).stroke('#ff6b8b', 4.5, 0.9 * a).glow(10, '#ff6b8b').set('blend', 'screen'),
            circle(24 + Math.sin(ph * 2) * 5, { fill: '#ff6b8b26', stroke: '#ff6b8b', width: 3 }).at(-280, -20).opacity(a).glow(10, '#ff6b8b'),
            dot(7, '#ffffff').at(-280, -20).opacity(a),
            txt('Exposed point  s', -280, -135, 30, '#ff6b8b', 'mono').opacity(a),
            circle(110, { fill: '#a78bfa18', stroke: '#a78bfa', width: 2.8, dash: [8, 8] }).at(475, -20).opacity(a).glow(8, '#a78bfa'),
            txt('x = 3 ?', 475, -20, 38, '#ffd166', 'mono').opacity(a).glow(8, '#ffd166'),
        )
    })

    // Shot 2: Homomorphic elliptic-curve blinding g^{P(s)}
    const shieldTitle = group(
        txt('HOMOMORPHIC ELLIPTIC-CURVE BLINDING', 0, -430, 26, '#c4b5fd', 'mono'),
        tex(String.raw`g^{P(s)} \;=\; \prod_{k=0}^{d} \left(g^{s^k}\right)^{c_k}`, { size: 50, color: '#ffd166' }).at(0, -315).glow(8, '#ffd166'),
    )

    const ecGrad = linearGradient([EC_BOX_X - 200, EC_BOX_Y], [EC_BOX_X + 200, EC_BOX_Y], ['#5ce1e6', '#a78bfa', '#ffd166'])

    const liveShield = dynamic(() => {
        if (showShield.value < 0.02) return []
        const a = showShield.value
        const f = shieldFlow.value
        const v = verifyHit.value
        const pulse = 185 + Math.sin(f * 3) * 4

        const nodes: Node[] = [
            // Radial violet-gold nebula around the homomorphic shield
            circle(410, {
                fill: radialGradient([0, 0], 410, [
                    [0, '#a78bfa34'],
                    [0.5, '#ffd16618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, SHIELD_Y).opacity(a),
        ]

        // Clean glowing directional CRS arcs (g^1, g^s, g^{s^2}, g^{s^3}) from Prover -> Shield
        for (const arcSpec of CRS_ARCS) {
            const u = (f * 0.52 + arcSpec.phase) % 1
            const [px, py] = quadBezier(arcSpec.p0, arcSpec.p1, arcSpec.p2, u)
            nodes.push(
                new Node(polyPath(arcSpec.pts)).stroke(arcSpec.col, 3.0, 0.72 * a).glow(8, arcSpec.col).set('blend', 'screen'),
                dot(7.0, arcSpec.col).at(px, py).opacity(a).glow(12, arcSpec.col).set('blend', 'screen'),
                dot(3.4, '#ffffff').at(px, py).opacity(a).set('blend', 'screen'),
                txt(arcSpec.label, arcSpec.labelPos[0], arcSpec.labelPos[1], 26, arcSpec.col, 'mono').opacity(0.95 * a).glow(6, arcSpec.col),
            )
        }

        // Clean directional encrypted evaluation arcs from Shield -> Verifier
        for (const va of VERIFY_ARCS) {
            const u = (f * 0.56 + va.phase) % 1
            const [px, py] = quadBezier(va.p0, va.p1, va.p2, u)
            nodes.push(
                new Node(polyPath(va.pts)).stroke(va.col, 3.2, 0.76 * a).glow(8, va.col).set('blend', 'screen'),
                dot(7.0, va.col).at(px, py).opacity(a).glow(12, va.col).set('blend', 'screen'),
                dot(3.4, '#ffffff').at(px, py).opacity(a).set('blend', 'screen'),
            )
        }

        // Prover, Encrypted Shield, and Verifier nodes
        nodes.push(
            // Prover side (left)
            circle(76, { fill: '#0e172a', stroke: '#5ce1e6', width: 3.6 }).at(-650, SHIELD_Y).opacity(a).glow(10, '#5ce1e6'),
            txt('PROVER', -650, SHIELD_Y - 2, 28, '#5ce1e6', 'mono').opacity(a),
            txt('Knows x = 3', -650, SHIELD_Y + 114, 28, '#d4def2', 'sans').opacity(a),
            txt('Never sees s', -650, SHIELD_Y + 154, 28, '#e2d2ff', 'mono').opacity(a).glow(8, '#a78bfa'),
            // Verifier side (right)
            circle(76, { fill: '#0e172a', stroke: v > 0.3 ? '#6ee7b7' : '#ffd166', width: 3.6 })
                .at(650, SHIELD_Y)
                .opacity(a)
                .glow(10, v > 0.3 ? '#6ee7b7' : '#ffd166'),
            txt('VERIFIER', 650, SHIELD_Y - 2, 26, v > 0.3 ? '#6ee7b7' : '#ffd166', 'mono').opacity(a),
            txt('Checks pairing', 650, SHIELD_Y + 114, 28, '#d4def2', 'sans').opacity(a),
            txt('Never sees x', 650, SHIELD_Y + 154, 28, '#6ee7b7', 'mono').opacity(a).glow(8, '#6ee7b7'),
            // Encrypted homomorphic shield at center
            circle(pulse, { fill: '#120d26', stroke: '#a78bfa', width: 4.2 }).at(0, SHIELD_Y).opacity(a).glow(16, '#a78bfa'),
            circle(pulse + 22, { fill: null, stroke: '#5ce1e6', width: 1.8, dash: [10, 12] }).at(0, SHIELD_Y).opacity(0.68 * a),
            txt('ENCRYPTED SHIELD', 0, SHIELD_Y - 108, 26, '#d4c2ff', 'mono').opacity(a),
            txt('CRS: g¹ · gˢ · gˢ² · gˢ³', 0, SHIELD_Y - 50, 26, '#5ce1e6', 'mono').opacity(a),
            tex(String.raw`g^{P(s)}`, { size: 60, color: '#ffd166' }).at(0, SHIELD_Y + 32).opacity(a).glow(12, '#ffd166'),
            txt('s hidden forever', 0, SHIELD_Y + 114, 26, '#d4def2', 'sans').opacity(a),
        )

        // Lower third: Luminous elliptic curve y^2 = x^3 + 7 (contourPaths) + Bilinear pairing equation e(g^A, g^B) = e(g, g)^{AB}
        nodes.push(
            // Left lower panel: Elliptic curve y^2 = x^3 + 7
            rect(EC_W, EC_H, { fill: '#0c1222dc', stroke: '#3a4f7c', width: 2.2, radius: 14 }).at(EC_BOX_X, EC_BOX_Y).opacity(a),
            line([EC_BOX_X - EC_W / 2 + 24, EC_BOX_Y], [EC_BOX_X + EC_W / 2 - 24, EC_BOX_Y], { stroke: '#2c3d66', width: 1.5, opacity: 0.75 * a }),
            line([mapEcX(0), EC_BOX_Y - EC_H / 2 + 16], [mapEcX(0), EC_BOX_Y + EC_H / 2 - 16], { stroke: '#2c3d66', width: 1.5, opacity: 0.75 * a }),
        )
        for (const path of EC_PATHS) {
            if (path.length >= 2) {
                nodes.push(
                    new Node(polyPath(path)).stroke(ecGrad, 4.4, 0.94 * a).glow(10, '#a78bfa').set('blend', 'screen'),
                    new Node(polyPath(path)).stroke('#ffffff', 1.3, 0.55 * a).set('blend', 'screen'),
                )
            }
        }
        // Animated generator point G gliding along y^2 = x^3 + 7
        const gx = -1.6 + ((f * 0.45) % 1) * 3.8
        const gy = Math.sqrt(Math.max(0, gx * gx * gx + 7))
        nodes.push(
            dot(7, '#ffd166').at(mapEcX(gx), mapEcY(gy)).opacity(a).glow(12, '#ffd166').set('blend', 'screen'),
            dot(3.2, '#ffffff').at(mapEcX(gx), mapEcY(gy)).opacity(a).set('blend', 'screen'),
            txt('y² = x³ + 7', EC_BOX_X - 115, EC_BOX_Y - 52, 26, '#e2d2ff', 'mono').opacity(a).glow(6, '#a78bfa'),
            txt('BN254 CURVE', EC_BOX_X - 115, EC_BOX_Y + 56, 26, '#5ce1e6', 'mono').opacity(0.95 * a),
        )

        // Right lower panel: Bilinear pairing equation e(g^A, g^B) = e(g, g)^{AB}
        const pairBoxX = 285
        const pairStroke = v > 0.3 ? '#6ee7b7' : '#5ce1e6'
        nodes.push(
            rect(850, EC_H, { fill: '#0c1222dc', stroke: pairStroke, width: v > 0.3 ? 3.0 : 2.2, radius: 14 })
                .at(pairBoxX, EC_BOX_Y)
                .opacity(a)
                .glow(v > 0.3 ? 12 : 6, pairStroke),
            txt(v > 0.3 ? 'BILINEAR PAIRING CHECK  ·  VALID ✓' : 'BILINEAR PAIRING CHECK', pairBoxX, EC_BOX_Y - 50, 26, '#6ee7b7', 'mono')
                .opacity(a)
                .glow(6, '#6ee7b7'),
            tex(String.raw`e\!\left(g^{A},\, g^{B}\right) \;=\; e(g, g)^{A B}`, { size: 46, color: '#f8f4ec' })
                .at(pairBoxX, EC_BOX_Y + 18)
                .opacity(a)
                .glow(8, '#6ee7b7'),
        )
        return group(...nodes)
    })

    s.add(liveCatch, catchTitle, liveShield)
    c.at(0.1, () => s.play(flexPhase.to(4.2, { duration: 7.5, ease: linear })))

    const shieldRem = Math.max(4.0, c.end - c.cue('Elliptic-curve blinding').start - 0.2)
    c.on('Elliptic-curve blinding', () => {
        s.play(
            showCatch.to(0, { duration: 0.3 }),
            showShield.to(1, { duration: 0.35 }),
            shieldFlow.to(5.6, { duration: shieldRem, ease: linear }),
        )
    })
    c.swap('Elliptic-curve blinding', catchTitle, shieldTitle)
    c.on('checks the pairing', () => {
        s.play(verifyHit.to(1, { duration: 0.9 }))
    })
}

import {
    Node, circle, dot, dynamic, group, line, linear, linearGradient, polyPath, radialGradient, tex,
    type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// Real elliptic curve y^2 = x^3 + 7 (secp256k1 / BN-style smooth cubic curve) drawn in dark cinema space
const EC_UPPER: Vec[] = []
const EC_LOWER: Vec[] = []
const EC_X_START = -Math.cbrt(7) + 0.002
for (let i = 0; i <= 140; i++) {
    const u = i / 140
    const x = EC_X_START + u * u * 3.8
    const y = Math.sqrt(Math.max(0, x * x * x + 7))
    const sx = -260 + x * 135
    const sy = y * 30
    if (sy < 195) {
        EC_UPPER.push([sx, 20 - sy])
        EC_LOWER.push([sx, 20 + sy])
    }
}

export const commitment: SceneFunction = (s, c) => {
    const showCatch = s.value(1)
    const flexPhase = s.value(0)
    const showShield = s.value(0)
    const shieldFlow = s.value(0)
    const verifyHit = s.value(0)

    const catchTitle = group(
        txt('THE TWO-SIDED TRAP', 0, -370, 26, '#ff6b8b', 'mono'),
        txt('Know s in advance? Forge the curve.', -440, 250, 32, '#ff6b8b', 'sans'),
        txt('Send full P(t)? Leak secret x.', 440, 250, 32, '#a78bfa', 'sans'),
    )

    const liveCatch = dynamic(() => {
        if (showCatch.value < 0.02) return []
        const a = showCatch.value
        const ph = flexPhase.value
        const pts: Vec[] = Array.from({ length: 100 }, (_, i) => {
            const x = -760 + (980 * i) / 99
            const distFromTrap = (x + 280) / 230
            // Curve bends artificially to hit the known point (-280, -20)
            const y = -20 + Math.sin(distFromTrap * 1.4 + ph) * 95 * (1 - Math.exp(-distFromTrap * distFromTrap * 1.6))
            return [x, y] as Vec
        })
        return group(
            line([-770, -20], [230, -20], { stroke: '#293556', width: 2, opacity: 0.7 * a }),
            new Node(polyPath(pts)).stroke('#ff6b8b', 4.5, 0.9 * a).glow(10, '#ff6b8b'),
            circle(24 + Math.sin(ph * 2) * 5, { fill: '#ff6b8b26', stroke: '#ff6b8b', width: 3 }).at(-280, -20).opacity(a).glow(10, '#ff6b8b'),
            dot(7, '#ffffff').at(-280, -20).opacity(a),
            txt('Exposed point  s', -280, -135, 30, '#ff6b8b', 'mono').opacity(a),
            circle(110, { fill: '#a78bfa18', stroke: '#a78bfa', width: 2.8, dash: [8, 8] }).at(475, -20).opacity(a).glow(8, '#a78bfa'),
            txt('x = 3 ?', 475, -20, 38, '#ffd166', 'mono').opacity(a).glow(8, '#ffd166'),
        )
    })

    // Shot 2: Homomorphic elliptic-curve blinding g^{P(s)}
    const shieldTitle = group(
        txt('HOMOMORPHIC ELLIPTIC-CURVE BLINDING', 0, -430, 26, '#a78bfa', 'mono'),
        tex(String.raw`g^{P(s)} \;=\; \prod_{k=0}^{d} \left(g^{s^k}\right)^{c_k}`, { size: 52, color: '#ffd166' }).at(0, -305).glow(8, '#ffd166'),
    )

    const flowGrad = linearGradient([-680, 55], [680, 55], ['#5ce1e6', '#a78bfa', '#ffd166', '#6ee7b7'])

    const liveShield = dynamic(() => {
        if (showShield.value < 0.02) return []
        const a = showShield.value
        const f = shieldFlow.value
        const v = verifyHit.value
        const cy = 55
        const pulse = 198 + Math.sin(f * 3) * 5

        const nodes: Node[] = [
            // Elliptic curve backdrop glowing gently on the sides outside shield & top formula
            new Node(polyPath(EC_UPPER)).stroke('#a78bfa', 2.2, 0.22 * a).glow(5, '#a78bfa'),
            new Node(polyPath(EC_LOWER)).stroke('#a78bfa', 2.2, 0.22 * a).glow(5, '#a78bfa'),
            // Radial violet nebula around the homomorphic shield
            circle(420, {
                fill: radialGradient([0, 0], 420, [
                    [0, '#a78bfa30'],
                    [0.5, '#ffd16618'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(0, cy).opacity(a),
            // Prover side (left)
            circle(78, { fill: '#0e172a', stroke: '#5ce1e6', width: 3.5 }).at(-650, cy).opacity(a).glow(10, '#5ce1e6'),
            txt('PROVER', -650, cy - 2, 28, '#5ce1e6', 'mono').opacity(a),
            txt('Knows x = 3', -650, cy + 125, 28, '#cbd5e8', 'sans').opacity(a),
            txt('Never sees s', -650, cy + 168, 28, '#a78bfa', 'mono').opacity(a),
            // Verifier side (right)
            circle(78, { fill: '#0e172a', stroke: v > 0.3 ? '#6ee7b7' : '#ffd166', width: 3.5 }).at(650, cy).opacity(a).glow(10, v > 0.3 ? '#6ee7b7' : '#ffd166'),
            txt('VERIFIER', 650, cy - 2, 26, v > 0.3 ? '#6ee7b7' : '#ffd166', 'mono').opacity(a),
            txt('Checks pairing', 650, cy + 125, 28, '#cbd5e8', 'sans').opacity(a),
            txt('Never sees x', 650, cy + 168, 28, '#6ee7b7', 'mono').opacity(a),
            // Encrypted homomorphic shield at center (opaque fill hides background EC lines cleanly!)
            circle(pulse, { fill: '#120d26', stroke: '#a78bfa', width: 4 }).at(0, cy).opacity(a).glow(14, '#a78bfa'),
            circle(pulse + 24, { fill: null, stroke: '#5ce1e6', width: 1.8, dash: [10, 12] }).at(0, cy).opacity(0.65 * a),
            txt('ENCRYPTED SHIELD', 0, cy - 115, 26, '#a78bfa', 'mono').opacity(a),
            txt('g¹ · gˢ · gˢ² · gˢ³', 0, cy - 52, 28, '#5ce1e6', 'mono').opacity(a),
            tex(String.raw`g^{P(s)}`, { size: 62, color: '#ffd166' }).at(0, cy + 36).opacity(a).glow(12, '#ffd166'),
            txt('s hidden forever', 0, cy + 122, 26, '#cbd5e8', 'sans').opacity(a),
            // Flowing coefficient beams left -> shield -> verifier
            line([-565, cy], [-230, cy], { stroke: flowGrad, width: 4.2, opacity: 0.85 * a }).glow(8, '#5ce1e6'),
            line([230, cy], [565, cy], { stroke: flowGrad, width: 4.2, opacity: 0.85 * a }).glow(8, '#ffd166'),
        ]

        // Moving encrypted photons along the two channels
        for (let k = 0; k < 3; k++) {
            const t1 = (f * 0.55 + k / 3) % 1
            const x1 = -555 + t1 * 315
            nodes.push(dot(6.5, '#5ce1e6').at(x1, cy).opacity(a).glow(10, '#5ce1e6'))
            const t2 = (f * 0.55 + k / 3 + 0.2) % 1
            const x2 = 240 + t2 * 315
            nodes.push(dot(6.5, '#ffd166').at(x2, cy).opacity(a).glow(10, '#ffd166'))
        }

        if (v > 0.05) {
            nodes.push(
                tex(String.raw`e\!\left(g^{P(s)},\, g\right) \;=\; e\!\left(g^{H(s)},\, g^{Z(s)}\right)`, { size: 42, color: '#6ee7b7' })
                    .at(-85, 355)
                    .opacity(v * a)
                    .glow(8, '#6ee7b7'),
                txt('·  VALID ✓', 330, 355, 34, '#6ee7b7', 'mono').opacity(v * a).glow(8, '#6ee7b7'),
            )
        }
        return group(...nodes)
    })

    s.add(liveCatch, catchTitle, liveShield)
    c.at(0.1, () => s.play(flexPhase.to(4.2, { duration: 7.5, ease: linear })))

    c.on('Elliptic-curve blinding', () => {
        s.play(showCatch.to(0, { duration: 0.3 }))
        s.play(showShield.to(1, { duration: 0.35 }))
        s.play(shieldFlow.to(4.8, { duration: 9.2, ease: linear }))
    })
    c.swap('Elliptic-curve blinding', catchTitle, shieldTitle)
    c.on('checks the pairing', () => {
        s.play(verifyHit.to(1, { duration: 0.9 }))
    })
}

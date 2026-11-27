import {
    Node, circle, curve3d, delay, dot, dynamic, group, line, linear, par, parametricSurface, point3d, radialGradient,
    scene3d,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

export const worlds: SceneFunction = (s, c) => {
    const showEq = s.value(1)
    const eqProg = s.value(0)
    const showNeq = s.value(0)
    const photonT = s.value(0)

    // ── Shot 1: IF P = NP (Clean, zero caveats!) ──
    const eqHeader = group(
        txt('IF  P = NP', 0, -412, 28, COSMOS.rose, 'mono'),
        txt('Encryption shatters — discovery becomes fast search', 0, -342, 52, COSMOS.ink, 'serif')
            .glow(6, COSMOS.rose),
    )

    const liveEq = dynamic(() => {
        const a = showEq.value
        if (a < 0.02) return []
        const p = eqProg.value
        const ph = photonT.value
        const nodes: Node[] = []

        const cx = 0
        const cy = 0
        // Three luminous consequence orbs arranged cleanly around the central P = NP core
        // (Zero text inside the connecting radial corridors!)
        const orbs = [
            { x: -575, y: 12, title: 'CRYPTO', sub: 'SHATTERS', d1: 'RSA · AES · Signatures', d2: 'One-way functions DIE', col: COSMOS.rose },
            { x: 575, y: -135, title: 'PROOFS', sub: 'AUTOMATED', d1: 'Short math proofs ∈ NP', d2: 'Search finds proofs fast', col: COSMOS.gold },
            { x: 575, y: 158, title: 'SCIENCE', sub: 'UNLOCKED', d1: 'Proteins · Chips · Routing', d2: 'NP-hard → fast solver', col: COSMOS.emerald },
        ] as const

        // Connecting glowing filaments from center orb edge (r=136) to outer orb edge (r=126)
        for (let i = 0; i < orbs.length; i++) {
            const o = orbs[i]!
            const vis = Math.max(0, Math.min(1, p * 3.0 - i * 0.45))
            if (vis < 0.02) continue
            const dx = o.x - cx
            const dy = o.y - cy
            const dist = Math.hypot(dx, dy)
            const ux = dx / dist
            const uy = dy / dist
            const p0: [number, number] = [cx + ux * 140, cy + uy * 140]
            const p1: [number, number] = [o.x - ux * 130, o.y - uy * 130]
            const t = (ph * 1.3 + i * 0.33) % 1
            nodes.push(
                line(p0, p1, { stroke: o.col, width: 4.0 }).glow(10, o.col).opacity(vis * a).set('blend', 'screen'),
                dot(7.5, '#ffffff')
                    .at(p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t)
                    .glow(16, o.col).opacity(vis * a).set('blend', 'screen'),
                circle(122, {
                    fill: radialGradient([0, 0], 122, [
                        [0, `${o.col}38`],
                        [0.7, `${o.col}12`],
                        [1, '#07091000'],
                    ]),
                    stroke: o.col,
                    width: 3.0,
                }).at(o.x, o.y).glow(14, o.col).opacity(vis * a),
                txt(o.title, o.x, o.y - 22, 32, COSMOS.ink, 'serif').opacity(vis * a),
                txt(o.sub, o.x, o.y + 24, 28, o.col, 'mono').glow(6, o.col).opacity(vis * a),
            )
        }

        // Clean detail callouts flanking outer sides (zero overlap with radial lines!)
        if (p > 0.12) {
            const op1 = Math.min(1, (p - 0.12) * 3) * a
            nodes.push(
                txt('RSA · AES · Signatures', -575, 174, 27, COSMOS.ink, 'sans').opacity(op1),
                txt('One-way functions DIE', -575, 218, 26, COSMOS.rose, 'mono').opacity(op1),
            )
        }
        if (p > 0.45) {
            const op2 = Math.min(1, (p - 0.45) * 3) * a
            nodes.push(
                txt('Short math proofs ∈ NP', 575, -285, 26, COSMOS.gold, 'mono').opacity(op2),
                txt('Proteins · Chips · Routing', 575, 312, 26, COSMOS.emerald, 'mono').opacity(op2),
            )
        }

        // Central blazing P = NP orb
        nodes.push(
            circle(136, {
                fill: radialGradient([0, 0], 136, [
                    [0, '#ffd16640'],
                    [0.65, '#ff6b8b1a'],
                    [1, '#07091000'],
                ]),
                stroke: COSMOS.gold,
                width: 3.8,
            }).at(cx, cy).glow(18, COSMOS.gold).opacity(a),
            txt('P = NP', cx, cy - 12, 52, COSMOS.gold, 'serif').glow(8, COSMOS.gold).opacity(a),
            txt('COLLAPSE', cx, cy + 40, 26, COSMOS.rose, 'mono').opacity(a),
        )

        return group(...nodes)
    })

    // ── Shot 2: IF P != NP (Orbiting 3D Nested Complexity Shells with exact surface-hugging rings!) ──
    const R_NP = 3.10
    const R_P = 1.32
    const Z_P = -0.55
    const Z_CROWN = 2.02
    const R_CROWN = Math.sqrt(R_NP * R_NP - Z_CROWN * Z_CROWN) + 0.03

    const neqView = scene3d({
        theta: -0.72,
        phi: 1.04,
        distance: 15.8,
        unit: 112,
        perspective: true,
        ambient: 0.42,
        shine: 0.38,
        brightness: 1.14,
        fog: 0.1,
        focus: [0, 0, 0.15],
    }).at(320, 8)

    // Closed-pole outer NP sphere (violet) + closed-pole inner P core sphere (cyan) + exact surface-hugging rings!
    neqView.add(
        // Outer NP sphere (v in [0, 1] -> closed poles, zero polar holes!)
        parametricSurface(
            (u, v): Vec3 => {
                const th = u * Math.PI * 2
                const ph = v * Math.PI
                return [R_NP * Math.sin(ph) * Math.cos(th), R_NP * Math.sin(ph) * Math.sin(th), R_NP * Math.cos(ph)]
            },
            [0, 1],
            [0, 1],
            { resolution: [56, 32], color: '#4c2f8a', opacity: 0.22, mesh: '#a78bfa', meshOpacity: 0.14, meshWidth: 0.45 },
        ),
        // Inner P crystal core (v in [0, 1] -> closed poles, zero polar holes!)
        parametricSurface(
            (u, v): Vec3 => {
                const th = u * Math.PI * 2
                const ph = v * Math.PI
                return [R_P * Math.sin(ph) * Math.cos(th), R_P * Math.sin(ph) * Math.sin(th), R_P * Math.cos(ph) + Z_P]
            },
            [0, 1],
            [0, 1],
            { resolution: [48, 28], color: COSMOS.cyan, opacity: 0.46, mesh: '#7ce8ff', meshOpacity: 0.18, meshWidth: 0.45 },
        ),
        // Exact equator ring hugging the outer NP sphere (radius = R_NP + 0.03)
        curve3d(
            (t): Vec3 => [Math.cos(t * Math.PI * 2) * (R_NP + 0.03), Math.sin(t * Math.PI * 2) * (R_NP + 0.03), 0],
            0,
            1,
            { color: COSMOS.violet, width: 2.4, opacity: 0.76, glow: 10, blend: 'screen', samples: 220 },
        ),
        // Exact equatorial P ring hugging the inner cyan P sphere (radius = R_P + 0.03)
        curve3d(
            (t): Vec3 => [Math.cos(t * Math.PI * 2) * (R_P + 0.03), Math.sin(t * Math.PI * 2) * (R_P + 0.03), Z_P],
            0,
            1,
            { color: COSMOS.cyan, width: 3.6, glow: 12, blend: 'screen', samples: 200 },
        ),
        // Blazing golden NP-Complete crown ring hugging exact latitude z = Z_CROWN on the outer NP sphere!
        curve3d(
            (t): Vec3 => [Math.cos(t * Math.PI * 2) * R_CROWN, Math.sin(t * Math.PI * 2) * R_CROWN, Z_CROWN],
            0,
            1,
            { color: COSMOS.gold, width: 5.2, glow: 16, blend: 'screen', samples: 220 },
        ),
        // Orbiting photons locked precisely to the golden crown and cyan P equator
        point3d((): Vec3 => {
            const ang = photonT.value * Math.PI * 2
            return [Math.cos(ang) * R_CROWN, Math.sin(ang) * R_CROWN, Z_CROWN]
        }, { color: '#ffffff', radius: 9.5, glow: 20, blend: 'screen' }),
        point3d((): Vec3 => {
            const ang = -photonT.value * Math.PI * 2.4
            return [Math.cos(ang) * (R_P + 0.03), Math.sin(ang) * (R_P + 0.03), Z_P]
        }, { color: COSMOS.cyan, radius: 7.5, glow: 14, blend: 'screen' }),
    )

    const neqAura = circle(440, {
        fill: radialGradient([0, 0], 440, [
            [0, '#4c2f8a2c'],
            [0.28, '#5ce1e61c'],
            [0.58, '#2b1d5410'],
            [0.82, '#140f2606'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(320, 8).set('blend', 'screen')

    const neqCopy = group(
        txt('IF  P ≠ NP', -855, -395, 28, COSMOS.cyan, 'mono', 'left'),
        txt('Creativity', -860, -310, 68, COSMOS.ink, 'serif', 'left'),
        txt('≠ Checking', -860, -230, 68, COSMOS.violet, 'serif', 'left').glow(8, COSMOS.violet),
        dot(7, COSMOS.gold).at(-842, -82).glow(10, COSMOS.gold),
        txt('Finding stays harder than verifying', -814, -82, 30, COSMOS.ink, 'sans', 'left'),
        dot(7, COSMOS.emerald).at(-842, 6).glow(10, COSMOS.emerald),
        txt('Modern encryption can survive', -814, 6, 30, COSMOS.ink, 'sans', 'left'),
        dot(7, COSMOS.cyan).at(-842, 94).glow(10, COSMOS.cyan),
        txt('AI & heuristics stay essential', -814, 94, 30, COSMOS.ink, 'sans', 'left'),
        // Clean flanking 2D captions above/below the 3D shell
        txt('↑  NP-COMPLETE CROWN', 320, -405, 26, COSMOS.gold, 'mono'),
        txt('↓  CYAN CORE = P   ·   REAL GAP INSIDE NP', 320, 428, 26, COSMOS.cyan, 'mono'),
    )

    s.add(eqHeader, liveEq)
    const sceneDur = Math.max(8, c.end - c.start - 0.5)
    const neqRel = c.cue('If P does not equal').start - c.start
    const neqDur = Math.max(4.0, c.end - c.cue('If P does not equal').start - 0.5)

    c.at(0.1, () => {
        s.play(par(
            photonT.to(4.2, { duration: sceneDur, ease: linear }),
            eqProg.to(1, { duration: Math.max(4.0, neqRel - 0.4), ease: linear }),
        ))
    })

    c.swap('If P does not equal', eqHeader, [neqAura, neqView, neqCopy])
    c.at(neqRel, () => {
        s.play(par(
            showEq.to(0, { duration: 0.16 }),
            delay(showNeq.to(1, { duration: 0.25 }), 0.2),
            delay(neqView.orbit({ theta: 0.22, phi: 0.88 }, { duration: neqDur }), 0.15),
        ))
    })
}

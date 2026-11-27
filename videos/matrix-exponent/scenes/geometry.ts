import {
    Node, circle, delay, dot, dynamic, group, line, line3d, linear, par, point3d, radialGradient, rect, scene3d, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

// Equilateral base triangle of sites A, B, C + lifted CAT(0) tripod hub O
const R = 3.25
const SITE_A: Vec3 = [R * Math.cos(Math.PI / 6), R * Math.sin(Math.PI / 6), -0.55]
const SITE_B: Vec3 = [R * Math.cos((5 * Math.PI) / 6), R * Math.sin((5 * Math.PI) / 6), -0.55]
const SITE_C: Vec3 = [0, -R, -0.55]
const HUB_FLAT: Vec3 = [0, 0, -0.55]
const HUB_TRIPOD: Vec3 = [0, 0, 2.55]

function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

export const geometry: SceneFunction = (s, c) => {
    const tripodLift = s.value(0)
    const photonT = s.value(0)
    const showEqRatio = s.value(0)
    const showGeom = s.value(1)
    const showContra = s.value(0)
    const contraStep = s.value(0)

    // ── Shot 1: Orbiting 3D Tensor Triangle morphing into CAT(0) Unit-Arm Tripod ──
    const geoView = scene3d({
        theta: -0.76,
        phi: 1.04,
        distance: 14.8,
        unit: 118,
        perspective: true,
        ambient: 0.42,
        shine: 0.35,
        brightness: 1.12,
        fog: 0.1,
        focus: [0, 0, 0.55],
    }).at(340, 8)

    const curHub = (): Vec3 => lerp3(HUB_FLAT, HUB_TRIPOD, tripodLift.value)

    geoView.add(
        // Three pairwise index wires (i, j, k) connecting sites A, B, C
        line3d(SITE_A, SITE_B, { color: COSMOS.cyan, width: 4.5, glow: 12, blend: 'screen', opacity: 0.94 }),
        line3d(SITE_B, SITE_C, { color: COSMOS.violet, width: 4.5, glow: 12, blend: 'screen', opacity: 0.94 }),
        line3d(SITE_C, SITE_A, { color: COSMOS.blue, width: 4.5, glow: 12, blend: 'screen', opacity: 0.94 }),
        // Three golden tripod arms connecting sites A, B, C to the shared-label hub l
        line3d(SITE_A, curHub, { color: COSMOS.gold, width: 5.2, glow: 14, blend: 'screen', opacity: 0.98 }),
        line3d(SITE_B, curHub, { color: COSMOS.gold, width: 5.2, glow: 14, blend: 'screen', opacity: 0.98 }),
        line3d(SITE_C, curHub, { color: COSMOS.gold, width: 5.2, glow: 14, blend: 'screen', opacity: 0.98 }),
        // Site beacons + shared hub
        point3d(SITE_A, { color: COSMOS.cyan, radius: 9.5, glow: 16, blend: 'screen' }),
        point3d(SITE_B, { color: COSMOS.violet, radius: 9.5, glow: 16, blend: 'screen' }),
        point3d(SITE_C, { color: COSMOS.blue, radius: 9.5, glow: 16, blend: 'screen' }),
        point3d(curHub, { color: '#ffffff', radius: 11.5, glow: 22, blend: 'screen' }),
        // Flowing bit photons along both perimeter wires and tripod arms
        point3d((): Vec3 => lerp3(SITE_A, SITE_B, photonT.value % 1), { color: '#ffffff', radius: 6, glow: 12, blend: 'screen' }),
        point3d((): Vec3 => lerp3(SITE_B, SITE_C, (photonT.value + 0.33) % 1), { color: COSMOS.violet, radius: 6, glow: 12, blend: 'screen' }),
        point3d((): Vec3 => lerp3(SITE_C, SITE_A, (photonT.value + 0.66) % 1), { color: COSMOS.cyan, radius: 6, glow: 12, blend: 'screen' }),
        point3d((): Vec3 => lerp3(SITE_A, curHub(), (photonT.value + 0.15) % 1), { color: COSMOS.gold, radius: 6.5, glow: 14, blend: 'screen' }),
        point3d((): Vec3 => lerp3(SITE_B, curHub(), (photonT.value + 0.48) % 1), { color: COSMOS.gold, radius: 6.5, glow: 14, blend: 'screen' }),
        point3d((): Vec3 => lerp3(SITE_C, curHub(), (photonT.value + 0.81) % 1), { color: COSMOS.gold, radius: 6.5, glow: 14, blend: 'screen' }),
    )

    const geoAura = circle(560, {
        fill: radialGradient([0, 0], 560, [
            [0, '#ffd16622'],
            [0.5, '#4c2f8a18'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(340, 8).set('blend', 'screen')

    const geoCopy = group(
        txt('EUCLIDEAN & CAT(0) TENSOR PRICES', -855, -405, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Three Wires', -860, -322, 62, COSMOS.ink, 'serif', 'left'),
        txt('& One Tripod', -860, -248, 62, COSMOS.gold, 'serif', 'left').glow(7, COSMOS.gold),
        tex(String.raw`T_n = \sum_{i,j,k=1}^{n} e_{ij} \otimes e_{jk} \otimes e_{ki}`, {
            size: 36,
            color: COSMOS.cyan,
        }).at(-585, -135).glow(5, COSMOS.cyan),
        tex(String.raw`(\text{perimeter})\,\log_2 n \;\le\; D\,\log_2 r`, {
            size: 34,
            color: COSMOS.ink,
        }).at(-585, -40),
        // Clean 2D tier captions flanking the 3D tripod (never crossed by rotating wires)
        txt('↑  SHARED HUB LABEL  ℓ ∈ [r]   (RATE D = 8/3)', 340, -398, 26, COSMOS.gold, 'mono'),
        txt('↓  PAIRWISE WIRES  i, j, k   (PERIMETER = 2 + 2 + 2 = 6)', 340, 412, 26, COSMOS.cyan, 'mono'),
    )

    const liveGeomInfo = dynamic(() => {
        const a = showGeom.value
        if (a < 0.02) return []
        const lift = tripodLift.value
        const rOp = showEqRatio.value
        const nodes: Node[] = []

        if (lift < 0.45) {
            const flatOp = Math.max(0, 1 - lift * 2.5) * a
            nodes.push(
                txt('FLAT EUCLIDEAN SPACE:', -855, 78, 27, COSMOS.muted, 'mono', 'left').opacity(flatOp),
                txt('perimeter / mean width  =  2.00', -855, 130, 32, COSMOS.rose, 'mono', 'left').opacity(flatOp),
                txt('Flat geometry can never prove ω > 2.', -855, 188, 28, COSMOS.muted, 'sans', 'left').opacity(flatOp),
            )
        }
        if (rOp > 0.02) {
            const op = rOp * a
            nodes.push(
                txt('CAT(0) UNIT-ARM TRIPOD:', -855, 78, 27, COSMOS.gold, 'mono', 'left').opacity(op),
                txt('Pairwise tip distances:  2 + 2 + 2 = 6', -855, 130, 29, COSMOS.cyan, 'sans', 'left').opacity(op),
                txt('3-way shared-label rate:  D = 8/3', -855, 178, 29, COSMOS.violet, 'sans', 'left').opacity(op),
                tex(String.raw`\frac{\text{perimeter}}{D} \;=\; \frac{6}{8/3} \;=\; \frac{9}{4} \;=\; 2.25`, {
                    size: 44,
                    color: COSMOS.gold,
                }).at(-565, 295).glow(10, COSMOS.gold).opacity(op),
            )
        }
        return group(...nodes)
    })

    // ── Shot 2: The Contradiction Engine (Why beating 9/4 breaks list distinctness) ──
    const contraHeader = group(
        txt('PROOF BY CONTRADICTION  ·  TENSOR NETWORK COMPRESSION', 0, -405, 26, COSMOS.rose, 'mono'),
        txt('Why beating 9/4 breaks information routing', 0, -332, 56, COSMOS.ink, 'serif').glow(6, COSMOS.rose),
    )

    const liveContra = dynamic(() => {
        const a = showContra.value
        if (a < 0.02) return []
        const st = contraStep.value
        const ph = photonT.value
        const nodes: Node[] = []

        const stages = [
            { x: -645, title: 'Assume', sub: 'ω < 9/4', detail: 'Save a power of n', col: COSMOS.rose },
            { x: -215, title: 'Tripod', sub: 'Excluded', detail: 'Forces sphere prices', col: COSMOS.amber },
            { x: 215, title: 'Compress', sub: 'Networks', detail: 'Batched stable sort', col: COSMOS.cyan },
            { x: 645, title: 'Distinct', sub: 'Lists', detail: 'Below routing bound!', col: COSMOS.gold },
        ] as const

        // Connecting energy conduits between stages
        for (let i = 0; i < 3; i++) {
            const x0 = stages[i]!.x + 158
            const x1 = stages[i + 1]!.x - 158
            const active = Math.max(0, Math.min(1, st * 4 - i))
            if (active > 0.02) {
                nodes.push(
                    line([x0, -20], [x1, -20], { stroke: stages[i + 1]!.col, width: 4.5 })
                        .glow(10, stages[i + 1]!.col).opacity(active * a).set('blend', 'screen'),
                    dot(7, '#ffffff')
                        .at(x0 + ((ph * 1.4 + i * 0.3) % 1) * (x1 - x0), -20)
                        .glow(14, stages[i + 1]!.col).opacity(active * a).set('blend', 'screen'),
                )
            }
        }

        // Four luminous stage orbs (no boxy slide cards — floating circular glowing nodes!)
        for (let i = 0; i < stages.length; i++) {
            const stg = stages[i]!
            const vis = Math.max(0, Math.min(1, st * 4.2 - i * 0.85))
            if (vis < 0.02) continue
            const op = vis * a
            nodes.push(
                circle(142, {
                    fill: radialGradient([0, 0], 142, [
                        [0, `${stg.col}36`],
                        [0.7, `${stg.col}14`],
                        [1, '#07091000'],
                    ]),
                    stroke: stg.col,
                    width: 3.0,
                }).at(stg.x, -20).glow(12, stg.col).opacity(op),
                txt(stg.title, stg.x, -46, 34, COSMOS.ink, 'serif').opacity(op),
                txt(stg.sub, stg.x, 8, 34, stg.col, 'mono').glow(6, stg.col).opacity(op),
                txt(stg.detail, stg.x, 175, 27, COSMOS.muted, 'sans').opacity(op),
            )
        }

        // Final contradiction stamp at bottom center
        if (st > 0.72) {
            const cOp = Math.min(1, (st - 0.72) / 0.25) * a
            nodes.push(
                rect(780, 78, { fill: '#1b111e', stroke: COSMOS.gold, width: 3.2, radius: 16 })
                    .at(0, 325).glow(14, COSMOS.gold).opacity(cOp),
                txt('CONTRADICTION  ⇒  ω ≥ 9/4 EXACT', 0, 325, 32, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(cOp),
            )
        }

        return group(...nodes)
    })

    s.add(geoAura, geoView, geoCopy, liveGeomInfo, liveContra)
    const sceneDur = Math.max(8, c.end - c.start - 0.5)
    c.at(0.1, () => {
        s.play(par(
            geoView.orbit({ theta: 0.16, phi: 0.88 }, { duration: Math.max(6, c.cue('Beating nine fourths').start - c.start - 0.4) }),
            photonT.to(5.0, { duration: sceneDur, ease: linear }),
        ))
    })

    c.on('cat zero tripod', () => {
        s.play(par(
            tripodLift.to(1, { duration: 1.25 }),
            delay(showEqRatio.to(1, { duration: 0.45 }), 0.45),
        ))
    })

    const contraRel = c.cue('Beating nine fourths').start - c.start
    const contraDur = Math.max(2.5, c.end - c.cue('Beating nine fourths').start - 0.5)
    c.swap('Beating nine fourths', [geoAura, geoView, geoCopy], contraHeader)
    c.at(contraRel, () => {
        s.play(par(
            showGeom.to(0, { duration: 0.16 }),
            delay(showContra.to(1, { duration: 0.28 }), 0.2),
            delay(contraStep.to(1, { duration: Math.min(3.4, contraDur * 0.7) }), 0.25),
        ))
    })
}

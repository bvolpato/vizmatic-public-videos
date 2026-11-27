import {
    Node, circle, dot, dynamic, group, line, line3d, linear, par, point3d, radialGradient, scene3d, tex,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

// Precomputed 4x4x4 lattice points of the n^3 matrix multiplication cube T_n = sum e_ij x e_jk x e_ki
const GRID_N = 4
const HALF = 2.1
const STEP = (2 * HALF) / (GRID_N - 1)
const CUBE_PTS: readonly { readonly pos: Vec3; readonly i: number; readonly j: number; readonly k: number }[] =
    Array.from({ length: GRID_N * GRID_N * GRID_N }, (_, idx) => {
        const i = Math.floor(idx / (GRID_N * GRID_N))
        const j = Math.floor((idx / GRID_N) % GRID_N)
        const k = idx % GRID_N
        return {
            pos: [-HALF + i * STEP, -HALF + j * STEP, -HALF + k * STEP] as Vec3,
            i,
            j,
            k,
        }
    })

export const hook: SceneFunction = (s, c) => {
    const expVal = s.value(3.0)
    const wallHit = s.value(0)
    const sweep = s.value(0)

    // Orbiting 3D matrix multiplication tensor cube on the right
    const cubeView = scene3d({
        theta: -0.78,
        phi: 1.02,
        distance: 16.8,
        unit: 108,
        perspective: true,
        ambient: 0.42,
        shine: 0.35,
        brightness: 1.12,
        fog: 0.1,
        focus: [0, 0, 0],
    }).at(330, -52)

    // Wireframe cube edges representing A (cyan), B (violet), C (gold) faces
    const eC = { color: '#3b5280', width: 2.0, opacity: 0.7 }
    const H = HALF + 0.35
    cubeView.add(
        line3d([-H, -H, -H], [H, -H, -H], eC),
        line3d([H, -H, -H], [H, H, -H], eC),
        line3d([H, H, -H], [-H, H, -H], eC),
        line3d([-H, H, -H], [-H, -H, -H], eC),
        line3d([-H, -H, H], [H, -H, H], { color: COSMOS.cyan, width: 2.6, opacity: 0.85, glow: 8, blend: 'screen' }),
        line3d([H, -H, H], [H, H, H], { color: COSMOS.violet, width: 2.6, opacity: 0.85, glow: 8, blend: 'screen' }),
        line3d([H, H, H], [-H, H, H], { color: COSMOS.gold, width: 2.6, opacity: 0.85, glow: 8, blend: 'screen' }),
        line3d([-H, H, H], [-H, -H, H], { color: COSMOS.cyan, width: 2.6, opacity: 0.85, glow: 8, blend: 'screen' }),
        line3d([-H, -H, -H], [-H, -H, H], eC),
        line3d([H, -H, -H], [H, -H, H], eC),
        line3d([H, H, -H], [H, H, H], eC),
        line3d([-H, H, -H], [-H, H, H], eC),
    )

    // Internal lattice nodes lighting up as a golden contraction plane sweeps through k
    for (const pt of CUBE_PTS) {
        cubeView.add(
            point3d(pt.pos, {
                color: pt.i === pt.k ? COSMOS.gold : pt.j % 2 === 0 ? COSMOS.cyan : COSMOS.violet,
                radius: pt.i === pt.k ? 6.2 : 4.2,
                glow: pt.i === pt.k ? 12 : 6,
                blend: 'screen',
                opacity: 0.85,
            }),
        )
    }

    // Glowing active contraction slice + crossing row-A (cyan) x col-B (violet) dot-product beams!
    const sliceZ = () => -H + ((sweep.value % 1) * 2 * H)
    const rowX = () => -HALF + Math.floor((sweep.value * 2) % GRID_N) * STEP
    const colY = () => -HALF + Math.floor((sweep.value * 1.5) % GRID_N) * STEP
    cubeView.add(
        line3d(() => [-H, -H, sliceZ()], () => [H, -H, sliceZ()], { color: COSMOS.gold, width: 3.6, glow: 12, blend: 'screen' }),
        line3d(() => [H, -H, sliceZ()], () => [H, H, sliceZ()], { color: COSMOS.gold, width: 3.6, glow: 12, blend: 'screen' }),
        line3d(() => [H, H, sliceZ()], () => [-H, H, sliceZ()], { color: COSMOS.gold, width: 3.6, glow: 12, blend: 'screen' }),
        line3d(() => [-H, H, sliceZ()], () => [-H, -H, sliceZ()], { color: COSMOS.gold, width: 3.6, glow: 12, blend: 'screen' }),
        // Crossing row (cyan) and column (violet) fiber beams meeting at one blazing scalar product!
        line3d(() => [rowX(), -H, sliceZ()], () => [rowX(), H, sliceZ()], { color: COSMOS.cyan, width: 4.5, glow: 14, blend: 'screen' }),
        line3d(() => [-H, colY(), sliceZ()], () => [H, colY(), sliceZ()], { color: COSMOS.violet, width: 4.5, glow: 14, blend: 'screen' }),
        point3d(() => [rowX(), colY(), sliceZ()], { color: '#ffffff', radius: 10.5, glow: 22, blend: 'screen' }),
    )

    const cubeAura = circle(560, {
        fill: radialGradient([0, 0], 560, [
            [0, '#5ce1e622'],
            [0.5, '#4c2f8a18'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(330, 8).set('blend', 'screen')

    // Static left editorial header + flanking 2D label beneath the 3D cube
    const leftCopy = group(
        txt('THE ENGINE OF MODERN AI', -855, -405, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Can Matrices', -860, -322, 66, COSMOS.ink, 'serif', 'left'),
        txt('Reach O(n²)?', -860, -246, 66, COSMOS.gold, 'serif', 'left').glow(8, COSMOS.gold),
        txt('3D MULTIPLICATION TENSOR  Tₙ  (n³ ELEMENTARY PRODUCTS)', 330, 432, 26, COSMOS.muted, 'mono'),
    )

    // Dynamic vertical exponent plunge gauge on the left (3.00 -> 2.81 -> 2.37 -> 2.25 WALL!)
    const G_X = -830
    const G_TOP = -125
    const G_BOT = 315
    const yForW = (w: number) => G_BOT - ((w - 1.95) / (3.05 - 1.95)) * (G_BOT - G_TOP)

    const liveGauge = dynamic(() => {
        const w = expVal.value
        const hit = wallHit.value
        const curY = yForW(w)
        const wallY = yForW(2.25)
        const dreamY = yForW(2.0)
        const nodes: Node[] = [
            // Vertical track
            line([G_X, G_TOP], [G_X, G_BOT], { stroke: '#253252', width: 4.0 }),
            // Active glowing descent trail from 3.00 down to current w
            line([G_X, yForW(3.0)], [G_X, curY], { stroke: hit > 0.3 ? COSMOS.gold : COSMOS.cyan, width: 6.0 })
                .glow(10, hit > 0.3 ? COSMOS.gold : COSMOS.cyan).set('blend', 'screen'),
            // Reference markers
            dot(5.5, COSMOS.dim).at(G_X, yForW(3.0)),
            txt('3.00   Naive O(n³)', G_X + 24, yForW(3.0), 26, COSMOS.muted, 'mono', 'left'),
            dot(5.5, COSMOS.blue).at(G_X, yForW(Math.log2(7))),
            txt('2.81   Strassen (1969)', G_X + 24, yForW(Math.log2(7)), 26, COSMOS.blue, 'mono', 'left'),
            dot(5.5, COSMOS.violet).at(G_X, yForW(2.371339)),
            txt('2.37   Laser Method (2024)', G_X + 24, yForW(2.371339), 26, COSMOS.violet, 'mono', 'left'),
            // Dashed rose dream line at 2.00
            line([G_X - 18, dreamY], [G_X + 430, dreamY], { stroke: COSMOS.rose, width: 2.0, dash: [8, 8] })
                .opacity(0.85 - hit * 0.45),
            txt('2.00   O(n²) dream (impossible)', G_X + 24, dreamY + 26, 26, COSMOS.rose, 'mono', 'left')
                .opacity(0.9 - hit * 0.35),
        ]

        // Blazing golden impenetrable wall at 2.25 = 9/4 when the proof drops!
        if (hit > 0.02) {
            nodes.push(
                circle(42 + hit * 68, {
                    fill: radialGradient([0, 0], 42 + hit * 68, [
                        [0, '#ffd16688'],
                        [0.5, '#ffd16622'],
                        [1, '#07091000'],
                    ]),
                    stroke: null,
                }).at(G_X, wallY).opacity((1 - hit) * 0.95).set('blend', 'screen'),
                line([G_X - 24, wallY + 26], [G_X + 490, wallY + 26], { stroke: COSMOS.gold, width: 5.2 })
                    .glow(16, COSMOS.gold).opacity(hit).set('blend', 'screen'),
                txt('2.25   ω = 9/4  EXACT WALL', G_X + 24, wallY, 28, COSMOS.gold, 'mono', 'left')
                    .glow(8, COSMOS.gold).opacity(hit),
            )
        }

        // Current glowing cursor dot on the vertical axis
        nodes.push(
            dot(10, '#ffffff').at(G_X, curY).glow(18, hit > 0.3 ? COSMOS.gold : COSMOS.cyan).set('blend', 'screen'),
        )
        return group(...nodes)
    })

    const eqTag = tex(String.raw`\omega_F = \frac{9}{4} = 2.25 \quad (\text{every field } F)`, {
        size: 36,
        color: COSMOS.gold,
    }).at(-585, 412).glow(6, COSMOS.gold)

    s.add(cubeAura, cubeView, leftCopy, liveGauge)
    const sceneDur = Math.max(8, c.end - c.start - 0.5)
    c.at(0.1, () => {
        s.play(par(
            cubeView.orbit({ theta: 0.15, phi: 0.88 }, { duration: sceneDur }),
            sweep.to(3.6, { duration: sceneDur, ease: linear }),
        ))
    })

    // Drop exponent swiftly through the 57-year chase, then slam onto 2.25 wall on "nine fourths exactly"
    const dreamRel = Math.max(0.8, c.cue('chased one dream').start - c.start)
    const wallRel = Math.max(dreamRel + 1.5, c.cue('nine fourths exactly').start - c.start - 0.3)
    c.at(dreamRel, () => s.play(expVal.to(2.371339, { duration: Math.max(1.2, wallRel - dreamRel - 0.25) })))
    c.at(wallRel, () => {
        s.play(par(
            expVal.to(2.25, { duration: 0.55 }),
            wallHit.to(1, { duration: 0.65 }),
        ))
    })
    c.show('nine fourths exactly', eqTag)
}

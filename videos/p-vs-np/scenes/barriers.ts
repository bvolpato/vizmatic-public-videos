import {
    Node, circle, dot, dynamic, group, line3d, linear, par, parametricSurface, point3d, radialGradient, scene3d,
    type Scene3D, type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'
import { THREE_BARRIERS } from '../math'

/** Add one crisp translucent 3D glass barrier monolith perpendicular to the x-axis. */
function addBarrierWall(view: Scene3D, x: number, color: string) {
    const wy = 1.65
    const wz = 1.35
    view.add(
        parametricSurface(
            (u, v): Vec3 => [x, -wy + u * 2 * wy, -wz + v * 2 * wz],
            [0, 1],
            [0, 1],
            { resolution: [1, 1], color, opacity: 0.24, mesh: false, shaded: true },
        ),
        line3d([x, -wy, -wz], [x, wy, -wz], { color, width: 2.6, glow: 8, blend: 'screen', opacity: 0.92 }),
        line3d([x, wy, -wz], [x, wy, wz], { color, width: 2.6, glow: 8, blend: 'screen', opacity: 0.92 }),
        line3d([x, wy, wz], [x, -wy, wz], { color, width: 2.6, glow: 8, blend: 'screen', opacity: 0.92 }),
        line3d([x, -wy, wz], [x, -wy, -wz], { color, width: 2.6, glow: 8, blend: 'screen', opacity: 0.92 }),
    )
}

/** Clean parabolic golden bypass arch vaulting OVER all three walls from left (-3.6) to right (+3.6). */
function bypassPoint(t: number): Vec3 {
    const x = -3.6 + t * 7.2
    const z = Math.sin(t * Math.PI) * 2.85
    return [x, 0, z]
}

export const barriers: SceneFunction = (s, c) => {
    const wallStep = s.value(0)
    const bypassProg = s.value(0)
    const sparkT = s.value(0)

    // Clean 3/4 side-angle perspective so x runs LEFT -> RIGHT and all 3 walls are crisply separated!
    const wallView = scene3d({
        theta: -1.32,
        phi: 1.16,
        distance: 18.2,
        unit: 112,
        perspective: true,
        ambient: 0.42,
        shine: 0.36,
        brightness: 1.14,
        fog: 0.08,
        focus: [0, 0, 0.45],
    }).at(320, 6)

    // Subtle 3D baseline rails anchoring the three walls in space
    wallView.add(
        line3d([-3.6, -1.65, -1.35], [3.6, -1.65, -1.35], { color: '#2b3b60', width: 1.6, opacity: 0.6 }),
        line3d([-3.6, 1.65, -1.35], [3.6, 1.65, -1.35], { color: '#2b3b60', width: 1.6, opacity: 0.6 }),
    )

    // Three distinctly separated glass monoliths along x = -1.75, 0.0, +1.75
    addBarrierWall(wallView, -1.75, COSMOS.rose)
    addBarrierWall(wallView, 0.0, COSMOS.amber)
    addBarrierWall(wallView, 1.75, COSMOS.violet)

    // Three clean, parallel horizontal proof beams on separate height lanes, each bouncing cleanly off its wall!
    wallView.add(
        // Beam 1 (cyan -> hits Wall 1 at x = -1.75, z = 0.72 and deflects back-up-left)
        line3d([-3.6, -0.55, 0.72], [-1.78, -0.55, 0.72], { color: COSMOS.cyan, width: 3.4, glow: 10, blend: 'screen', opacity: 0.9 }),
        line3d([-1.78, -0.55, 0.72], [-2.85, -1.35, -0.15], { color: COSMOS.rose, width: 2.6, glow: 8, blend: 'screen', opacity: 0.85 }),
        point3d([-1.78, -0.55, 0.72], { color: COSMOS.rose, radius: 7.0, glow: 14, blend: 'screen' }),

        // Beam 2 (blue -> stops cleanly at Wall 2 x = 0.0, z = 0.0 and deflects back-down-left)
        line3d([-1.72, 0.0, 0.0], [-0.03, 0.0, 0.0], { color: COSMOS.blue, width: 3.2, glow: 10, blend: 'screen', opacity: 0.8 }),
        line3d([-0.03, 0.0, 0.0], [-1.05, -1.15, -0.78], { color: COSMOS.amber, width: 2.6, glow: 8, blend: 'screen', opacity: 0.85 }),
        point3d([-0.03, 0.0, 0.0], { color: COSMOS.amber, radius: 7.0, glow: 14, blend: 'screen' }),

        // Beam 3 (emerald -> stops cleanly at Wall 3 x = +1.75, z = -0.68 and deflects back-left)
        line3d([0.03, 0.55, -0.68], [1.72, 0.55, -0.68], { color: COSMOS.emerald, width: 3.2, glow: 10, blend: 'screen', opacity: 0.8 }),
        line3d([1.72, 0.55, -0.68], [0.75, -0.75, -1.22], { color: COSMOS.violet, width: 2.6, glow: 8, blend: 'screen', opacity: 0.85 }),
        point3d([1.72, 0.55, -0.68], { color: COSMOS.violet, radius: 7.0, glow: 14, blend: 'screen' }),

        // Origin beacon (Known Math, left) & Target beacon (P != NP, right)
        point3d([-3.6, 0, 0], { color: COSMOS.cyan, radius: 9.5, glow: 18, blend: 'screen' }),
        point3d([3.6, 0, 0], { color: COSMOS.gold, radius: 12.5, glow: 24, blend: 'screen' }),

        // Blazing golden bypass arch vaulting cleanly OVER all three walls (28 dynamic 3D segments)!
        ...Array.from({ length: 28 }, (_, idx) => {
            const u0 = idx / 28
            const u1 = (idx + 1) / 28
            return line3d(
                (): Vec3 => bypassPoint(u0 * bypassProg.value),
                (): Vec3 => bypassPoint(u1 * bypassProg.value),
                { color: COSMOS.gold, width: 5.4, glow: 16, blend: 'screen', opacity: 0.98 },
            )
        }),
        point3d((): Vec3 => bypassPoint((sparkT.value % 1) * Math.max(0.02, bypassProg.value)), {
            color: '#ffffff',
            radius: 9.0,
            glow: 20,
            blend: 'screen',
        }),
    )

    const aura = circle(580, {
        fill: radialGradient([0, 0], 580, [
            [0, '#ff6b8b1e'],
            [0.5, '#a78bfa18'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(320, 6).set('blend', 'screen')

    const leftCopy = group(
        txt('WHY 55 YEARS OF PROOFS FAILED', -855, -408, 26, COSMOS.rose, 'mono', 'left'),
        txt('Three Hidden', -860, -324, 64, COSMOS.ink, 'serif', 'left'),
        txt('Proof Walls', -860, -248, 64, COSMOS.amber, 'serif', 'left').glow(7, COSMOS.amber),
        // Clean flanking 2D captions above/below the 3D fortress
        txt('BYPASS ARCH:  LOOK DEEP INSIDE COMPUTATION', 320, -408, 26, COSMOS.gold, 'mono'),
        txt('WALL 1: BLACK-BOX   ·   WALL 2: PARADOX TRAP   ·   WALL 3: ALGEBRA', 320, 428, 26, COSMOS.muted, 'mono'),
    )

    const liveWalls = dynamic(() => {
        const ws = wallStep.value
        const bp = bypassProg.value
        const nodes: Node[] = []

        for (let i = 0; i < THREE_BARRIERS.length; i++) {
            const b = THREE_BARRIERS[i]!
            const vis = Math.max(0.28, Math.min(1, ws * 3.2 - i * 0.85))
            const y0 = -120 + i * 142
            nodes.push(
                dot(8, b.col).at(-842, y0).glow(vis > 0.7 ? 12 : 4, b.col).opacity(vis),
                txt(`${b.year}  ${b.name}  (${b.sub})`, -816, y0, 27, b.col, 'mono', 'left').opacity(vis),
                txt(b.analogy, -816, y0 + 44, 26, COSMOS.muted, 'sans', 'left').opacity(vis),
            )
        }

        if (bp > 0.05) {
            const op = Math.min(1, bp * 2.5)
            nodes.push(
                txt('A winning proof must vault over ALL THREE walls.', -855, 342, 28, COSMOS.gold, 'sans', 'left')
                    .glow(5, COSMOS.gold).opacity(op),
            )
        }
        return group(...nodes)
    })

    s.add(aura, wallView, leftCopy, liveWalls)
    const sceneDur = Math.max(8, c.end - c.start - 0.5)
    c.at(0.1, () => {
        s.play(par(
            wallView.orbit({ theta: -1.04, phi: 1.06 }, { duration: sceneDur }),
            sparkT.to(4.0, { duration: sceneDur, ease: linear }),
        ))
    })

    const w1Rel = Math.max(1.5, c.cue('First, the black-box').start - c.start)
    const bypassRel = Math.max(w1Rel + 4.0, c.cue('beat all three walls').start - c.start - 0.3)
    c.at(w1Rel, () => s.play(wallStep.to(1, { duration: Math.max(4.0, bypassRel - w1Rel - 0.3), ease: linear })))
    c.at(bypassRel, () => s.play(bypassProg.to(1, { duration: 1.6 })))
}

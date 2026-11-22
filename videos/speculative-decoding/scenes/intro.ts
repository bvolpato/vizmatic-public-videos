import {
    Node, circle, curve3d, dynamic, gridPlane3d, group, line3d, par, parametricSurface, point3d, radialGradient, scene3d, tex,
    type IntroFunction, type Scene3D, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

/** Add a translucent glowing 3D prism to the hero Scene3D. */
function addHeroPrism(
    view: Scene3D,
    x0: number,
    y0: number,
    z0: number,
    dx: number,
    dy: number,
    dz: number,
    fillColor: string,
    edgeColor: string,
    faceOpacity = 0.56,
    edgeWidth = 2.0,
    edgeGlow = 7,
) {
    const x1 = x0 + dx
    const y1 = y0 + dy
    const z1 = z0 + dz
    const opts = { resolution: [1, 1] as const, color: fillColor, opacity: faceOpacity, mesh: false as const, shaded: true }
    view.add(
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y0 + v * dy, z1], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y0 + v * dy, z0], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y1, z0 + v * dz], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x1, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    )
    const es = { color: edgeColor, width: edgeWidth, opacity: 0.9, glow: edgeGlow, blend: 'screen' as const }
    view.add(
        line3d([x0, y0, z0], [x1, y0, z0], es),
        line3d([x1, y0, z0], [x1, y1, z0], es),
        line3d([x1, y1, z0], [x0, y1, z0], es),
        line3d([x0, y1, z0], [x0, y0, z0], es),
        line3d([x0, y0, z1], [x1, y0, z1], es),
        line3d([x1, y0, z1], [x1, y1, z1], es),
        line3d([x1, y1, z1], [x0, y1, z1], es),
        line3d([x0, y1, z1], [x0, y0, z1], es),
        line3d([x0, y0, z0], [x0, y0, z1], es),
        line3d([x1, y0, z0], [x1, y0, z1], es),
        line3d([x1, y1, z0], [x1, y1, z1], es),
        line3d([x0, y1, z0], [x0, y1, z1], es),
    )
}

const CX = 285
const CY = 25

export const intro: IntroFunction = (stage, clock) => {
    const pulse = stage.value(0.35)

    // Dramatic 3D hero: translucent PagedAttention KV cubes + cyan 7B draft arc launching 5 candidate prisms
    // into a massive radiant golden 70B parallel verification light plane!
    const hero3d = scene3d({
        theta: -0.78,
        phi: 1.06,
        distance: 14.8,
        unit: 122,
        perspective: true,
        ambient: 0.44,
        shine: 0.36,
        brightness: 1.12,
        fog: 0.14,
        focus: [0.1, 0, 0.9],
    }).at(CX, CY)

    // Subtle 3D VRAM grid floor
    hero3d.add(
        gridPlane3d({ x: [-4.4, 4.4], y: [-3.2, 3.2], z: -0.35, step: 1.1, color: '#27385c', width: 1.1, opacity: 0.45 }),
    )

    // Backdrop: Translucent 3D PagedAttention KV cubes grounded in physical VRAM
    const kvCubes: readonly { x: number; y: number; h: number; col: string }[] = [
        { x: -3.4, y: -2.4, h: 0.95, col: COSMOS.gold },
        { x: -1.9, y: -2.4, h: 0.85, col: COSMOS.cyan },
        { x: -0.4, y: -2.4, h: 0.78, col: COSMOS.violet },
        { x: 1.1, y: -2.4, h: 0.88, col: COSMOS.emerald },
        { x: -3.4, y: 1.4, h: 0.80, col: COSMOS.violet },
        { x: -1.9, y: 1.4, h: 0.92, col: COSMOS.gold },
        { x: -0.4, y: 1.4, h: 0.75, col: COSMOS.blue },
        { x: 1.1, y: 1.4, h: 0.82, col: COSMOS.cyan },
    ]
    for (const cube of kvCubes) {
        addHeroPrism(hero3d, cube.x, cube.y, -0.32, 1.05, 1.05, cube.h, cube.col, cube.col, 0.36, 1.5, 4)
    }

    // Fast cyan 7B draft emitter node + sweeping launch arc firing 5 candidate token prisms!
    const emitter: Vec3 = [-4.1, -0.35, 1.05]
    const planeX = 1.95
    hero3d.add(
        point3d(emitter, { color: '#ffffff', radius: 10, glow: 16, blend: 'screen' }),
        // Main sweeping cyan 7B draft trajectory arc
        curve3d(
            (t): Vec3 => {
                const x = emitter[0] + t * (planeX - emitter[0] + 1.3)
                const y = emitter[1] + Math.sin(t * Math.PI) * 0.55
                const z = emitter[2] + Math.sin(t * Math.PI * 0.85) * 1.45
                return [x, y, z]
            },
            0,
            1,
            { color: COSMOS.cyan, width: 4.5, glow: 12, blend: 'screen', samples: 90, opacity: 0.95 },
        ),
    )

    // 5 glowing candidate token prisms arranged in a parallel fan piercing the radiant golden 70B plane!
    const prismYs = [-1.65, -0.82, 0.0, 0.82, 1.65] as const
    const prismZs = [1.55, 2.08, 2.38, 2.08, 1.55] as const
    for (let i = 0; i < 5; i++) {
        const py = prismYs[i]!
        const pz = prismZs[i]!
        const px = planeX - 0.52
        const col = i < 4 ? COSMOS.emerald : COSMOS.cyan

        // Individual glowing cyan draft arc from 7B emitter into each candidate prism
        hero3d.add(
            curve3d(
                (t): Vec3 => {
                    const u = 1 - t
                    const mx = (emitter[0] + px) * 0.5
                    const my = (emitter[1] + py) * 0.55
                    const mz = Math.max(emitter[2], pz) + 0.65
                    return [
                        u * u * emitter[0] + 2 * u * t * mx + t * t * px,
                        u * u * emitter[1] + 2 * u * t * my + t * t * py,
                        u * u * emitter[2] + 2 * u * t * mz + t * t * pz,
                    ]
                },
                0,
                1,
                { color: COSMOS.cyan, width: 2.6, glow: 9, blend: 'screen', samples: 44, opacity: 0.78 },
            ),
            // Animated streaming draft photon along each launch arc
            point3d(
                (): Vec3 => {
                    const t = (pulse.value + i * 0.14) % 1
                    const u = 1 - t
                    const mx = (emitter[0] + px) * 0.5
                    const my = (emitter[1] + py) * 0.55
                    const mz = Math.max(emitter[2], pz) + 0.65
                    return [
                        u * u * emitter[0] + 2 * u * t * mx + t * t * px,
                        u * u * emitter[1] + 2 * u * t * my + t * t * py,
                        u * u * emitter[2] + 2 * u * t * mz + t * t * pz,
                    ]
                },
                { color: '#ffffff', radius: 6.5, glow: 14, blend: 'screen' },
            ),
        )

        // Glowing candidate token prism piercing the verification plane
        addHeroPrism(hero3d, px - 0.35, py - 0.28, pz - 0.28, 0.92, 0.56, 0.56, col, col, 0.72, 2.4, 10)

        // Radiant golden verification impact spark right at the plane intersection!
        hero3d.add(
            point3d([planeX, py, pz], { color: '#ffffff', radius: 8.5, glow: 16, blend: 'screen' }),
            line3d([planeX, py, pz], [planeX + 1.35, py * 0.92, pz], {
                color: COSMOS.gold,
                width: 3.4,
                glow: 12,
                blend: 'screen',
                opacity: 0.9,
            }),
            point3d([planeX + 1.35, py * 0.92, pz], { color: COSMOS.gold, radius: 6.0, glow: 12, blend: 'screen' }),
        )
    }

    // Massive radiant golden 70B parallel verification light plane (surface + glowing frame + lattice)
    hero3d.add(
        parametricSurface(
            (u, v): Vec3 => [planeX, -2.55 + u * 5.1, 0.55 + v * 2.55],
            [0, 1],
            [0, 1],
            {
                resolution: [10, 8],
                color: COSMOS.gold,
                opacity: 0.28,
                mesh: '#ffe8a3',
                meshOpacity: 0.35,
                meshWidth: 1.0,
                shaded: false,
            },
        ),
        // Radiant outer frame of the 70B verification light plane
        line3d([planeX, -2.55, 0.55], [planeX, 2.55, 0.55], { color: COSMOS.gold, width: 4.0, glow: 14, blend: 'screen' }),
        line3d([planeX, -2.55, 3.10], [planeX, 2.55, 3.10], { color: COSMOS.gold, width: 4.0, glow: 14, blend: 'screen' }),
        line3d([planeX, -2.55, 0.55], [planeX, -2.55, 3.10], { color: COSMOS.gold, width: 4.0, glow: 14, blend: 'screen' }),
        line3d([planeX, 2.55, 0.55], [planeX, 2.55, 3.10], { color: COSMOS.gold, width: 4.0, glow: 14, blend: 'screen' }),
    )

    stage.add(
        // Dramatic warm-gold + cool-cyan volumetric backlight behind the 3D verification plane
        circle(580, {
            fill: radialGradient([0, 0], 580, [
                [0, '#ffd16634'],
                [0.42, '#5ce1e61c'],
                [0.75, '#4c2f8a14'],
                [1, '#07091000'],
            ]),
            stroke: null,
        }).at(CX + 40, CY - 10).set('blend', 'screen'),
        hero3d,
        // Subtle 2D additive shockwave halo pulsing from the golden verification plane
        dynamic(() => {
            const p = pulse.value
            const nodes: Node[] = [
                circle(90 + p * 210, { fill: null, stroke: COSMOS.gold, width: 2.2 })
                    .at(CX + 95, CY - 25).opacity((1 - p) * 0.45).glow(10, COSMOS.gold).set('blend', 'screen'),
            ]
            return group(...nodes)
        }),
        // Crisp editorial typography on the left
        txt('HIGH-SPEED LLM INFERENCE', -852, -264, 26, COSMOS.gold, 'mono', 'left'),
        txt('1,000 tok/s', -858, -124, 126, COSMOS.ink, 'serif', 'left').glow(8, '#90b4ff'),
        txt('Speculative', -858, 2, 92, COSMOS.cyan, 'serif', 'left').glow(10, '#38bdf8'),
        txt('Decoding', -858, 96, 92, COSMOS.gold, 'serif', 'left').glow(10, COSMOS.gold),
        txt('KV Cache  ·  PagedAttention  ·  Parallel Verify', -852, 206, 29, '#cbd5e8', 'sans', 'left'),
        tex(String.raw`P_{\text{spec}}(x) \equiv p(x)`, {
            size: 36,
            color: COSMOS.emerald,
        }).at(-702, 290).glow(6, COSMOS.emerald),
    )

    const dur = Math.max(0.4, clock.intro - 0.06)
    stage.at(0.02, () => {
        stage.play(par(
            pulse.to(0.92, { duration: dur }),
            hero3d.orbit({ theta: -0.58, phi: 0.98 }, { duration: dur }),
        ))
    })
}

import {
    Node, circle, curve3d, dot, dynamic, fadeIn, group, line3d, linear,
    parametricSurface, points3d, polyPath, rect, scene3d,
    type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

// 28 deterministic candidate proof streams from AI generator -> 3D Trusted Kernel crystal
interface CandidateStream {
    readonly id: number
    readonly valid: boolean
    readonly yStart: number
    readonly yMid: number
    readonly yHit: number
    readonly yOut: number
    readonly speed: number
    readonly phaseOffset: number
    readonly shatterAngle: number
}

const STREAMS: readonly CandidateStream[] = Array.from({ length: 28 }, (_, i) => {
    const frac = (i / 27) * 2 - 1 // -1 .. +1
    const valid = i % 3 === 1 // 9 verified streams, 19 rejected streams
    const wobble = Math.sin(i * 4.7) * 28
    return {
        id: i,
        valid,
        yStart: -20 + frac * 115,
        yMid: -20 + frac * 210 + wobble,
        yHit: -20 + frac * 105,
        yOut: -20 + frac * 145,
        speed: 0.36 + (i % 5) * 0.05,
        phaseOffset: (i * 0.173) % 1,
        shatterAngle: (frac >= 0 ? 1 : -1) * (0.45 + (i % 4) * 0.28),
    }
})

// Cubic Bezier sampling helper for smooth luminous stream paths
function sampleCubic(p0: Vec, p1: Vec, p2: Vec, p3: Vec, steps = 28): Vec[] {
    const out: Vec[] = []
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const u = 1 - t
        const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
        const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
        out.push([x, y])
    }
    return out
}

const AI_X = -670
const AI_Y = -18
const KERNEL_X = 125
const KERNEL_Y = -18
const OUT_X = 715
const OUT_Y = -18

const IN_PATHS: readonly Vec[][] = STREAMS.map((st) =>
    sampleCubic(
        [AI_X + 108, st.yStart],
        [AI_X + 340, st.yMid],
        [KERNEL_X - 240, st.yMid * 0.65],
        [KERNEL_X - 102, st.yHit],
        26,
    ),
)

const OUT_PATHS: readonly Vec[][] = STREAMS.map((st) =>
    sampleCubic(
        [KERNEL_X + 102, st.yHit * 0.55],
        [KERNEL_X + 280, st.yOut * 0.85],
        [OUT_X - 210, st.yOut * 0.65],
        [OUT_X - 115, OUT_Y + (st.yOut - OUT_Y) * 0.35],
        24,
    ),
)

// Build an orbiting 3D faceted octahedron crystal (Trusted Kernel) with glowing wireframe + rings
function buildKernelCrystal() {
    const view = scene3d({
        theta: 0.45,
        phi: 1.08,
        distance: 11.2,
        unit: 122,
        perspective: true,
        ambient: 0.45,
        shine: 0.55,
        brightness: 1.15,
        fog: 0.05,
        focus: [0, 0, 0],
    }).at(KERNEL_X, KERNEL_Y)

    const R = 1.28
    const H = 1.72
    const verts: Vec3[] = [
        [0, 0, H], // 0 top
        [R, 0, 0], // 1 +x
        [0, R, 0], // 2 +y
        [-R, 0, 0], // 3 -x
        [0, -R, 0], // 4 -y
        [0, 0, -H], // 5 bottom
    ]

    // Faceted translucent crystal shell via parametricSurface (octahedral prism)
    const upperShell = parametricSurface(
        (u, v): Vec3 => {
            const ang = u * Math.PI * 2
            const r = R * v
            // Snap to 4-sided diamond cross-section (L1 norm)
            const c = Math.cos(ang)
            const s = Math.sin(ang)
            const scale = 1 / (Math.abs(c) + Math.abs(s))
            return [r * c * scale, r * s * scale, H * (1 - v)]
        },
        [0, 1],
        [0, 1],
        {
            resolution: [16, 6],
            colors: ['#1a1740', '#4c2f96', '#7c5cff', '#5ce1e6'],
            mesh: '#a78bfa',
            meshOpacity: 0.35,
            meshWidth: 0.9,
            opacity: 0.62,
        },
    )

    const lowerShell = parametricSurface(
        (u, v): Vec3 => {
            const ang = u * Math.PI * 2
            const r = R * v
            const c = Math.cos(ang)
            const s = Math.sin(ang)
            const scale = 1 / (Math.abs(c) + Math.abs(s))
            return [r * c * scale, r * s * scale, -H * (1 - v)]
        },
        [0, 1],
        [0, 1],
        {
            resolution: [16, 6],
            colors: ['#0f2e38', '#235e78', '#5ce1e6', '#6ee7b7'],
            mesh: '#5ce1e6',
            meshOpacity: 0.32,
            meshWidth: 0.9,
            opacity: 0.58,
        },
    )

    const edges: [number, number][] = [
        [0, 1], [0, 2], [0, 3], [0, 4],
        [5, 1], [5, 2], [5, 3], [5, 4],
        [1, 2], [2, 3], [3, 4], [4, 1],
    ]
    const crystalEdges = edges.map(([a, b], idx) =>
        line3d(verts[a]!, verts[b]!, {
            color: idx >= 8 ? COSMOS.emerald : idx < 4 ? COSMOS.violet : COSMOS.cyan,
            width: 3.4,
            glow: 10,
            blend: 'screen',
            opacity: 0.96,
        }),
    )

    const crystalVerts = points3d(verts, {
        color: '#ffffff',
        radius: 5.5,
        glow: 12,
        blend: 'screen',
        onTop: true,
    })

    // Twin glowing verification rings orbiting the crystal
    const ring1 = curve3d(
        (u, time): Vec3 => {
            const a = u * Math.PI * 2 + time * 0.7
            return [1.75 * Math.cos(a), 1.75 * Math.sin(a), 0.35 * Math.sin(a * 2)]
        },
        0,
        1,
        { color: COSMOS.cyan, width: 2.6, glow: 8, blend: 'screen', animate: true, samples: 48, opacity: 0.8 },
    )
    const ring2 = curve3d(
        (u, time): Vec3 => {
            const a = u * Math.PI * 2 - time * 0.55
            return [1.62 * Math.cos(a), 0.55 * Math.sin(a), 1.55 * Math.sin(a)]
        },
        0,
        1,
        { color: COSMOS.emerald, width: 2.4, glow: 8, blend: 'screen', animate: true, samples: 48, opacity: 0.75 },
    )

    view.add(upperShell, lowerShell, ...crystalEdges, crystalVerts, ring1, ring2)
    return view
}

export const ai: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const boost = s.value(0.25)

    const header = group(
        txt('The checker does not care who wrote the proof.', 0, -418, 54, COSMOS.ink, 'serif').glow(6, COSMOS.violet),
        txt('Only that every logical step holds.', 0, -346, 36, COSMOS.gold, 'serif').glow(6, COSMOS.gold),
    )

    const crystal = buildKernelCrystal()

    const liveFlow = dynamic(() => {
        const ph = phase.value
        const bst = boost.value
        const nodes: Node[] = [
            nebula(AI_X, AI_Y, 270, '#a78bfa22'),
            nebula(KERNEL_X, KERNEL_Y, 330, bst > 0.6 ? '#6ee7b722' : '#5ce1e61c', '#a78bfa16'),
            nebula(OUT_X, OUT_Y, 260, '#6ee7b722'),
        ]

        // 28 candidate streams pouring from AI generator into the 3D kernel crystal
        for (let i = 0; i < STREAMS.length; i++) {
            const st = STREAMS[i]!
            const inPts = IN_PATHS[i]!
            const t = (ph * st.speed + st.phaseOffset) % 1
            const inCol = st.valid ? COSMOS.cyan : '#8d64c8'
            nodes.push(
                new Node(polyPath(inPts))
                    .stroke(inCol, st.valid ? 2.2 : 1.35, st.valid ? 0.5 + 0.3 * bst : 0.26)
                    .set('blend', 'screen'),
            )

            // Moving candidate bead along incoming stream
            const idx = Math.min(inPts.length - 1, Math.floor(t * (inPts.length - 1)))
            const bp = inPts[idx]!
            const beadCol = st.valid ? COSMOS.cyan : t > 0.78 ? COSMOS.rose : COSMOS.violet
            nodes.push(
                dot(st.valid ? 4.8 : 3.6, beadCol)
                    .at(bp[0], bp[1])
                    .glow(st.valid ? 10 : 6, beadCol)
                    .set('blend', 'screen'),
            )

            if (!st.valid) {
                // Invalid trace flashes rose at crystal impact & shatters into shards!
                const impact = inPts[inPts.length - 1]!
                if (t > 0.72) {
                    const shatterT = (t - 0.72) / 0.28
                    const fade = Math.max(0, 1 - shatterT)
                    for (let k = -1; k <= 1; k++) {
                        const ang = st.shatterAngle + k * 0.42
                        const dist = 12 + shatterT * 88
                        const sx = impact[0] - Math.cos(ang) * dist * 0.65
                        const sy = impact[1] + Math.sin(ang) * dist
                        nodes.push(
                            dot(3.8 * fade + 1, COSMOS.rose)
                                .at(sx, sy)
                                .glow(8, COSMOS.rose)
                                .opacity(fade * 0.95)
                                .set('blend', 'screen'),
                        )
                    }
                }
            } else {
                // Valid proof refracts cleanly through the crystal into radiant emerald!
                const outPts = OUT_PATHS[i]!
                nodes.push(
                    new Node(polyPath(outPts))
                        .stroke(COSMOS.emerald, 2.8 + bst * 1.1, 0.55 + 0.35 * bst)
                        .glow(8, COSMOS.emerald)
                        .set('blend', 'screen'),
                )
                const oIdx = Math.min(outPts.length - 1, Math.floor(((t + 0.35) % 1) * (outPts.length - 1)))
                const op = outPts[oIdx]!
                nodes.push(
                    dot(5.2, '#ffffff')
                        .at(op[0], op[1])
                        .glow(12, COSMOS.emerald)
                        .set('blend', 'screen'),
                )
            }
        }

        // Left AI Generator core
        nodes.push(
            circle(102 + Math.sin(ph * 2.2) * 4, { fill: null, stroke: COSMOS.violet, width: 2.2, dash: [10, 8] })
                .at(AI_X, AI_Y)
                .opacity(0.75)
                .glow(8, COSMOS.violet),
            rect(176, 152, { fill: '#101528', stroke: COSMOS.violet, width: 3.2, radius: 22 })
                .at(AI_X, AI_Y)
                .glow(12, COSMOS.violet),
            txt('AI', AI_X, AI_Y - 26, 40, COSMOS.ink, 'mono'),
            txt('Generator', AI_X, AI_Y + 24, 26, COSMOS.violet, 'mono'),
            txt('28 candidate proofs', AI_X, AI_Y + 128, 26, COSMOS.muted, 'sans'),
        )

        // Shatter diagnostic callouts (clear of streams & crystal)
        nodes.push(
            rect(196, 46, { fill: '#260b16', stroke: COSMOS.rose, width: 2, radius: 12 })
                .at(-140, -238)
                .glow(8, COSMOS.rose),
            txt('type error', -140, -238, 26, COSMOS.rose, 'mono'),
            rect(236, 46, { fill: '#260b16', stroke: COSMOS.rose, width: 2, radius: 12 })
                .at(-140, 206)
                .glow(8, COSMOS.rose),
            txt('unsolved goal', -140, 206, 26, COSMOS.rose, 'mono'),
        )

        // Kernel label below the 3D crystal
        nodes.push(
            txt('Trusted Kernel', KERNEL_X, 232, 30, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan),
        )

        // Far-right Verified Output badge
        nodes.push(
            circle(110 + Math.sin(ph * 2.6) * 5, { fill: null, stroke: COSMOS.emerald, width: 2.4 })
                .at(OUT_X, OUT_Y)
                .opacity(0.65 + 0.3 * bst)
                .glow(10, COSMOS.emerald),
            rect(206, 152, { fill: '#0b221e', stroke: COSMOS.emerald, width: 3.4, radius: 22 })
                .at(OUT_X, OUT_Y)
                .glow(14, COSMOS.emerald),
            txt('VERIFIED', OUT_X, OUT_Y - 22, 30, COSMOS.emerald, 'mono'),
            txt('QED ✓', OUT_X, OUT_Y + 26, 34, '#ffffff', 'mono').glow(8, COSMOS.emerald),
            txt('100% machine-checked', OUT_X, OUT_Y + 128, 26, COSMOS.emerald, 'sans'),
        )

        return group(...nodes)
    })

    const nextTeaser = txt('Next: Episode 2 — TLA+ & the Five-Step Distributed Bug', 0, 358, 28, COSMOS.cyan, 'mono')
        .glow(6, COSMOS.cyan)

    s.add(liveFlow, crystal, header)

    c.at(0.05, () => {
        s.play(phase.to(14.0, { duration: 19.5, ease: linear }))
    })
    c.at(0.05, () => {
        s.play(crystal.orbit({ theta: 3.6, phi: 0.96 }, { duration: 19.5, ease: linear }))
    })
    c.on('flips the game', () => {
        s.play(boost.to(0.75, { duration: 1.4 }))
    })
    c.on('every logical step holds', () => {
        s.play(boost.to(1.0, { duration: 0.9 }))
    })
    c.show('Next in the series', nextTeaser)
}

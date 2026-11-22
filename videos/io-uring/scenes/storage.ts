import {
    Node, circle, curve3d, dot, dynamic, group, line, line3d, linear, point3d, polyPath,
    radialGradient, rect, scene3d, surface, type SceneFunction, type Vec, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

export const storage: SceneFunction = (s, c) => {
    const bufProg = s.value(0.25)
    const missProg = s.value(0)
    const dirProg = s.value(0)
    const flow = s.value(0)

    const aura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#6ee7b722'],
            [0.45, '#60a5fa1a'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(235, -10)

    // Hero Orbiting 3D Storage-Stack Cross-Section (4 hardware/kernel strata)
    const view3d = scene3d({
        theta: -0.62,
        phi: 1.24,
        distance: 16.0,
        unit: 112,
        perspective: true,
        ambient: 0.45,
        shine: 0.36,
        brightness: 1.14,
        fog: 0.08,
        focus: [0, 0, 0.05],
    }).at(245, 10)

    const addStratum = (z: number, xSpan: readonly [number, number], ySpan: readonly [number, number], col: string, meshCol: string, op = 0.48) => {
        const [x0, x1] = xSpan
        const [y0, y1] = ySpan
        view3d.add(
            surface(() => z, {
                x: xSpan,
                y: ySpan,
                resolution: [14, 10],
                color: col,
                mesh: meshCol,
                meshOpacity: 0.36,
                meshWidth: 0.85,
                opacity: op,
            }),
            line3d([x0, y0, z + 0.02], [x1, y0, z + 0.02], { color: col, width: 2.8, glow: 8, blend: 'screen' }),
            line3d([x1, y0, z + 0.02], [x1, y1, z + 0.02], { color: col, width: 2.8, glow: 8, blend: 'screen' }),
            line3d([x1, y1, z + 0.02], [x0, y1, z + 0.02], { color: col, width: 2.8, glow: 8, blend: 'screen' }),
            line3d([x0, y1, z + 0.02], [x0, y0, z + 0.02], { color: col, width: 2.8, glow: 8, blend: 'screen' }),
        )
    }

    // 4 3D Storage Strata:
    // z = +2.15: User Buffer + io_uring SQ
    // z = +0.80: Kernel Page Cache (left slab) + io-wq Worker Pool (far-left pocket)
    // z = -0.60: blk-mq Multi-Queue Block Layer
    // z = -1.95: NVMe SSD Hardware Queues
    addStratum(2.15, [-3.2, 3.2], [-1.8, 1.8], COSMOS.gold, '#fff0ba', 0.44)
    addStratum(0.8, [-3.3, -0.35], [-1.7, 1.7], COSMOS.blue, '#9ac7ff', 0.56)
    addStratum(-0.6, [-3.2, 3.2], [-1.8, 1.8], COSMOS.cyan, '#8ef0ff', 0.44)
    addStratum(-1.95, [-3.4, 3.4], [-2.0, 2.0], COSMOS.emerald, '#a8f9dc', 0.52)

    // 4 glowing NVMe hardware queue tracks etched across the bottom NVMe slab
    for (let q = 0; q < 4; q++) {
        const qy = -1.35 + q * 0.9
        view3d.add(
            line3d([-3.1, qy, -1.91], [3.1, qy, -1.91], { color: COSMOS.emerald, width: 2.4, glow: 7, blend: 'screen', opacity: 0.78 }),
        )
    }

    // Left Path: Buffered I/O copying User -> Page Cache -> (on miss) io-wq worker -> blk-mq -> NVMe
    const bufPathPts: readonly Vec3[] = [
        [-1.6, -0.4, 2.18],
        [-1.6, -0.4, 0.84],
        [-2.75, 0.95, 0.2],
        [-1.6, 0.4, -0.56],
        [-1.6, 0.4, -1.9],
    ]
    const sampleBuf = (u: number): Vec3 => {
        const segs = bufPathPts.length - 1
        const sc = Math.max(0, Math.min(segs, u * segs))
        const idx = Math.min(segs - 1, Math.floor(sc))
        const rem = sc - idx
        const a = bufPathPts[idx]!
        const b = bufPathPts[idx + 1]!
        return [a[0] + (b[0] - a[0]) * rem, a[1] + (b[1] - a[1]) * rem, a[2] + (b[2] - a[2]) * rem]
    }

    view3d.add(
        curve3d(
            (t): Vec3 => sampleBuf(t * Math.min(1, bufProg.value + missProg.value * 0.72)),
            0,
            1,
            { color: COSMOS.blue, width: 4.5, glow: 10, blend: 'screen', samples: 56, animate: true },
        ),
        point3d(() => sampleBuf((flow.value * 0.42) % Math.max(0.15, Math.min(1, bufProg.value + missProg.value * 0.72))), {
            color: '#ffffff',
            radius: 8.5,
            glow: 14,
            blend: 'screen',
            onTop: true,
        }),
        // io-wq worker handoff beacon on miss
        point3d([-2.75, 0.95, 0.2], { color: COSMOS.amber, radius: 9.0, glow: 14, blend: 'screen', onTop: true }),
    )

    // Right Path: O_DIRECT + Registered Buffers — straight zero-copy DMA laser bypassing Page Cache!
    view3d.add(
        curve3d(
            (t): Vec3 => {
                const u = t * Math.max(0.01, dirProg.value)
                return [1.65, -0.15 + Math.sin(u * Math.PI) * 0.12, 2.18 - u * 4.08]
            },
            0,
            1,
            { color: COSMOS.emerald, width: 6.2, glow: 14, blend: 'screen', samples: 48, animate: true, onTop: true },
        ),
        point3d(
            (): Vec3 => {
                const u = dirProg.value > 0.05 ? (flow.value * 0.75) % Math.max(0.08, dirProg.value) : 0
                return [1.65, -0.15, 2.18 - u * 4.08]
            },
            { color: '#ffffff', radius: 10.0, glow: 18, blend: 'screen', onTop: true },
        ),
    )

    const leftCopy = group(
        txt('BELOW THE RINGS  ·  3D STORAGE STACK', -855, -425, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Page Cache vs', -858, -342, 58, COSMOS.ink, 'serif', 'left'),
        txt('O_DIRECT DMA', -858, -274, 58, COSMOS.emerald, 'serif', 'left').glow(6, COSMOS.emerald),
        dot(9, COSMOS.gold).at(-840, -172).glow(9, COSMOS.gold),
        txt('User Buffer + io_uring SQ', -810, -172, 26, COSMOS.gold, 'mono', 'left'),
        dot(9, COSMOS.blue).at(-840, -118).glow(9, COSMOS.blue),
        txt('Page Cache RAM (buffered copy)', -810, -118, 26, COSMOS.blue, 'mono', 'left'),
        dot(9, COSMOS.amber).at(-840, -64).glow(9, COSMOS.amber),
        txt('io-wq worker handoff on miss', -810, -64, 26, COSMOS.amber, 'mono', 'left'),
        dot(9, COSMOS.cyan).at(-840, -10).glow(9, COSMOS.cyan),
        txt('blk-mq multi-queue block layer', -810, -10, 26, COSMOS.cyan, 'mono', 'left'),
        dot(9, COSMOS.emerald).at(-840, 44).glow(9, COSMOS.emerald),
        txt('NVMe SSD hardware queues', -810, 44, 26, COSMOS.emerald, 'mono', 'left'),
    )

    // Live p99 tail-latency curve in lower-left comparing Buffered miss jitter vs O_DIRECT deterministic flatline!
    const liveP99 = dynamic(() => {
        const dp = dirProg.value
        const fl = flow.value
        const gx0 = -840
        const gx1 = -265
        const gyBot = 335
        const gyTop = 165
        const w = gx1 - gx0
        const h = gyBot - gyTop

        const bufPts: Vec[] = Array.from({ length: 34 }, (_, i) => {
            const u = i / 33
            const spike = Math.exp(-Math.pow((u - 0.62) * 9, 2)) * 0.78 + Math.exp(-Math.pow((u - 0.86) * 11, 2)) * 0.62
            const jitter = 0.24 + 0.08 * Math.sin(u * 18 + fl * 2.5) + spike
            return [gx0 + u * w, gyBot - Math.min(0.95, jitter) * h] as Vec
        })
        const dirPts: Vec[] = Array.from({ length: 34 }, (_, i) => {
            const u = i / 33
            const flat = 0.2 + 0.025 * Math.sin(u * 14 + fl * 2.5)
            return [gx0 + u * w, gyBot - flat * h] as Vec
        })

        const nodes: Node[] = [
            rect(w + 36, h + 95, { fill: '#0b1120', stroke: '#29385a', width: 2, radius: 12 })
                .at((gx0 + gx1) / 2, (gyBot + gyTop) / 2 + 6),
            txt('LIVE p99 TAIL LATENCY', gx0, gyTop - 22, 26, COSMOS.muted, 'mono', 'left'),
            line([gx0, gyBot], [gx1, gyBot], { stroke: '#3a4c78', width: 2 }),
            new Node(polyPath(bufPts)).stroke(COSMOS.blue, 3.2, 0.92).glow(7, COSMOS.blue),
            txt('Buffered (io-wq)', gx0, gyBot + 32, 26, COSMOS.blue, 'mono', 'left'),
        ]
        if (dp > 0.05) {
            nodes.push(
                new Node(polyPath(dirPts)).stroke(COSMOS.emerald, 3.8, dp).glow(9, COSMOS.emerald),
                txt('O_DIRECT (flat)', gx1, gyBot + 32, 26, COSMOS.emerald, 'mono', 'right').opacity(dp),
            )
        }
        return group(...nodes)
    })

    s.add(aura, view3d, leftCopy, liveP99)

    const fullDur = Math.max(10, c.end - c.start - 0.15)
    c.at(0.05, () => {
        s.play(
            flow.to(fullDur * 0.9, { duration: fullDur, ease: linear }),
            view3d.orbit({ theta: 0.28, phi: 0.94 }, { duration: fullDur }),
        )
    })
    c.on('buffered', () => s.play(bufProg.to(0.45, { duration: 1.6 })))
    c.on('internal worker', () => s.play(missProg.to(1, { duration: 1.8 })))
    c.on('skips the page cache', () => s.play(dirProg.to(1, { duration: 2.2 })))
}

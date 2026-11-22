import {
    Node, circle, dot, dynamic, gridPlane3d, group, line, line3d, linear, parametricSurface,
    point3d, points3d, polyPath, radialGradient, rect, regularPolygon, scene3d,
    type Scene3D, type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

function addPrism3D(
    view: Scene3D,
    x0: number,
    y0: number,
    z0: number,
    dx: number,
    dy: number,
    dz: number,
    fillCol: string,
    edgeCol: string,
    faceOp = 0.52,
    edgeW = 2.0,
    edgeGlow = 6,
) {
    const x1 = x0 + dx
    const y1 = y0 + dy
    const z1 = z0 + dz
    const opts = { resolution: [1, 1] as const, color: fillCol, opacity: faceOp, mesh: false as const, shaded: true }
    view.add(
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y0 + v * dy, z1], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y0 + v * dy, z0], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0 + u * dx, y1, z0 + v * dz], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x0, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
        parametricSurface((u, v): Vec3 => [x1, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], opts),
    )
    const es = { color: edgeCol, width: edgeW, opacity: 0.9, glow: edgeGlow, blend: 'screen' as const }
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

export const futures: SceneFunction = (s, c) => {
    const showSize = s.value(1)
    const showLayout = s.value(0)
    const showLoop = s.value(0)
    const loopAngle = s.value(-Math.PI / 2)
    const wakeFlash = s.value(0)

    // ── Stage 1: Hero Orbiting 3D Volumetric Comparison (2 MiB OS Stack Skyscrapers vs 48-Byte Future Lattice) ──
    const sizeAura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#6ee7b722'],
            [0.45, '#60a5fa1a'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(80, -35)

    const sizeView = scene3d({
        theta: -0.78,
        phi: 1.04,
        distance: 17.2,
        unit: 92,
        perspective: true,
        ambient: 0.44,
        shine: 0.34,
        brightness: 1.12,
        fog: 0.08,
        focus: [0, 0, 0.95],
    }).at(195, -55)

    sizeView.add(
        gridPlane3d({ x: [-4.4, 4.4], y: [-2.4, 2.4], z: 0, step: 0.88, color: '#243354', width: 1.1, opacity: 0.44 }),
    )

    // Left: 6 towering 2 MiB OS Thread stack skyscrapers
    const towerCoords: readonly [number, number, number][] = [
        [-3.7, -1.5, 2.65],
        [-2.45, -1.5, 2.65],
        [-3.7, -0.15, 2.65],
        [-2.45, -0.15, 2.65],
        [-3.7, 1.2, 2.65],
        [-2.45, 1.2, 2.65],
    ]
    for (const [tx, ty, th] of towerCoords) {
        addPrism3D(sizeView, tx, ty, 0.02, 0.95, 0.95, th, '#1b3b75', COSMOS.blue, 0.42, 2.0, 6)
    }

    // Right: dense 3D crystalline lattice of 64 glowing 48-byte Future micro-cells (4 x 4 x 4)!
    const latticePts: Vec3[] = []
    for (let ix = 0; ix < 4; ix++) {
        for (let iy = 0; iy < 4; iy++) {
            for (let iz = 0; iz < 4; iz++) {
                latticePts.push([1.25 + ix * 0.62, -0.93 + iy * 0.62, 0.25 + iz * 0.52])
            }
        }
    }
    // Outer crystalline wireframe envelope around the 48-byte lattice
    addPrism3D(sizeView, 1.05, -1.15, 0.06, 2.26, 2.26, 1.95, '#0f2d28', COSMOS.emerald, 0.16, 2.2, 9)
    // Internal lattice connectors
    for (let ix = 0; ix < 4; ix++) {
        const lx = 1.25 + ix * 0.62
        for (let iz = 0; iz < 4; iz++) {
            const lz = 0.25 + iz * 0.52
            sizeView.add(
                line3d([lx, -0.93, lz], [lx, 0.93, lz], { color: COSMOS.cyan, width: 1.3, opacity: 0.48, blend: 'screen' }),
            )
        }
    }
    for (let iy = 0; iy < 4; iy++) {
        const ly = -0.93 + iy * 0.62
        for (let iz = 0; iz < 4; iz++) {
            const lz = 0.25 + iz * 0.52
            sizeView.add(
                line3d([1.25, ly, lz], [3.11, ly, lz], { color: COSMOS.emerald, width: 1.3, opacity: 0.48, blend: 'screen' }),
            )
        }
    }
    sizeView.add(
        points3d(latticePts, {
            colorAt: (idx) => (idx % 5 === 0 ? COSMOS.gold : idx % 2 === 0 ? COSMOS.emerald : COSMOS.cyan),
            radius: 7.4,
            glow: 12,
            blend: 'screen',
            onTop: true,
        }),
    )

    const sizeCopy = group(
        txt('ZERO-COST ASYNC MEMORY', -855, -425, 26, COSMOS.gold, 'mono', 'left'),
        txt('2 MiB Stack vs 48-Byte Future', -855, -360, 56, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.gold),
        txt('OS Threads', -855, -245, 32, COSMOS.blue, 'serif', 'left'),
        txt('~2 MiB stack each', -855, -198, 26, COSMOS.muted, 'mono', 'left'),
        txt('10k idle = ~20 GiB', -855, -154, 26, COSMOS.rose, 'mono', 'left'),
        txt('Async Futures', -855, -48, 32, COSMOS.emerald, 'serif', 'left'),
        txt('48 B state enum', -855, -1, 26, COSMOS.emerald, 'mono', 'left'),
        txt('10k idle = 480 KiB', -855, 43, 26, COSMOS.cyan, 'mono', 'left'),
    )

    // Explicit 48-byte enum layout bar at the bottom of Stage 1
    const layoutBar = dynamic(() => {
        if (showSize.value < 0.35) return []
        const a = showSize.value * (0.42 + 0.58 * showLayout.value)
        const barY = 335
        const totalW = 1320
        const x0 = -totalW / 2
        const segs = [
            { label: 'tag (1B)', w: 170, col: COSMOS.gold, off: '0' },
            { label: 'state (7B)', w: 230, col: COSMOS.cyan, off: '8' },
            { label: 'locals across .await (24B)', w: 540, col: COSMOS.emerald, off: '32' },
            { label: 'Waker (16B)', w: 380, col: COSMOS.violet, off: '48 B' },
        ] as const
        const nodes: Node[] = [
            txt('size_of::<TwoAwaitFuture>() == 48 BYTES  (rustc 1.99.1)', 0, barY - 66, 26, COSMOS.gold, 'mono').opacity(a),
        ]
        let cur = x0
        for (const sg of segs) {
            const cx = cur + sg.w / 2
            nodes.push(
                rect(sg.w - 8, 66, { fill: '#10182b', stroke: sg.col, width: 3, radius: 9 })
                    .at(cx, barY)
                    .glow(8, sg.col)
                    .opacity(a),
                txt(sg.label, cx, barY, 26, sg.col, 'mono').opacity(a),
                txt(sg.off, cur + sg.w - 4, barY + 56, 26, COSMOS.dim, 'mono', 'right').opacity(a),
            )
            cur += sg.w
        }
        return group(...nodes)
    })

    // ── Stage 2: Smooth Animated Poll -> Pending -> Wake -> Ready State Orbit + Pin Anchor ──
    const loopCopy = group(
        txt('PULL-BASED EXECUTION', 0, -425, 26, COSMOS.cyan, 'mono'),
        txt('Poll  ->  Pending  ->  Wake  ->  Ready', 0, -360, 56, COSMOS.ink, 'serif').glow(5, COSMOS.cyan),
        txt('Pin<&mut Self> locks self-referential fields in memory while suspended', 0, 385, 28, COSMOS.violet, 'mono'),
    )

    const STOPS: readonly { label: string; sub: string; ang: number; col: string; lx: number; ly: number; anchor: 'left' | 'center' | 'right' }[] = [
        { label: '1. poll()', sub: 'Executor drives state', ang: -Math.PI / 2, col: COSMOS.blue, lx: 0, ly: -285, anchor: 'center' },
        { label: '2. Pending', sub: 'Stores Waker · frees core', ang: 0, col: COSMOS.gold, lx: 310, ly: -10, anchor: 'left' },
        { label: '3. wake()', sub: 'epoll / kqueue fires', ang: Math.PI / 2, col: COSMOS.cyan, lx: 0, ly: 295, anchor: 'center' },
        { label: '4. Ready', sub: 'Returns output value', ang: Math.PI, col: COSMOS.emerald, lx: -310, ly: -10, anchor: 'right' },
    ]

    const liveLoop = dynamic(() => {
        if (showLoop.value < 0.04) return []
        const a = showLoop.value
        const cur = loopAngle.value
        const wf = wakeFlash.value
        const R = 215
        const cy = 10
        const px = Math.cos(cur) * R
        const py = cy + Math.sin(cur) * R

        // Trailing luminous orbital arc behind the moving spark
        const trailPts = Array.from({ length: 28 }, (_, i) => {
            const ang = cur - (i / 27) * 1.15
            return [Math.cos(ang) * R, cy + Math.sin(ang) * R] as const
        })

        const nodes: Node[] = [
            nebula(0, cy, 420, '#5ce1e622', '#a78bfa16').opacity(a),
            circle(R, { fill: null, stroke: '#253354', width: 5 }).at(0, cy).opacity(a),
            circle(R + 28, { fill: null, stroke: '#1d2742', width: 1.8, dash: [8, 12] }).at(0, cy).opacity(a),
            new Node(polyPath([...trailPts])).stroke(COSMOS.gold, 7, 0.85 * a).glow(14, COSMOS.gold),
            // Central Pin<&mut Self> hexagonal anchor with internal locked self-pointer
            regularPolygon(6, 98, { fill: '#14172b', stroke: COSMOS.violet, width: 4 })
                .at(0, cy)
                .glow(12, COSMOS.violet)
                .opacity(a),
            txt('Pin<&mut>', 0, cy - 18, 28, COSMOS.violet, 'mono').opacity(a),
            txt('0x40a0', 0, cy + 20, 26, COSMOS.muted, 'mono').opacity(a),
        ]

        // OS Reactor pulse beam shooting into 3. wake()
        if (wf > 0.04) {
            const beamStart = 640
            const beamEnd = 28
            const rx = beamStart + (beamEnd - beamStart) * Math.min(1, wf * 1.4)
            nodes.push(
                rect(250, 74, { fill: '#0f1e2e', stroke: COSMOS.cyan, width: 3, radius: 12 })
                    .at(690, cy + R)
                    .glow(10, COSMOS.cyan)
                    .opacity(wf * a),
                txt('epoll / kqueue', 690, cy + R, 26, COSMOS.cyan, 'mono').opacity(wf * a),
                line([565, cy + R], [rx, cy + R], { stroke: COSMOS.cyan, width: 4.5 })
                    .glow(12, COSMOS.cyan)
                    .opacity(wf * a)
                    ,
                dot(9, '#ffffff').at(rx, cy + R).glow(14, COSMOS.cyan).opacity(wf * a),
            )
        }

        for (const st of STOPS) {
            const sx = Math.cos(st.ang) * R
            const sy = cy + Math.sin(st.ang) * R
            const distAng = Math.abs(Math.atan2(Math.sin(cur - st.ang), Math.cos(cur - st.ang)))
            const near = Math.max(0, 1 - distAng / 0.85)
            nodes.push(
                circle(20 + near * 6, { fill: '#0f1729', stroke: st.col, width: 3.5 + near * 2 })
                    .at(sx, sy)
                    .glow(10 + near * 10, st.col)
                    .opacity(a),
                txt(st.label, st.lx, st.ly - 16, 30, st.col, 'mono', st.anchor).glow(near * 8, st.col).opacity(a),
                txt(st.sub, st.lx, st.ly + 22, 26, COSMOS.muted, 'sans', st.anchor).opacity(a),
            )
        }

        nodes.push(dot(13, '#ffffff').at(px, py).glow(18, COSMOS.gold).opacity(a))
        return group(...nodes)
    })

    s.add(sizeAura, sizeView, sizeCopy, layoutBar)

    const sizeDur = Math.max(4, c.cue('Nothing runs until').start - c.start - 0.3)
    c.at(0.05, () => {
        s.play(sizeView.orbit({ theta: -0.18, phi: 0.94 }, { duration: sizeDur }))
    })
    c.on('forty-eight bytes', () => s.play(showLayout.to(1, { duration: 0.65 })))

    const loopDur = Math.max(4, c.end - c.cue('Nothing runs until').start - 0.25)
    c.swap('Nothing runs until', [sizeAura, sizeView, sizeCopy], loopCopy)
    c.on('Nothing runs until', () => {
        s.play(
            showSize.to(0, { duration: 0.3 }),
            showLoop.to(1, { duration: 0.35 }),
            loopAngle.to(-Math.PI / 2 + Math.PI * 4.5, { duration: loopDur, ease: linear }),
        )
    })
    c.on('wake signals', () => s.play(wakeFlash.to(1, { duration: 0.9 })))
    s.add(liveLoop)
}

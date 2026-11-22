import {
    Node, circle, curve3d, dot, dynamic, gridPlane3d, group, line, line3d, linear,
    parametricSurface, point3d, points3d, radialGradient, scene3d,
    type SceneFunction, type Vec3,
} from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

interface RustTypeItem {
    readonly label: string
    readonly ok: boolean
    readonly col: string
    readonly y3d: number
    readonly z3d: number
    readonly phaseOff: number
}

const RUST_TYPES: readonly RustTypeItem[] = [
    { label: 'String', ok: true, col: COSMOS.emerald, y3d: -1.65, z3d: 1.45, phaseOff: 0.0 },
    { label: 'Vec<u8>', ok: true, col: COSMOS.cyan, y3d: -0.55, z3d: 0.95, phaseOff: 0.12 },
    { label: 'Arc<T>', ok: true, col: COSMOS.emerald, y3d: 0.55, z3d: 0.45, phaseOff: 0.24 },
    { label: 'Mutex<T>', ok: true, col: COSMOS.cyan, y3d: 1.65, z3d: 0.05, phaseOff: 0.36 },
    { label: 'Rc<T>', ok: false, col: COSMOS.rose, y3d: -1.55, z3d: -0.35, phaseOff: 0.08 },
    { label: 'RefCell<T>', ok: false, col: COSMOS.rose, y3d: -0.5, z3d: -0.82, phaseOff: 0.2 },
    { label: 'Cell<T>', ok: false, col: COSMOS.amber, y3d: 0.55, z3d: -1.25, phaseOff: 0.32 },
    { label: '*const T', ok: false, col: COSMOS.rose, y3d: 1.6, z3d: -1.65, phaseOff: 0.44 },
]

export const ownership: SceneFunction = (s, c) => {
    const showWall = s.value(1)
    const passProg = s.value(0.28)
    const failProg = s.value(0.22)
    const shatterProg = s.value(0)
    const showMutex = s.value(0)
    const vaultPhase = s.value(0)

    // ── Stage 1: Orbiting 3D Send / Sync Trait-Filter Plane + 8 Real Rust Types ──
    const wallAura = circle(600, {
        fill: radialGradient([0, 0], 600, [
            [0, '#ffd16628'],
            [0.45, '#5ce1e614'],
            [0.75, '#ff6b8b14'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(60, 20)

    const wallView = scene3d({
        theta: -1.16,
        phi: 1.14,
        distance: 15.2,
        unit: 114,
        perspective: true,
        ambient: 0.45,
        shine: 0.35,
        brightness: 1.12,
        fog: 0.08,
        focus: [0, 0, -0.05],
    }).at(110, 5)

    wallView.add(
        gridPlane3d({ x: [-4.2, 4.2], y: [-2.4, 2.4], z: -2.2, step: 0.85, color: '#243354', width: 1.1, opacity: 0.38 }),
        // Glowing translucent golden trait-filter plane at x = 0
        parametricSurface(
            (u, v): Vec3 => [0, -2.35 + u * 4.7, -2.1 + v * 4.2],
            [0, 1],
            [0, 1],
            {
                resolution: [10, 10],
                color: COSMOS.gold,
                mesh: '#ffe8a3',
                meshOpacity: 0.35,
                meshWidth: 0.9,
                opacity: 0.24,
                shaded: false,
            },
        ),
        // Radiant perimeter frame of the compiler gate
        line3d([0, -2.35, -2.1], [0, 2.35, -2.1], { color: COSMOS.gold, width: 3.6, glow: 10, blend: 'screen' }),
        line3d([0, 2.35, -2.1], [0, 2.35, 2.1], { color: COSMOS.gold, width: 3.6, glow: 10, blend: 'screen' }),
        line3d([0, 2.35, 2.1], [0, -2.35, 2.1], { color: COSMOS.gold, width: 3.6, glow: 10, blend: 'screen' }),
        line3d([0, -2.35, 2.1], [0, -2.35, -2.1], { color: COSMOS.gold, width: 3.6, glow: 10, blend: 'screen' }),
    )

    // 8 Rust types streaming toward x = 0: 4 Send/Sync stream cleanly through, 4 !Send refract/shatter in rose!
    for (let i = 0; i < RUST_TYPES.length; i++) {
        const item = RUST_TYPES[i]!
        if (item.ok) {
            wallView.add(
                curve3d(
                    (t): Vec3 => {
                        const xEnd = -3.7 + Math.min(1, Math.max(0.05, passProg.value - item.phaseOff * 0.35)) * 7.4
                        const x = -3.7 + t * (xEnd + 3.7)
                        return [x, item.y3d, item.z3d + Math.sin(t * Math.PI * 2 + i) * 0.08]
                    },
                    0,
                    1,
                    { color: item.col, width: 4.0, glow: 9, blend: 'screen', samples: 36, animate: true },
                ),
                point3d(
                    (): Vec3 => {
                        const xEnd = -3.7 + Math.min(1, Math.max(0.05, passProg.value - item.phaseOff * 0.35)) * 7.4
                        return [xEnd, item.y3d, item.z3d]
                    },
                    { color: '#ffffff', radius: 7.2, glow: 14, blend: 'screen', onTop: true },
                ),
            )
        } else {
            // !Send / !Sync types hit x = -0.06 and refract/shatter backward in rose shards
            wallView.add(
                curve3d(
                    (t): Vec3 => {
                        const u = Math.min(1, Math.max(0.05, failProg.value - (item.phaseOff - 0.08) * 0.25))
                        const xHit = -3.7 + u * 3.62
                        const x = -3.7 + t * (xHit + 3.7)
                        return [x, item.y3d, item.z3d]
                    },
                    0,
                    1,
                    { color: item.col, width: 3.8, glow: 9, blend: 'screen', samples: 28, animate: true },
                ),
                point3d(
                    (): Vec3 => {
                        const u = Math.min(1, Math.max(0.05, failProg.value - (item.phaseOff - 0.08) * 0.25))
                        return [-3.7 + u * 3.62, item.y3d, item.z3d]
                    },
                    { color: COSMOS.rose, radius: 7.4, glow: 14, blend: 'screen', onTop: true },
                ),
                // Refracted rose shatter sparks on impact
                points3d(
                    () => {
                        const sh = shatterProg.value
                        if (sh < 0.04) return []
                        return Array.from({ length: 7 }, (_, k) => {
                            const ang = (k / 7) * Math.PI * 2 + i * 1.1
                            const spread = sh * 0.85
                            return [
                                -0.15 - sh * (0.45 + (k % 3) * 0.32),
                                item.y3d + Math.cos(ang) * spread,
                                item.z3d + Math.sin(ang) * spread,
                            ] as Vec3
                        })
                    },
                    { color: COSMOS.rose, radius: 4.8, glow: 10, blend: 'screen', onTop: true },
                ),
            )
        }
    }

    const wallCopy = group(
        txt('SEND & SYNC COMPILER GATE', -855, -425, 26, COSMOS.gold, 'mono', 'left'),
        txt('Thread-Boundary Type Filter', -855, -360, 56, COSMOS.ink, 'serif', 'left').glow(5, COSMOS.gold),
        txt('PASS  (Send + Sync)', -855, -245, 26, COSMOS.emerald, 'mono', 'left'),
        txt('String', -855, -195, 28, COSMOS.emerald, 'mono', 'left'),
        txt('Vec<u8>', -855, -148, 28, COSMOS.cyan, 'mono', 'left'),
        txt('Arc<T>', -855, -101, 28, COSMOS.emerald, 'mono', 'left'),
        txt('Mutex<T>', -855, -54, 28, COSMOS.cyan, 'mono', 'left'),
        txt('BLOCKED  (!Send / !Sync)', -855, 38, 26, COSMOS.rose, 'mono', 'left'),
        txt('Rc<T>', -855, 88, 28, COSMOS.rose, 'mono', 'left'),
        txt('RefCell<T>', -855, 135, 28, COSMOS.rose, 'mono', 'left'),
        txt('Cell<T>', -855, 182, 28, COSMOS.amber, 'mono', 'left'),
        txt('*const T', -855, 229, 28, COSMOS.rose, 'mono', 'left'),
        txt('Thread 1', -430, 385, 30, COSMOS.blue, 'serif'),
        txt('Trait Gate', 110, 385, 28, COSMOS.gold, 'mono'),
        txt('Thread 2', 610, 385, 30, COSMOS.cyan, 'serif'),
    )

    const e0277Badge = dynamic(() => {
        if (showWall.value < 0.04 || shatterProg.value < 0.05) return []
        const op = showWall.value * shatterProg.value
        return group(
            txt('error[E0277]: not Send / Sync', 465, -355, 28, COSMOS.rose, 'mono').glow(10, COSMOS.rose).opacity(op),
            txt('Rc / RefCell rejected before codegen', 465, -305, 26, COSMOS.muted, 'sans').opacity(op),
        )
    })

    // ── Stage 2: Translucent 3D Mutex<T> Lock Vault wrapping Owned T Bytes + Queued Thread Pulses ──
    const mutexAura = circle(560, {
        fill: radialGradient([0, 0], 560, [
            [0, '#5ce1e62a'],
            [0.45, '#ffd16618'],
            [1, '#07091000'],
        ]),
        stroke: null,
    }).at(230, 20)

    const mutexView = scene3d({
        theta: -0.55,
        phi: 1.02,
        distance: 13.6,
        unit: 130,
        perspective: true,
        ambient: 0.45,
        shine: 0.42,
        brightness: 1.14,
        fog: 0.08,
        focus: [0, 0, 0],
    }).at(230, 25)

    // Outer translucent cyan 3D vault cylinder/sphere shell
    mutexView.add(
        parametricSurface(
            (u, v): Vec3 => {
                const r = 1.95
                const a = u * Math.PI * 2
                const b = -Math.PI * 0.44 + v * Math.PI * 0.88
                return [Math.cos(b) * Math.cos(a) * r, Math.cos(b) * Math.sin(a) * r, Math.sin(b) * r]
            },
            [0, 1],
            [0, 1],
            {
                resolution: [28, 14],
                color: COSMOS.cyan,
                mesh: '#80eeff',
                meshOpacity: 0.34,
                meshWidth: 0.9,
                opacity: 0.22,
                shaded: true,
            },
        ),
        // Inner golden owned-T cube core (counter + payload bytes locked inside!)
        parametricSurface((u, v): Vec3 => [-0.72 + u * 1.44, -0.72 + v * 1.44, 0.72], [0, 1], [0, 1], { resolution: [4, 4], color: COSMOS.gold, mesh: '#fff3c4', meshOpacity: 0.45, opacity: 0.72 }),
        parametricSurface((u, v): Vec3 => [-0.72 + u * 1.44, -0.72 + v * 1.44, -0.72], [0, 1], [0, 1], { resolution: [4, 4], color: COSMOS.amber, mesh: false, opacity: 0.65 }),
        parametricSurface((u, v): Vec3 => [-0.72 + u * 1.44, -0.72, -0.72 + v * 1.44], [0, 1], [0, 1], { resolution: [4, 4], color: COSMOS.gold, mesh: '#fff3c4', meshOpacity: 0.4, opacity: 0.68 }),
        parametricSurface((u, v): Vec3 => [-0.72 + u * 1.44, 0.72, -0.72 + v * 1.44], [0, 1], [0, 1], { resolution: [4, 4], color: COSMOS.gold, mesh: '#fff3c4', meshOpacity: 0.4, opacity: 0.68 }),
        parametricSurface((u, v): Vec3 => [-0.72, -0.72 + u * 1.44, -0.72 + v * 1.44], [0, 1], [0, 1], { resolution: [4, 4], color: COSMOS.amber, mesh: '#fff3c4', meshOpacity: 0.4, opacity: 0.68 }),
        parametricSurface((u, v): Vec3 => [0.72, -0.72 + u * 1.44, -0.72 + v * 1.44], [0, 1], [0, 1], { resolution: [4, 4], color: COSMOS.amber, mesh: '#fff3c4', meshOpacity: 0.4, opacity: 0.68 }),
        // Equatorial MutexGuard glowing orbital track
        curve3d(
            (t): Vec3 => [Math.cos(t) * 2.55, Math.sin(t) * 2.55, Math.sin(t * 2) * 0.28],
            0,
            Math.PI * 2,
            { color: COSMOS.emerald, width: 3.6, glow: 10, blend: 'screen', samples: 64 },
        ),
        // Active MutexGuard key orbiting the vault and linking to the owned T core
        line3d(
            (): Vec3 => [0, 0, 0],
            (): Vec3 => {
                const a = vaultPhase.value * 1.25
                return [Math.cos(a) * 2.55, Math.sin(a) * 2.55, Math.sin(a * 2) * 0.28]
            },
            { color: COSMOS.emerald, width: 4.5, glow: 12, blend: 'screen', onTop: true },
        ),
        point3d(
            (): Vec3 => {
                const a = vaultPhase.value * 1.25
                return [Math.cos(a) * 2.55, Math.sin(a) * 2.55, Math.sin(a * 2) * 0.28]
            },
            { color: '#ffffff', radius: 10, glow: 16, blend: 'screen', onTop: true },
        ),
    )

    // 3 queued waiting threads pulsing outside the lock vault
    const waitDirs: readonly Vec3[] = [
        [-3.4, -1.6, 0.8],
        [-3.5, 0.2, -0.5],
        [-3.3, 1.8, 0.4],
    ]
    for (let k = 0; k < waitDirs.length; k++) {
        const wd = waitDirs[k]!
        mutexView.add(
            line3d(wd, [wd[0] * 0.62, wd[1] * 0.62, wd[2] * 0.62], { color: COSMOS.blue, width: 2.6, glow: 7, blend: 'screen', opacity: 0.72 }),
            point3d(
                (): Vec3 => {
                    const b = 0.62 + 0.35 * (0.5 + 0.5 * Math.sin(vaultPhase.value * 2.4 + k * 2.1))
                    return [wd[0] * b, wd[1] * b, wd[2] * b]
                },
                { color: COSMOS.blue, radius: 7.5, glow: 12, blend: 'screen', onTop: true },
            ),
        )
    }

    const mutexCopy = group(
        txt('ARC<MUTEX<T>>  LOCK VAULT', -855, -395, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Mutex<T> owns T', -858, -310, 66, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.cyan),
        txt('No raw pointer escapes the lock', -855, -220, 30, COSMOS.muted, 'sans', 'left'),
        dot(9, COSMOS.gold).at(-840, -100).glow(10, COSMOS.gold),
        txt('Owned inner bytes: counter = 42', -810, -100, 28, COSMOS.gold, 'mono', 'left'),
        dot(9, COSMOS.emerald).at(-840, -35).glow(10, COSMOS.emerald),
        txt('MutexGuard grants exclusive &mut T', -810, -35, 28, COSMOS.emerald, 'mono', 'left'),
        dot(9, COSMOS.blue).at(-840, 30).glow(10, COSMOS.blue),
        txt('Queued threads park until Drop', -810, 30, 28, COSMOS.blue, 'sans', 'left'),
        txt('RAII unlock runs automatically', -855, 210, 30, COSMOS.emerald, 'sans', 'left'),
        txt('Even during stack unwind on panic!', -855, 265, 28, COSMOS.amber, 'mono', 'left'),
    )

    s.add(wallAura, wallView, wallCopy, e0277Badge)

    const wallDur = Math.max(4, c.cue('owns the data inside').start - c.start - 0.3)
    c.at(0.05, () => {
        s.play(
            wallView.orbit({ theta: -0.82, phi: 1.06 }, { duration: wallDur }),
            passProg.to(0.46, { duration: 4.5 }),
            failProg.to(0.55, { duration: 4.5 }),
        )
    })
    c.on('sails straight through', () => s.play(passProg.to(1.25, { duration: 2.2 })))
    c.on('shatters against the wall', () => {
        s.play(
            failProg.to(1.2, { duration: 1.1 }),
            shatterProg.to(1, { duration: 0.95 }),
        )
    })

    const mutexDur = Math.max(4, c.end - c.cue('owns the data inside').start - 0.25)
    c.swap('owns the data inside', [wallAura, wallView, wallCopy], [mutexAura, mutexView, mutexCopy])
    c.on('owns the data inside', () => {
        s.play(
            showWall.to(0, { duration: 0.3 }),
            showMutex.to(1, { duration: 0.35 }),
            vaultPhase.to(mutexDur * 0.95, { duration: mutexDur, ease: linear }),
            mutexView.orbit({ theta: 0.42, phi: 0.92 }, { duration: mutexDur }),
        )
    })
}

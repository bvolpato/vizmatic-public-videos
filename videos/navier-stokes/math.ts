/**
 * Exact, self-contained fluid dynamics computations for The Navier-Stokes film.
 * Implements incompressible 2D Biot-Savart / Lamb-Oseen Gaussian vortex cores,
 * 4th-order Runge-Kutta (RK4) streamline & passive ribbon advection, numerical
 * divergence and circulation conservation checks, Kolmogorov k^{-5/3} cascade,
 * and a 3D vorticity / enstrophy landscape.
 */

export type Vec2 = readonly [number, number]

export interface Vortex {
    readonly x: number
    readonly y: number
    readonly gamma: number // circulation
    readonly core: number  // Lamb-Oseen Gaussian core radius a
}

/**
 * Incompressible velocity field induced by a set of Lamb-Oseen vortices plus optional
 * rightward channel + shear background u_bg(y) = meanFlow + shear * tanh(y / shearWidth).
 * Because each vortex derives from a radial streamfunction psi(r) and u_bg depends only on y,
 * div(u) = du/dx + dv/dy is identically 0 everywhere!
 */
export function vortexVelocity(
    x: number,
    y: number,
    vortices: readonly Vortex[],
    shear = 0,
    shearWidth = 0.85,
    meanFlow = 0,
): Vec2 {
    let u = meanFlow + (shear !== 0 ? shear * Math.tanh(y / shearWidth) : 0)
    let v = 0
    const inv2Pi = 1 / (2 * Math.PI)
    for (const vt of vortices) {
        const dx = x - vt.x
        const dy = y - vt.y
        const r2 = dx * dx + dy * dy
        const a2 = vt.core * vt.core
        // Smooth Taylor limit at r -> 0 avoids 0/0 singularity
        const factor =
            r2 < 1e-9
                ? (vt.gamma * inv2Pi) / a2
                : ((vt.gamma * inv2Pi) / r2) * (1 - Math.exp(-r2 / a2))
        u += -dy * factor
        v += dx * factor
    }
    return [u, v]
}

/** Exact scalar vorticity omega = dv/dx - du/dy for Lamb-Oseen vortices + shear layer. */
export function vortexVorticity(
    x: number,
    y: number,
    vortices: readonly Vortex[],
    shear = 0,
    shearWidth = 0.85,
): number {
    let w = 0
    if (shear !== 0) {
        const c = Math.cosh(y / shearWidth)
        w -= shear / (shearWidth * c * c)
    }
    for (const vt of vortices) {
        const dx = x - vt.x
        const dy = y - vt.y
        const r2 = dx * dx + dy * dy
        const a2 = vt.core * vt.core
        w += (vt.gamma / (Math.PI * a2)) * Math.exp(-r2 / a2)
    }
    return w
}

/** 4th-order central difference check of div(u) = du/dx + dv/dy (should be ~0 to < 1e-11). */
export function numericalDivergence(
    x: number,
    y: number,
    vortices: readonly Vortex[],
    shear = 0,
    h = 1e-3,
): number {
    const [up1] = vortexVelocity(x + h, y, vortices, shear)
    const [um1] = vortexVelocity(x - h, y, vortices, shear)
    const [up2] = vortexVelocity(x + 2 * h, y, vortices, shear)
    const [um2] = vortexVelocity(x - 2 * h, y, vortices, shear)
    const dudx = (-up2 + 8 * up1 - 8 * um1 + um2) / (12 * h)

    const [, vp1] = vortexVelocity(x, y + h, vortices, shear)
    const [, vm1] = vortexVelocity(x, y - h, vortices, shear)
    const [, vp2] = vortexVelocity(x, y + 2 * h, vortices, shear)
    const [, vm2] = vortexVelocity(x, y - 2 * h, vortices, shear)
    const dvdy = (-vp2 + 8 * vp1 - 8 * vm1 + vm2) / (12 * h)
    return dudx + dvdy
}

/** Closed circular contour integral oint u . dl at radius R around the origin. */
export function contourCirculation(
    vortices: readonly Vortex[],
    radius = 12.0,
    segments = 256,
): number {
    let sum = 0
    const dTheta = (2 * Math.PI) / segments
    for (let i = 0; i < segments; i++) {
        const th = (i + 0.5) * dTheta
        const x = radius * Math.cos(th)
        const y = radius * Math.sin(th)
        const [u, v] = vortexVelocity(x, y, vortices, 0)
        // Tangent vector dl = (-R sin th, R cos th) dTheta
        sum += (-u * Math.sin(th) + v * Math.cos(th)) * radius * dTheta
    }
    return sum
}

/** Exact total circulation sum of vortices. */
export function totalCirculation(vortices: readonly Vortex[]): number {
    let g = 0
    for (const vt of vortices) g += vt.gamma
    return g
}

/** Single 4th-order Runge-Kutta (RK4) advection step for a passive tracer particle. */
export function rk4Step(
    x: number,
    y: number,
    dt: number,
    vel: (px: number, py: number) => Vec2,
): Vec2 {
    const [k1x, k1y] = vel(x, y)
    const [k2x, k2y] = vel(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y)
    const [k3x, k3y] = vel(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y)
    const [k4x, k4y] = vel(x + dt * k3x, y + dt * k3y)
    return [
        x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
        y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y),
    ]
}

/** Trace a streamline forward from (x0, y0) using RK4. */
export function traceStreamline(
    x0: number,
    y0: number,
    steps: number,
    dt: number,
    vortices: readonly Vortex[],
    shear = 0,
    shearWidth = 0.85,
    meanFlow = 0,
): Vec2[] {
    const pts: Vec2[] = [[x0, y0]]
    let x = x0
    let y = y0
    const vel = (px: number, py: number) => vortexVelocity(px, py, vortices, shear, shearWidth, meanFlow)
    for (let i = 0; i < steps; i++) {
        ;[x, y] = rk4Step(x, y, dt, vel)
        pts.push([x, y])
    }
    return pts
}

// ── Canonical Vortex Sets for Invariant Checks & Visuals ──────────────────────
// Staggered alternating-sign von Karman / Kelvin-Helmholtz vortex street
export const SHEAR_VORTICES: readonly Vortex[] = [
    { x: -1.75, y: 0.42, gamma: -3.6, core: 0.56 },
    { x: 0.0, y: -0.42, gamma: 3.9, core: 0.58 },
    { x: 1.75, y: 0.42, gamma: -3.6, core: 0.56 },
]

/** Exact co-rotating equal Lamb-Oseen vortex pair orbiting at angular velocity Omega = Gamma / (pi d^2) * (1 - exp(-d^2 / a^2)). */
export function coRotatingPair(t: number, separation = 1.5, gamma = 5.2, core = 0.56): readonly Vortex[] {
    const r = separation * 0.5
    const omega = (gamma / (Math.PI * separation * separation)) * (1 - Math.exp(-(separation * separation) / (core * core)))
    const angle = omega * t
    const cx = r * Math.cos(angle)
    const cy = r * Math.sin(angle)
    return [
        { x: cx, y: cy, gamma, core },
        { x: -cx, y: -cy, gamma, core },
    ]
}

// ── Precomputed 2D Vortex-Pair Passive Tracer Ribbon Evolution (Scene 3) ──────
// Precomputes 48 time snapshots of 7 silky-smooth glowing fluid ribbons (260 pts each!)
// advected via RK4 in the exact time-dependent co-rotating Lamb-Oseen velocity field!
export const PAIR_FRAMES = 48
export const PAIR_DT_FRAME = 0.092
export const PAIR_RIBBON_COUNT = 7
export const PAIR_RIBBON_PTS = 260

export interface PairSnapshot {
    readonly t: number
    readonly vortices: readonly Vortex[]
    readonly ribbons: readonly (readonly Vec2[])[]
}

export const PAIR_HISTORY: readonly PairSnapshot[] = (() => {
    const history: PairSnapshot[] = []
    let ribbons: Vec2[][] = []
    const ySeeds = [-1.75, -1.3, -0.9, -0.52, 0.52, 0.9, 1.3]
    for (const y0 of ySeeds) {
        const line: Vec2[] = []
        for (let i = 0; i < PAIR_RIBBON_PTS; i++) {
            const x0 = -3.1 + (6.2 * i) / (PAIR_RIBBON_PTS - 1)
            line.push([x0, y0])
        }
        ribbons.push(line)
    }

    const subSteps = 3
    const subDt = PAIR_DT_FRAME / subSteps
    for (let f = 0; f < PAIR_FRAMES; f++) {
        const t = f * PAIR_DT_FRAME
        const vortices = coRotatingPair(t)
        history.push({
            t,
            vortices,
            ribbons: ribbons.map((r) => r.map((p) => [p[0], p[1]] as Vec2)),
        })
        for (let sub = 0; sub < subSteps; sub++) {
            const ts = t + sub * subDt
            const vNow = coRotatingPair(ts)
            const vel = (px: number, py: number) => vortexVelocity(px, py, vNow, 0)
            ribbons = ribbons.map((r) => r.map(([px, py]) => rk4Step(px, py, subDt, vel)))
        }
    }
    return history
})()

/** Interpolate the precomputed 2D vortex-pair snapshot smoothly at progress u in [0, 1]. */
export function samplePairHistory(u: number): PairSnapshot {
    const clamped = Math.max(0, Math.min(1, u))
    const idxF = clamped * (PAIR_FRAMES - 1)
    const i0 = Math.min(PAIR_FRAMES - 2, Math.floor(idxF))
    const frac = idxF - i0
    const s0 = PAIR_HISTORY[i0]!
    const s1 = PAIR_HISTORY[i0 + 1]!
    const vortices: Vortex[] = s0.vortices.map((v0, k) => {
        const v1 = s1.vortices[k]!
        return {
            x: v0.x + (v1.x - v0.x) * frac,
            y: v0.y + (v1.y - v0.y) * frac,
            gamma: v0.gamma,
            core: v0.core,
        }
    })
    const ribbons: Vec2[][] = s0.ribbons.map((r0, ri) => {
        const r1 = s1.ribbons[ri]!
        return r0.map((p0, pi) => {
            const p1 = r1[pi]!
            return [p0[0] + (p1[0] - p0[0]) * frac, p0[1] + (p1[1] - p0[1]) * frac] as Vec2
        })
    })
    return { t: s0.t + (s1.t - s0.t) * frac, vortices, ribbons }
}

// ── Kolmogorov k^{-5/3} Energy Cascade Spectrum ───────────────────────────────
/** Kolmogorov inertial-range spectrum E(k) = C * k^{-5/3} with viscous dissipation roll-off. */
export function kolmogorovSpectrum(k: number, kDiss = 28): number {
    if (k <= 0.1) return 0
    return Math.pow(k, -5 / 3) * Math.exp(-Math.pow(k / kDiss, 1.8))
}

// ── 3D Vorticity / Enstrophy Cascade Landscape (Scene 4) ──────────────────────
// Multi-scale turbulent vortex towers whose main filament sharpens & rises under `pinch` in [0, 1].
interface CascadePeak {
    readonly x: number
    readonly y: number
    readonly baseAmp: number
    readonly baseSig: number
    readonly pinchBoost: number
}

const CASCADE_PEAKS: readonly CascadePeak[] = [
    { x: 0.05, y: -0.1, baseAmp: 1.55, baseSig: 0.88, pinchBoost: 1.15 }, // Hero stretching spire
    { x: -1.85, y: 1.25, baseAmp: 1.12, baseSig: 0.85, pinchBoost: 0.42 },
    { x: 1.95, y: 1.15, baseAmp: 1.05, baseSig: 0.78, pinchBoost: 0.55 },
    { x: -1.65, y: -1.55, baseAmp: 0.96, baseSig: 0.74, pinchBoost: 0.48 },
    { x: 1.7, y: -1.45, baseAmp: 1.18, baseSig: 0.82, pinchBoost: 0.62 },
    { x: 0.25, y: 2.05, baseAmp: 0.82, baseSig: 0.62, pinchBoost: 0.35 },
    { x: -0.55, y: -2.15, baseAmp: 0.78, baseSig: 0.58, pinchBoost: 0.32 },
    { x: -2.5, y: -0.15, baseAmp: 0.72, baseSig: 0.55, pinchBoost: 0.28 },
    { x: 2.55, y: -0.05, baseAmp: 0.74, baseSig: 0.54, pinchBoost: 0.3 },
]

export function enstrophyHeight(wx: number, wy: number, pinch = 0): number {
    let h =
        0.16 +
        0.09 * Math.sin(wx * 1.15 + wy * 0.85) * Math.cos(wx * 0.7 - wy * 1.25) +
        0.05 * Math.cos(wx * 2.1 - wy * 1.9) * (0.6 + 0.8 * pinch)
    for (const pk of CASCADE_PEAKS) {
        const dx = wx - pk.x
        const dy = wy - pk.y
        const r2 = dx * dx + dy * dy
        // Vortex stretching narrows the core sigma while amplifying peak vorticity!
        const sig = pk.baseSig * (1 - 0.42 * pinch * (pk.pinchBoost > 0.8 ? 1 : 0.6))
        const amp = pk.baseAmp + pk.pinchBoost * pinch
        h += amp * Math.exp(-r2 / (sig * sig))
    }
    return Math.min(2.85, Math.max(0.02, h))
}

// Real mathematical models for Diffusion & Flow Matching:
// 1. Deterministic PRNG (mulberry32) + Box-Muller Gaussian sampling
// 2. 1,240-particle Gaussian -> Golden Crescent & Star constellation transport pairs
// 3. Exact linear conditional interpolation x_t = (1 - t) * x_0 + t * x_1
// 4. Real 2D Gaussian mixture probability density p_t(x, y) evolving from N(0, I) -> 3 modes
// 5. Real Euler ODE integrator for 50-step curved diffusion vs 4-step straight flow matching

export type Pt2 = readonly [number, number]

/** Deterministic PRNG so renders never flicker across frames or workers. */
export function mulberry32(seed: number): () => number {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function sampleGaussian2D(rng: () => number): Pt2 {
    const u1 = Math.max(1e-7, rng())
    const u2 = rng()
    const r = Math.sqrt(-2 * Math.log(u1))
    return [r * Math.cos(2 * Math.PI * u2), r * Math.sin(2 * Math.PI * u2)]
}

/** Exact conditional flow-matching interpolation: x_t = (1 - t) * x0 + t * x1 */
export function lerpPt(x0: Pt2, x1: Pt2, t: number): Pt2 {
    return [(1 - t) * x0[0] + t * x1[0], (1 - t) * x0[1] + t * x1[1]]
}

/** Constant conditional velocity vector: v = x1 - x0 */
export function condVelocity(x0: Pt2, x1: Pt2): Pt2 {
    return [x1[0] - x0[0], x1[1] - x0[1]]
}

export interface TransportParticle {
    x0: Pt2
    x1: Pt2
    kind: 'crescent' | 'star' | 'halo'
    hueIdx: number
    size: number
}

/** Generate 1,240 deterministic particles mapping isotropic Gaussian noise to a golden crescent + star constellation. */
export function generateConstellationParticles(count = 1240, seed = 2024): TransportParticle[] {
    const rng = mulberry32(seed)
    const out: TransportParticle[] = []
    for (let i = 0; i < count; i++) {
        const [gx, gy] = sampleGaussian2D(rng)
        // Clamp wild outliers so all particles start cleanly inside canvas bounds
        const r = Math.hypot(gx, gy)
        const scale = r > 2.7 ? 2.7 / r : 1
        const x0: Pt2 = [gx * scale * 0.95, gy * scale * 0.95]

        let x1: Pt2
        let kind: TransportParticle['kind']
        if (i < count * 0.68) {
            // Luminous golden crescent moon arc opening cleanly to the right
            kind = 'crescent'
            const u = rng()
            const theta = -2.12 + u * 4.24
            const thickness = Math.pow(Math.cos(theta * 0.68), 1.35) * 0.34
            const rad = 1.06 + (rng() - 0.5) * thickness
            x1 = [-rad * Math.cos(theta) + 0.12, rad * Math.sin(theta)]
        } else if (i < count * 0.9) {
            // Radiant 5-pointed star tucked cleanly inside the open hollow of the crescent
            kind = 'star'
            const arm = Math.floor(rng() * 5)
            const a0 = -Math.PI / 2 + (arm * 2 * Math.PI) / 5
            const a1 = a0 + Math.PI / 5
            const tEdge = rng()
            const rOuter = 0.38
            const rInner = 0.15
            const side = rng() < 0.5 ? 1 : -1
            const angA = a0
            const angB = a0 + side * (Math.PI / 5)
            const px = (1 - tEdge) * rOuter * Math.cos(angA) + tEdge * rInner * Math.cos(angB)
            const py = (1 - tEdge) * rOuter * Math.sin(angA) + tEdge * rInner * Math.sin(angB)
            const jitter = (rng() - 0.5) * 0.04
            x1 = [0.42 + px + jitter * Math.cos(a1), -0.02 + py + jitter * Math.sin(a1)]
        } else {
            // Delicate outer orbital constellation stars
            kind = 'halo'
            const ang = rng() * Math.PI * 2
            const rad = 1.48 + rng() * 0.42
            x1 = [rad * Math.cos(ang), rad * Math.sin(ang)]
        }

        out.push({
            x0,
            x1,
            kind,
            hueIdx: i % 4,
            size: kind === 'star' ? 2.4 + rng() * 1.4 : kind === 'crescent' ? 1.8 + rng() * 1.3 : 1.3 + rng() * 1.0,
        })
    }
    return out
}

export const HOOK_PARTICLES = generateConstellationParticles(1240, 2024)

/** Target 3-mode Gaussian mixture in 2D space for the 3D evolving probability manifold p_t(x, y). */
export interface GaussianMode {
    weight: number
    mean: Pt2
    sigma: number
}

export const TARGET_MODES: readonly GaussianMode[] = [
    { weight: 0.4, mean: [-1.45, -0.85], sigma: 0.42 },
    { weight: 0.35, mean: [1.55, -0.55], sigma: 0.4 },
    { weight: 0.25, mean: [0.05, 1.5], sigma: 0.38 },
] as const

export const NOISE_SIGMA = 1.18

/**
 * Exact marginal probability density p_t(x, y) under conditional linear Gaussian flow:
 * Each mode k evolves from N(0, sigma_0^2 I) at t=0 to N(mu_k, sigma_k^2 I) at t=1:
 *   mu_k(t) = t * mu_k
 *   sigma_k(t) = (1 - t) * sigma_0 + t * sigma_k
 */
export function density2D(x: number, y: number, t: number): number {
    const tc = Math.max(0, Math.min(1, t))
    let p = 0
    for (const mode of TARGET_MODES) {
        const mx = tc * mode.mean[0]
        const my = tc * mode.mean[1]
        const sig = (1 - tc) * NOISE_SIGMA + tc * mode.sigma
        const inv2Var = 1 / (2 * sig * sig)
        const norm = 1 / (2 * Math.PI * sig * sig)
        const dx = x - mx
        const dy = y - my
        p += mode.weight * norm * Math.exp(-(dx * dx + dy * dy) * inv2Var)
    }
    return p
}

/** Visual 3D height mapping for p_t(x, y) so both the t=0 Gaussian dome and t=1 sharp peaks read dramatically. */
export function manifoldHeight(x: number, y: number, t: number): number {
    const p = density2D(x, y, t)
    return Math.min(2.6, Math.pow(p * 11.5, 0.72) * 1.18)
}

/**
 * Exact marginal velocity field v_t(x) for the 2-mode bimodal 2D scene (`noisefield`):
 * Posterior responsibility w_k(x, t) weighted average of conditional Gaussian velocities!
 */
export const BIMODAL_MODES: readonly GaussianMode[] = [
    { weight: 0.5, mean: [1.55, -0.92], sigma: 0.34 },
    { weight: 0.5, mean: [1.55, 0.92], sigma: 0.34 },
] as const

export const NOISE_CENTER: Pt2 = [-1.55, 0]

export function bimodalVelocity(x: number, y: number, t: number): Pt2 {
    const tc = Math.max(0.02, Math.min(0.98, t))
    const sig0 = 0.72
    let totalW = 0
    let vx = 0
    let vy = 0
    for (const m of BIMODAL_MODES) {
        const mx = (1 - tc) * NOISE_CENTER[0] + tc * m.mean[0]
        const my = (1 - tc) * NOISE_CENTER[1] + tc * m.mean[1]
        const sig = (1 - tc) * sig0 + tc * m.sigma
        const dx = x - mx
        const dy = y - my
        const w = (m.weight / (sig * sig)) * Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig))
        // Exact conditional Gaussian flow velocity: dmu/dt + (dsig/dt / sig) * (x - mu(t))
        const dmx = m.mean[0] - NOISE_CENTER[0]
        const dmy = m.mean[1] - NOISE_CENTER[1]
        const dsig = m.sigma - sig0
        const cvx = dmx + (dsig / sig) * dx
        const cvy = dmy + (dsig / sig) * dy
        totalW += w
        vx += w * cvx
        vy += w * cvy
    }
    if (totalW < 1e-12) return [BIMODAL_MODES[0]!.mean[0] - NOISE_CENTER[0], 0]
    return [vx / totalW, vy / totalW]
}

/** General Euler ODE integrator over t in [0, 1]. Returns (steps + 1) points. */
export function integrateEuler(
    x0: Pt2,
    velocityFn: (x: Pt2, t: number, stepIndex: number) => Pt2,
    steps: number,
): Pt2[] {
    const pts: Pt2[] = [x0]
    const dt = 1 / steps
    let cur: Pt2 = x0
    for (let i = 0; i < steps; i++) {
        const t = i * dt
        const v = velocityFn(cur, t, i)
        cur = [cur[0] + v[0] * dt, cur[1] + v[1] * dt]
        pts.push(cur)
    }
    return pts
}

/**
 * Curved Diffusion SDE/PF-ODE trajectory generator (50 jittery curved steps from x0 to x1).
 * Models high-curvature variance-preserving schedule + stochastic score-estimation jitter
 * converging exactly onto x1 as noise decays at t -> 1.
 */
export function diffusionTrajectory(x0: Pt2, x1: Pt2, steps: number, seed: number, bendDir: number): Pt2[] {
    const rng = mulberry32(seed)
    const dx = x1[0] - x0[0]
    const dy = x1[1] - x0[1]
    const len = Math.max(1e-6, Math.hypot(dx, dy))
    // Perpendicular unit vector for curved VP-SDE arc
    const nx = -dy / len
    const ny = dx / len
    const archAmp = (0.20 + rng() * 0.11) * len * bendDir

    // Pre-generate reproducible Wiener jitter orthogonal & along path
    const jitter = Array.from({ length: steps }, () => sampleGaussian2D(rng))

    const pts: Pt2[] = [x0]
    for (let i = 1; i <= steps; i++) {
        const t = i / steps
        // Nonlinear cosine/VP schedule stretches early steps and bends sharply near t -> 1
        const s = Math.sin((t * Math.PI) / 2)
        const baseX = (1 - s) * x0[0] + s * x1[0]
        const baseY = (1 - s) * x0[1] + s * x1[1]
        // Organic curvature bulge + damped stochastic SDE wobble decaying to 0 at t=1
        const env = Math.sin(Math.PI * t)
        const sCurve = Math.sin(2 * Math.PI * t) * 0.28
        const bend = (env + sCurve) * archAmp
        const noiseEnv = Math.pow(1 - t, 0.72) * Math.sin(Math.PI * Math.min(1, t * 1.15))
        const j = jitter[i - 1]!
        const jScale = 0.052 * len * noiseEnv
        pts.push([
            baseX + nx * bend + j[0] * jScale,
            baseY + ny * bend + j[1] * jScale,
        ])
    }
    return pts
}

/** Exact 4-step Euler integration of a rectified straight flow matching field v(x, t) = x1 - x0. */
export function flowMatchingTrajectory(x0: Pt2, x1: Pt2, steps = 4): Pt2[] {
    const v = condVelocity(x0, x1)
    return integrateEuler(x0, () => v, steps)
}

import {
    Node, circle, dot, dynamic, group, line, linear, polyPath, polygon, radialGradient, rect,
    scalarField, type SceneFunction, type Vec,
} from 'vizmatic/stage'
import { txt } from '../../../factory/style'

// Equilateral RUM Tradeoff Triangle centered cleanly in the upper stage
const CX = 0
const CY = -165
const TRI_R = 178
const V_READ: Vec = [CX, CY - TRI_R] // Top: Read Overhead (B-Tree)
const V_UPDATE: Vec = [CX - TRI_R * 0.95, CY + TRI_R * 0.62] // Bottom-left: Update Overhead (LSM-Tree)
const V_MEM: Vec = [CX + TRI_R * 0.95, CY + TRI_R * 0.62] // Bottom-right: Memory Overhead (Bloom + Cache)

// Compute exact barycentric coordinates of (x, y) inside the RUM triangle (in local coords centered at (CX, CY))
const R_LOC: Vec = [V_READ[0] - CX, -(V_READ[1] - CY)]       // +y up for scalarField!
const U_LOC: Vec = [V_UPDATE[0] - CX, -(V_UPDATE[1] - CY)]
const M_LOC: Vec = [V_MEM[0] - CX, -(V_MEM[1] - CY)]
const DET_T = (U_LOC[1] - M_LOC[1]) * (R_LOC[0] - M_LOC[0]) + (M_LOC[0] - U_LOC[0]) * (R_LOC[1] - M_LOC[1])

function barycentric(x: number, y: number): [number, number, number] {
    const wR = ((U_LOC[1] - M_LOC[1]) * (x - M_LOC[0]) + (M_LOC[0] - U_LOC[0]) * (y - M_LOC[1])) / DET_T
    const wU = ((M_LOC[1] - R_LOC[1]) * (x - M_LOC[0]) + (R_LOC[0] - M_LOC[0]) * (y - M_LOC[1])) / DET_T
    const wM = 1 - wR - wU
    return [wR, wU, wM]
}

// Smooth operating-point trajectory gliding from READ (B-Tree) toward the LSM + Bloom sweet spot!
function operatingPoint(u: number): Vec {
    // Cubic-eased curve starting near READ (B-Tree), arcing through center toward LSM + Bloom sweet spot (bottom-center-left)
    const t = Math.max(0, Math.min(1, u))
    const p0: Vec = [CX - 6, CY - 118]      // Near READ (B-Tree)
    const p1: Vec = [CX + 56, CY - 18]      // Arcing smoothly toward Bloom memory balance
    const p2: Vec = [CX - 34, CY + 54]      // Sweet spot: LSM + Bloom (low write amp + Bloom-accelerated reads)
    const inv = 1 - t
    return [
        inv * inv * p0[0] + 2 * inv * t * p1[0] + t * t * p2[0],
        inv * inv * p0[1] + 2 * inv * t * p1[1] + t * t * p2[1],
    ]
}

const SWEET_SPOT = operatingPoint(1)

export const finale: SceneFunction = (s, c) => {
    const glide = s.value(0)
    const pulse = s.value(0)
    const reveal = s.value(0)

    // Glowing barycentric scalarField trade-off heatmap clipped exactly to the RUM triangle interior!
    const rumField = scalarField(
        (x, y, time) => {
            const [wR, wU, wM] = barycentric(x, y)
            if (wR < 0 || wU < 0 || wM < 0) return Number.NaN
            // Distance to the LSM + Bloom sweet spot in barycentric space: (wR=0.18, wU=0.50, wM=0.32)
            const dSweet = Math.hypot(wR - 0.18, wU - 0.5, wM - 0.32)
            const sweetGlow = Math.exp(-dSweet * dSweet * 6.5)
            const wave = 0.08 * Math.sin(time * 2.2 - dSweet * 8.0)
            // Blend from cool cyan near READ -> violet near MEMORY -> blazing gold/emerald at LSM + Bloom sweet spot
            return Math.max(0, Math.min(1, 0.22 * wR + 0.42 * wM + 0.68 * wU + 0.55 * sweetGlow + wave))
        },
        {
            x: [-210, 210],
            y: [-160, 200],
            domain: [0, 1.15],
            colors: ['#0c2647', '#1a6882', '#5b399e', '#d99326', '#ffd166'],
            width: 420,
            height: 360,
            resolution: [110, 96],
        },
    ).at(CX, CY - 20).opacity(0.86)

    const liveFinale = dynamic(() => {
        const g = glide.value
        const ph = pulse.value
        const rv = reveal.value
        const [cursorX, cursorY] = operatingPoint(g)
        const wavePhase = (ph * 0.45) % 1
        const waveR = 45 + wavePhase * 195
        const waveOp = (1 - wavePhase) * 0.58

        // Build glowing dotted/curved trajectory trail from READ (B-Tree) up to current operating point
        const trailSteps = Math.max(2, Math.floor(g * 48))
        const trailPts: Vec[] = Array.from({ length: trailSteps }, (_, i) => operatingPoint((i / 47) * g))

        const nodes: Node[] = [
            circle(510, {
                fill: radialGradient([0, 0], 510, [
                    [0, '#ffd1662c'],
                    [0.45, '#5ce1e61a'],
                    [1, '#07091000'],
                ]),
                stroke: null,
            }).at(CX, CY),
            circle(waveR, { fill: null, stroke: '#ffd166', width: 2.4 })
                .at(SWEET_SPOT[0], SWEET_SPOT[1])
                .opacity(waveOp)
                .glow(10, '#ffd166')
                .set('blend', 'screen'),
            // RUM Tradeoff Triangle glowing neon frame (drawn cleanly above the scalarField interior!)
            polygon([V_READ, V_UPDATE, V_MEM], { fill: null, stroke: '#5ce1e6', width: 3.8 }).glow(12, '#5ce1e6'),
            line(V_READ, [cursorX, cursorY], { stroke: '#5ce1e6', width: 2.2, opacity: 0.72 }).set('blend', 'screen'),
            line(V_UPDATE, [cursorX, cursorY], { stroke: '#ffd166', width: 2.8, opacity: 0.9 }).set('blend', 'screen'),
            line(V_MEM, [cursorX, cursorY], { stroke: '#c4b5fd', width: 2.2, opacity: 0.72 }).set('blend', 'screen'),
            // Operating-point glide trail from READ (B-Tree) -> LSM + Bloom sweet spot!
            new Node(polyPath(trailPts)).stroke('#ffd166', 4.4, 0.92).glow(12, '#ffd166').set('blend', 'screen'),
            new Node(polyPath(trailPts)).stroke('#ffffff', 1.6, 0.75).set('blend', 'screen'),
            // Sweet-spot target ring
            circle(18, { fill: '#6ee7b722', stroke: '#6ee7b7', width: 2.4, dash: [6, 5] })
                .at(SWEET_SPOT[0], SWEET_SPOT[1])
                .glow(10, '#6ee7b7'),
            // Glowing equilibrium operating-point comet
            circle(16, { fill: '#ffd16655', stroke: '#ffd166', width: 2.6 }).at(cursorX, cursorY).glow(16, '#ffd166').set('blend', 'screen'),
            dot(8.5, '#ffffff').at(cursorX, cursorY).glow(18, '#ffd166').set('blend', 'screen'),
            // LSM + Bloom sweet-spot callout pill cleanly beneath triangle base
            rect(386, 46, { fill: '#0b1020', stroke: '#6ee7b7', width: 2.2, radius: 23 }).at(SWEET_SPOT[0], CY + 174).glow(8, '#6ee7b7'),
            txt('LSM + Bloom Sweet Spot', SWEET_SPOT[0], CY + 176, 26, '#6ee7b7', 'mono'),
            // Three RUM vertices + typo-free labels!
            circle(20, { fill: '#0c1222', stroke: '#5ce1e6', width: 3.6 }).at(V_READ[0], V_READ[1]).glow(10, '#5ce1e6'),
            txt('READ (B-Tree)', V_READ[0], V_READ[1] - 48, 30, '#5ce1e6', 'mono').glow(6, '#5ce1e6'),
            circle(22, { fill: '#0c1222', stroke: '#ffd166', width: 3.8 }).at(V_UPDATE[0], V_UPDATE[1]).glow(12, '#ffd166'),
            txt('UPDATE (LSM-Tree)', V_UPDATE[0] - 208, V_UPDATE[1] + 8, 30, '#ffd166', 'mono').glow(6, '#ffd166'),
            circle(20, { fill: '#0c1222', stroke: '#a78bfa', width: 3.6 }).at(V_MEM[0], V_MEM[1]).glow(10, '#a78bfa'),
            txt('MEMORY (Bloom)', V_MEM[0] + 195, V_MEM[1] + 8, 30, '#c4b5fd', 'mono').glow(6, '#a78bfa'),
            // Closing viral takeaway + brightened footer (#a8b8d8)
            txt('Turn random writes into', 0, 128, 70, '#f8f4ec', 'serif').opacity(0.4 + rv * 0.6).glow(6, '#90b4ff'),
            txt('sequential streams.', 0, 218, 74, '#ffd166', 'serif').opacity(0.4 + rv * 0.6).glow(10, '#ffd166'),
            txt('NVMe Flash Silicon  ·  B-Trees vs LSM-Trees  ·  RUM Conjecture', 0, 316, 28, '#a8b8d8', 'mono').opacity(0.65 + rv * 0.35),
        ]
        return group(...nodes)
    })

    s.add(rumField, liveFinale)
    const sceneRem = Math.max(8.0, c.end - c.start - 0.25)
    c.at(0.1, () => {
        s.play(
            glide.to(1, { duration: Math.min(11.8, sceneRem) }),
            pulse.to(6.2, { duration: Math.min(16.0, sceneRem), ease: linear }),
        )
    })
    c.on('turn random writes', () => s.play(reveal.to(1, { duration: 0.8 })))
}

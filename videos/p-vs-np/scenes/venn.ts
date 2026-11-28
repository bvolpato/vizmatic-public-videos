import { Node, circle, dot, group, linearGradient, polyPath, type Vec } from 'vizmatic/stage'
import { COSMOS, txt } from '../../../factory/style'

// Exact analytical geometry for the classic P / NP / NP-Complete / NP-Hard Venn diagram.
// Zero low-alpha radialGradient discs: pure smooth vector curves + clean translucent glass fills
// let Vizmatic's floating-point dithered bloom render silky halos with zero 8-bit banding.

const CX = 370
const CY_NP = 148
const R_NP = 248

// Upward-opening NP-Hard parabola: y(dx) = Y_VERTEX - K * dx^2 (SVG y increases downward)
const Y_VERTEX = 88
const PARABOLA_HALF_W = 342
const Y_TOP = -428
const K_PARABOLA = (Y_VERTEX - Y_TOP) / (PARABOLA_HALF_W * PARABOLA_HALF_W)

// Solve exact intersection of parabola y = Y_VERTEX - K*u with NP circle u + (y - CY_NP)^2 = R_NP^2, u = dx^2
const DY_V = CY_NP - Y_VERTEX // 60
const QA = K_PARABOLA * K_PARABOLA
const QB = 1 + 2 * DY_V * K_PARABOLA
const QC = DY_V * DY_V - R_NP * R_NP
const U_INT = (-QB + Math.sqrt(QB * QB - 4 * QA * QC)) / (2 * QA)
const DX_INT = Math.sqrt(U_INT)

function parabolaPoint(dx: number): Vec {
    return [CX + dx, Y_VERTEX - K_PARABOLA * dx * dx]
}

// Smooth high-sample NP-Hard open U-bowl stroke (160 samples -> silky curve)
const NP_HARD_CURVE: Vec[] = Array.from({ length: 161 }, (_, i) => {
    const dx = -PARABOLA_HALF_W + (i / 160) * (PARABOLA_HALF_W * 2)
    return parabolaPoint(dx)
})

// Closed polygon for NP-Hard translucent glass fill (closes straight across top edge at Y_TOP)
const NP_HARD_FILL: Vec[] = [...NP_HARD_CURVE, [CX + PARABOLA_HALF_W, Y_TOP], [CX - PARABOLA_HALF_W, Y_TOP]]

// Exact NP-Complete intersection lens: upper arc of NP circle from -DX_INT..+DX_INT + parabola back from +DX_INT..-DX_INT
const NP_COMPLETE_LENS: Vec[] = [
    ...Array.from({ length: 81 }, (_, i): Vec => {
        const dx = -DX_INT + (i / 80) * (DX_INT * 2)
        const dy = Math.sqrt(Math.max(0, R_NP * R_NP - dx * dx))
        return [CX + dx, CY_NP - dy]
    }),
    ...Array.from({ length: 81 }, (_, i): Vec => {
        const dx = DX_INT - (i / 80) * (DX_INT * 2)
        return parabolaPoint(dx)
    }),
]

// High-sample smooth nested P oval at the bottom of NP (140 samples)
const CY_P = 274
const RX_P = 148
const RY_P = 92
function pOvalPoints(scale = 1): Vec[] {
    return Array.from({ length: 141 }, (_, i): Vec => {
        const a = (i / 140) * Math.PI * 2
        return [CX + Math.cos(a) * RX_P * scale, CY_P + Math.sin(a) * RY_P * scale]
    })
}
const P_OVAL_BASE = pOvalPoints(1)

/** Static editorial title + complexity legend on the left half (clean smooth typography, zero harsh outline halo). */
export function vennTitleGroup(subtitle: string): Node {
    return group(
        txt('$1,000,000  MILLENNIUM PROBLEM', -815, -242, 26, COSMOS.gold, 'mono', 'left'),
        txt('P vs NP', -820, -110, 146, COSMOS.ink, 'serif', 'left'),
        txt(subtitle, -815, 22, 42, COSMOS.gold, 'serif', 'left'),
        dot(7, COSMOS.cyan).at(-800, 144).glow(8, COSMOS.cyan),
        txt('P :  fast to solve and check', -772, 144, 29, COSMOS.ink, 'sans', 'left'),
        dot(7, COSMOS.rose).at(-800, 206).glow(8, COSMOS.rose),
        txt('NP :  fast to check, search may explode', -772, 206, 29, COSMOS.ink, 'sans', 'left'),
        dot(7, COSMOS.gold).at(-800, 268).glow(8, COSMOS.gold),
        txt('NP-Complete :  hardest puzzles in NP', -772, 268, 29, COSMOS.muted, 'sans', 'left'),
    )
}

/** Animated glowing Complexity Classes Venn diagram on the right half (`p` in [0..1] drives smooth breathing & photons). */
export function buildVennNodes(p: number, opacity = 1): Node[] {
    if (opacity < 0.02) return []
    const a = opacity
    const nodes: Node[] = []

    // 1. NP-Hard open U-bowl (soft upward fade into deep space + silky glowing parabolic curve)
    const hardFillGrad = linearGradient([CX, Y_VERTEX], [CX, Y_TOP], ['#6ee7b71a', '#6ee7b712', '#6ee7b700'])
    nodes.push(
        new Node(polyPath(NP_HARD_FILL, true)).fill(hardFillGrad, a).stroke(null),
        new Node(polyPath(NP_HARD_CURVE)).stroke(COSMOS.emerald, 3.2, 0.88 * a).glow(8, COSMOS.emerald),
        txt('NP-Hard', CX, -264, 42, COSMOS.emerald, 'sans').opacity(a),
    )

    // 2. NP lower circle (rose translucent glass + silky circular ring)
    nodes.push(
        circle(R_NP, { fill: '#ff6b8b18', stroke: COSMOS.rose, width: 3.2 })
            .at(CX, CY_NP).glow(8, COSMOS.rose).opacity(a),
        txt('NP', CX - 156, 134, 38, COSMOS.rose, 'sans').opacity(a),
    )

    // 3. Exact NP-Complete intersection lens (golden glass fill + crisp glowing lens contour)
    nodes.push(
        new Node(polyPath(NP_COMPLETE_LENS, true))
            .fill('#ffd166', 0.16 * a)
            .stroke(COSMOS.gold, 3.4, 0.96 * a)
            .glow(10, COSMOS.gold),
        txt('NP-Complete', CX, -14, 34, COSMOS.gold, 'sans').opacity(a),
    )

    // 4. Nested P oval with gentle smooth breathing pulse + crisp dashed cyan border (classic P != NP diagram)
    const breathe = 1 + Math.sin(p * Math.PI * 2) * 0.035
    const pulseOval = pOvalPoints(breathe)
    nodes.push(
        new Node(polyPath(P_OVAL_BASE, true)).fill('#5ce1e6', 0.16 * a).stroke(null),
        new Node(polyPath(pulseOval, true))
            .fill(null)
            .stroke(COSMOS.cyan, 2.2, 0.32 * a)
            .glow(6, COSMOS.cyan)
            .set('blend', 'screen'),
        new Node(polyPath(P_OVAL_BASE, true))
            .fill(null)
            .stroke(COSMOS.cyan, 3.2, 0.95 * a)
            .dash([10, 8])
            .glow(8, COSMOS.cyan),
        txt('P', CX, CY_P - 18, 46, COSMOS.cyan, 'sans').opacity(a),
        txt('if  P ≠ NP', CX, CY_P + 32, 26, COSMOS.muted, 'mono').opacity(a),
    )

    // 5. Silky traveling photons along NP-Hard parabola, NP circle, and P oval
    const hardIdx = Math.min(NP_HARD_CURVE.length - 1, Math.floor(((p * 1.15) % 1) * (NP_HARD_CURVE.length - 1)))
    const hardPt = NP_HARD_CURVE[hardIdx]!
    const npAng = p * Math.PI * 2 - Math.PI * 0.5
    const pAng = -p * Math.PI * 2.2
    nodes.push(
        dot(5.6, '#ffffff').at(hardPt[0], hardPt[1]).glow(12, COSMOS.emerald).opacity(a).set('blend', 'screen'),
        dot(5.6, '#ffffff')
            .at(CX + Math.cos(npAng) * R_NP, CY_NP + Math.sin(npAng) * R_NP)
            .glow(12, COSMOS.rose).opacity(a).set('blend', 'screen'),
        dot(5.2, '#ffffff')
            .at(CX + Math.cos(pAng) * RX_P, CY_P + Math.sin(pAng) * RY_P)
            .glow(12, COSMOS.cyan).opacity(a).set('blend', 'screen'),
    )

    return nodes
}

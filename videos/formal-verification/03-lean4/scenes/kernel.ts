import { Node, circle, dot, dynamic, group, linear, polyPath, regularPolygon, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

export const kernel: SceneFunction = (s, c) => {
    const phase = s.value(0)

    const liveKernel = dynamic(() => {
        const p = phase.value
        const nodes: Node[] = [
            nebula(0, -135, 440, '#a78bfa28', '#5ce1e614'),
            // Untrusted search rays converging from above into the small trusted kernel
            ...[-320, -160, 0, 160, 320].map((x, i) => {
                const prog = (p * 0.55 + i * 0.19) % 1
                const endX = x * 0.32
                const endY = -245
                const px = x + (endX - x) * prog
                const py = -355 + (endY - -355) * prog
                return group(
                    new Node(polyPath([[x, -355], [endX, endY]])).stroke('#2d3756', 1.8, 0.55),
                    dot(7, i % 2 === 0 ? COSMOS.cyan : COSMOS.gold).at(px, py).glow(10, COSMOS.cyan),
                )
            }),
            txt('Tactics · Humans · AI Search  (untrusted)', 0, -400, 26, COSMOS.muted, 'mono'),
            circle(142 + Math.sin(p) * 7, { fill: null, stroke: COSMOS.emerald, width: 2.5 }).at(0, -135).opacity(0.75).glow(8, COSMOS.emerald),
            regularPolygon(6, 112, { fill: '#111626', stroke: COSMOS.violet, width: 4.5 }).at(0, -135).glow(14, COSMOS.violet),
            txt('Lean', 0, -155, 30, COSMOS.ink, 'mono'),
            txt('Kernel', 0, -118, 28, COSMOS.violet, 'mono'),
        ]
        return group(...nodes)
    })

    const copy = group(
        txt('One small kernel. Infinite certainty.', 0, 118, 68, COSMOS.ink, 'serif').glow(6, COSMOS.violet),
        txt('Proofs for Real Systems  ·  SMT · TLA+ · Lean 4', 0, 215, 30, COSMOS.gold, 'mono'),
    )

    s.add(liveKernel, copy)
    c.at(0.1, () => s.play(phase.to(6.0, { duration: 15, ease: linear })))
}

import { circle, dot, dynamic, group, linear, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

export const fairness: SceneFunction = (s, c) => {
    const phase = s.value(0)
    const strong = s.value(0)

    const liveLoop = dynamic(() => {
        const p = phase.value
        const st = strong.value
        const col = st > 0.5 ? COSMOS.emerald : COSMOS.amber
        const R = 140
        return group(
            nebula(0, -110, 420, st > 0.5 ? '#6ee7b726' : '#fb923c22'),
            circle(R, { fill: null, stroke: col, width: 4, dash: st > 0.5 ? undefined : [14, 10] }).at(0, -110).glow(10, col),
            txt(st > 0.5 ? 'SF(Deliver)' : 'WF(Deliver)', 0, -126, 32, col, 'mono'),
            txt(st > 0.5 ? 'Eventual completion' : 'Can retry forever', 0, -82, 26, COSMOS.muted, 'sans'),
            dot(10, '#ffffff').at(Math.cos(p) * R, -110 + Math.sin(p) * R).glow(14, col),
        )
    })

    const copy = group(
        txt('Safety forbids bad states. Liveness guarantees progress.', 0, 145, 50, COSMOS.ink, 'serif').glow(5, COSMOS.gold),
        txt('Next: Episode 3 — Lean 4 & the Shape of a Proof', 0, 255, 28, COSMOS.cyan, 'mono'),
    )

    s.add(liveLoop, copy)
    c.at(0.1, () => s.play(phase.to(9.0, { duration: 15, ease: linear })))
    c.on('strong fairness', () => s.play(strong.to(1, { duration: 0.9 })))
}

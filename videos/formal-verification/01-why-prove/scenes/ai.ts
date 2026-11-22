import { circle, dot, dynamic, group, linear, regularPolygon, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

export const ai: SceneFunction = (s, c) => {
    const phase = s.value(0)

    const liveOrb = dynamic(() => {
        const p = phase.value
        return group(
            nebula(0, -135, 420, '#a78bfa28', '#5ce1e614'),
            circle(135 + Math.sin(p) * 8, { fill: null, stroke: COSMOS.cyan, width: 2.5 }).at(0, -135).opacity(0.75).glow(8, COSMOS.cyan),
            regularPolygon(6, 92, { fill: '#111626', stroke: COSMOS.violet, width: 4 }).at(0, -135).glow(12, COSMOS.violet),
            txt('Kernel', 0, -135, 32, COSMOS.ink, 'mono'),
            dot(8, COSMOS.gold).at(Math.cos(p) * 135, -135 + Math.sin(p) * 135).glow(12, COSMOS.gold),
        )
    })

    const copy = group(
        txt('The checker does not care who wrote the proof.', 0, 95, 58, COSMOS.ink, 'serif').glow(5, COSMOS.violet),
        txt('Only that every logical step holds.', 0, 182, 42, COSMOS.gold, 'serif').glow(6, COSMOS.gold),
        txt('Next: Episode 2 — TLA+ & the Five-Step Distributed Bug', 0, 290, 28, COSMOS.cyan, 'mono'),
    )

    s.add(liveOrb, copy)
    c.at(0.1, () => s.play(phase.to(6.0, { duration: 15, ease: linear })))
}

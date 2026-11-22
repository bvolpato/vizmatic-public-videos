import { group, tex, type SceneFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../../factory/style'

export const induction: SceneFunction = (s, c) => {
    const header = group(
        txt('Generalizing the Induction Hypothesis', 0, -400, 58, COSMOS.ink, 'serif').glow(5, COSMOS.gold),
        txt('Let the accumulator vary instead of pinning it to empty', 0, -328, 30, COSMOS.muted, 'sans'),
    )

    const stuck = group(
        txt('NARROW HYPOTHESIS (STUCK)', 0, -170, 26, COSMOS.rose, 'mono'),
        tex(String.raw`\operatorname{revAux}(x :: xs,\; []) = \operatorname{revAux}(xs,\; [x])`, { size: 48, color: COSMOS.rose }).at(0, -85).glow(6, COSMOS.rose),
        txt('Hypothesis expects [] — recursive call already holds [x]', 0, 15, 28, COSMOS.muted, 'sans'),
    )

    const generalized = group(
        nebula(0, 195, 420, '#6ee7b71e'),
        txt('GENERALIZED FOR ALL ACCUMULATORS (PROVED)', 0, 125, 26, COSMOS.emerald, 'mono'),
        tex(String.raw`\forall\, acc,\quad \operatorname{revAux}(xs,\; acc) = \operatorname{reverse}(xs) \mathbin{++} acc`, { size: 48, color: COSMOS.emerald }).at(0, 220).glow(8, COSMOS.emerald),
        txt('Set acc = [] at the end -> original theorem follows in one line!', 0, 330, 30, COSMOS.gold, 'serif'),
    )

    s.add(header, stuck)
    c.show('Generalize the theorem', generalized)
}

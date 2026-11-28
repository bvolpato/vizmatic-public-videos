import { dynamic, group, linear, type IntroFunction } from 'vizmatic/stage'
import { COSMOS, starfield, txt } from '../../../factory/style'
import { buildVennNodes, vennTitleGroup } from './venn'

// Standalone 1920x1080 thumbnail poster matching the opening Complexity Classes Venn Diagram
export const poster: IntroFunction = (stage, clock) => {
    const prog = stage.value(0.2)

    stage.add(
        group(...starfield(135, 31, COSMOS.cyan)),
        vennTitleGroup('Easy to check. Hard to find?'),
        dynamic(() => group(...buildVennNodes(prog.value, 1))),
        txt('What breaks, three proof walls, and the live AI fleet at pequalnp.com', -815, 396, 27, '#cbd5e8', 'sans', 'left'),
    )

    stage.at(0.02, () => stage.play(prog.to(0.6, { duration: Math.max(0.4, clock.intro - 0.08), ease: linear })))
}

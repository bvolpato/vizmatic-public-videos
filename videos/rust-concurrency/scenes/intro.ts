import { circle, dot, dynamic, group, line, regularPolygon, type IntroFunction } from 'vizmatic/stage'
import { COSMOS, nebula, txt } from '../../../factory/style'

export const intro: IntroFunction = (stage, clock) => {
    const cx = 420
    const phase = stage.value(0)
    stage.add(
        nebula(cx, 0, 520, '#fb923c26', '#5ce1e614'),
        txt('RUST  /  FEARLESS CONCURRENCY', -840, -195, 26, COSMOS.amber, 'mono', 'left'),
        txt('Rust Concurrency', -848, -68, 118, COSMOS.ink, 'serif', 'left').glow(6, COSMOS.amber),
        txt('Ownership Across Time', -844, 58, 68, COSMOS.cyan, 'serif', 'left').glow(7, COSMOS.cyan),
        txt('Threads, scopes, channels, 48-byte Futures, and Tokio', -840, 174, 32, COSMOS.muted, 'sans', 'left'),
        circle(235, { fill: null, stroke: '#29334d', width: 2, dash: [8, 10] }).at(cx, 0),
        circle(165, { fill: null, stroke: COSMOS.cyan, width: 3 }).at(cx, 0).glow(6, COSMOS.cyan),
        circle(102, { fill: '#121624', stroke: COSMOS.amber, width: 4 }).at(cx, 0).glow(8, COSMOS.amber),
        regularPolygon(6, 62, { fill: null, stroke: COSMOS.gold, width: 3 }).at(cx, 0),
        txt('Send', cx, -16, 28, COSMOS.ink, 'mono'),
        txt('Sync', cx, 20, 28, COSMOS.cyan, 'mono'),
        ...Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI * 2) / 12
            return line([cx + Math.cos(a) * 165, Math.sin(a) * 165], [cx + Math.cos(a) * 195, Math.sin(a) * 195], { stroke: COSMOS.amber, width: 5 })
        }),
        dynamic(() => {
            const a = phase.value
            return group(
                dot(10, COSMOS.amber).at(cx + Math.cos(a) * 235, Math.sin(a) * 235).glow(12, COSMOS.amber),
                dot(10, COSMOS.cyan).at(cx + Math.cos(a + 2.1) * 235, Math.sin(a + 2.1) * 235).glow(12, COSMOS.cyan),
                dot(10, COSMOS.gold).at(cx + Math.cos(a + 4.2) * 235, Math.sin(a + 4.2) * 235).glow(12, COSMOS.gold),
            )
        }),
    )
    stage.at(0.02, () => stage.play(phase.to(0.9, { duration: Math.max(0.4, clock.intro - 0.08) })))
}
